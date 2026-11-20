# 👑 Royal Wedding Memories – Full Stack Platform

[![GitHub Repository](https://img.shields.io/badge/GitHub-wedding--memories-8C2436?style=flat&logo=github)](https://github.com/Gitesh-2207/wedding-memories)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-gold)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-45372E.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Storage-Cloudinary%20%7C%20Cloudflare%20R2-D8B978)](https://github.com/Gitesh-2207/wedding-memories)

> An elegant, production-ready Indian royal wedding celebration and media collection platform. Guests can seamlessly upload their cherished high-resolution photos and videos via QR code or direct link—without creating an account or downloading an app. Built with an enforced 5 GiB storage quota management system, bot protection, and an exclusive royal administrator vault.

---

## ✨ Features

- **Royal Indian Wedding Aesthetic**:
  - **Color Palette**: Regal Ivory (`#F8F3E9`), Champagne Gold (`#D8B978`), Deep Maroon (`#8C2436`), Antique Bronze (`#45372E`), and Pure White (`#FFFFFF`).
  - **Typography**: Playfair Display for majestic headings and Inter for crisp typography.
  - Ornate floral mandalas, decorative archways, smooth transitions, and mobile-first responsiveness.
- **Frictionless Guest Upload Experience**:
  - No app installation or guest account registration required.
  - Optional guest name and heartfelt wishes / blessings.
  - Drag-and-drop multi-file upload supporting photos (JPEG, PNG, WebP up to 15 MiB) and videos (MP4, WebM up to 30 MiB).
  - Client-side media previews with individual file removal before submission.
  - Per-file real-time upload progress indicators.
  - Integrated Cloudflare Turnstile bot and abuse protection.
  - Joyful royal gold & maroon confetti celebration upon successful upload.
- **Enforced 5 GiB Storage Quota Management**:
  - Total wedding media limit: **Exactly 5 GiB (5,368,709,120 bytes)**.
  - Atomic storage reservation before accepting file streams to prevent concurrent race-condition quota overruns.
  - Automatic quota rollback if network disconnects or uploads fail mid-flight.
  - Expired reservation reconciliation with MongoDB TTL indexes.
- **Secure Cloud Storage (Cloudinary & Cloudflare R2)**:
  - **Cloudinary Integration**: Automatic optimization and CDN delivery for photos and videos.
  - **Cloudflare R2 Integration**: Private S3-compatible bucket with signed streaming proxy (`/api/admin/memories/:id/stream`).
  - Magic byte binary inspection via `file-type` to prevent disguised executables or MIME spoofing.
- **Administrator Vault & Dashboard**:
  - Protected with JWT authentication and bcrypt password hashing.
  - Live animated storage breakdown progress bar (photos, videos, free space).
  - Real-time celebration metrics: total uploads, photo/video count, unique guests, and quota health.
  - Filterable Photo & Video Galleries with full-screen zoom modal and secure download.
  - Instant storage quota recovery upon memory deletion.
  - Master switch to pause or resume guest uploads at any moment.
  - Banquet table QR Code generator with one-click URL copy and high-resolution PNG download.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, Tailwind CSS, React Router DOM v7, Axios, Lucide React, React Dropzone, React Hot Toast, Canvas Confetti |
| **Backend API** | Node.js (ES Modules), Express.js, Mongoose, JWT, bcryptjs, Zod, Helmet, Express Rate Limit, Multer, File-Type, QRCode |
| **Media Storage** | Cloudinary (Default / Recommended) OR Cloudflare R2 (S3-compatible via `@aws-sdk/client-s3`) |
| **Database** | MongoDB Atlas (M0 Free Tier or higher) |
| **Edge Gateway** | Cloudflare Workers (`worker/`) |
| **Bot Protection** | Cloudflare Turnstile |

---

## 📂 Project Directory Structure

```text
wedding-memories/
├── backend/
│   ├── src/
│   │   ├── config/          # Constants, MongoDB connection, Cloudinary/R2 client
│   │   ├── controllers/     # Upload & Admin controllers
│   │   ├── middleware/      # Auth, Turnstile, Rate limiters
│   │   ├── models/          # Wedding, Admin, Memory, UploadReservation, AuditLog
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Atomic storage quota service
│   │   ├── utils/           # Magic number / file signature validator
│   │   ├── validators/      # Zod request payload schemas
│   │   ├── app.js           # Express app with Helmet, CORS, and routes
│   │   └── server.js        # Server bootstrap entrypoint
│   ├── tests/               # System test suite
│   ├── .env.example         # Backend environment template
│   └── package.json
├── frontend/
│   ├── public/              # Static assets, Open Graph images & royal mandala icons
│   ├── src/
│   │   ├── components/      # Navbar, Footer, Ornaments, Turnstile, Modal, StorageBar
│   │   ├── pages/           # Home, Upload, Success, Login, Dashboard, Galleries, Settings
│   │   ├── services/        # Axios API, upload & admin services
│   │   ├── styles/          # Tailwind directives & royal custom theme
│   │   ├── App.jsx          # Route configurations
│   │   └── main.jsx         # App root entrypoint
│   ├── index.html           # HTML template with Google Fonts & Turnstile scripts
│   ├── tailwind.config.js   # Royal theme palette & custom styles
│   ├── vite.config.js       # Vite configuration with backend proxy
│   ├── .env.example         # Frontend environment template
│   └── package.json
├── worker/
│   ├── src/                 # Cloudflare Worker Edge Gateway implementation
│   ├── wrangler.toml        # Cloudflare R2 bucket bindings configuration
│   ├── .dev.vars.example    # Worker secrets template
│   └── package.json
├── database/
│   ├── seed/seed.js         # Initial wedding setup & admin credentials generator
│   └── migrations/          # MongoDB index creation scripts
├── docs/
│   ├── ARCHITECTURE.md      # Detailed system architecture
│   ├── DEPLOYMENT_GUIDE.md  # Production deployment on Pages/Workers/R2/Atlas
│   └── API_DOCUMENTATION.md # Complete REST API reference
├── .gitignore               # Comprehensive Git ignore rules (secrets, credentials, lockfiles)
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js** `>= 18.0.0`
- **npm** `>= 9.0.0`
- A free **MongoDB Atlas** database cluster (or local MongoDB)
- A free **Cloudinary** account (or Cloudflare R2 bucket)

---

### 2. Backend Setup

1. Navigate to the backend directory and configure your environment:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Fill in your credentials in `backend/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173

   # Authentication Secret
   JWT_SECRET=your_super_secret_jwt_key_here

   # MongoDB Atlas Connection
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.yourdomain.mongodb.net/wedding_memories?retryWrites=true&w=majority

   # Cloud Media Storage (Cloudinary)
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

3. Initialize the wedding details and create the administrator account:
   ```bash
   npm run seed
   ```
   *(To customize bride/groom names or admin credentials, you can pass arguments)*:
   ```bash
   npm run seed -- --bride "Khushbu" --groom "Abhay" --slug "khushbu-abhay" --email "admin@royalwedding.com" --password "YourCustomPassword123!"
   ```

4. Start the backend development server:
   ```bash
   npm run dev
   # Backend running on http://localhost:5000
   ```

---

### 3. Frontend Setup

1. In a new terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. Configure `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   # Leave blank for local testing, or add your Cloudflare Turnstile site key
   VITE_CLOUDFLARE_TURNSTILE_SITE_KEY=
   ```

3. Start the frontend development server:
   ```bash
   npm run dev
   # Vite development server running on http://localhost:5173
   ```

---

### 4. Accessing the Application

- 🌸 **Royal Welcome Page**: [`http://localhost:5173/`](http://localhost:5173/)
- 📸 **Guest Photo & Video Upload**: [`http://localhost:5173/upload/khushbu-abhay`](http://localhost:5173/upload/khushbu-abhay)
- 🔐 **Admin Vault Portal**: [`http://localhost:5173/admin/login`](http://localhost:5173/admin/login)

---

## 🧪 Automated Testing

The backend includes an automated test suite verifying file signature validation, size boundaries, atomic reservation rollback, and quota exhaustion:

```bash
cd backend
npm test
```

### Verified Test Suite:
- [x] Admin authentication & bcrypt password hashing
- [x] Magic-number file signature validation (JPEG, PNG, MP4, WebM)
- [x] Rejection of malicious/spoofed files disguised with media extensions
- [x] Enforcement of photo `<= 15 MiB` and video `<= 30 MiB` limits
- [x] Atomic 5 GiB total quota reservation & concurrent lock management
- [x] Immediate quota recovery on upload cancellation or failure
- [x] Safe quota recovery upon admin file deletion
- [x] Wedding upload enable/disable master toggle

---

## ☁️ Deployment

For production deployments, please consult the complete [Deployment Guide](docs/DEPLOYMENT_GUIDE.md):

- **Frontend**: Deploy on [Cloudflare Pages](https://pages.cloudflare.com/) or [Vercel](https://vercel.com/) with single-page app redirects configured.
- **Backend API**: Deploy on [Render](https://render.com/), [Railway](https://railway.app/), or any container/VPS provider.
- **Database**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) with automated index synchronization.
- **Media Storage**: [Cloudinary](https://cloudinary.com/) or [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/).

---

## 🛡️ Security & Privacy Best Practices

- **Zero Hardcoded Secrets**: All sensitive keys, connection strings, and tokens are stored strictly in `.env` files and excluded via `.gitignore`.
- **Private Media Delivery**: Cloud storage assets are accessed through authenticated endpoints or signed URLs.
- **MIME & Magic Byte Verification**: File payloads are inspected at the binary level before storage.
- **Rate Limiting**: Aggressive rate limiting on upload initiation, admin login, and guest requests.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
