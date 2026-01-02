// src/hooks/useAuth.tsx

import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/api';

// Типы для контекста
export interface CompanyMembership {
  companyId: number;
  companyName: string;
  description: string | null;
  roleName: string;
  roleLevel: number;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
  companyRole: string | null;
}

interface AuthState {
  user: User | null;
  companies: CompanyMembership[];
  currentCompany: CompanyMembership | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerificationCode: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    companies: [],
    currentCompany: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Загружаем полный контекст из /api/auth/me
  const loadContext = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const response = await authService.getMyContext();

      setState({
        user: response.user,
        companies: response.companies || [],
        currentCompany: response.currentCompany || null,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.log('User not authenticated:', error);
      setState({
        user: null,
        companies: [],
        currentCompany: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  // При загрузке приложения
  useEffect(() => {
    loadContext();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await authService.login({ email, password });
      await loadContext();
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      await authService.register({ email, password, firstName, lastName });
      await loadContext();
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setState({
        user: null,
        companies: [],
        currentCompany: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const refreshAuth = async () => {
    await loadContext();
  };

  const verifyEmail = async (email: string, code: string) => {
    await authService.verifyEmail(email, code);
    await loadContext();
  };

  const resendVerificationCode = async (email: string) => {
    await authService.resendVerificationCode(email);
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshAuth,
    verifyEmail,
    resendVerificationCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};