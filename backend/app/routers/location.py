import logging
from datetime import datetime

import httpx
from fastapi import APIRouter, Query, HTTPException, Request

router = APIRouter(prefix="/api", tags=["location"])
logger = logging.getLogger(__name__)

# Rate limiting: max 1 istek/saniye (Nominatim kuralı)
location_rate_limit: dict = {}
LOCATION_RATE_LIMIT_SECONDS = 1

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_HEADERS = {
    "User-Agent": "EyeOfTR/2.0 (https://github.com/bendedo13/eye-of-tr-v2)",
    "Accept-Language": "tr,en",
}


def check_location_rate_limit(client_ip: str) -> bool:
    now = datetime.now().timestamp()
    last = location_rate_limit.get(client_ip, 0)
    if now - last < LOCATION_RATE_LIMIT_SECONDS:
        return False
    location_rate_limit[client_ip] = now
    return True


@router.get("/location-search")
async def location_search(
    request: Request,
    q: str = Query(..., min_length=1, max_length=200),
):
    """
    Nominatim/OpenStreetMap tabanlı konum arama (ücretsiz)
    Örnek: /api/location-search?q=Istanbul
    """
    client_ip = request.client.host if request.client else "unknown"
    if not check_location_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Çok hızlı istek. Lütfen 1 saniye bekleyin.",
        )

    try:
        async with httpx.AsyncClient(timeout=15.0) as http_client:
            response = await http_client.get(
                NOMINATIM_URL,
                params={"q": q, "format": "json", "limit": 10, "addressdetails": 1},
                headers=NOMINATIM_HEADERS,
            )
            response.raise_for_status()
            data = response.json()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Konum servisi zaman aşımına uğradı.")
    except httpx.HTTPError as exc:
        logger.error(f"Nominatim HTTP error: {exc}")
        raise HTTPException(status_code=502, detail="Konum servisi yanıt vermedi.")

    if not data:
        raise HTTPException(
            status_code=404,
            detail="Konum bulunamadı. Farklı bir arama terimi deneyin.",
        )

    results = [
        {
            "display_name": item.get("display_name", ""),
            "lat": item.get("lat", ""),
            "lon": item.get("lon", ""),
            "type": item.get("type", ""),
            "importance": item.get("importance", 0),
        }
        for item in data
    ]

    return {
        "query": q,
        "results": results,
        "count": len(results),
        "timestamp": datetime.now().isoformat(),
    }
