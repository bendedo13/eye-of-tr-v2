from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Uygulama ayarları"""
    
    API_TITLE: str = "Eye of TR - Face Search API"
    API_VERSION: str = "1.0.0"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    DEBUG: bool = True
    
    CORS_ORIGINS: list = ["*"]
    
    UPLOAD_DIR: str = "tmp"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024
    ALLOWED_EXTENSIONS: set = {".jpg", ".jpeg", ".png", ".webp"}
    
    EYEOFWEB_PATH: str = r"C:\Users\Asus\Desktop\eye_of_web"
    EYEOFWEB_PYTHON: Optional[str] = None
    EYEOFWEB_TIMEOUT: int = 30
    
    FACECHECK_API_KEY: Optional[str] = None
    FACECHECK_API_URL: str = "https://facecheck.id/api/v1"
    
    PIMEYES_API_KEY: Optional[str] = None
    PIMEYES_API_URL: str = "https://api.pimeyes.com/v1"
    
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    def get_eyeofweb_python_path(self) -> str:
        """EyeOfWeb Python executable yolunu döndür"""
        if self.EYEOFWEB_PYTHON:
            return self.EYEOFWEB_PYTHON
        
        venv_python = os.path.join(
            self.EYEOFWEB_PATH,
            "venv",
            "Scripts",
            "python.exe"
        )
        
        if os.path.exists(venv_python):
            return venv_python
        
        return "python"


settings = Settings()