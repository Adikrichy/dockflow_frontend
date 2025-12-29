import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Добавлен useNavigate
import { useAuth } from '../hooks/useAuth';
import { useWebSocketContext } from '../App';
import { workflowService } from '../services/workflowService';
import type { WorkflowTask } from '../types/workflow';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal'; // Оставляем Modal, удаляем Navigation

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useWebSocketContext();
  const navigate = useNavigate(); // Добавлен для перенаправления
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<WorkflowTask | null>(null);
  const [taskAction, setTaskAction] = useState<{
    comment: string;
    action: 'approve' | 'reject';
  }>({ comment: '', action: 'approve' });

  useEffect(() => {
    loadMyTasks();
  }, []);

  const loadMyTasks = async () => {
    try {
      const myTasks = await workflowService.getMyTasks();
      setTasks(myTasks.slice(0, 5)); // Show only first 5 tasks
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
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

  const handleTaskAction = async (taskId: number, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await workflowService.approveTask(taskId, { comment: taskAction.comment });
      } else {
        await workflowService.rejectTask(taskId, { comment: taskAction.comment });
      }
      await loadMyTasks();
      setShowTaskModal(false);
      setSelectedTask(null);
      setTaskAction({ comment: '', action: 'approve' });
    } catch (error) {
      console.error('Failed to process task:', error);
      alert('Failed to process task.');
    }
  };

  const formatEventTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleTaskButtonClick = (task: WorkflowTask, action: 'approve' | 'reject') => {
    setSelectedTask(task);
    setTaskAction({ ...taskAction, action });
    setShowTaskModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">DocFlow</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <span className={`text-xs px-2 py-1 rounded ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isConnected ? 'Online' : 'Offline'}
              </span>
              <button
                onClick={handleLogout}
                className="btn-secondary text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* ... остальной код quick actions без изменений ... */}
          <Link
            to="/documents"
            className="card hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Documents</h3>
                <p className="text-sm text-gray-500">Upload and manage documents</p>
              </div>
            </div>
          </Link>

          <Link
            to="/workflow"
            className="card hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Workflow</h3>
                <p className="text-sm text-gray-500">Manage approval workflows</p>
              </div>
            </div>
          </Link>

          <Link
            to="/company"
            className="card hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Company</h3>
                <p className="text-sm text-gray-500">Manage company settings</p>
              </div>
            </div>
          </Link>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Reports</h3>
                <p className="text-sm text-gray-500">View analytics and reports</p>
              </div>
            </div>
          </div>
        </div>

        {/* My Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">My Tasks</h2>
            <Link
              to="/workflow"
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              View all →
            </Link>
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : tasks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pending tasks</p>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        {task.document.filename}
                      </h3>
                      <span className={getStatusBadge(task.status)}>
                        {task.status}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      Required role: {task.requiredRoleName} (Level {task.requiredRoleLevel})
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Assigned: {formatDate(task.assignedAt)}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleTaskButtonClick(task, 'approve')}
                      className="btn-primary text-xs px-3 py-1"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleTaskButtonClick(task, 'reject')}
                      className="btn-danger text-xs px-3 py-1"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Task Action Modal */}
    
      <Modal 
        isOpen={showTaskModal} 
        onClose={() => setShowTaskModal(false)}
        title={taskAction.action === 'approve' ? 'Approve Task' : 'Reject Task'}
      >
        <div className="p-6">
          {/* Убрали заголовок h2, так как он теперь передается в title проп */}
          <p className="text-sm text-gray-600 mb-4">
            Document: {selectedTask?.document.filename}
          </p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comment
            </label>
            <textarea
              value={taskAction.comment}
              onChange={(e) => setTaskAction({ ...taskAction, comment: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Add a comment (optional)"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowTaskModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => selectedTask && handleTaskAction(selectedTask.id, taskAction.action)}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                taskAction.action === 'approve' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {taskAction.action === 'approve' ? 'Approve' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardPage;