"""Auth request/response şemaları"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    referral_code: Optional[str] = None  # Referral code ile kayıt


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    credits: int
    tier: str
    referral_code: str
    referral_count: int
    total_searches: int
    successful_searches: int
    created_at: datetime

    class Config:
        from_attributes = True
