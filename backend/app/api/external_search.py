import os
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, Query, Request, UploadFile, status

from app.core.config import settings
from app.adapters.rapidapi_image_search_adapter import get_rapidapi_image_search_adapter
from app.adapters.serpapi_lens_adapter import get_serpapi_lens_adapter


router = APIRouter(prefix="/api/external-search", tags=["external-search"])


def _require_admin_key(request: Request) -> str:
    key = request.headers.get("x-admin-key") or ""
    if not settings.ADMIN_API_KEY:
        raise HTTPException(status_code=503, detail="Admin API is not configured")
    if key != settings.ADMIN_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid admin key")
    return key


@router.get("/status")
async def external_search_status(request: Request):
    _require_admin_key(request)
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
    request: Request,
    q: str = Query(..., min_length=1, max_length=200),
    limit: int = Query(default=25, ge=1, le=100),
    size: str | None = Query(default=None, max_length=20),
    color: str | None = Query(default=None, max_length=20),
    type: str | None = Query(default=None, max_length=20),
    time: str | None = Query(default=None, max_length=20),
    usage_rights: str | None = Query(default=None, max_length=30),
    file_type: str | None = Query(default=None, max_length=20),
    aspect_ratio: str | None = Query(default=None, max_length=20),
    safe_search: str | None = Query(default=None, max_length=10),
    region: str | None = Query(default=None, max_length=8),
):
    _require_admin_key(request)
    
    # Erişim kontrolü: Unlimited paketi kontrolü
    user = request.state.user if hasattr(request.state, "user") else None
    if not user or user.tier != "unlimited":
         raise HTTPException(
            status_code=403, 
            detail="Bu özellik sadece Unlimited paket kullanıcıları içindir"
        )

    adapter = get_rapidapi_image_search_adapter(
        {
            "api_key": settings.RAPIDAPI_KEY,
            "host": settings.RAPIDAPI_HOST,
            "endpoint": settings.RAPIDAPI_IMAGE_SEARCH_ENDPOINT,
            "timeout": 30,
        }
    )
    res = await adapter.search(
        q,
        limit=limit,
        params_override={
            "size": size,
            "color": color,
            "type": type,
            "time": time,
            "usage_rights": usage_rights,
            "file_type": file_type,
            "aspect_ratio": aspect_ratio,
            "safe_search": safe_search,
            "region": region,
        },
    )
    return res.to_dict()


@router.get("/serpapi/lens")
async def serpapi_google_lens_from_url(
    request: Request,
    image_url: str = Query(..., min_length=8, max_length=2000),
):
    _require_admin_key(request)
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
    request: Request,
    file: UploadFile = File(...),
):
    _require_admin_key(request)
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
