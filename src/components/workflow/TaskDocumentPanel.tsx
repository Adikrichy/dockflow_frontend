import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    CircularProgress,
    Alert,
    Divider,
    TextField,
    Collapse,
} from '@mui/material';
import {
    Close as CloseIcon,
    CheckCircleOutline as ApproveIcon,
    HighlightOff as RejectIcon,
    Edit as EditIcon,
    Psychology as AiIcon,
    Chat as ChatIcon,
    Warning as WarningIcon,
    Save as SaveIcon,
} from '@mui/icons-material';
import {
    Fullscreen as FullscreenIcon,
    FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';
import { aiServiceAPI } from '../../services/aiService';
import type { AiAnalysisResponse } from '../../services/aiService';
import MarkdownResponse from '../MarkdownResponse';
import { documentService } from '../../services/documentService';
import { websocketService } from '../../services/websocketService';
import type { TaskResponse } from '../../types/workflow';

interface TaskDocumentPanelProps {
    task: TaskResponse;
    onApprove: () => void;
    onReject: () => void;
    onClose: () => void;
}

// Function to load OnlyOffice script
function loadOnlyOfficeScript(documentServerUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if ((window as any).DocsAPI) {
            resolve();
            return;
        }

        const scriptUrl = `${documentServerUrl}/web-apps/apps/api/documents/api.js`;
        const existing = document.querySelector(`script[src="${scriptUrl}"]`);
        if (existing) {
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject(new Error('Failed to load OnlyOffice script')));
            return;
        }

        const script = document.createElement('script');
        script.src = scriptUrl;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load OnlyOffice script'));
        document.body.appendChild(script);
    });
}

