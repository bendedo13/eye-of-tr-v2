from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class DataSourceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    kind: str = Field(pattern="^(website|api)$")
    base_url: str = Field(min_length=1, max_length=1024)

    crawl_config: Dict[str, Any] = Field(default_factory=dict)
    transform_config: Dict[str, Any] = Field(default_factory=dict)
    classify_config: Dict[str, Any] = Field(default_factory=dict)
    retention_config: Dict[str, Any] = Field(default_factory=dict)


class DataSourceUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    base_url: Optional[str] = Field(default=None, min_length=1, max_length=1024)
    is_enabled: Optional[bool] = None

    crawl_config: Optional[Dict[str, Any]] = None
    transform_config: Optional[Dict[str, Any]] = None
    classify_config: Optional[Dict[str, Any]] = None
    retention_config: Optional[Dict[str, Any]] = None


class DataSourceOut(BaseModel):
    id: int
    owner_user_id: int
    name: str
    kind: str
    base_url: str
    is_enabled: bool

    crawl_config: Dict[str, Any]
    transform_config: Dict[str, Any]
    classify_config: Dict[str, Any]
    retention_config: Dict[str, Any]

    last_crawl_started_at: Optional[datetime] = None
    last_crawl_finished_at: Optional[datetime] = None
    last_crawl_status: Optional[str] = None

    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CrawlJobStart(BaseModel):
    consent: bool = False
    policy_context: Dict[str, Any] = Field(default_factory=dict)
    strategy_override: Dict[str, Any] = Field(default_factory=dict)


class CrawlJobOut(BaseModel):
    id: int
    owner_user_id: int
    source_id: int
    status: str
    message: Optional[str] = None

    consent_received: bool
    policy_context: Dict[str, Any]
    strategy_override: Dict[str, Any]

    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None

    discovered_count: int
    fetched_count: int
    stored_count: int
    skipped_count: int
    failed_count: int

    created_at: datetime

    class Config:
        from_attributes = True


class DocumentOut(BaseModel):
    id: int
    owner_user_id: int
    source_id: int
    job_id: Optional[int] = None

    url: str
    canonical_url: Optional[str] = None
    title: Optional[str] = None
    content_text: str
    extracted: Dict[str, Any]

    language: Optional[str] = None
    category: Optional[str] = None
    tags: List[str]

    quality_score: Optional[float] = None
    quality_flags: List[str]
    pii_redacted: bool

    first_seen_at: datetime
    last_seen_at: datetime

    class Config:
        from_attributes = True


class DocumentSearchResponse(BaseModel):
    total: int
    items: List[DocumentOut]

