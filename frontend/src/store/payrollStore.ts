import { create } from 'zustand';
import { PayrollCalculationResponse, CalculationRecord } from '../types';

interface PayrollStore {
  // State
  currentCalculation: PayrollCalculationResponse | null;
  calculations: CalculationRecord[];
  loading: boolean;
  error: string | null;

  // Setters
  setCurrentCalculation: (calculation: PayrollCalculationResponse | null) => void;
  setCalculations: (calculations: CalculationRecord[]) => void;
  addCalculation: (calculation: CalculationRecord) => void;
  clearError: () => void;
  setError: (error: string) => void;
  setLoading: (loading: boolean) => void;

  // Utilities
  saveCalculation: (calculation: PayrollCalculationResponse) => void;
  getCalculationHistory: (employeeId: string) => CalculationRecord[];
}

export const usePayrollStore = create<PayrollStore>((set, get) => ({
  currentCalculation: null,
  calculations: [],
  loading: false,
  error: null,

  setCurrentCalculation: (calculation) =>
    set({
      currentCalculation: calculation,
    }),

  setCalculations: (calculations) =>
    set({
      calculations,
    }),

  addCalculation: (calculation) => {
    const { calculations } = get();
    set({
      calculations: [calculation, ...calculations],
    });
  },

  clearError: () =>
    set({
      error: null,
    }),

  setError: (error) =>
    set({
      error,
    }),

  setLoading: (loading) =>
    set({
      loading,
    }),

  saveCalculation: (calculation) => {
    const { calculations } = get();
    const record: CalculationRecord = {
      id: `${Date.now()}`,
      employee_name: calculation.employee_name,      npwp: 'N/A',
      nik: 'N/A',      bruto: calculation.bruto_monthly,
      net_salary: calculation.summary.net_salary,
      tax: calculation.pph21.employee_portion,
      bpjs: calculation.bpjs.total_employee,
      date: new Date().toLocaleDateString('id-ID'),
      status: 'saved',
    };
    set({
      calculations: [record, ...calculations],
      currentCalculation: null,
    });
  },

  getCalculationHistory: (employeeId: string) => {
    const { calculations } = get();
    return calculations.filter((c) =>
      c.employee_name.toLowerCase().includes(employeeId.toLowerCase())
    );
  },
}));
