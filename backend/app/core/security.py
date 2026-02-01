"""JWT ve şifre hash işlemleri"""
from datetime import datetime, timedelta
from typing import Optional

from jose import jwt
from jose.exceptions import JWTError
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Düz metin şifreyi hash ile doğrula"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Şifreyi bcrypt ile hashle"""
    return pwd_context.hash(password)


def create_access_token(subject: str | int, expires_delta: Optional[timedelta] = None) -> str:
    """JWT access token oluştur"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[str]:
    """JWT token decode et, subject (user id) döndür"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None
