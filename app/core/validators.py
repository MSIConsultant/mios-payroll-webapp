"""
Backend validation utilities
Indonesian Payroll System - Production Grade
"""

import re
from typing import Tuple, Optional
from datetime import datetime


def validate_company_npwp(npwp: Optional[str]) -> bool:
    """
    Validate company NPWP format
    Format: 0XXXXXXXXXXXXXXX (starts with 0, followed by 15 digits)
    """
    if not npwp:
        return False
    
    # Remove whitespace
    npwp = npwp.strip()
    
    # Check length
    if len(npwp) != 16:
        return False
    
    # Check format: starts with 0, all digits
    pattern = r"^0\d{15}$"
    return bool(re.match(pattern, npwp))


def validate_individual_npwp(npwp: Optional[str]) -> bool:
    """
    Validate individual NPWP format
    Format: XXXXXXXXXXXXXXXX (16 digits)
    Based on NIK (national ID)
    """
    if not npwp:
        return False
    
    # Remove whitespace
    npwp = npwp.strip()
    
    # Check length
    if len(npwp) != 16:
        return False
    
    # Check all digits
    pattern = r"^\d{16}$"
    return bool(re.match(pattern, npwp))


def validate_nik(nik: Optional[str]) -> bool:
    """
    Validate Indonesian NIK (National ID)
    Format: XXXXXXXXXXXXXXXX (16 digits)
    
    Structure:
    - 6 digits: birth date (YYMMDD)
    - 5 digits: birth location code
    - 4 digits: serial number
    - 1 digit: gender (0-4 = female, 5-9 = male)
    """
    if not nik:
        return False
    
    # Remove whitespace
    nik = nik.strip()
    
    # Check length
    if len(nik) != 16:
        return False
    
    # Check all digits
    if not nik.isdigit():
        return False
    
    # Validate date portion (YYMMDD)
    birth_date_str = nik[:6]
    
    try:
        # Parse with century prefix (19 or 20)
        if int(birth_date_str[:2]) > 50:
            full_date = f"19{birth_date_str}"
        else:
            full_date = f"20{birth_date_str}"
        
        # Validate it's a valid date
        datetime.strptime(full_date, "%Y%m%d")
    except (ValueError, IndexError):
        return False
    
    # Gender digit validation (last digit before end)
    gender_digit = int(nik[8])
    if gender_digit > 9:  # Should be 0-9
        return False
    
    return True


def validate_phone_number(phone: Optional[str]) -> bool:
    """
    Validate Indonesian phone number
    Formats:
    - 08XX XXXX XXXX (with spaces)
    - 08XXXXXXXXXX (no spaces)
    - +628XX XXXX XXXX (international)
    - 628XXXXXXXXXX (international without +)
    """
    if not phone:
        return False
    
    # Remove common formatting characters
    phone = re.sub(r'[\s\-().]', '', phone)
    
    # Should be 10-13 digits, start with 8 or 62
    if re.match(r"^8\d{9,11}$", phone):
        return True
    
    if re.match(r"^628\d{8,10}$", phone):
        return True
    
    return False


def validate_email(email: Optional[str]) -> bool:
    """
    Validate email format
    """
    if not email:
        return False
    
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def validate_currency(value: Optional[float]) -> bool:
    """
    Validate currency amount
    Must be positive integer
    """
    if value is None:
        return False
    
    try:
        # Convert to int to check if whole number
        val_int = int(value)
        return val_int >= 0
    except (ValueError, TypeError):
        return False


def validate_ptkp_status(status: Optional[str]) -> bool:
    """
    Validate PTKP (personal tax allowance) status
    Valid statuses: TK/0, K/0, K/1, K/2, K/3, etc.
    """
    if not status:
        return False
    
    # Valid patterns: TK/0, K/X where X is digit
    pattern = r"^(TK|K)/\d+$"
    return bool(re.match(pattern, status.upper()))


def validate_company_data(company_data: dict) -> Tuple[bool, list[str]]:
    """
    Validate complete company data
    Returns: (is_valid, error_messages)
    """
    errors = []
    
    # Validate nama (company name)
    if not company_data.get("nama") or len(company_data.get("nama", "")) < 2:
        errors.append("Nama perusahaan harus minimal 2 karakter")
    
    # Validate NPWP
    if not company_data.get("npwp"):
        errors.append("NPWP perusahaan harus diisi")
    elif not validate_company_npwp(company_data.get("npwp")):
        errors.append("Format NPWP perusahaan tidak valid (harus 0XXXXXXXXXXXXXXX)")
    
    # Validate address
    if not company_data.get("alamat") or len(company_data.get("alamat", "")) < 5:
        errors.append("Alamat harus minimal 5 karakter")
    
    # Validate city
    if not company_data.get("kota"):
        errors.append("Kota harus diisi")
    
    # Validate province
    if not company_data.get("provinsi"):
        errors.append("Provinsi harus diisi")
    
    # Validate email if provided
    if company_data.get("email") and not validate_email(company_data.get("email")):
        errors.append("Format email tidak valid")
    
    # Validate phone if provided
    if company_data.get("telepon") and not validate_phone_number(company_data.get("telepon")):
        errors.append("Format nomor telepon tidak valid")
    
    return len(errors) == 0, errors


def validate_employee_data(employee_data: dict) -> Tuple[bool, list[str]]:
    """
    Validate complete employee data
    Returns: (is_valid, error_messages)
    """
    errors = []
    
    # Validate name
    if not employee_data.get("nama") or len(employee_data.get("nama", "")) < 2:
        errors.append("Nama karyawan harus minimal 2 karakter")
    
    # Validate NIK
    if not employee_data.get("nik"):
        errors.append("NIK harus diisi")
    elif not validate_nik(employee_data.get("nik")):
        errors.append("Format NIK tidak valid (harus 16 digit)")
    
    # Validate NPWP if provided
    if employee_data.get("npwp") and not validate_individual_npwp(employee_data.get("npwp")):
        errors.append("Format NPWP tidak valid (harus 16 digit)")
    
    # Validate PTKP status
    if not employee_data.get("status_ptkp"):
        errors.append("Status PTKP harus diisi")
    elif not validate_ptkp_status(employee_data.get("status_ptkp")):
        errors.append("Status PTKP tidak valid (contoh: TK/0, K/0, K/1, etc.)")
    
    return len(errors) == 0, errors


__all__ = [
    "validate_company_npwp",
    "validate_individual_npwp",
    "validate_nik",
    "validate_phone_number",
    "validate_email",
    "validate_currency",
    "validate_ptkp_status",
    "validate_company_data",
    "validate_employee_data",
]
