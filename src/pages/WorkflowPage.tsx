import React, { useState, useMemo } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
} from '@mui/material';
import {
  Assignment as TaskIcon,
  Description as TemplateIcon,
  History as HistoryIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useWorkflow } from '../hooks/useWorkflow';
import { useWorkflowStore } from '../store/workflowStore';
import { useCompanyRoles } from '../services/companyRolesService';
import TaskTable from '../components/workflow/TaskTable';
import TemplateTable from '../components/workflow/TemplateTable';
import WorkflowEditor from '../components/workflow/WorkflowEditor';
import WorkflowDetails from '../components/workflow/WorkflowDetails';
import LoadingSpinner from '../components/LoadingSpinner';
import { useWorkflowSocket } from '../hooks/useWorkflowSocket';
import { format } from 'date-fns';
import { documentService } from '../services/documentService';

const WorkflowPage: React.FC = () => {
  const { user, currentCompany } = useAuth();
  const { activeTab, setActiveTab, selectedTaskIds, clearSelection } = useWorkflowStore();
  const {
    useMyTasks,
    useCompanyTemplates,
    useWorkflowAudit,
    approveTaskMutation,
    rejectTaskMutation,
    bulkApproveMutation,
    createTemplateMutation,
    updateTemplateMutation,
    deleteTemplateMutation,
    useCompanyDocuments,
    claimTaskMutation,
  } = useWorkflow();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);
  const [selectedInstanceId] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [selectedTemplateForAccess, setSelectedTemplateForAccess] = useState<any | null>(null);
  const [comment, setComment] = useState('');
  const [pendingActionTask, setPendingActionTask] = useState<{ id: number; action: 'approve' | 'reject' } | null>(null);

  // Preview States
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // ✅ Состояния для выбора документа
  const [isDocumentSelectorOpen, setIsDocumentSelectorOpen] = useState(false);
  const [selectedTemplateForStart, setSelectedTemplateForStart] = useState<any | null>(null);
  const [documentSearchTerm, setDocumentSearchTerm] = useState('');

  // ✅ Состояние для управления уровнями доступа
  const [allowedRoleLevels, setAllowedRoleLevels] = useState<number[]>([]);

  // Data fetching
  const companyId = (user as any)?.memberships?.[0]?.companyId || (user as any)?.company?.id || 1;
  useWorkflowSocket(companyId);
  const { data: tasks, isLoading: tasksLoading } = useMyTasks();
  const { data: templates } = useCompanyTemplates(companyId);
  const { data: auditLogs, isLoading: auditLoading } = useWorkflowAudit(selectedInstanceId);

  // ✅ Загрузка документов компании
  const { data: documents, isLoading: documentsLoading } = useCompanyDocuments();

  // ✅ Загрузка ролей компании
  const { data: roles = [], isLoading: rolesLoading } = useCompanyRoles();

  // ✅ Фильтрация документов по названию файла
  const filteredDocuments = useMemo(() => {
    if (!documents || documents.length === 0) return [];

    return documents.filter((doc: any) =>
      doc.originalFilename && doc.originalFilename.toLowerCase().includes(documentSearchTerm.toLowerCase())
    );
  }, [documents, documentSearchTerm]);

  const canManageTemplates = useMemo(() => {
    // User can manage templates if they are manager or above (level 60+)
    const roleLevel = currentCompany?.roleLevel
      || (user as any)?.memberships?.[0]?.roleLevel
      || (user as any)?.role?.level
      || 0;
    return roleLevel >= 60;
  }, [currentCompany, user]);

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

  const handleClaimTask = (taskId: number) => {
    claimTaskMutation.mutate(taskId);
  };

  const confirmAction = () => {
    if (!pendingActionTask) return;

    if (pendingActionTask.action === 'approve') {
      approveTaskMutation.mutate(
        { taskId: pendingActionTask.id, request: { comment } },
        { onSuccess: () => setPendingActionTask(null) }
      );
    } else if (pendingActionTask.action === 'reject') {
      rejectTaskMutation.mutate(
        { taskId: pendingActionTask.id, request: { comment } },
        { onSuccess: () => setPendingActionTask(null) }
      );
    }
  };

  const handleBulkApprove = () => {
    bulkApproveMutation.mutate({ taskIds: selectedTaskIds, comment }, {
      onSuccess: () => {
        clearSelection();
        setComment('');
      }
    });
  };

  const handleSaveTemplate = (data: any) => {
    const companyId = (user as any)?.memberships?.[0]?.companyId || (user as any)?.company?.id || 1;

    if (editingTemplate) {
      updateTemplateMutation.mutate(
        {
          templateId: editingTemplate.id,
          request: {
            ...data,
            allowedRoleLevels: data.allowedRoleLevels || []
          }
        },
        {
          onSuccess: () => {
            setIsEditorOpen(false);
            setEditingTemplate(null);
          }
        }
      );
    } else {
      createTemplateMutation.mutate(
        {
          ...data,
          companyId,
          allowedRoleLevels: data.allowedRoleLevels || []
        },
        { onSuccess: () => setIsEditorOpen(false) }
      );
    }
  };

  // ✅ Новая функция для запуска workflow
  const handleStartWorkflow = (template: any) => {
    setSelectedTemplateForStart(template);
    setIsDocumentSelectorOpen(true);
  };

  // ✅ Функция для выбора документа и запуска workflow
  const handleDocumentSelect = async (document: any) => {
    if (!selectedTemplateForStart) return;

    try {
      const response = await fetch(`/api/workflow/${selectedTemplateForStart.id}/start?documentId=${document.id}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Workflow successfully started! Instance ID: ${data.id}`);
        setIsDocumentSelectorOpen(false);
        setSelectedTemplateForStart(null);
        setDocumentSearchTerm('');
      } else {
        const error = await response.text();
        alert('Start error: ' + error);
      }
    } catch (err) {
      console.error(err);
      alert('Network error starting workflow');
    }
  };

  const handleViewXml = (template: any) => {
    setSelectedTemplate(template);
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setIsEditorOpen(true);
  };

  const handleManageAccess = (template: any) => {
    setSelectedTemplateForAccess(template);
    setIsAccessDialogOpen(true);
    // Initialize with existing levels, ensuring CEO (100) is included
    const existingLevels = template.allowedRoleLevels || [100];
    if (!existingLevels.includes(100)) {
      existingLevels.push(100);
    }
    setAllowedRoleLevels(existingLevels);
  };

  const handleDeleteTemplate = (template: any) => {
    deleteTemplateMutation.mutate(template.id);
  };

  // ✅ Закрытие модалки выбора документа
  const handleCloseDocumentSelector = () => {
    setIsDocumentSelectorOpen(false);
    setSelectedTemplateForStart(null);
    setDocumentSearchTerm('');
  };

  // ✅ Функция для сохранения настроек доступа
  const handleSaveAccessSettings = () => {
    if (!selectedTemplateForAccess) return;

    updateTemplateMutation.mutate(
      {
        templateId: selectedTemplateForAccess.id,
        request: {
          allowedRoleLevels: allowedRoleLevels.includes(100) ? allowedRoleLevels : [...allowedRoleLevels, 100]
        }
      },
      {
        onSuccess: () => {
          setIsAccessDialogOpen(false);
          setSelectedTemplateForAccess(null);
          setAllowedRoleLevels([]);
        }
      }
    );
  };

  // ✅ Закрытие модалки управления доступом
  const handleCloseAccessDialog = () => {
    setIsAccessDialogOpen(false);
    setSelectedTemplateForAccess(null);
    setAllowedRoleLevels([]);
  };

  // ✅ Обработка просмотра документа
  const handleViewDocument = async (documentId: number) => {
    try {
      setIsPreviewLoading(true);
      // Find the document filename for the title
      const task = tasks?.find(t => t.document?.id === documentId);
      setPreviewTitle(task?.document?.filename || 'Document Preview');
      setIsPreviewOpen(true);

      const blob = await documentService.getDocumentFile(documentId);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      console.error('Error fetching document for preview:', err);
      alert('Failed to load document preview');
      setIsPreviewOpen(false);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setIsPreviewOpen(false);
    setPreviewTitle('');
  };



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
            onViewDocument={handleViewDocument}
            onClaim={handleClaimTask}
          />
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <TemplateTable
            templates={templates || []}
            onStartWorkflow={handleStartWorkflow}
            onViewXml={handleViewXml}
            onEdit={handleEditTemplate}
            onDelete={handleDeleteTemplate}
            onManageAccess={handleManageAccess}
            canManage={canManageTemplates}
          />
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Typography color="textSecondary" sx={{ mb: 2 }}>
            Workflow instance history. (Search and pagination to be added)
          </Typography>
        </Box>
      )}

      {/* ✅ Модалка для выбора документа */}
      <Dialog
        open={isDocumentSelectorOpen}
        onClose={handleCloseDocumentSelector}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            maxHeight: '80vh',
          }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              Select a document to start workflow
            </Typography>
            <IconButton
              aria-label="close"
              onClick={handleCloseDocumentSelector}
              sx={{
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Template: <strong>{selectedTemplateForStart?.name}</strong>
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          <Box sx={{ p: 3, pb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search by filename..."
              value={documentSearchTerm}
              onChange={(e) => setDocumentSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="medium"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                }
              }}
            />
          </Box>

          {documentsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredDocuments.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography color="textSecondary">
                {documents.length === 0
                  ? 'No documents found'
                  : 'No documents match your search'}
              </Typography>
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                maxHeight: '400px',
                borderTop: 1,
                borderColor: 'divider',
              }}
            >
              <Table stickyHeader size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper' }}>
                      Filename
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper', width: '200px' }}>
                      Created At
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper', width: '120px' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDocuments.map((document: any) => (
                    <TableRow
                      key={document.id}
                      hover
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                    >
                      <TableCell sx={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <Typography variant="body2" noWrap>
                          {document.originalFilename || 'No name'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {document.createdAt ? format(new Date(document.createdAt), 'MMM dd, yyyy HH:mm') : 'No date'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<CheckIcon />}
                          onClick={() => handleDocumentSelect(document)}
                          sx={{
                            textTransform: 'none',
                            borderRadius: '6px',
                            fontWeight: 500,
                            bgcolor: '#10b981',
                            '&:hover': { bgcolor: '#059669' }
                          }}
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 1.5 }}>
          <Button
            onClick={handleCloseDocumentSelector}
            sx={{ textTransform: 'none', fontWeight: 500 }}
          >
            Cancel
          </Button>
          <Typography variant="body2" color="textSecondary" sx={{ ml: 2, mr: 'auto' }}>
            Found: {filteredDocuments.length} of {documents ? documents.length : 0}
          </Typography>

        </DialogActions>
      </Dialog>

      {/* Остальные модалки (без изменений) */}
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

      <Dialog
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        fullScreen
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Create New Workflow Template
          <IconButton
            aria-label="close"
            onClick={() => {
              setIsEditorOpen(false);
              setEditingTemplate(null);
            }}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <WorkflowEditor
            initialName={editingTemplate?.name}
            initialDescription={editingTemplate?.description}
            initialXml={editingTemplate?.stepsXml}
            initialAllowedRoleLevels={editingTemplate?.allowedRoleLevels}
            onSave={handleSaveTemplate}
            isLoading={createTemplateMutation.isPending || updateTemplateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAccessDialogOpen}
        onClose={handleCloseAccessDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Manage Template Access
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
              Template: <Box component="span" sx={{ color: '#3b82f6', fontWeight: 600 }}>{selectedTemplateForAccess?.name}</Box>
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseAccessDialog}
            sx={{
              color: (theme) => theme.palette.grey[400],
              '&:hover': { color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.05)' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 2 }}>
          <Typography variant="body2" sx={{ mb: 3, color: '#64748b' }}>
            Select roles allowed to start this workflow. Users with these roles (or higher) will be able to initiate this process.
          </Typography>

          {rolesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} thickness={4} sx={{ color: '#3b82f6' }} />
            </Box>
          ) : (
            <FormControl fullWidth variant="outlined">
              <InputLabel id="allowed-roles-label" sx={{ bgcolor: 'white', px: 1 }}>Allowed Roles</InputLabel>
              <Select
                labelId="allowed-roles-label"
                multiple
                value={allowedRoleLevels}
                onChange={(e) => {
                  const val = e.target.value as number[];
                  // Ensure CEO (100) is always present
                  const newVal = val.includes(100) ? val : [...val, 100];
                  setAllowedRoleLevels(newVal);
                }}
                input={<OutlinedInput label="Allowed Roles" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, py: 0.5 }}>
                    {(selected as number[]).sort((a, b) => b - a).map((level) => {
                      const role = roles.find(r => r.level === level);
                      const isCEO = level === 100;
                      return (
                        <Chip
                          key={level}
                          label={role ? `${role.name} (L${level})` : `L${level}`}
                          size="small"
                          sx={{
                            borderRadius: '6px',
                            fontWeight: 600,
                            bgcolor: isCEO ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                            color: isCEO ? '#3b82f6' : '#475569',
                            border: isCEO ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
                            '& .MuiChip-label': { px: 1.5 }
                          }}
                        />
                      );
                    })}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 300,
                      mt: 1,
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      '& .MuiMenuItem-root': {
                        py: 1.5,
                        px: 2,
                        '&.Mui-selected': { bgcolor: 'rgba(59, 130, 246, 0.08)' },
                        '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.04)' }
                      }
                    }
                  }
                }}
              >
                {roles.map((role) => (
                  <MenuItem
                    key={role.id}
                    value={role.level}
                    disabled={role.level === 100} // Cannot deselect CEO
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {role.name}
                      </Typography>
                      <Chip
                        label={`L${role.level}`}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          bgcolor: role.level === 100 ? '#3b82f6' : 'rgba(0,0,0,0.05)',
                          color: role.level === 100 ? 'white' : '#64748b'
                        }}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Alert
            severity="info"
            sx={{
              mt: 3,
              borderRadius: '10px',
              bgcolor: 'rgba(59, 130, 246, 0.05)',
              color: '#1e40af',
              border: '1px solid rgba(59, 130, 246, 0.1)',
              '& .MuiAlert-icon': { color: '#3b82f6' }
            }}
          >
            Role Level 100 (CEO) always has access to start workflows in their company.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={handleCloseAccessDialog}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#64748b' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveAccessSettings}
            variant="contained"
            disableElevation
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              borderRadius: '8px',
              bgcolor: '#3b82f6',
              '&:hover': { bgcolor: '#2563eb' }
            }}
          >
            Save Access Level
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog
        open={isPreviewOpen}
        onClose={handleClosePreview}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            height: '90vh',
            borderRadius: '12px',
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>{previewTitle}</Typography>
          <IconButton onClick={handleClosePreview}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, bgcolor: '#525659', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {isPreviewLoading ? (
            <CircularProgress sx={{ color: 'white' }} />
          ) : previewUrl ? (
            <iframe
              src={previewUrl}
              title="Document Preview"
              width="100%"
              height="100%"
              style={{ border: 'none' }}
            />
          ) : (
            <Typography color="white">Failed to load preview</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClosePreview} variant="outlined">Close</Button>
          {previewUrl && (
            <Button
              variant="contained"
              component="a"
              href={previewUrl}
              download={previewTitle}
              sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {tasksLoading && <LoadingSpinner />}
    </Container>
  );
};

export default WorkflowPage;