import hashlib
import secrets
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User
from app.models.verification import PasswordReset
from app.services.mailer import MailerError


class PasswordResetError(Exception):
    pass


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _now() -> datetime:
    return datetime.utcnow()


def _generate_token() -> str:
    return secrets.token_urlsafe(32)


def create_reset(db: Session, user: User) -> str:
    token = _generate_token()
    expires_at = _now() + timedelta(minutes=30)
    pr = PasswordReset(user_id=user.id, token_hash=_hash_token(token), expires_at=expires_at, used=False)
    db.add(pr)
    db.commit()
    return token


def mark_used(db: Session, pr: PasswordReset) -> None:
    pr.used = True
    pr.used_at = _now()
    db.commit()


def verify_token(db: Session, user: User, token: str) -> PasswordReset:
    token_hash = _hash_token(token)
    pr = (
        db.query(PasswordReset)
        .filter(PasswordReset.user_id == user.id)
        .filter(PasswordReset.token_hash == token_hash)
        .order_by(PasswordReset.created_at.desc())
        .first()
    )
    if not pr:
        raise PasswordResetError("Geçersiz veya süresi dolmuş token.")
    if pr.used:
        raise PasswordResetError("Token daha önce kullanılmış.")
    if _now() > pr.expires_at:
        raise PasswordResetError("Token süresi dolmuş.")
    return pr


def send_reset_email(email: str, reset_url: str) -> None:
    from app.services.mailer import send_password_reset

    try:
        send_password_reset(email, reset_url)
    except MailerError:
        if settings.DEBUG:
            return
        raise

