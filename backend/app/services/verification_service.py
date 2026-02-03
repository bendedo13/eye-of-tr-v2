import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User
from app.models.verification import EmailVerification, IpRegistration, DeviceRegistration
from app.services.mailer import MailerError, send_verification_code


class VerificationError(Exception):
    pass


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _generate_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def record_ip_registration(db: Session, ip: str, user_id: int | None = None) -> None:
    db.add(IpRegistration(ip=ip, user_id=user_id))
    db.commit()


def enforce_ip_limit(db: Session, ip: str) -> None:
    cutoff = _now() - timedelta(days=1)
    count = (
        db.query(IpRegistration)
        .filter(IpRegistration.ip == ip)
        .filter(IpRegistration.created_at >= cutoff)
        .count()
    )
    if count >= settings.MAX_ACCOUNTS_PER_IP_PER_DAY:
        raise VerificationError("Bu ağdan çok fazla kayıt denemesi yapıldı. Lütfen daha sonra tekrar deneyin.")


def enforce_device_limit(db: Session, device_id: str) -> None:
    exists = db.query(DeviceRegistration).filter(DeviceRegistration.device_id == device_id).first()
    if exists:
        raise VerificationError("Bu cihazdan daha önce hesap oluşturulmuş.")


def bind_device(db: Session, user: User, device_id: str, ip: str) -> None:
    db.add(DeviceRegistration(device_id=device_id, user_id=user.id, first_ip=ip))
    db.commit()

def ensure_device_bound(db: Session, user: User, device_id: str) -> None:
    rec = db.query(DeviceRegistration).filter(DeviceRegistration.device_id == device_id).first()
    if not rec or rec.user_id != user.id:
        raise VerificationError("Cihaz doğrulanamadı.")


def create_or_replace_verification(db: Session, user: User) -> str:
    code = _generate_code()
    expires = _now() + timedelta(minutes=settings.EMAIL_VERIFICATION_CODE_TTL_MINUTES)

    ev = db.query(EmailVerification).filter(EmailVerification.user_id == user.id).first()
    if ev and ev.verified:
        raise VerificationError("Hesap zaten doğrulanmış.")

    if ev:
        ev.code_hash = _hash_code(code)
        ev.expires_at = expires
        ev.attempts = 0
        ev.last_sent_at = _now()
        db.commit()
    else:
        db.add(
            EmailVerification(
                user_id=user.id,
                code_hash=_hash_code(code),
                expires_at=expires,
                attempts=0,
                verified=False,
                last_sent_at=_now(),
            )
        )
        db.commit()

    try:
        send_verification_code(user.email, code)
    except MailerError:
        if not settings.DEBUG:
            raise
    return code


def resend_code(db: Session, user: User) -> str:
    ev = db.query(EmailVerification).filter(EmailVerification.user_id == user.id).first()
    if not ev:
        create_or_replace_verification(db, user)
        return
    if ev.verified:
        raise VerificationError("Hesap zaten doğrulanmış.")
    cooldown_until = ev.last_sent_at + timedelta(seconds=settings.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS)
    if _now() < cooldown_until:
        raise VerificationError("Kod çok sık isteniyor. Lütfen biraz sonra tekrar deneyin.")
    return create_or_replace_verification(db, user)


def verify_code(db: Session, user: User, code: str) -> None:
    ev = db.query(EmailVerification).filter(EmailVerification.user_id == user.id).first()
    if not ev:
        raise VerificationError("Doğrulama kaydı bulunamadı.")
    if ev.verified:
        return
    if _now() > ev.expires_at:
        raise VerificationError("Kodun süresi doldu. Lütfen yeni kod isteyin.")
    ev.attempts += 1
    if ev.attempts > 10:
        db.commit()
        raise VerificationError("Çok fazla hatalı deneme. Lütfen yeni kod isteyin.")
    if ev.code_hash != _hash_code(code):
        db.commit()
        raise VerificationError("Doğrulama kodu hatalı.")
    ev.verified = True
    ev.verified_at = _now()
    db.commit()
