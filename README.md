# TrustLens

**AI-Powered Identity Verification & Trust Scoring Platform**

TrustLens verifies Indian identity documents (Aadhaar, PAN), resumes, and marksheets using OCR, cross-document validation, and intelligent trust scoring.

![Tech Stack](https://img.shields.io/badge/React-19-61DAFB) ![Node.js](https://img.shields.io/badge/Express-5-339933) ![Python](https://img.shields.io/badge/FastAPI-OCR-009688) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248)

## Features

- **4-Document Verification** — Aadhaar, PAN, Resume, Marksheet upload pipeline
- **AI OCR Engine** — Tesseract + OpenCV quality & authenticity scoring
- **Trust Score (0–100)** — Cross-document name/DOB matching, fraud detection
- **Role-Based Dashboards** — Admin, Recruiter, and Candidate portals
- **PDF Reports** — Auto-generated verification reports
- **Recruiter Workflow** — Review queue with approve/reject decisions
- **Analytics** — Platform-wide trends, risk distribution, pipeline metrics
- **Verification History** — Candidates track all past verifications

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  React/Vite │────▶│ Express API  │────▶│  MongoDB    │
│  (Vercel)   │     │  (Render)    │     │  (Atlas)    │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                    ┌──────▼───────┐
                    │ Python OCR   │
                    │  (Render)    │
                    └──────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v4, Recharts |
| Backend | Node.js, Express 5, Mongoose, JWT |
| OCR Service | Python, FastAPI, Tesseract, OpenCV |
| Database | MongoDB Atlas |

## Quick Start (Local)

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)
- Tesseract OCR + Poppler

### 1. Clone & configure

```bash
git clone <repo-url>
cd trustlens
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # Edit MONGO_URI, JWT_SECRET
npm install
npm run dev            # http://localhost:5000
```

### 3. Python OCR

```bash
cd python-services
python -m venv venv
# Windows: .\venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn ocr_service:app --host 127.0.0.1 --port 8000
```

### 4. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev            # http://localhost:5173
```

## User Roles

| Role | Access |
|------|--------|
| **Candidate** | Upload docs, view trust score, verification history |
| **Recruiter** | Review queue, approve/reject, analytics |
| **Admin** | Full dashboard, analytics, delete records, upload |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | — | Register |
| POST | `/api/auth/login` | — | Login (returns JWT) |
| POST | `/api/verification/verify` | JWT | Upload & verify 4 docs |
| GET | `/api/verification/my` | JWT (candidate) | Own verification history |
| GET | `/api/verification/all` | JWT (admin/recruiter) | All verifications |
| GET | `/api/verification/analytics` | JWT (admin/recruiter) | Platform analytics |
| GET | `/api/verification/:id` | JWT | Single verification |
| PUT | `/api/verification/:id/review` | JWT (recruiter/admin) | Update review |
| DELETE | `/api/verification/:id` | JWT (admin) | Delete record |
| GET | `/api/health` | — | Health check |

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full Vercel + Render + MongoDB Atlas setup.

## Project Structure

```
trustlens/
├── frontend/          # React SPA
├── backend/           # Express API
├── python-services/   # FastAPI OCR microservice
├── vercel.json        # Vercel config
├── render.yaml        # Render blueprint
└── DEPLOYMENT.md      # Deployment guide
```

## License

MIT
