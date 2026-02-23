"""
Employee model for payroll management
Indonesian Payroll System - Production Grade
"""

from datetime import date, datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Date, ForeignKey, DateTime, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
if TYPE_CHECKING:
    from app.models.company import Company  # pragma: no cover


class Employee(Base):
    """
    Employee model for storing employee information
    
    Attributes:
        id: Unique employee identifier (auto-increment)
        company_id: Foreign key to Company
        nama: Employee name
        nik: National ID (16 digits)
        npwp: Tax ID (16 digits for individuals)
        status_ptkp: Tax status (TK/0, K/0, K/1, etc.)
        jabatan: Job position
        tanggal_masuk: Date of joining
        is_active: Whether employee is still working
        created_at: Creation timestamp
        updated_at: Last update timestamp
        deleted_at: Soft delete timestamp
    """
    __tablename__ = "employees"
    
    __table_args__ = (
        Index("idx_employee_company", "company_id"),
        Index("idx_employee_nik", "nik"),
        Index("idx_employee_npwp", "npwp"),
        Index("idx_employee_is_active", "is_active"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), nullable=False, index=True)
    
    nama: Mapped[str] = mapped_column(String(255), nullable=False)
    nik: Mapped[str] = mapped_column(String(16), nullable=False)
    npwp: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    
    status_ptkp: Mapped[str] = mapped_column(String(10), nullable=False)
    jabatan: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    tanggal_masuk: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="employees", foreign_keys=[company_id])
    
    def __repr__(self) -> str:
        return f"<Employee(id={self.id}, nama={self.nama}, company_id={self.company_id})>"
    
    def is_deleted(self) -> bool:
        """Check if employee is soft-deleted"""
        return self.deleted_at is not None