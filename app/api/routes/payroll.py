from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.payroll import Payroll
from app.schemas.payroll import PayrollCreate, PayrollOut

router = APIRouter()


@router.post("/", response_model=PayrollOut)
def create_payroll(payroll_in: PayrollCreate, db: Session = Depends(get_db)):
    payroll = Payroll(**payroll_in.model_dump())
    db.add(payroll)
    db.commit()
    db.refresh(payroll)
    return payroll


@router.get("/{payroll_id}", response_model=PayrollOut)
def read_payroll(payroll_id: str, db: Session = Depends(get_db)):
    payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    return payroll