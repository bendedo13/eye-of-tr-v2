from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
import time


@dataclass
class SearchMatch:
    """Tek bir arama sonucu"""
    platform: str
    username: Optional[str] = None
    profile_url: Optional[str] = None
    image_url: Optional[str] = None
    confidence: float = 0.0
    metadata: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "platform": self.platform,
            "username": self.username,
            "profile_url": self.profile_url,
            "image_url": self.image_url,
            "confidence": self.confidence,
            "metadata": self.metadata or {}
        }


@dataclass
class AdapterResponse:
    """Adapter'ların döndüreceği standart response"""
    provider: str
    status: str
    matches: List[SearchMatch]
    total_matches: int = 0
    search_time_ms: int = 0
    execution_time: float = 0.0
    error: Optional[str] = None
    
    def __post_init__(self):
        """Auto-calculate total_matches if not provided"""
        if self.total_matches == 0:
            self.total_matches = len(self.matches)
        if self.execution_time == 0.0 and self.search_time_ms > 0:
            self.execution_time = self.search_time_ms / 1000.0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "provider": self.provider,
            "status": self.status,
            "execution_time": round(self.execution_time, 2),
            "search_time_ms": self.search_time_ms,
            "matches": [m.to_dict() for m in self.matches],
            "total_matches": self.total_matches,
            "error": self.error
        }


class BaseSearchAdapter(ABC):
    """Tüm arama adapter'ları için base class"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.provider_name = self.__class__.__name__.replace("Adapter", "").lower()
    
    @abstractmethod
    async def search(self, image_path: str) -> AdapterResponse:
        """Ana arama fonksiyonu"""
        pass
    
    async def search_with_timing(self, image_path: str) -> AdapterResponse:
        """Execution time tracking ile arama"""
        start_time = time.time()
        try:
            result = await self.search(image_path)
            result.execution_time = time.time() - start_time
            return result
        except Exception as e:
            return AdapterResponse(
                provider=self.provider_name,
                status="error",
                execution_time=time.time() - start_time,
                matches=[],
                error=str(e)
            )
    
    def validate_image(self, image_path: str) -> bool:
        """Görsel dosyasının geçerliliğini kontrol et"""
        import os
        from pathlib import Path
        
        if not os.path.exists(image_path):
            return False
        
        allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
        if Path(image_path).suffix.lower() not in allowed_extensions:
            return False
        
        return True