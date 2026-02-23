from fastapi import APIRouter
from app.api.routes import auth, company, employee, payroll, calculation

api_router = APIRouter()

# Authentication routes (no prefix)
api_router.include_router(auth.router)

# Company routes
api_router.include_router(company.router)

# Employee routes (will be updated with new version)
api_router.include_router(employee.router, prefix="/employees", tags=["employees"])

# Payroll routes
api_router.include_router(payroll.router, prefix="/payroll", tags=["payroll"])

# Calculation routes
api_router.include_router(calculation.router, prefix="/calculation", tags=["calculation"])