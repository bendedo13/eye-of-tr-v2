from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Float
from sqlalchemy.sql import func

from app.db.database import Base


class DataSource(Base):
    __tablename__ = "dp_sources"

    id = Column(Integer, primary_key=True, index=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    name = Column(String(120), nullable=False)
    kind = Column(String(30), nullable=False)  # website | api
    base_url = Column(String(1024), nullable=False)

    is_enabled = Column(Boolean, default=True, nullable=False)

    crawl_config_json = Column(Text, nullable=False, default="{}")
    transform_config_json = Column(Text, nullable=False, default="{}")
    classify_config_json = Column(Text, nullable=False, default="{}")
    retention_config_json = Column(Text, nullable=False, default="{}")

    last_crawl_started_at = Column(DateTime(timezone=True), nullable=True)
    last_crawl_finished_at = Column(DateTime(timezone=True), nullable=True)
    last_crawl_status = Column(String(30), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)


class CrawlJob(Base):
    __tablename__ = "dp_jobs"

    id = Column(Integer, primary_key=True, index=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    source_id = Column(Integer, ForeignKey("dp_sources.id"), nullable=False, index=True)

    status = Column(String(30), nullable=False, default="queued")  # queued | running | succeeded | failed | cancelled
    message = Column(String(500), nullable=True)

    consent_received = Column(Boolean, default=False, nullable=False)
    policy_context_json = Column(Text, nullable=False, default="{}")

    strategy_override_json = Column(Text, nullable=False, default="{}")

    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)

    discovered_count = Column(Integer, default=0, nullable=False)
    fetched_count = Column(Integer, default=0, nullable=False)
    stored_count = Column(Integer, default=0, nullable=False)
    skipped_count = Column(Integer, default=0, nullable=False)
    failed_count = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Document(Base):
    __tablename__ = "dp_documents"

    id = Column(Integer, primary_key=True, index=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    source_id = Column(Integer, ForeignKey("dp_sources.id"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("dp_jobs.id"), nullable=True, index=True)

    url = Column(String(2048), nullable=False)
    url_hash = Column(String(64), nullable=False, index=True)
    canonical_url = Column(String(2048), nullable=True)

    title = Column(String(512), nullable=True)
    content_text = Column(Text, nullable=False, default="")
    raw_text = Column(Text, nullable=True)
    extracted_json = Column(Text, nullable=False, default="{}")

    language = Column(String(16), nullable=True)
    category = Column(String(64), nullable=True, index=True)
    tags_json = Column(Text, nullable=False, default="[]")

    quality_score = Column(Float, nullable=True)
    quality_flags_json = Column(Text, nullable=False, default="[]")

    pii_redacted = Column(Boolean, default=False, nullable=False)

    first_seen_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_seen_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

