import React, { useState } from 'react';
import {
  Container,
  Typography,
  Tabs,
  Tab,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Assignment as TaskIcon,
  Description as TemplateIcon,
  History as HistoryIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useWorkflow } from '../hooks/useWorkflow';
import { useWorkflowStore } from '../store/workflowStore';
import TaskTable from '../components/workflow/TaskTable';
import TemplateTable from '../components/workflow/TemplateTable';
import WorkflowEditor from '../components/workflow/WorkflowEditor';
import WorkflowDetails from '../components/workflow/WorkflowDetails';
import LoadingSpinner from '../components/LoadingSpinner';

const WorkflowPage: React.FC = () => {
  const { user } = useAuth();
  const { activeTab, setActiveTab, selectedTaskIds, clearSelection } = useWorkflowStore();
  const {
    useMyTasks,
    useCompanyTemplates,
    useWorkflowAudit,
    approveTaskMutation,
    bulkApproveMutation,
    createTemplateMutation
  } = useWorkflow();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [comment, setComment] = useState('');
  const [pendingActionTask, setPendingActionTask] = useState<{ id: number; action: 'approve' | 'reject' } | null>(null);

  // Data fetching
  const companyId = (user as any)?.memberships?.[0]?.companyId || (user as any)?.company?.id || 1;
  const { data: tasks, isLoading: tasksLoading } = useMyTasks();
  const { data: templates } = useCompanyTemplates(companyId);
  const { data: auditLogs, isLoading: auditLoading } = useWorkflowAudit(selectedInstanceId);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    clearSelection();
  };

  const handleApproveClick = (task: any) => {
    setPendingActionTask({ id: task.id, action: 'approve' });
    setComment('');
  };

  const handleRejectClick = (task: any) => {
    setPendingActionTask({ id: task.id, action: 'reject' });
    setComment('');
  };

  const confirmAction = () => {
    if (!pendingActionTask) return;

    approveTaskMutation.mutate(
      { taskId: pendingActionTask.id, request: { comment } },
      { onSuccess: () => setPendingActionTask(null) }
    );
  };

  const handleBulkApprove = () => {
    bulkApproveMutation.mutate({ taskIds: selectedTaskIds, comment }, {
      onSuccess: () => {
        clearSelection();
        setComment('');
      }
    });
  };

  const handleCreateTemplate = (data: any) => {
    const companyId = (user as any)?.memberships?.[0]?.companyId || (user as any)?.company?.id || 1;
    createTemplateMutation.mutate(
      { ...data, companyId },
      { onSuccess: () => setIsEditorOpen(false) }
    );
  };

  const handleStartWorkflow = (template: any) => {
    console.log('Start workflow for', template.id);
    // This usually opens a modal to select a document
  };

  const handleViewXml = (template: any) => {
    setSelectedTemplate(template);
  };

  const handleDeleteTemplate = (template: any) => {
    // Implement delete mutation in useWorkflow
    console.log('Delete template', template.id);
  };

  const handleViewAudit = (instanceId: number) => {
    setSelectedInstanceId(instanceId);
    setIsDetailsOpen(true);
  };

  // Roles verification (role >= 60 for management)
  const roleLevel = (user as any)?.memberships?.[0]?.roleLevel || (user as any)?.role?.level || 0;
  const canManageTemplates = roleLevel >= 60;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Workflow Management
        </Typography>
        {activeTab === 1 && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsEditorOpen(true)}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#3b82f6',
              '&:hover': { bgcolor: '#2563eb' }
            }}
          >
            New Template
          </Button>
        )}
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="workflow tabs">
          <Tab icon={<TaskIcon />} label="My Tasks" iconPosition="start" />
          <Tab icon={<TemplateIcon />} label="Templates" iconPosition="start" />
          <Tab icon={<HistoryIcon />} label="History" iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tables based on tabs */}
      {activeTab === 0 && (
        <Box>
          {selectedTaskIds.length > 0 && (
            <Alert
              severity="info"
              sx={{ mb: 2 }}
              action={
                <Button color="inherit" size="small" onClick={handleBulkApprove}>
                  Bulk Approve
                </Button>
              }
            >
              {selectedTaskIds.length} tasks selected for bulk action.
            </Alert>
          )}
          <TaskTable
            tasks={tasks || []}
            onApprove={handleApproveClick}
            onReject={handleRejectClick}
            onViewDocument={(id) => console.log('View doc', id)}
          />
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <TemplateTable
            templates={templates || []}
            onStartWorkflow={handleStartWorkflow}
            onViewXml={handleViewXml}
            onDelete={handleDeleteTemplate}
            canManage={canManageTemplates}
          />
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Typography color="textSecondary" sx={{ mb: 2 }}>
            Workflow instance history. (Search and pagination to be added)
          </Typography>
          {/* Example of how to trigger history details */}
          <Button variant="outlined" onClick={() => handleViewAudit(1)}>
            View Sample Audit Log
          </Button>
        </Box>
      )}

      {/* Modals and Dialogs */}
      <Dialog open={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>
          Workflow Details & Audit Log
          <IconButton
            onClick={() => setIsDetailsOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <WorkflowDetails auditLogs={auditLogs || []} isLoading={auditLoading} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!selectedTemplate} onClose={() => setSelectedTemplate(null)} fullWidth maxWidth="md">
        <DialogTitle>
          Template XML: {selectedTemplate?.name}
          <IconButton
            onClick={() => setSelectedTemplate(null)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '16px', overflow: 'auto' }}>
            {selectedTemplate?.stepsXml}
          </pre>
        </DialogContent>
      </Dialog>
      <Dialog open={!!pendingActionTask} onClose={() => setPendingActionTask(null)} fullWidth maxWidth="xs">
        <DialogTitle>
          {pendingActionTask?.action === 'approve' ? 'Approve Task' : 'Reject Task'}
          <IconButton
            onClick={() => setPendingActionTask(null)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Comment (Optional)"
            fullWidth
            multiline
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingActionTask(null)}>Cancel</Button>
          <Button
            onClick={confirmAction}
            variant="contained"
            color={pendingActionTask?.action === 'approve' ? 'success' : 'error'}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isEditorOpen} onClose={() => setIsEditorOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Create New Workflow Template</DialogTitle>
        <DialogContent>
          <WorkflowEditor
            onSave={handleCreateTemplate}
            isLoading={createTemplateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {tasksLoading && <LoadingSpinner />}
    </Container>
  );
};

export default WorkflowPage;
