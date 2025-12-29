import { api } from './api';
import type {
  WorkflowTemplate,
  WorkflowInstance,
  WorkflowTask,
  CreateWorkflowTemplateRequest,
  TaskActionRequest,
  BulkTaskActionRequest,
  WorkflowAuditEntry
} from '../types/workflow';

export const workflowService = {
  // Template Management
  async createTemplate(request: CreateWorkflowTemplateRequest): Promise<WorkflowTemplate> {
    const response = await api.post('/workflow/template', request);
    return response.data;
  },

  async getCompanyTemplates(companyId: number): Promise<WorkflowTemplate[]> {
    const response = await api.get(`/workflow/company/${companyId}/templates`);
    return response.data;
  },

  async getTemplate(templateId: number): Promise<WorkflowTemplate> {
    const response = await api.get(`/workflow/template/${templateId}`);
    return response.data;
  },

  // Workflow Execution
  async startWorkflow(templateId: number, documentId: number): Promise<WorkflowInstance> {
    const response = await api.post(`/workflow/${templateId}/start?documentId=${documentId}`);
    return response.data;
  },

  async getWorkflowInstance(workflowId: number): Promise<WorkflowInstance> {
    const response = await api.get(`/workflow/instance/${workflowId}`);
    return response.data;
  },

  async getMyTasks(): Promise<WorkflowTask[]> {
    const response = await api.get('/workflow/my-tasks');
    return response.data;
  },

  // Task Actions
  async approveTask(taskId: number, request: TaskActionRequest = {}): Promise<void> {
    await api.post(`/workflow/task/${taskId}/approve`, request);
  },

  async rejectTask(taskId: number, request: TaskActionRequest): Promise<void> {
    await api.post(`/workflow/task/${taskId}/reject`, request);
  },

  // Bulk Operations
  async bulkApproveTasks(request: BulkTaskActionRequest): Promise<void> {
    await api.post('/workflow/tasks/bulk-approve', request);
  },

  async bulkRejectTasks(request: BulkTaskActionRequest): Promise<void> {
    await api.post('/workflow/tasks/bulk-reject', request);
  },

  // Audit & History
  async getWorkflowAudit(workflowId: number): Promise<WorkflowAuditEntry[]> {
    const response = await api.get(`/workflow/instance/${workflowId}/audit`);
    return response.data;
  },

  async getDocumentTasks(documentId: number): Promise<WorkflowTask[]> {
    const response = await api.get(`/workflow/document/${documentId}/tasks`);
    return response.data;
  },
};
