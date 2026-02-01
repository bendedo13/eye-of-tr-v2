"""Analytics and Statistics models"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func

from app.db.database import Base


class SiteVisit(Base):
    """Site ziyaretçi takibi"""
    __tablename__ = "site_visits"

    id = Column(Integer, primary_key=True, index=True)
    
    # Visitor info (anonim)
    ip_address = Column(String(45), nullable=True)  # IPv6 support
    user_agent = Column(String(255), nullable=True)
    country = Column(String(100), nullable=True)
    
    # Visit info
    page_url = Column(String(255), nullable=True)
    referrer = Column(String(255), nullable=True)
    
    # Timestamp
    visited_at = Column(DateTime(timezone=True), server_default=func.now())


class SearchLog(Base):
    """Arama geçmişi ve istatistikleri"""
    __tablename__ = "search_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Anonim aramalar için nullable
    
    # Search details
    search_type = Column(String(50), nullable=False)  # face, name, osint
    query = Column(String(255), nullable=True)  # Arama terimi (isim vb.)
    file_name = Column(String(255), nullable=True)  # Yüklenen dosya adı
    
    # Results
    results_found = Column(Integer, default=0, nullable=False)
    is_successful = Column(Boolean, default=False, nullable=False)  # Sonuç bulundu mu?
    providers_used = Column(String(255), nullable=True)  # google,bing,yandex
    
    # Performance
    search_duration_ms = Column(Integer, nullable=True)  # Arama süresi (ms)
    
    # Credits
    credits_used = Column(Integer, default=1, nullable=False)
    was_blurred = Column(Boolean, default=False, nullable=False)  # Sonuç bulanık mı gösterildi?
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ReferralLog(Base):
    """Referral geçmişi"""
    __tablename__ = "referral_logs"

    id = Column(Integer, primary_key=True, index=True)
    
    # Referrer (davet eden)
    referrer_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    referrer_code = Column(String(10), nullable=False)
    
    # Referee (davet edilen)
    referee_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    referee_email = Column(String(255), nullable=False)
    
    # Reward
    reward_given = Column(Boolean, default=False, nullable=False)  # 3 referral = 1 credit
    credits_awarded = Column(Integer, default=0, nullable=False)
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())
