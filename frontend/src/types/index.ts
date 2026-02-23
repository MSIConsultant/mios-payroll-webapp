// Type definitions for MIOS Payroll System

// ============= COMPANY MANAGEMENT =============

// Company profile
export interface Company {
  id?: string;
  nama: string;
  npwp: string; // Corporate NPWP format: 0XXXXXXXXXXXXXXX
  alamat: string;
  kota: string;
  provinsi: string;
  email?: string;
  telepon?: string;
  pic_nama?: string; // Person in charge
  pic_telepon?: string;
  bank_nama?: string;
  bank_rekening?: string;
  bank_atas_nama?: string;
  created_at?: string;
  updated_at?: string;
}

// ============= EMPLOYEE MANAGEMENT =============

// Single allowance item
export interface Allowance {
  type: string;
  amount: number;
}

// Employee profile
export interface Employee {
  id?: string;
  employee_id?: string;
  company_id?: string;
  nama: string;
  npwp: string;
  nik: string;
  tgl_lahir: string; // ISO date format: YYYY-MM-DD
  jenis_kelamin: 'L' | 'P';
  jabatan: string;
  status_ptkp: string; // e.g., "K1", "TK/0", "K2", etc.
}

// ============= SALARY & BENEFITS =============

// Salary configuration
export interface SalaryProfile {
  gaji_pokok: number;
  allowances: Allowance[];
}

// Benefits configuration
export interface BenefitConfig {
  company_borne: string[]; // e.g., ["pph21", "jht", "jp", "bpjs_kesehatan"]
  risk_level: string; // e.g., "RENDAH", "SEDANG", "TINGGI", "SANGAT_TINGGI"
}

// ============= PAYROLL CALCULATION =============

// Complete employee data for calculation
export interface EmployeeData extends Employee {
  salary_profile: SalaryProfile;
  benefit_config: BenefitConfig;
}

// Request to calculate payroll
export interface PayrollCalculationRequest {
  employee_id?: string;
  company_id?: string;
  nama: string;
  npwp: string;
  nik: string;
  tgl_lahir: string;
  jenis_kelamin: 'L' | 'P';
  jabatan: string;
  status_ptkp: string;
  salary_profile: SalaryProfile;
  benefit_config: BenefitConfig;
}

// Tax details
export interface PPh21Details {
  employee_portion: number;
  employer_portion: number;
  ter_rate: number;
  ter_category: string;
  ptkp_status: string;
}

// BPJS component (employer/employee split)
export interface BPJSComponent {
  employer: number;
  employee: number;
  total: number;
}

// All BPJS contributions
export interface BPJSDetails {
  kesehatan: BPJSComponent;
  jht: BPJSComponent;
  jp: BPJSComponent;
  jkk: BPJSComponent & { risk_level: string };
  total_employee: number;
  total_employer: number;
}

// Summary of deductions and net
export interface PayrollSummary {
  bruto: number;
  pph21: number;
  bpjs_total: number;
  total_deductions_employee: number;
  net_salary: number;
  total_employer_cost: number;
}

// Complete calculation response from backend
export interface PayrollCalculationResponse {
  employee_name: string;
  period: string;
  components: SalaryProfile;
  bruto_monthly: number;
  pph21: PPh21Details;
  bpjs: BPJSDetails;
  summary: PayrollSummary;
  config: {
    company_borne: string[];
  };
}

// ============= HISTORY & RECORDS =============

// Saved calculation record
export interface CalculationRecord {
  id: string;
  employee_id?: string;
  employee_name: string;
  npwp: string;
  nik: string;
  bruto: number;
  net_salary: number;
  tax: number;
  bpjs: number;
  date: string;
  status: 'pending' | 'calculated' | 'saved' | 'exported';
}

// ============= REFERENCE DATA =============

// PTKP option
export interface PTKPOption {
  status: string;
  description: string;
  annual: number;
}

// TER bracket
export interface TERBracket {
  min: number;
  max: number;
  rate: number;
}

// TER bracket response
export interface TERBracketResponse {
  ter_category: string;
  brackets: TERBracket[];
}

// JKK risk levels
export interface JKKRiskLevels {
  [key: string]: string;
}
