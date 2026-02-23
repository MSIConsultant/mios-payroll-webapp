import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  PayrollCalculationRequest,
  PayrollCalculationResponse,
  PTKPOption,
  TERBracketResponse,
} from '../types';

const API_BASE_URL: string = (typeof process !== 'undefined' && process.env.REACT_APP_API_URL) || 'http://localhost:8000/api/v1';

class PayrollAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor: attach access token if present
    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      try {
        const token = localStorage.getItem('access_token');
        if (!config.headers) config.headers = {} as any;
        if (token) {
          (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }
      } catch (e) {
        // ignore
      }
      return config;
    });

    // Response interceptor: handle 401 -> attempt refresh
    this.client.interceptors.response.use(
      (resp) => resp,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const refresh = localStorage.getItem('refresh_token');
            if (!refresh) throw new Error('No refresh token');
            const resp = await axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refresh });
            const { access_token } = resp.data;
            if (access_token) {
              localStorage.setItem('access_token', access_token);
              if (!originalRequest.headers) originalRequest.headers = {} as any;
              (originalRequest.headers as Record<string, string>)['Authorization'] = `Bearer ${access_token}`;
              return this.client.request(originalRequest);
            }
          } catch (refreshErr) {
            // On refresh failure, clear tokens and propagate error
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Calculate payroll for a single employee
   */
  async calculatePayroll(data: PayrollCalculationRequest): Promise<PayrollCalculationResponse> {
    try {
      const response = await this.client.post<PayrollCalculationResponse>(
        '/calculation/calculate',
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get PTKP options
   */
  async getPTKPOptions(): Promise<Record<string, PTKPOption>> {
    try {
      const response = await this.client.get<Record<string, PTKPOption>>(
        '/calculation/ptkp-options'
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get TER brackets for a specific PTKP status
   */
  async getTERBrackets(ptkpStatus: string): Promise<TERBracketResponse> {
    try {
      const response = await this.client.get<TERBracketResponse>(
        `/calculation/ter-brackets/${ptkpStatus}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get JKK risk levels
   */
  async getJKKRiskLevels(): Promise<Record<string, string>> {
    try {
      const response = await this.client.get<any>('/calculation/jkk-risk-levels');
      // Extract risk_levels from the response
      if (response.data.risk_levels) {
        return response.data.risk_levels;
      }
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Auth: login
   */
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  /**
   * Auth: refresh token
   */
  async refresh(refreshToken: string) {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
    return response.data;
  }

  /**
   * Calculate tax summary for year-end reconciliation
   */
  async calculateTaxSummary(monthlyPayrolls: PayrollCalculationResponse[], ptkpStatus: string) {
    try {
      const response = await this.client.post('/calculation/tax-summary', {
        monthly_payrolls: monthlyPayrolls,
        ptkp_status: ptkpStatus,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error status
        return new Error(
          error.response.data?.detail || error.response.statusText || 'API Error'
        );
      } else if (error.request) {
        // Request made but no response
        return new Error('No response from server. Is the backend running?');
      }
    }
    return new Error('An unexpected error occurred');
  }
}

export const payrollAPI = new PayrollAPI();

export default payrollAPI;
