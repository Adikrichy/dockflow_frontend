import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useWebSocketContext } from '../App';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  Users,
  Building,
  Tag,
  Download,
  Save,
  TrendingUp,
  TrendingDown,
  Clock
} from 'lucide-react';

import type { ReportData } from '../types/reports';
import { reportsService } from '../services/reportsService';

const ReportsPage = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useWebSocketContext();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [timeFilter, setTimeFilter] = useState('thisWeek');

  useEffect(() => {
    if (activeTab === 'saved') {
      loadSavedReports();
    } else {
      loadReportData();
    }
  }, [timeFilter, activeTab]);

  const loadSavedReports = async () => {
    try {
      setIsLoading(true);
      const data = await reportsService.getSavedReports();
      setSavedReports(data);
    } catch (error) {
      console.error('Failed to load saved reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReportData = async () => {
    try {
      setIsLoading(true);
      const data = await reportsService.getReportData({ timeRange: timeFilter });
      setReportData(data);
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleExport = async (format: string = 'csv') => {
    try {
      const blob = await reportsService.exportReport({ timeRange: timeFilter }, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report');
    }
  };

  const handleSaveReport = async () => {
    const reportName = prompt('Enter a name for this report:');
    if (!reportName) return;

    try {
      await reportsService.saveReport(reportName, { timeRange: timeFilter });
      alert('Report saved successfully!');
      if (activeTab === 'saved') loadSavedReports();
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save report');
    }
  };

  const StatCard = ({
    title,
    value,
    change,
    changeType,
    icon: Icon
  }: {
    title: string;
    value: string | number;
    change?: number;
    changeType?: 'increase' | 'decrease';
    icon: any;
  }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-2">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
              {changeType === 'increase' ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {Math.abs(change)}% from last week
            </div>
          )}
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load report data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-gray-900">DocFlow</Link>
              <nav className="ml-10 flex space-x-8">
                <Link to="/documents" className="text-gray-500 hover:text-gray-900">Documents</Link>
                <Link to="/workflow" className="text-gray-500 hover:text-gray-900">Workflow</Link>
                <Link to="/company" className="text-gray-500 hover:text-gray-900">Company</Link>
                <Link to="/reports" className="text-blue-600 font-medium">Reports</Link>
              </nav>
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
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <div className="flex space-x-1 mt-4 border-b border-gray-200">
            {['summary', 'detailed', 'weekly', 'saved'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize ${activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="thisWeek">This week</option>
              <option value="lastWeek">Last week</option>
              <option value="thisMonth">This month</option>
              <option value="thisYear">This year</option>
            </select>

            <button className="flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
              <Users className="h-4 w-4 mr-2" />
              Team
            </button>

            <button className="flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
              <Building className="h-4 w-4 mr-2" />
              Company
            </button>

            <button className="flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
              <Tag className="h-4 w-4 mr-2" />
              Tag
            </button>

            <div className="flex-1"></div>

            <button
              onClick={() => handleExport('csv')}
              className="flex items-center px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>

            <button
              onClick={handleSaveReport}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save report
            </button>
          </div>
        </div>

        {/* Main Content Areas based on tabs */}
        {activeTab === 'summary' && reportData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Documents"
                value={reportData.totalDocuments}
                change={20}
                changeType="increase"
                icon={Clock}
              />
              <StatCard
                title="Total Versions"
                value={reportData.totalVersions}
                change={5}
                changeType="increase"
                icon={Clock}
              />
              <StatCard
                title="Pending Documents"
                value={reportData.pendingDocuments}
                change={-5}
                changeType="decrease"
                icon={Clock}
              />
              <StatCard
                title="Approved Documents"
                value={reportData.approvedDocuments}
                change={12}
                changeType="increase"
                icon={Clock}
              />
              <StatCard
                title="Avg Processing Time"
                value={`${reportData.averageProcessingTime}h`}
                change={-8}
                changeType="decrease"
                icon={Clock}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Weekly Activity Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">This Week Activity</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="approved" fill="#10b981" name="Approved" />
                    <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                    <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Document Types Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Types</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.documentTypes}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {reportData.documentTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* User Activity Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">User Activity</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Documents Processed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Processing Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.userActivity.map((user, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.userName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.documentsProcessed}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.percentage}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.processingTime}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'saved' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Saved Report Configurations</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameters</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {savedReports.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No saved reports found</td>
                    </tr>
                  ) : savedReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Range: <span className="capitalize">{report.timeRange}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.createdBy}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => {
                            setTimeFilter(report.timeRange);
                            setActiveTab('summary');
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Load
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ReportsPage;
