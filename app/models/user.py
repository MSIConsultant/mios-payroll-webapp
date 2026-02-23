"""
User model for authentication and authorization
Indonesian Payroll System - Production Grade
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Boolean, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from app.db.base import Base


class UserRole(str, enum.Enum):
    """User roles for role-based access control"""
    SUPER_ADMIN = "super_admin"      # All companies, all features
    COMPANY_ADMIN = "company_admin"  # Own company only, full access
    ACCOUNTANT = "accountant"        # Own company, view/calculate payroll
    HR_STAFF = "hr_staff"            # Own company, manage employees only
    VIEWER = "viewer"                # Own company, read-only access


class User(Base):
    """
    User model for authentication
    
    Attributes:
        id: Unique user identifier
        email: User email (unique, used for login)
        password_hash: Bcrypt hashed password
        full_name: User's full name
        role: User role (determines access level)
        company_id: Company the user belongs to (FK)
        is_active: Whether user account is active
        created_at: Account creation timestamp
        updated_at: Last update timestamp
        last_login: Last login timestamp
        force_password_change: Flag to force password change on next login
        locked_until: Timestamp until account is locked after failed attempts
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.VIEWER, nullable=False)
    company_id: Mapped[Optional[int]] = mapped_column(ForeignKey("companies.id"), nullable=True, index=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    force_password_change: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    locked_until: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    company = relationship("Company", back_populates="users", foreign_keys=[company_id])
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"

    def is_super_admin(self) -> bool:
        """Check if user is super admin"""
        return self.role == UserRole.SUPER_ADMIN

    def is_company_admin(self) -> bool:
        """Check if user is company admin"""
        return self.role == UserRole.COMPANY_ADMIN

    def can_manage_company(self, company_id: int) -> bool:
        """Check if user can manage a specific company"""
        if self.is_super_admin():
            return True
        if self.is_company_admin() and self.company_id == company_id:
            return True
        return False
