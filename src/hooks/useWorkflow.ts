import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowService } from '../services/workflowService';
import { toast } from 'react-toastify';
import type {
    CreateWorkflowTemplateRequest,
    TaskApprovalRequest,
    BulkTaskRequest,
} from '../types/workflow';

export const useWorkflow = () => {
    const queryClient = useQueryClient();

    // Queries
    const useMyTasks = () => useQuery({
        queryKey: ['workflow', 'my-tasks'],
        queryFn: () => workflowService.getMyTasks(),
    });

    const useCompanyTemplates = (companyId: number | null) => useQuery({
        queryKey: ['workflow', 'templates', companyId],
        queryFn: () => workflowService.getCompanyTemplates(companyId!),
        enabled: !!companyId,
    });

    const useWorkflowAudit = (instanceId: number | null) => useQuery({
        queryKey: ['workflow', 'audit', instanceId],
        queryFn: () => workflowService.getWorkflowAudit(instanceId!),
        enabled: !!instanceId,
    });

    const useCompanyTasks = (companyId: number | null) => useQuery({
        queryKey: ['workflow', 'tasks', 'company', companyId],
        queryFn: () => workflowService.getCompanyTasks(companyId!),
        enabled: !!companyId,
    });

    // Mutations
    const approveTaskMutation = useMutation({
        mutationFn: ({ taskId, request }: { taskId: number; request: TaskApprovalRequest }) =>
            workflowService.approveTask(taskId, request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow', 'my-tasks'] });
            toast.success('Task approved successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to approve task');
        },
    });

    const rejectTaskMutation = useMutation({
        mutationFn: ({ taskId, request }: { taskId: number; request: TaskApprovalRequest }) =>
            workflowService.rejectTask(taskId, request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow', 'my-tasks'] });
            toast.success('Task rejected successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to reject task');
        },
    });

    const bulkApproveMutation = useMutation({
        mutationFn: (request: BulkTaskRequest) => workflowService.bulkApproveTasks(request),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['workflow', 'my-tasks'] });
            toast.success(`Successfully approved ${response.successCount} tasks`);
            if (response.failureCount > 0) {
                toast.warning(`${response.failureCount} tasks failed to approve`);
            }
        },
        onError: () => {
            toast.error('Bulk approval failed');
        },
    });

    const createTemplateMutation = useMutation({
        mutationFn: (request: CreateWorkflowTemplateRequest) =>
            workflowService.createTemplate(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow', 'templates'] });
            toast.success('Workflow template created');
        },
        onError: () => {
            toast.error('Failed to create template');
        },
    });

    const assignTaskMutation = useMutation({
        mutationFn: ({ taskId, userId }: { taskId: number; userId: number }) =>
            workflowService.assignTask(taskId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow', 'tasks'] });
            toast.success('Task assigned successfully');
        },
        onError: () => {
            toast.error('Failed to assign task');
        },
    });

    // В раздел Queries (после других useQuery хуков)
    const useCompanyDocuments = () => useQuery({
        queryKey: ['companyDocuments'],
        queryFn: () => workflowService.getCompanyDocuments(),
    });


    const updateTaskStatusMutation = useMutation({
        mutationFn: ({ taskId, status }: { taskId: number; status: string }) =>
            workflowService.updateTaskStatus(taskId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow', 'tasks'] });
            toast.success('Task status updated');
        },
        onError: () => {
            toast.error('Failed to update task status');
        },
    });

    return {
        useMyTasks,
        useCompanyTemplates,
        useWorkflowAudit,
        useCompanyTasks,
        approveTaskMutation,
        rejectTaskMutation,
        bulkApproveMutation,
        createTemplateMutation,
        assignTaskMutation,
        updateTaskStatusMutation,
        useCompanyDocuments
    };
};
