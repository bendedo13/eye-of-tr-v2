import time
import logging
import asyncio
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.adapters import BaseSearchAdapter, AdapterResponse, SearchMatch
from app.modules.face_index.vector_store import get_face_index_store
from app.modules.face_index.models import IndexedFace, FaceImage, FaceSource
from app.services.embedding_service import get_embedder
from app.db.database import SessionLocal

logger = logging.getLogger(__name__)

class FaceIndexAdapter(BaseSearchAdapter):
    """Local Face Index (Crew data) search adapter"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        self.store = get_face_index_store()
        self.embedder = get_embedder()

    async def search(self, image_path: str) -> AdapterResponse:
        """Search local FAISS index using query image"""
        start_time = time.time()
        
        try:
            # 1. Read image and extract embedding
            with open(image_path, "rb") as f:
                img_bytes = f.read()
            
            # Use threadpool for embedding as it might be CPU intensive
            loop = asyncio.get_event_loop()
            embedding = await loop.run_in_executor(None, self.embedder.embed, img_bytes)
            
            # 2. Search FAISS index
            threshold = float(self.config.get("threshold", 0.65))
            top_k = int(self.config.get("top_k", 20))
            
            # Note: store.search is already async
            results = await self.store.search(embedding.vector, top_k=top_k, threshold=threshold)
            
            if not results:
                return AdapterResponse(
                    provider="face_index",
                    status="success",
                    matches=[],
                    search_time_ms=int((time.time() - start_time) * 1000)
                )

            # 3. Pull details from DB
            db = SessionLocal()
            matches = []
            
            try:
                face_ids = [r["face_id"] for r in results]
                sim_map = {r["face_id"]: r["similarity"] for r in results}
                
                # Bulk query faces
                faces = db.query(IndexedFace).filter(IndexedFace.face_id.in_(face_ids)).all()
                
                # Collect unique image/source IDs to minimize queries
                image_ids = list(set(f.image_id for f in faces))
                images = {img.id: img for img in db.query(FaceImage).filter(FaceImage.id.in_(image_ids)).all()}
                
                source_ids = list(set(f.source_id for f in faces))
                sources = {src.id: src for src in db.query(FaceSource).filter(FaceSource.id.in_(source_ids)).all()}
                
                for face in faces:
                    img = images.get(face.image_id)
                    if not img: continue
                    
                    source = sources.get(face.source_id)
                    
                    match = SearchMatch(
                        platform="local_crew",
                        username=source.name if source else "Local Dataset",
                        profile_url=img.source_page_url or img.source_url,
                        image_url=img.source_url,
                        confidence=sim_map.get(face.face_id, 0.0),
                        metadata={
                            "source_id": face.source_id,
                            "image_id": face.image_id,
                            "face_id": face.face_id,
                            "kind": source.kind if source else "unknown"
                        }
                    )
                    matches.append(match)
            finally:
                db.close()
            
            # Sort by confidence
            matches.sort(key=lambda x: x.confidence, reverse=True)
            
            logger.info(f"FaceIndex search: {len(matches)} results found")
            
            return AdapterResponse(
                provider="face_index",
                status="success",
                matches=matches,
                total_matches=len(matches),
                search_time_ms=int((time.time() - start_time) * 1000)
            )

        except Exception as e:
            logger.error(f"FaceIndexAdapter error: {e}", exc_info=True)
            return AdapterResponse(
                provider="face_index",
                status="error",
                error=str(e),
                matches=[]
            )

def get_face_index_adapter(config: Dict[str, Any]) -> FaceIndexAdapter:
    return FaceIndexAdapter(config)
