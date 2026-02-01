"""Register / Login endpoint'leri"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.api.deps import get_current_user
from app.core.security import get_password_hash, verify_password, create_access_token
from app.db.database import get_db
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse
from app.services.referral_service import ReferralService

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = logging.getLogger(__name__)


@router.post("/register", response_model=Token)
def register(data: UserRegister, db: Session = Depends(get_db)):
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
        tier="free"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Referral code işle (varsa)
    if data.referral_code:
        ReferralService.process_referral(user, data.referral_code, db)
    
    logger.info(f"New user registered: {user.email} with {user.credits} credits")
    
    token = create_access_token(subject=user.id)
    return Token(access_token=token)


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """Giriş, JWT döndür"""
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = create_access_token(subject=user.id)
    return Token(access_token=token)


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    """Mevcut kullanıcı bilgisi (JWT gerekli)"""
    return user
