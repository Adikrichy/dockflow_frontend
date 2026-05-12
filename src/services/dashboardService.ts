import { api } from './api';

export interface DashboardStats {
  totalDocuments: number;
  activeWorkflows: number;
  pendingTasks: number;
}

export interface DashboardActivity {
  id: number;
  actionType: string;
  description: string;
  performedBy: string;
  createdAt: string;
  documentName: string;
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getActivities: async (): Promise<DashboardActivity[]> => {
    const response = await api.get('/dashboard/activities');
    return response.data;
  }
};
