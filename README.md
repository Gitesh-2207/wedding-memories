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
  - **Cloudflare R2 Integration**: Private S3-compatible bucket with signed streaming proxy.
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
| **Media Storage** | Cloudinary (Default) OR Cloudflare R2 (S3-compatible via `@aws-sdk/client-s3`) |
| **Database** | MongoDB Atlas |
| **Edge Gateway** | Cloudflare Workers |
| **Bot Protection** | Cloudflare Turnstile |

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js** `>= 18.0.0`
- **npm** `>= 9.0.0`
- MongoDB database (local or MongoDB Atlas)
- Cloud storage account (Cloudinary or Cloudflare R2)

---

### 2. Backend Setup

1. Navigate to the backend directory and copy the environment configuration:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Open `.env` and fill in your connection details (refer to `.env.example`).

3. Initialize the database:
   ```bash
   npm run seed
   ```

4. Start the backend development server:
   ```bash
   npm run dev
   # Backend runs on http://localhost:5000
   ```

---

### 3. Frontend Setup

1. In a new terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. Start the frontend development server:
   ```bash
   npm run dev
   # Frontend runs on http://localhost:5173
   ```

---

### 4. Application Routes

- 🌸 **Welcome Page**: `http://localhost:5173/`
- 📸 **Guest Media Upload**: `http://localhost:5173/upload/:slug`
- 🔐 **Admin Vault Portal**: `http://localhost:5173/admin/login`

---

## 🧪 Automated Testing

The project includes an automated test suite verifying file validation, security, and quota operations:

```bash
cd backend
npm test
```

### Verified Test Cases:
- [x] Admin authentication & bcrypt password security
- [x] File signature validation (JPEG, PNG, MP4, WebM)
- [x] Rejection of malicious/spoofed files
- [x] Photo (`<= 15 MiB`) and video (`<= 30 MiB`) file size limits
- [x] Enforced 5 GiB atomic quota reservation
- [x] Immediate quota recovery on upload cancellation or failure
- [x] Safe quota recovery upon admin file deletion
- [x] Guest upload enable/disable master switch

---

## ☁️ Deployment

For production deployments, refer to the [Deployment Guide](docs/DEPLOYMENT_GUIDE.md):

- **Frontend**: [Cloudflare Pages](https://pages.cloudflare.com/) or [Vercel](https://vercel.com/)
- **Backend API**: [Render](https://render.com/) or [Railway](https://railway.app/)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Media Storage**: [Cloudinary](https://cloudinary.com/) or [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
