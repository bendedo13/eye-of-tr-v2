"""
Visual Search API Routes
Backend proxy for image search APIs (Google, Bing, Yandex)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, Literal, List, Dict, Any
import httpx
import os
from datetime import datetime

from app.models.user import User
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api/visual-search", tags=["visual-search"])

# API Configuration from environment
BING_API_KEY = os.getenv("BING_API_KEY", "")
YANDEX_API_KEY = os.getenv("YANDEX_API_KEY", "")


# Request/Response Models
class VisualSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    provider: Literal["bing", "yandex"] = "bing"
    count: int = Field(default=20, ge=1, le=50)
    offset: int = Field(default=0, ge=0)
    safeSearch: bool = True
    imageType: Optional[Literal["photo", "clipart", "lineart", "animated", "transparent"]] = None
    size: Optional[Literal["small", "medium", "large", "wallpaper", "all"]] = "all"
    color: Optional[str] = None


class ImageResult(BaseModel):
    id: str
    title: str
    url: str
    thumbnailUrl: str
    thumbnailWidth: int
    thumbnailHeight: int
    imageUrl: str
    imageWidth: int
    imageHeight: int
    sourceUrl: str
    sourceDomain: str
    provider: str
    contentType: Optional[str] = None
    description: Optional[str] = None


class VisualSearchResponse(BaseModel):
    results: List[ImageResult]
    totalResults: int
    provider: str
    query: str
    searchTime: int
    error: Optional[str] = None


@router.post("/bing", response_model=VisualSearchResponse)
async def search_bing_images(
    request: VisualSearchRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Proxy endpoint for Bing Image Search API
    Requires authentication
    """
    start_time = datetime.now()
    
    if not BING_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Bing API key not configured"
        )
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            params = {
                "q": request.query,
                "count": request.count,
                "offset": request.offset,
                "safeSearch": "Strict" if request.safeSearch else "Off",
            }
            
            if request.imageType:
                params["imageType"] = request.imageType
            if request.size and request.size != "all":
                params["size"] = request.size
            if request.color:
                params["color"] = request.color
            
            response = await client.get(
                "https://api.bing.microsoft.com/v7.0/images/search",
                params=params,
                headers={
                    "Ocp-Apim-Subscription-Key": BING_API_KEY
                }
            )
            
            if response.status_code != 200:
                error_data = response.json() if response.content else {}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("error", {}).get("message", "Bing API error")
                )
            
            data = response.json()
            search_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            results = []
            for idx, item in enumerate(data.get("value", [])):
                results.append({
                    "id": f"bing-{request.offset}-{idx}",
                    "title": item.get("name", "Untitled"),
                    "url": item.get("contentUrl"),
                    "thumbnailUrl": item.get("thumbnailUrl"),
                    "thumbnailWidth": item.get("thumbnail", {}).get("width", 150),
                    "thumbnailHeight": item.get("thumbnail", {}).get("height", 150),
                    "imageUrl": item.get("contentUrl"),
                    "imageWidth": item.get("width", 0),
                    "imageHeight": item.get("height", 0),
                    "sourceUrl": item.get("hostPageUrl"),
                    "sourceDomain": item.get("hostPageDomainFriendlyName", ""),
                    "provider": "bing",
                    "contentType": item.get("encodingFormat"),
                    "description": item.get("name"),
                })
            
            return {
                "results": results,
                "totalResults": data.get("totalEstimatedMatches", 0),
                "provider": "bing",
                "query": request.query,
                "searchTime": search_time,
            }
            
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Bing API request timeout"
        )
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Bing API error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/yandex", response_model=VisualSearchResponse)
async def search_yandex_images(
    request: VisualSearchRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Proxy endpoint for Yandex Image Search
    Requires authentication
    
    Note: Yandex does not have an official public Image Search API.
    This is a placeholder for future implementation or custom scraping solution.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Yandex image search not yet implemented. Use Google or Bing instead."
    )


@router.get("/health")
async def visual_search_health():
    """
    Check visual search API health and configuration
    """
    return {
        "status": "ok",
        "providers": {
            "bing": bool(BING_API_KEY),
            "yandex": bool(YANDEX_API_KEY),
        },
        "message": "Visual search API is operational"
    }
