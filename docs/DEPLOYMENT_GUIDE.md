# Royal Wedding Memories - Production Deployment Guide

This guide provides end-to-end instructions for deploying Royal Wedding Memories using genuinely free-tier cloud infrastructure.

---

## 1. Cloud Infrastructure & Free Tier Breakdown

| Component | Provider & Tier | Limits & Cost Notes |
| :--- | :--- | :--- |
| **Database** | MongoDB Atlas Free (M0 Sandbox) | 512 MB metadata storage, shared RAM, zero cost forever. |
| **Media Storage** | **Cloudinary** (Option A - Recommended) <br> **Cloudflare R2** (Option B) | **Cloudinary**: 25 credits/month free (~25 GB storage/bandwidth), auto-optimization.<br>**Cloudflare R2**: 10 GB/month storage free, zero egress fees. Our 5 GiB quota fits inside both! |
| **Bot Protection** | Cloudflare Turnstile | Unlimited free bot challenges and siteverify API. |
| **Frontend Hosting** | Cloudflare Pages / Vercel / Netlify | Free unlimited requests, continuous GitHub CI/CD, custom domains, free SSL. |
| **Backend API** | Render / Railway / Fly.io / VPS | Free web service tier on Render/Fly.io (or $5/mo VM for 24/7 zero sleep). |
| **Edge Gateway** | Cloudflare Workers (Optional) | Free tier includes 100,000 requests/day. |

> [!NOTE]
> All storage requirements of this project (5 GiB total memory quota) fit within Cloudinary and Cloudflare R2's generous free tiers without requiring a paid subscription.

---

## 2. Step 1: MongoDB Atlas Setup

1. Create a free account at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a new Cluster and select the **M0 Free (Shared)** tier. Choose a cloud region close to your users (e.g. AWS `ap-south-1` Mumbai or `us-east-1`).
3. Under **Security > Database Access**:
   - Create a database user (e.g., `giteshyt`) with password authentication.
   - Set privileges to `Read and write to any database`.
4. Under **Security > Network Access**:
   - Add IP Access List entry `0.0.0.0/0` (Allow access from anywhere) so cloud hosting providers can connect.
5. Copy your connection string and add the database name (`wedding_memories`):
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.trjwobw.mongodb.net/wedding_memories?retryWrites=true&w=majority&appName=Cluster0
   ```

---

## 3. Step 2: Media Storage Setup (Cloudinary OR Cloudflare R2)

### Option A: Cloudinary Media Storage (Recommended – Fastest Setup)
1. Sign up for a free account at [cloudinary.com](https://cloudinary.com).
2. In the **Cloudinary Console Dashboard**, look at **Product Environment Credentials**:
   - **Cloud Name** (e.g. `dxy...`)
   - **API Key** (e.g. `123456789...`)
   - **API Secret** (e.g. `abcde...`)
   - Or the single **API Environment variable**: `cloudinary://<api_key>:<api_secret>@<cloud_name>`
3. Set these in your backend `.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
   *(The backend automatically creates the `royal_wedding_memories` folder and manages image/video uploads, streaming, and deletions).*

---

### Option B: Cloudflare R2 Private Bucket Setup
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com) and navigate to **R2**.
2. Click **Create bucket**:
   - Bucket name: `royal-wedding-memories-bucket`
   - Location: Automatic
3. **DO NOT enable Public Access**. Leave the bucket completely private.
4. Go to **R2 > Manage R2 API Tokens** and click **Create API Token**:
   - Permissions: `Object Read & Write`
   - Apply to specific bucket: `royal-wedding-memories-bucket`
5. Save the generated credentials in your `.env`:
   ```env
   R2_ACCOUNT_ID=your_cloudflare_account_id
   R2_ACCESS_KEY_ID=your_r2_access_key_id
   R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
   R2_BUCKET_NAME=royal-wedding-memories-bucket
   ```

---

## 4. Step 3: Cloudflare Turnstile Bot Protection Setup

1. In Cloudflare Dashboard, go to **Turnstile**.
2. Click **Add site**:
   - Site name: `Royal Wedding Memories`
   - Domain: `your-wedding-domain.pages.dev` (and `localhost` for testing).
   - Widget Mode: Managed (recommended)
3. Copy the keys:
   - `VITE_CLOUDFLARE_TURNSTILE_SITE_KEY` (Used by Frontend)
   - `CLOUDFLARE_TURNSTILE_SECRET_KEY` (Used by Backend)

---

## 5. Step 4: Backend API Deployment (Render / Railway / VPS)

### Deploying to Render.com (Free Web Service)
1. Push your repository to GitHub.
2. In [render.com](https://render.com), click **New Web Service** and connect your repository.
3. Configure settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Set Environment Variables:
   ```env
   PORT=10000
   NODE_ENV=production
   FRONTEND_URL=https://your-wedding.pages.dev
   JWT_SECRET=your_64_char_secure_random_jwt_secret
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.trjwobw.mongodb.net/wedding_memories?retryWrites=true&w=majority&appName=Cluster0

   # If using Cloudinary:
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # If using Cloudflare R2 (leave blank if using Cloudinary):
   R2_ACCOUNT_ID=
   R2_ACCESS_KEY_ID=
   R2_SECRET_ACCESS_KEY=
   R2_BUCKET_NAME=

   CLOUDFLARE_TURNSTILE_SECRET_KEY=your_turnstile_secret_key
   ```
5. Click **Deploy Web Service**.

---

## 6. Step 5: Database Auto-Seeding & Initial Admin Account

When the backend starts for the first time, it **automatically runs the seed procedure** on your live MongoDB database:
- **Wedding**: `Aadhya & Kabir` (`/upload/aadhya-kabir`)
- **Admin Email**: `admin@royalwedding.com`
- **Initial Password**: `RoyalAdmin2026!`

*(You can change the admin password at any time via the Admin Settings page in the dashboard).*

---

## 7. Step 6: Frontend Deployment on Cloudflare Pages

1. In Cloudflare Dashboard, navigate to **Workers & Pages > Create application > Pages > Connect to Git**.
2. Select your repository and configure build settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
3. Add Environment Variables:
   - `VITE_API_URL`: `https://your-backend-api.onrender.com/api`
   - `VITE_CLOUDFLARE_TURNSTILE_SITE_KEY`: `your_turnstile_site_key`
4. Click **Save and Deploy**.
5. Once deployed, Cloudflare Pages provides an HTTPS domain: `https://your-wedding.pages.dev`.

---

## 8. Verification & Production Checklist

- [ ] Open `https://your-wedding.pages.dev` and verify wedding couple names and date.
- [ ] Navigate to `/upload/aadhya-kabir` and test uploading a photo under 15 MiB.
- [ ] Verify Turnstile verification badge passes.
- [ ] Ensure guest redirected to `/upload/success` with festive celebration animation.
- [ ] Log in at `/admin/login` using your configured admin credentials.
- [ ] Test the **Password View (Eye icon)** on login and in Admin Settings.
- [ ] Verify the **5 GiB Storage Usage Bar** reflects exact bytes stored out of 5 GiB.
- [ ] Test photo full-screen preview and video playback in the Admin Gallery.
- [ ] Download the Banquet QR Code from Admin Settings and test scanning with a mobile device.
