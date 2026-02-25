
from fastapi import APIRouter, Query, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
import asyncio
import logging
from datetime import datetime
from urllib.parse import unquote
import re

router = APIRouter(prefix="/api", tags=["search"])
logger = logging.getLogger(__name__)

# Rate limiting (IP başına son arama zamanı)
search_rate_limit = {}
RATE_LIMIT_SECONDS = 3

def check_rate_limit(client_ip: str) -> bool:
    """Rate limiting kontrolü - 3 saniye ara"""
    now = datetime.now().timestamp()
    last_search = search_rate_limit.get(client_ip, 0)
    if now - last_search < RATE_LIMIT_SECONDS:
        return False
    search_rate_limit[client_ip] = now
    return True

def is_valid_turkish_query(query: str) -> bool:
    """Türkçe karakter desteği ile query validasyonu"""
    # Türkçe karakterler: ğüşıöçĞÜŞİÖÇ
    turkish_pattern = r'^[a-zA-Z0-9\s\-._~:/?#[\]@!$&\'()*+,;=ğüşıöçĞÜŞİÖÇ]+$'
    return bool(re.match(turkish_pattern, query.strip()))

async def log_search(db, query: str, results_count: int, ip: str):
    """Arama logunu veritabanına yaz"""
    try:
        # Search logs tablosuna yazma (daha sonra implement edilecek)
        logger.info(f"Search logged: query={query}, results={results_count}, ip={ip}")
    except Exception as e:
        logger.error(f"Failed to log search: {e}")

@router.get("/search")
async def search(
    q: str = Query(..., min_length=1, max_length=200),
    background_tasks: BackgroundTasks = None,
    request = None
):
    """
    Google Dork tabanlı arama (Türkçe karakter destekli)
    
    Query parametresi URL encoded olmalı:
    - /api/search?q=Ahmet%20%C3%96zt%C3%BCrk
    """
    
    # URL decode
    try:
        decoded_query = unquote(q)
    except Exception:
        raise HTTPException(status_code=400, detail="Geçersiz URL encoding")

    # Türkçe karakter validasyonu
    if not is_valid_turkish_query(decoded_query):
        raise HTTPException(
            status_code=400,
            detail="Geçersiz karakter kullanıldı. Türkçe karakterler desteklenmektedir."
        )

    # Rate limiting
    client_ip = request.client.host if request else "unknown"
    if not check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Çok hızlı arama yapıyorsunuz. Lütfen 3 saniye bekleyin."
        )

    try:
        # Arama işlemi (mock result, gerçekte Google Dork yapılacak)
        results = await perform_google_dork_search(decoded_query)
        
        if not results:
            # Background task olarak log et
            if background_tasks:
                background_tasks.add_task(log_search, None, decoded_query, 0, client_ip)
            raise HTTPException(
                status_code=404,
                detail="Sonuç bulunamadı. Farklı bir anahtar kelime veya tam ad deneyin."
            )
        
        # Background task olarak log et
        if background_tasks:
            background_tasks.add_task(log_search, None, decoded_query, len(results), client_ip)

        return {
            "query": decoded_query,
            "results": results,
            "count": len(results),
            "timestamp": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail="Arama sırasında hata oluştu")

async def perform_google_dork_search(query: str, timeout: int = 30):
    """
    Google Dork tabanlı arama
    TODO: Gerçek implementasyon (selenium, requests vs)
    """
    # Mock result
    await asyncio.sleep(1)
    
    return [
        {
            "name": f"Sonuç: {query}",
            "url": f"https://example.com/result/{query}",
            "snippet": f"{query} hakkında bilgi..."
        }
    ]
