// src/services/companyService.ts
import { api } from './api'; // твой axios-instance

export const companyService = {
  createCompany: async (data: { 
    name: string; 
    description: string; 
    useDefaultRoles: boolean; 
    preferredEditor: string;
    p12Password: string;
  }): Promise<{
    company: any;
    keyFile: Blob;
  }> => {
    const response = await api.post('/company/create', data);
    const createResponse = response.data;

    // Convert base64 key file to Blob
    const keyFileBase64 = createResponse.keyFileBase64;
    if (!keyFileBase64) {
      throw new Error('Key file not found in response');
    }

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

  updateCompany: async (companyId: number, data: any): Promise<any> => {
    const response = await api.patch(`/company/${companyId}`, data);
    return response.data;
  },

  inviteMember: async (companyId: number, data: { email: string; roleId: number; channel: 'EMAIL' | 'TELEGRAM' }) => {
    const response = await api.post(`/company/${companyId}/invite`, data);
    return response.data;
  },

  acceptInvite: async (data: { token: string; keyPassword: string }): Promise<Blob> => {
    const response = await api.post('/company/accept-invite', data, {
      responseType: 'blob'
    });
    return response.data;
  },

  enterCompany: async (companyId: number, keyFile: File, password: string) => {
    const formData = new FormData();
    formData.append('keyFile', keyFile);
    formData.append('password', password);
    // Use the synchronized URL
    const response = await api.post(`/company/enter/${companyId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  exitCompany: async () => {
    await api.post('/company/exit');
  },

  getAllRoles: async () => {
    const response = await api.get('/company/getAllRoles');
    return response.data;
  },

  getCompanyMembers: async () => {
    const response = await api.get('/company/members');
    return response.data;
  },

  createRole: async (data: { roleName: string; level: number; canViewReports: boolean }) => {
    const response = await api.post('/company/roles', data);
    return response.data;
  },

  updateRole: async (roleId: number, data: { roleName: string; level: number; canViewReports: boolean }) => {
    const payload = {
      roleName: data.roleName,
      roleLevel: data.level,
      canViewReports: data.canViewReports
    };
    const response = await api.put(`/company/roles/${roleId}`, payload);
    return response.data;
  },

  deleteRole: async (roleId: number) => {
    await api.delete(`/company/roles/${roleId}`);
  },

  getCurrentCompany: async () => {
    const response = await api.get('/company/current');
    return response.data;
  },

  listCompanies: async () => {
    const response = await api.get('/company/list');
    return response.data;
  },

  searchCompanies: async (name: string) => {
    const response = await api.get('/company/search', { params: { name } });
    return response.data;
  },

  updateMemberRole: async (userId: number, roleId: number) => {
    await api.put(`/company/members/${userId}/role`, { userId, roleId });
  }
};