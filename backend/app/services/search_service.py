import asyncio
import logging
from typing import Dict, Any, List
from pathlib import Path

from app.adapters import AdapterResponse
from app.adapters.eyeofweb_adapter import get_eyeofweb_adapter
from app.core.config import settings

logger = logging.getLogger(__name__)


class SearchService:
    """Multi-provider yüz arama servisi"""
    
    def __init__(self):
        self.adapters = {}
        
        try:
            eyeofweb_config = {
                "eyeofweb_path": settings.EYEOFWEB_PATH,
                "python_path": settings.get_eyeofweb_python_path(),
                "timeout": settings.EYEOFWEB_TIMEOUT
            }
            self.adapters["eyeofweb"] = get_eyeofweb_adapter(eyeofweb_config)
            logger.info("EyeOfWeb adapter yüklendi")
        except Exception as e:
            logger.warning(f"EyeOfWeb adapter yüklenemedi: {e}")
    
    async def search_all(self, image_path: str) -> Dict[str, Any]:
        """Tüm aktif adapter'larda arama yap"""
        
        if not Path(image_path).exists():
            return {
                "status": "error",
                "error": "Dosya bulunamadı",
                "providers": {},
                "total_matches": 0
            }
        
        logger.info(f"Arama başlatıldı: {image_path}")
        logger.info(f"Aktif adapter sayısı: {len(self.adapters)}")
        
        tasks = []
        adapter_names = []
        
        for name, adapter in self.adapters.items():
            task = adapter.search_with_timing(image_path)
            tasks.append(task)
            adapter_names.append(name)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        providers_data = {}
        total_matches = 0
        
        for name, result in zip(adapter_names, results):
            if isinstance(result, Exception):
                logger.error(f"{name} adapter hatası: {result}")
                providers_data[name] = {
                    "status": "error",
                    "error": str(result),
                    "matches": [],
                    "total_matches": 0
                }
            elif isinstance(result, AdapterResponse):
                providers_data[name] = result.to_dict()
                total_matches += len(result.matches)
            else:
                logger.warning(f"{name} adapter beklenmeyen sonuç: {type(result)}")
        
        logger.info(f"Arama tamamlandı: {total_matches} toplam sonuç")
        
        return {
            "status": "success",
            "query_file": Path(image_path).name,
            "providers": providers_data,
            "total_matches": total_matches
        }
    
    async def search_provider(self, image_path: str, provider: str) -> Dict[str, Any]:
        """Belirli bir provider'da arama yap"""
        
        if provider not in self.adapters:
            return {
                "status": "error",
                "error": f"Provider bulunamadı: {provider}",
                "available_providers": list(self.adapters.keys())
            }
        
        adapter = self.adapters[provider]
        result = await adapter.search_with_timing(image_path)
        
        return {
            "status": "success",
            "provider": provider,
            "result": result.to_dict()
        }
    
    def get_available_providers(self) -> List[str]:
        """Aktif provider'ların listesini döndür"""
        return list(self.adapters.keys())


_search_service = None

def get_search_service() -> SearchService:
    """Search service singleton instance"""
    global _search_service
    if _search_service is None:
        _search_service = SearchService()
    return _search_service