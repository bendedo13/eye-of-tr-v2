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
    SECRET_KEY: str = "INSECURE_DEV_KEY_CHANGE_IN_PRODUCTION"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Admin
    ADMIN_EMAIL: Optional[str] = None
    ADMIN_API_KEY: Optional[str] = None

    REDIS_URL: Optional[str] = None
    
    # CORS - String olarak, virgülle ayrılmış
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,https://face-seek.com,https://www.face-seek.com"
    
    # API Keys
    BING_API_KEY: Optional[str] = None
    YANDEX_API_KEY: Optional[str] = None
    YANDEX_FOLDER_ID: Optional[str] = None
    FACECHECK_API_KEY: Optional[str] = None
    FACECHECK_API_URL: str = "https://facecheck.id/api/v1"
    SERPAPI_API_KEY: Optional[str] = None
    SERPAPI_ENGINE: str = "google_lens"
    SERPAPI_GL: str = "tr"
    SERPAPI_HL: str = "tr"
    SERPAPI_TIMEOUT: int = 30
    RAPIDAPI_KEY: Optional[str] = None
    RAPIDAPI_HOST: str = "real-time-image-search.p.rapidapi.com"
    RAPIDAPI_IMAGE_SEARCH_ENDPOINT: str = "https://real-time-image-search.p.rapidapi.com/search"
    RAPIDAPI_IMAGE_SEARCH_SIZE: str = "any"
    RAPIDAPI_IMAGE_SEARCH_COLOR: str = "any"
    RAPIDAPI_IMAGE_SEARCH_TYPE: str = "any"
    RAPIDAPI_IMAGE_SEARCH_TIME: str = "any"
    RAPIDAPI_IMAGE_SEARCH_USAGE_RIGHTS: str = "any"
    RAPIDAPI_IMAGE_SEARCH_FILE_TYPE: str = "any"
    RAPIDAPI_IMAGE_SEARCH_ASPECT_RATIO: str = "any"
    RAPIDAPI_IMAGE_SEARCH_SAFE_SEARCH: str = "off"
    RAPIDAPI_IMAGE_SEARCH_REGION: str = "us"

    # Lens API
    RAPIDAPI_LENS_KEY: str = "e04cfd391dmsh5bad32e4055f7d3p1be7c6jsn2c85bac04ee7"
    RAPIDAPI_LENS_HOST: str = "real-time-lens-data.p.rapidapi.com"
    RAPIDAPI_LENS_BASE_URL: str = "https://real-time-lens-data.p.rapidapi.com"

    PUBLIC_BASE_URL: str = "https://www.face-seek.com"

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
    RATE_LIMIT_REVERSE_SEARCH_PER_MINUTE: int = 5
    RATE_LIMIT_AUTH_PER_MINUTE: int = 20
    RATE_LIMIT_LOCATION_INTELLIGENCE_PER_MINUTE: int = 8
    RATE_LIMIT_VISUAL_LOCATION_PER_MINUTE: int = 6
    RATE_LIMIT_DATA_PLATFORM_PER_MINUTE: int = 30

    LOCATION_INTELLIGENCE_SPAM_PER_MINUTE: int = 4
    LOCATION_INTELLIGENCE_SPAM_PER_DAY: int = 60

    VISUAL_LOCATION_SPAM_PER_MINUTE: int = 3
    VISUAL_LOCATION_SPAM_PER_DAY: int = 40

    SEARCH_RESULT_CACHE_TTL_SECONDS: int = 3600
    REVERSE_SEARCH_CACHE_TTL_SECONDS: int = 21600
    REVERSE_SEARCH_RESULT_TTL_SECONDS: int = 86400
    SEARCH_FALLBACK_MIN_MATCHES: int = 5
    REVERSE_IMAGE_SUCCESS_RATE_THRESHOLD: float = 0.90

    GEONAMES_USERNAME: str = ""
    VISUAL_LOCATION_WEB_LOCATION_ENABLED: bool = False
    VISUAL_LOCATION_CANARY_PERCENT: int = 0

    BING_VISUAL_SEARCH_ENABLED: bool = True
    YANDEX_REVERSE_IMAGE_ENABLED: bool = False

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

    # LemonSqueezy
    LEMONSQUEEZY_API_KEY: Optional[str] = None
    LEMONSQUEEZY_STORE_ID: Optional[str] = None
    LEMONSQUEEZY_WEBHOOK_SECRET: str = ""

    # OpenAI Configuration
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"  # Default to cost-effective model
    OPENAI_ENABLED: bool = True  # Feature flag
    
    @property
    def cors_origins_list(self):
        """CORS origins'i liste olarak döndür"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"


def get_settings() -> Settings:
    # Create a fresh Settings instance so env overrides can take effect even if
    # other modules imported settings earlier.
    return Settings()


class _SettingsProxy:
    def __getattr__(self, name):
        return getattr(get_settings(), name)

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}({get_settings()!r})"


settings = _SettingsProxy()
