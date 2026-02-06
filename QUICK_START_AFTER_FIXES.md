# FaceSeek - Quick Start Guide (Post-Stabilization)

## ✅ Project Status: FULLY STABILIZED

All critical errors have been fixed. The project is ready for development and deployment.

---

## Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.9+ (for backend)
- **pip** (Python package manager)
- **npm** (Node package manager)

---

## Quick Start (5 Minutes)

### 1. Clone & Setup Frontend

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Build to verify everything works
npm run build

# Start development server
npm run dev
```

Frontend will be available at: **http://localhost:3000**

---

### 2. Setup Backend

```bash
# Navigate to backend
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Edit .env and set at minimum:
# SECRET_KEY=your-secret-key-here (use: openssl rand -hex 32)

# Start backend server
python main.py
```

Backend will be available at: **http://localhost:8000**

---

## Environment Configuration

### Frontend (.env.local)

```env
# Required
NEXT_PUBLIC_API_URL=http://localhost:8000
SERVER_API_URL=http://localhost:8000

# Optional (for OSINT features)
NEXT_PUBLIC_GOOGLE_API_KEY=your-google-api-key
NEXT_PUBLIC_GOOGLE_CX=your-custom-search-engine-id
```

### Backend (.env)

```env
# REQUIRED - Generate with: openssl rand -hex 32
SECRET_KEY=your-secret-key-here

# Database (default SQLite)
DATABASE_URL=sqlite:///./faceseek.db

# Optional but recommended
DEBUG=True
ADMIN_API_KEY=your-admin-key
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

---

## Verify Installation

### Frontend Build Test
```bash
cd frontend
npm run build
```
**Expected:** ✅ Build completes successfully with no errors

### Backend Import Test
```bash
cd backend
python -c "from main import app; print('✅ Backend OK')"
```
**Expected:** ✅ No import errors

---

## Development Workflow

### Start Both Services

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Access Application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Common Commands

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm test             # Run tests
```

### Backend
```bash
python main.py                    # Start development server
uvicorn main:app --reload         # Alternative dev server
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker  # Production
```

---

## Project Structure

```
eye-of-tr-v2/
├── frontend/              # Next.js frontend
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities & API client
│   ├── messages/         # i18n translations
│   ├── .env.local        # Environment variables (create this)
│   └── package.json      # Dependencies
│
├── backend/              # FastAPI backend
│   ├── app/             # Application code
│   │   ├── api/         # API endpoints
│   │   ├── core/        # Config & security
│   │   ├── db/          # Database
│   │   ├── models/      # SQLAlchemy models
│   │   └── services/    # Business logic
│   ├── .env             # Environment variables (create this)
│   ├── main.py          # Application entry point
│   └── requirements.txt # Python dependencies
│
└── deploy/              # Deployment configs
```

---

## What Was Fixed

### Critical Issues Resolved:
1. ✅ API client architecture standardized (`.get()`, `.post()`, etc.)
2. ✅ TypeScript null safety violations fixed
3. ✅ Admin API response type mismatches corrected
4. ✅ Backend dependencies verified (python-socketio)
5. ✅ Environment configuration documented
6. ✅ Internationalization completed
7. ✅ FormData header handling fixed

### Files Modified:
- `frontend/lib/api.ts` - Complete refactor
- `frontend/lib/dataPlatform.ts` - API calls updated
- `frontend/components/LiveSupportWidget.tsx` - Null checks added
- `frontend/app/admin/support/page.tsx` - Response handling fixed
- `frontend/messages/*.json` - i18n keys added

### Files Created:
- `frontend/.env.local` - Development config
- `frontend/.env.example` - Config template
- `STABILIZATION_REPORT.md` - Detailed fix report

---

## Troubleshooting

### Frontend won't build
```bash
cd frontend
rm -rf .next node_modules
npm install
npm run build
```

### Backend won't start
```bash
cd backend
pip install --upgrade -r requirements.txt
python main.py
```

### Port already in use
```bash
# Frontend (change port)
PORT=3001 npm run dev

# Backend (change port in .env)
API_PORT=8001 python main.py
```

### Database errors
```bash
cd backend
rm faceseek.db  # Delete old database
python main.py  # Will recreate tables
```

---

## Next Steps

1. **Review the code** - Familiarize yourself with the architecture
2. **Configure API keys** - Add external service keys to `.env`
3. **Create admin user** - Run `backend/scripts/create_admin_user.py`
4. **Test features** - Try face search, authentication, admin panel
5. **Deploy** - Follow deployment guide in `DEPLOY_TO_VPS.md`

---

## Support

- **Documentation:** See `STABILIZATION_REPORT.md` for detailed fixes
- **Architecture:** See `ARCHITECTURE.md` for system design
- **Deployment:** See `DEPLOY_TO_VPS.md` for production setup

---

## Production Deployment

### Frontend
```bash
cd frontend
npm run build
npm start
```

### Backend
```bash
cd backend
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Docker
```bash
docker-compose up -d
```

---

**Status:** 🚀 Ready for Development & Production  
**Last Updated:** February 6, 2026  
**Build Status:** ✅ All tests passing
