"""
JWT Token utilities for authentication
Indonesian Payroll System - Production Grade
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
try:
    from jose import JWTError, jwt  # type: ignore
except Exception:  # pragma: no cover - fall back for static analysis/dev without installed deps
    JWTError = Exception

    class _JwtStub:
        @staticmethod
        def encode(payload, key, algorithm):
            raise RuntimeError("python-jose is not installed; install with 'pip install python-jose[cryptography]'")

        @staticmethod
        def decode(token, key, algorithms, options=None):
            raise RuntimeError("python-jose is not installed; install with 'pip install python-jose[cryptography]'")

    jwt = _JwtStub()
from pydantic import BaseModel
import os
from app.core.config import settings


class TokenData(BaseModel):
    """JWT token payload data"""
    user_id: int
    email: str
    company_id: Optional[int] = None
    role: str
    exp: Optional[datetime] = None


class TokenResponse(BaseModel):
    """Token response format"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # Seconds until expiration


class JWTToken:
    """
    JWT Token manager for creating and validating tokens
    Uses HS256 algorithm with secure random secret key
    """
    
    def __init__(self):
        self.secret_key = settings.SECRET_KEY or os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 30  # 30 minutes
        self.refresh_token_expire_days = 7     # 7 days
    
    def create_access_token(
        self,
        user_id: int,
        email: str,
        role: str,
        company_id: Optional[int] = None,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        Create JWT access token
        
        Args:
            user_id: User ID
            email: User email
            role: User role
            company_id: Company ID (optional)
            expires_delta: Custom expiration time
            
        Returns:
            Encoded JWT token
        """
        if expires_delta is None:
            expires_delta = timedelta(minutes=self.access_token_expire_minutes)
        
        expire = datetime.now(timezone.utc) + expires_delta
        to_encode: Dict[str, Any] = {
            "user_id": user_id,
            "email": email,
            "role": role,
            "company_id": company_id,
            "type": "access",
            "exp": expire,
            "iat": datetime.now(timezone.utc),
        }
        
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def create_refresh_token(
        self,
        user_id: int,
        email: str,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        Create JWT refresh token
        
        Args:
            user_id: User ID
            email: User email
            expires_delta: Custom expiration time
            
        Returns:
            Encoded JWT token
        """
        if expires_delta is None:
            expires_delta = timedelta(days=self.refresh_token_expire_days)
        
        expire = datetime.now(timezone.utc) + expires_delta
        to_encode: Dict[str, Any] = {
            "user_id": user_id,
            "email": email,
            "type": "refresh",
            "exp": expire,
            "iat": datetime.now(timezone.utc),
        }
        
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str, token_type: str = "access") -> Optional[Dict[str, Any]]:
        """
        Verify JWT token
        
        Args:
            token: JWT token to verify
            token_type: Type of token ("access" or "refresh")
            
        Returns:
            Decoded token data or None if invalid
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            
            # Verify token type
            if payload.get("type") != token_type:
                return None
            
            return payload
        except JWTError:
            return None
    
    def decode_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Decode JWT token without expiration check (for refresh logic)
        
        Args:
            token: JWT token to decode
            
        Returns:
            Decoded token data or None if invalid
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm], options={"verify_exp": False})
            return payload
        except JWTError:
            return None


# Global instance
jwt_token = JWTToken()
