"""
Comprehensive Payroll Calculation Service

Orchestrates:
- Salary component aggregation
- PPh 21 calculation (TER method)
- BPJS contributions calculation
- Deduction handling
- Net salary calculation
"""

from decimal import Decimal
from typing import Dict, List
from typing import Literal
from datetime import datetime

from app.services.tax_engine import TaxEngine
from app.services.bpjs_engine import BPJSEngine


class PayrollCalculationService:
    """Main payroll calculation orchestrator"""

    def __init__(self):
        self.tax_engine = TaxEngine()
        self.bpjs_engine = BPJSEngine()

    def calculate_monthly_payroll(
        self,
        employee_name: str,
        bruto_components: Dict[str, Decimal],
        ptkp_status: str,
        jkk_risk_level: Literal["SR", "R", "S", "T", "ST"],
        employer_bears_pph21: bool = False,
        employer_bears_bpjs: bool = False,
    ) -> Dict:
        """
        Calculate complete monthly payroll for an employee
        
        Args:
            employee_name: Employee name (for display)
            bruto_components: Dict with salary components {gaji_pokok, tunjangan_*, etc}
            ptkp_status: PTKP classification (TK0, K1, K3, etc)
            jkk_risk_level: Risk level for JKK calculation
            employer_bears_pph21: If employer pays the tax
            employer_bears_bpjs: If employer pays BPJS
        
        Returns:
            Complete payroll breakdown
        """
        
        # 1. Calculate total bruto
        bruto_monthly = self._sum_bruto_components(bruto_components)
        
        # 2. Calculate PPh 21
        pph21_calc = self.tax_engine.calculate_monthly_pph21_ter(
            bruto_monthly, ptkp_status
        )
        # normalize PPh21 values to Decimal for internal arithmetic
        pph21_value = Decimal(str(pph21_calc.get("pph21_monthly", 0)))
        pph21_employee = Decimal("0") if employer_bears_pph21 else pph21_value
        pph21_employer = pph21_value if employer_bears_pph21 else Decimal("0")
        
        # 3. Calculate BPJS contributions
        bpjs_calc = self.bpjs_engine.calculate_total_bpjs(bruto_monthly, jkk_risk_level)
        
        # Handle employer-borne BPJS
        if employer_bears_bpjs:
            bpjs_employee_total = Decimal("0")
            bpjs_employer_total = (
                bpjs_calc["total_employer"] + bpjs_calc["total_employee"]
            )
        else:
            bpjs_employee_total = bpjs_calc["total_employee"]
            bpjs_employer_total = bpjs_calc["total_employer"]
        
        # 4. Calculate net salary (for employee)
        total_employee_deductions = pph21_employee + bpjs_employee_total
        net_salary = bruto_monthly - total_employee_deductions
        
        # 5. Calculate total employer cost
        total_employer_cost = bruto_monthly + pph21_employer + bpjs_employer_total
        
        return {
            "employee_name": employee_name,
            "period": datetime.now().strftime("%B %Y"),
            
            # Income breakdown
            "components": {k: float(v) for k, v in bruto_components.items()},
            "bruto_monthly": float(bruto_monthly),
            
            # Tax breakdown
            "pph21": {
                "employee_portion": float(pph21_employee),
                "employer_portion": float(pph21_employer),
                "ter_rate": pph21_calc["ter_rate"],
                "ter_category": pph21_calc["ter_category"],
                "ptkp_status": ptkp_status,
            },
            
            # BPJS breakdown
            "bpjs": {
                "kesehatan": {
                    "employer": float(bpjs_calc["kesehatan"]["employer"]),
                    "employee": float(bpjs_calc["kesehatan"]["employee"]),
                    "total": float(bpjs_calc["kesehatan"]["total"]),
                },
                "jht": {
                    "employer": float(bpjs_calc["jht"]["employer"]),
                    "employee": float(bpjs_calc["jht"]["employee"]),
                    "total": float(bpjs_calc["jht"]["total"]),
                },
                "jp": {
                    "employer": float(bpjs_calc["jp"]["employer"]),
                    "employee": float(bpjs_calc["jp"]["employee"]),
                    "total": float(bpjs_calc["jp"]["total"]),
                },
                "jkk": {
                    "employer": float(bpjs_calc["jkk"]["employer"]),
                    "employee": float(bpjs_calc["jkk"]["employee"]),
                    "total": float(bpjs_calc["jkk"]["total"]),
                    "risk_level": jkk_risk_level,
                },
                "total_employee": float(bpjs_employee_total),
                "total_employer": float(bpjs_employer_total),
            },
            
            # Summary
            "summary": {
                "bruto": float(bruto_monthly),
                "pph21": float(pph21_employee + pph21_employer),
                "bpjs_total": float(bpjs_calc["total_all"]),
                "total_deductions_employee": float(total_employee_deductions),
                "net_salary": float(net_salary),
                "total_employer_cost": float(total_employer_cost),
            },
            
            # Configuration
            "config": {
                "employer_bears_pph21": employer_bears_pph21,
                "employer_bears_bpjs": employer_bears_bpjs,
            },
        }

    def _sum_bruto_components(self, components: Dict[str, Decimal]) -> Decimal:
        """Sum all bruto components"""
        total = Decimal("0")
        for value in components.values():
            total += Decimal(str(value))
        return total

    def calculate_tax_summary(
        self,
        monthly_payrolls: List[Dict],
        ptkp_status: str,
    ) -> Dict:
        """
        Calculate annual tax summary and reconciliation
        
        Args:
            monthly_payrolls: List of monthly payroll calculations
            ptkp_status: PTKP classification
        
        Returns:
            Annual tax summary with adjustment
        """
        total_annual_bruto = Decimal("0")
        total_monthly_pph21 = Decimal("0")
        
        for payroll in monthly_payrolls:
            total_annual_bruto += Decimal(str(payroll["bruto_monthly"]))
            # Sum employee + employer PPh21
            pph21_total = (
                Decimal(str(payroll["pph21"]["employee_portion"])) +
                Decimal(str(payroll["pph21"]["employer_portion"]))
            )
            total_monthly_pph21 += pph21_total
        
        # Calculate annual PPh21 with progressive tax
        annual_calc = self.tax_engine.calculate_annual_pph21(
            total_annual_bruto,
            ptkp_status,
            total_monthly_pph21,
        )
        
        return {
            "annual_bruto": float(annual_calc["annual_bruto"]),
            "ptkp_annual": float(annual_calc["ptkp_annual"]),
            "pkp": float(annual_calc["pkp"]),
            "monthly_tax_paid": float(annual_calc["monthly_tax_paid"]),
            "annual_tax_progressive": float(annual_calc["annual_tax_progressive"]),
            "adjustment": float(annual_calc["adjustment"]),
            "adjustment_type": "refund" if annual_calc["adjustment"] > 0 else "additional_payment",
            "ptkp_status": ptkp_status,
        }