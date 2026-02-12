"""Investigation request API endpoints."""
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.database import get_db
from app.models.investigation import InvestigationRequest
from app.models.user import User
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(prefix="/api/investigation", tags=["investigation"])

security = HTTPBearer(auto_error=False)

# Pricing
INVESTIGATION_PRICING = {
    "basic": {"TRY": 500.0, "USD": 20.0},
    "detailed": {"TRY": 1000.0, "USD": 50.0},
}


def _save_investigation_photo(file: UploadFile) -> str:
    """Validate and save investigation photo."""
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    max_file_size = 10 * 1024 * 1024  # 10MB

    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format. Allowed: {', '.join(allowed_extensions)}",
        )

    contents = file.file.read(max_file_size + 1)
    if len(contents) > max_file_size:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

    unique_filename = f"inv_{uuid.uuid4()}{file_ext}"
    upload_dir = Path(settings.UPLOAD_DIR) / "investigation"
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / unique_filename
    with open(file_path, "wb") as f:
        f.write(contents)

    return f"/uploads/investigation/{unique_filename}"


@router.post("/request")
def create_investigation_request(
    photo: UploadFile = File(...),
    country: str = Form(...),
    city: str = Form(...),
    search_type: str = Form(...),
    detail: str = Form(None),
    name: str = Form(None),
    email: str = Form(None),
    phone: str = Form(None),
    currency: str = Form("TRY"),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
):
    """Create a new investigation request (authenticated or guest)."""
    # Validate search type
    if search_type not in ("basic", "detailed"):
        raise HTTPException(status_code=400, detail="search_type must be 'basic' or 'detailed'")

    # Validate currency
    currency = currency.upper()
    if currency not in ("TRY", "USD"):
        currency = "TRY"

    # Resolve user from token if present
    user = None
    if credentials:
        from app.core.security import decode_token

        sub = decode_token(credentials.credentials)
        if sub:
            user = db.query(User).filter(User.id == int(sub)).first()

    # Guest must provide name + email
    if not user:
        if not name or not email:
            raise HTTPException(
                status_code=400,
                detail="Name and email are required for guest requests",
            )

    # Save photo
    photo_url = _save_investigation_photo(photo)

    # Calculate amount
    amount = INVESTIGATION_PRICING[search_type][currency]

    investigation = InvestigationRequest(
        user_id=user.id if user else None,
        guest_name=name if not user else None,
        guest_email=email if not user else (email or user.email),
        guest_phone=phone,
        photo_urls=[photo_url],
        country=country.strip(),
        city=city.strip(),
        detail=detail.strip() if detail else None,
        search_type=search_type,
        amount=amount,
        currency=currency,
        status="pending",
    )
    db.add(investigation)
    db.commit()
    db.refresh(investigation)

    return {
        "status": "success",
        "id": investigation.id,
        "amount": amount,
        "currency": currency,
        "search_type": search_type,
        "message": "Investigation request created. Our team will process it within 48 hours.",
    }


@router.get("/my-requests")
def get_my_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's investigation requests."""
    rows = (
        db.query(InvestigationRequest)
        .filter(InvestigationRequest.user_id == current_user.id)
        .order_by(desc(InvestigationRequest.created_at))
        .all()
    )
    return {
        "items": [
            {
                "id": r.id,
                "photo_urls": r.photo_urls,
                "country": r.country,
                "city": r.city,
                "detail": r.detail,
                "search_type": r.search_type,
                "amount": r.amount,
                "currency": r.currency,
                "status": r.status,
                "result_summary": r.result_summary,
                "result_pdf_url": r.result_pdf_url,
                "created_at": r.created_at,
                "completed_at": r.completed_at,
            }
            for r in rows
        ]
    }


@router.get("/request/{request_id}")
def get_investigation_detail(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get investigation request detail."""
    row = db.query(InvestigationRequest).filter(
        InvestigationRequest.id == request_id,
        InvestigationRequest.user_id == current_user.id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Investigation request not found")
    return {
        "id": row.id,
        "photo_urls": row.photo_urls,
        "country": row.country,
        "city": row.city,
        "detail": row.detail,
        "search_type": row.search_type,
        "amount": row.amount,
        "currency": row.currency,
        "status": row.status,
        "result_json": row.result_json,
        "result_summary": row.result_summary,
        "result_pdf_url": row.result_pdf_url,
        "created_at": row.created_at,
        "completed_at": row.completed_at,
    }
