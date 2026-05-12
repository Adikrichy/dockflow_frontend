import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    CircularProgress,
    Alert,
    TextField,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
    Close as CloseIcon,
    Psychology as AiIcon,
    Chat as ChatIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import { aiServiceAPI } from '../services/aiService';
import type { AiAnalysisResponse } from '../services/aiService';
import MarkdownResponse from './MarkdownResponse';
import { websocketService } from '../services/websocketService';

interface DocumentAiSidebarProps {
    documentId: number;
    versionId: number;
    isOpen: boolean;
    onClose?: () => void;
}

const DocumentAiSidebar: React.FC<DocumentAiSidebarProps> = ({
    documentId,
    versionId,
    isOpen,
    onClose,
}) => {
    const { t } = useTranslation();
    const [aiResult, setAiResult] = useState<AiAnalysisResponse | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [activeAiTab, setActiveAiTab] = useState<'review' | 'chat'>('review');
    const [chatMessage, setChatMessage] = useState('');
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [chatChannelId, setChatChannelId] = useState<number | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(400);
    const [isResizing, setIsResizing] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const aiTimeoutRef = useRef<any>(null);

    // Resizing logic
    const startResizing = useCallback(() => {
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((mouseMoveEvent: MouseEvent) => {
        if (isResizing) {
            const newWidth = window.innerWidth - mouseMoveEvent.clientX;
            if (newWidth > 300 && newWidth < 800) {
                setSidebarWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        } else {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing, resize, stopResizing]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, isAiThinking]);

    // WebSocket subscription for chat
    useEffect(() => {
        if (!chatChannelId) return;

        websocketService.subscribeToChannel(chatChannelId, (message: any) => {
            if (message.isAi) {
                setIsAiThinking(false);
                if (aiTimeoutRef.current) {
                    clearTimeout(aiTimeoutRef.current);
                    aiTimeoutRef.current = null;
                }

                if (message.status === 'error') {
                    setChatMessages(prev => {
                        const newMsgs = [...prev];
                        for (let i = newMsgs.length - 1; i >= 0; i--) {
                            if (!newMsgs[i].isAi) {
                                newMsgs[i] = { ...newMsgs[i], status: 'error' };
                                break;
                            }
                        }
                        return newMsgs;
                    });
                    return;
                }
            }
            setChatMessages(prev => {
                if (prev.some(m => m.id === message.id)) return prev;

                if (!message.isAi) {
                    const optimisticIndex = prev.findIndex(m =>
                        !m.isAi && m.content === message.content && typeof m.id === 'number' && m.id > 1000000000000
                    );
                    if (optimisticIndex !== -1) {
                        const newMessages = [...prev];
                        newMessages[optimisticIndex] = {
                            id: message.id,
                            sender: message.senderName,
                            content: message.content,
                            timestamp: new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            isAi: false
                        };
                        return newMessages;
                    }
                }

                return [...prev, {
                    id: message.id,
                    sender: message.senderName,
                    content: message.content,
                    timestamp: new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isAi: !!message.isAi
                }];
            });
        });

        return () => {
            websocketService.unsubscribeFromChannel(chatChannelId);
        };
    }, [chatChannelId]);

    // Load chat history
    useEffect(() => {
        if (isOpen && activeAiTab === 'chat' && documentId) {
            const fetchHistory = async () => {
                try {
                    const history = await aiServiceAPI.getDocumentChatHistory(documentId);
                    setChatMessages(history.map(m => ({
                        id: m.id,
                        sender: m.senderName,
                        content: m.content,
                        timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        isAi: m.isAi === true || m.ai === true
                    })));

                    if (history.length > 0 && history[0].channelId) {
                        setChatChannelId(history[0].channelId);
                    }
                } catch (error) {
                    console.error('Failed to fetch chat history:', error);
                }
            };
            fetchHistory();
        }
    }, [isOpen, activeAiTab, documentId]);

    const handleRunAiReview = async () => {
        try {
            setIsAiLoading(true);
            const response = await aiServiceAPI.startDocumentReview(documentId, versionId);
            startPollingAiResult(documentId, response.version_id || versionId);
        } catch (err) {
            console.error('AI Review failed:', err);
            setIsAiLoading(false);
        }
    };

    const startPollingAiResult = (docId: number, verId: number) => {
        const interval = setInterval(async () => {
            try {
                const result = await aiServiceAPI.getAnalysisResult(docId, verId);
                if (result.status === 'SUCCESS' || result.status === 'ERROR') {
                    setAiResult(result);
                    setIsAiLoading(false);
                    clearInterval(interval);
                }
            } catch (e) {
                console.error('Polling AI failed:', e);
            }
        }, 3000);
    };

    const handleSendChatMessage = async (overriddenText?: string) => {
        const textToUse = overriddenText || chatMessage;
        if (!textToUse.trim() || !documentId) return;

        const content = textToUse.trim();
        if (!overriddenText) setChatMessage('');

        const tempId = Date.now();
        const userMsg = {
            id: tempId,
            sender: t('ai.you', 'Вы'),
            content: content,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isAi: false,
            status: 'sent'
        };

        setChatMessages(prev => [...prev, userMsg]);
        setIsAiThinking(true);

        if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = setTimeout(() => {
            setIsAiThinking(false);
            setChatMessages(prev => {
                const newMsgs = [...prev];
                for (let i = newMsgs.length - 1; i >= 0; i--) {
                    if (!newMsgs[i].isAi) {
                        newMsgs[i] = { ...newMsgs[i], status: 'error' };
                        break;
                    }
                }
                return newMsgs;
            });
        }, 60000);

        try {
            const response = await aiServiceAPI.sendDocumentChatMessage(
                documentId,
                versionId,
                content
            );

            if (response.channelId && chatChannelId !== response.channelId) {
                setChatChannelId(response.channelId);
            }
        } catch (error) {
            console.error('Failed to send AI chat message:', error);
            setIsAiThinking(false);
            if (aiTimeoutRef.current) {
                clearTimeout(aiTimeoutRef.current);
                aiTimeoutRef.current = null;
            }
            setChatMessages(prev => {
                const newMsgs = [...prev];
                for (let i = newMsgs.length - 1; i >= 0; i--) {
                    if (!newMsgs[i].isAi) {
                        newMsgs[i] = { ...newMsgs[i], status: 'error' };
                        break;
                    }
                }
                return newMsgs;
            });
        }
    };

    const handleResendChatMessage = (content: string) => {
        setChatMessages(prev => prev.filter(m => !(m.content === content && m.status === 'error')));
        handleSendChatMessage(content);
    };

    const parsedAiResult = useMemo(() => {
        if (!aiResult?.raw_result) return null;
        try {
            return JSON.parse(aiResult.raw_result);
        } catch (e) {
            console.error('Failed to parse AI result:', e);
            return null;
        }
    }, [aiResult]);

    if (!isOpen) return null;

    return (
        <Box
            sx={{
                width: `${sidebarWidth}px`,
                minWidth: `${sidebarWidth}px`,
                borderLeft: '1px solid #e2e8f0',
                bgcolor: 'white',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '-4px 0 10px rgba(0,0,0,0.05)',
                position: 'relative',
                height: '100%',
            }}
        >
            {/* Resizer Handle */}
            <Box
                onMouseDown={startResizing}
                sx={{
                    position: 'absolute',
                    left: -4,
                    top: 0,
                    bottom: 0,
                    width: 8,
                    cursor: 'col-resize',
                    zIndex: 10,
                    transition: 'background-color 0.2s',
                    '&:hover': {
                        bgcolor: 'rgba(59, 130, 246, 0.2)',
                    }
                }}
            />

            {/* Header */}
            <Box sx={{ p: 2, bgcolor: '#1e293b', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>AI Assistant</Typography>
                {onClose && (
                    <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                )}
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: '1px solid #e2e8f0', p: 1, display: 'flex' }}>
                <Button
                    fullWidth
                    size="small"
                    variant={activeAiTab === 'review' ? 'contained' : 'text'}
                    onClick={() => setActiveAiTab('review')}
                    sx={{ textTransform: 'none' }}
                >
                    AI Review
                </Button>
                <Button
                    fullWidth
                    size="small"
                    variant={activeAiTab === 'chat' ? 'contained' : 'text'}
                    onClick={() => setActiveAiTab('chat')}
                    sx={{ textTransform: 'none' }}
                >
                    AI Chat
                </Button>
            </Box>

            {activeAiTab === 'chat' && chatMessages.length > 0 && (
                <Box sx={{ px: 2, pt: 1 }}>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-purple-100 w-fit">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        Context Active
                    </div>
                </Box>
            )}

            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
                {activeAiTab === 'review' ? (
                    <Box>
                        {!aiResult && !isAiLoading && (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <AiIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 2 }} />
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Нужен быстрый анализ документа?
                                </Typography>
                                <Button
                                    variant="outlined"
                                    onClick={handleRunAiReview}
                                    startIcon={<AiIcon />}
                                    sx={{ mt: 1, textTransform: 'none' }}
                                >
                                    Запустить AI Анализ
                                </Button>
                            </Box>
                        )}

                        {isAiLoading && (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <CircularProgress size={24} sx={{ mb: 2 }} />
                                <Typography variant="body2">AI анализирует документ...</Typography>
                            </Box>
                        )}

                        {aiResult && parsedAiResult && (
                            <Box>
                                <Alert
                                    severity={parsedAiResult.approval_suggestion === 'approve' ? 'success' : 'warning'}
                                    sx={{ mb: 2 }}
                                >
                                    <Typography variant="subtitle2">Рекомендация AI:</Typography>
                                    <Typography variant="body2">{parsedAiResult.recommendation}</Typography>
                                </Alert>

                                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                                    <WarningIcon fontSize="small" sx={{ mr: 1, color: '#f59e0b' }} />
                                    Слабые места:
                                </Typography>

                                {parsedAiResult.weaknesses?.map((w: any, idx: number) => (
                                    <Paper key={idx} variant="outlined" sx={{ p: 1.5, mb: 1, borderLeft: `4px solid ${w.severity === 'high' ? '#ef4444' : '#f59e0b'}` }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{w.title}</Typography>
                                        <Typography variant="caption" color="textSecondary" display="block">{w.description}</Typography>
                                    </Paper>
                                ))}
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#f8fafc' }}>
                        <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {chatMessages.length === 0 && (
                                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 4 }}>
                                    Задайте вопрос AI по этому документу
                                </Typography>
                            )}
                            {chatMessages.map((msg, i) => (
                                <Box
                                    key={i}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: msg.isAi ? 'flex-start' : 'flex-end',
                                        maxWidth: '100%'
                                    }}
                                >
                                    {msg.isAi && (
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                ml: 1,
                                                mb: 0.5,
                                                fontWeight: 'bold',
                                                color: '#0ea5e9'
                                            }}
                                        >
                                            {msg.sender}
                                        </Typography>
                                    )}
                                    <Box
                                        sx={{
                                            p: 1.5,
                                            borderRadius: msg.isAi ? '2px 16px 16px 16px' : '16px 16px 2px 16px',
                                            bgcolor: msg.status === 'error' ? '#fef2f2' : (msg.isAi ? 'white' : '#3b82f6'),
                                            color: msg.status === 'error' ? '#ef4444' : (msg.isAi ? '#1e293b' : 'white'),
                                            maxWidth: '85%',
                                            boxShadow: msg.isAi ? '0 1px 2px rgba(0,0,0,0.1)' : '0 1px 2px rgba(59,130,246,0.3)',
                                            position: 'relative',
                                            border: msg.status === 'error' ? '1px solid #fee2e2' : 'none'
                                        }}
                                    >
                                        <MarkdownResponse content={msg.content} />

                                        {msg.status === 'error' && (
                                            <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <WarningIcon sx={{ fontSize: 12 }} />
                                                    <Typography sx={{ fontSize: 10, fontWeight: 'bold' }}>Error</Typography>
                                                </Box>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="error"
                                                    onClick={() => handleResendChatMessage(msg.content)}
                                                    sx={{ fontSize: 9, py: 0, minWidth: 'auto', textTransform: 'none', height: 18 }}
                                                >
                                                    Resend
                                                </Button>
                                            </Box>
                                        )}

                                        <Typography
                                            variant="caption"
                                            sx={{
                                                display: 'block',
                                                textAlign: 'right',
                                                mt: 0.5,
                                                fontSize: '0.65rem',
                                                opacity: 0.8,
                                                color: msg.isAi ? 'text.secondary' : 'white'
                                            }}
                                        >
                                            {msg.timestamp}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                            {isAiThinking && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mb: 2 }}>
                                    <Typography variant="caption" sx={{ ml: 1, mb: 0.5, fontWeight: 'bold', color: '#0ea5e9' }}>
                                        AI Assistant
                                    </Typography>
                                    <Box sx={{
                                        p: 1.5,
                                        borderRadius: '2px 16px 16px 16px',
                                        bgcolor: 'white',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                        display: 'flex',
                                        gap: 0.5,
                                        alignItems: 'center'
                                    }}>
                                        <Box sx={{ width: 6, height: 6, bgcolor: '#94a3b8', borderRadius: '50%', animation: 'pulse 1.5s infinite ease-in-out' }} />
                                        <Box sx={{ width: 6, height: 6, bgcolor: '#94a3b8', borderRadius: '50%', animation: 'pulse 1.5s infinite 0.2s ease-in-out' }} />
                                        <Box sx={{ width: 6, height: 6, bgcolor: '#94a3b8', borderRadius: '50%', animation: 'pulse 1.5s infinite 0.4s ease-in-out' }} />
                                    </Box>
                                    <style>{`
                                        @keyframes pulse {
                                            0%, 100% { transform: scale(1); opacity: 0.4; }
                                            50% { transform: scale(1.3); opacity: 1; }
                                        }
                                    `}</style>
                                </Box>
                            )}
                            <div ref={chatEndRef} />
                        </Box>
                        <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 1 }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Спросить AI..."
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendChatMessage();
                                    }
                                }}
                                autoFocus
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '20px' } }}
                            />
                            <IconButton
                                size="small"
                                onClick={() => handleSendChatMessage()}
                                sx={{ bgcolor: '#3b82f6', color: 'white', '&:hover': { bgcolor: '#2563eb' } }}
                            >
                                <ChatIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default DocumentAiSidebar;
