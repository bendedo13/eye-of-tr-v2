import os
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from app.api.deps import get_current_user
from app.core.config import settings
from app.models.user import User
from app.adapters.rapidapi_image_search_adapter import get_rapidapi_image_search_adapter
from app.adapters.serpapi_lens_adapter import get_serpapi_lens_adapter


router = APIRouter(prefix="/api/external-search", tags=["external-search"])


def _require_admin(user: User) -> None:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


@router.get("/status")
async def external_search_status(user: User = Depends(get_current_user)):
    _require_admin(user)
    return {
        "serpapi": {
            "configured": bool(settings.SERPAPI_API_KEY),
            "engine": settings.SERPAPI_ENGINE,
            "public_base_url_configured": bool((settings.PUBLIC_BASE_URL or "").strip()),
        },
        "rapidapi": {
            "configured": bool(settings.RAPIDAPI_KEY),
            "host": settings.RAPIDAPI_HOST,
            "endpoint": settings.RAPIDAPI_IMAGE_SEARCH_ENDPOINT,
        },
    }


@router.get("/rapidapi/images")
async def rapidapi_image_search(
    q: str = Query(..., min_length=1, max_length=200),
    limit: int = Query(default=25, ge=1, le=100),
    user: User = Depends(get_current_user),
):
    _require_admin(user)
    adapter = get_rapidapi_image_search_adapter(
        {
            "api_key": settings.RAPIDAPI_KEY,
            "host": settings.RAPIDAPI_HOST,
            "endpoint": settings.RAPIDAPI_IMAGE_SEARCH_ENDPOINT,
            "timeout": 30,
        }
    )
    res = await adapter.search(q, limit=limit)
    return res.to_dict()


@router.get("/serpapi/lens")
async def serpapi_google_lens_from_url(
    image_url: str = Query(..., min_length=8, max_length=2000),
    user: User = Depends(get_current_user),
):
    _require_admin(user)
    adapter = get_serpapi_lens_adapter(
        {
            "api_key": settings.SERPAPI_API_KEY,
            "engine": settings.SERPAPI_ENGINE,
            "gl": settings.SERPAPI_GL,
            "hl": settings.SERPAPI_HL,
            "timeout": settings.SERPAPI_TIMEOUT,
        }
    )
    res = await adapter.search_by_image_url(image_url)
    return res.to_dict()


@router.post("/serpapi/lens/file")
async def serpapi_google_lens_from_file(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    _require_admin(user)
    suffix = Path(file.filename or "upload.jpg").suffix.lower() or ".jpg"
    allowed = {".jpg", ".jpeg", ".png", ".webp"}
    if suffix not in allowed:
        raise HTTPException(status_code=400, detail=f"Desteklenmeyen dosya formatı: {suffix}")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Boş dosya")

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as f:
            f.write(content)
            tmp_path = f.name

        adapter = get_serpapi_lens_adapter(
            {
                "api_key": settings.SERPAPI_API_KEY,
                "engine": settings.SERPAPI_ENGINE,
                "gl": settings.SERPAPI_GL,
                "hl": settings.SERPAPI_HL,
                "timeout": settings.SERPAPI_TIMEOUT,
                "public_base_url": settings.PUBLIC_BASE_URL,
            }
        )
        res = await adapter.search(tmp_path)
        return res.to_dict()
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass
