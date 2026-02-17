"""Pricing override models for dynamic pricing management"""
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.database import Base


class PricingOverride(Base):
    """Admin-configured pricing overrides for subscription plans and credit packs.
    
    NULL values indicate "use default from PRICING_PLANS constant".
    This allows selective overriding of specific pricing fields while maintaining
    backward compatibility with hardcoded defaults.
    """
    __tablename__ = "pricing_overrides"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(String(50), unique=True, nullable=False, index=True)
    
    # Pricing fields (NULL = use default)
    price_try = Column(Float, nullable=True)
    price_usd = Column(Float, nullable=True)
    
    # Credit fields (NULL = use default)
    credits = Column(Integer, nullable=True)
    search_normal = Column(Integer, nullable=True)
    search_detailed = Column(Integer, nullable=True)
    search_location = Column(Integer, nullable=True)
    
    # Audit trail
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationship
    updater = relationship("User", foreign_keys=[updated_by])
