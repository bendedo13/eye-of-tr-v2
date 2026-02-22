from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
import uuid
import logging
from typing import Optional
from pathlib import Path

from app.core.config import settings
from app.services.search_service import get_search_service
from app.api.face_search import router as face_search_router
from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.pricing import router as pricing_router
from app.api.location_intelligence import router as location_intelligence_router
from app.api.visual_location import router as visual_location_router
from app.api.admin import router as admin_router
from app.api.public import router as public_router
from app.api.analytics import router as analytics_router
from app.api.data_platform import router as data_platform_router
from app.api.external_search import router as external_search_router
from app.api.reverse_search import router as reverse_search_router
from app.api.lens_analysis import router as lens_analysis_router
from app.api.admin_email_endpoints import router as admin_email_router
from app.api.notifications import router as notifications_router
from app.api.support import router as support_router
from app.api.admin_support import router as admin_support_router
from app.api.investigation import router as investigation_router
from app.api.alan_search import router as alan_search_router
from app.api.location_search import router as location_search_router
from app.db.database import get_engine, Base, SessionLocal  # Use database.py directly
from app.middleware.rate_limit import RateLimitMiddleware

# Import all models for DB table creation
from app.models.user import User, UserProfile
from app.models.notification import Notification, NotificationRead, EmailTemplate, EmailLog
from app.models.subscription import Subscription, Payment
from app.models.analytics import SiteVisit, SearchLog, ReferralLog
from app.models.verification import EmailVerification, DeviceRegistration, IpRegistration, PasswordReset
from app.models.cms import SiteSetting, MediaAsset, BlogPost
from app.models.activity import ActivityDaily
from app.models.provider_metrics import ProviderDailyMetric
from app.models.data_platform import DataSource, CrawlJob, Document
from app.models.search_results import SearchResult
from app.models.admin_audit import AdminAuditLog
from app.models.lens import LensAnalysisLog
from app.models.support import SupportTicket, SupportMessage
from app.models.investigation import InvestigationRequest

# Face Index Module
from app.modules.face_index.models import FaceSource, FaceCrawlJob, FaceImage, IndexedFace, ProxyServer
from app.api.admin_face_index import router as admin_face_index_router

from app.services.websocket_service import get_socket_server, socket_app
from app.modules.face_index.scheduler import start_scheduler

# Logging ayarla
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

if not settings.SECRET_KEY and not settings.DEBUG:
    raise RuntimeError("SECRET_KEY is not configured")

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
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RateLimitMiddleware)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    import time

    trace_id = request.headers.get("x-trace-id") or request.headers.get("x-request-id") or str(uuid.uuid4())
    request.state.trace_id = trace_id
    started = time.perf_counter()
    logger.info(f"🔵 REQUEST: {request.method} {request.url} trace_id={trace_id}")
    response = await call_next(request)
    response.headers["x-trace-id"] = trace_id
    logger.info(f"🟢 RESPONSE: {response.status_code} trace_id={trace_id}")
    try:
        from prometheus_client import Counter, Histogram

        global _REQ_COUNTER, _REQ_LATENCY
        if "_REQ_COUNTER" not in globals():
            _REQ_COUNTER = Counter("faceseek_http_requests_total", "HTTP requests", ["method", "path", "status"])
            _REQ_LATENCY = Histogram("faceseek_http_request_duration_seconds", "HTTP request duration", ["method", "path"])
        path = request.url.path
        _REQ_COUNTER.labels(request.method, path, str(response.status_code)).inc()
        _REQ_LATENCY.labels(request.method, path).observe(max(0.0, time.perf_counter() - started))
    except Exception:
        pass
    return response


@app.get("/metrics")
async def metrics():
    try:
        from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

        return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
    except Exception:
        raise HTTPException(status_code=503, detail="Metrics not configured")

# Upload klasörü
UPLOAD_DIR = (Path(__file__).resolve().parent / settings.UPLOAD_DIR).resolve()
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Static upload serving
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="api-uploads")

