"""
Company management routes
Indonesian Payroll System - Production Grade
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from datetime import datetime, timezone

from app.db.session import get_db
from app.models import Company, User
from app.schemas.company import (
    CompanyCreate,
    CompanyUpdate,
    CompanyResponse,
    CompanyListResponse,
)
from app.api.routes.auth import get_current_user
from app.core.validators import validate_company_npwp

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(
    request: CompanyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create new company
    Only SUPER_ADMIN can create
    """
    # Authorization check
    if not current_user.is_super_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Anda tidak memiliki izin untuk membuat perusahaan",
        )
    
    # Validate NPWP format
    if not validate_company_npwp(request.npwp):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format NPWP tidak valid (harus 0XXXXXXXXXXXXXXX)",
        )
    
    # Check if NPWP already exists
    stmt = select(Company).where(Company.npwp == request.npwp)
    existing = db.execute(stmt).scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="NPWP sudah terdaftar",
        )
    
    # Create company
    company = Company(
        **request.model_dump()
    )
    
    db.add(company)
    db.commit()
    db.refresh(company)
    
    return CompanyResponse.model_validate(company)


@router.get("", response_model=CompanyListResponse)
async def list_companies(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List companies
    SUPER_ADMIN sees all, others see own company
    """
    query = select(Company).where(
        Company.is_active.is_(True),
        Company.deleted_at.is_(None),
    )
    
    # If not super admin, filter to own company
    if not current_user.is_super_admin() and current_user.company_id:
        query = query.where(Company.id == current_user.company_id)
    
    # Get total count
    count_stmt = select(func.count(Company.id)).where(
        Company.is_active.is_(True),
        Company.deleted_at.is_(None),
    )
    if not current_user.is_super_admin() and current_user.company_id:
        count_stmt = count_stmt.where(Company.id == current_user.company_id)
    
    total = db.execute(count_stmt).scalar() or 0
    
    # Paginate
    offset = (page - 1) * page_size
    companies = db.execute(query.offset(offset).limit(page_size)).scalars().all()
    
    return CompanyListResponse(
        total=total,
        page=page,
        page_size=page_size,
        data=[CompanyResponse.model_validate(c) for c in companies],
    )


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get company by ID
    """
    company = db.execute(
        select(Company).where(Company.id == company_id)
    ).scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perusahaan tidak ditemukan",
        )
    
    # Check authorization
    if not current_user.is_super_admin() and current_user.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Anda tidak memiliki akses ke perusahaan ini",
        )
    
    return CompanyResponse.model_validate(company)


@router.put("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: int,
    request: CompanyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update company
    """
    company = db.execute(
        select(Company).where(Company.id == company_id)
    ).scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perusahaan tidak ditemukan",
        )
    
    # Check authorization
    if not current_user.can_manage_company(company_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Anda tidak memiliki izin untuk mengubah perusahaan ini",
        )
    
    # Validate NPWP if changed
    if request.npwp and request.npwp != company.npwp:
        if not validate_company_npwp(request.npwp):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Format NPWP tidak valid",
            )
        
        # Check for duplicate
        existing = db.execute(
            select(Company).where(Company.npwp == request.npwp)
        ).scalar_one_or_none()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="NPWP sudah terdaftar",
            )
    
    # Update fields
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company, field, value)
    
    company.updated_at = datetime.now(timezone.utc)
    
    db.add(company)
    db.commit()
    db.refresh(company)
    
    return CompanyResponse.model_validate(company)


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Soft delete company
    """
    company = db.execute(
        select(Company).where(Company.id == company_id)
    ).scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perusahaan tidak ditemukan",
        )
    
    # Check authorization
    if not current_user.can_manage_company(company_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Anda tidak memiliki izin untuk menghapus perusahaan ini",
        )
    
    # Soft delete
    company.deleted_at = datetime.now(timezone.utc)
    company.is_active = False
    
    db.add(company)
    db.commit()


__all__ = ["router"]