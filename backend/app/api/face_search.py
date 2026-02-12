from pathlib import Path
import time
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

import logging

from app.core.config import settings
from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.services.credit_service import CreditService
from app.services.embedding_service import EmbeddingError, get_embedder
from app.services.faiss_service import FaissError, get_faiss_store
from app.services.openai_service import get_openai_service
from app.services.search_service import get_search_service

logger = logging.getLogger(__name__)


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


def _resolve_face_meta(face_id: str, db: Session) -> Optional[dict]:
    """Look up indexed face metadata from the face_index module."""
    try:
        from app.modules.face_index.models import IndexedFace, FaceImage, FaceSource
        face = db.query(IndexedFace).filter(IndexedFace.face_id == face_id).first()
        if not face:
            return None
        image = db.query(FaceImage).filter(FaceImage.id == face.image_id).first()
        source = db.query(FaceSource).filter(FaceSource.id == face.source_id).first()
        return {
            "face_id": face.face_id,
            "source_name": source.name if source else "unknown",
            "source_page_url": image.source_page_url if image else None,
            "source_url": image.source_url if image else None,
            "crop_path": face.crop_path,
            "gender": face.gender,
            "age": face.age_estimate,
            "detection_score": face.detection_score,
        }
    except Exception:
        return None


async def _search_local_index(vector, top_k: int, threshold: float, db: Session) -> list:
    """Search the local face index and return formatted match dicts."""
    results = []
    try:
        if not getattr(settings, "FACE_INDEX_ENABLED", True):
            return results
        from app.modules.face_index.vector_store import get_face_index_store
        fi_store = get_face_index_store()
        if fi_store.total_faces() == 0:
            return results
        fi_matches = await fi_store.search(vector, top_k=top_k, threshold=threshold)
        for match in fi_matches:
            meta = _resolve_face_meta(match["face_id"], db)
            if not meta:
                continue
            image_url = f"/dataset/{meta['crop_path']}" if meta.get("crop_path") else None
            results.append({
                "platform": "local_index",
                "username": meta["source_name"],
                "profile_url": meta.get("source_page_url") or meta.get("source_url") or "",
                "image_url": image_url,
                "confidence": match["similarity"] * 100.0,
                "metadata": {
                    "face_id": meta["face_id"],
                    "similarity": match["similarity"],
                    "gender": meta.get("gender"),
                    "age": meta.get("age"),
                    "source": "local_index",
                },
            })
    except Exception as e:
        logger.warning(f"Local face index search failed: {e}")
    return results


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

    # 1. FAISS Search
    try:
        embedder = get_embedder()
        emb = embedder.embed(content)
        logger.info(f"[SEARCH] Embedding created: shape={emb.vector.shape if hasattr(emb.vector, 'shape') else 'unknown'}")
        store = get_faiss_store()
        matches = await store.search(vector=emb.vector, top_k=top_k)
        logger.info(f"[SEARCH] FAISS found {len(matches)} matches with top_k={top_k}")
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

    # 2. Local Face Index Search
    fi_threshold = float(getattr(settings, "FACE_INDEX_SIMILARITY_THRESHOLD", 0.6))
    logger.info(f"[SEARCH] Local index threshold: {fi_threshold}")
    local_matches = await _search_local_index(emb.vector, top_k=top_k, threshold=fi_threshold, db=db)
    logger.info(f"[SEARCH] Local index found {len(local_matches) if local_matches else 0} matches")
    if local_matches:
        matches_out.extend(local_matches)

    # 3. External Waterfall Search (Automatic)
    # Saves file temporarily for external services
    external = None
    providers_used = ["faiss"]
    if local_matches:
        providers_used.append("local_index")

    # 2b. Face++ Fallback (if internal matches are weak)
    best_internal_score = max((m.get("confidence", 0) for m in matches_out), default=0)
    if best_internal_score < settings.FACEPP_THRESHOLD * 100:
        try:
            from app.services.facepp_service import get_facepp_service
            import base64
            facepp = get_facepp_service()
            if facepp.is_available():
                img_b64 = base64.b64encode(content).decode()
                detect_result = await facepp.detect_faces(img_b64)
                if detect_result and detect_result.get("face_count", 0) > 0:
                    providers_used.append("facepp")
                    logger.info(f"Face++ detected {detect_result['face_count']} faces (fallback triggered)")
        except Exception as e:
            logger.debug(f"Face++ fallback skipped: {e}")

    faces_dir = _faces_dir()
    faces_dir.mkdir(parents=True, exist_ok=True)
    query_filename = f"query_{uuid.uuid4()}{ext}"
    query_path = faces_dir / query_filename

    try:
        query_path.write_bytes(content)

        # Use fallback strategy: Try standard providers first, then FaceCheck if needed
        srv = get_search_service()
        ext_result = await srv.waterfall_search(
            str(query_path), 
            user_tier=user.tier or "free", 
            strategy="fallback"
        )
        
        if ext_result.get("status") == "success":
            ext_matches = ext_result.get("matches", [])
            matches_out.extend(ext_matches)
            
            used = ext_result.get("providers_used", [])
            for p in used:
                if p not in providers_used:
                    providers_used.append(p)
                    
            external = ext_result.get("external") # Might be None, just mapping fields if needed

    except Exception as e:
        # Log error but don't fail the whole request
        print(f"External search failed: {e}")
    finally:
        try:
            if query_path.exists():
                query_path.unlink()
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

    # 2. Local Face Index Search
    fi_threshold = max(float(getattr(settings, "FACE_INDEX_SIMILARITY_THRESHOLD", 0.6)), confidence_threshold)
    local_matches = await _search_local_index(emb.vector, top_k=top_k, threshold=fi_threshold, db=db)
    if local_matches:
        matches_out.extend(local_matches)

    # 3. External Waterfall Search (Automatic)
    external = None
    providers_used = ["faiss"]
    if local_matches:
        providers_used.append("local_index")

    faces_dir = _faces_dir()
    faces_dir.mkdir(parents=True, exist_ok=True)
    query_filename = f"query_{uuid.uuid4()}{ext}"
    query_path = faces_dir / query_filename

    try:
        query_path.write_bytes(content)

        srv = get_search_service()
        ext_result = await srv.waterfall_search(
            str(query_path), 
            user_tier=user.tier or "free", 
            strategy="fallback"
        )
        
        if ext_result.get("status") == "success":
            ext_matches = ext_result.get("matches", [])
            matches_out.extend(ext_matches)
            
            used = ext_result.get("providers_used", [])
            for p in used:
                if p not in providers_used:
                    providers_used.append(p)
    except Exception as e:
        print(f"External search failed: {e}")
    finally:
        try:
            if query_path.exists():
                query_path.unlink()
        except Exception:
            pass

    # Generate AI explanation if enabled
    ai_explanation = None
    error_message = None
    openai_service = get_openai_service()
    
    if enable_ai_explanation:
        if len(matches_out) > 0:
            # Sonuç varsa ve OpenAI aktifse detaylı analiz yap
            if openai_service.is_available():
                try:
                    ai_explanation = await openai_service.analyze_search_results(
                        query="Visual Search Target",
                        results=[{"title": m.get("username"), "confidence": m.get("confidence")} for m in matches_out[:5]]
                    )
                except Exception as e:
                    # Fallback to simple explanation
                    pass
            
            # OpenAI yoksa veya hata verdiyse basit açıklama
            if not ai_explanation:
                ai_explanation = openai_service.generate_search_explanation(
                    matches=matches_out,
                    total_matches=len(matches_out),
                    search_params={
                        "precision": search_precision,
                        "confidence_threshold": confidence_threshold,
                    }
                )
        else:
            # Sonuç yoksa "Gizlilik" senaryosunu uygula (OpenAI olmasa bile fallback döner)
            error_message = await openai_service.get_failure_message("privacy", context="Target Person")

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
        "error_message": error_message, # Frontend için hata/gizlilik mesajı
        "credits_consumed": 2,
    }
