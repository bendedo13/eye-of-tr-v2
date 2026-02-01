from fastapi import Depends, FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import uuid
import logging
from typing import Optional
from pathlib import Path

from app.core.config import settings
from app.db.database import engine, Base
from app.models.user import User  # noqa: F401 - register table with Base
from app.services.search_service import get_search_service
from app.routes.auth import get_current_user, router as auth_router

# Logging ayarla
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI app - Swagger'da Bearer JWT auth görünür
app = FastAPI(
    title=settings.API_TITLE,
    description="Multi-provider face search aggregation service",
    version=settings.API_VERSION,
    debug=settings.DEBUG,
    swagger_ui_parameters={"persistAuthorization": True},
)

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Upload klasörü
UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(exist_ok=True)

# DB tablolarını oluştur
Base.metadata.create_all(bind=engine)

# Auth router - /auth/register, /auth/login, /auth/me
app.include_router(auth_router)

# Search service
search_service = get_search_service()

# Health check endpoint
@app.get("/health")
async def health_check():
    """Sistem sağlık kontrolü"""
    return {
        "status": "healthy",
        "service": "eye-of-tr-api",
        "version": settings.API_VERSION
    }

# Root endpoint
@app.get("/")
async def root():
    """API bilgileri"""
    return {
        "service": "Eye of TR Face Search API",
        "version": settings.API_VERSION,
        "endpoints": {
            "health": "/health",
            "auth": "/auth",
            "upload": "/api/upload",
            "search": "/api/search",
            "providers": "/api/providers",
            "docs": "/docs"
        }
    }

# Upload endpoint - JWT zorunlu
@app.post("/api/upload")
async def upload_image(
    file: UploadFile = File(...),
    _: User = Depends(get_current_user),
):
    """Fotoğraf yükleme endpoint'i"""
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
        
        logger.info(f"Dosya yüklendi: {unique_filename} ({len(contents)} bytes)")
        
        return {
            "status": "success",
            "filename": unique_filename,
            "path": str(file_path),
            "size_bytes": len(contents)
        }
        
    except Exception as e:
        logger.error(f"Upload hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Dosya yükleme hatası: {str(e)}")

# Search endpoint - JWT zorunlu
@app.post("/api/search")
async def search_face(
    filename: str,
    provider: Optional[str] = None,
    _: User = Depends(get_current_user),
):
    """Yüz arama endpoint'i"""
    try:
        file_path = UPLOAD_DIR / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Dosya bulunamadı")
        
        # Provider belirtilmişse sadece onda ara
        if provider:
            result = await search_service.search_provider(str(file_path), provider)
        else:
            # Tüm provider'larda ara
            result = await search_service.search_all(str(file_path))
        
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