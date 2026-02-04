from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.db.database import Base


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(80), index=True, nullable=False)
    actor_email = Column(String(255), index=True, nullable=True)
    actor_ip = Column(String(64), nullable=True)
    user_agent = Column(String(255), nullable=True)
    trace_id = Column(String(64), nullable=True)
    resource_type = Column(String(80), nullable=True)
    resource_id = Column(String(80), nullable=True)
    meta_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

