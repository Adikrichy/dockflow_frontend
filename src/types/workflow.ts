export interface WorkflowTemplate {
  id: number;
  name: string;
  companyId: number;
  workflowXml: string;
  createdBy: number;
  createdAt: string;
  isActive: boolean;
}

export interface WorkflowInstance {
  id: number;
  templateId: number;
  documentId: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startedAt: string;
  completedAt?: string;
  currentStep: number;
}

export interface WorkflowTask {
  id: number;
  workflowInstanceId: number;
  stepOrder: number;
  requiredRoleName: string;
  requiredRoleLevel: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
  assignedAt: string;
  completedAt?: string;
  assignedTo?: number;
  comment?: string;
  document: {
    id: number;
    filename: string;
    amount?: number;
    priority?: string;
  };
}

export interface CreateWorkflowTemplateRequest {
  name: string;
  companyId: number;
  workflowXml: string;
}

export interface TaskActionRequest {
  comment?: string;
}

export interface BulkTaskActionRequest {
  taskIds: number[];
  comment?: string;
}

export interface WorkflowAuditEntry {
  id: number;
  workflowInstanceId: number;
  taskId?: number;
  action: string;
  userId: number;
  userName: string;
  timestamp: string;
  details?: string;
}
