"""User model with credits, subscription, and referral system"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float
from sqlalchemy.sql import func
import secrets

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    # Basic info
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # Subscription & Credits
    tier = Column(String(20), default="free", nullable=False)  # free, premium, unlimited
    credits = Column(Integer, default=1, nullable=False)  # Yeni kayıt = 1 ücretsiz kredi
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Referral System
    referral_code = Column(String(10), unique=True, index=True, nullable=False)
    referred_by = Column(String(10), nullable=True)  # Kimin referansıyla kayıt oldu
    referral_count = Column(Integer, default=0, nullable=False)  # Kaç kişi davet etti
    
    # Statistics
    total_searches = Column(Integer, default=0, nullable=False)
    successful_searches = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_search_at = Column(DateTime(timezone=True), nullable=True)
    
    @property
    def success_rate(self) -> float:
        """Başarı oranını hesapla"""
        if self.total_searches == 0:
            return 0.0
        return (self.successful_searches / self.total_searches) * 100
    
    @staticmethod
    def generate_referral_code() -> str:
        """Benzersiz referral code oluştur"""
        return secrets.token_urlsafe(8)[:8].upper()
