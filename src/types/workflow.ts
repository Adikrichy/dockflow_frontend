export interface WorkflowTemplate {
  id: number;
  name: string;
  description: string;
  stepsXml: string;
  companyId: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskResponse {
  id: number;
  stepOrder: number;
  requiredRoleName: string;
  requiredRoleLevel: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'OVERDUE';
  assignedTo?: {
    id: number;
    email: string;
    fullName?: string;
  };
  comment?: string;
  createdAt: string;
  completedAt?: string;
  completedByName?: string;
  // Added for UI needs (based on WorkflowPage usage)
  document: {
    id: number;
    filename: string;
    amount?: number;
  };
  workflowInstanceId: number;
}

export interface WorkflowInstance {
  id: number;
  documentId: number;
  templateId: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  startedAt: string;
  completedAt?: string;
  initiatedByName: string;
  tasks: TaskResponse[];
}

export interface WorkflowAuditLog {
  id: number;
  actionType: string;
  description: string;
  performedBy: string; // email
  createdAt: string;
  metadata?: string;
  ipAddress?: string;
}

export interface CreateWorkflowTemplateRequest {
  name: string;
  description: string;
  stepsXml: string;
  companyId: number;
}

export interface TaskApprovalRequest {
  comment?: string;
}

export interface BulkTaskRequest {
  taskIds: number[];
  comment?: string;
}

export interface BulkOperationResponse {
  successCount: number;
  failureCount: number;
  results: Record<number, string>; // mapping taskId to status/error
}
