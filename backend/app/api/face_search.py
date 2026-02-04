from pathlib import Path
import time
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.config import settings
from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.services.credit_service import CreditService
from app.services.embedding_service import EmbeddingError, get_embedder
from app.services.faiss_service import FaissError, get_faiss_store
from app.services.openai_service import get_openai_service


class AdvancedSearchParams(BaseModel):
    """Advanced search parameters"""
    search_precision: str = Field(default="medium", pattern="^(low|medium|high)$")
    region_filter: Optional[str] = Field(default=None, max_length=10)
    confidence_threshold: float = Field(default=0.5, ge=0.0, le=1.0)
    max_results: int = Field(default=10, ge=1, le=50)
    enable_ai_explanation: bool = Field(default=False)



router = APIRouter(tags=["face-search"])


def _backend_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _faces_dir() -> Path:
    return (_backend_root() / settings.UPLOAD_DIR / "faces").resolve()


def _validate_image_filename(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    allowed = {".jpg", ".jpeg", ".png", ".webp"}
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Desteklenmeyen dosya formatı: {ext}")
    return ext


@router.post("/upload-face")
async def upload_face(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    faces_dir = _faces_dir()
    faces_dir.mkdir(parents=True, exist_ok=True)

    ext = _validate_image_filename(file.filename or "upload.jpg")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Boş dosya")
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="Dosya boyutu limiti aşıldı")

    filename = f"{uuid.uuid4()}{ext}"

    try:
        embedder = get_embedder()
        emb = embedder.embed(content)
        store = get_faiss_store()
        item = await store.add(vector=emb.vector, filename=filename, file_path="", model=emb.model)
    except EmbeddingError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except FaissError as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "status": "success",
        "face_id": item.face_id,
        "filename": filename,
        "model": item.model,
        "image_url": None,
    }


@router.post("/search-face")
async def search_face(
    file: UploadFile = File(...),
    top_k: int = Query(default=settings.FAISS_TOP_K_DEFAULT, ge=1, le=50),
    include_facecheck: bool = Query(default=False),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    started = time.time()
    ext = _validate_image_filename(file.filename or "query.jpg")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Boş dosya")
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="Dosya boyutu limiti aşıldı")

    ok = CreditService.consume_credit(user, db, 1)
    if not ok:
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Insufficient credits")

    try:
        embedder = get_embedder()
        emb = embedder.embed(content)
        store = get_faiss_store()
        matches = await store.search(vector=emb.vector, top_k=top_k)
    except EmbeddingError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except FaissError as e:
        raise HTTPException(status_code=500, detail=str(e))

    matches_out = []
    for dist, meta in matches:
        similarity = 1.0 / (1.0 + float(dist))
        matches_out.append(
            {
                "platform": "faiss",
                "username": meta.get("filename") or meta.get("face_id"),
                "profile_url": f"/uploads/faces/{meta.get('filename')}",
                "image_url": None,
                "confidence": float(similarity) * 100.0,
                "metadata": {
                    "face_id": meta.get("face_id"),
                    "distance": float(dist),
                    "similarity": float(similarity),
                    "model": meta.get("model"),
                },
            }
        )

    external = None
    providers_used = ["faiss"]
    if include_facecheck and settings.FACECHECK_ENABLED and settings.FACECHECK_API_KEY:
        from app.adapters.facecheck_adapter import get_facecheck_adapter

        faces_dir = _faces_dir()
        faces_dir.mkdir(parents=True, exist_ok=True)
        query_filename = f"query_{uuid.uuid4()}{ext}"
        query_path = faces_dir / query_filename
        query_path.write_bytes(content)

        try:
            adapter = get_facecheck_adapter(
                {
                    "api_key": settings.FACECHECK_API_KEY,
                    "api_url": settings.FACECHECK_API_URL,
                    "timeout": 60,
                }
            )
            external_res = await adapter.search_with_timing(str(query_path))
            external = external_res.to_dict()
            providers_used.append("facecheck")
        finally:
            try:
                query_path.unlink(missing_ok=True)
            except Exception:
                pass

    elapsed_ms = int((time.time() - started) * 1000)
    return {
        "status": "success",
        "query_file": "uploaded",
        "total_matches": len(matches_out),
        "matches": matches_out,
        "providers_used": providers_used,
        "search_time_ms": elapsed_ms,
        "external": external,
    }


