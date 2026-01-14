import { api } from './api';
import type { ReportData, ReportFilters } from '../types/reports';

export const reportsService = {
  async getReportData(filters: ReportFilters): Promise<ReportData> {
    const response = await api.get<ReportData>('/reports/summary', { params: filters });
    return response.data;
  },

  async getWeeklyActivity(timeRange: string): Promise<any[]> {
    const response = await api.get<any[]>('/reports/weekly', { params: { timeRange } });
    return response.data;
  },

  async getUserActivity(timeRange: string): Promise<any[]> {
    const response = await api.get<any[]>('/reports/user-activity', { params: { timeRange } });
    return response.data;
  },

  async getDocumentTypes(timeRange: string): Promise<any[]> {
    const response = await api.get<any[]>('/reports/document-types', { params: { timeRange } });
    return response.data;
  },

  async exportReport(filters: ReportFilters, format: string): Promise<Blob> {
    const response = await api.get('/reports/export', {
      params: { ...filters, format },
      responseType: 'blob'
    });
    return response.data;
  },

  async saveReport(name: string, filters: ReportFilters): Promise<{ id: string, message: string }> {
    const response = await api.post<{ id: string, message: string }>('/reports/save', { name, ...filters });
    return response.data;
  },

  async getSavedReports(): Promise<any[]> {
    const response = await api.get<any[]>('/reports/saved');
    return response.data;
  },

  async getDashboardStats(): Promise<any> {
    const response = await api.get<any>('/reports/dashboard-stats');
    return response.data;
  }
};
