/**
 * Validation utilities for Indonesian documents and identifiers
 */

// ============= NPWP Validation =============

/**
 * Validate Individual NPWP (16-digit NIK)
 * As of July 1, 2024: Residents use 16-digit NIK as NPWP
 * Format: 16 digits with no separators
 */
export const validateIndividualNPWP = (npwp: string): boolean => {
  const regex = /^\d{16}$/;
  return regex.test(npwp.replace(/\D/g, ''));
};

/**
 * Validate Company NPWP (16-digit with leading zero)
 * Format: 0 followed by 15 digits
 */
export const validateCompanyNPWP = (npwp: string): boolean => {
  const regex = /^0\d{15}$/;
  return regex.test(npwp.replace(/\D/g, ''));
};

/**
 * Format NPWP for display
 * 16 digits → XX.XXX.XXX.X-XXX.XXX
 */
export const formatNPWP = (npwp: string): string => {
  const clean = npwp.replace(/\D/g, '');
  if (clean.length !== 16) return npwp;
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}.${clean.slice(8, 9)}-${clean.slice(9, 12)}.${clean.slice(12, 16)}`;
};

/**
 * Parse formatted NPWP back to raw numbers
 */
export const parseNPWP = (formatted: string): string => {
  return formatted.replace(/\D/g, '');
};

// ============= NIK Validation =============

/**
 * Validate Indonesian NIK (16-digit National Identity Number)
 * Format: 16 consecutive digits
 * Structure: DDMMYY-PPPP-CCSX
 *   DD: Day (01-31)
 *   MM: Month (01-12, modify for female: 40-51)
 *   YY: Year (00-99)
 *   PPPP: Province code
 *   CC: City code
 *   S: Series number
 *   X: Registration number
 */
export const validateNIK = (nik: string): boolean => {
  const regex = /^\d{16}$/;
  const clean = nik.replace(/\D/g, '');
  
  if (!regex.test(clean)) return false;
  
  // Validate day: 01-31 or 41-71 (female modifier)
  const day = parseInt(clean.slice(0, 2));
  if ((day < 1 || day > 31) && (day < 41 || day > 71)) return false;
  
  // Validate month: 01-12
  const month = parseInt(clean.slice(2, 4));
  if (month < 1 || month > 12) return false;
  
  return true;
};

/**
 * Format NIK for display
 * 16 digits → XXXX.XXXX.XXXXXXX
 */
export const formatNIK = (nik: string): string => {
  const clean = nik.replace(/\D/g, '');
  if (clean.length !== 16) return nik;
  return `${clean.slice(0, 4)}.${clean.slice(4, 8)}.${clean.slice(8, 16)}`;
};

// ============= Phone Validation =============

/**
 * Validate Indonesian phone number
 * Formats: 08XX-XXXX-XXXX or +62 8XX-XXXX-XXXX
 */
export const validatePhone = (phone: string): boolean => {
  const regex = /^(\+62|0)[0-9]{9,12}$/;
  return regex.test(phone.replace(/\D/g, '+').replace('+', ''));
};

/**
 * Format phone number
 * 0812345678 → 0812-3456-78
 */
export const formatPhone = (phone: string): string => {
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 10) return phone;
  
  if (clean.startsWith('62')) {
    const formatted = clean.slice(2);
    return `+62 ${formatted.slice(0, 3)}-${formatted.slice(3, 7)}-${formatted.slice(7)}`;
  } else if (clean.startsWith('0')) {
    return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8)}`;
  }
  return phone;
};

// ============= Currency Validation =============

/**
 * Validate Indonesian Rupiah amount (positive integer)
 */
export const validateCurrency = (value: number): boolean => {
  return !isNaN(value) && value >= 0 && Number.isInteger(value);
};

/**
 * Format number as Indonesian currency
 * 5000000 → Rp 5.000.000
 */
export const formatCurrency = (value: number): string => {
  if (!validateCurrency(value)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Parse currency string to number
 * "Rp 5.000.000" → 5000000
 */
export const parseCurrency = (formatted: string): number => {
  const cleaned = formatted.replace(/\D/g, '');
  return parseInt(cleaned, 10) || 0;
};

// ============= Email Validation =============

/**
 * Validate email address
 */
export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// ============= Date Validation =============

/**
 * Validate date is in valid range and format
 */
export const validateDate = (date: string): boolean => {
  try {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  } catch {
    return false;
  }
};

// ============= Composite Validation =============

export const validateCompanyData = (company: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!company.nama || company.nama.trim().length === 0) {
    errors.push('Nama perusahaan wajib diisi');
  }
  
  if (!validateCompanyNPWP(company.npwp)) {
    errors.push('NPWP perusahaan tidak valid (format: 0XXXXXXXXXXXXXXX)');
  }
  
  if (!company.alamat || company.alamat.trim().length === 0) {
    errors.push('Alamat wajib diisi');
  }
  
  if (company.email && !validateEmail(company.email)) {
    errors.push('Format email tidak valid');
  }
  
  if (company.telepon && !validatePhone(company.telepon)) {
    errors.push('Format telepon tidak valid');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateEmployeeData = (employee: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!employee.nama || employee.nama.trim().length === 0) {
    errors.push('Nama karyawan wajib diisi');
  }
  
  if (!validateIndividualNPWP(employee.npwp)) {
    errors.push('NPWP karyawan tidak valid (16 digit)');
  }
  
  if (!validateNIK(employee.nik)) {
    errors.push('NIK tidak valid (16 digit)');
  }
  
  if (!employee.tgl_lahir || !validateDate(employee.tgl_lahir)) {
    errors.push('Tanggal lahir tidak valid');
  }
  
  if (!employee.jenis_kelamin || !['L', 'P'].includes(employee.jenis_kelamin)) {
    errors.push('Jenis kelamin harus L atau P');
  }
  
  if (!employee.jabatan || employee.jabatan.trim().length === 0) {
    errors.push('Jabatan wajib diisi');
  }
  
  if (!employee.status_ptkp || employee.status_ptkp.trim().length === 0) {
    errors.push('Status PTKP wajib diisi');
  }
  
  if (!employee.salary_profile || !validateCurrency(employee.salary_profile.gaji_pokok)) {
    errors.push('Gaji pokok harus berupa angka positif');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};
