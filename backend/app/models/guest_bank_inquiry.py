from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func

from app.db.database import Base


class GuestBankInquiry(Base):
    __tablename__ = "guest_bank_inquiries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    desired_plan = Column(String(120), nullable=True)
    desired_credits = Column(Integer, nullable=True)
    message = Column(Text, nullable=True)
    status = Column(String(20), default="new", nullable=False)  # new, contacted, closed

    created_at = Column(DateTime(timezone=True), server_default=func.now())
