# Royal Wedding Memories - REST API Specification

Base URL: `/api`

All responses follow a consistent JSON response shape:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error description message",
  "details": [ ... ]
}
```

---

## 1. Public Guest Endpoints

### 1.1 Get Wedding Details
- **Route**: `GET /api/upload/wedding/:slug`
- **Description**: Fetches public couple details, wedding date, and upload status.
- **Parameters**: `slug` (string, path parameter, e.g. `aadhya-kabir`)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "wedding": {
      "brideName": "Aadhya",
      "groomName": "Kabir",
      "weddingDate": "2026-12-18T18:00:00.000Z",
      "uploadSlug": "aadhya-kabir",
      "uploadEnabled": true,
      "welcomeMessage": "Welcome to our royal wedding celebration!"
    }
  }
  ```

### 1.2 Create Upload Session & Reserve Quota
- **Route**: `POST /api/upload/session`
- **Rate Limit**: 40 requests per 15 minutes per IP
- **Description**: Atomically checks remaining storage quota (out of 5 GiB limit) and reserves capacity with a 15-minute lock.
- **Request Body**:
  ```json
  {
    "slug": "aadhya-kabir",
    "turnstileToken": "0x4AAAAAA...",
    "files": [
      {
        "originalName": "family_photo.jpg",
        "mimeType": "image/jpeg",
        "size": 4194304
      }
    ]
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "wedding": {
      "brideName": "Aadhya",
      "groomName": "Kabir",
      "uploadSlug": "aadhya-kabir"
    },
    "reservations": [
      {
        "reservationId": "65b82...",
        "objectKey": "wedding-65b.../photos/9b1deb4d...jpg",
        "reservedBytes": 4194304,
        "expiresAt": "2026-11-19T07:15:00.000Z",
        "fileType": "photo",
        "originalName": "family_photo.jpg"
      }
    ],
    "expiresAt": "2026-11-19T07:15:00.000Z"
  }
  ```

### 1.3 Upload Memory File
- **Route**: `POST /api/upload`
- **Content-Type**: `multipart/form-data`
- **Rate Limit**: 80 uploads per 15 minutes per IP
- **Form Fields**:
  - `reservationId`: String (required)
  - `guestName`: String (optional, max 100 chars)
  - `caption`: String (optional, max 1000 chars)
  - `file`: Binary file (required, max 15 MiB for photos, 30 MiB for videos)
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "message": "Your memory has been safely shared with the couple!",
    "memory": {
      "id": "65b83...",
      "guestName": "Uncle Rajesh",
      "caption": "Blessings to both of you!",
      "fileName": "family_photo.jpg",
      "fileType": "photo",
      "fileSize": 4194304,
      "uploadedAt": "2026-11-19T07:05:00.000Z"
    }
  }
  ```

### 1.4 Get Upload Status
- **Route**: `GET /api/upload/status/:id`
- **Description**: Queries status of a reservation or completed memory.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "status": "COMPLETED",
    "memory": {
      "guestName": "Uncle Rajesh",
      "fileType": "photo",
      "fileSize": 4194304,
      "uploadedAt": "2026-11-19T07:05:00.000Z"
    }
  }
  ```

---

## 2. Admin Authentication Endpoints

### 2.1 Admin Login
- **Route**: `POST /api/admin/login`
- **Rate Limit**: 10 attempts per 15 minutes per IP
- **Request Body**:
  ```json
  {
    "email": "admin@royalwedding.com",
    "password": "RoyalStrongPassword2026!"
  }
  ```
- **Response `200 OK`**: Sets HTTP-only cookie `admin_token` and returns token:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1Ni...",
    "admin": {
      "id": "65b80...",
      "email": "admin@royalwedding.com",
      "role": "admin"
    },
    "wedding": {
      "id": "65b81...",
      "brideName": "Aadhya",
      "groomName": "Kabir",
      "uploadSlug": "aadhya-kabir"
    }
  }
  ```

### 2.2 Admin Logout
- **Route**: `POST /api/admin/logout`
- **Description**: Clears `admin_token` cookie.

---

## 3. Protected Admin Endpoints (Require `Authorization: Bearer <token>` or Cookie)

### 3.1 Get Dashboard Statistics
- **Route**: `GET /api/admin/dashboard`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "statistics": {
      "totalMemories": 42,
      "totalPhotos": 35,
      "totalVideos": 7,
      "usedBytes": 842918400,
      "reservedBytes": 0,
      "availableBytes": 4525790720,
      "totalQuotaBytes": 5368709120,
      "percentageUsed": 15.7,
      "uniqueGuests": 18
    },
    "recentMemories": [ ... ]
  }
  ```

### 3.2 Get Paginated Gallery Memories
- **Route**: `GET /api/admin/memories`
- **Query Parameters**:
  - `type`: `photo` | `video`
  - `search`: string (matches guest name, caption, filename)
  - `sort`: `newest` | `oldest`
  - `page`: number (default 1)
  - `limit`: number (default 12)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "memories": [ ... ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 4,
      "totalItems": 42,
      "limit": 12
    }
  }
  ```

### 3.3 Authorized Stream (Private Preview)
- **Route**: `GET /api/admin/memories/:id/stream`
- **Description**: Streams private R2 binary directly with proper `Content-Type` for browser photo preview and video playback without exposing raw bucket URLs.

### 3.4 Authorized Download
- **Route**: `GET /api/admin/memories/:id/download`
- **Description**: Downloads memory with `Content-Disposition: attachment; filename="..."` or redirects to a short-lived presigned URL.

### 3.5 Delete Memory
- **Route**: `DELETE /api/admin/memories/:id`
- **Description**: Permanently removes memory record from MongoDB, deletes object from Cloudflare R2, recovers storage quota atomically, and logs an audit entry.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Memory successfully deleted and storage quota recovered.",
    "freedBytes": 12582912,
    "storageStats": { ... }
  }
  ```

### 3.6 Update Wedding Settings
- **Route**: `PATCH /api/admin/wedding/settings`
- **Request Body**:
  ```json
  {
    "brideName": "Aadhya",
    "groomName": "Kabir",
    "weddingDate": "2026-12-18",
    "welcomeMessage": "Updated welcome text",
    "uploadEnabled": true
  }
  ```

### 3.7 Generate Banquet Table QR Code
- **Route**: `GET /api/admin/qr-code`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "uploadUrl": "https://royal-wedding-memories.pages.dev/upload/aadhya-kabir",
    "uploadSlug": "aadhya-kabir",
    "qrCodeDataUrl": "data:image/png;base64,iVBORw0KGgo..."
  }
  ```
