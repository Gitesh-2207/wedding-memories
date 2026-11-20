# Royal Wedding Memories - System Architecture & Technical Specifications

## 1. Architectural Overview

Royal Wedding Memories is an enterprise-grade full-stack web application designed for high-concurrency event uploads with zero guest friction and uncompromising security.

The architecture decouples the guest upload path from the administrative gallery while enforcing strict storage quota rules and protecting binary files inside private object storage.

```
                           +--------------------------------+
                           |     Wedding Guest Mobile       |
                           |  (QR Code or Direct Link)      |
                           +---------------+----------------+
                                           |
                                  Cloudflare Turnstile
                                           |
                                           v
                           +--------------------------------+
                           |  Frontend (Cloudflare Pages)   |
                           |  React + Vite + Tailwind CSS   |
                           +---------------+----------------+
                                           |
               +---------------------------+---------------------------+
               | (Public Guest APIs)                                   | (Admin Protected APIs)
               v                                                       v
+-------------------------------+                     +-------------------------------+
|  Cloudflare Worker / Express  |                     |  Node.js Express Backend API  |
|  - Storage Quota Reservation  |                     |  - JWT Authentication (bcrypt)|
|  - Magic Number Validation    |                     |  - Gallery Filtering/Paging   |
|  - Rate Limiting & Helmet     |                     |  - Authorized Streaming       |
+---------------+---------------+                     +---------------+---------------+
                |                                                     |
                +-------------------+        +------------------------+
                                    |        |
                                    v        v
                      +-----------------------------+
                      |   MongoDB Atlas M0 Cluster   |
                      |   - Wedding Configuration    |
                      |   - Admin Credentials        |
                      |   - Memory Metadata Records  |
                      |   - Atomic UploadReservation |
                      |   - Audit Logging Records    |
                      +-----------------------------+
                                    |
                                    v
                      +-----------------------------+
                      |   Cloudflare R2 Bucket      |
                      |   (100% Private Storage)    |
                      |   - Photos (max 15 MiB)     |
                      |   - Videos (max 30 MiB)     |
                      |   - 5 GiB Global Quota      |
                      +-----------------------------+
```

---

## 2. Storage Quota & Atomic Reservation Model

### Mathematical Invariants
- Total Limit: **Exactly 5 GiB** = `5,368,709,120 bytes`
- Photo Size Limits: **Configurable by Admin** (default: min `10 KiB`, max `15 MiB` = `15,728,640 bytes`)
- Video Size Limits: **Configurable by Admin** (default: min `50 KiB`, max `30 MiB` = `31,457,280 bytes`)
- Quota Formula:
  $$\text{Available Storage} = 5\,\text{GiB} - \text{Used Storage} - \text{Reserved Storage}$$
  Where:
  - $\text{Used Storage} = \sum_{\text{status}=\text{COMPLETED}} \text{Memory.fileSize}$
  - $\text{Reserved Storage} = \sum_{\substack{\text{status}=\text{PENDING} \\ \text{expiresAt} > \text{now}}} \text{UploadReservation.reservedBytes}$

### Multi-Step Atomic Upload Sequence
1. **Pre-flight Session Initiation (`POST /api/upload/session`)**:
   - Guest frontend submits array of intended files with name, mimeType, and size.
   - Cloudflare Turnstile token verified server-side.
   - Backend queries real-time used + active reserved storage.
   - If `requestedBytes > availableBytes`, request is rejected with `400 Insufficient Storage`.
   - Backend generates `UploadReservation` records with a 15-minute TTL (`expiresAt`).
2. **Binary Transfer & Deep Verification (`POST /api/upload`)**:
   - Binary buffer received in memory via Multer.
   - Size compared against reservation.
   - Magic numbers / binary signature verified via `file-type` to detect disguised executables or spoofed MIME headers.
   - Object streamed to Cloudflare R2 bucket with random UUID key.
   - `Memory` metadata record created in MongoDB with status `COMPLETED`.
   - `UploadReservation` marked `COMPLETED`.
   - Audit trail logged.
3. **Failure Rollback**:
   - If streaming fails, network drops, or magic numbers fail:
     - Reservation marked `FAILED` or deleted.
     - Partial R2 object deleted.
     - Available quota immediately recovers for other guests.

---

## 3. Security Hardening Specifications

1. **Private R2 Object Storage**:
   - Bucket has zero public access policies.
   - Media is never linked to raw R2 bucket URLs.
   - Admin gallery streams files through authorized `/api/admin/memories/:id/stream` or short-lived presigned download URLs.
2. **Bot Protection**:
   - Cloudflare Turnstile verification required before reserving quota or uploading.
3. **MIME & File Signature Inspection**:
   - Validates initial buffer bytes against canonical signatures (JPEG: `FF D8 FF`, PNG: `89 50 4E 47`, MP4: `ftyp`, WebM: `1A 45 DF A3`).
4. **Rate Limiting**:
   - `express-rate-limit` prevents brute-force login attempts (10 req/15 min) and spam sessions (40 req/15 min).
5. **Security Headers**:
   - `helmet` applies X-Content-Type-Options, Strict-Transport-Security, X-Frame-Options, and Referrer-Policy.
