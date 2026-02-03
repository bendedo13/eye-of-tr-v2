from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.database import get_db
from app.models.user import User
from app.modules.location_intelligence.schemas import LocationIntelligenceResult
from app.modules.location_intelligence.service import location_intelligence_service
from app.modules.location_intelligence.spam_guard import spam_guard
from app.services.credit_service import CreditService


router = APIRouter(prefix="/api/location-intelligence", tags=["location-intelligence"])


def _validate_image_filename(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    allowed = {".jpg", ".jpeg", ".png", ".webp"}
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Desteklenmeyen dosya formatı: {ext}")
    return ext


def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


@router.post("/analyze", response_model=LocationIntelligenceResult)
async def analyze_location_intelligence(
    request: Request,
    file: UploadFile = File(...),
    consent: bool = Form(...),
    device_id: str = Form(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kullanıcı onayı olmadan analiz başlatılamaz",
        )

    if not device_id or len(device_id) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid device")

    _validate_image_filename(file.filename or "upload.jpg")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Boş dosya")
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="Dosya boyutu limiti aşıldı")

    ip = _client_ip(request)
    ok_spam = await spam_guard.allow(
        ip=ip,
        device_id=device_id,
        per_minute_limit=settings.LOCATION_INTELLIGENCE_SPAM_PER_MINUTE,
        per_day_limit=settings.LOCATION_INTELLIGENCE_SPAM_PER_DAY,
    )
    if not ok_spam:
        raise HTTPException(status_code=429, detail="Çok fazla istek. Lütfen biraz sonra tekrar deneyin.")

    ok = CreditService.consume_credit(user, db, 1)
    if not ok:
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Insufficient credits")

    try:
        result = location_intelligence_service.analyze(content)
    except ValueError as e:
        CreditService.add_credits(user, db, 1, reason="location_intelligence_refund")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception:
        CreditService.add_credits(user, db, 1, reason="location_intelligence_refund")
        raise HTTPException(status_code=500, detail="Analiz başarısız")

    return result

