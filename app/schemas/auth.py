"""
Authentication request/response schemas
Indonesian Payroll System - Production Grade
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


class LoginRequest(BaseModel):
    """User login request"""
    email: EmailStr
    password: str = Field(..., min_length=1, description="User password")


class RegisterRequest(BaseModel):
    """User registration request"""
    email: EmailStr
    password: str = Field(..., min_length=8, description="Minimum 8 characters with uppercase, lowercase, digit, special char")
    full_name: str = Field(..., min_length=2, max_length=255)
    company_id: Optional[int] = None


class TokenResponse(BaseModel):
    """Token response after login/refresh"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # Seconds


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


class UserResponse(BaseModel):
    """User data response (no password)"""
    id: int
    email: str
    full_name: str
    role: UserRole
    company_id: Optional[int] = None
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    force_password_change: bool
    
    class Config:
        from_attributes = True


class ChangePasswordRequest(BaseModel):
    """Change password request"""
    current_password: str
    new_password: str = Field(..., min_length=8, description="Minimum 8 characters with uppercase, lowercase, digit, special char")
    confirm_password: str


class PasswordResetRequest(BaseModel):
    """Password reset request"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation"""
    token: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str


class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str
    code: str
    details: Optional[list[str]] = None


class LoginResponse(BaseModel):
    """Login response with user data"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse
