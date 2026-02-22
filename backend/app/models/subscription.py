"""Subscription and Payment models"""
from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.database import Base


class Subscription(Base):
    """Kullanıcı abonelik bilgileri"""
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Plan details
    plan_name = Column(String(50), nullable=False)  # free, basic
    plan_price = Column(Float, nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    auto_renew = Column(Boolean, default=False, nullable=False)
    
    # Dates
    start_date = Column(DateTime(timezone=True), server_default=func.now())
    end_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Payment(Base):
    """Ödeme geçmişi"""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Payment info
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="TRY", nullable=False)
    plan_name = Column(String(50), nullable=False)
    
    # Status
    status = Column(String(20), default="pending", nullable=False)  # pending, completed, failed
    payment_method = Column(String(50), nullable=True)  # credit_card, bank_transfer, etc.
    transaction_id = Column(String(255), unique=True, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
