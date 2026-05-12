import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { Component, createContext, useContext } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode, ErrorInfo } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SidebarProvider } from './context/SidebarContext';
import { useWebSocket } from './hooks/useWebSocket';
import { createTheme, ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { useMemo } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import DashboardPage from './pages/DashboardPage';
import DocumentsPage from './pages/DocumentsPage';
import DocumentEditPage from './pages/DocumentEditPage';
import WorkflowPage from './pages/WorkflowPage';
import CompanyPage from './pages/CompanyPage';
import ChatPage from './pages/ChatPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import KanbanPage from './pages/KanbanPage';
import ReportsPage from './pages/ReportsPage';
import AISettingsPage from './pages/AISettingsPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import LandingPage from './pages/LandingPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import LoadingSpinner from './components/LoadingSpinner';
import type { WorkflowEvent, ChatMessage } from './services/websocketService';

interface WebSocketContextType {
  isConnected: boolean;
  workflowEvents: WorkflowEvent[];
  chatMessages: ChatMessage[];
  subscribeToWorkflowInstance: (instanceId: number) => void;
  unsubscribeFromWorkflowInstance: (instanceId: number) => void;
  subscribeToChannel: (channelId: number, callback?: (message: ChatMessage) => void) => void;
  unsubscribeFromChannel: (channelId: number) => void;
  sendMessage: (channelId: number, content: string, type?: 'TEXT' | 'FILE' | 'SYSTEM' | 'CHAT') => void;
  joinChannel: (channelId: number) => void;
  leaveChannel: (channelId: number) => void;
  clearWorkflowEvents: () => void;
  clearChatMessages: () => void;
}


class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "50px", textAlign: "center", background: "#fff", height: "100vh" }}>
          <h2 style={{ color: "#d32f2f" }}>Something went wrong.</h2>
          <pre style={{ textAlign: "left", background: "#f5f5f5", padding: "20px", marginTop: "20px", whiteSpace: "pre-wrap" }}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: "20px", padding: "10px 20px", cursor: "pointer", background: "#1976d2", color: "#fff", border: "none", borderRadius: "4px" }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};

const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const webSocketData = useWebSocket();

  return (
    <WebSocketContext.Provider value={webSocketData}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Protected Route component
const ProtectedRoute = ({ children, requireCompany = false }: { children: React.ReactNode, requireCompany?: boolean }) => {
  const { isAuthenticated, currentCompany, isLoading } = useAuth();

  console.log('ProtectedRoute: render', { isAuthenticated, currentCompany: !!currentCompany, isLoading });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireCompany && !currentCompany) {
    return <Navigate to="/company" replace />;
  }

  return <>{children}</>;
};

const queryClient = new QueryClient();

// Component to handle home route logic
const HomeRedirect = () => {
  const { isAuthenticated, currentCompany, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  
  if (!isAuthenticated) return <LandingPage />;
  
  return currentCompany ? <Navigate to="/dashboard" replace /> : <Navigate to="/company" replace />;
};

const MuiThemeWrapper = ({ children }: { children: ReactNode }) => {
  const { theme } = useTheme();

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: theme,
          primary: {
            main: '#2f6ef5',
          },
          background: {
            default: theme === 'dark' ? '#0a0c10' : '#f8fafc',
            paper: theme === 'dark' ? '#111318' : '#ffffff',
          },
          text: {
            primary: theme === 'dark' ? '#e8eaf0' : '#1e293b',
            secondary: theme === 'dark' ? '#8b92a8' : '#475569',
          },
        },
        shape: {
          borderRadius: 12,
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 600,
              },
            },
          },
        },
      }),
    [theme]
  );

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <ThemeProvider>
          <MuiThemeWrapper>
            <AuthProvider>
              <SidebarProvider>
                <WebSocketProvider>
                <Router>
                  <div className="min-h-screen bg-lp-bg transition-colors duration-300 text-lp-text">
                    <Routes>
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/verify-email" element={<EmailVerificationPage />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/reset-password" element={<ResetPasswordPage />} />
                      <Route path="/" element={<HomeRedirect />} />
                      <Route path="/accept-invite" element={<AcceptInvitePage />} />
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute requireCompany={true}>
                            <DashboardPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/documents"
                        element={
                          <ProtectedRoute requireCompany={true}>
                            <DocumentsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/documents/:id/edit"
                        element={
                          <ProtectedRoute requireCompany={true}>
                            <DocumentEditPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/workflow"
                        element={
                          <ProtectedRoute requireCompany={true}>
                            <WorkflowPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/workflow/template/:templateId/edit"
                        element={
                          <ProtectedRoute requireCompany={true}>
                            <WorkflowPage initialEditorOpen={true} />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/company"
                        element={
                          <ProtectedRoute>
                            <CompanyPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/kanban"
                        element={
                          <ProtectedRoute requireCompany={true}>
                            <KanbanPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/chat"
                        element={
                          <ProtectedRoute requireCompany={true}>
                            <ChatPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/reports"
                        element={
                          <ProtectedRoute requireCompany={true}>
                            <ReportsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/ai-settings"
                        element={
                          <ProtectedRoute requireCompany={true}>
                            <AISettingsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile-settings"
                        element={
                          <ProtectedRoute>
                            <ProfileSettingsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </div>
                </Router>
              </WebSocketProvider>
              </SidebarProvider>
            </AuthProvider>
          </MuiThemeWrapper>
        </ThemeProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
