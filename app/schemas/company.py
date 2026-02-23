"""
Company request/response schemas
Indonesian Payroll System - Production Grade
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime


class CompanyCreate(BaseModel):
    """Company creation request"""
    nama: str = Field(..., min_length=2, max_length=255, description="Company legal name")
    npwp: str = Field(..., min_length=16, max_length=16, description="Company NPWP (0XXXXXXXXXXXXXXX)")
    alamat: str = Field(..., min_length=5, max_length=500, description="Company address")
    kota: str = Field(..., min_length=2, max_length=100, description="City name")
    provinsi: str = Field(..., min_length=2, max_length=100, description="Province name")
    email: Optional[EmailStr] = None
    telepon: Optional[str] = Field(None, max_length=20, description="Contact phone number")
    pic_nama: Optional[str] = Field(None, max_length=255, description="PIC (Person in Charge) name")
    pic_telepon: Optional[str] = Field(None, max_length=20, description="PIC phone number")
    bank_nama: Optional[str] = Field(None, max_length=100, description="Bank name")
    bank_rekening: Optional[str] = Field(None, max_length=30, description="Bank account number")
    bank_atas_nama: Optional[str] = Field(None, max_length=255, description="Account holder name")


class CompanyUpdate(BaseModel):
    """Company update request"""
    nama: Optional[str] = Field(None, min_length=2, max_length=255)
    npwp: Optional[str] = Field(None, min_length=16, max_length=16)
    alamat: Optional[str] = Field(None, min_length=5, max_length=500)
    kota: Optional[str] = Field(None, min_length=2, max_length=100)
    provinsi: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    telepon: Optional[str] = Field(None, max_length=20)
    pic_nama: Optional[str] = Field(None, max_length=255)
    pic_telepon: Optional[str] = Field(None, max_length=20)
    bank_nama: Optional[str] = Field(None, max_length=100)
    bank_rekening: Optional[str] = Field(None, max_length=30)
    bank_atas_nama: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None


class CompanyResponse(BaseModel):
    """Company response/read schema"""
    id: int
    nama: str
    npwp: str
    alamat: str
    kota: str
    provinsi: str
    email: Optional[str] = None
    telepon: Optional[str] = None
    pic_nama: Optional[str] = None
    pic_telepon: Optional[str] = None
    bank_nama: Optional[str] = None
    bank_rekening: Optional[str] = None
    bank_atas_nama: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class CompanyListResponse(BaseModel):
    """Company list response with pagination"""
    total: int
    page: int
    page_size: int
    data: list[CompanyResponse]