from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text
from sqlalchemy.sql import func

from app.db.database import Base


class BankTransferRequest(Base):
    __tablename__ = "bank_transfer_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Purchase intent
    plan_id = Column(String(50), nullable=True)
    plan_name = Column(String(100), nullable=True)
    credits_requested = Column(Integer, nullable=True)

    # Payment info
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="TRY", nullable=False)

    # Status
    status = Column(String(20), default="pending", nullable=False)  # pending, approved, rejected

    # Notes
    user_note = Column(Text, nullable=True)
    admin_note = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
