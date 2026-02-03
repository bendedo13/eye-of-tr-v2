"""Register / Login endpoint'leri"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
import logging
import secrets

from app.api.deps import get_current_user
from app.core.security import get_password_hash, verify_password, create_access_token
from app.db.database import get_db
from app.models.user import User
from app.schemas.auth import (
    RegisterResponse,
    ResendCodeRequest,
    RequestPasswordReset,
    Token,
    UserLogin,
    UserRegister,
    UserResponse,
    ResetPasswordRequest,
    VerifyEmailRequest,
    ChangePasswordRequest,
    UpdateProfileRequest,
)
from app.services.referral_service import ReferralService
from app.services.verification_service import (
    VerificationError,
    bind_device,
    enforce_device_limit,
    enforce_ip_limit,
    ensure_device_bound,
    record_ip_registration,
    resend_code,
    verify_code,
    create_or_replace_verification,
)
from app.services.mailer import MailerError
from app.services.password_reset_service import PasswordResetError, create_reset, mark_used, send_reset_email, verify_token

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = logging.getLogger(__name__)

def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"

@router.post("/register", response_model=RegisterResponse)
def register(data: UserRegister, request: Request, db: Session = Depends(get_db)):
    """
    Yeni kullanıcı kaydı
    - 1 ücretsiz arama kredisi verilir
    - Referral code ile kayıt yapılabilir (3 referral = 1 kredi)
    """
    # Email kontrolü
    existing_email = db.query(User).filter(User.email == data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    # Username kontrolü
    existing_username = db.query(User).filter(User.username == data.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )
    
    if not data.device_id or len(data.device_id) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid device")

    ip = _client_ip(request)
    try:
        enforce_ip_limit(db, ip)
        enforce_device_limit(db, data.device_id)
    except VerificationError as e:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(e))

    # Benzersiz referral code oluştur
    referral_code = User.generate_referral_code()
    while db.query(User).filter(User.referral_code == referral_code).first():
        referral_code = User.generate_referral_code()
    
    # Yeni kullanıcı oluştur (1 ücretsiz kredi ile)
    user = User(
        email=data.email,
        username=data.username,
        hashed_password=get_password_hash(data.password),
        referral_code=referral_code,
        credits=1,  # 1 ücretsiz arama kredisi
        tier="free",
        is_active=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    record_ip_registration(db, ip, user_id=user.id)
    bind_device(db, user, data.device_id, ip)
    
    # Referral code işle (varsa)
    if data.referral_code:
        ReferralService.process_referral(user, data.referral_code, db)
    
    try:
        create_or_replace_verification(db, user)
    except MailerError:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Email service is not configured")
    logger.info(f"New user registered (verification pending): {user.email}")
    return RegisterResponse(verification_required=True)


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """Giriş, JWT döndür"""
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email doğrulaması gerekli")
    token = create_access_token(subject=user.id)
    return Token(access_token=token)

@router.post("/verify-email", response_model=Token)
def verify_email(data: VerifyEmailRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    try:
        ensure_device_bound(db, user, data.device_id)
    except VerificationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    try:
        verify_code(db, user, data.code)
    except VerificationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if not user.is_active:
        user.is_active = True
        db.commit()

    token = create_access_token(subject=user.id)
    return Token(access_token=token)


@router.post("/resend-code")
def resend_verification(data: ResendCodeRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    try:
        ensure_device_bound(db, user, data.device_id)
    except VerificationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    try:
        resend_code(db, user)
    except VerificationError as e:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(e))
    return {"status": "ok"}


@router.post("/request-password-reset")
def request_password_reset(data: RequestPasswordReset, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        return {"status": "ok"}

    token = create_reset(db, user)
    base = (data.reset_url_base or "").strip()
    if base:
        sep = "&" if "?" in base else "?"
        reset_url = f"{base}{sep}email={user.email}&token={token}"
    else:
        origin = request.headers.get("origin") or ""
        reset_url = f"{origin}/reset-password?email={user.email}&token={token}" if origin else f"/reset-password?email={user.email}&token={token}"
    try:
        send_reset_email(user.email, reset_url)
    except MailerError:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Email service is not configured")
    return {"status": "ok"}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Geçersiz token.")

    if len(data.new_password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Şifre en az 8 karakter olmalı.")

    try:
        pr = verify_token(db, user, data.token)
    except PasswordResetError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    mark_used(db, pr)
    return {"status": "ok"}


@router.post("/change-password")
def change_password(data: ChangePasswordRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.current_password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mevcut şifre hatalı.")
    if len(data.new_password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Şifre en az 8 karakter olmalı.")
    user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"status": "ok"}


@router.patch("/profile", response_model=UserResponse)
def update_profile(data: UpdateProfileRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    username = (data.username or "").strip()
    if len(username) < 3:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Kullanıcı adı en az 3 karakter olmalı.")
    existing = db.query(User).filter(User.username == username).first()
    if existing and existing.id != user.id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")
    user.username = username
    db.commit()
    db.refresh(user)
    return user


@router.delete("/account")
def delete_account(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.is_active = False
    user.email = f"deleted+{user.id}@example.invalid"
    user.username = f"deleted_{user.id}"
    user.hashed_password = get_password_hash(secrets.token_urlsafe(32))
    db.commit()
    return {"status": "ok"}


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    """Mevcut kullanıcı bilgisi (JWT gerekli)"""
    return user
