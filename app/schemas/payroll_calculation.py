from pydantic import BaseModel
from uuid import UUID
from datetime import date
from typing import Dict, Optional, List
from decimal import Decimal


class SalaryComponentSchema(BaseModel):
    gaji_pokok: Decimal
    tunjangan_transport: Decimal = Decimal("0")
    tunjangan_makan: Decimal = Decimal("0")
    tunjangan_komunikasi: Decimal = Decimal("0")
    tunjangan_perumahan: Decimal = Decimal("0")
    tunjangan_kesehatan: Decimal = Decimal("0")
    tunjangan_lainnya: Decimal = Decimal("0")


class PayrollCalculationRequest(BaseModel):
    employee_id: UUID
    company_id: UUID
    employee_name: str
    salary_components: SalaryComponentSchema
    ptkp_status: str  # TK0, K1, K3, etc
    jkk_risk_level: str = "S"  # SR, R, S, T, ST
    employer_bears_pph21: bool = False
    employer_bears_bpjs: bool = False


class PayrollCalculationResponse(BaseModel):
    employee_name: str
    period: str
    components: Dict[str, float]
    bruto_monthly: float
    pph21: Dict
    bpjs: Dict
    summary: Dict
    config: Dict

    class Config:
        from_attributes = True


class TaxSummaryRequest(BaseModel):
    employee_id: UUID
    company_id: UUID
    year: int
    ptkp_status: str


class EmployeeTaxProfileSchema(BaseModel):
    gaji_pokok: Decimal
    tunjangan_transport: Decimal = Decimal("0")
    tunjangan_makan: Decimal = Decimal("0")
    tunjangan_komunikasi: Decimal = Decimal("0")
    tunjangan_perumahan: Decimal = Decimal("0")
    tunjangan_kesehatan: Decimal = Decimal("0")
    tunjangan_lainnya: Decimal = Decimal("0")
    jkk_risk_level: str = "S"
    employer_bears_pph21: bool = False
    employer_bears_bpjs: bool = False


class EmployeeTaxProfileCreate(BaseModel):
    employee_id: UUID
    company_id: UUID
    profile: EmployeeTaxProfileSchema


class PayrollReportSchema(BaseModel):
    company_id: UUID
    month: int
    year: int
    total_employees: int
    total_bruto: float
    total_pph21_employee: float
    total_pph21_employer: float
    total_bpjs_employee: float
    total_bpjs_employer: float
    total_net_salary: float

    class Config:
        from_attributes = True
