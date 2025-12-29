import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/auth';
import { authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  verifyEmail: (email: string, verificationCode: string) => Promise<void>;
  resendVerificationCode: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    console.log('AuthProvider: checkAuthStatus started');
    try {
      const response = await authService.refresh();
      console.log('AuthProvider: refresh success', response.user);
      setUser(response.user);
    } catch (error) {
      console.error('AuthProvider: refresh failed', error);
      setUser(null);
    } finally {
      setIsLoading(false);
      console.log('AuthProvider: isLoading set to false');
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    setIsLoading(true);
    try {
      const response = await authService.register({
        email,
        password,
        firstName,
        lastName,
      });
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const refreshAuth = async () => {
    try {
      const response = await authService.refresh();
      setUser(response.user);
    } catch (error) {
      setUser(null);
      throw error;
    }
  };

  const verifyEmail = async (email: string, verificationCode: string) => {
    await authService.verifyEmail(email, verificationCode);
  };

  const resendVerificationCode = async (email: string) => {
    await authService.resendVerificationCode(email);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshAuth,
    verifyEmail,
    resendVerificationCode,  // ← Добавлено здесь
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};