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
import TaskTable from '../components/workflow/TaskTable';
import TemplateTable from '../components/workflow/TemplateTable';
import WorkflowEditor from '../components/workflow/WorkflowEditor';
import WorkflowDetails from '../components/workflow/WorkflowDetails';
import LoadingSpinner from '../components/LoadingSpinner';
import { useWorkflowSocket } from '../hooks/useWorkflowSocket';
import { format } from 'date-fns';

const WorkflowPage: React.FC = () => {
  const { user } = useAuth();
  const { activeTab, setActiveTab, selectedTaskIds, clearSelection } = useWorkflowStore();
  const {
    useMyTasks,
    useCompanyTemplates,
    useWorkflowAudit,
    approveTaskMutation,
    rejectTaskMutation,
    bulkApproveMutation,
    createTemplateMutation,
    useCompanyDocuments,
  } = useWorkflow();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedInstanceId] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [comment, setComment] = useState('');
  const [pendingActionTask, setPendingActionTask] = useState<{ id: number; action: 'approve' | 'reject' } | null>(null);

  // ✅ Состояния для выбора документа
  const [isDocumentSelectorOpen, setIsDocumentSelectorOpen] = useState(false);
  const [selectedTemplateForStart, setSelectedTemplateForStart] = useState<any | null>(null);
  const [documentSearchTerm, setDocumentSearchTerm] = useState('');

  // Data fetching
  const companyId = (user as any)?.memberships?.[0]?.companyId || (user as any)?.company?.id || 1;
  useWorkflowSocket(companyId);
  const { data: tasks, isLoading: tasksLoading } = useMyTasks();
  const { data: templates } = useCompanyTemplates(companyId);
  const { data: auditLogs, isLoading: auditLoading } = useWorkflowAudit(selectedInstanceId);

  // ✅ Загрузка документов компании
  const { data: documents, isLoading: documentsLoading } = useCompanyDocuments();

  // ✅ Фильтрация документов по названию файла
  const filteredDocuments = useMemo(() => {
    if (!documents || documents.length === 0) return [];
    
    return documents.filter((doc: any) =>
      doc.originalFilename && doc.originalFilename.toLowerCase().includes(documentSearchTerm.toLowerCase())
    );
  }, [documents, documentSearchTerm]);

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

  const handleCreateTemplate = (data: any) => {
    const companyId = (user as any)?.memberships?.[0]?.companyId || (user as any)?.company?.id || 1;
    createTemplateMutation.mutate(
      { ...data, companyId },
      { onSuccess: () => setIsEditorOpen(false) }
    );
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
        alert(`Workflow успешно запущен! Instance ID: ${data.id}`);
        setIsDocumentSelectorOpen(false);
        setSelectedTemplateForStart(null);
        setDocumentSearchTerm('');
      } else {
        const error = await response.text();
        alert('Ошибка запуска: ' + error);
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка сети при запуске workflow');
    }
  };

  const handleViewXml = (template: any) => {
    setSelectedTemplate(template);
  };

  const handleDeleteTemplate = (template: any) => {
    // Implement delete mutation in useWorkflow
    console.log('Delete template', template.id);
  };

  // ✅ Закрытие модалки выбора документа
  const handleCloseDocumentSelector = () => {
    setIsDocumentSelectorOpen(false);
    setSelectedTemplateForStart(null);
    setDocumentSearchTerm('');
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
              Выберите документ для запуска workflow
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
            Шаблон: <strong>{selectedTemplateForStart?.name}</strong>
          </Typography>
        </DialogTitle>
        
        <DialogContent dividers sx={{ p: 0 }}>
          <Box sx={{ p: 3, pb: 2 }}>
            <TextField
              fullWidth
              placeholder="Поиск по названию файла..."
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
                  ? 'Документы не найдены' 
                  : 'Документы по вашему запросу не найдены'}
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
                      Название файла
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper', width: '200px' }}>
                      Дата создания
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper', width: '120px' }}>
                      Действия
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
                          {document.originalFilename || 'Без имени'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {document.createdAt ? format(new Date(document.createdAt), 'dd.MM.yyyy HH:mm') : 'Нет даты'}
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
                          Выбрать
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
            Отмена
          </Button>
          <Typography variant="body2" color="textSecondary" sx={{ ml: 2, mr: 'auto' }}>
            Найдено: {filteredDocuments.length} из {documents ? documents.length : 0}
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
            onClick={() => setIsEditorOpen(false)}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
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