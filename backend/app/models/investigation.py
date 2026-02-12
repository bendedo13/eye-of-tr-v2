from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, JSON
from sqlalchemy.sql import func

from app.db.database import Base


class InvestigationRequest(Base):
    __tablename__ = "investigation_requests"

    id = Column(Integer, primary_key=True, index=True)

    # User (authenticated or guest)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    guest_name = Column(String(120), nullable=True)
    guest_email = Column(String(255), nullable=True)
    guest_phone = Column(String(50), nullable=True)

    # Photo
    photo_urls = Column(JSON, nullable=False)  # ["/uploads/investigation/xxx.jpg"]

    # Location (mandatory)
    country = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    detail = Column(Text, nullable=True)  # Extra detail (district, neighborhood, etc.)

    # Search type and pricing
    search_type = Column(String(20), nullable=False)  # "basic" | "detailed"
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="TRY")

    # Status
    status = Column(String(20), default="pending")  # pending | paid | in_progress | completed | cancelled
    payment_method = Column(String(20), nullable=True)  # bank | card

    # Results
    result_json = Column(Text, nullable=True)
    result_pdf_url = Column(String(500), nullable=True)
    result_summary = Column(Text, nullable=True)

    # Admin
    admin_note = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
