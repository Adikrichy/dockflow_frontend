import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Download,
  Save,
  Brain,
  Sparkles,
  ShieldCheck,
  Zap,
  ChevronRight,
  Info,
  Layout
} from 'lucide-react';

import type { ReportData } from '../types/reports';
import { reportsService } from '../services/reportsService';
import DashboardLayout from '../components/DashboardLayout';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

// --- Subcomponents ---

const AIInsightsSection = ({ companyId, timeFilter }: { companyId: number, timeFilter: string }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [displayedText, setDisplayedText] = useState('');

  const fetchInsights = async () => {
    if (!companyId) return;
    
    try {
      setStatus('LOADING');
      setInsight(null);
      setDisplayedText('');
      
      const data = await reportsService.getAiInsights(companyId, timeFilter);
      
      if (data.status === 'SUCCESS' && data.insights) {
        setInsight(data.insights);
        setStatus('SUCCESS');
      } else if (data.status === 'PENDING') {
        // Poll every 3 seconds if pending
        setTimeout(fetchInsights, 3000);
      } else if (data.status === 'ERROR') {
        setInsight("AI Assistant is currently unavailable. Please try again later.");
        setStatus('ERROR');
      }
    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
      setStatus('ERROR');
    }
  };

  // Reset to IDLE when filters change
  useEffect(() => {
    setStatus('IDLE');
    setInsight(null);
    setDisplayedText('');
  }, [companyId, timeFilter]);

  // Typing effect
  useEffect(() => {
    if (status === 'SUCCESS' && insight) {
      let i = 0;
      const timer = setInterval(() => {
        setDisplayedText(insight.slice(0, i));
        i++;
        if (i > insight.length) clearInterval(timer);
      }, 15);
      return () => clearInterval(timer);
    }
  }, [status, insight]);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 mb-8 text-white min-h-[160px] transition-all duration-500">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Brain className="h-32 w-32" />
      </div>
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <div className="bg-white/20 backdrop-blur-md p-2 rounded-lg">
              <Sparkles className="h-5 w-5 text-yellow-300" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">AI Insights & Analytics</h2>
            {status === 'LOADING' && (
              <div className="flex space-x-1 ml-4">
                <div className="h-1.5 w-1.5 bg-white/60 rounded-full animate-bounce"></div>
                <div className="h-1.5 w-1.5 bg-white/60 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="h-1.5 w-1.5 bg-white/60 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            )}
          </div>

          {(status === 'IDLE' || status === 'ERROR' || status === 'SUCCESS') && (
            <button
              onClick={fetchInsights}
              disabled={status === 'LOADING'}
              className="flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-sm font-bold transition-all group"
            >
              <Zap className={`h-4 w-4 ${status === 'IDLE' ? 'text-yellow-300' : 'text-white'}`} />
              {status === 'IDLE' ? 'Activate AI Assistant' : 'Refresh Insights'}
              <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
          )}
        </div>

        {status === 'IDLE' && (
          <div className="max-w-2xl">
            <p className="text-blue-100 text-lg font-medium mb-2">Ready to analyze your company's performance?</p>
            <p className="text-blue-200/80 text-sm leading-relaxed">
              Click the button above to generate a deep-dive analysis of your document workflows, 
              identify bottlenecks, and get actionable recommendations powered by DocFlow AI.
            </p>
          </div>
        )}

        {status === 'LOADING' && (
          <div className="space-y-3">
            <div className="h-4 bg-white/20 rounded-full w-3/4 animate-pulse"></div>
            <div className="h-4 bg-white/20 rounded-full w-1/2 animate-pulse"></div>
            <p className="text-blue-200 text-sm font-bold mt-4 animate-pulse tracking-widest uppercase">Synthesizing data patterns...</p>
          </div>
        )}

        {status === 'SUCCESS' && (
          <p className="text-blue-50 leading-relaxed text-lg font-medium max-w-4xl italic">
            "{displayedText}"
            <span className="inline-block w-1.5 h-5 bg-white ml-1 animate-blink"></span>
          </p>
        )}

        {status === 'ERROR' && (
          <div className="flex items-center gap-3 text-rose-200 bg-rose-500/20 p-4 rounded-xl border border-rose-500/30">
            <Info className="h-5 w-5" />
            <p className="font-semibold">Unable to generate insights at the moment. Please try again.</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
        .animate-blink { animation: blink 0.8s infinite; }
      `}</style>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color = "blue"
}: {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: any;
  color?: string;
}) => {
  const colorMap: any = {
    blue: "text-blue-600 bg-blue-50",
    emerald: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    rose: "text-rose-600 bg-rose-50",
    purple: "text-purple-600 bg-purple-50"
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl transition-colors duration-300 ${colorMap[color] || colorMap.blue}`}>
          <Icon className="h-6 w-6" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
            changeType === 'increase' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {changeType === 'increase' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 leading-none">{value}</p>
      </div>
    </div>
  );
};

// --- Main Page Component ---

const ReportsPage = () => {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [timeFilter, setTimeFilter] = useState('allTime');

  useEffect(() => {
    if (activeTab === 'saved') {
      loadSavedReports();
    } else {
      loadReportData();
    }
  }, [timeFilter, activeTab, currentCompany]);

  const loadSavedReports = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await reportsService.getSavedReports();
      setSavedReports(data);
    } catch (err) {
      console.error('Failed to load saved reports:', err);
      setError('Could not load saved reports.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadReportData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await reportsService.getReportData({ 
        timeRange: timeFilter,
        company: currentCompany?.companyId?.toString() 
      });
      setReportData(data);
    } catch (err) {
      console.error('Failed to load report data:', err);
      setError('Failed to load analytical data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: string = 'csv') => {
    try {
      const blob = await reportsService.exportReport({ 
        timeRange: timeFilter,
        company: currentCompany?.companyId?.toString()
      }, format);
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
    }
  };

  const handleSaveReport = async () => {
    const reportName = prompt('Enter a name for this report:');
    if (!reportName) return;

    try {
      await reportsService.saveReport(reportName, { timeRange: timeFilter });
      if (activeTab === 'saved') loadSavedReports();
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  if (isLoading && !reportData) {
    return (
      <DashboardLayout title={t('navigation.reports')}>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
            <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-600" />
          </div>
          <p className="mt-4 font-medium text-gray-500 animate-pulse">Analyzing company data...</p>
        </div>
      </DashboardLayout>
    );
  }


  const canViewAll = !!currentCompany && ((currentCompany as any).canViewReports || currentCompany.roleLevel >= 100);

  return (
    <DashboardLayout title={t('navigation.reports')}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <nav className="flex items-center text-sm font-medium text-gray-400 mb-2">
              <span>Analytics</span>
              <ChevronRight className="h-4 w-4 mx-1" />
              <span className="text-blue-600">{canViewAll ? 'Company' : 'Personal'}</span>
            </nav>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              {canViewAll ? 'Company Performance' : 'My Performance'}
            </h1>
            <p className="text-gray-500 mt-2 max-w-2xl font-medium">
              {canViewAll 
                ? 'Comprehensive overview of company-wide document workflows and team efficiency.'
                : 'Track your personal document activity and processing status in real-time.'}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
            {['summary', 'saved'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Global Filters & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-400 uppercase ml-2">Time Period:</span>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer transition-all hover:border-blue-300"
            >
              <option value="thisWeek">This Week</option>
              <option value="lastWeek">Last Week</option>
              <option value="thisMonth">This Month</option>
              <option value="allTime">All Time</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center px-5 py-2.5 text-blue-600 bg-white border border-blue-100 rounded-xl text-sm font-bold hover:bg-blue-50 transition-all shadow-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export {canViewAll ? 'Full' : 'Personal'} CSV
            </button>
            {canViewAll && (
              <button
                onClick={handleSaveReport}
                className="flex items-center px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-gray-200"
              >
                <Save className="h-4 w-4 mr-2" />
                Freeze Report
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center mb-8 animate-in slide-in-from-top-4 duration-300">
            <div className="bg-rose-100 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Info className="h-6 w-6 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-rose-900">Unable to load analytics</h3>
            <p className="text-rose-600/70 font-medium mb-4">{error}</p>
            <button 
              onClick={loadReportData}
              className="px-6 py-2 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200"
            >
              Try Again
            </button>
          </div>
        )}

        {activeTab === 'summary' && reportData && (
          <div className="animate-in fade-in duration-700">
            
            {/* AI Insights - Premium Banner (Only for Admins/CEO) */}
            {canViewAll && currentCompany && (
              <AIInsightsSection 
                companyId={currentCompany.companyId} 
                timeFilter={timeFilter} 
              />
            )}

            {/* Stat Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <StatCard
                title="Active Documents"
                value={reportData.totalDocuments}
                change={14}
                changeType="increase"
                icon={Layout}
                color="blue"
              />
              <StatCard
                title="Avg Velocity"
                value={`${reportData.averageProcessingTime}h`}
                change={8}
                changeType="decrease"
                icon={Zap}
                color="amber"
              />
              <StatCard
                title="Approved Rates"
                value={reportData.approvedDocuments}
                change={2}
                changeType="increase"
                icon={ShieldCheck}
                color="emerald"
              />
              <StatCard
                title="Total Edits"
                value={reportData.totalVersions}
                icon={Clock}
                color="purple"
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
              
              {/* Evolution Area Chart */}
              <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Activity Evolution</h2>
                    <p className="text-sm text-gray-400 font-medium mt-1">Status progression over the selected period</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-xs font-bold text-gray-500">
                      <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div> Approved
                    </div>
                    <div className="flex items-center text-xs font-bold text-gray-500">
                      <div className="h-3 w-3 rounded-full bg-amber-400 mr-2"></div> Pending
                    </div>
                  </div>
                </div>
                
                <div className="h-[340px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reportData.weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                        dy={10}
                        minTickGap={30}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="approved" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorApproved)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="pending" 
                        stroke="#fbbf24" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorPending)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Distribution Pie Chart */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Category Split</h2>
                <p className="text-sm text-gray-400 font-medium mb-8">Document distribution by type</p>
                
                <div className="h-[280px] w-full flex flex-col justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.documentTypes}
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        innerRadius={75}
                        outerRadius={95}
                        paddingAngle={8}
                        dataKey="count"
                        stroke="none"
                      >
                        {reportData.documentTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Custom Legend */}
                  <div className="mt-4 space-y-2">
                    {reportData.documentTypes.slice(0, 3).map((type, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-2.5 w-2.5 rounded-full mr-3" style={{ backgroundColor: type.color }}></div>
                          <span className="text-sm font-semibold text-gray-600">{type.type}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{type.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* User Activity Table - Only for Company View */}
            {canViewAll && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Team Contributors</h2>
                    <p className="text-sm text-gray-400 font-medium mt-1">Individual performance monitoring</p>
                  </div>
                  <Info className="h-5 w-5 text-gray-300" />
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Team Member</th>
                        <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Output</th>
                        <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Share</th>
                        <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Avg. Speed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reportData.userActivity.map((user, index) => (
                        <tr key={index} className="hover:bg-gray-50/80 transition-colors group">
                          <td className="px-8 py-5 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm mr-3 uppercase">
                                {user.userName.charAt(0)}
                              </div>
                              <span className="text-sm font-bold text-gray-900">{user.userName}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-gray-700 text-center">
                            {user.documentsProcessed} doc
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap text-center">
                            <div className="w-24 bg-gray-100 h-2 rounded-full overflow-hidden mx-auto">
                              <div 
                                className="bg-blue-600 h-full rounded-full" 
                                style={{ width: `${user.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 mt-1 block">{user.percentage}%</span>
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                            {user.processingTime}h
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'summary' && !reportData && !isLoading && !error && (
          <div className="bg-white rounded-3xl border-2 border-dashed border-gray-100 p-20 text-center">
            <div className="bg-gray-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Layout className="h-10 w-10 text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">No Analytics Data Found</h2>
            <p className="text-gray-400 max-w-md mx-auto mt-2 font-medium">
              We couldn't find any document activity for the selected time period and company. 
              Try adjusting your filters or uploading some documents.
            </p>
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedReports.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border-2 border-dashed border-gray-100 p-12 text-center">
                <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No cached reports</h3>
                <p className="text-gray-400 max-w-xs mx-auto mt-1">Use the "Freeze Report" button to save snapshots of your data.</p>
              </div>
            ) : savedReports.map((report) => (
              <div key={report.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-50 p-2 rounded-lg group-hover:bg-blue-600 transition-colors">
                    <Save className="h-5 w-5 text-blue-600 group-hover:text-white" />
                  </div>
                  <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest">Snapshot</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{report.name}</h3>
                <p className="text-xs font-bold text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded-md mb-4 uppercase">
                  {report.timeRange}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="text-xs font-medium text-gray-400">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => {
                      setTimeFilter(report.timeRange);
                      setActiveTab('summary');
                    }}
                    className="text-sm font-bold text-gray-900 hover:text-blue-600 flex items-center"
                  >
                    View Data <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </DashboardLayout>
  );
};

export default ReportsPage;

