from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    message = Column(Text)
    type = Column(String, default="text") # text, image, video, system
    media_url = Column(String, nullable=True)
    target_audience = Column(String, default="all") # all, active, premium, specific
    target_user_id = Column(Integer, nullable=True) # Tek kullanıcı ise ID
    is_read = Column(Boolean, default=False) # Genel bildirimlerde client-side takip edilebilir, kişiselde DB
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Opsiyonel: Okuyan kullanıcıların listesi (JSON olarak veya ayrı tabloda tutulabilir)
    # Basitlik için şimdilik global bildirim mantığı veya tekil kullanıcı mantığı
