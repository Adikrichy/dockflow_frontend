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
    // Note: Backend might use /approve with a negative status or a dedicated /reject endpoint.
    // Based on WorkflowController, we have /tasks/bulk-reject but not a single reject? 
    // Wait, let me check the Controller again. 
    // Bulk endpoints exist: /tasks/bulk-approve, /tasks/bulk-reject.
    // Let's assume single reject is /task/{taskId}/reject if it's there, or we use bulk with one ID.
    const response = await api.post<TaskResponse>(`/workflow/task/${taskId}/reject`, request);
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
};
