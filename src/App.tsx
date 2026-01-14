import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { Component, createContext, useContext } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode, ErrorInfo } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useWebSocket } from './hooks/useWebSocket';
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
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  console.log('ProtectedRoute: render', { isAuthenticated, isLoading });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AuthProvider>
          <WebSocketProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/verify-email" element={<EmailVerificationPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/documents"
                    element={
                      <ProtectedRoute>
                        <DocumentsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/documents/:id/edit"
                    element={
                      <ProtectedRoute>
                        <DocumentEditPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/workflow"
                    element={
                      <ProtectedRoute>
                        <WorkflowPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/workflow/template/:templateId/edit"
                    element={
                      <ProtectedRoute>
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
                      <ProtectedRoute>
                        <KanbanPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/chat"
                    element={
                      <ProtectedRoute>
                        <ChatPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute>
                        <ReportsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </Router>
          </WebSocketProvider>
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
