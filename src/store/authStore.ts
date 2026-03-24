import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor: string;
  taxRate: number;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  tenant: TenantInfo;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (tenantSlug: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login: async (tenantSlug: string, email: string, password: string) => {
        const res = await api.post('/auth/login', { tenantSlug, email, password });
        const { accessToken, refreshToken, user } = res.data.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // Apply tenant branding CSS
        if (user.tenant?.primaryColor) {
          document.documentElement.style.setProperty('--primary', user.tenant.primaryColor);
        }

        set({ user, accessToken, isAuthenticated: true });
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {}
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, isAuthenticated: false });
        window.location.href = '/login';
      },

      setUser: (user: AuthUser) => set({ user }),
    }),
    {
      name: 'cmrarena-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
