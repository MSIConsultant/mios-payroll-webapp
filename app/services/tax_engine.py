"""
Tax Calculation Engine for Indonesian PPh 21

Implements:
- TER (Tarif Efektif Rata-rata) monthly taxation
- PTKP classification system
- Year-end progressive tax reconciliation
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Any
from app.core.tax_tables import (
    TER_BRACKETS_2024,
    PTKP_2024,
    PROGRESSIVE_TAX_BRACKETS,
)


class TaxEngine:
    """Indonesian PPh 21 Tax Calculation Engine"""

    def __init__(self):
        self.ter_brackets = TER_BRACKETS_2024
        self.ptkp_table = PTKP_2024
        self.progressive_brackets = PROGRESSIVE_TAX_BRACKETS

    def get_ptkp_info(self, ptkp_status: str) -> Dict:
        """
        Get PTKP information and TER category
        
        Args:
            ptkp_status: e.g., "TK0", "K1", "K3"
        
        Returns:
            Dict with annual amount, TER category, description
        """
        if ptkp_status not in self.ptkp_table:
            raise ValueError(f"Invalid PTKP status: {ptkp_status}")
        return self.ptkp_table[ptkp_status]

    def calculate_monthly_pph21_ter(
        self,
        bruto_monthly: Decimal,
        ptkp_status: str,
    ) -> Dict:
        """
        Calculate monthly PPh 21 using TER (Tarif Efektif Rata-rata) method
        
        Args:
            bruto_monthly: Gross monthly income
            ptkp_status: PTKP classification (TK0, K1, etc.)
        
        Returns:
            Dict with tax amount and breakdown
        """
        bruto_monthly = Decimal(str(bruto_monthly))
        
        ptkp_info = self.get_ptkp_info(ptkp_status)
        ter_category = ptkp_info["ter_category"]
        
        # Find applicable bracket
        brackets = self.ter_brackets[ter_category]
        applicable_rate = Decimal("0")
        
        for bracket in brackets:
            if bracket["min"] <= bruto_monthly <= bracket["max"]:
                applicable_rate = Decimal(str(bracket["rate"]))
                break
        
        # Calculate tax: Tax = Bruto × Rate
        tax = (bruto_monthly * applicable_rate).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        # Return JSON-friendly floats for monthly API/CLI consumers
        return {
            "pph21_monthly": float(tax),
            "ter_category": ter_category,
            "ter_rate": float(applicable_rate),
            "bruto_monthly": float(bruto_monthly),
            "ptkp_status": ptkp_status,
        }

    def calculate_annual_pph21(
        self,
        annual_bruto: Decimal,
        ptkp_status: str,
        monthly_tax_paid: Decimal = Decimal("0"),
    ) -> Dict:
        """
        Calculate annual PPh 21 with progressive tax and reconciliation
        
        Args:
            annual_bruto: Total annual gross income
            ptkp_status: PTKP classification
            monthly_tax_paid: Total PPh 21 paid during the year
        
        Returns:
            Dict with annual tax, monthly adjustment, and breakdown
        """
        annual_bruto = Decimal(str(annual_bruto))
        monthly_tax_paid = Decimal(str(monthly_tax_paid))
        
        ptkp_info = self.get_ptkp_info(ptkp_status)
        ptkp_annual = Decimal(str(ptkp_info["annual"]))
        
        # Calculate PKP (Penghasilan Kena Pajak)
        pkp = (annual_bruto - ptkp_annual).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        if pkp < 0:
            pkp = Decimal("0")
        
        # Apply progressive tax
        annual_tax = self._apply_progressive_tax(pkp)
        
        # Calculate adjustment needed
        adjustment = annual_tax - monthly_tax_paid
        
        return {
            "annual_bruto": annual_bruto,
            "ptkp_annual": ptkp_annual,
            "pkp": pkp,
            "annual_tax_progressive": annual_tax,
            "monthly_tax_paid": monthly_tax_paid,
            "adjustment": adjustment,  # Positive = refund, Negative = additional payment
            "ptkp_status": ptkp_status,
        }

    def _apply_progressive_tax(self, pkp: Decimal) -> Decimal:
        """
        Apply progressive tax brackets to PKP
        
        Args:
            pkp: Penghasilan Kena Pajak (taxable income)
        
        Returns:
            Total tax amount
        """
        if pkp <= 0:
            return Decimal("0")
        
        total_tax = Decimal("0")
        remaining_pkp = pkp
        
        for bracket in self.progressive_brackets:
            if remaining_pkp <= 0:
                break
            
            bracket_min = Decimal(str(bracket["min"]))
            bracket_max = Decimal(str(bracket["max"]))
            rate = Decimal(str(bracket["rate"]))
            
            # Calculate taxable amount in this bracket
            taxable_in_bracket = min(
                remaining_pkp,
                bracket_max - bracket_min
            )
            
            if taxable_in_bracket > 0:
                tax_in_bracket = (taxable_in_bracket * rate).quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )
                total_tax += tax_in_bracket
                remaining_pkp -= taxable_in_bracket
        
        return total_tax

    def get_ter_breakdown(self, ptkp_status: str) -> List[Dict[str, Any]]:
        """
        Get detailed TER bracket breakdown for a PTKP status.

        Returns a JSON-friendly list of bracket dicts with keys: min, max, rate.
        This does not mutate the internal tables and is intended for API/CLI use.
        """
        ptkp_info = self.get_ptkp_info(ptkp_status)
        ter_category = ptkp_info["ter_category"]

        bracket_list: List[Dict[str, Any]] = []
        for b in self.ter_brackets[ter_category]:
            # produce JSON-friendly numeric values (floats) for external consumers
            max_val = b["max"]
            bracket_list.append({
                "min": float(b["min"]),
                "max": float(max_val) if max_val != float("inf") else float("inf"),
                "rate": float(b["rate"]),
            })

        return bracket_list
    
    def calculate(self, gross_income: float) -> float:
        # placeholder simple flat 5%
        return gross_income * 0.05