from sqlalchemy import Column, DateTime, Integer, String, JSON
from sqlalchemy.sql import func

from app.db.database import Base


class SearchResult(Base):
    __tablename__ = "search_results"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    image_sha256 = Column(String(64), nullable=False, index=True)
    ahash = Column(String(32), nullable=False, index=True)
    phash = Column(String(32), nullable=False, index=True)
    hint = Column(String(200), nullable=True)
    results = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
