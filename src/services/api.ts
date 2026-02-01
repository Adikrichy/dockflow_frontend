import axios from 'axios';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

// Base API configuration
const API_BASE_URL = 'http://localhost:8080/api';

export interface ChatChannelResponse {
  id: number;
  name: string;
  description?: string;
  companyId: number;
  isPublic: boolean;
  createdAt: string;
}

export const chatService = {
  getCompanyChannels: async (companyId: number): Promise<ChatChannelResponse[]> => {
    const response = await api.get(`/chat/company/${companyId}/channels`);
    return response.data;
  },

  getChannel: async (channelId: number): Promise<ChatChannelResponse & { messages: any[] }> => {
    const response = await api.get(`/chat/channel/${channelId}`);
    return response.data;
  },

  createChannel: async (companyId: number, name: string, description?: string): Promise<ChatChannelResponse> => {
    const response = await api.post(`/chat/company/${companyId}/channels`, null, {
      params: { name, description }
    });
    return response.data;
  },

  getUserDMs: async (): Promise<ChatChannelResponse[]> => {
    const response = await api.get('/chat/dms');
    return response.data;
  },

  startDM: async (targetUserId: number): Promise<ChatChannelResponse> => {
    const response = await api.post(`/chat/dm/${targetUserId}`);
    return response.data;
  },

  getAiUser: async (): Promise<any> => {
    const response = await api.get('/chat/ai');
    return response.data;
  }
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (optional, but good to have)
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    // Prevent redirect loop for auth endpoints
    if (error.response?.status === 401 &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')) {
      //window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    console.log('Login response:', response.data);
    return response.data;
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post('/register', userData);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getMyContext() {
    const response = await api.get('/auth/me');
    return response.data; // { user, companies, currentCompany }
  },

  async refresh(): Promise<AuthResponse> {
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  async verifyEmail(email: string, verificationCode: string): Promise<void> {
    await api.post('/auth/verify-email', null, {
      params: {
        email,
        verificationCode,
      },
    });
  },

  async resendVerificationCode(email: string): Promise<void> {
    await api.post('/auth/resend-verification-code', null, { params: { email } });
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', { token, newPassword });
  },

  async updateRole(roleId: number, data: { roleName: string; level: number }) {
    const response = await api.put(`/company/roles/${roleId}`, data);
    return response.data;
  },

  async deleteRole(roleId: number) {
    const response = await api.delete(`/company/roles/${roleId}`);
    return response.data;
  },
};



