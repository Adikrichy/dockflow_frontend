import { Client } from '@stomp/stompjs';
import type { Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface WorkflowEvent {
  type: 'TASK_CREATED' | 'TASK_COMPLETED' | 'WORKFLOW_STARTED' | 'WORKFLOW_COMPLETED';
  workflowInstanceId: number;
  taskId?: number;
  userId?: number;
  timestamp: string;
  data?: any;
}

export interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  channelId: number;
  content: string;
  timestamp: string;
  type: 'TEXT' | 'FILE' | 'SYSTEM' | 'CHAT';
  edited?: boolean;
}

class WebSocketService {
  private client: Client | null = null;
  private connected: boolean = false;
  private subscriptions: Map<string, any> = new Map();

  constructor() {
    this.client = new Client({
      brokerURL: 'ws://localhost:8080/ws/chat',
      // If brokerURL doesn't work (Spring Boot often needs SockJS fallback), use webSocketFactory
      webSocketFactory: () => new SockJS('http://localhost:8080/ws/chat'),

      debug: (str) => {
        console.log('[STOMP]: ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = (frame) => {
      console.log('STOMP Connected: ' + frame);
      this.connected = true;
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    this.client.onWebSocketClose = () => {
      console.log('WebSocket Closed');
      this.connected = false;
    };
  }

  async connect(userId?: number): Promise<void> {
    if (this.connected) return;
    // userId can be used for debugging or passing headers if required by backend
    if (userId) console.log('[STOMP] Connecting for user:', userId);

    if (this.client) {
      this.client.activate();
    }
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.connected = false;
      this.subscriptions.clear();
    }
  }

  // Workflow Events
  subscribeToUserNotifications(userId: number, callback: (event: WorkflowEvent) => void) {
    if (!this.client || !this.connected) return;

    // STOMP destinations usually look like /user/topic/errors or /topic/public
    // Based on backend config: config.setUserDestinationPrefix("/user");
    // And assuming backend sends to SimpMessagingTemplate.convertAndSendToUser(userId, "/queue/notifications", ...)
    // The client subscribes to /user/queue/notifications

    // Note: Adjust destination matching your backend logic exactly. 
    // Usually standard is /user/queue/... for private messages
    const sub = this.client.subscribe(`/user/queue/workflow`, (message: Message) => {
      const event: WorkflowEvent = JSON.parse(message.body);
      callback(event);
    });
    this.subscriptions.set(`user-${userId}`, sub);
  }

  subscribeToWorkflowInstance(instanceId: number, callback: (event: WorkflowEvent) => void) {
    if (!this.client || !this.connected) return;

    const sub = this.client.subscribe(`/topic/workflow/instance/${instanceId}`, (message: Message) => {
      const event: WorkflowEvent = JSON.parse(message.body);
      callback(event);
    });
    this.subscriptions.set(`instance-${instanceId}`, sub);
  }

  unsubscribeFromWorkflowInstance(instanceId: number) {
    const key = `instance-${instanceId}`;
    if (this.subscriptions.has(key)) {
      this.subscriptions.get(key).unsubscribe();
      this.subscriptions.delete(key);
    }
  }

  // Chat System
  subscribeToChannel(channelId: number, callback: (message: ChatMessage) => void) {
    if (!this.client || !this.connected) return;

    // Backend sends to /topic/channel/{channelId}
    const sub = this.client.subscribe(`/topic/channel/${channelId}`, (message: Message) => {
      const chatMsg: ChatMessage = JSON.parse(message.body);
      callback(chatMsg);
    });
    this.subscriptions.set(`channel-${channelId}`, sub);
  }

  unsubscribeFromChannel(channelId: number) {
    const key = `channel-${channelId}`;
    if (this.subscriptions.has(key)) {
      this.subscriptions.get(key).unsubscribe();
      this.subscriptions.delete(key);
    }
  }

  sendMessage(channelId: number, content: string, type: string = 'CHAT') {
    if (!this.client || !this.connected) return;

    // Backend Controller: @MessageMapping("/chat.send/channelId/{channelId}")
    this.client.publish({
      destination: `/app/chat.send/channelId/${channelId}`,
      body: JSON.stringify({ content, type })
    });
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export const websocketService = new WebSocketService();
