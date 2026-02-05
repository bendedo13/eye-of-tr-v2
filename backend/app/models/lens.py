from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class LensAnalysisLog(Base):
    __tablename__ = "lens_analysis_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    search_type = Column(String, index=True)  # face_search, location_search
    image_hash = Column(String, index=True)
    results = Column(JSON)  # Stores the full parsed result
    raw_response = Column(JSON, nullable=True) # Stores raw API response if needed for debug
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Optional: Link to user if needed
    user = relationship("User", back_populates="lens_logs")

# Update User model to include relationship (monkey patch or user file update needed if we want back_populates to work perfectly, 
# but for now we can skip modifying User model to avoid complex migrations if not strictly necessary. 
# We'll just define the foreign key.)
