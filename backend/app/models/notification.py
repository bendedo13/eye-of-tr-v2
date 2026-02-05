from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
import enum

class NotificationType(str, enum.Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    PROMOTION = "promotion"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    message = Column(Text)
    type = Column(String, default=NotificationType.INFO.value)
    media_url = Column(String, nullable=True)
    action_url = Column(String, nullable=True) # Link to redirect
    target_audience = Column(String, default="all") # all, active, premium, specific
    target_user_id = Column(Integer, nullable=True) # If specific user
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    reads = relationship("NotificationRead", back_populates="notification", cascade="all, delete-orphan")

class NotificationRead(Base):
    __tablename__ = "notification_reads"

    id = Column(Integer, primary_key=True, index=True)
    notification_id = Column(Integer, ForeignKey("notifications.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    read_at = Column(DateTime(timezone=True), server_default=func.now())
    
    notification = relationship("Notification", back_populates="reads")
    user = relationship("User", back_populates="notification_reads")

class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # e.g., "welcome", "reset_password"
    subject_template = Column(String)
    body_html_template = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    recipient_email = Column(String, index=True)
    subject = Column(String)
    status = Column(String) # sent, failed, queued
    error_message = Column(Text, nullable=True)
    template_name = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
