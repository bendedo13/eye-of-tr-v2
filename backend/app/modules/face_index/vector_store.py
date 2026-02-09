import asyncio
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np

from app.core.config import settings

logger = logging.getLogger(__name__)


class FaceIndexStore:
    """Dedicated FAISS store for crawled face index, separate from user-uploaded FaissStore."""

    def __init__(self):
        self._lock = asyncio.Lock()
        self._index = None
        self._face_ids: List[str] = []
        self._dim = int(settings.FAISS_DIM)
        backend_root = Path(__file__).resolve().parents[3]
        base = Path(getattr(settings, "FACE_INDEX_FAISS_DIR", "dataset/faiss_index"))
        self._base_dir = base if base.is_absolute() else (backend_root / base)
        self._index_path = self._base_dir / "face_index.faiss"
        self._meta_path = self._base_dir / "face_index.meta.json"
        self._base_dir.mkdir(parents=True, exist_ok=True)
        self._dirty_count = 0

    def _ensure_loaded(self):
        import faiss

        if self._index is not None:
            return

        if self._index_path.exists() and self._meta_path.exists():
            self._index = faiss.read_index(str(self._index_path))
            meta = json.loads(self._meta_path.read_text(encoding="utf-8"))
            self._face_ids = meta.get("face_ids", [])
            logger.info(f"FaceIndexStore loaded: {self._index.ntotal} vectors, {len(self._face_ids)} face_ids")
            return

        self._index = faiss.IndexFlatL2(self._dim)
        self._face_ids = []
        self._persist()
        logger.info("FaceIndexStore created fresh index")

    def _persist(self):
        import faiss

        if self._index is None:
            return
        faiss.write_index(self._index, str(self._index_path))
        meta = {
            "dim": self._dim,
            "total": self._index.ntotal,
            "face_ids": self._face_ids,
        }
        self._meta_path.write_text(json.dumps(meta, ensure_ascii=False), encoding="utf-8")
        self._dirty_count = 0

    async def add(self, vector: np.ndarray, face_id: str) -> int:
        async with self._lock:
            self._ensure_loaded()
            vec = np.asarray(vector, dtype="float32").reshape(1, -1)
            if vec.shape[1] != self._dim:
                raise ValueError(f"Dimension mismatch: {vec.shape[1]} != {self._dim}")
            idx = self._index.ntotal
            self._index.add(vec)
            self._face_ids.append(face_id)
            self._dirty_count += 1
            if self._dirty_count >= 500:
                self._persist()
            return idx

    async def add_batch(self, vectors: np.ndarray, face_ids: List[str]) -> int:
        async with self._lock:
            self._ensure_loaded()
            vecs = np.asarray(vectors, dtype="float32")
            if vecs.ndim == 1:
                vecs = vecs.reshape(1, -1)
            if vecs.shape[1] != self._dim:
                raise ValueError(f"Dimension mismatch: {vecs.shape[1]} != {self._dim}")
            start_idx = self._index.ntotal
            self._index.add(vecs)
            self._face_ids.extend(face_ids)
            self._dirty_count += len(face_ids)
            if self._dirty_count >= 500:
                self._persist()
            return start_idx

    async def search(self, vector: np.ndarray, top_k: int = 10, threshold: float = 0.6) -> List[Dict[str, Any]]:
        async with self._lock:
            self._ensure_loaded()
            if self._index.ntotal == 0:
                return []
            vec = np.asarray(vector, dtype="float32").reshape(1, -1)
            k = min(top_k, self._index.ntotal)
            distances, indices = self._index.search(vec, k)

            results = []
            for dist, idx in zip(distances[0], indices[0]):
                if idx < 0 or idx >= len(self._face_ids):
                    continue
                cosine_sim = 1.0 - (float(dist) / 2.0)
                if cosine_sim < threshold:
                    continue
                results.append({
                    "face_id": self._face_ids[idx],
                    "similarity": round(cosine_sim, 4),
                    "distance": float(dist),
                    "vector_idx": int(idx),
                })
            return results

    def total_faces(self) -> int:
        self._ensure_loaded()
        return self._index.ntotal

    def index_size_mb(self) -> float:
        if self._index_path.exists():
            return self._index_path.stat().st_size / (1024 * 1024)
        return 0.0

    async def flush(self):
        async with self._lock:
            if self._index is not None and self._dirty_count > 0:
                self._persist()

    async def reset(self):
        """Delete index and start fresh. Use with caution."""
        import faiss

        async with self._lock:
            self._index = faiss.IndexFlatL2(self._dim)
            self._face_ids = []
            self._dirty_count = 0
            self._persist()
            logger.warning("FaceIndexStore reset to empty")


_store: Optional[FaceIndexStore] = None


def get_face_index_store() -> FaceIndexStore:
    global _store
    if _store is None:
        _store = FaceIndexStore()
    return _store
