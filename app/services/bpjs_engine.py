"""
BPJS Contribution Calculation Engine

Implements:
- BPJS Kesehatan (Health) contributions
- BPJS Ketenagakerjaan (Employment) contributions
  - JHT (Pension)
  - JP (Disability/Death)
  - JKK (Work Accident - Risk-Based)
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Literal, Tuple
from app.core.tax_tables import (
    BPJS_KESEHATAN_RATES,
    BPJS_KETENAGAKERJAAN_JHT,
    BPJS_KETENAGAKERJAAN_JP,
    JKK_RISK_RATES,
)


class BPJSEngine:
    """Indonesian BPJS Contribution Calculation Engine"""

    def __init__(self):
        self.kesehatan_rates = BPJS_KESEHATAN_RATES
        self.jht_rates = BPJS_KETENAGAKERJAAN_JHT
        self.jp_rates = BPJS_KETENAGAKERJAAN_JP
        self.jkk_rates = JKK_RISK_RATES

    def calculate_bpjs_kesehatan(
        self,
        bruto_monthly: Decimal,
    ) -> Dict:
        """
        Calculate BPJS Kesehatan (Health) contributions
        
        Args:
            bruto_monthly: Gross monthly income
        
        Returns:
            Dict with employer and employee portions
        """
        bruto_monthly = Decimal(str(bruto_monthly))
        cap = Decimal(str(self.kesehatan_rates["cap"]))
        
        # Base for contribution (capped)
        base = min(bruto_monthly, cap)
        
        employer_rate = Decimal(str(self.kesehatan_rates["employer"]))
        employee_rate = Decimal(str(self.kesehatan_rates["employee"]))
        
        employer_portion = (base * employer_rate).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        employee_portion = (base * employee_rate).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        
        return {
            "employer": employer_portion,
            "employee": employee_portion,
            "total": employer_portion + employee_portion,
            "base": base,
            "cap": cap,
        }

    def calculate_bpjs_jht(
        self,
        bruto_monthly: Decimal,
    ) -> Dict:
        """
        Calculate BPJS JHT (Pension/Old Age) contributions
        
        Args:
            bruto_monthly: Gross monthly income
        
        Returns:
            Dict with employer and employee portions
        """
        bruto_monthly = Decimal(str(bruto_monthly))
        
        employer_rate = Decimal(str(self.jht_rates["employer"]))
        employee_rate = Decimal(str(self.jht_rates["employee"]))
        
        employer_portion = (bruto_monthly * employer_rate).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        employee_portion = (bruto_monthly * employee_rate).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        
        return {
            "employer": employer_portion,
            "employee": employee_portion,
            "total": employer_portion + employee_portion,
            "description": "Jaminan Hari Tua (Pension)",
        }

    def calculate_bpjs_jp(
        self,
        bruto_monthly: Decimal,
    ) -> Dict:
        """
        Calculate BPJS JP (Disability/Death) contributions
        
        Args:
            bruto_monthly: Gross monthly income
        
        Returns:
            Dict with employer and employee portions
        """
        bruto_monthly = Decimal(str(bruto_monthly))
        
        employer_rate = Decimal(str(self.jp_rates["employer"]))
        employee_rate = Decimal(str(self.jp_rates["employee"]))
        
        employer_portion = (bruto_monthly * employer_rate).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        employee_portion = (bruto_monthly * employee_rate).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        
        return {
            "employer": employer_portion,
            "employee": employee_portion,
            "total": employer_portion + employee_portion,
            "description": "Jaminan Pensiun (Disability/Death)",
        }

    def calculate_bpjs_jkk(
        self,
        bruto_monthly: Decimal,
        risk_level: Literal["SR", "R", "S", "T", "ST"],
    ) -> Dict:
        """
        Calculate BPJS JKK (Work Accident) contributions - Risk-based
        
        Args:
            bruto_monthly: Gross monthly income
            risk_level: Risk classification (SR, R, S, T, ST)
        
        Returns:
            Dict with employer contribution (employee has no portion)
        """
        bruto_monthly = Decimal(str(bruto_monthly))
        
        if risk_level not in self.jkk_rates:
            raise ValueError(f"Invalid risk level: {risk_level}")
        
        rate = Decimal(str(self.jkk_rates[risk_level]))
        
        employer_portion = (bruto_monthly * rate).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        
        return {
            "employer": employer_portion,
            "employee": Decimal("0"),
            "total": employer_portion,
            "risk_level": risk_level,
            "rate": float(rate),
            "description": "Jaminan Kecelakaan Kerja (Work Accident)",
        }

    def calculate_total_bpjs(
        self,
        bruto_monthly: Decimal,
        risk_level: Literal["SR", "R", "S", "T", "ST"],
    ) -> Dict:
        """
        Calculate all BPJS contributions
        
        Args:
            bruto_monthly: Gross monthly income
            risk_level: Risk classification
        
        Returns:
            Dict with all contributions and totals
        """
        kesehatan = self.calculate_bpjs_kesehatan(bruto_monthly)
        jht = self.calculate_bpjs_jht(bruto_monthly)
        jp = self.calculate_bpjs_jp(bruto_monthly)
        jkk = self.calculate_bpjs_jkk(bruto_monthly, risk_level)
        
        total_employer = (
            kesehatan["employer"] +
            jht["employer"] +
            jp["employer"] +
            jkk["employer"]
        )
        
        total_employee = (
            kesehatan["employee"] +
            jht["employee"] +
            jp["employee"] +
            jkk["employee"]
        )
        
        return {
            "kesehatan": kesehatan,
            "jht": jht,
            "jp": jp,
            "jkk": jkk,
            "total_employer": total_employer,
            "total_employee": total_employee,
            "total_all": total_employer + total_employee,
        }

    def get_risk_levels(self) -> Dict[str, Tuple[str, float]]:
        """Get available risk levels and labels.

        Returns mapping: risk_code -> (description, rate)
        """
        return {
            k: (
                ("Sangat Rendah (0.24%)" if k == "SR" else
                 "Rendah (0.54%)" if k == "R" else
                 "Sedang (0.89%)" if k == "S" else
                 "Tinggi (1.27%)" if k == "T" else
                 "Sangat Tinggi (1.74%)"),
                float(v),
            )
            for k, v in self.jkk_rates.items()
        }

    def calculate_employee_portion(self, gross_income):
        # Compatibility helper: calculate employee portion using configured rate tables
        gross = Decimal(str(gross_income))
        jht_rate = Decimal(str(self.jht_rates.get("employee", "0")))
        jp_rate = Decimal(str(self.jp_rates.get("employee", "0")))
        kesehatan_rate = Decimal(str(self.kesehatan_rates.get("employee", "0")))
        jht = (gross * jht_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        jp = (gross * jp_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        kesehatan = (gross * kesehatan_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        return int((jht + jp + kesehatan))

    def calculate_employer_portion(self, gross_income):
        gross = Decimal(str(gross_income))
        jht_rate = Decimal(str(self.jht_rates.get("employer", "0")))
        jp_rate = Decimal(str(self.jp_rates.get("employer", "0")))
        kesehatan_rate = Decimal(str(self.kesehatan_rates.get("employer", "0")))
        # For JKK, use a conservative default lookup (if available pick the first rate)
        jkk_rate = Decimal("0")
        if isinstance(self.jkk_rates, dict) and len(self.jkk_rates) > 0:
            # pick first defined rate as fallback
            first_key = next(iter(self.jkk_rates))
            jkk_rate = Decimal(str(self.jkk_rates.get(first_key, "0")))

        jht = (gross * jht_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        jp = (gross * jp_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        kesehatan = (gross * kesehatan_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        jkk = (gross * jkk_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        return int((jht + jp + kesehatan + jkk))