@router.post("/search-face-advanced")
async def search_face_advanced(
    file: UploadFile = File(...),
    search_precision: str = Query(default="medium", regex="^(low|medium|high)$"),
    region_filter: Optional[str] = Query(default=None, max_length=10),
    confidence_threshold: float = Query(default=0.5, ge=0.0, le=1.0),
    max_results: int = Query(default=10, ge=1, le=50),
    enable_ai_explanation: bool = Query(default=False),
    include_facecheck: bool = Query(default=False),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Advanced face search with enhanced parameters and AI-powered explanations.
    
    Consumes 2 credits (vs 1 credit for normal search).
    
    Parameters:
    - search_precision: "low" (more results), "medium" (balanced), "high" (fewer, higher quality)
    - region_filter: Optional geographical filter (e.g., "TR", "US")
    - confidence_threshold: Minimum confidence score (0.0-1.0) to include in results
    - max_results: Maximum number of results to return
    - enable_ai_explanation: Generate AI-powered explanation of results
    - include_facecheck: Include external FaceCheck API results
    """
    started = time.time()
    ext = _validate_image_filename(file.filename or "query.jpg")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Boş dosya")
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="Dosya boyutu limiti aşıldı")

    # Advanced search consumes 2 credits
    ok = CreditService.consume_credit(user, db, 2)
    if not ok:
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Insufficient credits")

    # Map precision to top_k
    precision_map = {
        "low": 15,
        "medium": 10,
        "high": 5
    }
    top_k = min(precision_map.get(search_precision, 10), max_results)

    try:
        embedder = get_embedder()
        emb = embedder.embed(content)
        store = get_faiss_store()
        matches = await store.search(vector=emb.vector, top_k=top_k)
    except EmbeddingError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except FaissError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Process and filter matches
    matches_out = []
    for dist, meta in matches:
        similarity = 1.0 / (1.0 + float(dist))
        confidence = float(similarity) * 100.0
        
        # Apply confidence threshold filter
        if similarity < confidence_threshold:
            continue
        
        match_data = {
            "platform": "faiss",
            "username": meta.get("filename") or meta.get("face_id"),
            "profile_url": f"/uploads/faces/{meta.get('filename')}",
            "image_url": None,
            "confidence": confidence,
            "metadata": {
                "face_id": meta.get("face_id"),
                "distance": float(dist),
                "similarity": float(similarity),
                "model": meta.get("model"),
            },
        }
        
        # Apply region filter if specified (placeholder for future enhancement)
        # In production, this would check metadata for region information
        if region_filter:
            # For now, we don't have region data, so we just pass through
            # Future: check meta.get("region") == region_filter
            pass
        
        matches_out.append(match_data)
    
    # Limit to max_results
    matches_out = matches_out[:max_results]

    # Include external FaceCheck if requested
    external = None
    providers_used = ["faiss"]
    if include_facecheck and settings.FACECHECK_ENABLED and settings.FACECHECK_API_KEY:
        from app.adapters.facecheck_adapter import get_facecheck_adapter

        faces_dir = _faces_dir()
        faces_dir.mkdir(parents=True, exist_ok=True)
        query_filename = f"query_{uuid.uuid4()}{ext}"
        query_path = faces_dir / query_filename
        query_path.write_bytes(content)

        try:
            adapter = get_facecheck_adapter(
                {
                    "api_key": settings.FACECHECK_API_KEY,
                    "api_url": settings.FACECHECK_API_URL,
                    "timeout": 60,
                }
            )
            external_res = await adapter.search_with_timing(str(query_path))
            external = external_res.to_dict()
            providers_used.append("facecheck")
        finally:
            try:
                query_path.unlink(missing_ok=True)
            except Exception:
                pass

    # Generate AI explanation if enabled
    ai_explanation = None
    if enable_ai_explanation:
        openai_service = get_openai_service()
        if openai_service.is_available():
            ai_explanation = openai_service.generate_search_explanation(
                matches=matches_out,
                total_matches=len(matches_out),
                search_params={
                    "precision": search_precision,
                    "confidence_threshold": confidence_threshold,
                }
            )

    elapsed_ms = int((time.time() - started) * 1000)
    return {
        "status": "success",
        "query_file": "uploaded",
        "total_matches": len(matches_out),
        "matches": matches_out,
        "providers_used": providers_used,
        "search_time_ms": elapsed_ms,
        "external": external,
        "advanced_search": True,
        "search_params": {
            "precision": search_precision,
            "confidence_threshold": confidence_threshold,
            "max_results": max_results,
            "ai_enabled": enable_ai_explanation,
        },
        "ai_explanation": ai_explanation,
        "credits_consumed": 2,
    }
