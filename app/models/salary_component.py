"""
Salary Components Models

Defines component types and deduction configurations
"""

import uuid
from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.base import Base


class SalaryComponent(Base):
    """Salary component type (e.g., Gaji Pokok, Tunjangan Transport, etc)"""
    __tablename__ = "salary_components"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    
    name = Column(String, nullable=False)  # e.g., "Gaji Pokok", "Tunjangan Makan"
    component_type = Column(String, nullable=False)  # "salary", "allowance", "deduction"
    
    is_taxable = Column(Boolean, default=True)  # Whether included in taxable income
    is_recurring = Column(Boolean, default=True)  # Monthly recurring
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class EmployeeSalaryProfile(Base):
    """Employee's salary structure for a period"""
    __tablename__ = "employee_salary_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    
    # Salary components
    gaji_pokok = Column(Numeric(18, 2), nullable=False, default=0)  # Base salary
    
    # Allowances (tunjangan)
    tunjangan_transport = Column(Numeric(18, 2), default=0)
    tunjangan_makan = Column(Numeric(18, 2), default=0)
    tunjangan_komunikasi = Column(Numeric(18, 2), default=0)
    tunjangan_perumahan = Column(Numeric(18, 2), default=0)
    tunjangan_kesehatan = Column(Numeric(18, 2), default=0)
    tunjangan_lainnya = Column(Numeric(18, 2), default=0)
    
    # Risk level for JKK calculation
    jkk_risk_level = Column(String, default="S")  # SR, R, S, T, ST
    
    # Benefit configuration
    employer_bears_pph21 = Column(Boolean, default=False)  # Employer pays tax
    employer_bears_bpjs = Column(Boolean, default=False)   # Employer pays BPJS
    
    valid_from = Column(DateTime(timezone=True), nullable=False, default=func.now())
    valid_until = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class BenefitConfiguration(Base):
    """Company-level benefit and deduction configuration"""
    __tablename__ = "benefit_configurations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    
    # Employer-borne items
    employer_bears_pph21 = Column(Boolean, default=False)
    employer_bears_bpjs_kesehatan = Column(Boolean, default=False)
    employer_bears_bpjs_jht = Column(Boolean, default=False)
    employer_bears_bpjs_jp = Column(Boolean, default=False)
    employer_bears_bpjs_jkk = Column(Boolean, default=True)  # Always employer
    
    # Optional deductions from employee salary
    deduction_loan = Column(Numeric(18, 2), default=0)  # Loan repayment
    deduction_health_insurance = Column(Numeric(18, 2), default=0)  # Private health
    deduction_other = Column(Numeric(18, 2), default=0)
    
    valid_from = Column(DateTime(timezone=True), nullable=False, default=func.now())
    valid_until = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
