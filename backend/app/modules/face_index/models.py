from datetime import datetime
from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text,
    func,
)
from app.db.database import Base


class FaceSource(Base):
    __tablename__ = "fi_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    kind = Column(String(30), nullable=False)  # website|open_dataset|news|archive|upload|instagram|twitter|facebook|tiktok
    base_url = Column(String(2048), nullable=False)
    is_enabled = Column(Boolean, default=True, nullable=False)

    crawl_config_json = Column(Text, default="{}")
    robots_txt_cached = Column(Text, nullable=True)
    robots_txt_fetched_at = Column(DateTime(timezone=True), nullable=True)

    rate_limit_rpm = Column(Integer, default=30)
    rate_limit_concurrent = Column(Integer, default=2)

    schedule_cron = Column(String(100), nullable=True)
    schedule_enabled = Column(Boolean, default=False)

    total_images_found = Column(Integer, default=0)
    total_faces_indexed = Column(Integer, default=0)
    last_crawl_at = Column(DateTime(timezone=True), nullable=True)
    last_crawl_status = Column(String(30), nullable=True)

    # Stateful crawling - resume from last position
    crawl_state_json = Column(Text, default="{}")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class FaceCrawlJob(Base):
    __tablename__ = "fi_crawl_jobs"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("fi_sources.id"), nullable=False, index=True)

    status = Column(String(30), default="queued")  # queued|running|succeeded|failed|cancelled
    message = Column(String(500), nullable=True)

    pages_crawled = Column(Integer, default=0)
    images_found = Column(Integer, default=0)
    images_downloaded = Column(Integer, default=0)
    faces_detected = Column(Integer, default=0)
    faces_indexed = Column(Integer, default=0)
    images_skipped = Column(Integer, default=0)
    errors_count = Column(Integer, default=0)

    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class FaceImage(Base):
    __tablename__ = "fi_images"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("fi_sources.id"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("fi_crawl_jobs.id"), nullable=True, index=True)

    source_url = Column(String(2048), nullable=False)
    source_page_url = Column(String(2048), nullable=True)
    url_hash = Column(String(64), nullable=False, index=True)
    image_hash = Column(String(64), nullable=False, index=True)

    local_path = Column(String(512), nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    content_type = Column(String(50), nullable=True)

    faces_count = Column(Integer, default=0)
    metadata_json = Column(Text, default="{}")

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class IndexedFace(Base):
    __tablename__ = "fi_faces"

    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("fi_images.id"), nullable=False, index=True)
    source_id = Column(Integer, ForeignKey("fi_sources.id"), nullable=False, index=True)

    face_id = Column(String(36), unique=True, nullable=False, index=True)
    vector_idx = Column(Integer, nullable=False)

    bbox_x1 = Column(Float, nullable=True)
    bbox_y1 = Column(Float, nullable=True)
    bbox_x2 = Column(Float, nullable=True)
    bbox_y2 = Column(Float, nullable=True)

    gender = Column(String(10), nullable=True)
    age_estimate = Column(Integer, nullable=True)
    detection_score = Column(Float, nullable=True)

    embedding_model = Column(String(100), nullable=False)
    embedding_version = Column(Integer, default=1)

    crop_path = Column(String(512), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ProxyServer(Base):
    __tablename__ = "fi_proxies"

    id = Column(Integer, primary_key=True, index=True)
    proxy_url = Column(String(500), nullable=False)
    proxy_type = Column(String(20), nullable=False)  # http | https | socks5
    country = Column(String(10), nullable=True)
    label = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_check_at = Column(DateTime(timezone=True), nullable=True)
    last_check_ok = Column(Boolean, nullable=True)
    success_count = Column(Integer, default=0)
    fail_count = Column(Integer, default=0)
    avg_response_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
