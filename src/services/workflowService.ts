import { api } from './api';
import type {
  WorkflowTemplate,
  WorkflowInstance,
  TaskResponse,
  CreateWorkflowTemplateRequest,
  TaskApprovalRequest,
  BulkTaskRequest,
  BulkOperationResponse,
  WorkflowAuditLog,
  TaskActionRequest,
} from '../types/workflow';

export const workflowService = {
  // Template Management
  async createTemplate(request: CreateWorkflowTemplateRequest): Promise<WorkflowTemplate> {
    const response = await api.post<WorkflowTemplate>('/workflow/template', request);
    return response.data;
  },

  async getCompanyTemplates(companyId: number): Promise<WorkflowTemplate[]> {
    const response = await api.get<WorkflowTemplate[]>(`/workflow/company/${companyId}/templates`);
    return response.data;
  },

  async getTemplate(templateId: number): Promise<WorkflowTemplate> {
    const response = await api.get<WorkflowTemplate>(`/workflow/template/${templateId}`);
    return response.data;
  },

  async updateTemplate(templateId: number, request: Partial<WorkflowTemplate>): Promise<WorkflowTemplate> {
    const response = await api.put<WorkflowTemplate>(`/workflow/template/${templateId}`, request);
    return response.data;
  },

  async deleteTemplate(templateId: number): Promise<void> {
    await api.delete(`/workflow/template/${templateId}`);
  },

  // Workflow Execution
  async startWorkflow(templateId: number, documentId: number): Promise<WorkflowInstance> {
    const response = await api.post<WorkflowInstance>(`/workflow/${templateId}/start`, null, {
      params: { documentId }
    });
    return response.data;
  },

  async getWorkflowInstance(instanceId: number): Promise<WorkflowInstance> {
    const response = await api.get<WorkflowInstance>(`/workflow/instance/${instanceId}`);
    return response.data;
  },

  async getMyTasks(): Promise<TaskResponse[]> {
    const response = await api.get<TaskResponse[]>('/workflow/my-tasks');
    return response.data;
  },

  // Task Actions
  async approveTask(taskId: number, request: TaskApprovalRequest): Promise<TaskResponse> {
    const response = await api.post<TaskResponse>(`/workflow/task/${taskId}/approve`, request);
    return response.data;
  },

  async rejectTask(taskId: number, request: TaskApprovalRequest): Promise<TaskResponse> {
    const response = await api.post<TaskResponse>(`/workflow/task/${taskId}/reject`, request);
    return response.data;
  },

  async executeTaskAction(taskId: number, request: TaskActionRequest): Promise<TaskResponse> {
    const response = await api.post<TaskResponse>(`/workflow/task/${taskId}/execute`, request);
    return response.data;
  },

  // Bulk Operations
  async bulkApproveTasks(request: BulkTaskRequest): Promise<BulkOperationResponse> {
    const response = await api.post<BulkOperationResponse>('/workflow/tasks/bulk-approve', request);
    return response.data;
  },

  async bulkRejectTasks(request: BulkTaskRequest): Promise<BulkOperationResponse> {
    const response = await api.post<BulkOperationResponse>('/workflow/tasks/bulk-reject', request);
    return response.data;
  },

  // Audit & History
  async getWorkflowAudit(instanceId: number): Promise<WorkflowAuditLog[]> {
    const response = await api.get<WorkflowAuditLog[]>(`/workflow/instance/${instanceId}/audit`);
    return response.data;
  },

  async getDocumentTasks(documentId: number): Promise<TaskResponse[]> {
    const response = await api.get<TaskResponse[]>(`/workflow/document/${documentId}/tasks`);
    return response.data;
  },

  // Kanban & Management
  async getCompanyTasks(companyId: number): Promise<TaskResponse[]> {
    const response = await api.get<TaskResponse[]>(`/workflow/company/${companyId}/tasks`);
    return response.data;
  },

  // В файле workflowService.ts добавь:
  getCompanyDocuments: async () => {
    const response = await api.get(`/documents/user`);
    return response.data;
  },

  async assignTask(taskId: number, userId: number): Promise<TaskResponse> {
    const response = await api.post<TaskResponse>(`/workflow/task/${taskId}/assign/${userId}`);
    return response.data;
  },

  async updateTaskStatus(taskId: number, status: string): Promise<TaskResponse> {
    const response = await api.put<TaskResponse>(`/workflow/task/${taskId}/status`, null, {
      params: { status }
    });
    return response.data;
  },

  async claimTask(taskId: number): Promise<TaskResponse> {
    const response = await api.post<TaskResponse>(`/workflow/task/${taskId}/claim`);
    return response.data;
  },

  async getCompanyRoles(companyId: number): Promise<any[]> {
    const response = await api.get<any[]>(`/workflow/company/${companyId}/roles`);
    return response.data;
  },
};
