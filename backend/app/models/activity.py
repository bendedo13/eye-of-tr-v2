from sqlalchemy import Column, Integer, String, Date, DateTime, Text
from sqlalchemy.sql import func

from app.db.database import Base


class ActivityDaily(Base):
    __tablename__ = "activity_daily"

    id = Column(Integer, primary_key=True, index=True)
    day = Column(Date, index=True, nullable=False)
    user_id = Column(Integer, index=True, nullable=True)
    device_id = Column(String(80), index=True, nullable=False)
    seconds = Column(Integer, default=0, nullable=False)
    last_seen_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_path = Column(Text, nullable=True)
    last_locale = Column(String(5), nullable=True)
    ip = Column(String(64), nullable=True)

