"""
Employee request/response schemas
Indonesian Payroll System - Production Grade
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime


class EmployeeCreate(BaseModel):
    """Employee creation request"""
    company_id: int
    nama: str = Field(..., min_length=2, max_length=255, description="Employee name")
    nik: str = Field(..., min_length=16, max_length=16, description="National ID (16 digits)")
    npwp: Optional[str] = Field(None, min_length=16, max_length=16, description="Tax ID (16 digits)")
    status_ptkp: str = Field(..., description="PTKP status (TK/0, K/0, K/1, etc.)")
    jabatan: Optional[str] = Field(None, max_length=255, description="Job position")
    tanggal_masuk: Optional[date] = Field(None, description="Date of joining")


class EmployeeUpdate(BaseModel):
    """Employee update request"""
    nama: Optional[str] = Field(None, min_length=2, max_length=255)
    nik: Optional[str] = Field(None, min_length=16, max_length=16)
    npwp: Optional[str] = Field(None, min_length=16, max_length=16)
    status_ptkp: Optional[str] = None
    jabatan: Optional[str] = Field(None, max_length=255)
    tanggal_masuk: Optional[date] = None
    is_active: Optional[bool] = None


class EmployeeResponse(BaseModel):
    """Employee response/read schema"""
    id: int
    company_id: int
    nama: str
    nik: str
    npwp: Optional[str] = None
    status_ptkp: str
    jabatan: Optional[str] = None
    tanggal_masuk: Optional[date] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class EmployeeListResponse(BaseModel):
    """Employee list response with pagination"""
    total: int
    page: int
    page_size: int
    data: list[EmployeeResponse]


class EmployeeBulkImportRequest(BaseModel):
    """Bulk employee import from Excel"""
    company_id: int
    skip_validation: bool = False  # For testing


class EmployeeBulkImportResponse(BaseModel):
    """Bulk import response"""
    imported: int
    failed: int
    errors: list[dict] = []
