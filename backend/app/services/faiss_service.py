import asyncio
import json
import os
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

from app.core.config import settings


class FaissError(Exception):
    pass


@dataclass(frozen=True)
class FaissItem:
    face_id: str
    filename: str
    file_path: str
    model: str


class FaissStore:
    def __init__(self):
        self._lock = asyncio.Lock()
        self._index = None
        self._items: List[Dict[str, Any]] = []
        self._dim = int(settings.FAISS_DIM)
        self._next_vector_id = 0
        backend_root = Path(__file__).resolve().parents[2]
        base_dir = Path(settings.FAISS_DIR)
        self._base_dir = base_dir if base_dir.is_absolute() else (backend_root / base_dir)
        self._index_path = self._base_dir / settings.FAISS_INDEX_NAME
        self._meta_path = self._base_dir / settings.FAISS_META_NAME
        self._vectors_path = self._base_dir / "faces.vectors.npy"
        self._base_dir.mkdir(parents=True, exist_ok=True)

    def _create_index(self):
        import faiss

        index_type = settings.FAISS_INDEX_TYPE.lower()
        if index_type == "ivfflat":
            quantizer = faiss.IndexFlatL2(self._dim)
            nlist = 128
            idx = faiss.IndexIVFFlat(quantizer, self._dim, nlist, faiss.METRIC_L2)
            return idx
        return faiss.IndexFlatL2(self._dim)

    def _ensure_loaded_sync(self):
        import faiss

        if self._index is not None:
            return

        if self._index_path.exists() and self._meta_path.exists():
            self._index = faiss.read_index(str(self._index_path))
            meta = json.loads(self._meta_path.read_text(encoding="utf-8"))
            self._items = meta.get("items", [])
            self._next_vector_id = int(meta.get("next_vector_id", len(self._items)))
            return

        self._index = self._create_index()
        self._items = []
        self._next_vector_id = 0
        self._persist_sync()

    def _persist_sync(self):
        import faiss

        if self._index is None:
            raise FaissError("Index yüklenmedi")

        faiss.write_index(self._index, str(self._index_path))
        meta = {
            "dim": self._dim,
            "index_type": settings.FAISS_INDEX_TYPE.lower(),
            "next_vector_id": self._next_vector_id,
            "items": self._items,
        }
        self._meta_path.write_text(json.dumps(meta, ensure_ascii=False), encoding="utf-8")

    async def add(self, vector: np.ndarray, filename: str, file_path: str, model: str) -> FaissItem:
        async with self._lock:
            self._ensure_loaded_sync()

            vec = np.asarray(vector, dtype="float32").reshape(1, -1)
            if vec.shape[1] != self._dim:
                raise FaissError(f"Embedding boyutu uyumsuz: {vec.shape[1]} != {self._dim}")

            index_type = settings.FAISS_INDEX_TYPE.lower()
            if index_type == "ivfflat":
                if not self._index.is_trained:
                    train_vecs = self._all_vectors_for_training()
                    if train_vecs is None or train_vecs.shape[0] < 256:
                        self._index = self._create_index()
                        index_type = "flatl2"
                    else:
                        new_index = self._create_index()
                        if not new_index.is_trained:
                            new_index.train(train_vecs)
                        new_index.add(train_vecs)
                        self._index = new_index

            self._append_vector_sync(vec)

            self._index.add(vec)
            face_id = str(uuid.uuid4())
            item = {
                "vector_id": self._next_vector_id,
                "face_id": face_id,
                "filename": filename,
                "file_path": file_path,
                "model": model,
            }
            self._items.append(item)
            self._next_vector_id += 1
            self._persist_sync()
            return FaissItem(face_id=face_id, filename=filename, file_path=file_path, model=model)

    def _append_vector_sync(self, vec: np.ndarray) -> None:
        vec = np.asarray(vec, dtype="float32").reshape(1, -1)
        if not self._vectors_path.exists():
            np.save(self._vectors_path, vec)
            return
        existing = np.load(self._vectors_path, allow_pickle=False)
        merged = np.concatenate([existing, vec], axis=0)
        np.save(self._vectors_path, merged)

    def _all_vectors_for_training(self) -> Optional[np.ndarray]:
        if not self._vectors_path.exists():
            return None
        arr = np.load(self._vectors_path, allow_pickle=False)
        return np.asarray(arr, dtype="float32")

    async def search(self, vector: np.ndarray, top_k: int) -> List[Tuple[float, Dict[str, Any]]]:
        async with self._lock:
            self._ensure_loaded_sync()

            vec = np.asarray(vector, dtype="float32").reshape(1, -1)
            if vec.shape[1] != self._dim:
                raise FaissError(f"Embedding boyutu uyumsuz: {vec.shape[1]} != {self._dim}")

            k = max(1, int(top_k))
            distances, indices = self._index.search(vec, k)
            out: List[Tuple[float, Dict[str, Any]]] = []
            for dist, idx in zip(distances[0].tolist(), indices[0].tolist()):
                if idx < 0:
                    continue
                if idx >= len(self._items):
                    continue
                out.append((float(dist), self._items[idx]))
            return out


_store: Optional[FaissStore] = None


def get_faiss_store() -> FaissStore:
    global _store
    if _store is None:
        _store = FaissStore()
    return _store
