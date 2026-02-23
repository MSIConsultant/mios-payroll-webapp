import { create } from 'zustand';

export interface UserInfo {
  id?: number;
  email?: string;
  full_name?: string;
  role?: string;
  company_id?: number | null;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserInfo | null;
  loading: boolean;
  setTokens: (access: string | null, refresh: string | null) => void;
  setUser: (user: UserInfo | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: typeof window !== 'undefined' ? localStorage.getItem('access_token') : null,
  refreshToken: typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null,
  user: typeof window !== 'undefined' && localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string) : null,
  loading: false,
  setTokens: (access, refresh) => {
    if (access) localStorage.setItem('access_token', access); else localStorage.removeItem('access_token');
    if (refresh) localStorage.setItem('refresh_token', refresh); else localStorage.removeItem('refresh_token');
    set({ accessToken: access, refreshToken: refresh });
  },
  setUser: (user) => {
    if (user) localStorage.setItem('user', JSON.stringify(user)); else localStorage.removeItem('user');
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    set({ accessToken: null, refreshToken: null, user: null });
  },
}));
