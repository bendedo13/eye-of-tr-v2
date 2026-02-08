import asyncio
import json
import os
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional
import logging

from . import BaseSearchAdapter, AdapterResponse, SearchMatch

logger = logging.getLogger(__name__)


class EyeOfWebAdapter(BaseSearchAdapter):
    """EyeOfWeb servisi için adapter"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        
        self.eyeofweb_path = self.config.get(
            "eyeofweb_path",
            os.environ.get("EYEOFWEB_PATH", "/opt/eyeofweb")
        )

        self.python_path = self.config.get(
            "python_path",
            os.path.join(self.eyeofweb_path, "venv", "bin", "python")
        )
        
        self.timeout = self.config.get("timeout", 30)
        self.provider_name = "eyeofweb"
    
    def _validate_setup(self) -> tuple[bool, Optional[str]]:
        """EyeOfWeb kurulumunu kontrol et"""
        
        if not os.path.exists(self.python_path):
            return False, f"Python executable bulunamadı: {self.python_path}"
        
        run_py_path = os.path.join(self.eyeofweb_path, "src", "run.py")
        if not os.path.exists(run_py_path):
            return False, f"run.py bulunamadı: {run_py_path}"
        
        return True, None
    
    async def search(self, image_path: str) -> AdapterResponse:
        """EyeOfWeb ile arama yap"""
        
        is_valid, error_msg = self._validate_setup()
        if not is_valid:
            logger.error(f"EyeOfWeb setup hatası: {error_msg}")
            return AdapterResponse(
                provider=self.provider_name,
                status="error",
                execution_time=0.0,
                matches=[],
                error=error_msg
            )
        
        if not self.validate_image(image_path):
            return AdapterResponse(
                provider=self.provider_name,
                status="error",
                execution_time=0.0,
                matches=[],
                error="Geçersiz görsel dosyası"
            )
        
        try:
            run_py_path = os.path.join(self.eyeofweb_path, "src", "run.py")
            abs_image_path = os.path.abspath(image_path)
            
            command = [
                self.python_path,
                run_py_path,
                "--image", abs_image_path,
                "--json"
            ]
            
            logger.info(f"EyeOfWeb komutu çalıştırılıyor: {' '.join(command)}")
            
            process = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=self.eyeofweb_path
            )
            
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=self.timeout
                )
            except asyncio.TimeoutError:
                process.kill()
                await process.wait()
                logger.error(f"EyeOfWeb timeout ({self.timeout}s)")
                return AdapterResponse(
                    provider=self.provider_name,
                    status="timeout",
                    execution_time=self.timeout,
                    matches=[],
                    error=f"İşlem zaman aşımına uğradı ({self.timeout}s)"
                )
            
            stdout_text = stdout.decode('utf-8', errors='ignore')
            stderr_text = stderr.decode('utf-8', errors='ignore')
            
            if process.returncode != 0:
                logger.error(f"EyeOfWeb hata kodu: {process.returncode}")
                logger.error(f"stderr: {stderr_text}")
                return AdapterResponse(
                    provider=self.provider_name,
                    status="error",
                    execution_time=0.0,
                    matches=[],
                    error=f"EyeOfWeb çalıştırma hatası: {stderr_text[:200]}"
                )
            
            try:
                result_data = json.loads(stdout_text)
            except json.JSONDecodeError as e:
                logger.error(f"JSON parse hatası: {e}")
                logger.error(f"stdout: {stdout_text[:500]}")
                return AdapterResponse(
                    provider=self.provider_name,
                    status="error",
                    execution_time=0.0,
                    matches=[],
                    error=f"JSON parse hatası: {str(e)}"
                )
            
            matches = self._parse_results(result_data)
            
            logger.info(f"EyeOfWeb başarılı: {len(matches)} sonuç bulundu")
            
            return AdapterResponse(
                provider=self.provider_name,
                status="success",
                execution_time=0.0,
                matches=matches,
                error=None
            )
            
        except Exception as e:
            logger.exception(f"EyeOfWeb beklenmeyen hata: {e}")
            return AdapterResponse(
                provider=self.provider_name,
                status="error",
                execution_time=0.0,
                matches=[],
                error=f"Beklenmeyen hata: {str(e)}"
            )
    
    def _parse_results(self, data: Dict[str, Any]) -> list[SearchMatch]:
        """EyeOfWeb JSON çıktısını standart SearchMatch listesine çevir"""
        matches = []
        
        results = data.get("results", [])
        for item in results:
            match = SearchMatch(
                platform=item.get("source", "unknown"),
                username=item.get("username"),
                profile_url=item.get("url"),
                image_url=item.get("image_url"),
                confidence=float(item.get("similarity", 0.0)),
                metadata=item.get("metadata", {})
            )
            matches.append(match)
        
        return matches


_eyeofweb_instance = None

def get_eyeofweb_adapter(config: Optional[Dict[str, Any]] = None) -> EyeOfWebAdapter:
    """EyeOfWeb adapter singleton instance"""
    global _eyeofweb_instance
    if _eyeofweb_instance is None:
        _eyeofweb_instance = EyeOfWebAdapter(config)
    return _eyeofweb_instance