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
from app.api.dashboard import router as dashboard_router
from app.api.pricing import router as pricing_router
from app.db.database import engine, Base, SessionLocal  # Use database.py directly

# Import all models for DB table creation
from app.models.user import User
from app.models.subscription import Subscription, Payment
from app.models.analytics import SiteVisit, SearchLog, ReferralLog

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

# Routers
logger.info("=" * 50)
logger.info("ROUTERS YÜKLENİYOR...")
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(pricing_router)
logger.info(f"✅ Auth router: {auth_router.prefix}")
logger.info(f"✅ Dashboard router: {dashboard_router.prefix}")
logger.info(f"✅ Pricing router: {pricing_router.prefix}")
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


# Search endpoint - WATERFALL STRATEGY + CREDIT + BLUR + ANALYTICS
@app.post("/api/search")
async def search_face(
    filename: str,
    user_email: Optional[str] = None,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """
    Waterfall yüz arama
    - Credit kontrolü (1 ücretsiz arama, sonra ücretli)
    - Blur uygulama (kredi yoksa)
    - Analytics tracking
    """
    import time
    start_time = time.time()
    
    try:
        file_path = UPLOAD_DIR / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Dosya bulunamadı")
        
        # JWT'den user ID al
        from app.core.security import decode_token
        from app.services.credit_service import CreditService
        from app.services.analytics_service import AnalyticsService
        
        user_id = None
        user_tier = "free"
        blur_results = False
        has_credit = False
        
        if credentials:
            user_id = decode_token(credentials.credentials)
        
        db = SessionLocal()
        
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            
            if user:
                user_tier = user.tier
                
                # Credit kontrolü
                if user_tier == "unlimited":
                    # Sınırsız kullanım
                    has_credit = True
                    blur_results = False
                elif user.credits > 0:
                    # Kredi var - kullan
                    CreditService.consume_credit(user, db, 1)
                    has_credit = True
                    blur_results = False
                    logger.info(f"User {user.email}: Kredi kullanıldı. Kalan: {user.credits}")
                else:
                    # Kredi yok - blur göster ve pricing sayfasına yönlendir
                    has_credit = False
                    blur_results = True
                    logger.warning(f"User {user.email}: Kredi yok! Blur sonuç gösterilecek")
        
        # Waterfall search
        result = await search_service.waterfall_search(str(file_path), user_tier)
        
        # Blur uygula (kredi yoksa)
        if blur_results and result.get("matches"):
            for match in result["matches"]:
                match["blurred"] = True
                match["profile_url"] = "🔒 Premium için satın al"
                match["image_url"] = None
                match["username"] = "🔒 Gizli"
        
        result["blurred"] = blur_results
        result["has_credit"] = has_credit
        result["redirect_to_pricing"] = blur_results
        
        # Search duration
        search_duration_ms = int((time.time() - start_time) * 1000)
        
        # Analytics log
        AnalyticsService.log_search(
            db=db,
            user_id=user_id,
            search_type="face",
            results_found=result.get("total_matches", 0),
            is_successful=result.get("total_matches", 0) > 0,
            was_blurred=blur_results,
            file_name=filename,
            providers_used=",".join(result.get("providers_used", [])),
            search_duration_ms=search_duration_ms,
            credits_used=1 if has_credit else 0
        )
        
        db.close()
        
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