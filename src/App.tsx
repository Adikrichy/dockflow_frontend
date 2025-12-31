import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react'; // Изменено на type-only import
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useWebSocket } from './hooks/useWebSocket';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import DashboardPage from './pages/DashboardPage';
import DocumentsPage from './pages/DocumentsPage';
import WorkflowPage from './pages/WorkflowPage';
import CompanyPage from './pages/CompanyPage';
import ChatPage from './pages/ChatPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
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
  sendMessage: (channelId: number, content: string, type?: 'TEXT' | 'FILE' | 'SYSTEM') => void;
  joinChannel: (channelId: number) => void;
  leaveChannel: (channelId: number) => void;
  clearWorkflowEvents: () => void;
  clearChatMessages: () => void;
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
  try {
    const webSocketData = useWebSocket();
    return (
      <WebSocketContext.Provider value={webSocketData}>
        {children}
      </WebSocketContext.Provider>
    );
  } catch (error) {
    // Fallback if WebSocket hook fails - provide minimal context
    console.error('WebSocket initialization error:', error);
    const fallbackValue: WebSocketContextType = {
      isConnected: false,
      workflowEvents: [],
      chatMessages: [],
      subscribeToWorkflowInstance: () => { },
      unsubscribeFromWorkflowInstance: () => { },
      subscribeToChannel: () => { },
      unsubscribeFromChannel: () => { },
      sendMessage: () => { },
      joinChannel: () => { },
      leaveChannel: () => { },
      clearWorkflowEvents: () => { },
      clearChatMessages: () => { },
    };
    return (
      <WebSocketContext.Provider value={fallbackValue}>
        {children}
      </WebSocketContext.Provider>
    );
  }
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

function App() {
  return (
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
                path="/workflow"
                element={
                  <ProtectedRoute>
                    <WorkflowPage />
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
                path="/chat"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
