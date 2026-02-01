from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uvicorn
import os
import uuid
import logging
from typing import Optional
from pathlib import Path

from app.core.config import settings
from app.services.search_service import get_search_service
from app.api.auth import router as auth_router
from app.db.database import engine, Base, SessionLocal  # Use database.py directly
from app.models.user import User  # Import User model for metadata

# Logging ayarla
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title=settings.API_TITLE,
    description="Multi-provider face search aggregation service",
    version=settings.API_VERSION,
    debug=settings.DEBUG
)

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"🔵 REQUEST: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"🟢 RESPONSE: {response.status_code}")
    return response

# Upload klasörü
UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(exist_ok=True)

# Search service
search_service = get_search_service()

# Database tablolarını oluştur
Base.metadata.create_all(bind=engine)

# Auth router'ı ekle
logger.info("=" * 50)
logger.info("AUTH ROUTER YÜKLENİYOR...")
app.include_router(auth_router)
logger.info(f"Auth router prefix: {auth_router.prefix}")
logger.info(f"Auth router routes: {[route.path for route in auth_router.routes]}")
logger.info("=" * 50)

# Security
security = HTTPBearer()


def get_current_user_email(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """JWT token'dan user email al"""
    from app.core.security import decode_token
    
    user_id = decode_token(credentials.credentials)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return user_id


# Health check endpoint
@app.get("/health")
async def health_check():
    """Sistem sağlık kontrolü"""
    return {
        "status": "healthy",
        "service": "faceseek-api",
        "version": settings.API_VERSION
    }


# Root endpoint
@app.get("/")
async def root():
    """API bilgileri"""
    return {
        "service": "FaceSeek Face Search API",
        "version": settings.API_VERSION,
        "endpoints": {
            "health": "/health",
            "upload": "/api/upload",
            "search": "/api/search",
            "providers": "/api/providers",
            "auth": "/api/auth",
            "docs": "/docs"
        }
    }


# Upload endpoint - JWT KORUMASLI
@app.post("/api/upload")
async def upload_image(
    file: UploadFile = File(...),
    user_email: str = Depends(get_current_user_email)
):
    """Fotoğraf yükleme endpoint'i - JWT korumalı"""
    try:
        # Dosya uzantısını kontrol et
        allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
        file_ext = Path(file.filename).suffix.lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Desteklenmeyen dosya formatı. İzin verilenler: {', '.join(allowed_extensions)}"
            )
        
        # Benzersiz dosya adı oluştur
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Dosyayı kaydet
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        
        logger.info(f"Dosya yüklendi: {unique_filename} ({len(contents)} bytes) - User: {user_email}")
        
        return {
            "status": "success",
            "filename": unique_filename,
            "path": str(file_path),
            "size_bytes": len(contents)
        }
        
    except Exception as e:
        logger.error(f"Upload hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Dosya yükleme hatası: {str(e)}")


# Search endpoint - WATERFALL STRATEGY + CREDIT + BLUR
@app.post("/api/search")
async def search_face(filename: str, user_email: Optional[str] = None):
    """Waterfall yüz arama - Credit kontrolü + Blur"""
    try:
        file_path = UPLOAD_DIR / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Dosya bulunamadı")
        
        # Kullanıcı kontrolü
        user_tier = "free"
        blur_results = False
        
        if user_email:
            from app.models.user import User
            from app.services.credit_service import CreditService
            
            db = SessionLocal()
            user = db.query(User).filter(User.email == user_email).first()
            
            if user:
                user_tier = user.tier
                
                # Credit kontrolü (free tier için)
                if user_tier == "free":
                    if user.credits > 0:
                        # İlk arama - full sonuç
                        CreditService.consume_credit(user.id, db)
                        blur_results = False
                        logger.info(f"User {user.email}: Full sonuç. Kalan kredi: {user.credits}")
                    else:
                        # Kredi bitti - blur sonuç
                        blur_results = True
                        logger.info(f"User {user.email}: Blur sonuç (kredi yok)")
            
            db.close()
        
        # Waterfall search
        result = await search_service.waterfall_search(str(file_path), user_tier)
        
        # Blur uygula
        if blur_results and result.get("matches"):
            for match in result["matches"]:
                match["blurred"] = True
                match["profile_url"] = None
                match["image_url"] = None
        
        result["blurred"] = blur_results
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Search hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Arama hatası: {str(e)}")


# Provider listesi endpoint'i
@app.get("/api/providers")
async def get_providers():
    """Aktif provider'ların listesi"""
    return {
        "status": "success",
        "providers": search_service.get_available_providers()
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )