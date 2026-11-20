# 👑 Royal Wedding Memories – Full Stack Web Application

> An elegant, production-ready Indian royal wedding memories platform where wedding guests can upload their cherished photos and videos via QR code or public link, without creating an account. Built with private Cloudflare R2 storage, an enforced 5 GiB quota management system, and an exclusive administrator gallery.

---

## ✨ Features

- **Royal Indian Wedding Aesthetic**:
  - Color palette: Ivory (`#F8F3E9`), Champagne Gold (`#D8B978`), Dark Brown (`#45372E`), Maroon (`#8C2436`), and White (`#FFFFFF`).
  - Typography: Playfair Display for regal headings, Inter for clear body text.
  - Ornate floral mandalas, gold borders, subtle animations, and mobile-first responsiveness.
- **Frictionless Guest Upload Experience**:
  - No app download or account registration required.
  - Optional guest name and heartfelt wishes/captions.
  - Multi-file drag-and-drop supporting JPEG, PNG, WebP photos (up to 15 MiB) and MP4, WebM videos (up to 30 MiB).
  - Previews for photos and videos, individual file removal before submission.
  - Real-time progress bars for each file during upload.
  - Cloudflare Turnstile bot protection.
  - Festive gold & maroon confetti celebration on successful upload.
- **Enforced 5 GiB Storage Quota System**:
  - Total wedding storage limit: **Exactly 5 GiB (5,368,709,120 bytes)**.
  - Atomic storage reservation before accepting bytes to prevent concurrent uploads from exceeding quota.
  - Automatic quota rollback if network drops or an upload fails.
  - Expired reservation reconciliation with MongoDB TTL indexes.
- **Strict Private Cloudflare R2 Storage**:
  - R2 bucket remains 100% private with zero public URLs.
  - Magic byte binary inspection via `file-type` to detect disguised executables or spoofed MIME types.
  - Authorized streaming proxy (`/api/admin/memories/:id/stream`) and presigned downloads.
- **Admin Dashboard & Vault**:
  - Secure JWT authentication with bcrypt password hashing.
  - Real-time animated storage breakdown progress bar.
  - Statistics: Total memories, photos, videos, unique guest count, used and remaining storage.
  - Photo Gallery with full-screen zoom preview modal, filtering, and authorized downloads.
  - Video Gallery with video player controls and downloads.
  - Immediate quota recovery upon deleting memories.
  - Quick toggle to pause or enable guest uploads.
  - Banquet table QR code generator with high-resolution PNG download and one-click URL copy.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, Tailwind CSS, React Router DOM v7, Axios, Lucide React, React Dropzone, React Hot Toast, Framer Motion, Canvas Confetti |
| **Backend** | Node.js (ES Modules), Express.js, Mongoose, JWT, bcryptjs, Zod, Helmet, Express Rate Limit, Multer, File-Type, QRCode |
| **Cloud Storage** | Cloudinary (Images/Videos) OR Cloudflare R2 (S3-compatible via `@aws-sdk/client-s3`) |
| **Edge Gateway** | Cloudflare Workers (`worker/`) |
| **Database** | MongoDB Atlas M0 Cluster |
| **Bot Protection** | Cloudflare Turnstile |

---

## 📂 Project Directory Structure

```text
wedding-memories/
├── backend/
│   ├── src/
│   │   ├── config/          # Constants, MongoDB connection, R2 client
│   │   ├── controllers/     # Upload & Admin controllers
│   │   ├── middleware/      # Auth, Turnstile, Rate limiters
│   │   ├── models/          # Wedding, Admin, Memory, UploadReservation, AuditLog
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Atomic storage quota service
│   │   ├── utils/           # Magic number / file signature validator
│   │   ├── validators/      # Zod request payload schemas
│   │   ├── app.js           # Express app with Helmet, CORS, and routes
│   │   └── server.js        # Server bootstrap entrypoint
│   ├── tests/               # System test suite (Node test runner)
│   ├── .env.example         # Environment template
│   └── package.json
├── frontend/
│   ├── public/              # Static assets & royal mandala favicon
│   ├── src/
│   │   ├── components/      # Navbar, Footer, Ornaments, Turnstile, Modal, StorageBar
│   │   ├── pages/           # Home, Upload, Success, Login, Dashboard, Galleries, Settings
│   │   ├── services/        # Axios API, upload & admin services
│   │   ├── styles/          # Tailwind directives & royal custom classes
│   │   ├── App.jsx          # Route configurations
│   │   └── main.jsx         # App root entrypoint
│   ├── index.html           # HTML template with Google Fonts & Turnstile
│   ├── tailwind.config.js   # Royal theme palette & custom shadows
│   └── vite.config.js       # Vite configuration with backend proxy
├── worker/
│   ├── src/                 # Cloudflare Worker Edge Gateway implementation
│   ├── wrangler.toml        # Cloudflare R2 bucket bindings configuration
│   └── package.json
├── database/
│   ├── seed/seed.js         # Initial wedding setup & admin credentials generator
│   └── migrations/          # MongoDB index creation scripts
├── docs/
│   ├── ARCHITECTURE.md      # Detailed system architecture
│   ├── DEPLOYMENT_GUIDE.md  # Production deployment on Pages/Workers/R2/Atlas
│   └── API_DOCUMENTATION.md # Complete REST API reference
├── .gitignore
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### 2. Backend Setup & Local Run
```bash
cd backend
npm install
cp .env.example .env
```
*(In development, if no external MongoDB URI or R2 credentials are configured in `.env`, the backend automatically connects to an embedded memory database and local secure storage adapter for immediate zero-friction testing!)*

Run the database seed script to initialize wedding details and admin account:
```bash
npm run seed
```

Start the backend server:
```bash
npm run dev
# Server runs on http://localhost:5000
```

### 3. Frontend Setup & Local Run
```bash
cd ../frontend
npm install
npm run dev
# Vite runs on http://localhost:5173
```

Now open `http://localhost:5173` in your browser.
- **Guest Home**: `http://localhost:5173/`
- **Guest Upload**: `http://localhost:5173/upload/aadhya-kabir`
- **Admin Portal**: `http://localhost:5173/admin/login`

---

## 🧪 Automated Testing

The backend includes a comprehensive automated test suite verifying file signature detection, size limits, atomic reservations, quota exhaustion, and deletion recoveries:

```bash
cd backend
npm test
```

### Verified Test Cases:
- [x] Admin authentication & bcrypt password hashing
- [x] File signature validation (JPEG, PNG, MP4, WebM)
- [x] Rejection of spoofed text files disguised with image extensions
- [x] Enforcement of photo <= 15 MiB and video <= 30 MiB individual limits
- [x] Enforced 5 GiB total quota reservation
- [x] Immediate quota recovery upon upload failure or cancellation
- [x] Safe quota recovery upon admin file deletion
- [x] Prevention of uploads when the wedding upload toggle is disabled

---

## ☁️ Deployment

Refer to the complete, step-by-step [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) for deploying:
- **Frontend**: Cloudflare Pages
- **Backend API**: Render, Railway, or VPS
- **Edge Gateway**: Cloudflare Workers
- **Database**: MongoDB Atlas M0 Free Cluster
- **Storage**: Cloudflare R2 Private Bucket
- **Bot Protection**: Cloudflare Turnstile
