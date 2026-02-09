import hashlib
import logging
import uuid
from pathlib import Path
from typing import Optional

import numpy as np
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.face_index.models import FaceImage, IndexedFace, FaceSource
from app.modules.face_index.embedding_manager import embed_all_faces, FaceDetection
from app.modules.face_index.vector_store import get_face_index_store

logger = logging.getLogger(__name__)


def _dataset_root() -> Path:
    backend_root = Path(__file__).resolve().parents[3]
    base = Path(getattr(settings, "FACE_INDEX_DIR", "dataset"))
    return base if base.is_absolute() else (backend_root / base)


def _source_dir(source_name: str) -> Path:
    safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in source_name).strip("_")
    return _dataset_root() / "sources" / safe_name


def crop_face_bytes(image_bytes: bytes, bbox: tuple) -> Optional[bytes]:
    """Crop a face from image bytes given a bounding box (x1, y1, x2, y2)."""
    try:
        import cv2
        data = np.frombuffer(image_bytes, dtype=np.uint8)
        img = cv2.imdecode(data, cv2.IMREAD_COLOR)
        if img is None:
            return None
        h, w = img.shape[:2]
        x1 = max(0, int(bbox[0]))
        y1 = max(0, int(bbox[1]))
        x2 = min(w, int(bbox[2]))
        y2 = min(h, int(bbox[3]))
        if x2 <= x1 or y2 <= y1:
            return None
        # Add 10% padding
        pad_x = int((x2 - x1) * 0.1)
        pad_y = int((y2 - y1) * 0.1)
        x1 = max(0, x1 - pad_x)
        y1 = max(0, y1 - pad_y)
        x2 = min(w, x2 + pad_x)
        y2 = min(h, y2 + pad_y)
        crop = img[y1:y2, x1:x2]
        _, buf = cv2.imencode(".jpg", crop, [cv2.IMWRITE_JPEG_QUALITY, 90])
        return buf.tobytes()
    except Exception as e:
        logger.warning(f"Face crop failed: {e}")
        return None


async def process_image(image_id: int, db: Session) -> int:
    """Full pipeline for one downloaded image: detect -> embed -> index.
    Returns number of faces indexed.
    """
    image: Optional[FaceImage] = db.query(FaceImage).filter(FaceImage.id == image_id).first()
    if not image:
        return 0

    source: Optional[FaceSource] = db.query(FaceSource).filter(FaceSource.id == image.source_id).first()
    if not source:
        return 0

    raw_path = _dataset_root() / image.local_path if image.local_path else None
    if not raw_path or not raw_path.exists():
        logger.warning(f"Image file not found: {raw_path}")
        return 0

    image_bytes = raw_path.read_bytes()
    min_det = float(getattr(settings, "FACE_INDEX_MIN_FACE_DET_SCORE", 0.5))

    try:
        faces = embed_all_faces(image_bytes, min_det_score=min_det)
    except Exception as e:
        logger.warning(f"Face detection failed for image {image_id}: {e}")
        image.faces_count = 0
        db.commit()
        return 0

    if not faces:
        image.faces_count = 0
        db.commit()
        return 0

    store = get_face_index_store()
    faces_dir = _source_dir(source.name) / "faces"
    faces_dir.mkdir(parents=True, exist_ok=True)

    indexed_count = 0
    for det in faces:
        face_id = str(uuid.uuid4())

        # Crop face
        crop_rel_path = None
        crop_bytes = crop_face_bytes(image_bytes, det.bbox)
        if crop_bytes:
            crop_filename = f"{face_id}.jpg"
            crop_full_path = faces_dir / crop_filename
            crop_full_path.write_bytes(crop_bytes)
            crop_rel_path = str(crop_full_path.relative_to(_dataset_root()))

        # Add to FAISS index
        vector_idx = await store.add(det.vector, face_id)

        # DB record
        indexed_face = IndexedFace(
            image_id=image.id,
            source_id=image.source_id,
            face_id=face_id,
            vector_idx=vector_idx,
            bbox_x1=det.bbox[0],
            bbox_y1=det.bbox[1],
            bbox_x2=det.bbox[2],
            bbox_y2=det.bbox[3],
            gender=det.gender,
            age_estimate=det.age,
            detection_score=det.det_score,
            embedding_model=det.model,
            embedding_version=int(getattr(settings, "FACE_INDEX_EMBEDDING_VERSION", 1)),
            crop_path=crop_rel_path,
        )
        db.add(indexed_face)
        indexed_count += 1

    image.faces_count = indexed_count
    db.commit()
    return indexed_count


def store_downloaded_image(
    source: FaceSource,
    job_id: int,
    source_url: str,
    page_url: Optional[str],
    image_bytes: bytes,
    content_type: str,
    db: Session,
) -> Optional[FaceImage]:
    """Save a downloaded image to disk and create a DB record. Returns None if duplicate."""
    url_hash = hashlib.sha256(source_url.encode()).hexdigest()
    image_hash = hashlib.sha256(image_bytes).hexdigest()

    # Dedup by URL
    existing = db.query(FaceImage).filter(FaceImage.url_hash == url_hash).first()
    if existing:
        return None

    # Dedup by content
    existing = db.query(FaceImage).filter(FaceImage.image_hash == image_hash).first()
    if existing:
        return None

    # Determine extension
    ext_map = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif"}
    ext = ext_map.get(content_type, ".jpg")
    filename = f"{uuid.uuid4()}{ext}"

    raw_dir = _source_dir(source.name) / "raw_images"
    raw_dir.mkdir(parents=True, exist_ok=True)
    file_path = raw_dir / filename
    file_path.write_bytes(image_bytes)

    rel_path = str(file_path.relative_to(_dataset_root()))

    # Get image dimensions
    width, height = None, None
    try:
        from PIL import Image as PILImage
        import io
        img = PILImage.open(io.BytesIO(image_bytes))
        width, height = img.size
    except Exception:
        pass

    record = FaceImage(
        source_id=source.id,
        job_id=job_id,
        source_url=source_url,
        source_page_url=page_url,
        url_hash=url_hash,
        image_hash=image_hash,
        local_path=rel_path,
        width=width,
        height=height,
        file_size_bytes=len(image_bytes),
        content_type=content_type,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
