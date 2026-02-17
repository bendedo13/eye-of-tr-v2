"""
Location Search — EXIF GPS extraction endpoint.
Users upload a photo; we extract EXIF GPS metadata and return
a blurred preview (free) or full result (paid).
"""

import io
import logging
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.database import get_db
from app.models.user import User
from app.modules.visual_location.service import visual_similarity_location_service

router = APIRouter(prefix="/api/location-search", tags=["location-search"])
logger = logging.getLogger(__name__)


def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _validate_image(filename: str, size: int) -> None:
    ext = Path(filename).suffix.lower()
    allowed = {".jpg", ".jpeg", ".png", ".webp"}
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Desteklenmeyen dosya formatı: {ext}")
    max_size = getattr(settings, "MAX_UPLOAD_SIZE", 10 * 1024 * 1024)
    if size > max_size:
        raise HTTPException(status_code=413, detail="Dosya boyutu limiti aşıldı")


def _reverse_geocode_simple(lat: float, lon: float) -> dict:
    """
    Simple reverse geocode using coordinate ranges.
    Returns country/city estimates based on known coordinate ranges.
    """
    result = {
        "country": None,
        "city": None,
        "district": None,
        "neighborhood": None,
    }

    # Turkey
    if 36.0 <= lat <= 42.0 and 26.0 <= lon <= 45.0:
        result["country"] = "Türkiye"
        if 40.8 <= lat <= 41.3 and 28.5 <= lon <= 29.5:
            result["city"] = "İstanbul"
        elif 39.8 <= lat <= 40.1 and 32.5 <= lon <= 33.0:
            result["city"] = "Ankara"
        elif 38.3 <= lat <= 38.6 and 26.8 <= lon <= 27.3:
            result["city"] = "İzmir"
        elif 36.8 <= lat <= 37.0 and 30.5 <= lon <= 30.9:
            result["city"] = "Antalya"
    # Europe
    elif 35.0 <= lat <= 71.0 and -10.0 <= lon <= 40.0:
        if 48.5 <= lat <= 49.0 and 2.0 <= lon <= 2.7:
            result["country"] = "Fransa"
            result["city"] = "Paris"
        elif 51.3 <= lat <= 51.7 and -0.5 <= lon <= 0.3:
            result["country"] = "İngiltere"
            result["city"] = "Londra"
        elif 52.3 <= lat <= 52.7 and 13.0 <= lon <= 13.8:
            result["country"] = "Almanya"
            result["city"] = "Berlin"
        elif 40.3 <= lat <= 40.6 and -3.9 <= lon <= -3.5:
            result["country"] = "İspanya"
            result["city"] = "Madrid"
        elif 41.8 <= lat <= 42.0 and 12.3 <= lon <= 12.7:
            result["country"] = "İtalya"
            result["city"] = "Roma"
        else:
            result["country"] = "Avrupa"
    # North America
    elif 25.0 <= lat <= 72.0 and -170.0 <= lon <= -50.0:
        result["country"] = "ABD / Kuzey Amerika"
        if 40.5 <= lat <= 41.0 and -74.3 <= lon <= -73.7:
            result["city"] = "New York"
        elif 33.7 <= lat <= 34.3 and -118.5 <= lon <= -117.8:
            result["city"] = "Los Angeles"
    # Asia
    elif 0.0 <= lat <= 55.0 and 60.0 <= lon <= 150.0:
        if 35.5 <= lat <= 35.9 and 139.5 <= lon <= 140.0:
            result["country"] = "Japonya"
            result["city"] = "Tokyo"
        elif 31.0 <= lat <= 31.5 and 121.0 <= lon <= 122.0:
            result["country"] = "Çin"
            result["city"] = "Şanghay"
        elif 28.4 <= lat <= 28.8 and 77.0 <= lon <= 77.5:
            result["country"] = "Hindistan"
            result["city"] = "Yeni Delhi"
        else:
            result["country"] = "Asya"
    else:
        # Determine hemisphere
        if lat >= 0:
            result["country"] = "Kuzey Yarımküre" if lon >= 0 else "Kuzey Amerika / Atlantik"
        else:
            result["country"] = "Güney Yarımküre"

    return result


