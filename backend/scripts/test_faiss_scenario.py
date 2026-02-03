import os
import sys
from pathlib import Path


async def main() -> None:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    os.environ.setdefault("SECRET_KEY", "test-secret")
    os.environ.setdefault("FACE_EMBEDDER_BACKEND", "mock")
    os.environ.setdefault("FAISS_DIR", "faiss")
    os.environ.setdefault("FAISS_INDEX_NAME", "faces_test.index")
    os.environ.setdefault("FAISS_META_NAME", "faces_test.meta.json")

    from app.services.embedding_service import get_embedder
    from app.services.faiss_service import get_faiss_store

    store = get_faiss_store()
    embedder = get_embedder()

    image_bytes = b"face-seek-test-image"
    emb = embedder.embed(image_bytes)

    backend_root = Path(__file__).resolve().parents[1]
    uploads_dir = (backend_root / "uploads" / "faces_test").resolve()
    uploads_dir.mkdir(parents=True, exist_ok=True)

    for i in range(3):
        fname = f"seed_{i}.jpg"
        fpath = uploads_dir / fname
        fpath.write_bytes(image_bytes)
        await store.add(vector=emb.vector, filename=fname, file_path=str(fpath), model=emb.model)

    results = await store.search(vector=emb.vector, top_k=3)
    assert len(results) == 3, f"Beklenen 3 sonuç, gelen: {len(results)}"

    print("OK: 1 foto ile 3 benzer sonuç döndü")
    for dist, meta in results:
        print({"distance": float(dist), "filename": meta.get("filename"), "face_id": meta.get("face_id")})


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
