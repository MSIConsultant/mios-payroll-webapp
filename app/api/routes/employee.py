from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from datetime import datetime, timezone

from app.db.session import get_db
from app.models import Employee, Company, User
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeListResponse,
    EmployeeBulkImportRequest,
    EmployeeBulkImportResponse,
)
from app.api.routes.auth import get_current_user
from app.core.validators import validate_nik, validate_individual_npwp


router = APIRouter(prefix="/employees", tags=["employees"])


@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    request: EmployeeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create new employee for a company
    """
    # Authorization: user must belong to the same company or be super admin
    if not current_user.is_super_admin() and current_user.company_id != request.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Anda tidak memiliki izin untuk menambahkan karyawan pada perusahaan ini",
        )
    
    # Validate NIK
    if not validate_nik(request.nik):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format NIK tidak valid (harus 16 digit)",
        )
    
    # Validate NPWP if provided
    if request.npwp and not validate_individual_npwp(request.npwp):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format NPWP tidak valid (harus 16 digit)",
        )
    
    # Check company exists
    company = db.execute(select(Company).where(Company.id == request.company_id)).scalar_one_or_none()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perusahaan tidak ditemukan",
        )
    
    employee = Employee(**request.model_dump())
    db.add(employee)
    db.commit()
    db.refresh(employee)
    
    return EmployeeResponse.model_validate(employee)


@router.get("", response_model=EmployeeListResponse)
async def list_employees(
    company_id: int = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List employees for a company
    """
    # Authorization
    if not current_user.is_super_admin() and current_user.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Anda tidak memiliki akses ke data karyawan perusahaan ini",
        )
    
    base_query = select(Employee).where(Employee.company_id == company_id, Employee.deleted_at.is_(None))
    count_stmt = select(func.count(Employee.id)).where(Employee.company_id == company_id, Employee.deleted_at.is_(None))
    total = db.execute(count_stmt).scalar() or 0
    
    offset = (page - 1) * page_size
    employees = db.execute(base_query.offset(offset).limit(page_size)).scalars().all()
    
    return EmployeeListResponse(
        total=total,
        page=page,
        page_size=page_size,
        data=[EmployeeResponse.model_validate(e) for e in employees],
    )


@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(employee_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    employee = db.execute(select(Employee).where(Employee.id == employee_id)).scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Karyawan tidak ditemukan")
    if not current_user.is_super_admin() and current_user.company_id != employee.company_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Anda tidak memiliki akses ke karyawan ini")
    return EmployeeResponse.model_validate(employee)


@router.put("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(employee_id: int, request: EmployeeUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    employee = db.execute(select(Employee).where(Employee.id == employee_id)).scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Karyawan tidak ditemukan")
    if not current_user.can_manage_company(employee.company_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Anda tidak memiliki izin untuk mengubah karyawan ini")
    
    # Validate NIK/NPWP if provided
    if request.nik and not validate_nik(request.nik):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Format NIK tidak valid")
    if request.npwp and not validate_individual_npwp(request.npwp):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Format NPWP tidak valid")
    
    update_data = request.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(employee, k, v)
    employee.updated_at = datetime.now(timezone.utc)
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return EmployeeResponse.model_validate(employee)


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(employee_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    employee = db.execute(select(Employee).where(Employee.id == employee_id)).scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Karyawan tidak ditemukan")
    if not current_user.can_manage_company(employee.company_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Anda tidak memiliki izin untuk menghapus karyawan ini")
    employee.deleted_at = datetime.now(timezone.utc)
    employee.is_active = False
    db.add(employee)
    db.commit()


@router.post("/bulk", response_model=EmployeeBulkImportResponse)
async def bulk_import_employees(request: EmployeeBulkImportRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Authorization
    if not current_user.is_super_admin() and current_user.company_id != request.company_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Anda tidak memiliki izin untuk mengimpor karyawan pada perusahaan ini")
    
    # TODO: Implement Excel parsing, validation, and bulk insert
    return EmployeeBulkImportResponse(imported=0, failed=0, errors=[])


__all__ = ["router"]
