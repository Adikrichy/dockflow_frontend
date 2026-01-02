import axios from 'axios';
import type { LoginRequest, RegisterRequest, AuthResponse, Company, CreateCompanyRequest, Role } from '../types/auth';

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
      window.location.href = '/login';
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
};

export const companyService = {
  async createCompany(companyData: CreateCompanyRequest): Promise<{
    company: Company;
    keyFile: Blob;
  }> {
    const response = await api.post('/company/create', companyData);

    // Response now contains CreateCompanyResponse with company and keyFileBase64
    const createResponse = response.data;
    
    // Convert base64 key file to Blob
    const keyFileBase64 = createResponse.keyFileBase64;
    if (!keyFileBase64) {
      throw new Error('Key file not found in response');
    }

    // Convert base64 string to Blob
    const byteCharacters = atob(keyFileBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const keyFile = new Blob([byteArray], { type: 'application/x-pkcs12' });

    return {
      company: createResponse.company,
      keyFile: keyFile
    };
  },

  async getAllRoles(): Promise<Role[]> {
    const response = await api.get('/company/getAllRoles');
    return response.data;
  },

  async getCurrentCompany(): Promise<Company | null> {
    try {
      const response = await api.get('/company/current');
      return response.data;
    } catch (error) {
      return null;
    }
  },

  async enterCompany(companyId: number, keyFile: File): Promise<void> {
    const formData = new FormData();
    formData.append('keyFile', keyFile);

    await api.post(`/company/${companyId}/enter`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async joinCompany(companyId: number): Promise<{
    keyFile: Blob;
  }> {
    const response = await api.post(`/company/join/${companyId}`, null, {
      responseType: 'blob'
    });
    return {
      keyFile: response.data
    };
  },

  async exitCompany(): Promise<void> {
    await api.post('/company/exit');
  },

  async getCompanyMembers(): Promise<any[]> {
    const response = await api.get('/company/members');
    return response.data;
  }
};