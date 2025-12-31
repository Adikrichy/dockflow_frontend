import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { websocketService } from '../services/websocketService';
import type { WorkflowEvent, ChatMessage } from '../services/websocketService';

export const useWebSocket = () => {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [workflowEvents, setWorkflowEvents] = useState<WorkflowEvent[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const connect = useCallback(async () => {
    if (isAuthenticated && user && !isConnected) {
      try {
        await websocketService.connect(user.id);

        // Subscribe to workflow events for user's company
        // Note: company in User is a string (name), not an ID
        // If you need company-specific subscriptions, you'll need to add companyId to User type
        // For now, we only subscribe to personal notifications

        // Subscribe to personal workflow notifications
        websocketService.subscribeToUserNotifications(user.id, (event) => {
          console.log('Personal workflow notification:', event);
          setWorkflowEvents(prev => [event, ...prev.slice(0, 49)]);
        });

        setIsConnected(true);
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
      }
    }
  }, [isAuthenticated, user, isConnected]);

  const disconnect = useCallback(() => {
    websocketService.disconnect();
    setIsConnected(false);
  }, []);

  const subscribeToWorkflowInstance = useCallback((instanceId: number) => {
    websocketService.subscribeToWorkflowInstance(instanceId, (event: WorkflowEvent) => {
      console.log('Workflow instance event:', event);
      setWorkflowEvents(prev => [event, ...prev.slice(0, 49)]);
    });
  }, []);

  const unsubscribeFromWorkflowInstance = useCallback((instanceId: number) => {
    websocketService.unsubscribeFromWorkflowInstance(instanceId);
  }, []);

  const subscribeToChannel = useCallback((channelId: number, callback?: (message: ChatMessage) => void) => {
    websocketService.subscribeToChannel(channelId, (message) => {
      console.log('Chat message received:', message);
      setChatMessages(prev => [message, ...prev.slice(0, 99)]); // Keep last 100 messages globally
      if (callback) callback(message);
    });
  }, []);

  const unsubscribeFromChannel = useCallback((channelId: number) => {
    websocketService.unsubscribeFromChannel(channelId);
  }, []);

  const sendMessage = useCallback((channelId: number, content: string, senderId?: number) => {
    websocketService.sendMessage(channelId, content, senderId);
  }, []);

  // Use empty stubs for join/leave if not needed by STOMP currently, or update signatures
  const joinChannel = useCallback((channelId: number) => {
    // websocketService.joinChannel(channelId); // Method removed or needs update in service
    console.debug("Join channel stub", channelId);
  }, []);

  const leaveChannel = useCallback((channelId: number) => {
    // websocketService.leaveChannel(channelId); // Method removed or needs update in service
    console.debug("Leave channel stub", channelId);
  }, []);

  // Auto-connect/disconnect based on authentication state
  useEffect(() => {
    if (isAuthenticated && user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  const clearWorkflowEvents = useCallback(() => setWorkflowEvents([]), []);
  const clearChatMessages = useCallback(() => setChatMessages([]), []);

  return {
    isConnected,
    workflowEvents,
    chatMessages,
    connect,
    disconnect,
    subscribeToWorkflowInstance,
    unsubscribeFromWorkflowInstance,
    subscribeToChannel,
    unsubscribeFromChannel,
    sendMessage,
    joinChannel,
    leaveChannel,
    clearWorkflowEvents,
    clearChatMessages,
  };
};

