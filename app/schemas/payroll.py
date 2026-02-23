from pydantic import BaseModel
from uuid import UUID
from decimal import Decimal


class PayrollCreate(BaseModel):
    company_id: UUID
    employee_id: UUID
    year: int
    month: int
    gross_income: Decimal
    pph21: Decimal
    bpjs: Decimal
    net_income: Decimal


class PayrollOut(BaseModel):
    id: UUID
    company_id: UUID
    employee_id: UUID
    year: int
    month: int
    gross_income: Decimal
    pph21: Decimal
    bpjs: Decimal
    net_income: Decimal

    class Config:
        from_attributes = True
