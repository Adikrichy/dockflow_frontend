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
  templateId?: number;
  stepOrder: number;
  requiredRoleName: string;
  requiredRoleLevel: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'OVERDUE' | 'DELEGATED' | 'CHANGES_REQUESTED' | 'ON_HOLD';
  availableActions?: string[];
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
  description?: string;
  stepsXml: string;
  companyId: number;
  allowedRoleLevels?: number[]; // ← добавь это
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

export interface WorkflowTask {
  id: number;
  stepOrder: number;
  requiredRoleName: string;
  requiredRoleLevel: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'OVERDUE' | 'DELEGATED' | 'CHANGES_REQUESTED' | 'ON_HOLD';
  availableActions?: string[];
  assignedTo?: {
    id: number;
    email: string;
    fullName?: string;
  };
  comment?: string;
  createdAt: string;
  completedAt?: string;
  completedByName?: string;
  document: {
    id: number;
    filename: string;
    amount?: number;
  };
  workflowInstanceId: number;
}
export interface TaskActionRequest {
  actionType: 'DELEGATE' | 'REQUEST_CHANGES' | 'HOLD';
  comment?: string;
  targetUserId?: number;
}
