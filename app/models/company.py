"""
Company model for organization data
Indonesian Payroll System - Production Grade
"""

from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, DateTime, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
if TYPE_CHECKING:
    from app.models.user import User  # pragma: no cover
    from app.models.employee import Employee  # pragma: no cover


class Company(Base):
    """
    Company model for storing organization information
    
    Attributes:
        id: Unique company identifier (auto-increment)
        nama: Company legal name (Indonesian)
        npwp: Company tax ID (0XXXXXXXXXXXXXXX format - 16 digits)
        alamat: Company address
        kota: City name
        provinsi: Province name
        email: Company email
        telepon: Company phone number
        pic_nama: PIC (Person in Charge) name
        pic_telepon: PIC phone number
        bank_nama: Bank name
        bank_rekening: Bank account number
        bank_atas_nama: Account holder name
        is_active: Whether company is active
        created_at: Creation timestamp
        updated_at: Last update timestamp
        deleted_at: Soft delete timestamp (NULL if not deleted)
    """
    __tablename__ = "companies"
    
    # Indexes for fast lookups
    __table_args__ = (
        Index("idx_company_npwp", "npwp", unique=True),
        Index("idx_company_is_active", "is_active"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nama: Mapped[str] = mapped_column(String(255), nullable=False)
    npwp: Mapped[str] = mapped_column(String(16), unique=True, nullable=False, index=True)
    alamat: Mapped[str] = mapped_column(String(500), nullable=False)
    kota: Mapped[str] = mapped_column(String(100), nullable=False)
    provinsi: Mapped[str] = mapped_column(String(100), nullable=False)
    
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    telepon: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    pic_nama: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    pic_telepon: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    bank_nama: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    bank_rekening: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    bank_atas_nama: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    users: Mapped[List["User"]] = relationship("User", back_populates="company", foreign_keys="User.company_id")
    employees: Mapped[List["Employee"]] = relationship("Employee", back_populates="company", foreign_keys="Employee.company_id")
    
    def __repr__(self) -> str:
        return f"<Company(id={self.id}, nama={self.nama}, npwp={self.npwp})>"
    
    def is_deleted(self) -> bool:
        """Check if company is soft-deleted"""
        return self.deleted_at is not None
    
    @classmethod
    def filter_active(cls):
        """Query filter for active companies only"""
        return cls.is_active.is_(True) & cls.deleted_at.is_(None)