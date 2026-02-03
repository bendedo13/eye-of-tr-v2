import hashlib
from dataclasses import dataclass
from typing import Optional

import numpy as np

from app.core.config import settings


class EmbeddingError(Exception):
    pass


@dataclass(frozen=True)
class FaceEmbedding:
    vector: np.ndarray
    model: str


class MockEmbedder:
    def __init__(self, dim: int):
        self.dim = dim
        self.model = "mock"

    def embed(self, image_bytes: bytes) -> FaceEmbedding:
        digest = hashlib.sha256(image_bytes).digest()
        seed = int.from_bytes(digest[:8], "little", signed=False)
        rng = np.random.default_rng(seed)
        vec = rng.normal(size=(self.dim,)).astype("float32")
        vec = vec / (np.linalg.norm(vec) + 1e-12)
        return FaceEmbedding(vector=vec, model=self.model)


class InsightFaceEmbedder:
    def __init__(
        self,
        model_name: str,
        dim: int,
        det_thresh: float,
        det_size: tuple[int, int],
        ctx_id: int,
    ):
        import cv2
        import insightface

        self._cv2 = cv2
        self.dim = dim
        self.model = f"insightface:{model_name}"
        self._app = insightface.app.FaceAnalysis(
            name=model_name,
            providers=["CPUExecutionProvider"],
        )
        self._app.prepare(ctx_id=ctx_id, det_thresh=det_thresh, det_size=det_size)

    def embed(self, image_bytes: bytes) -> FaceEmbedding:
        data = np.frombuffer(image_bytes, dtype=np.uint8)
        img = self._cv2.imdecode(data, self._cv2.IMREAD_COLOR)
        if img is None:
            raise EmbeddingError("Görüntü decode edilemedi")

        faces = self._app.get(img)
        if not faces:
            raise EmbeddingError("Yüz bulunamadı")

        def area(f):
            x1, y1, x2, y2 = f.bbox
            return float(max(0.0, x2 - x1) * max(0.0, y2 - y1))

        best = max(faces, key=area)
        vec = np.asarray(best.embedding, dtype="float32")
        if vec.shape[0] != self.dim:
            raise EmbeddingError(f"Beklenen embedding boyutu {self.dim}, gelen {vec.shape[0]}")
        vec = vec / (np.linalg.norm(vec) + 1e-12)
        return FaceEmbedding(vector=vec, model=self.model)


_embedder: Optional[object] = None


def get_embedder():
    global _embedder
    if _embedder is not None:
        return _embedder

    if settings.FACE_EMBEDDER_BACKEND.lower() == "mock":
        _embedder = MockEmbedder(dim=settings.FAISS_DIM)
        return _embedder

    det_size = (settings.INSIGHTFACE_DET_SIZE_W, settings.INSIGHTFACE_DET_SIZE_H)
    try:
        _embedder = InsightFaceEmbedder(
            model_name=settings.INSIGHTFACE_MODEL,
            dim=settings.FAISS_DIM,
            det_thresh=settings.INSIGHTFACE_DET_THRESH,
            det_size=det_size,
            ctx_id=settings.INSIGHTFACE_CTX_ID,
        )
    except ImportError:
        _embedder = MockEmbedder(dim=settings.FAISS_DIM)
    return _embedder
