"""
Authentication routes
Indonesian Payroll System - Production Grade
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime, timezone

from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    LoginResponse,
    TokenResponse,
    RefreshTokenRequest,
    UserResponse,
    ChangePasswordRequest,
    ErrorResponse,
)
from app.core.jwt_utils import jwt_token, TokenData
from app.core.password_utils import password_manager
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


# OAuth2 scheme for Swagger documentation
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security_scheme = HTTPBearer()

async def oauth2_scheme(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)) -> str:
    """Extract token from Authorization header"""
    return credentials.credentials


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Get current user from JWT token
    """
    payload = jwt_token.verify_token(token, token_type="access")
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid atau sudah kadaluarsa",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    stmt = select(User).where(User.id == user_id)
    user = db.execute(stmt).scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User tidak ditemukan",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Login with email and password
    
    Returns:
        - access_token: JWT token for API requests
        - refresh_token: Token to get new access token
        - user: Current user data
    """
    # Find user by email
    stmt = select(User).where(User.email == request.email)
    user = db.execute(stmt).scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun Anda tidak aktif",
        )
    
    # Check if account is locked
    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Akun terkunci karena terlalu banyak percobaan login gagal",
        )
    
    # Verify password
    if not password_manager.verify_password(request.password, user.password_hash):
        # Increment failed login attempts (not tracking in this version, but should track in production)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create tokens
    access_token = jwt_token.create_access_token(
        user_id=user.id,
        email=user.email,
        role=user.role,
        company_id=user.company_id,
    )
    
    refresh_token = jwt_token.create_refresh_token(
        user_id=user.id,
        email=user.email,
    )
    
    # Update last login
    user.last_login = datetime.now(timezone.utc)
    db.add(user)
    db.commit()
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register new user (admin only in first version, open in development)
    """
    # Check if email already exists
    stmt = select(User).where(User.email == request.email)
    existing_user = db.execute(stmt).scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email sudah terdaftar",
        )
    
    # Validate password strength
    is_valid, error_msg = password_manager.validate_password_strength(request.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg,
        )
    
    # Create new user
    user = User(
        email=request.email,
        password_hash=password_manager.hash_password(request.password),
        full_name=request.full_name,
        company_id=request.company_id,
        role=UserRole.VIEWER,  # Default role
        force_password_change=False,  # Set to True in production to force change on first login
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UserResponse.model_validate(user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest):
    """
    Refresh access token using refresh token
    """
    # Verify refresh token
    payload = jwt_token.verify_token(request.refresh_token, token_type="refresh")
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token tidak valid atau sudah kadaluarsa",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create new access token
    access_token = jwt_token.create_access_token(
        user_id=payload["user_id"],
        email=payload["email"],
        role="viewer",  # In production, fetch from DB
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=request.refresh_token,  # Keep same refresh token
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Change user password
    """
    # Verify current password
    if not password_manager.verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password saat ini salah",
        )
    
    # Validate new password
    is_valid, error_msg = password_manager.validate_password_strength(request.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg,
        )
    
    if request.new_password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password baru tidak cocok",
        )
    
    # Check password not reused (check last 5 passwords in production)
    if password_manager.verify_password(request.new_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password baru tidak boleh sama dengan password sebelumnya",
        )
    
    # Update password
    current_user.password_hash = password_manager.hash_password(request.new_password)
    current_user.force_password_change = False
    db.add(current_user)
    db.commit()
    
    return {"detail": "Password berhasil diubah"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current user information
    """
    return UserResponse.model_validate(current_user)


__all__ = ["router", "get_current_user", "oauth2_scheme"]
