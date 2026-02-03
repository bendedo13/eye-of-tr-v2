import asyncio
import logging
from typing import Dict, Any, List
from pathlib import Path

from app.adapters import AdapterResponse
from app.adapters.eyeofweb_adapter import get_eyeofweb_adapter
from app.adapters.bing_adapter import get_bing_adapter
from app.adapters.yandex_adapter import get_yandex_adapter
from app.adapters.facecheck_adapter import get_facecheck_adapter
from app.core.config import settings

logger = logging.getLogger(__name__)


class SearchService:
    """Multi-provider yüz arama servisi - Bing, Yandex, Facecheck, EyeOfWeb"""
    
    def __init__(self):
        self.adapters = {}
        
        # Bing adapter
        if settings.BING_API_KEY:
            try:
                bing_config = {
                    "api_key": settings.BING_API_KEY,
                    "timeout": 30
                }
                self.adapters["bing"] = get_bing_adapter(bing_config)
                logger.info("✅ Bing adapter yüklendi")
            except Exception as e:
                logger.warning(f"Bing adapter yüklenemedi: {e}")
        else:
            logger.info("Bing API key bulunamadı - atlandı")
        
        # Facecheck adapter
        if settings.FACECHECK_ENABLED and settings.FACECHECK_API_KEY:
            try:
                facecheck_config = {
                    "api_key": settings.FACECHECK_API_KEY,
                    "api_url": settings.FACECHECK_API_URL,
                    "timeout": 60,
                    "enabled": True
                }
                self.adapters["facecheck"] = get_facecheck_adapter(facecheck_config)
                logger.info("✅ Facecheck adapter yüklendi")
            except Exception as e:
                logger.warning(f"Facecheck adapter yüklenemedi: {e}")
        else:
            logger.info("Facecheck kapalı veya API key bulunamadı - atlandı")
        
        # Yandex adapter
        try:
            if settings.YANDEX_API_KEY:
                yandex_config = {
                    "api_key": settings.YANDEX_API_KEY,
                    "folder_id": getattr(settings, "YANDEX_FOLDER_ID", None),
                    "timeout": 30
                }
                self.adapters["yandex"] = get_yandex_adapter(yandex_config)
                logger.info("✅ Yandex adapter yüklendi")
            else:
                logger.info("Yandex API key bulunamadı - atlandı")
        except Exception as e:
            logger.warning(f"Yandex adapter yüklenemedi: {e}")
        
        # EyeOfWeb adapter (eski)
        try:
            if hasattr(settings, "EYEOFWEB_PATH"):
                eyeofweb_config = {
                    "eyeofweb_path": settings.EYEOFWEB_PATH,
                    "python_path": settings.get_eyeofweb_python_path(),
                    "timeout": settings.EYEOFWEB_TIMEOUT
                }
                self.adapters["eyeofweb"] = get_eyeofweb_adapter(eyeofweb_config)
                logger.info("✅ EyeOfWeb adapter yüklendi")
        except Exception as e:
            logger.warning(f"EyeOfWeb adapter yüklenemedi: {e}")
        
        logger.info(f"📊 Toplam {len(self.adapters)} adapter aktif: {list(self.adapters.keys())}")
    
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
    
    async def waterfall_search(self, image_path: str, user_tier: str = "free") -> Dict[str, Any]:
        """Waterfall search stratejisi - tüm provider'ları kullan"""
        logger.info(f"Waterfall search başlatıldı - User tier: {user_tier}, Image: {image_path}")
        
        # Tüm provider'larda arama yap
        search_result = await self.search_all(image_path)
        
        # Sonuçları düzenle
        all_matches = []
        
        for provider_name, provider_data in search_result.get("providers", {}).items():
            if provider_data.get("status") == "success":
                matches = provider_data.get("matches", [])
                for match in matches:
                    match["provider"] = provider_name
                    all_matches.append(match)
        
        # Güven skoruna göre sırala
        all_matches.sort(key=lambda x: x.get("confidence", 0), reverse=True)
        
        logger.info(f"Waterfall search tamamlandı: {len(all_matches)} sonuç bulundu")
        
        return {
            "status": "success",
            "query_file": search_result.get("query_file"),
            "matches": all_matches,
            "total_matches": len(all_matches),
            "providers_used": list(search_result.get("providers", {}).keys())
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
