from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ---------- Source ----------
class SourceCreate(BaseModel):
    name: str = Field(..., max_length=200)
    kind: str = Field(..., pattern="^(website|open_dataset|news|archive|upload|instagram|twitter|facebook)$")
    base_url: str = Field(..., max_length=2048)
    is_enabled: bool = True
    crawl_config_json: str = "{}"
    rate_limit_rpm: int = Field(default=30, ge=1, le=300)
    rate_limit_concurrent: int = Field(default=2, ge=1, le=10)
    schedule_cron: Optional[str] = None
    schedule_enabled: bool = False


class SourceUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    is_enabled: Optional[bool] = None
    crawl_config_json: Optional[str] = None
    rate_limit_rpm: Optional[int] = Field(None, ge=1, le=300)
    rate_limit_concurrent: Optional[int] = Field(None, ge=1, le=10)
    schedule_cron: Optional[str] = None
    schedule_enabled: Optional[bool] = None


class SourceOut(BaseModel):
    id: int
    name: str
    kind: str
    base_url: str
    is_enabled: bool
    rate_limit_rpm: int
    schedule_cron: Optional[str]
    schedule_enabled: bool
    total_images_found: int
    total_faces_indexed: int
    last_crawl_at: Optional[datetime]
    last_crawl_status: Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# ---------- Job ----------
class JobOut(BaseModel):
    id: int
    source_id: int
    status: str
    message: Optional[str]
    pages_crawled: int
    images_found: int
    images_downloaded: int
    faces_detected: int
    faces_indexed: int
    images_skipped: int
    errors_count: int
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# ---------- Config ----------
class FaceIndexConfig(BaseModel):
    similarity_threshold: float = Field(default=0.6, ge=0.1, le=0.99)
    top_k_default: int = Field(default=10, ge=1, le=100)
    min_face_det_score: float = Field(default=0.5, ge=0.1, le=0.99)
    crawler_default_rpm: int = Field(default=30, ge=1, le=300)
    crawler_concurrent: int = Field(default=3, ge=1, le=20)
    max_faces_per_image: int = Field(default=10, ge=1, le=50)


# ---------- Status ----------
class FaceIndexStatus(BaseModel):
    total_faces: int = 0
    total_images: int = 0
    total_sources: int = 0
    active_sources: int = 0
    running_jobs: int = 0
    index_size_mb: float = 0.0
    embedding_model: str = ""
    embedding_version: int = 1


# ---------- Search result ----------
class FaceSearchMatch(BaseModel):
    face_id: str
    similarity: float
    source_name: str
    source_page_url: Optional[str]
    crop_url: Optional[str]
    gender: Optional[str]
    age_estimate: Optional[int]


# ---------- Proxy ----------
class ProxyCreate(BaseModel):
    proxy_url: str = Field(..., max_length=500)
    proxy_type: str = Field(default="http", pattern="^(http|https|socks5)$")
    country: Optional[str] = Field(None, max_length=10)
    label: Optional[str] = Field(None, max_length=100)
    is_active: bool = True


class ProxyOut(BaseModel):
    id: int
    proxy_url: str
    proxy_type: str
    country: Optional[str]
    label: Optional[str]
    is_active: bool
    last_check_at: Optional[datetime]
    last_check_ok: Optional[bool]
    success_count: int
    fail_count: int
    avg_response_ms: Optional[int]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class ProxyImport(BaseModel):
    proxies: str  # newline-separated proxy URLs
    proxy_type: str = Field(default="http", pattern="^(http|https|socks5)$")
