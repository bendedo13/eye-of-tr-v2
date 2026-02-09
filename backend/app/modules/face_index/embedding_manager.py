import logging
from dataclasses import dataclass
from typing import List, Optional

import numpy as np

from app.core.config import settings
from app.services.embedding_service import get_embedder, EmbeddingError

logger = logging.getLogger(__name__)


@dataclass
class FaceDetection:
    vector: np.ndarray
    model: str
    bbox: tuple  # (x1, y1, x2, y2)
    det_score: float
    gender: Optional[str] = None
    age: Optional[int] = None


def embed_all_faces(image_bytes: bytes, min_det_score: float = 0.5) -> List[FaceDetection]:
    """Detect and embed ALL faces in an image (not just the largest)."""
    embedder = get_embedder()

    # Check if it's a mock embedder
    if hasattr(embedder, "dim") and not hasattr(embedder, "_app"):
        # MockEmbedder — return a single fake detection
        emb = embedder.embed(image_bytes)
        return [FaceDetection(
            vector=emb.vector,
            model=emb.model,
            bbox=(0, 0, 100, 100),
            det_score=0.99,
            gender=None,
            age=None,
        )]

    # InsightFaceEmbedder path
    import cv2
    data = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(data, cv2.IMREAD_COLOR)
    if img is None:
        raise EmbeddingError("Image decode failed")

    faces = embedder._app.get(img)
    if not faces:
        return []

    max_faces = int(getattr(settings, "FACE_INDEX_MAX_FACES_PER_IMAGE", 10))
    # Sort by detection score descending
    faces = sorted(faces, key=lambda f: float(f.det_score), reverse=True)[:max_faces]

    results = []
    dim = int(settings.FAISS_DIM)
    for face in faces:
        if float(face.det_score) < min_det_score:
            continue
        vec = np.asarray(face.embedding, dtype="float32")
        if vec.shape[0] != dim:
            logger.warning(f"Unexpected embedding dim {vec.shape[0]}, expected {dim}")
            continue
        vec = vec / (np.linalg.norm(vec) + 1e-12)

        gender = None
        if hasattr(face, "gender"):
            gender = "M" if face.gender == 1 else "F"
        age = None
        if hasattr(face, "age"):
            age = int(face.age) if face.age else None

        results.append(FaceDetection(
            vector=vec,
            model=f"insightface:{settings.INSIGHTFACE_MODEL}",
            bbox=tuple(face.bbox.tolist()),
            det_score=float(face.det_score),
            gender=gender,
            age=age,
        ))

    return results
