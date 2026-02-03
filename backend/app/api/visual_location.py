import os
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.database import get_db
from app.models.user import User
from app.modules.visual_location.schemas import ComplianceCheck, LocationEvidence, VisualLocationPrediction, VisualSimilarityLocationReport, VisualMatch
from app.modules.visual_location.service import MANDATORY_NOTICE_TR, visual_similarity_location_service
from app.modules.visual_location.spam_guard import spam_guard
from app.modules.visual_location.web_location import combine_candidates, extract_location_from_urls
from app.services.credit_service import CreditService
from app.services.search_service import get_search_service


router = APIRouter(prefix="/api/visual-location", tags=["visual-location"])


def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _validate_image_filename(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    allowed = {".jpg", ".jpeg", ".png", ".webp"}
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Desteklenmeyen dosya formatı: {ext}")
    return ext


def _to_visual_match(m: dict, *, provider: str) -> VisualMatch:
    sim = m.get("similarity")
    conf = m.get("confidence")
    if isinstance(sim, (int, float)):
        similarity_percent = float(max(0.0, min(100.0, float(sim))))
    elif isinstance(conf, (int, float)):
        similarity_percent = float(max(0.0, min(100.0, float(conf))))
    else:
        similarity_percent = 50.0

    confidence_0_1 = float(max(0.0, min(1.0, similarity_percent / 100.0)))
    return VisualMatch(
        provider=provider,
        source_url=m.get("profile_url") or m.get("url") or m.get("source_url"),
        image_url=m.get("image_url"),
        title=m.get("username") or m.get("title"),
        similarity_percent=similarity_percent,
        confidence_0_1=confidence_0_1,
        location_hint=None,
    )


@router.post("/analyze", response_model=VisualSimilarityLocationReport)
async def analyze_visual_location(
    request: Request,
    file: UploadFile = File(...),
    consent: bool = Form(...),
    device_id: str = Form(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not consent:
        raise HTTPException(status_code=400, detail="Kullanıcı onayı olmadan analiz başlatılamaz")
    if not device_id or len(device_id) < 6:
        raise HTTPException(status_code=400, detail="Invalid device")

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
        per_minute_limit=settings.VISUAL_LOCATION_SPAM_PER_MINUTE,
        per_day_limit=settings.VISUAL_LOCATION_SPAM_PER_DAY,
    )
    if not ok_spam:
        raise HTTPException(status_code=429, detail="Çok fazla istek. Lütfen biraz sonra tekrar deneyin.")

    ok = CreditService.consume_credit(user, db, 1)
    if not ok:
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Insufficient credits")

    tmp_path = None
    providers_used = []
    matches: list[VisualMatch] = []
    predicted_location = VisualLocationPrediction(country="Bilinmiyor")
    confidence_0_1 = 0.2
    location_sources: list[LocationEvidence] = []

    try:
        canary_percent = int(getattr(settings, "VISUAL_LOCATION_CANARY_PERCENT", 0) or 0)
        in_canary = canary_percent > 0 and (int(user.id) % 100) < canary_percent
        ab_variant = "A" if in_canary else "B"

        inferred = visual_similarity_location_service.infer_from_local_index(content, top_k=10)
        providers_used.extend(inferred.providers_used)
        matches.extend(inferred.matches)
        predicted_location = inferred.predicted_location
        confidence_0_1 = inferred.confidence_0_1

        exif_loc = visual_similarity_location_service.extract_exif_gps(content)
        if exif_loc and isinstance(exif_loc.latitude, (int, float)) and isinstance(exif_loc.longitude, (int, float)):
            predicted_location = exif_loc
            confidence_0_1 = max(confidence_0_1, 0.55)
            location_sources.append(LocationEvidence(source="exif", confidence_0_1=0.9, url=None))

        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as f:
            f.write(content)
            tmp_path = f.name

        search_service = get_search_service()
        web_result = await search_service.waterfall_search(tmp_path, user_tier=user.tier, strategy="fallback")
        providers_used.extend(web_result.get("providers_used", []) or [])
        for m in web_result.get("matches", []) or []:
            matches.append(_to_visual_match(m, provider=str(m.get("platform", "web"))))

        matches.sort(key=lambda x: x.similarity_percent, reverse=True)
        matches = matches[:20]

        enable_web = bool(getattr(settings, "VISUAL_LOCATION_WEB_LOCATION_ENABLED", False)) or (ab_variant == "A")
        if enable_web and (predicted_location.latitude is None or predicted_location.longitude is None):
            urls = [m.source_url for m in matches if m.source_url]
            web_candidates = await extract_location_from_urls(urls, timeout_s=1.1)
            predicted_location, confidence_0_1, evidences = combine_candidates(
                base=(predicted_location, confidence_0_1),
                exif=exif_loc,
                web_candidates=web_candidates,
            )
            location_sources.extend(evidences)
        elif predicted_location and isinstance(predicted_location.latitude, (int, float)) and isinstance(predicted_location.longitude, (int, float)):
            location_sources.append(LocationEvidence(source="local_index", confidence_0_1=float(confidence_0_1), url=None))

        providers_used = sorted(list(set([p for p in providers_used if p])))
        compliance = ComplianceCheck(
            consent_required=True,
            consent_received=True,
            images_stored=False,
            credits_consumed=1,
            providers_used=providers_used,
            trace_id=getattr(request.state, "trace_id", None),
            ab_variant=ab_variant,
        )

        return VisualSimilarityLocationReport(
            predicted_location=predicted_location,
            confidence_0_1=float(max(0.0, min(1.0, confidence_0_1))),
            matches=matches,
            location_sources=location_sources,
            compliance=compliance,
            mandatory_notice=MANDATORY_NOTICE_TR,
        )
    except HTTPException:
        CreditService.add_credits(user, db, 1, reason="visual_location_refund")
        raise
    except Exception:
        CreditService.add_credits(user, db, 1, reason="visual_location_refund")
        raise HTTPException(status_code=500, detail="Analiz başarısız")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass
