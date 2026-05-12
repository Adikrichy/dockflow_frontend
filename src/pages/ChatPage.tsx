import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { chatService } from '../services/api';
import type { ChatChannelResponse } from '../services/api';
import { companyService } from '../services/companyService';
import LoadingSpinner from '../components/LoadingSpinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import DashboardLayout from '../components/DashboardLayout';
import { useTranslation } from 'react-i18next';

// --- Sub-components for Optimization ---

const MarkdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '');
        return !inline && match ? (
            <div className="my-3 rounded-lg overflow-hidden border border-lp-border shadow-sm text-left">
                <div className="bg-lp-surface3 px-4 py-1.5 text-[10px] text-lp-text3 font-mono flex justify-between items-center border-b border-lp-border">
                    <span>{match[1].toUpperCase()}</span>
                    <span className="opacity-50 text-[9px]">Code Block</span>
                </div>
                <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{
                        margin: 0,
                        padding: '1rem',
                        fontSize: '13px',
                        backgroundColor: 'var(--lp-surface)'
                    }}
                    {...props}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            </div>
        ) : (
            <code className={`${className} bg-lp-surface2 px-1.5 py-0.5 rounded text-[0.9em] font-mono text-lp-accent2`} {...props}>
                {children}
            </code>
        );
    },
    table: ({ children }: any) => (
        <div className="overflow-x-auto my-4 rounded-xl border border-lp-border shadow-sm">
            <table className="min-w-full divide-y divide-lp-border bg-lp-surface">
                {children}
            </table>
        </div>
    ),
    thead: ({ children }: any) => <thead className="bg-lp-surface2/50">{children}</thead>,
    th: ({ children }: any) => <th className="px-4 py-2.5 text-left text-[11px] font-bold text-lp-text3 uppercase tracking-widest border-b border-lp-border">{children}</th>,
    td: ({ children }: any) => <td className="px-4 py-3 text-sm text-lp-text2 border-b border-lp-border/50">{children}</td>,
    ul: ({ children }: any) => <ul className="list-disc ml-6 my-3 space-y-1.5">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal ml-6 my-3 space-y-1.5">{children}</ol>,
    li: ({ children }: any) => <li className="pl-1 leading-normal">{children}</li>,
    h1: ({ children }: any) => <h1 className="text-xl font-extrabold text-lp-text mt-6 mb-3 border-b border-lp-border pb-2">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-lg font-bold text-lp-text mt-5 mb-2.5">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-base font-bold text-lp-text2 mt-4 mb-2">{children}</h3>,
    p: ({ children }: any) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
    hr: () => <hr className="my-6 border-lp-border" />,
    blockquote: ({ children }: any) => (
        <blockquote className="border-l-4 border-lp-accent bg-lp-accent/5 px-4 py-2 italic my-4 rounded-r-lg text-lp-accent shadow-sm">
            {children}
        </blockquote>
    )
};

