import time
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import decode_token
from app.db.database import SessionLocal
from app.models.user import User
from app.models.search_results import SearchResult
from app.services.analytics_service import AnalyticsService
from app.services.credit_service import CreditService
from app.services.image_validation import validate_image_upload
from app.services.reverse_search_service import prepare_reverse_search, reverse_search_cached, run_reverse_search


router = APIRouter(prefix="/api/reverse-search", tags=["reverse-search"])
security = HTTPBearer(auto_error=False)


@router.post("")
async def reverse_search(
    file: UploadFile = File(...),
    hint: Optional[str] = None,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
):
    started = time.time()
    content = await file.read()

    try:
        _ = validate_image_upload(filename=file.filename or "upload.jpg", content_type=file.content_type, data=content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    user_id = None
    blur_results = False
    has_credit = False

    if credentials:
        user_id = decode_token(credentials.credentials)

    db = SessionLocal()
    try:
        if user_id:
            user = db.query(User).filter(User.id == int(user_id)).first()
            if user and user.credits > 0:
                CreditService.consume_credit(user, db, 1)
                has_credit = True
                blur_results = False
            else:
                has_credit = False
                blur_results = True

        if blur_results:
            run = await prepare_reverse_search(content, file.filename or "upload.jpg")
            result = await run_reverse_search(run=run, hint=hint, timeout_s=30)
        else:
            run = None
            result = await reverse_search_cached(image_bytes=content, filename=file.filename or "upload.jpg", hint=hint)

        if blur_results and result.get("matches"):
            for m in result["matches"]:
                m["profile_url"] = "🔒 Abonelik için satın al"
                m["image_url"] = None
                m["username"] = "🔒 Gizli"
                m["confidence"] = 0.0
                m["confidence_components"] = {}

        result["blurred"] = blur_results
        result["has_credit"] = has_credit
        result["redirect_to_pricing"] = blur_results

        duration_ms = int((time.time() - started) * 1000)
        try:
            db.add(
                SearchResult(
                    id=str(result.get("search_id")),
                    user_id=int(user_id) if user_id else None,
                    image_sha256=str(result.get("image_sha256") or ""),
                    ahash=str(result.get("ahash") or ""),
                    phash=str(result.get("phash") or ""),
                    hint=(hint or "").strip() or None,
                    results=result,
                )
            )
            db.commit()
        except Exception:
            db.rollback()

        AnalyticsService.log_search(
            db=db,
            user_id=int(user_id) if user_id else None,
            search_type="reverse_image",
            results_found=int(result.get("total_matches") or 0),
            is_successful=int(result.get("total_matches") or 0) > 0,
            was_blurred=blur_results,
            query=hint,
            file_name=(run.stored_filename if run else None),
            providers_used=",".join([p.get("provider") for p in result.get("providers", []) if p.get("provider")]),
            search_duration_ms=duration_ms,
            credits_used=1 if has_credit else 0,
        )

        return {"status": "success", **result}
    finally:
        db.close()
