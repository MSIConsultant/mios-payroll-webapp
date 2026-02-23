"""
TER (Tarif Efektif Rata-rata) Tax Tables for Indonesia 2024
Bracket-based effective tax rates
"""

# TER Tax Table structure
# TER_A, TER_B, TER_C categories based on PTKP status

TER_BRACKETS_2024 = {
    "TER_A": [
        {"min": 0, "max": 2_325_000, "rate": 0.00},
        {"min": 2_325_001, "max": 4_650_000, "rate": 0.05},
        {"min": 4_650_001, "max": 9_300_000, "rate": 0.10},
        {"min": 9_300_001, "max": 18_600_000, "rate": 0.15},
        {"min": 18_600_001, "max": float('inf'), "rate": 0.20},
    ],
    "TER_B": [
        {"min": 0, "max": 2_812_500, "rate": 0.00},
        {"min": 2_812_501, "max": 5_625_000, "rate": 0.05},
        {"min": 5_625_001, "max": 11_250_000, "rate": 0.10},
        {"min": 11_250_001, "max": 22_500_000, "rate": 0.15},
        {"min": 22_500_001, "max": float('inf'), "rate": 0.20},
    ],
    "TER_C": [
        {"min": 0, "max": 3_300_000, "rate": 0.00},
        {"min": 3_300_001, "max": 6_600_000, "rate": 0.05},
        {"min": 6_600_001, "max": 13_200_000, "rate": 0.10},
        {"min": 13_200_001, "max": 26_400_000, "rate": 0.15},
        {"min": 26_400_001, "max": float('inf'), "rate": 0.20},
    ],
}

# PTKP (Penghasilan Tidak Kena Pajak) Annual Amounts
PTKP_2024 = {
    "TK0": {"annual": 54_000_000, "ter_category": "TER_A", "description": "Tidak Kawin"},
    "TK1": {"annual": 58_500_000, "ter_category": "TER_A", "description": "Tidak Kawin + 1 Tanggungan"},
    "TK2": {"annual": 63_000_000, "ter_category": "TER_A", "description": "Tidak Kawin + 2 Tanggungan"},
    "TK3": {"annual": 67_500_000, "ter_category": "TER_A", "description": "Tidak Kawin + 3 Tanggungan"},
    "K0": {"annual": 58_500_000, "ter_category": "TER_B", "description": "Kawin"},
    "K1": {"annual": 63_000_000, "ter_category": "TER_B", "description": "Kawin + 1 Tanggungan"},
    "K2": {"annual": 67_500_000, "ter_category": "TER_B", "description": "Kawin + 2 Tanggungan"},
    "K3": {"annual": 72_000_000, "ter_category": "TER_C", "description": "Kawin + 3 Tanggungan"},
}

# BPJS Contribution Rates
BPJS_KESEHATAN_RATES = {
    "employer": 0.04,  # 4%
    "employee": 0.01,  # 1%
    "cap": 12_000_000,  # Monthly salary cap for contribution calculation
}

BPJS_KETENAGAKERJAAN_JHT = {
    "employer": 0.037,  # 3.7%
    "employee": 0.02,   # 2%
    "cap": None,  # No cap
}

BPJS_KETENAGAKERJAAN_JP = {
    "employer": 0.02,   # 2%
    "employee": 0.01,   # 1%
    "cap": None,  # No cap
}

# JKK (Jaminan Kecelakaan Kerja) Risk-Based Rates
JKK_RISK_RATES = {
    "SR": 0.0024,   # Sangat Rendah - 0.24%
    "R": 0.0054,    # Rendah - 0.54%
    "S": 0.0089,    # Sedang - 0.89%
    "T": 0.0127,    # Tinggi - 1.27%
    "ST": 0.0174,   # Sangat Tinggi - 1.74%
}

# Progressive Tax Table (for year-end reconciliation)
PROGRESSIVE_TAX_BRACKETS = [
    {"min": 0, "max": 60_000_000, "rate": 0.05},
    {"min": 60_000_001, "max": 250_000_000, "rate": 0.15},
    {"min": 250_000_001, "max": 500_000_000, "rate": 0.25},
    {"min": 500_000_001, "max": 5_000_000_000, "rate": 0.30},
    {"min": 5_000_000_001, "max": float('inf'), "rate": 0.35},
]
