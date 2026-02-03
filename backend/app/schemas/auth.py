"""Auth request/response şemaları"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    referral_code: Optional[str] = None  # Referral code ile kayıt
    device_id: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    device_id: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterResponse(BaseModel):
    verification_required: bool = True
    debug_code: Optional[str] = None


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str
    device_id: str


class ResendCodeRequest(BaseModel):
    email: EmailStr
    device_id: str


class RequestPasswordReset(BaseModel):
    email: EmailStr
    device_id: str
    reset_url_base: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str
    device_id: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class UpdateProfileRequest(BaseModel):
    username: str


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    credits: int
    role: str
    tier: str
    referral_code: str
    referral_count: int
    total_searches: int
    successful_searches: int
    created_at: datetime

    class Config:
        from_attributes = True