# Dataset directory for face index crops
DATASET_DIR = (Path(__file__).resolve().parent / getattr(settings, "FACE_INDEX_DIR", "dataset")).resolve()
DATASET_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/dataset", StaticFiles(directory=str(DATASET_DIR)), name="dataset")

# Search service
search_service = get_search_service()

# Database tablolarını oluştur
Base.metadata.create_all(bind=get_engine())

# Routers
logger.info("=" * 50)
logger.info("ROUTERS YÜKLENİYOR...")
app.include_router(face_search_router, prefix="/api")
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(pricing_router)
app.include_router(location_intelligence_router)
app.include_router(visual_location_router)
app.include_router(admin_router)
app.include_router(public_router)
app.include_router(analytics_router)
app.include_router(data_platform_router)
app.include_router(external_search_router)
app.include_router(reverse_search_router)
app.include_router(lens_analysis_router, prefix="/api/v1") # User requested /api/v1/lens-analysis
app.include_router(admin_email_router)
app.include_router(notifications_router)
app.include_router(support_router)
app.include_router(admin_support_router)
app.include_router(admin_face_index_router)
app.include_router(investigation_router)
app.include_router(alan_search_router)
app.include_router(location_search_router)
logger.info("✅ Face search router: /api/upload-face, /api/search-face")
logger.info(f"✅ AlanSearch router: {alan_search_router.prefix}")
logger.info(f"✅ Auth router: {auth_router.prefix}")
logger.info(f"✅ Dashboard router: {dashboard_router.prefix}")
logger.info(f"✅ Pricing router: {pricing_router.prefix}")
logger.info(f"✅ Location intelligence router: {location_intelligence_router.prefix}")
logger.info(f"✅ Visual location router: {visual_location_router.prefix}")
logger.info(f"✅ Admin router: {admin_router.prefix}")
logger.info(f"✅ Public router: {public_router.prefix}")
logger.info(f"✅ Analytics router: {analytics_router.prefix}")
logger.info(f"✅ Data platform router: {data_platform_router.prefix}")
logger.info(f"✅ External search router: {external_search_router.prefix}")
logger.info(f"✅ Reverse search router: {reverse_search_router.prefix}")
logger.info(f"✅ Lens analysis router: /api/v1/lens-analysis")
logger.info(f"✅ Support router: /api/support")
logger.info(f"✅ Admin support router: /admin/support")
logger.info(f"✅ Location search router: /api/location-search")
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
@app.get("/api/health")
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
            "api_health": "/api/health",
            "upload": "/api/upload",
            "search": "/api/search",
            "providers": "/api/providers",
            "auth": "/api/auth",
            "support": "/api/support",
            "websocket": "/socket.io",
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
                if user.credits > 0:
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
                match["profile_url"] = "🔒 Abonelik için satın al"
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

# WebSocket endpoint
@app.get("/socket.io")
async def socketio_endpoint():
    """Socket.IO endpoint"""
    return {"message": "Socket.IO server is running"}

# Mount Socket.IO app
app.mount("/socket.io", socket_app)

@app.on_event("startup")
def create_initial_data():
    """Başlangıçta admin hesabı oluştur"""
    try:
        db = SessionLocal()
        from app.core.security import get_password_hash
        
        # Admin User
        admin_email = settings.ADMIN_EMAIL or "admin@face-seek.com"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            logger.info(f"Creating default admin user: {admin_email}")
            admin_pass = settings.ADMIN_API_KEY or "Benalan.1" # Fallback password
            user = User(
                email=admin_email,
                username="Admin",
                hashed_password=get_password_hash(admin_pass),
                referral_code="ADMIN001",
                credits=999999,
                tier="basic",
                role="admin",
                is_active=True
            )
            db.add(user)
            db.commit()
            logger.info("Admin user created successfully")
        
        # Start the Face Index scheduler
        start_scheduler()
        
        db.close()
    except Exception as e:
        logger.error(f"Error creating initial data: {e}")



if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
