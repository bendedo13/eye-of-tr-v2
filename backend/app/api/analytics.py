from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.database import get_db
from app.models.activity import ActivityDaily


router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


@router.post("/heartbeat")
def heartbeat(request: Request, payload: dict, db: Session = Depends(get_db)):
    device_id = str(payload.get("device_id") or "").strip()
    if not device_id or len(device_id) < 6:
        raise HTTPException(status_code=400, detail="Invalid device")

    seconds = int(payload.get("seconds") or 15)
    seconds = max(1, min(120, seconds))
    path = str(payload.get("path") or "")[:512]
    locale = str(payload.get("locale") or "")[:8]

    user_id = None
    auth = request.headers.get("authorization")
    if auth and auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1].strip()
        sub = decode_token(token)
        if sub:
            try:
                user_id = int(sub)
            except Exception:
                user_id = None

    today = date.today()
    ip = _client_ip(request)
    now = datetime.now(timezone.utc)

    row = (
        db.query(ActivityDaily)
        .filter(ActivityDaily.day == today)
        .filter(ActivityDaily.device_id == device_id)
        .filter(ActivityDaily.user_id == user_id)
        .first()
    )
    if row:
        row.seconds = int(row.seconds or 0) + seconds
        row.last_seen_at = now
        row.last_path = path
        row.last_locale = locale
        row.ip = ip
    else:
        row = ActivityDaily(
            day=today,
            user_id=user_id,
            device_id=device_id,
            seconds=seconds,
            last_seen_at=now,
            last_path=path,
            last_locale=locale,
            ip=ip,
        )
        db.add(row)
    db.commit()
    return {"status": "ok"}
