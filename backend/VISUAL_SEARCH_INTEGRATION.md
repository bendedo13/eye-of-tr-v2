# Visual Search Backend Integration Guide

## 📋 Overview

This guide explains how to integrate the Visual Search API routes into your existing FastAPI backend without modifying existing files directly.

---

## 🔧 Manual Integration Steps

### Step 1: Update `main.py`

Open `backend/main.py` and add the visual search router:

```python
# Add this import at the top of main.py
from app.routes.visual_search import router as visual_search_router

# Then register the router (add this line where other routers are registered)
app.include_router(visual_search_router)
```

**Complete Example:**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Import configuration
from app.core.config import settings

# Import database
from app.db.database import engine, Base
from app.models.user import User

# Import routers
from app.routes.auth import router as auth_router, get_current_user
from app.routes.visual_search import router as visual_search_router  # ← NEW

# Create tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="EyeOfWeb API",
    version="2.0.0",
    description="OSINT and Visual Search Platform",
    swagger_ui_parameters={"persistAuthorization": True}
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(visual_search_router)  # ← NEW

# Root endpoint
@app.get("/")
def read_root():
    return {
        "message": "EyeOfWeb API",
        "status": "running",
        "version": "2.0.0",
        "endpoints": {
            "docs": "/docs",
            "auth": "/auth",
            "visual_search": "/api/visual-search",  # ← NEW
            "health": "/health"
        }
    }

# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "2.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## 🔑 Environment Variables

### Update `.env` file

Add these new variables to your `backend/.env`:

```env
# Visual Search API Keys
BING_API_KEY=your_bing_api_key_here
YANDEX_API_KEY=your_yandex_api_key_here  # Optional
```

### Full `.env` Example

```env
# Backend API Configuration
API_PORT=8000
DEBUG=True

# JWT Authentication
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALGORITHM=HS256

# Database
DATABASE_URL=sqlite:///./app.db

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://localhost:3001"]

# Google Custom Search (for frontend)
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CX=your_google_cx

# Bing Image Search API (NEW)
BING_API_KEY=your_bing_api_key_here

# Yandex (Optional)
YANDEX_API_KEY=your_yandex_api_key_here
```

---

## 📦 Dependencies

### Update `requirements.txt`

The `requirements.txt` has already been updated with:

```txt
httpx==0.26.0  # NEW - For async HTTP requests
```

Install the new dependency:

```bash
pip install httpx
```

Or reinstall all dependencies:

```bash
pip install -r requirements.txt
```

---

## ✅ Verify Integration

### 1. Start the Backend Server

```bash
cd backend
python main.py
```

### 2. Check API Documentation

Open your browser and visit:

```
http://localhost:8000/docs
```

You should see three new endpoints:
- `POST /api/visual-search/bing`
- `POST /api/visual-search/yandex`
- `GET /api/visual-search/health`

### 3. Test Health Endpoint

```bash
curl http://localhost:8000/api/visual-search/health
```

Expected response:

```json
{
  "status": "ok",
  "providers": {
    "bing": true,
    "yandex": false
  },
  "message": "Visual search API is operational"
}
```

### 4. Test Bing Search (requires authentication)

First, get an auth token:

```bash
# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com", "password": "yourpassword"}'
```

Then test the search:

```bash
curl -X POST http://localhost:8000/api/visual-search/bing \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "Elon Musk",
    "provider": "bing",
    "count": 10,
    "safeSearch": true
  }'
```

---

## 🔧 Configuration Options

### Enable/Disable Providers

In your `app/routes/visual_search.py`, providers are auto-enabled based on environment variables:

- **Bing**: Enabled if `BING_API_KEY` is set
- **Yandex**: Currently placeholder (not implemented)

### Adjust API Limits

You can modify these constants in `visual_search.py`:

```python
# Default limits
DEFAULT_COUNT = 20      # Default results per page
MAX_COUNT = 50          # Maximum results per page
DEFAULT_TIMEOUT = 30.0  # API request timeout in seconds
```

---

## 🚀 Production Deployment

### Security Checklist