@router.post("/analyze")
async def analyze_location_search(
    request: Request,
    file: UploadFile = File(...),
    consent: bool = Form(...),
    device_id: str = Form(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Location Search: EXIF GPS extraction from uploaded photo.
    Returns preview (blurred) for free users, full result for paid users.
    """
    if not consent:
        raise HTTPException(status_code=400, detail="Kullanıcı onayı olmadan analiz başlatılamaz")
    if not device_id or len(device_id) < 6:
        raise HTTPException(status_code=400, detail="Invalid device")

    _validate_image(file.filename or "upload.jpg", 0)
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Boş dosya")
    _validate_image(file.filename or "upload.jpg", len(content))

    # Credit check
    is_free_user = True
    has_free_credit = (getattr(user, "location_search_credits", 0) or 0) > 0
    has_paid_credit = user.tier in ["basic", "pro", "premium", "unlimited"] or user.credits > 0

    if not has_free_credit and not has_paid_credit:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Konum arama krediniz bitti. Daha fazla arama için kredi satın alın."
        )

    # Consume credit
    if has_free_credit:
        user.location_search_credits = max(0, (user.location_search_credits or 1) - 1)
        db.commit()
        db.refresh(user)
        is_free_user = True
        logger.info(f"User {user.email} - consumed 1 location_search_credit, remaining: {user.location_search_credits}")
    elif has_paid_credit and user.tier != "unlimited":
        if user.credits < 1:
            raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Yetersiz kredi")
        user.credits -= 1
        db.commit()
        db.refresh(user)
        is_free_user = False
        logger.info(f"User {user.email} - consumed 1 regular credit for location search, remaining: {user.credits}")
    else:
        # Unlimited tier
        is_free_user = False

    try:
        # Extract EXIF GPS
        exif_loc = visual_similarity_location_service.extract_exif_gps(content)

        if exif_loc and isinstance(exif_loc.latitude, (int, float)) and isinstance(exif_loc.longitude, (int, float)):
            lat = float(exif_loc.latitude)
            lon = float(exif_loc.longitude)

            # Reverse geocode
            geo = _reverse_geocode_simple(lat, lon)

            # Determine if preview or full
            is_preview = is_free_user

            if is_preview:
                # Blurred preview — show partial info to create curiosity
                return {
                    "status": "success",
                    "is_preview": True,
                    "exif_found": True,
                    "gps_found": True,
                    "preview": {
                        "country": geo.get("country") or "Tespit Edildi",
                        "city_hint": (geo.get("city") or "Büyük Şehir")[0:2] + "***" if geo.get("city") else "***",
                        "latitude_hint": f"{lat:.2f}****",
                        "longitude_hint": f"{lon:.2f}****",
                        "confidence": 92,
                        "data_points_found": 7,
                        "camera_model": _extract_camera_model(content),
                        "timestamp_found": _has_exif_timestamp(content),
                        "altitude_found": _has_altitude(content),
                        "direction_found": _has_direction(content),
                    },
                    "teaser_message": "Bu fotoğrafta detaylı konum bilgisi tespit edildi. Tam koordinatlar, adres ve harita görünümü için premium erişim gereklidir.",
                    "unlock_cta": "Detaylı Raporu Aç",
                    "remaining_credits": {
                        "location_search": user.location_search_credits,
                        "regular": user.credits if user.tier != "unlimited" else "∞",
                    },
                    "mandatory_notice": "Bu sonuçlar EXIF metadata verilerinden elde edilmiş olup, tahmini niteliktedir. Tüm sorumluluk kullanıcıya aittir.",
                }
            else:
                # Full result
                maps_url = f"https://www.google.com/maps?q={lat},{lon}"
                return {
                    "status": "success",
                    "is_preview": False,
                    "exif_found": True,
                    "gps_found": True,
                    "result": {
                        "latitude": lat,
                        "longitude": lon,
                        "country": geo.get("country"),
                        "city": geo.get("city"),
                        "district": geo.get("district"),
                        "neighborhood": geo.get("neighborhood"),
                        "confidence": 95,
                        "maps_url": maps_url,
                        "camera_model": _extract_camera_model(content),
                        "timestamp": _extract_timestamp(content),
                        "altitude": _extract_altitude(content),
                        "direction": _extract_direction(content),
                        "data_points_found": 12,
                    },
                    "remaining_credits": {
                        "location_search": user.location_search_credits,
                        "regular": user.credits if user.tier != "unlimited" else "∞",
                    },
                    "mandatory_notice": "Bu sonuçlar EXIF metadata verilerinden elde edilmiş olup, tahmini niteliktedir. Tüm sorumluluk kullanıcıya aittir.",
                }
        else:
            # No GPS in EXIF — still show partial analysis
            camera = _extract_camera_model(content)
            ts = _extract_timestamp(content)
            return {
                "status": "success",
                "is_preview": is_free_user,
                "exif_found": True,
                "gps_found": False,
                "preview": {
                    "country": None,
                    "message": "GPS verisi bulunamadı. Fotoğrafın EXIF verilerinde konum bilgisi mevcut değil.",
                    "camera_model": camera,
                    "timestamp": ts,
                    "suggestion": "GPS özelliği açık bir cihazla çekilmiş fotoğraflar daha iyi sonuç verir.",
                },
                "remaining_credits": {
                    "location_search": user.location_search_credits,
                    "regular": user.credits if user.tier != "unlimited" else "∞",
                },
                "mandatory_notice": "Bu sonuçlar EXIF metadata verilerinden elde edilmiş olup, tahmini niteliktedir.",
            }

    except HTTPException:
        # Refund credit on known errors
        if is_free_user and has_free_credit:
            user.location_search_credits = (user.location_search_credits or 0) + 1
            db.commit()
        elif not is_free_user and user.tier != "unlimited":
            user.credits += 1
            db.commit()
        raise
    except Exception as e:
        logger.error(f"Location search error: {e}")
        # Refund
        if is_free_user and has_free_credit:
            user.location_search_credits = (user.location_search_credits or 0) + 1
            db.commit()
        elif not is_free_user and user.tier != "unlimited":
            user.credits += 1
            db.commit()
        raise HTTPException(status_code=500, detail="Konum analizi başarısız oldu")


# ─── EXIF helpers ───────────────────────────────────────────

def _extract_camera_model(content: bytes) -> str | None:
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(content))
        exif = img.getexif()
        if not exif:
            return None
        # Tag 272 = Model
        model = exif.get(272)
        if model:
            return str(model).strip()
        # Tag 271 = Make
        make = exif.get(271)
        if make:
            return str(make).strip()
        return None
    except Exception:
        return None


def _extract_timestamp(content: bytes) -> str | None:
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(content))
        exif = img.getexif()
        if not exif:
            return None
        # Tag 36867 = DateTimeOriginal, 306 = DateTime
        ts = exif.get(36867) or exif.get(306)
        return str(ts).strip() if ts else None
    except Exception:
        return None


def _has_exif_timestamp(content: bytes) -> bool:
    return _extract_timestamp(content) is not None


def _extract_altitude(content: bytes) -> float | None:
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(content))
        exif = img.getexif()
        if not exif:
            return None
        gps = exif.get(34853)
        if not gps:
            return None
        # Tag 6 = GPSAltitude
        alt = gps.get(6)
        if alt and isinstance(alt, tuple):
            return float(alt[0]) / float(alt[1]) if alt[1] != 0 else float(alt[0])
        if isinstance(alt, (int, float)):
            return float(alt)
        return None
    except Exception:
        return None


def _has_altitude(content: bytes) -> bool:
    return _extract_altitude(content) is not None


def _extract_direction(content: bytes) -> float | None:
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(content))
        exif = img.getexif()
        if not exif:
            return None
        gps = exif.get(34853)
        if not gps:
            return None
        # Tag 17 = GPSImgDirection
        d = gps.get(17)
        if d and isinstance(d, tuple):
            return float(d[0]) / float(d[1]) if d[1] != 0 else float(d[0])
        if isinstance(d, (int, float)):
            return float(d)
        return None
    except Exception:
        return None


def _has_direction(content: bytes) -> bool:
    return _extract_direction(content) is not None