const TaskDocumentPanel: React.FC<TaskDocumentPanelProps> = ({
    task,
    onApprove,
    onReject,
    onClose,
}) => {
    const documentId = task.document?.id;
    const contentType = task.document?.contentType || '';
    const filename = task.document?.filename || 'Document';

    const isDocx = filename.toLowerCase().endsWith('.docx');
    const isEditable = contentType?.includes('wordprocessingml.document') || isDocx;

    const [mode, setMode] = useState<'preview' | 'edit'>(isEditable ? 'edit' : 'preview');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [sessionKey, setSessionKey] = useState<string | null>(null);
    const [config, setConfig] = useState<any | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [comment, setComment] = useState('');
    const [showCommentField, setShowCommentField] = useState(false);
    const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);

    // AI States
    const [aiResult, setAiResult] = useState<AiAnalysisResponse | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [activeAiTab, setActiveAiTab] = useState<'review' | 'chat'>('review');
    const [chatMessage, setChatMessage] = useState('');
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
            // Calculate new width: viewport width - mouse X position
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

    // Effect for WebSocket subscription
    useEffect(() => {
        if (!chatChannelId) return;

        console.log(`Subscribing to document AI chat channel: ${chatChannelId}`);
        websocketService.subscribeToChannel(chatChannelId, (message: any) => {
            console.log('Received AI chat message via WebSocket:', message);
            if (message.isAi) {
                setIsAiThinking(false);
                if (aiTimeoutRef.current) {
                    clearTimeout(aiTimeoutRef.current);
                    aiTimeoutRef.current = null;
                }

                // If it's an error from the AI server, mark the last user message as error
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
                    return; // Don't add the error message itself as a chat bubble
                }
            }
            setChatMessages(prev => {
                // 1. Check if we already have this exact real message (by DB ID)
                if (prev.some(m => m.id === message.id)) return prev;

                // 2. If it's a user message, try to replace an optimistic one with the same content
                if (!message.isAi) {
                    const optimisticIndex = prev.findIndex(m =>
                        !m.isAi && m.content === message.content && typeof m.id === 'number' && m.id > 1000000000000 // Simple check for Date.now() style temp IDs
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

                // 3. Otherwise, just append
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

    // Load chat history when sidebar opens and chat tab is active
    useEffect(() => {
        if (isSidebarOpen && activeAiTab === 'chat' && documentId) {
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
    }, [isSidebarOpen, activeAiTab, documentId]);

    // Update mode if task changes
    useEffect(() => {
        setMode(isEditable ? 'edit' : 'preview');
    }, [task.id, isEditable]);

    // Load preview for non-editable documents
    const loadPreview = useCallback(async () => {
        if (!documentId || isEditable) return; // Don't load preview for editable docs (prevents download)

        try {
            setIsLoading(true);
            setError(null);
            const blob = await documentService.getDocumentFile(documentId, true);

            // Force PDF type if filename ends with .pdf
            const finalBlob = filename.toLowerCase().endsWith('.pdf')
                ? blob.slice(0, blob.size, 'application/pdf')
                : blob;

            const url = URL.createObjectURL(finalBlob);
            setPreviewUrl(url);
        } catch (err) {
            console.error('Error loading preview:', err);
            setError(err instanceof Error ? err.message : 'Failed to load document');
        } finally {
            setIsLoading(false);
        }
    }, [documentId, filename, isEditable]);

    // Load OnlyOffice editor for editable documents
    const loadEditor = useCallback(async () => {
        if (!documentId) return;

        try {
            setIsLoading(true);
            setError(null);

            const session = await documentService.startEditSession(documentId);
            setSessionKey(session.sessionKey);

            const editorConfigResp = await documentService.getEditorConfig(session.sessionKey);
            setConfig(editorConfigResp.config);

            const documentServerUrl = editorConfigResp.config.documentServerUrl;
            if (!documentServerUrl) {
                throw new Error('documentServerUrl not found in config');
            }

            await loadOnlyOfficeScript(documentServerUrl);
        } catch (err) {
            console.error('Error loading editor:', err);
            setError(err instanceof Error ? err.message : 'Failed to load editor');
        } finally {
            setIsLoading(false);
        }
    }, [documentId]);

    // Initial load based on mode
    useEffect(() => {
        if (mode === 'preview' && !isEditable) {
            loadPreview();
        } else if (mode === 'edit' && isEditable) {
            loadEditor();
        }

        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [mode, isEditable, loadPreview, loadEditor]);

    // Initialize OnlyOffice editor when config is ready
    useEffect(() => {
        if (!config || mode !== 'edit' || !(window as any).DocsAPI) return;

        const containerId = `task-onlyoffice-editor-${task.id}`;
        // Brief timeout to ensure DOM is ready and prevent potential race conditions
        const timer = setTimeout(() => {
            const el = document.getElementById(containerId);
            if (!el) return;

            el.innerHTML = '';

            try {
                const DocEditor = (window as any).DocsAPI.DocEditor;
                const enhancedConfig = {
                    ...config,
                    width: '100%',
                    height: '100%',
                    type: isFullscreen ? 'desktop' : 'embedded',
                };

                new DocEditor(containerId, enhancedConfig);

                // No easy cleanup for DocEditor without instance reference storage
                // but innerHTML='' handles the DOM part
            } catch (e) {
                console.error('Failed to create editor:', e);
                setError(e instanceof Error ? e.message : String(e));
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [config, mode, task.id, isFullscreen]);

    const handleSaveVersion = async () => {
        if (!sessionKey) return;
        try {
            await documentService.commitEditSession(sessionKey, 'Edited during workflow review');
            setMode('preview');
            loadPreview();
        } catch (e) {
            alert(e instanceof Error ? e.message : String(e));
        }
    };

    const handleApproveClick = () => {
        setPendingAction('approve');
        setShowCommentField(true);
    };

    const handleRejectClick = () => {
        setPendingAction('reject');
        setShowCommentField(true);
    };

    const handleConfirmAction = () => {
        if (pendingAction === 'approve') {
            onApprove();
        } else if (pendingAction === 'reject') {
            onReject();
        }
        setShowCommentField(false);
        setPendingAction(null);
        setComment('');
    };

    const handleCancelAction = () => {
        setShowCommentField(false);
        setPendingAction(null);
        setComment('');
    };

    const panelHeight = isFullscreen ? '90vh' : '600px';

    const handleRunAiReview = async () => {
        if (!documentId) return;
        try {
            setIsAiLoading(true);
            const docVersionId = (task.document as any).versionId;

            const response = await aiServiceAPI.startDocumentReview(documentId, docVersionId);
            setIsSidebarOpen(true);
            startPollingAiResult(documentId, response.version_id || docVersionId);
        } catch (err) {
            console.error('AI Review failed:', err);
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

        // Optimistic UI for User Message
        const tempId = Date.now();
        const userMsg = {
            id: tempId,
            sender: 'Вы',
            content: content,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isAi: false,
            status: 'sent'
        };

        setChatMessages(prev => [...prev, userMsg]);
        setIsAiThinking(true);

        // Set 1-minute timeout
        if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = setTimeout(() => {
            setIsAiThinking(false);
            setChatMessages(prev => {
                const newMsgs = [...prev];
                // Find the last message from user and mark it as error
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
            const docVersionId = (task.document as any).versionId;
            const response = await aiServiceAPI.sendDocumentChatMessage(
                documentId,
                docVersionId,
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
            // Mark last message as error immediately on network failure
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
        // Remove the error message and try again
        setChatMessages(prev => prev.filter(m => !(m.content === content && m.status === 'error')));
        handleSendChatMessage(content);
    };

    const parsedAiResult = aiResult?.raw_result ? JSON.parse(aiResult.raw_result) : null;

    return (
        <Paper
            elevation={3}
            sx={{
                width: '100%',
                borderRadius: '12px',
                overflow: 'hidden',
                mt: 2,
                mb: 2,
                transition: 'all 0.3s ease',
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    bgcolor: '#1e293b',
                    color: 'white',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {filename}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {mode === 'edit' ? 'Editing' : 'Preview'}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isEditable && mode === 'preview' && (
                        <Button
                            size="small"
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={() => setMode('edit')}
                            sx={{
                                bgcolor: '#3b82f6',
                                '&:hover': { bgcolor: '#2563eb' },
                                textTransform: 'none',
                            }}
                        >
                            Edit
                        </Button>
                    )}

                    {mode === 'edit' && (
                        <Button
                            size="small"
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={handleSaveVersion}
                            sx={{
                                bgcolor: '#10b981',
                                '&:hover': { bgcolor: '#059669' },
                                textTransform: 'none',
                            }}
                        >
                            Save Version
                        </Button>
                    )}

                    <IconButton
                        size="small"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        sx={{ color: 'white' }}
                    >
                        {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                    </IconButton>

                    <IconButton
                        size="small"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        sx={{ color: isSidebarOpen ? '#3b82f6' : 'white' }}
                    >
                        <AiIcon />
                    </IconButton>

                    <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* Content Area with Sidebar */}
            <Box sx={{ display: 'flex', height: panelHeight, position: 'relative' }}>
                <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                    {isLoading && (
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'rgba(255,255,255,0.9)',
                                zIndex: 10,
                            }}
                        >
                            <CircularProgress />
                        </Box>
                    )}

                    {error && (
                        <Box sx={{ p: 3 }}>
                            <Alert severity="error">{error}</Alert>
                        </Box>
                    )}

                    {!isLoading && !error && mode === 'preview' && previewUrl && (
                        <iframe
                            src={previewUrl}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            title="Document Preview"
                        />
                    )}

                    {!isLoading && !error && mode === 'edit' && (
                        <div id={`task-onlyoffice-editor-${task.id}`} style={{ width: '100%', height: '100%' }} />
                    )}
                </Box>

                {/* AI Sidebar */}
                {isSidebarOpen && (
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
                                                            color: '#0ea5e9' // Azure blue for AI name
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
                                            color="primary"
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
                )}
            </Box>

            {/* Action Bar */}
            <Divider />
            <Box
                sx={{
                    p: 2,
                    bgcolor: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    Task: {task.requiredRoleName} • Step {task.stepOrder}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Collapse in={showCommentField} orientation="horizontal">
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mr: 2 }}>
                            <TextField
                                size="small"
                                placeholder="Add comment (optional)"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                sx={{ width: 250 }}
                            />
                            <Button
                                variant="contained"
                                size="small"
                                color={pendingAction === 'approve' ? 'success' : 'error'}
                                onClick={handleConfirmAction}
                            >
                                Confirm
                            </Button>
                            <Button variant="outlined" size="small" onClick={handleCancelAction}>
                                Cancel
                            </Button>
                        </Box>
                    </Collapse>

                    {!showCommentField && task.status === 'IN_PROGRESS' && (
                        <>
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<ApproveIcon />}
                                onClick={handleApproveClick}
                                sx={{ textTransform: 'none', borderRadius: '8px' }}
                            >
                                Approve
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                startIcon={<RejectIcon />}
                                onClick={handleRejectClick}
                                sx={{ textTransform: 'none', borderRadius: '8px' }}
                            >
                                Reject
                            </Button>
                        </>
                    )}
                </Box>
            </Box>
        </Paper>
    );
};

export default TaskDocumentPanel;
