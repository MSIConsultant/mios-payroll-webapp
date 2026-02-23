import uuid
from sqlalchemy import Column, ForeignKey, Integer, Numeric, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.base import Base


class Payroll(Base):
    __tablename__ = "payroll_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)

    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)

    gross_income = Column(Numeric(18, 2), nullable=False)
    pph21 = Column(Numeric(18, 2), nullable=False)
    bpjs = Column(Numeric(18, 2), nullable=False)
    net_income = Column(Numeric(18, 2), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())