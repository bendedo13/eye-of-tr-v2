from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # API Settings
    API_TITLE: str = "FaceSeek API"
    API_VERSION: str = "1.0.0"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    
    # Upload Settings
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Database
    DATABASE_URL: str = "sqlite:///./faceseek.db"
    
    # Security
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # CORS - String olarak, virgülle ayrılmış
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    
    # API Keys
    BING_API_KEY: Optional[str] = None
    YANDEX_API_KEY: Optional[str] = None
    FACECHECK_API_KEY: Optional[str] = None
    FACECHECK_API_URL: str = "https://facecheck.id/api/v1"
    
    # LemonSqueezy
    LEMONSQUEEZY_API_KEY: Optional[str] = None
    LEMONSQUEEZY_STORE_ID: Optional[str] = None
    LEMONSQUEEZY_WEBHOOK_SECRET: str = "eyeoftr_secret_2024"
    
    @property
    def cors_origins_list(self):
        """CORS origins'i liste olarak döndür"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()