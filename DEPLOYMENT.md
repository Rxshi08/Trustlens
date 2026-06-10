# TrustLens Deployment Guide

Deploy TrustLens to production using **Vercel** (frontend), **Render** (backend + OCR), and **MongoDB Atlas** (database).

---

## 1. MongoDB Atlas

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free cluster (M0).
2. Create a database user with read/write access.
3. Under **Network Access**, add `0.0.0.0/0` (allow from anywhere) for cloud deployment.
4. Click **Connect → Drivers** and copy the connection string:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/trustlens?retryWrites=true&w=majority
   ```

---

## 2. Render — Backend API

### Option A: Blueprint (recommended)

1. Push code to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com) → **New → Blueprint**.
3. Connect your repo — Render reads `render.yaml`.
4. Set these manually when prompted:
   - `MONGO_URI` → your Atlas connection string
   - `FRONTEND_URL` → your Vercel URL (e.g. `https://trustlens.vercel.app`)
5. After OCR service deploys, set `PYTHON_OCR_URL` on the API service to:
   ```
   https://trustlens-ocr.onrender.com
   ```

### Option B: Manual Web Service

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `node server.js` |
| Health Check | `/api/health` |

**Environment Variables:**

| Key | Value |
|-----|-------|
| `MONGO_URI` | Atlas connection string |
| `JWT_SECRET` | Random 64-char hex string |
| `PYTHON_OCR_URL` | `https://trustlens-ocr.onrender.com` |
| `FRONTEND_URL` | `https://your-app.vercel.app` |
| `ADMIN_SECRET` | Secret for creating admin accounts |
| `PORT` | `5000` |

---

## 3. Render — Python OCR Service

### Recommended: Docker

| Setting | Value |
|---------|-------|
| Root Directory | `python-services` |
| Runtime | **Docker** |
| Dockerfile | `Dockerfile` |
| Health Check | `/` |

No extra env vars needed — Tesseract is installed in the Docker image.

### Alternative: Native Python

> Native Render Python runtimes do not include Tesseract. Use Docker instead.

---

## 4. Vercel — Frontend

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your GitHub repo.
2. Vercel reads `vercel.json` automatically.
3. Set environment variables:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://trustlens-api.onrender.com/api` |
| `VITE_ASSET_URL` | `https://trustlens-api.onrender.com` |

4. Deploy. Your app will be live at `https://your-app.vercel.app`.

---

## 5. Post-Deployment Checklist

- [ ] Backend health: `GET https://trustlens-api.onrender.com/api/health`
- [ ] OCR health: `GET https://trustlens-ocr.onrender.com/`
- [ ] CORS: `FRONTEND_URL` on backend matches your Vercel domain exactly
- [ ] Sign up as candidate, upload 4 documents, verify trust score generates
- [ ] Create admin: signup with `role: admin` and matching `ADMIN_SECRET` via API, or update role in Atlas directly

---

## 6. Environment Variables Summary

### Frontend (`Vercel`)

```env
VITE_API_URL=https://trustlens-api.onrender.com/api
VITE_ASSET_URL=https://trustlens-api.onrender.com
```

### Backend (`Render`)

```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=<random-64-char-hex>
PYTHON_OCR_URL=https://trustlens-ocr.onrender.com
FRONTEND_URL=https://your-app.vercel.app
ADMIN_SECRET=<your-admin-secret>
NODE_ENV=production
```

### OCR Service (`Render` — Docker)

```env
TESSERACT_CMD=/usr/bin/tesseract
```

---

## 7. Local Development with Production DB (optional)

```bash
# frontend/.env
VITE_API_URL=http://localhost:5000/api
VITE_ASSET_URL=http://localhost:5000

# backend/.env
MONGO_URI=mongodb+srv://...   # Atlas URI works locally too
PYTHON_OCR_URL=http://127.0.0.1:8000
FRONTEND_URL=http://localhost:5173
```

---

## 8. Known Limitations (Free Tier)

- Render free services **spin down after 15 min** of inactivity (cold starts ~30s).
- Uploaded files are stored on Render's ephemeral disk — use S3 for production persistence.
- OCR on free tier may be slow for large PDFs.

---

## 9. Upgrading for Production

| Improvement | Solution |
|-------------|----------|
| Persistent file storage | AWS S3 / Cloudinary |
| Faster OCR | Dedicated Render instance or AWS Lambda |
| Custom domain | Vercel + Render custom domains |
| SSL | Automatic on Vercel and Render |
| Monitoring | Render metrics + Sentry |
