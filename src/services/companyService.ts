// src/services/companyService.ts
import { api } from './api'; // твой axios-instance

export const companyService = {
  // уже есть у тебя
  createCompany: async (data: any) => {
    const response = await api.post('/company/create', data);
    return response.data;
  },

  joinCompany: async (companyId: number) => {
    const response = await api.post(`/company/join/${companyId}`);
    return response.data;
  },

  enterCompany: async (companyId: number, keyFile: File) => {
    const formData = new FormData();
    formData.append('keyFile', keyFile);
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
  // Отправляем именно те имена полей, которые ожидает бэкенд
  const payload = {
    roleName: data.roleName,
    roleLevel: data.level  // ← вот здесь roleLevel, а не level!
  };
  const response = await api.put(`/company/roles/${roleId}`, payload);
  return response.data;
},

deleteRole: async (roleId: number) => {
  await api.delete(`/company/roles/${roleId}`);
},
};