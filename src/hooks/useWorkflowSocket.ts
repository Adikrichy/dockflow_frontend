// src/hooks/useWorkflowSocket.ts
import { useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useQueryClient } from '@tanstack/react-query';

let stompClient: Client | null = null;

export const useWorkflowSocket = (companyId: number | null) => {
    const queryClient = useQueryClient();
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        if (!companyId) return;

        // Не подключаемся повторно
        if (stompClient?.connected) {
            clientRef.current = stompClient;
            return;
        }

        const socket = new SockJS('/ws/chat'); // Убедись, что у тебя есть @EnableWebSocket в Spring
        stompClient = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            // debug: (str) => console.log(str), // Раскомментируй для отладки
        });

        stompClient.onConnect = () => {
            console.log('WebSocket подключён к компании', companyId);

            // Подписываемся на все события компании
            stompClient!.subscribe(`/topic/workflow/company/${companyId}`, (message) => {
                const event = JSON.parse(message.body);
                console.log('Получено событие:', event.type);

                // При любом событии — обновляем задачи
                queryClient.invalidateQueries({ queryKey: ['workflow', 'my-tasks'] });
                queryClient.invalidateQueries({ queryKey: ['workflow', 'tasks', 'company', companyId] });
                queryClient.invalidateQueries({ queryKey: ['workflow', 'templates', companyId] });

                // Можно добавить toast по типу события
                // if (event.type === 'TASK_CREATED') toast.info('Новая задача!');
            });
        };

        stompClient.onStompError = (frame) => {
            console.error('Ошибка STOMP:', frame.headers['message']);
        };

        stompClient.activate();
        clientRef.current = stompClient;

        // Отключаемся при размонтировании
        return () => {
            if (stompClient?.connected) {
                stompClient.deactivate();
                console.log('WebSocket отключён');
            }
        };
    }, [companyId, queryClient]);
};