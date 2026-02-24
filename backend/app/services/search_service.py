import asyncio
import time
from typing import List, Dict, Optional
from urllib.parse import quote
import logging

logger = logging.getLogger(__name__)

class AlanSearchService:
    """Google Dork tabanlı arama servisi"""
    
    # Rate limiting: istekler arası bekleme süresi (saniye)
    MIN_REQUEST_INTERVAL = 3
    last_request_time: float = 0
    
    @staticmethod
    def encode_search_query(query: str) -> str:
        """
        Türkçe karakterleri içeren sorguyu URL encode et
        ö,ü,ş,ı,ğ,ç karakterlerini düzgün kodla
        """
        # UTF-8 ile encode, özel karakterleri koru
        return quote(query, safe='')
    
    @classmethod
    async def _apply_rate_limiting(cls) -> None:
        """Rate limiting: 2-3 saniye bekleme (Google engeli önle)"""
        current_time = time.time()
        time_since_last = current_time - cls.last_request_time
        
        if time_since_last < cls.MIN_REQUEST_INTERVAL:
            wait_time = cls.MIN_REQUEST_INTERVAL - time_since_last
            await asyncio.sleep(wait_time)
        
        cls.last_request_time = time.time()
    
    @classmethod
    async def search(
        cls,
        query: str,
        limit: int = 10
    ) -> Dict[str, any]:
        """
        Google Dork tabanlı arama yapıyor
        Türkçe karakterleri destekliyor
        """
        if not query or not query.strip():
            return {
                "success": False,
                "error": "Arama terimi boş olamaz",
                "results": [],
                "count": 0
            }
        
        try:
            # Rate limiting uygula (Google engeli önle)
            await cls._apply_rate_limiting()
            
            # Türkçe karakterleri düzgün encode et
            encoded_query = cls.encode_search_query(query)
            
            # Google Dork URL'i oluştur
            search_url = f"https://www.google.com/search?q={encoded_query}"
            
            # TODO: Burada gerçek Google Dork implementasyonu olacak
            # Şimdilik demo amaçlı dönen veri
            results = [
                {
                    "title": f"Arama sonucu: {query}",
                    "url": search_url,
                    "snippet": f'"{query}" araması yapılıyor...'
                }
            ]
            
            if not results:
                return {
                    "success": True,
                    "error": f'"{query}" için sonuç bulunamadı. '
                            f'Lütfen farklı bir anahtar kelime deneyin.',
                    "results": [],
                    "query": query,
                    "count": 0
                }
            
            return {
                "success": True,
                "results": results[:limit],
                "query": query,
                "count": len(results)
            }
            
        except asyncio.TimeoutError:
            return {
                "success": False,
                "error": "Arama zaman aşımına uğradı (30 saniye). Lütfen tekrar deneyin.",
                "results": [],
                "query": query,
                "count": 0
            }
        except Exception as e:
            logger.error(f"Arama hatası: {str(e)}, Sorgu: {query}")
            return {
                "success": False,
                "error": "Arama sırasında bir hata oluştu. Lütfen tekrar deneyin.",
                "results": [],
                "query": query,
                "count": 0
            }
