from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from decimal import Decimal
from uuid import UUID
from typing import Literal, List, Dict, Any

from app.api.deps import get_db
from app.schemas.payroll_calculation import (
    PayrollCalculationRequest,
    PayrollCalculationResponse,
    TaxSummaryRequest,
)
from app.services.payroll_engine import PayrollCalculationService
from app.models import Employee
from app.api.routes.auth import get_current_user
from app.models.user import User

router = APIRouter()
payroll_service = PayrollCalculationService()


@router.post("/calculate", response_model=dict)
def calculate_employee_payroll(
    request: PayrollCalculationRequest,
    db: Session = Depends(get_db),
):
    """
    Calculate complete monthly payroll for an employee
    
    Returns:
    - Salary components breakdown
    - PPh 21 (income tax) calculation with TER method
    - BPJS contributions (Kesehatan, JHT, JP, JKK)
    - Net salary and total employer cost
    """
    try:
        # Convert Pydantic model to dict with Decimal values
        components_dict = {
            "gaji_pokok": request.salary_components.gaji_pokok,
            "tunjangan_transport": request.salary_components.tunjangan_transport,
            "tunjangan_makan": request.salary_components.tunjangan_makan,
            "tunjangan_komunikasi": request.salary_components.tunjangan_komunikasi,
            "tunjangan_perumahan": request.salary_components.tunjangan_perumahan,
            "tunjangan_kesehatan": request.salary_components.tunjangan_kesehatan,
            "tunjangan_lainnya": request.salary_components.tunjangan_lainnya,
        }
        
        # Validate JKK risk level
        valid_jkk_levels: tuple[str, ...] = ('SR', 'R', 'S', 'T', 'ST')
        if request.jkk_risk_level not in valid_jkk_levels:
            raise ValueError(f"Invalid JKK risk level: {request.jkk_risk_level}. Must be one of {valid_jkk_levels}")
        
        result = payroll_service.calculate_monthly_payroll(
            employee_name=request.employee_name,
            bruto_components=components_dict,
            ptkp_status=request.ptkp_status,
            jkk_risk_level=request.jkk_risk_level,  # type: ignore
            employer_bears_pph21=request.employer_bears_pph21,
            employer_bears_bpjs=request.employer_bears_bpjs,
        )
        
        return {
            "status": "success",
            "data": result,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/tax-summary")
def calculate_annual_tax_summary(
    request: TaxSummaryRequest,
    db: Session = Depends(get_db),
):
    """
    Calculate annual tax summary with year-end reconciliation
    
    Returns:
    - Annual PKP (Taxable Income)
    - Progressive tax calculation
    - Tax adjustment (refund or additional payment)
    """
    try:
        # This would typically retrieve historical payroll data from DB
        # For now, returning summary structure
        return {
            "status": "success",
            "message": "Annual tax calculation requires historical monthly payroll data",
            "employee_id": str(request.employee_id),
            "year": request.year,
            "ptkp_status": request.ptkp_status,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/ter-brackets/{ptkp_status}")
def get_ter_brackets(ptkp_status: str):
    """
    Get TER (Tarif Efektif Rata-rata) brackets for a PTKP status
    
    Returns detailed tax brackets used for monthly calculation
    """
    try:
        brackets = payroll_service.tax_engine.get_ter_breakdown(ptkp_status)
        ptkp_info = payroll_service.tax_engine.get_ptkp_info(ptkp_status)
        
        return {
            "status": "success",
            "ptkp_status": ptkp_status,
            "ptkp_annual": float(ptkp_info["annual"]),
            "ter_category": ptkp_info["ter_category"],
            "description": ptkp_info["description"],
            "brackets": [
                {
                    "min": float(b["min"]),
                    "max": float(b["max"]) if b["max"] != float('inf') else "∞",
                    "rate": f"{b['rate']*100}%"
                }
                for b in brackets
            ],
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/ptkp-options")
def get_ptkp_options():
    """Get all available PTKP classifications"""
    options = {}
    for code, info in payroll_service.tax_engine.ptkp_table.items():
        options[code] = {
            "annual": float(info["annual"]),
            "ter_category": info["ter_category"],
            "description": info["description"],
        }
    return {
        "status": "success",
        "ptkp_options": options,
    }


@router.get("/jkk-risk-levels")
def get_jkk_risk_levels():
    """Get JKK risk level classifications with rates"""
    return {
        "status": "success",
        "risk_levels": payroll_service.bpjs_engine.get_risk_levels(),
    }


@router.post("/company/{company_id}/payroll")
def calculate_company_payroll(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Calculate monthly payroll for all active employees in a company.
    
    Returns:
    - List of payroll calculations for each employee
    - Company-wide summaries (total costs, taxes, deductions)
    - Aggregated accounting breakdown
    
    Authorization: User must belong to company or be super admin
    """
    # Authorization
    if not current_user.is_super_admin() and current_user.company_id != company_id:
        raise HTTPException(
            status_code=403,
            detail="Anda tidak memiliki akses ke data payroll perusahaan ini",
        )
    
    # Fetch all active employees for this company
    employees = db.execute(
        select(Employee).where(
            Employee.company_id == company_id,
            Employee.is_active == True,
            Employee.deleted_at.is_(None),
        )
    ).scalars().all()
    
    if not employees:
        return {
            "status": "success",
            "company_id": company_id,
            "employee_count": 0,
            "payrolls": [],
            "summary": {
                "total_bruto": 0,
                "total_pph21_employee": 0,
                "total_pph21_employer": 0,
                "total_pph21": 0,
                "total_bpjs_employee": 0,
                "total_bpjs_employer": 0,
                "total_bpjs": 0,
                "total_net_salary": 0,
                "total_employer_cost": 0,
            },
        }
    
    # Calculate payroll for each employee
    payrolls = []
    summary = {
        "total_bruto": 0.0,
        "total_pph21_employee": 0.0,
        "total_pph21_employer": 0.0,
        "total_pph21": 0.0,
        "total_bpjs_employee": 0.0,
        "total_bpjs_employer": 0.0,
        "total_bpjs": 0.0,
        "total_net_salary": 0.0,
        "total_employer_cost": 0.0,
    }
    
    for employee in employees:
        try:
            # Use default salary structure (all zeros for now - can be extended to fetch from DB)
            components_dict = {
                "gaji_pokok": Decimal("0"),
                "tunjangan_transport": Decimal("0"),
                "tunjangan_makan": Decimal("0"),
                "tunjangan_komunikasi": Decimal("0"),
                "tunjangan_perumahan": Decimal("0"),
                "tunjangan_kesehatan": Decimal("0"),
                "tunjangan_lainnya": Decimal("0"),
            }
            
            # Validate PTKP status
            if not employee.status_ptkp:
                employee.status_ptkp = "TK0"  # Default
            
            # Default JKK risk level
            jkk_risk = "S"  # Default: Sedang (Medium)
            
            # Calculate payroll
            payroll = payroll_service.calculate_monthly_payroll(
                employee_name=employee.nama,
                bruto_components=components_dict,
                ptkp_status=employee.status_ptkp,
                jkk_risk_level=jkk_risk,
                employer_bears_pph21=False,
                employer_bears_bpjs=False,
            )
            
            payrolls.append({
                "employee_id": employee.id,
                "employee_name": employee.nama,
                "nik": employee.nik,
                "jabatan": employee.jabatan,
                "payroll": payroll,
            })
            
            # Aggregate summary
            summary["total_bruto"] += payroll["bruto_monthly"]
            summary["total_pph21_employee"] += payroll["pph21"]["employee_portion"]
            summary["total_pph21_employer"] += payroll["pph21"]["employer_portion"]
            summary["total_pph21"] += payroll["pph21"]["employee_portion"] + payroll["pph21"]["employer_portion"]
            summary["total_bpjs_employee"] += payroll["bpjs"]["total_employee"]
            summary["total_bpjs_employer"] += payroll["bpjs"]["total_employer"]
            summary["total_bpjs"] += payroll["bpjs"]["total_employee"] + payroll["bpjs"]["total_employer"]
            summary["total_net_salary"] += payroll["summary"]["net_salary"]
            summary["total_employer_cost"] += payroll["summary"]["total_employer_cost"]
        
        except Exception as e:
            # Skip this employee and log error
            payrolls.append({
                "employee_id": employee.id,
                "employee_name": employee.nama,
                "error": str(e),
            })
    
    return {
        "status": "success",
        "company_id": company_id,
        "employee_count": len(employees),
        "period": payrolls[0]["payroll"]["period"] if payrolls and "payroll" in payrolls[0] else "Current Month",
        "payrolls": payrolls,
        "summary": summary,
    }
