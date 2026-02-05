import asyncio
import logging
from typing import Dict, Any, List
from pathlib import Path
import hashlib
import time

from app.adapters import AdapterResponse
from app.adapters.eyeofweb_adapter import get_eyeofweb_adapter
from app.adapters.bing_adapter import get_bing_adapter
from app.adapters.bing_visual_adapter import get_bing_visual_adapter
from app.adapters.yandex_adapter import get_yandex_adapter
from app.adapters.facecheck_adapter import get_facecheck_adapter
from app.adapters.yandex_reverse_adapter import get_yandex_reverse_adapter
from app.adapters.serpapi_lens_adapter import get_serpapi_lens_adapter
from app.adapters.rapidapi_lens_adapter import get_rapidapi_lens_adapter
from app.core.config import settings
from app.services.provider_metrics_service import provider_metrics_service
from app.services.runtime_metrics import runtime_metrics

logger = logging.getLogger(__name__)


class SearchService:
    """Multi-provider yüz arama servisi - Bing, Yandex, Facecheck, EyeOfWeb"""
    
    def __init__(self):
        self.adapters = {}
        self._result_cache: Dict[str, Dict[str, Any]] = {}
        self._result_cache_exp: Dict[str, float] = {}
        self._reverse_image_providers = {"facecheck", "eyeofweb", "bing_visual", "yandex_reverse", "serpapi"}
        
        # Bing adapter
        if settings.BING_API_KEY:
            if getattr(settings, "BING_VISUAL_SEARCH_ENABLED", True):
                try:
                    visual_config = {"api_key": settings.BING_API_KEY, "timeout": 30}
                    self.adapters["bing_visual"] = get_bing_visual_adapter(visual_config)
                    logger.info("✅ Bing Visual adapter yüklendi")
                except Exception as e:
                    logger.warning(f"Bing Visual adapter yüklenemedi: {e}")
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

        if getattr(settings, "YANDEX_REVERSE_IMAGE_ENABLED", False):
            try:
                self.adapters["yandex_reverse"] = get_yandex_reverse_adapter({"enabled": True, "timeout": 25})
                logger.info("✅ Yandex reverse-image adapter yüklendi")
            except Exception as e:
                logger.warning(f"Yandex reverse-image adapter yüklenemedi: {e}")
        
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

        if settings.SERPAPI_API_KEY and (settings.PUBLIC_BASE_URL or "").strip():
            try:
                serpapi_config = {
                    "api_key": settings.SERPAPI_API_KEY,
                    "engine": settings.SERPAPI_ENGINE,
                    "gl": settings.SERPAPI_GL,
                    "hl": settings.SERPAPI_HL,
                    "timeout": settings.SERPAPI_TIMEOUT,
                    "public_base_url": settings.PUBLIC_BASE_URL,
                }
                self.adapters["serpapi"] = get_serpapi_lens_adapter(serpapi_config)
                logger.info("✅ SerpAPI (Google Lens) adapter yüklendi")
            except Exception as e:
                logger.warning(f"SerpAPI adapter yüklenemedi: {e}")
        else:
            logger.info("SerpAPI API key veya PUBLIC_BASE_URL bulunamadı - atlandı")
        
        # RapidAPI Lens adapter
        if settings.RAPIDAPI_LENS_KEY:
            try:
                lens_config = {
                    "api_key": settings.RAPIDAPI_LENS_KEY,
                    "api_host": settings.RAPIDAPI_LENS_HOST,
                    "base_url": settings.RAPIDAPI_LENS_BASE_URL,
                    "timeout": 45
                }
                self.adapters["rapidapi_lens"] = get_rapidapi_lens_adapter(lens_config)
                logger.info("✅ RapidAPI Lens adapter yüklendi")
            except Exception as e:
                logger.warning(f"RapidAPI Lens adapter yüklenemedi: {e}")
        else:
            logger.info("RapidAPI Lens API key bulunamadı - atlandı")

        logger.info(f"📊 Toplam {len(self.adapters)} adapter aktif: {list(self.adapters.keys())}")

    def _file_sha256(self, image_path: str) -> str:
        h = hashlib.sha256()
        with open(image_path, "rb") as f:
            for chunk in iter(lambda: f.read(1024 * 1024), b""):
                h.update(chunk)
        return h.hexdigest()

    def _cache_get(self, key: str) -> Dict[str, Any] | None:
        exp = self._result_cache_exp.get(key)
        if not exp:
            return None
        if time.time() > exp:
            self._result_cache.pop(key, None)
            self._result_cache_exp.pop(key, None)
            return None
        return self._result_cache.get(key)

    def _cache_set(self, key: str, value: Dict[str, Any]) -> None:
        ttl = max(0, int(settings.SEARCH_RESULT_CACHE_TTL_SECONDS))
        if ttl <= 0:
            return
        self._result_cache[key] = value
        self._result_cache_exp[key] = time.time() + float(ttl)
    
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
                provider_metrics_service.record(
                    provider=name,
                    success=False,
                    latency_ms=0,
                    match_count=0,
                    reverse_image_used=name in self._reverse_image_providers,
                    reverse_image_success=False,
                )
                runtime_metrics.record(
                    provider=name,
                    success=False,
                    latency_ms=0,
                    match_count=0,
                    reverse_image_used=name in self._reverse_image_providers,
                    reverse_image_success=False,
                )
            elif isinstance(result, AdapterResponse):
                providers_data[name] = result.to_dict()
                total_matches += len(result.matches)
                success = result.status == "success"
                provider_metrics_service.record(
                    provider=name,
                    success=success,
                    latency_ms=int(result.search_time_ms or 0),
                    match_count=len(result.matches or []),
                    reverse_image_used=name in self._reverse_image_providers,
                    reverse_image_success=success and len(result.matches or []) > 0,
                )
                runtime_metrics.record(
                    provider=name,
                    success=success,
                    latency_ms=int(result.search_time_ms or 0),
                    match_count=len(result.matches or []),
                    reverse_image_used=name in self._reverse_image_providers,
                    reverse_image_success=success and len(result.matches or []) > 0,
                )
            else:
                logger.warning(f"{name} adapter beklenmeyen sonuç: {type(result)}")
        
        logger.info(f"Arama tamamlandı: {total_matches} toplam sonuç")
        
        return {
            "status": "success",
            "query_file": Path(image_path).name,
            "providers": providers_data,
            "total_matches": total_matches
        }

    async def fallback_search(
        self,
        image_path: str,
        *,
        provider_order: List[str],
        min_total_matches: int,
    ) -> Dict[str, Any]:
        if not Path(image_path).exists():
            return {"status": "error", "error": "Dosya bulunamadı", "providers": {}, "total_matches": 0}

        min_total_matches = max(1, int(min_total_matches))
        providers_data: Dict[str, Any] = {}
        total_matches = 0

        for name in provider_order:
            if name not in self.adapters:
                continue
            adapter = self.adapters[name]
            try:
                result = await adapter.search_with_timing(image_path)
            except Exception as e:
                providers_data[name] = {"status": "error", "error": str(e), "matches": [], "total_matches": 0}
                provider_metrics_service.record(
                    provider=name,
                    success=False,
                    latency_ms=0,
                    match_count=0,
                    reverse_image_used=name in self._reverse_image_providers,
                    reverse_image_success=False,
                )
                runtime_metrics.record(
                    provider=name,
                    success=False,
                    latency_ms=0,
                    match_count=0,
                    reverse_image_used=name in self._reverse_image_providers,
                    reverse_image_success=False,
                )
                continue

            providers_data[name] = result.to_dict()
            success = result.status == "success"
            match_count = len(result.matches or [])
            total_matches += match_count
            provider_metrics_service.record(
                provider=name,
                success=success,
                latency_ms=int(result.search_time_ms or 0),
                match_count=match_count,
                reverse_image_used=name in self._reverse_image_providers,
                reverse_image_success=success and match_count > 0,
            )
            runtime_metrics.record(
                provider=name,
                success=success,
                latency_ms=int(result.search_time_ms or 0),
                match_count=match_count,
                reverse_image_used=name in self._reverse_image_providers,
                reverse_image_success=success and match_count > 0,
            )

            if total_matches >= min_total_matches:
                break

        return {
            "status": "success",
            "query_file": Path(image_path).name,
            "providers": providers_data,
            "total_matches": total_matches,
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
    
    async def waterfall_search(self, image_path: str, user_tier: str = "free", strategy: str = "parallel") -> Dict[str, Any]:
        """Waterfall search stratejisi - tüm provider'ları kullan"""
        from app.services.openai_service import openai_service
        logger.info(f"Waterfall search başlatıldı - User tier: {user_tier}, Image: {image_path}")

        cache_key = None
        try:
            cache_key = self._file_sha256(image_path)
        except Exception:
            cache_key = None

        if cache_key:
            cached = self._cache_get(cache_key)
            if cached:
                return cached

        if strategy == "fallback":
            ordered = self._provider_order_for_tier(user_tier)
            search_result = await self.fallback_search(
                image_path,
                provider_order=ordered,
                min_total_matches=settings.SEARCH_FALLBACK_MIN_MATCHES,
            )
        else:
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
        
        # --- OpenAI Entegrasyonu ---
        
        ai_explanation = None
        error_message = None
        
        if not all_matches:
            # Sonuç yoksa özel senaryoları uygula
            # failure_type = "resolution"
            failure_type = "privacy" 
            
            error_message = await openai_service.get_failure_message(failure_type, context="Unknown Target")
            
        else:
            # Sonuç varsa analiz et
            top_matches = all_matches[:5]
            ai_explanation = await openai_service.analyze_search_results(
                query="Visual Search Target", 
                results=[{"title": m.get("title"), "url": m.get("profile_url")} for m in top_matches]
            )

        # Sonuç objesini güncelle
        final_result = {
            "total_matches": len(all_matches),
            "matches": all_matches,
            "providers_used": list(search_result.get("providers", {}).keys()),
            "ai_explanation": ai_explanation,
            "error_message": error_message  # Frontend bu alanı kontrol edip özel uyarı gösterecek
        }
        
        # Cache'e kaydet (Hata mesajı varsa da kaydet ki tekrar tekrar OpenAI'a gitmesin)
        if cache_key:
            self._cache_set(cache_key, final_result)
            
        logger.info(f"Waterfall search tamamlandı: {len(all_matches)} sonuç bulundu")
        return final_result

    def _provider_order_for_tier(self, user_tier: str) -> List[str]:
        # RapidAPI Lens is premium/expensive, put it towards the end or middle
        base = ["serpapi", "eyeofweb", "facecheck", "bing_visual", "yandex_reverse", "bing", "yandex", "rapidapi_lens"]
        if str(user_tier).lower() in ("free", "basic"):
            # Free users get cheaper providers first
            return ["serpapi", "eyeofweb", "bing_visual", "yandex_reverse", "bing", "yandex", "facecheck", "rapidapi_lens"]
        return base
    
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
