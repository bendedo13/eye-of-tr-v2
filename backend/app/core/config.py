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

    # FAISS
    FAISS_DIR: str = "faiss"
    FAISS_INDEX_NAME: str = "faces.index"
    FAISS_META_NAME: str = "faces.meta.json"
    FAISS_INDEX_TYPE: str = "flatl2"  # flatl2 | ivfflat
    FAISS_DIM: int = 512
    FAISS_TOP_K_DEFAULT: int = 3
    
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
    YANDEX_FOLDER_ID: Optional[str] = None
    FACECHECK_API_KEY: Optional[str] = None
    FACECHECK_API_URL: str = "https://facecheck.id/api/v1"

    # Face Embedding
    FACE_EMBEDDER_BACKEND: str = "insightface"  # insightface | mock
    INSIGHTFACE_MODEL: str = "buffalo_l"
    INSIGHTFACE_DET_THRESH: float = 0.75
    INSIGHTFACE_DET_SIZE_W: int = 640
    INSIGHTFACE_DET_SIZE_H: int = 640
    INSIGHTFACE_CTX_ID: int = 0

    # FaceCheck
    FACECHECK_ENABLED: bool = True
    FACECHECK_RATE_LIMIT_PER_MINUTE: int = 30

    # Rate limiting
    RATE_LIMIT_UPLOAD_PER_MINUTE: int = 12
    RATE_LIMIT_SEARCH_PER_MINUTE: int = 12
    RATE_LIMIT_AUTH_PER_MINUTE: int = 20
    RATE_LIMIT_LOCATION_INTELLIGENCE_PER_MINUTE: int = 8

    LOCATION_INTELLIGENCE_SPAM_PER_MINUTE: int = 4
    LOCATION_INTELLIGENCE_SPAM_PER_DAY: int = 60

    # Registration protection
    MAX_ACCOUNTS_PER_IP_PER_DAY: int = 3
    EMAIL_VERIFICATION_CODE_TTL_MINUTES: int = 15
    EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS: int = 60

    # Email (SMTP)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASS: Optional[str] = None
    SMTP_FROM: Optional[str] = None

    # Location intelligence
    LOCATION_INTELLIGENCE_SPAM_PER_MINUTE: int = 6
    LOCATION_INTELLIGENCE_SPAM_PER_DAY: int = 50
    
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
