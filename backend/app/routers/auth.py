import logging
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# SECRET_KEY: required in production via environment variable.
# A random fallback is generated per-process so leaked defaults are useless.
SECRET_KEY: str = os.getenv("SECRET_KEY") or secrets.token_hex(32)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

router = APIRouter(prefix="/api/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# In-memory user store (persists as long as server runs; no DB required)
_users: Dict[str, dict] = {}


class RegisterRequest(BaseModel):
    fullName: str
    email: str
    password: str
    plan: str = "free"


class LoginRequest(BaseModel):
    email: str
    password: str
    rememberMe: bool = False


def _hash_password(password: str) -> str:
    return pwd_context.hash(password)


def _verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _create_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/register")
async def register(req: RegisterRequest):
    """Yeni kullanıcı kaydı."""
    logger.info("Register attempt: email=%s", req.email)

    full_name = req.fullName.strip()
    if len(full_name) < 3:
        raise HTTPException(
            status_code=400, detail="Ad Soyad en az 3 karakter olmalıdır"
        )
    if len(req.password) < 6:
        raise HTTPException(
            status_code=400, detail="Şifre en az 6 karakter olmalıdır"
        )

    email = req.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(
            status_code=400, detail="Geçerli bir e-posta adresi girin"
        )

    if email in _users:
        logger.warning("Register failed – email already registered: %s", email)
        raise HTTPException(
            status_code=409, detail="Bu e-posta adresi zaten kullanılıyor"
        )

    user_id = str(uuid4())
    _users[email] = {
        "id": user_id,
        "fullName": full_name,
        "email": email,
        "password": _hash_password(req.password),
        "plan": req.plan,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }

    token = _create_token({"sub": email, "name": full_name})
    logger.info("Register success: email=%s id=%s", email, user_id)

    return {
        "token": token,
        "user": {
            "id": user_id,
            "fullName": full_name,
            "email": email,
            "plan": req.plan,
        },
    }


@router.post("/login")
async def login(req: LoginRequest):
    """Kullanıcı girişi."""
    logger.info("Login attempt: email=%s", req.email)

    email = req.email.strip().lower()
    user = _users.get(email)

    if not user or not _verify_password(req.password, user["password"]):
        logger.warning("Login failed – invalid credentials: %s", email)
        raise HTTPException(
            status_code=401, detail="E-posta veya şifre hatalı"
        )

    expires = timedelta(days=30) if req.rememberMe else timedelta(hours=24)
    token = _create_token({"sub": email, "name": user["fullName"]}, expires)
    logger.info("Login success: email=%s", email)

    return {
        "token": token,
        "user": {
            "id": user["id"],
            "fullName": user["fullName"],
            "email": email,
            "plan": user["plan"],
        },
    }


@router.get("/users/count")
async def users_count():
    """Admin: toplam kayıtlı kullanıcı sayısı."""
    return {"count": len(_users)}
