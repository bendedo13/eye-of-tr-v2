from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from app.db.database import Base


class ProviderDailyMetric(Base):
    __tablename__ = "provider_daily_metrics"

    id = Column(Integer, primary_key=True, index=True)
    day = Column(String(10), nullable=False, index=True)
    provider = Column(String(50), nullable=False, index=True)

    attempts = Column(Integer, default=0, nullable=False)
    successes = Column(Integer, default=0, nullable=False)
    total_latency_ms = Column(Integer, default=0, nullable=False)
    total_matches = Column(Integer, default=0, nullable=False)

    reverse_image_attempts = Column(Integer, default=0, nullable=False)
    reverse_image_successes = Column(Integer, default=0, nullable=False)

    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

