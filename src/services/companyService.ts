// src/services/companyService.ts
import { api } from './api'; // твой axios-instance

export const companyService = {
  createCompany: async (data: any): Promise<{
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

  joinCompany: async (companyId: number): Promise<{
    keyFile: Blob;
  }> => {
    // CRITICAL: Must use responseType: 'blob' for binary p12 files
    const response = await api.post(`/company/join/${companyId}`, null, {
      responseType: 'blob'
    });
    return {
      keyFile: response.data
    };
  },

  enterCompany: async (companyId: number, keyFile: File) => {
    const formData = new FormData();
    formData.append('keyFile', keyFile);
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

  createRole: async (data: { roleName: string; level: number }) => {
    const response = await api.post('/company/roles', data);
    return response.data;
  },

  updateRole: async (roleId: number, data: { roleName: string; level: number }) => {
    const payload = {
      roleName: data.roleName,
      roleLevel: data.level
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