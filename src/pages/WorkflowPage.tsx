import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { workflowService } from '../services/workflowService';
import { documentService } from '../services/documentService';
import type { WorkflowTemplate, WorkflowTask, WorkflowInstance, WorkflowAuditEntry } from '../types/workflow';
import type { Document } from '../types/document';
import Navigation from '../components/Navigation';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const WorkflowPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'templates' | 'tasks' | 'history'>('tasks');
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [selectedTask, setSelectedTask] = useState<WorkflowTask | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowInstance | null>(null);
  const [auditEntries, setAuditEntries] = useState<WorkflowAuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [showStartWorkflowModal, setShowStartWorkflowModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    workflowXml: '',
  });
  const [taskAction, setTaskAction] = useState({
    comment: '',
    action: 'approve' as 'approve' | 'reject',
  });
  const [bulkAction, setBulkAction] = useState({
    comment: '',
    action: 'approve' as 'approve' | 'reject',
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'templates') {
        // Load templates for current company
        if (user?.company) {
          // We need company ID, for now assume it's 1
          const companyTemplates = await workflowService.getCompanyTemplates(1);
          setTemplates(companyTemplates);
        }
      } else if (activeTab === 'tasks') {
        const myTasks = await workflowService.getMyTasks();
        setTasks(myTasks);
      } else if (activeTab === 'history') {
        // Load workflow instances - need to add API endpoint
        // For now, show empty
      }

      // Load documents for workflow start
      const userDocuments = await documentService.getUserDocuments();
      setDocuments(userDocuments);
    } catch (error) {
      console.error('Failed to load workflow data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newTemplate = await workflowService.createTemplate({
        name: templateForm.name,
        workflowXml: templateForm.workflowXml,
        companyId: 1, // Assume company ID for now
      });
      setTemplates(prev => [...prev, newTemplate]);
      setShowCreateTemplateModal(false);
      setTemplateForm({ name: '', workflowXml: '' });
    } catch (error) {
      console.error('Failed to create template:', error);
      alert('Failed to create workflow template.');
    }
  };

  const handleStartWorkflow = async (templateId: number, documentId: number) => {
    try {
      await workflowService.startWorkflow(templateId, documentId);
      setShowStartWorkflowModal(false);
      alert('Workflow started successfully!');
    } catch (error) {
      console.error('Failed to start workflow:', error);
      alert('Failed to start workflow.');
    }
  };

  const handleTaskAction = async (taskId: number, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await workflowService.approveTask(taskId, { comment: taskAction.comment });
      } else {
        await workflowService.rejectTask(taskId, { comment: taskAction.comment });
      }
      await loadData();
      setShowTaskModal(false);
      setSelectedTask(null);
      setTaskAction({ comment: '', action: 'approve' });
    } catch (error) {
      console.error('Failed to process task:', error);
      alert('Failed to process task.');
    }
  };

  const handleBulkAction = async () => {
    try {
      if (bulkAction.action === 'approve') {
        await workflowService.bulkApproveTasks({
          taskIds: selectedTasks,
          comment: bulkAction.comment,
        });
      } else {
        await workflowService.bulkRejectTasks({
          taskIds: selectedTasks,
          comment: bulkAction.comment,
        });
      }
      setSelectedTasks([]);
      setShowBulkActions(false);
      setBulkAction({ comment: '', action: 'approve' });
      await loadData();
    } catch (error) {
      console.error('Failed to process bulk action:', error);
      alert('Failed to process selected tasks.');
    }
  };

  const handleViewAudit = async (workflowId: number) => {
    try {
      const audit = await workflowService.getWorkflowAudit(workflowId);
      setAuditEntries(audit);
      setShowAuditModal(true);
    } catch (error) {
      console.error('Failed to load audit:', error);
      alert('Failed to load workflow audit.');
    }
  };

  const getTaskStatusBadge = (status: string) => {
    const statusClasses = {
      PENDING: 'status-pending',
      APPROVED: 'status-approved',
      REJECTED: 'status-rejected',
      SKIPPED: 'status-active',
    };
    return `status-badge ${statusClasses[status as keyof typeof statusClasses] || 'status-pending'}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const sampleWorkflowXml = `<workflow>
  <!-- Sequential steps -->
  <step order="1" roleName="Manager" roleLevel="60" action="review" parallel="false"/>
  <step order="2" roleName="Director" roleLevel="80" action="approve" parallel="false"/>

  <!-- Parallel approvals -->
  <step order="3" roleName="Lawyer" roleLevel="70" action="review" parallel="true"/>
  <step order="3" roleName="Accountant" roleLevel="65" action="verify" parallel="true"/>

  <!-- Conditional routing -->
  <onApprove stepOrder="1" condition="isLowValue" targetStep="4" description="Skip director"/>
  <onApprove stepOrder="1" condition="!isLowValue" targetStep="2" description="Normal flow"/>
  <onReject stepOrder="2" targetStep="1" description="Return to manager"/>
</workflow>`;

  const templatesColumns = [
    { key: 'name', header: 'Template Name' },
    { key: 'createdAt', header: 'Created', render: (value: string) => formatDate(value) },
    {
      key: 'isActive',
      header: 'Status',
      render: (value: boolean) => (
        <span className={`status-badge ${value ? 'status-approved' : 'status-rejected'}`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, template: WorkflowTemplate) => (
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedTemplate(template);
              setShowStartWorkflowModal(true);
            }}
            className="btn-primary text-xs"
          >
            Start Workflow
          </button>
          <button
            onClick={() => setSelectedTemplate(template)}
            className="btn-secondary text-xs"
          >
            View XML
          </button>
        </div>
      )
    }
  ];

  const tasksColumns = [
    { key: 'document.filename', header: 'Document' },
    { key: 'requiredRoleName', header: 'Required Role' },
    { key: 'requiredRoleLevel', header: 'Level' },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => <span className={getTaskStatusBadge(value)}>{value}</span>
    },
    {
      key: 'assignedAt',
      header: 'Assigned',
      render: (value: string) => formatDate(value)
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, task: WorkflowTask) => (
        <div className="flex space-x-2">
          {task.status === 'PENDING' && (
            <>
              <button
                onClick={() => {
                  setSelectedTask(task);
                  setTaskAction({ comment: '', action: 'approve' });
                  setShowTaskModal(true);
                }}
                className="btn-primary text-xs"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  setSelectedTask(task);
                  setTaskAction({ comment: '', action: 'reject' });
                  setShowTaskModal(true);
                }}
                className="btn-danger text-xs"
              >
                Reject
              </button>
            </>
          )}
          <button
            onClick={() => handleViewAudit(task.workflowInstanceId)}
            className="text-blue-600 hover:text-blue-500 text-xs"
          >
            Audit
          </button>
        </div>
      )
    }
  ];

  return (
    <Navigation>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Workflow Management</h1>
          <div className="flex space-x-4">
            {activeTab === 'templates' && (
              <button
                onClick={() => setShowCreateTemplateModal(true)}
                className="btn-primary"
              >
                Create Template
              </button>
            )}
            {activeTab === 'tasks' && tasks.some(t => t.status === 'PENDING') && (
              <button
                onClick={() => setShowBulkActions(true)}
                className="btn-secondary"
                disabled={selectedTasks.length === 0}
              >
                Bulk Actions ({selectedTasks.length})
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'tasks', name: 'My Tasks', count: tasks.filter(t => t.status === 'PENDING').length },
              { id: 'templates', name: 'Templates', count: templates.length },
              { id: 'history', name: 'History', count: 0 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name} {tab.count > 0 && `(${tab.count})`}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="card">
          {activeTab === 'tasks' && (
            <DataTable
              data={tasks}
              columns={tasksColumns}
              loading={isLoading}
              emptyMessage="No workflow tasks assigned to you."
            />
          )}

          {activeTab === 'templates' && (
            <DataTable
              data={templates}
              columns={templatesColumns}
              loading={isLoading}
              emptyMessage="No workflow templates created yet."
            />
          )}

          {activeTab === 'history' && (
            <div className="text-center py-8 text-gray-500">
              Workflow history will be implemented here.
            </div>
          )}
        </div>
      </div>

      {/* Create Template Modal */}
      <Modal
        isOpen={showCreateTemplateModal}
        onClose={() => setShowCreateTemplateModal(false)}
        title="Create Workflow Template"
        size="xl"
      >
        <form onSubmit={handleCreateTemplate} className="space-y-6">
          <div>
            <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 mb-2">
              Template Name
            </label>
            <input
              type="text"
              id="templateName"
              required
              value={templateForm.name}
              onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
              className="input-field"
              placeholder="e.g., Contract Approval Process"
            />
          </div>

          <div>
            <label htmlFor="workflowXml" className="block text-sm font-medium text-gray-700 mb-2">
              Workflow XML
            </label>
            <textarea
              id="workflowXml"
              rows={15}
              required
              value={templateForm.workflowXml}
              onChange={(e) => setTemplateForm(prev => ({ ...prev, workflowXml: e.target.value }))}
              className="input-field font-mono text-sm"
              placeholder="Enter workflow XML definition..."
            />
            <p className="text-sm text-gray-500 mt-1">
              Use XML format to define workflow steps, roles, and routing logic.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setTemplateForm(prev => ({ ...prev, workflowXml: sampleWorkflowXml }))}
              className="btn-secondary text-sm"
            >
              Load Sample XML
            </button>
            <div className="flex space-x-4 ml-auto">
              <button
                type="button"
                onClick={() => {
                  setShowCreateTemplateModal(false);
                  setTemplateForm({ name: '', workflowXml: '' });
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Create Template
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Start Workflow Modal */}
      <Modal
        isOpen={showStartWorkflowModal}
        onClose={() => setShowStartWorkflowModal(false)}
        title={`Start Workflow: ${selectedTemplate?.name}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select a document to start this workflow with.
          </p>

          {documents.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No documents available. Please upload a document first.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{doc.originalFilename}</p>
                    <p className="text-sm text-gray-500">
                      {doc.documentType} • {formatDate(doc.uploadedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleStartWorkflow(selectedTemplate!.id, doc.id)}
                    className="btn-primary text-sm"
                  >
                    Start Workflow
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Task Action Modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title={`${taskAction.action === 'approve' ? 'Approve' : 'Reject'} Task`}
      >
        <div className="space-y-4">
          {selectedTask && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900">{selectedTask.document.filename}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Required: {selectedTask.requiredRoleName} (Level {selectedTask.requiredRoleLevel})
              </p>
              <p className="text-sm text-gray-600">
                Amount: ${selectedTask.document.amount?.toLocaleString() || 'N/A'}
              </p>
            </div>
          )}

          <div>
            <label htmlFor="taskComment" className="block text-sm font-medium text-gray-700 mb-2">
              Comment (optional)
            </label>
            <textarea
              id="taskComment"
              rows={3}
              value={taskAction.comment}
              onChange={(e) => setTaskAction(prev => ({ ...prev, comment: e.target.value }))}
              className="input-field"
              placeholder="Add a comment..."
            />
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => handleTaskAction(selectedTask!.id, taskAction.action)}
              className={taskAction.action === 'approve' ? 'btn-primary' : 'btn-danger'}
            >
              {taskAction.action === 'approve' ? 'Approve' : 'Reject'} Task
            </button>
            <button
              onClick={() => {
                setShowTaskModal(false);
                setSelectedTask(null);
                setTaskAction({ comment: '', action: 'approve' });
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Actions Modal */}
      <Modal
        isOpen={showBulkActions}
        onClose={() => setShowBulkActions(false)}
        title={`Bulk ${bulkAction.action === 'approve' ? 'Approve' : 'Reject'} Tasks`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Apply action to {selectedTasks.length} selected task{selectedTasks.length !== 1 ? 's' : ''}.
          </p>

          <div>
            <label htmlFor="bulkComment" className="block text-sm font-medium text-gray-700 mb-2">
              Comment (optional)
            </label>
            <textarea
              id="bulkComment"
              rows={3}
              value={bulkAction.comment}
              onChange={(e) => setBulkAction(prev => ({ ...prev, comment: e.target.value }))}
              className="input-field"
              placeholder="Add a comment for all tasks..."
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="bulkAction"
                value="approve"
                checked={bulkAction.action === 'approve'}
                onChange={(e) => setBulkAction(prev => ({ ...prev, action: e.target.value as 'approve' }))}
                className="mr-2"
              />
              Approve All
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="bulkAction"
                value="reject"
                checked={bulkAction.action === 'reject'}
                onChange={(e) => setBulkAction(prev => ({ ...prev, action: e.target.value as 'reject' }))}
                className="mr-2"
              />
              Reject All
            </label>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleBulkAction}
              className={bulkAction.action === 'approve' ? 'btn-primary' : 'btn-danger'}
            >
              {bulkAction.action === 'approve' ? 'Approve' : 'Reject'} All
            </button>
            <button
              onClick={() => {
                setShowBulkActions(false);
                setBulkAction({ comment: '', action: 'approve' });
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Audit Modal */}
      <Modal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        title="Workflow Audit Trail"
        size="xl"
      >
        <div className="space-y-4">
          {auditEntries.map((entry) => (
            <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-900">{entry.action}</span>
                    <span className="text-sm text-gray-500">by {entry.userName}</span>
                  </div>
                  {entry.details && (
                    <p className="text-sm text-gray-600 mt-1">{entry.details}</p>
                  )}
                </div>
                <span className="text-sm text-gray-500">{formatDate(entry.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Template XML View Modal */}
      {selectedTemplate && !showStartWorkflowModal && (
        <Modal
          isOpen={!!selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          title={`Workflow Template: ${selectedTemplate.name}`}
          size="xl"
        >
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Template Details</h3>
              <p className="text-sm text-gray-600">Created: {formatDate(selectedTemplate.createdAt)}</p>
              <p className="text-sm text-gray-600">Status: {selectedTemplate.isActive ? 'Active' : 'Inactive'}</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Workflow XML</h3>
              <pre className="bg-gray-50 p-4 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                {selectedTemplate.workflowXml}
              </pre>
            </div>
          </div>
        </Modal>
      )}
    </Navigation>
  );
};

export default WorkflowPage;
