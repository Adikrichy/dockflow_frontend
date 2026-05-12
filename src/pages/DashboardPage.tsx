import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWebSocketContext } from '../App';
import { workflowService } from '../services/workflowService';
import { dashboardService, type DashboardStats, type DashboardActivity } from '../services/dashboardService';
import type { WorkflowTask } from '../types/workflow';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import DashboardLayout from '../components/DashboardLayout';
import './DashboardPage.css';

const DashboardPage = () => {
  const { t } = useTranslation();
  const { isConnected } = useWebSocketContext();
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    activeWorkflows: 0,
    pendingTasks: 0
  });
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<WorkflowTask | null>(null);
  const [taskAction, setTaskAction] = useState<{
    comment: string;
    action: 'approve' | 'reject';
  }>({ comment: '', action: 'approve' });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [myTasks, dashboardStats, recentActivities] = await Promise.all([
        workflowService.getMyTasks(),
        dashboardService.getStats(),
        dashboardService.getActivities()
      ]);
      setTasks(myTasks.slice(0, 5));
      setStats(dashboardStats);
      setActivities(recentActivities);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskAction = async (taskId: number, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await workflowService.approveTask(taskId, { comment: taskAction.comment });
      } else {
        await workflowService.rejectTask(taskId, { comment: taskAction.comment });
      }
      await loadDashboardData();
      setShowTaskModal(false);
      setSelectedTask(null);
      setTaskAction({ comment: '', action: 'approve' });
    } catch (error) {
      console.error('Failed to process task:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const handleTaskButtonClick = (task: WorkflowTask, action: 'approve' | 'reject') => {
    setSelectedTask(task);
    setTaskAction({ ...taskAction, action });
    setShowTaskModal(true);
  };

  return (
    <DashboardLayout title={t('navigation.dashboard')}>
      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-glow"></div>
          <div className="stat-content">
            <div className="stat-label">{t('landing.mockup.total')} {t('navigation.documents')}</div>
            <div className="stat-value">
              {stats.totalDocuments}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-glow"></div>
          <div className="stat-content">
            <div className="stat-label">{t('landing.mockup.pending')}</div>
            <div className="stat-value">
              {stats.pendingTasks}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-glow"></div>
          <div className="stat-content">
            <div className="stat-label">Active Workflows</div>
            <div className="stat-value">
              {stats.activeWorkflows}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-glow"></div>
          <div className="stat-content">
            <div className="stat-label">System Status</div>
            <div className="stat-value">
              {isConnected ? 'Online' : 'Offline'}
              <div className={`w-2.5 h-2.5 rounded-full ml-auto ${isConnected ? 'bg-lp-green shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-lp-red shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Main Section - My Tasks */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">My Tasks</h2>
            <Link to="/workflow" className="text-[var(--lp-accent2)] text-sm hover:underline">
              {t('common.viewAll')}
            </Link>
          </div>
          <div className="section-content">
            {isLoading ? (
              <div className="py-20 flex justify-center"><LoadingSpinner /></div>
            ) : tasks.length === 0 ? (
              <div className="py-20 text-center text-[var(--lp-text3)]">
                <div className="text-4xl mb-4">✨</div>
                No pending tasks. You're all caught up!
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="task-item">
                    <div className="task-icon">📄</div>
                    <div className="task-info">
                      <div className="task-name">{task.document.filename}</div>
                      <div className="task-meta">
                        <span>Required role: {task.requiredRoleName}</span>
                        <span>•</span>
                        <span>{formatDate(task.createdAt)}</span>
                      </div>
                    </div>
                    <div className="task-actions">
                      <button 
                        onClick={() => handleTaskButtonClick(task, 'approve')}
                        className="lp-btn-primary py-1.5 px-3 text-xs"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleTaskButtonClick(task, 'reject')}
                        className="lp-btn-ghost py-1.5 px-3 text-xs hover:bg-lp-red/10 hover:text-lp-red"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Side Section - Recent Activity */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Recent Activity</h2>
          </div>
          <div className="section-content">
            {isLoading ? (
               <div className="py-10 flex justify-center"><LoadingSpinner /></div>
            ) : activities.length === 0 ? (
              <div className="py-10 text-center text-[var(--lp-text3)] text-sm">
                No recent activity.
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-dot" style={{ 
                      borderColor: activity.actionType.includes('APPROVED') || activity.actionType.includes('COMPLETED') ? 'var(--lp-green)' : 
                                  activity.actionType.includes('REJECTED') ? 'var(--lp-red)' : 'var(--lp-accent2)'
                    }}></div>
                    <div className="activity-content">
                      <div className="activity-text">
                        <b>{activity.performedBy}</b> {activity.description.toLowerCase()}
                        {activity.documentName && <span>: <b>{activity.documentName}</b></span>}
                      </div>
                      <div className="activity-time">{getRelativeTime(activity.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Modal */}
      <Modal 
        isOpen={showTaskModal} 
        onClose={() => setShowTaskModal(false)}
        title={taskAction.action === 'approve' ? 'Approve Task' : 'Reject Task'}
      >
        <div className="p-1">
          <p className="text-sm text-[var(--lp-text2)] mb-4">
            Document: <span className="text-[var(--lp-white)] font-medium">{selectedTask?.document.filename}</span>
          </p>
          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--lp-text2)] mb-2">
              Add a comment
            </label>
            <textarea
              className="input-field min-h-[100px]"
              value={taskAction.comment}
              onChange={(e) => setTaskAction({ ...taskAction, comment: e.target.value })}
              placeholder="Why are you taking this action?"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowTaskModal(false)}
              className="lp-btn-ghost py-2 px-4"
            >
              Cancel
            </button>
            <button
              onClick={() => selectedTask && handleTaskAction(selectedTask.id, taskAction.action)}
              className={`lp-btn-primary py-2 px-6 ${taskAction.action === 'reject' ? 'bg-lp-red hover:bg-lp-red/90 shadow-lp-red/20' : ''}`}
            >
              {taskAction.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default DashboardPage;