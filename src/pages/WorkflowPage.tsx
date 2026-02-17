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
import { useParams } from 'react-router-dom';
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
import { workflowService } from '../services/workflowService';

interface WorkflowPageProps {
  initialEditorOpen?: boolean;
}

const WorkflowPage: React.FC<WorkflowPageProps> = ({ initialEditorOpen = false }) => {
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
  const [currentPreviewDocId, setCurrentPreviewDocId] = useState<number | null>(null);

  // ✅ States for Document & Assignment Selection
  const [isDocumentSelectorOpen, setIsDocumentSelectorOpen] = useState(false);
  const [selectedTemplateForStart, setSelectedTemplateForStart] = useState<any | null>(null);
  const [documentSearchTerm, setDocumentSearchTerm] = useState('');
  const [selectedDocumentForStart, setSelectedDocumentForStart] = useState<any | null>(null);

  const [assignmentMode, setAssignmentMode] = useState<'role' | 'direct'>('role');
  const [templateSteps, setTemplateSteps] = useState<any[]>([]);
  const [currentAssignments, setCurrentAssignments] = useState<Record<number, number>>({});
  const [isStepsLoading, setIsStepsLoading] = useState(false);

  // ✅ Access Control Levels state
  const [allowedRoleLevels, setAllowedRoleLevels] = useState<number[]>([]);

  // Data fetching
  const companyId = currentCompany?.companyId || (user as any)?.memberships?.[0]?.companyId || (user as any)?.company?.id || 1;
  useWorkflowSocket(companyId);
  const { data: tasks, isLoading: tasksLoading } = useMyTasks();
  const { data: templates } = useCompanyTemplates(companyId);
  const { data: auditLogs, isLoading: auditLoading } = useWorkflowAudit(selectedInstanceId);

  // ✅ Document fetching
  const { data: documents, isLoading: documentsLoading } = useCompanyDocuments();

  // ✅ Role fetching
  const { data: roles = [], isLoading: rolesLoading } = useCompanyRoles();

  // URL params logic
  const { templateId } = useParams<{ templateId: string }>();

  // Effects for opening editor from URL params
  React.useEffect(() => {
    if (initialEditorOpen && templateId && templates) {
      const templateToEdit = templates.find((t: any) => t.id === Number(templateId));
      if (templateToEdit) {
        setEditingTemplate(templateToEdit);
        setIsEditorOpen(true);
        setActiveTab(1);
      }
    }
  }, [templates, initialEditorOpen, templateId, setActiveTab]);

  // ✅ Document filtering
  const filteredDocuments = useMemo(() => {
    if (!documents || documents.length === 0) return [];
    return documents.filter((doc: any) =>
      (doc.originalFilename || doc.filename || '').toLowerCase().includes(documentSearchTerm.toLowerCase())
    );
  }, [documents, documentSearchTerm]);

  const canManageTemplates = useMemo(() => {
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
    const companyId = currentCompany?.companyId || (user as any)?.memberships?.[0]?.companyId || (user as any)?.company?.id || 1;
    if (editingTemplate) {
      updateTemplateMutation.mutate(
        {
          templateId: editingTemplate.id,
          request: { ...data, allowedRoleLevels: data.allowedRoleLevels || [] }
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
        { ...data, companyId, allowedRoleLevels: data.allowedRoleLevels || [] },
        { onSuccess: () => setIsEditorOpen(false) }
      );
    }
  };

  // ✅ New Workflow Start Logic
  const handleStartWorkflow = async (template: any) => {
    setSelectedTemplateForStart(template);
    setIsDocumentSelectorOpen(true);
    setAssignmentMode('role');
    setSelectedDocumentForStart(null);
    setTemplateSteps([]);
    setCurrentAssignments({});

    try {
      setIsStepsLoading(true);
      const steps = await workflowService.getStepsWithUsers(template.id);
      setTemplateSteps(steps);
    } catch (err) {
      console.error('Error fetching steps:', err);
    } finally {
      setIsStepsLoading(false);
    }
  };

  const handleDocumentSelect = (document: any) => {
    setSelectedDocumentForStart(document);
  };

  const finalizeStartWorkflow = async () => {
    if (!selectedTemplateForStart || !selectedDocumentForStart) return;

    try {
      const assignments = assignmentMode === 'direct' ? currentAssignments : undefined;
      const data = await workflowService.startWorkflow(
        selectedDocumentForStart.id,
        selectedTemplateForStart.id,
        assignments
      );

      alert(`Workflow successfully started! Instance ID: ${data.id}`);
      handleCloseDocumentSelector();
    } catch (err: any) {
      console.error(err);
      alert('Start error: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    }
  };

  const handleCloseDocumentSelector = () => {
    setIsDocumentSelectorOpen(false);
    setSelectedTemplateForStart(null);
    setSelectedDocumentForStart(null);
    setDocumentSearchTerm('');
  };

  const handleViewXml = (template: any) => setSelectedTemplate(template);
  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setIsEditorOpen(true);
  };

  const handleManageAccess = (template: any) => {
    setSelectedTemplateForAccess(template);
    setIsAccessDialogOpen(true);
    const existingLevels = template.allowedRoleLevels || [100];
    if (!existingLevels.includes(100)) existingLevels.push(100);
    setAllowedRoleLevels(existingLevels);
  };

  const handleDeleteTemplate = (template: any) => deleteTemplateMutation.mutate(template.id);

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

  const handleCloseAccessDialog = () => {
    setIsAccessDialogOpen(false);
    setSelectedTemplateForAccess(null);
    setAllowedRoleLevels([]);
  };

  const handleViewDocument = async (documentId: number, filename: string, contentType: string) => {
    try {
      setIsPreviewLoading(true);
      setPreviewTitle(filename || 'Document Preview');
      setCurrentPreviewDocId(documentId);
      setIsPreviewOpen(true);

      const isPdf = filename.toLowerCase().endsWith('.pdf') || contentType === 'application/pdf';
      const isImage = /\.(jpg|jpeg|png|gif|svg)$/i.test(filename) || contentType.startsWith('image/');

      if (isPdf || isImage) {
        const blob = await documentService.getDocumentFile(documentId, true);
        const finalBlob = isPdf ? blob.slice(0, blob.size, 'application/pdf') : blob;
        const url = URL.createObjectURL(finalBlob);
        setPreviewUrl(url);
      } else {
        // For other files, we don't set previewUrl to avoid iframe download trigger
        setPreviewUrl(null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load preview');
      setIsPreviewOpen(false);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleDownloadFromPreview = async () => {
    if (!currentPreviewDocId || !previewTitle) return;
    try {
      const blob = await documentService.getDocumentFile(currentPreviewDocId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = previewTitle;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download document:', err);
      alert('Failed to download document.');
    }
  };

  const handleClosePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setIsPreviewOpen(false);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>Workflow Management</Typography>
        {activeTab === 1 && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setEditingTemplate(null); setIsEditorOpen(true); }}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          >
            New Template
          </Button>
        )}
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab icon={<TaskIcon />} label="My Tasks" iconPosition="start" />
          <Tab icon={<TemplateIcon />} label="Templates" iconPosition="start" />
          <Tab icon={<HistoryIcon />} label="History" iconPosition="start" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Box>
          {selectedTaskIds.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={handleBulkApprove}>Bulk Approve</Button>}>
              {selectedTaskIds.length} tasks selected.
            </Alert>
          )}
          <TaskTable tasks={tasks || []} onApprove={handleApproveClick} onReject={handleRejectClick} onViewDocument={handleViewDocument} onClaim={handleClaimTask} />
        </Box>
      )}

      {activeTab === 1 && (
        <TemplateTable templates={templates || []} onStartWorkflow={handleStartWorkflow} onViewXml={handleViewXml} onEdit={handleEditTemplate} onDelete={handleDeleteTemplate} onManageAccess={handleManageAccess} canManage={canManageTemplates} />
      )}

      {activeTab === 2 && <Typography color="textSecondary">Workflow instance history matches will appear here.</Typography>}

      {/* Workflow Start Flow Dialog */}
      <Dialog open={isDocumentSelectorOpen} onClose={handleCloseDocumentSelector} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: '12px', maxHeight: '80vh' } }}>
        <DialogTitle sx={{ p: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>{!selectedDocumentForStart ? 'Select a document' : 'Configure Assignment'}</Typography>
            <IconButton onClick={handleCloseDocumentSelector}><CloseIcon /></IconButton>
          </Box>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Template: <strong>{selectedTemplateForStart?.name}</strong>
            {selectedDocumentForStart && <> | Document: <strong>{selectedDocumentForStart.originalFilename || selectedDocumentForStart.filename}</strong></>}
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          {!selectedDocumentForStart ? (
            <>
              <Box sx={{ p: 3, pb: 2 }}>
                <TextField fullWidth placeholder="Search documents..." value={documentSearchTerm} onChange={(e) => setDocumentSearchTerm(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
              </Box>
              {documentsLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box> : (
                <TableContainer component={Paper} elevation={0} sx={{ maxHeight: '400px', borderTop: 1, borderColor: 'divider' }}>
                  <Table stickyHeader size="small">
                    <TableHead><TableRow><TableCell>Filename</TableCell><TableCell>Created At</TableCell><TableCell>Action</TableCell></TableRow></TableHead>
                    <TableBody>
                      {filteredDocuments.map((doc: any) => (
                        <TableRow key={doc.id} hover sx={{ backgroundColor: selectedDocumentForStart?.id === doc.id ? 'rgba(59, 130, 246, 0.08)' : 'inherit' }}>
                          <TableCell>{doc.originalFilename || doc.filename}</TableCell>
                          <TableCell>{doc.createdAt ? format(new Date(doc.createdAt), 'MMM dd, HH:mm') : '-'}</TableCell>
                          <TableCell><Button variant="outlined" size="small" onClick={() => handleDocumentSelect(doc)}>Select</Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          ) : (
            <Box sx={{ p: 3 }}>
              {isStepsLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box> : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Assignment Mode</Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                      <Button variant={assignmentMode === 'role' ? 'contained' : 'outlined'} onClick={() => setAssignmentMode('role')} sx={{ textTransform: 'none' }}>By Role</Button>
                      <Button variant={assignmentMode === 'direct' ? 'contained' : 'outlined'} onClick={() => setAssignmentMode('direct')} sx={{ textTransform: 'none' }}>Select People</Button>
                    </Box>
                  </Box>
                  {assignmentMode === 'direct' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Steps</Typography>
                      {templateSteps.map((step) => (
                        <Box key={step.order} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, borderBottom: '1px solid #eee' }}>
                          <Typography variant="body2" sx={{ minWidth: 80 }}>Step {step.order}:</Typography>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{step.roleName}</Typography>
                          </Box>
                          <Select size="small" sx={{ width: 220 }} value={currentAssignments[step.order] || ''} displayEmpty onChange={(e) => setCurrentAssignments({ ...currentAssignments, [step.order]: Number(e.target.value) })}>
                            <MenuItem value="" disabled>Select User</MenuItem>
                            {step.potentialUsers.map((u: any) => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
                          </Select>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          {selectedDocumentForStart && <Button sx={{ mr: 'auto' }} onClick={() => setSelectedDocumentForStart(null)}>Back</Button>}
          <Button onClick={handleCloseDocumentSelector}>Cancel</Button>
          <Button variant="contained" onClick={finalizeStartWorkflow} disabled={!selectedDocumentForStart || (assignmentMode === 'direct' && Object.keys(currentAssignments).length < templateSteps.length)}>Start</Button>
        </DialogActions>
      </Dialog>

      {/* Details/Logs Dialog */}
      <Dialog open={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Workflow Details <IconButton onClick={() => setIsDetailsOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton></DialogTitle>
        <DialogContent dividers><WorkflowDetails auditLogs={auditLogs || []} isLoading={auditLoading} /></DialogContent>
      </Dialog>

      {/* XML Dialog */}
      <Dialog open={!!selectedTemplate} onClose={() => setSelectedTemplate(null)} fullWidth maxWidth="md">
        <DialogTitle>Template XML: {selectedTemplate?.name} <IconButton onClick={() => setSelectedTemplate(null)} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton></DialogTitle>
        <DialogContent dividers><pre style={{ backgroundColor: '#f5f5f5', padding: '16px', overflow: 'auto' }}>{selectedTemplate?.stepsXml}</pre></DialogContent>
      </Dialog>

      {/* Action Dialog (Approve/Reject) */}
      <Dialog open={!!pendingActionTask} onClose={() => setPendingActionTask(null)} fullWidth maxWidth="xs">
        <DialogTitle>{pendingActionTask?.action === 'approve' ? 'Approve' : 'Reject'} Task</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Comment" fullWidth multiline rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingActionTask(null)}>Cancel</Button>
          <Button onClick={confirmAction} variant="contained" color={pendingActionTask?.action === 'approve' ? 'success' : 'error'}>Confirm</Button>
        </DialogActions>
      </Dialog>

      {/* Template Editor */}
      <Dialog open={isEditorOpen} onClose={() => setIsEditorOpen(false)} fullScreen>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editingTemplate ? 'Edit Template' : 'New Template'}
          <IconButton onClick={() => { setIsEditorOpen(false); setEditingTemplate(null); }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <WorkflowEditor initialName={editingTemplate?.name} initialDescription={editingTemplate?.description} initialXml={editingTemplate?.stepsXml} initialAllowedRoleLevels={editingTemplate?.allowedRoleLevels} onSave={handleSaveTemplate} isLoading={createTemplateMutation.isPending || updateTemplateMutation.isPending} />
        </DialogContent>
      </Dialog>

      {/* Access Control */}
      <Dialog open={isAccessDialogOpen} onClose={handleCloseAccessDialog} fullWidth maxWidth="sm">
        <DialogTitle>Manage Access: {selectedTemplateForAccess?.name} <IconButton onClick={handleCloseAccessDialog} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton></DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Allowed Roles</InputLabel>
            <Select multiple value={allowedRoleLevels} onChange={(e) => {
              const val = e.target.value as number[];
              setAllowedRoleLevels(val.includes(100) ? val : [...val, 100]);
            }} input={<OutlinedInput label="Allowed Roles" />} renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(selected as number[]).map((level) => {
                  const r = roles.find(r => r.level === level);
                  return <Chip key={level} label={r ? r.name : `L${level}`} size="small" />;
                })}
              </Box>
            )}>
              {roles.map((role) => <MenuItem key={role.id} value={role.level} disabled={role.level === 100}>{role.name} (L{role.level})</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions><Button onClick={handleCloseAccessDialog}>Cancel</Button><Button variant="contained" onClick={handleSaveAccessSettings}>Save</Button></DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onClose={handleClosePreview} fullWidth maxWidth="lg" PaperProps={{ sx: { height: '90vh' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>{previewTitle} <IconButton onClick={handleClosePreview}><CloseIcon /></IconButton></DialogTitle>
        <DialogContent dividers sx={{ p: 0, bgcolor: isPreviewLoading ? '#f5f5f5' : (previewUrl ? '#525659' : '#fff'), display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          {isPreviewLoading ? (
            <CircularProgress />
          ) : previewUrl ? (
            <iframe src={previewUrl} width="100%" height="100%" style={{ border: 'none' }} title="Preview" />
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <TemplateIcon sx={{ fontSize: 64, color: '#CBD5E1', mb: 2 }} />
              <Typography variant="h6" color="textPrimary" gutterBottom>
                Preview not available
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                This file format cannot be previewed in the browser. <br />
                Please download the file to view its content or use the "View & Edit" option if available.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Close</Button>
          <Button
            variant="contained"
            onClick={handleDownloadFromPreview}
            disabled={isPreviewLoading || !currentPreviewDocId}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>

      {tasksLoading && <LoadingSpinner />}
    </Container>
  );
};

export default WorkflowPage;