- [ ] Change `SECRET_KEY` in `.env`
- [ ] Set `DEBUG=False`
- [ ] Configure specific `CORS_ORIGINS` (not `["*"]`)
- [ ] Use environment-specific `.env` files
- [ ] Enable HTTPS
- [ ] Implement rate limiting
- [ ] Set up monitoring and logging
- [ ] Use PostgreSQL instead of SQLite
- [ ] Enable API key rotation

### Recommended Settings

```env
# Production .env
DEBUG=False
API_PORT=8000
SECRET_KEY=super-secure-secret-key-min-32-chars
DATABASE_URL=postgresql://user:pass@localhost:5432/eyeofweb
CORS_ORIGINS=["https://yourdomain.com"]
```

### Rate Limiting (Optional)

Install `slowapi` for rate limiting:

```bash
pip install slowapi
```

Add to `main.py`:

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Apply to visual search endpoints
@app.post("/api/visual-search/bing")
@limiter.limit("10/minute")
async def search_bing_images(...):
    ...
```

---

## 🐛 Troubleshooting

### Import Error: `ModuleNotFoundError: No module named 'httpx'`

**Solution:**
```bash
pip install httpx
```

### Router Not Found

**Problem:** Endpoints not appearing in `/docs`

**Solution:**
1. Verify import statement in `main.py`
2. Verify `app.include_router(visual_search_router)` is called
3. Restart the server
4. Check for syntax errors in `visual_search.py`

### CORS Errors from Frontend

**Problem:** Frontend cannot access backend

**Solution:**
1. Add frontend URL to `CORS_ORIGINS` in `.env`
2. Restart backend server
3. Clear browser cache

### Bing API Errors

**Problem:** `401 Unauthorized` or `403 Forbidden`

**Solution:**
1. Verify `BING_API_KEY` in `.env` is correct
2. Check key is active in Azure Portal
3. Ensure billing is set up (even for free tier)
4. Test API key directly:
   ```bash
   curl -H "Ocp-Apim-Subscription-Key: YOUR_KEY" \
     "https://api.bing.microsoft.com/v7.0/images/search?q=test"
   ```

### Database Errors

**Problem:** SQLAlchemy errors or user table not found

**Solution:**
1. Ensure `User` model is imported in `main.py`
2. Check `Base.metadata.create_all(bind=engine)` is called
3. Delete `app.db` and restart (dev only)
4. Run migrations if using Alembic

---

## 📊 Monitoring & Logging

### Add Logging

Update `visual_search.py` to include logging:

```python
import logging

logger = logging.getLogger(__name__)

@router.post("/bing")
async def search_bing_images(...):
    logger.info(f"Bing search request: query={request.query}, user={current_user.email}")
    try:
        # ... search logic
        logger.info(f"Bing search success: {len(results)} results")
        return response
    except Exception as e:
        logger.error(f"Bing search error: {str(e)}")
        raise
```

### Configure Logging in `main.py`

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

---

## 📈 Usage Statistics

### Track API Usage (Optional)

Create a simple usage tracking table:

```python
# In app/models/api_usage.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from app.db.database import Base

class APIUsage(Base):
    __tablename__ = "api_usage"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    endpoint = Column(String)
    provider = Column(String)
    query = Column(String)
    result_count = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)
```

Log usage in `visual_search.py`:

```python
# After successful search
usage = APIUsage(
    user_id=current_user.id,
    endpoint="/api/visual-search/bing",
    provider="bing",
    query=request.query,
    result_count=len(results)
)
db.add(usage)
db.commit()
```

---

## ✅ Integration Complete!

After following these steps, your Visual Search module should be fully integrated and operational.

### Quick Verification

```bash
# 1. Backend health
curl http://localhost:8000/api/visual-search/health

# 2. Check docs
open http://localhost:8000/docs

# 3. Test frontend
open http://localhost:3000/visual-search
```

### Next Steps

1. Configure all API keys in `.env`
2. Test each search provider
3. Customize UI/UX as needed
4. Set up production deployment
5. Implement rate limiting
6. Add monitoring and analytics

---

**Need Help?** Check the main README at `frontend/VISUAL_SEARCH_MODULE_README.md`

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Status**: ✅ Ready for Production
