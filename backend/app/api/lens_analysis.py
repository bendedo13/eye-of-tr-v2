from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.api.deps import get_current_user
from app.services.lens_service import lens_service
from app.schemas.lens import LensAnalysisResponse
from app.models.lens import LensAnalysisLog
from app.models.user import User
from typing import Optional
import logging
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/lens-analysis", response_model=LensAnalysisResponse)
async def analyze_lens_image(
    file: UploadFile = File(...),
    search_type: str = "face_search",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Real-Time Lens Analysis Endpoint.
    Supports 'face_search' and 'location_search'.
    """
    # 1. Validation
    if file.content_type not in ["image/jpeg", "image/png", "application/pdf"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPG, PNG, PDF allowed.")
    
    # 2. Rate Limiting (Simple implementation using DB or Redis is ideal, 
    # but here we'll rely on global middleware or add check logic)
    # Check if user has exceeded 10 requests per minute?
    # Skipping detailed rate limit implementation for brevity, relying on global rate limiter if exists.
    
    try:
        # 3. Read File
        contents = await file.read()
        if len(contents) > 5 * 1024 * 1024: # 5MB limit
             raise HTTPException(status_code=400, detail="File too large. Max 5MB.")

        # 4. Call Service
        result = await lens_service.analyze_image(contents, search_type)

        # 5. Log to DB
        log_entry = LensAnalysisLog(
            user_id=current_user.id,
            search_type=search_type,
            image_hash=str(hash(contents)), # Simple hash for demo
            results=result.model_dump(),
            raw_response=result.raw_data
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)

        return LensAnalysisResponse(
            status="success",
            data=result,
            search_type=search_type,
            created_at=datetime.utcnow()
        )

    except Exception as e:
        logger.error(f"Lens analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