const MessageItem = React.memo(({ msg, isMe, isGroupStart, getSenderColor, handleResend, handleDeleteMessage }: any) => {
    return (
        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isGroupStart ? 'mt-4' : 'mt-1'}`}>
            <div className={`flex flex-col max-w-[85%] ${isMe ? 'items-end' : 'items-start'}`}>
                {isGroupStart && !isMe && (
                    <span className={`text-[12px] font-bold ${getSenderColor(msg.senderName)} ml-2 mb-0.5`}>
                        {msg.senderName}
                    </span>
                )}

                <div className={`relative px-4 py-3 shadow-sm transition-all duration-200 group ${isMe
                    ? `${msg.status === 'error' ? 'bg-lp-red/10 text-lp-red border border-lp-red/20' : 'bg-lp-accent text-white'} ${isGroupStart ? 'rounded-2xl rounded-tr-none' : 'rounded-2xl'}`
                    : `bg-lp-surface border border-lp-border/50 text-lp-text2 ${isGroupStart ? 'rounded-2xl rounded-tl-none' : 'rounded-2xl'}`
                    }`}>

                    <div className={`text-[14px] leading-[1.6] markdown-content overflow-hidden ${isMe ? 'prose-invert text-white' : 'text-lp-text'}`}>
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={MarkdownComponents}
                        >
                            {msg.content}
                        </ReactMarkdown>
                    </div>

                    {msg.status === 'error' && (
                        <div className="mt-2 flex items-center justify-between border-t border-lp-red/10 pt-2 text-left">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span>Something went wrong</span>
                            </div>
                            <button
                                onClick={() => handleResend(msg.content)}
                                className="text-[11px] bg-red-600 text-white px-2 py-0.5 rounded-md hover:bg-red-700 transition-colors font-bold uppercase tracking-wider"
                            >
                                Resend
                            </button>
                        </div>
                    )}

                    <div className={`mt-1 flex items-center justify-end gap-1 ${isMe ? (msg.status === 'error' ? 'text-red-400' : 'text-white/60') : 'text-lp-text3'}`}>
                        <span className="text-[9px] tabular-nums font-medium">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && (
                            <div className="flex -space-x-1">
                                {msg.status === 'sending' ? (
                                    <svg className="animate-spin h-2.5 w-2.5 text-white/50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : msg.status === 'error' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-red-300" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-2.5 w-2.5 ${msg.status === 'sent' ? 'text-white/80' : 'text-white/40'}`} viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-2.5 w-2.5 ${msg.status === 'sent' ? 'text-white/80' : 'text-white/40'}`} viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {isMe && msg.id && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-lp-surface rounded-full shadow-md border border-lp-border text-lp-text3 hover:text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                            title="Delete message"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

const ChatInput = ({ activeChannel, isConnected, onSend }: any) => {
    const [text, setText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim() && isConnected) {
            onSend(undefined, text.trim());
            setText('');
        }
    };

    return (
        <div className="p-6 bg-lp-surface border-t border-lp-border">
            <form onSubmit={handleSubmit} className="relative flex items-center gap-4">
                <div className="flex-1 relative group">
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={`Message ${activeChannel?.isPublic ? '#' : ''}${activeChannel?.name}...`}
                        className="w-full bg-lp-surface2 border-0 rounded-2xl px-6 py-4 pr-12 text-[15px] focus:ring-2 focus:ring-lp-accent/20 focus:bg-lp-surface transition-all duration-200 outline-none text-lp-text placeholder:text-lp-text3"
                    />
                    <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                </div>
                <button
                    type="submit"
                    disabled={!isConnected || !text.trim()}
                    className="h-14 w-14 flex items-center justify-center rounded-2xl bg-lp-accent text-white shadow-lg shadow-lp-accent/20 hover:bg-lp-accent2 disabled:opacity-50 disabled:shadow-none hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 rotate-90" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                </button>
            </form>
        </div>
    );
};

interface Message {
    id: number;
    senderId: number;
    senderName: string;
    senderEmail?: string;
    content: string;
    timestamp: string;
    edited?: boolean;
    isAi?: boolean;
    status?: 'sending' | 'sent' | 'error';
}

const ChatPage = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const { isConnected, subscribeToChannel, unsubscribeFromChannel, sendMessage, clearChatMessages } = useWebSocket();

    const [channels, setChannels] = useState<ChatChannelResponse[]>([]);
    const [dms, setDMs] = useState<ChatChannelResponse[]>([]);
    const [activeChannel, setActiveChannel] = useState<ChatChannelResponse | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [members, setMembers] = useState<any[]>([]);
    const [showMembers, setShowMembers] = useState(true);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const timeoutRef = useRef<any>(null);

    // Modals state
    const [showCreateChannel, setShowCreateChannel] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [showStartDM, setShowStartDM] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]); // UserResponse[]

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial Data Load
    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        try {
            const myCompany = await companyService.getCurrentCompany();
            if (myCompany) {
                const [companyChannels, userDMs] = await Promise.all([
                    chatService.getCompanyChannels(myCompany.id),
                    chatService.getUserDMs(myCompany.id)
                ]);
                setChannels(companyChannels);
                setDMs(userDMs);

                // Auto-select first channel or DM if none is active
                if (companyChannels.length > 0) {
                    setActiveChannel(companyChannels[0]);
                } else if (userDMs.length > 0) {
                    setActiveChannel(userDMs[0]);
                }
            }
        } catch (e) {
            console.error("Failed to load chat data", e);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Channel Selection
    useEffect(() => {
        if (!activeChannel) return;

        // Load history
        const loadHistory = async () => {
            try {
                const fullChannel = await chatService.getChannel(activeChannel.id);
                const history = fullChannel.messages.map((m: any) => ({
                    id: m.id,
                    senderId: m.senderId,
                    senderName: m.senderName,
                    content: m.content,
                    timestamp: m.createdAt,
                    edited: m.edited
                }));
                setMessages(history);
                clearChatMessages(); // Clear socket buffer
            } catch (e) {
                console.error("Failed to load history", e);
            }
        };

        const loadMembers = async () => {
            try {
                const companyMembers = await companyService.getCompanyMembers();
                setMembers(companyMembers);
            } catch (e) {
                console.error("Failed to load members", e);
            }
        };

        loadHistory();
        loadMembers();

        // Subscribe to socket with callback
        // Check if we are connected before subscribing
        if (isConnected) {
            subscribeToChannel(activeChannel.id, (msg: any) => {
                // If we receive a message from AI, stop thinking and clear timeout
                const isAi = msg.isAi ||
                    (aiUser && msg.senderId === aiUser.id) ||
                    msg.senderName === 'AI Assistant' ||
                    msg.senderEmail === 'ai@dockflow.com';

                if (isAi) {
                    setIsAiThinking(false);
                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                        timeoutRef.current = null;
                    }
                }

                setMessages(prev => {
                    // Check if this message already exists (optimistic update)
                    const existingIndex = prev.findIndex(m =>
                        (m.id === msg.id) ||
                        (m.status === 'sending' && m.content === msg.content && m.senderId === msg.senderId)
                    );

                    if (existingIndex !== -1) {
                        const newMsgs = [...prev];
                        newMsgs[existingIndex] = {
                            ...newMsgs[existingIndex],
                            id: msg.id,
                            timestamp: msg.timestamp,
                            status: 'sent',
                            edited: msg.edited
                        };
                        return newMsgs;
                    }

                    return [...prev, {
                        id: msg.id,
                        senderId: msg.senderId,
                        senderName: msg.senderName,
                        content: msg.content,
                        timestamp: msg.timestamp,
                        edited: msg.edited,
                        status: 'sent'
                    }];
                });
            });
        }

        return () => {
            unsubscribeFromChannel(activeChannel.id);
        };
    }, [activeChannel, isConnected, subscribeToChannel, unsubscribeFromChannel, clearChatMessages]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (_e?: React.FormEvent, text?: string) => {
        const content = text || '';

        if (activeChannel && content.trim() && isConnected) {
            // Optimistic update
            const tempId = Date.now();
            const optimisticMsg: Message = {
                id: tempId,
                senderId: user?.id || 0,
                senderName: user ? `${user.firstName} ${user.lastName}` : 'Me',
                content: content.trim(),
                timestamp: new Date().toISOString(),
                status: 'sending'
            };

            setMessages(prev => [...prev, optimisticMsg]);

            sendMessage(activeChannel.id, content.trim());

            // If talking to AI Assistant, start thinking indicator and timeout
            const isAiDM = activeChannel.name === 'AI Assistant' ||
                (aiUser && activeChannel.name === `${aiUser.firstName} ${aiUser.lastName}`);

            if (isAiDM) {
                setIsAiThinking(true);

                // Clear existing timeout if any
                if (timeoutRef.current) clearTimeout(timeoutRef.current);

                // Set 1-minute timeout
                timeoutRef.current = setTimeout(() => {
                    setIsAiThinking(false);
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        // Find the last message from user and mark it as error if AI didn't respond
                        for (let i = newMsgs.length - 1; i >= 0; i--) {
                            if (newMsgs[i].senderId === user?.id) {
                                newMsgs[i] = { ...newMsgs[i], status: 'error' };
                                break;
                            }
                        }
                        return newMsgs;
                    });
                }, 60000);
            }
        } else if (!isConnected) {
            alert("Connection lost. Please wait for reconnection.");
        }
    };

    const handleResend = (content: string) => {
        // Remove the error message and try again
        setMessages(prev => prev.filter(m => !(m.content === content && m.status === 'error')));
        handleSendMessage(undefined, content);
    };

    const handleDeleteMessage = async (messageId: number) => {
        if (!window.confirm("Are you sure you want to delete this message?")) return;
        try {
            await chatService.deleteMessage(messageId);
            setMessages(prev => prev.filter(m => m.id !== messageId));
        } catch (e) {
            console.error("Failed to delete message", e);
            alert("Failed to delete message");
        }
    };

    const handleDeleteChannel = async () => {
        if (!activeChannel) return;
        if (!window.confirm(`Are you sure you want to delete the entire chat with "${activeChannel.name}"? This action cannot be undone.`)) return;

        try {
            await chatService.deleteChannel(activeChannel.id);

            // Remove from local lists
            setChannels(prev => prev.filter(c => c.id !== activeChannel.id));
            setDMs(prev => prev.filter(c => c.id !== activeChannel.id));

            // Clear active channel
            setActiveChannel(null);
            setMessages([]);
        } catch (e) {
            console.error("Failed to delete channel", e);
            alert("Failed to delete channel");
        }
    };

    const [aiUser, setAiUser] = useState<any>(null);

    // Fetch AI User info
    useEffect(() => {
        const fetchAiUser = async () => {
            try {
                const data = await chatService.getAiUser();
                setAiUser(data);
            } catch (err) {
                console.error("Failed to fetch AI user", err);
            }
        };
        fetchAiUser();
    }, []);


    // Actions
    const handleCreateChannel = async () => {
        if (!newChannelName.trim()) return;
        try {
            const myCompany = await companyService.getCurrentCompany();
            if (!myCompany) return;

            const newChannel = await chatService.createChannel(myCompany.id, newChannelName);
            setChannels(prev => [...prev, newChannel]);
            setShowCreateChannel(false);
            setNewChannelName('');
            setActiveChannel(newChannel);
        } catch (e) {
            console.error("Failed to create channel", e);
            alert("Failed to create channel");
        }
    };

    const openStartDM = async () => {
        try {
            const users = await companyService.getCompanyMembers();
            // Filter out self
            const others = users.filter((u: any) => u.id !== user?.id);
            setAvailableUsers(others);
            setShowStartDM(true);
        } catch (e) {
            console.error("Failed to fetch users", e);
        }
    };

    const handleUserSelect = async (targetUserId: number) => {
        try {
            const myCompany = await companyService.getCurrentCompany();
            if (!myCompany) return;
            const newDM = await chatService.startDM(myCompany.id, targetUserId);
            // Check if already in list
            setDMs(prev => {
                if (prev.find(c => c.id === newDM.id)) return prev;
                return [...prev, newDM];
            });
            setShowStartDM(false);
            setActiveChannel(newDM);
        } catch (e) {
            console.error("Failed to start DM", e);
        }
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <DashboardLayout title={t('navigation.chat')}>
            <div className={`flex bg-lp-bg backdrop-blur-xl ${isFullScreen ? 'fixed inset-0 z-[9999]' : 'h-[calc(100vh-180px)] rounded-[32px] overflow-hidden border border-lp-border shadow-[0_20px_50px_rgba(0,0,0,0.1)]'}`}>
                {/* Sidebar */}
                <div className={`w-[320px] bg-lp-surface border-r border-lp-border flex flex-col ${isFullScreen ? '' : ''}`}>
                    <div className="p-6 border-b border-lp-border flex justify-between items-center bg-lp-surface/50">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-lp-accent to-lp-accent2 bg-clip-text text-transparent">Channels</h2>
                        <button
                            onClick={() => setShowCreateChannel(true)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-lp-accent/10 text-lp-accent hover:bg-lp-accent hover:text-white transition-all duration-200 shadow-sm"
                            title="Create Channel"
                        >
                            <span className="text-xl font-medium">+</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                        {/* Public Channels */}
                        <div>
                            <div className="flex items-center justify-between mb-2 px-2">
                                <span className="text-xs font-semibold text-lp-text3 uppercase tracking-wider">Public</span>
                            </div>
                            <div className="space-y-1">
                                {channels.length === 0 && <p className="text-lp-text3 text-xs px-2 italic">No channels yet</p>}
                                {channels.map(channel => (
                                    <button
                                        key={channel.id}
                                        onClick={() => setActiveChannel(channel)}
                                        className={`w-full flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 group ${activeChannel?.id === channel.id
                                            ? 'bg-lp-accent text-white shadow-lg shadow-lp-accent/20'
                                            : 'text-lp-text2 hover:bg-lp-surface2 hover:text-lp-accent hover:shadow-sm'
                                            }`}
                                    >
                                        <span className={`mr-3 font-medium ${activeChannel?.id === channel.id ? 'text-white/60' : 'text-lp-text3 group-hover:text-lp-accent'}`}>#</span>
                                        <span className="font-medium truncate">{channel.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Direct Messages */}
                        <div>
                            <div className="flex items-center justify-between mb-2 px-2">
                                <span className="text-xs font-semibold text-lp-text3 uppercase tracking-wider">Direct Messages</span>
                                <button
                                    onClick={openStartDM}
                                    className="text-lp-text3 hover:text-lp-accent transition-colors"
                                    title="New Message"
                                >
                                    <span className="text-lg">+</span>
                                </button>
                            </div>
                            <div className="space-y-1">
                                {aiUser && !dms.find(dm => dm.name.includes("AI Assistant")) && (
                                    <button
                                        onClick={() => handleUserSelect(aiUser.id)}
                                        className="w-full flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 group text-lp-text2 hover:bg-lp-surface2 hover:text-purple-400 hover:shadow-sm"
                                    >
                                        <div className="w-2 h-2 rounded-full mr-3 bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.4)]"></div>
                                        <span className="font-medium truncate">AI Assistant</span>
                                        <span className="ml-auto text-[10px] bg-purple-400/10 text-purple-400 px-1.5 py-0.5 rounded font-bold">AI</span>
                                    </button>
                                )}
                                {dms.length === 0 && !aiUser && <p className="text-lp-text3 text-xs px-2 italic">No conversations</p>}
                                {dms.map(dm => (
                                    <button
                                        key={dm.id}
                                        onClick={() => setActiveChannel(dm)}
                                        className={`w-full flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 group ${activeChannel?.id === dm.id
                                            ? 'bg-lp-accent text-white shadow-lg shadow-lp-accent/20'
                                            : 'text-lp-text2 hover:bg-lp-surface2 hover:text-lp-accent hover:shadow-sm'
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full mr-3 ${activeChannel?.id === dm.id ? 'bg-white/60' : 'bg-lp-text3 group-hover:bg-lp-accent'}`}></div>
                                        <span className="font-medium truncate">{dm.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-lp-surface">
                    {activeChannel ? (
                        <>
                            {/* Header */}
                            <div className="h-20 px-6 border-b border-lp-border flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-lp-accent/10 flex items-center justify-center text-lp-accent">
                                        <span className="text-xl font-bold">{activeChannel.name.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lp-text text-lg leading-tight">
                                                {activeChannel.isPublic ? '#' : ''}{activeChannel.name}
                                            </h3>
                                            {(activeChannel.name === 'AI Assistant' || (aiUser && activeChannel.name === `${aiUser.firstName} ${aiUser.lastName}`)) && (
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-400/10 text-purple-400 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-purple-400/20">
                                                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                                                    Context Active
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                            <span className="text-[10px] font-semibold text-lp-text3 uppercase tracking-wider">
                                                {isConnected ? 'Connected' : 'Disconnected'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleDeleteChannel}
                                        className="p-2.5 rounded-xl text-lp-text3 hover:bg-rose-500/10 hover:text-rose-500 transition-all duration-200"
                                        title="Delete Chat"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setIsFullScreen(!isFullScreen)}
                                        className={`p-2.5 rounded-xl transition-all duration-200 text-lp-text3 hover:bg-lp-surface2 hover:text-lp-accent`}
                                        title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                                    >
                                        {isFullScreen ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M5 4a1 1 0 00-1 1v2a1 1 0 11-2 0V5a3 3 0 013-3h2a1 1 0 110 2H5zM15 4h-2a1 1 0 110-2h2a3 3 0 013 3v2a1 1 0 11-2 0V5a1 1 0 00-1-1zM5 16h2a1 1 0 110 2H5a3 3 0 01-3-3v-2a1 1 0 112 0v2a1 1 0 001 1zM13 16a1 1 0 110-2h2a1 1 0 001-1v-2a1 1 0 112 0v2a3 3 0 01-3 3h-2z" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12a1 1 0 01-1-1zM2 13a1 1 0 011-1h4a1 1 0 010 2H4.414l2.293 2.293a1 1 0 11-1.414 1.414L3 15.586V14a1 1 0 01-2 0v-4zm11 1a1 1 0 110-2h4a1 1 0 011 1v4a1 1 0 01-2 0v-1.586l-2.293 2.293a1 1 0 01-1.414-1.414L15.586 15H14a1 1 0 01-1-1z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setShowMembers(!showMembers)}
                                        className={`p-2.5 rounded-xl transition-all duration-200 ${showMembers ? 'bg-lp-accent/10 text-lp-accent' : 'text-lp-text3 hover:bg-lp-surface2'}`}
                                        title="Show/Hide Members"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a7 7 0 00-7 7v1h11v-1a7 7 0 00-7-7z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-lp-bg/30">
                                {messages.map((msg, index) => {
                                    const isMe = msg.senderId === user?.id;
                                    const prevMsg = index > 0 ? messages[index - 1] : null;
                                    const isSameSenderAsPrev = prevMsg?.senderId === msg.senderId;
                                    const timeGapThreshold = 5 * 60 * 1000; // 5 minutes
                                    const prevTimeGap = prevMsg ? new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() : Infinity;
                                    const isGroupStart = !isSameSenderAsPrev || prevTimeGap > timeGapThreshold;

                                    // Generator for name colors
                                    const getSenderColor = (name: string) => {
                                        const colors = ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-pink-600', 'text-orange-600', 'text-teal-600'];
                                        let hash = 0;
                                        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
                                        return colors[Math.abs(hash) % colors.length];
                                    };

                                    return (
                                        <MessageItem
                                            key={msg.id || `temp-${index}`}
                                            msg={msg}
                                            isMe={isMe}
                                            isGroupStart={isGroupStart}
                                            getSenderColor={getSenderColor}
                                            handleResend={handleResend}
                                            handleDeleteMessage={handleDeleteMessage}
                                        />
                                    );
                                })}
                                {isAiThinking && (activeChannel.name === 'AI Assistant' || (aiUser && activeChannel.name === `${aiUser.firstName} ${aiUser.lastName}`)) && (
                                    <div className="flex justify-start mt-2">
                                        <div className="bg-lp-surface border border-lp-border/50 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 bg-lp-text3 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                <div className="w-1.5 h-1.5 bg-lp-text3 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                <div className="w-1.5 h-1.5 bg-lp-text3 rounded-full animate-bounce"></div>
                                            </div>
                                            <span className="text-[12px] font-medium text-lp-text3 italic">AI Assistant is thinking...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <ChatInput
                                activeChannel={activeChannel}
                                isConnected={isConnected}
                                onSend={handleSendMessage}
                            />
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-lp-bg/30 p-12">
                            <div className="max-w-md text-center">
                                <div className="w-24 h-24 bg-lp-accent/10 rounded-3xl flex items-center justify-center text-lp-accent mx-auto mb-6 shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-lp-text mb-3">Welcome to DocFlow Chat</h2>
                                <p className="text-lp-text2 mb-8 leading-relaxed">Select a channel from the sidebar to join the conversation, or create a new one to collaborate with your team.</p>
                                <button
                                    onClick={() => setShowCreateChannel(true)}
                                    className="btn-primary"
                                >
                                    Start a new channel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Members List Sidebar */}
                {activeChannel && showMembers && (
                    <div className="w-64 border-l border-lp-border bg-lp-surface flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-lp-border h-20 flex items-center">
                            <h2 className="font-bold text-lp-text flex items-center gap-2">
                                Members
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-lp-surface2 text-lp-text3">{members.length}</span>
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-1">
                            {members.map((m: any) => {
                                const isAi = m.email === 'ai@dockflow.com';
                                return (
                                    <div
                                        key={m.id}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-lp-surface2 transition-colors group relative"
                                    >
                                        <div className="relative">
                                            <div className={`w-9 h-9 rounded-xl border border-white/10 shadow-sm flex items-center justify-center font-bold text-sm uppercase ${isAi
                                                ? 'bg-gradient-to-br from-purple-400/20 to-purple-600/20 text-purple-400'
                                                : 'bg-lp-surface3 text-lp-text2'}`}>
                                                {isAi ? 'AI' : `${m.firstName.charAt(0)}${m.lastName.charAt(0)}`}
                                            </div>
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-lp-surface bg-green-500`}></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold text-lp-text truncate">
                                                {m.firstName} {m.lastName} {isAi && <span className="ml-1 text-[10px] bg-purple-400/10 text-purple-400 px-1.5 py-0.5 rounded font-bold">BOT</span>}
                                            </h4>
                                            <p className="text-[10px] text-lp-text3 font-medium uppercase tracking-tight">{m.email}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Modals (remains similar but styled) */}
                {showCreateChannel && (
                    <div className="fixed inset-0 bg-lp-bg/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
                        <div className="bg-lp-surface p-8 rounded-3xl w-[400px] shadow-2xl animate-in zoom-in-95 duration-200 border border-lp-border">
                            <h3 className="text-2xl font-bold text-lp-text mb-2">Create Channel</h3>
                            <p className="text-lp-text2 mb-6 text-sm">Channels are where your team communicates. They’re best when organized around a topic.</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-lp-text2 mb-1.5 block">Name</label>
                                    <input
                                        type="text"
                                        value={newChannelName}
                                        onChange={(e) => setNewChannelName(e.target.value)}
                                        placeholder="e.g. marketing-updates"
                                        className="w-full bg-lp-surface2 border-0 rounded-2xl px-5 py-4 text-[15px] focus:ring-2 focus:ring-lp-accent/20 focus:bg-lp-surface transition-all duration-200 outline-none text-lp-text placeholder:text-lp-text3"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setShowCreateChannel(false)}
                                        className="flex-1 px-4 py-4 text-lp-text2 font-bold hover:bg-lp-surface2 rounded-2xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateChannel}
                                        className="flex-1 bg-lp-accent text-white font-bold rounded-2xl shadow-lg shadow-lp-accent/20 hover:bg-lp-accent2 transition-all duration-200"
                                    >
                                        Create
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showStartDM && (
                    <div className="fixed inset-0 bg-lp-bg/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
                        <div className="bg-lp-surface p-8 rounded-3xl w-[450px] shadow-2xl animate-in zoom-in-95 duration-200 border border-lp-border max-h-[80vh] flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-lp-text mb-2">New Message</h3>
                                <p className="text-lp-text2 text-sm">Select a colleague to start a private conversation.</p>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 mb-6 pr-2">
                                {(() => {
                                    // Merge AI user into available users if fetched
                                    let displayUsers = [...availableUsers];
                                    if (aiUser && !displayUsers.find(u => u.email === aiUser.email)) {
                                        // Ensure AI user has necessary fields
                                        const aiUserFormatted = {
                                            ...aiUser,
                                            firstName: aiUser.firstName || 'AI',
                                            lastName: aiUser.lastName || 'Assistant'
                                        };
                                        displayUsers = [aiUserFormatted, ...displayUsers];
                                    }

                                    if (displayUsers.length === 0) {
                                        return (
                                            <div className="py-12 text-center">
                                                <p className="text-gray-400 italic">No other members found in your company.</p>
                                            </div>
                                        );
                                    }

                                    return displayUsers.map((u: any) => {
                                        const isAi = u.email === 'ai@dockflow.com';
                                        return (
                                            <button
                                                key={u.id}
                                                onClick={() => handleUserSelect(u.id)}
                                                className="w-full flex items-center gap-4 p-4 hover:bg-lp-surface2 rounded-2xl transition-all duration-200 border border-transparent hover:border-lp-border"
                                            >
                                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${isAi
                                                    ? 'bg-purple-400/20 text-purple-400'
                                                    : 'bg-lp-surface3 text-lp-text2'}`}>
                                                    {isAi ? 'AI' : `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`}
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="font-bold text-lp-text">
                                                        {u.firstName} {u.lastName}
                                                        {isAi && <span className="ml-2 text-[10px] bg-purple-400/10 text-purple-400 px-1.5 py-0.5 rounded font-bold">ASSISTANT</span>}
                                                    </h4>
                                                    <p className="text-xs text-lp-text3">{u.email}</p>
                                                </div>
                                            </button>
                                        )
                                    });
                                })()}
                            </div>
                            <button
                                onClick={() => setShowStartDM(false)}
                                className="w-full py-4 text-lp-text2 font-bold hover:bg-lp-surface2 rounded-2xl transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ChatPage;
