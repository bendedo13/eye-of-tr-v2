import json
import logging
import os
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Optional
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

# Persistent user store (JSON file)
_DATA_DIR = Path(os.getenv("DATA_DIR", "/app/data"))
_USERS_FILE = _DATA_DIR / "users.json"


def _load_users() -> Dict[str, dict]:
    """Load users from JSON file."""
    try:
        if _USERS_FILE.exists():
            data = _USERS_FILE.read_text(encoding="utf-8")
            return json.loads(data) if data.strip() else {}
    except Exception as exc:
        logger.error("Failed to load users file: %s", exc)
    return {}


def _save_users(users: Dict[str, dict]) -> None:
    """Save users to JSON file."""
    try:
        _DATA_DIR.mkdir(parents=True, exist_ok=True)
        _USERS_FILE.write_text(
            json.dumps(users, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    except Exception as exc:
        logger.error("Failed to save users file: %s", exc)


# Load persisted users on startup
_users: Dict[str, dict] = _load_users()


class RegisterRequest(BaseModel):
    fullName: Optional[str] = None
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

    email = req.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(
            status_code=400, detail="Geçerli bir e-posta adresi girin"
        )

    if req.fullName and req.fullName.strip():
        full_name = req.fullName.strip()
    else:
        # Derive display name from email local-part when fullName is omitted
        full_name = email.split("@")[0]
    if len(req.password) < 6:
        raise HTTPException(
            status_code=400, detail="Şifre en az 6 karakter olmalıdır"
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
    _save_users(_users)

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


@router.get("/users")
async def users_list():
    """Admin: kayıtlı kullanıcı listesi (şifre hariç)."""
    return {
        "users": [
            {
                "id": u["id"],
                "fullName": u["fullName"],
                "email": u["email"],
                "plan": u["plan"],
                "createdAt": u.get("createdAt", ""),
            }
            for u in _users.values()
        ]
    }


@router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    """Admin: kullanıcı sil."""
    target_email: Optional[str] = None
    for email, user in _users.items():
        if user["id"] == user_id:
            target_email = email
            break

    if target_email is None:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

    del _users[target_email]
    _save_users(_users)
    logger.info("User deleted: id=%s email=%s", user_id, target_email)
    return {"message": "Kullanıcı silindi", "id": user_id}
