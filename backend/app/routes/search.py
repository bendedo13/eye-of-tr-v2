from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.services.search_service import AlanSearchService
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["search"])

@router.get("/search")
async def search(q: str = Query(..., min_length=1)):
    """
    Google Dork tabanlı arama endpoint
    Türkçe karakterleri destekliyor
    
    Query parametresi UTF-8 encode edilmiş olmalı
    """
    try:
        # Frontend'den gelen URL-encoded sorguyu decode et
        # FastAPI otomatik olarak URL decode ediyor
        results = await AlanSearchService.search(query=q, limit=10)
        return results
    except Exception as e:
        logger.error(f"Search endpoint hatası: {str(e)}, Query: {q}")
        raise HTTPException(
            status_code=500,
            detail="Arama sırasında bir hata oluştu"
        )
