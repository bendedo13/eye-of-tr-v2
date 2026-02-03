from pathlib import Path
import time
import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile, Query

from app.core.config import settings
from app.services.embedding_service import EmbeddingError, get_embedder
from app.services.faiss_service import FaissError, get_faiss_store


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
):
    faces_dir = _faces_dir()
    faces_dir.mkdir(parents=True, exist_ok=True)

    ext = _validate_image_filename(file.filename or "upload.jpg")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Boş dosya")
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="Dosya boyutu limiti aşıldı")

    filename = f"{uuid.uuid4()}{ext}"
    file_path = faces_dir / filename
    file_path.write_bytes(content)

    try:
        embedder = get_embedder()
        emb = embedder.embed(content)
        store = get_faiss_store()
        item = await store.add(vector=emb.vector, filename=filename, file_path=str(file_path), model=emb.model)
    except EmbeddingError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except FaissError as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "status": "success",
        "face_id": item.face_id,
        "filename": filename,
        "model": item.model,
        "image_url": f"/uploads/faces/{filename}",
    }


@router.post("/search-face")
async def search_face(
    file: UploadFile = File(...),
    top_k: int = Query(default=settings.FAISS_TOP_K_DEFAULT, ge=1, le=50),
    include_facecheck: bool = Query(default=False),
):
    started = time.time()
    ext = _validate_image_filename(file.filename or "query.jpg")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Boş dosya")
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="Dosya boyutu limiti aşıldı")

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
                "image_url": f"/uploads/faces/{meta.get('filename')}",
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
