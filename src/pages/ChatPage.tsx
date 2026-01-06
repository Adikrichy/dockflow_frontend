import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { chatService } from '../services/api';
import type { ChatChannelResponse } from '../services/api';
import { companyService } from '../services/companyService';
import Navigation from '../components/Navigation';
import LoadingSpinner from '../components/LoadingSpinner';

interface Message {
    id: number;
    senderId: number;
    senderName: string;
    content: string;
    timestamp: string;
    edited?: boolean;
}

const ChatPage = () => {
    const { user } = useAuth();
    const { isConnected, subscribeToChannel, unsubscribeFromChannel, sendMessage, clearChatMessages } = useWebSocket();

    const [channels, setChannels] = useState<ChatChannelResponse[]>([]);
    const [dms, setDMs] = useState<ChatChannelResponse[]>([]);
    const [activeChannel, setActiveChannel] = useState<ChatChannelResponse | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [members, setMembers] = useState<any[]>([]);
    const [showMembers, setShowMembers] = useState(true);

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
                    chatService.getUserDMs()
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
        subscribeToChannel(activeChannel.id, (msg: any) => {
            setMessages(prev => [...prev, {
                id: msg.id,
                senderId: msg.senderId,
                senderName: msg.senderName,
                content: msg.content,
                timestamp: msg.timestamp,
                edited: msg.edited
            }]);
        });

        return () => {
            unsubscribeFromChannel(activeChannel.id);
        };
    }, [activeChannel, subscribeToChannel, unsubscribeFromChannel, clearChatMessages]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (activeChannel && inputText.trim()) {
            sendMessage(activeChannel.id, inputText.trim());
            setInputText('');
        }
    };

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
            const newDM = await chatService.startDM(targetUserId);
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
        <Navigation>
            <div className="flex h-[calc(100vh-140px)] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                {/* Sidebar */}
                <div className="w-72 bg-gray-50/50 backdrop-blur-sm border-r border-gray-100 flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white/50">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Channels</h2>
                        <button
                            onClick={() => setShowCreateChannel(true)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-200 shadow-sm"
                            title="Create Channel"
                        >
                            <span className="text-xl font-medium">+</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                        {/* Public Channels */}
                        <div>
                            <div className="flex items-center justify-between mb-2 px-2">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Public</span>
                            </div>
                            <div className="space-y-1">
                                {channels.length === 0 && <p className="text-gray-400 text-xs px-2 italic">No channels yet</p>}
                                {channels.map(channel => (
                                    <button
                                        key={channel.id}
                                        onClick={() => setActiveChannel(channel)}
                                        className={`w-full flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 group ${activeChannel?.id === channel.id
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                            : 'text-gray-600 hover:bg-white hover:text-blue-600 hover:shadow-sm'
                                            }`}
                                    >
                                        <span className={`mr-3 font-medium ${activeChannel?.id === channel.id ? 'text-blue-200' : 'text-gray-300 group-hover:text-blue-400'}`}>#</span>
                                        <span className="font-medium truncate">{channel.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Direct Messages */}
                        <div>
                            <div className="flex items-center justify-between mb-2 px-2">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Direct Messages</span>
                                <button
                                    onClick={openStartDM}
                                    className="text-gray-400 hover:text-blue-600 transition-colors"
                                    title="New Message"
                                >
                                    <span className="text-lg">+</span>
                                </button>
                            </div>
                            <div className="space-y-1">
                                {dms.length === 0 && <p className="text-gray-400 text-xs px-2 italic">No conversations</p>}
                                {dms.map(dm => (
                                    <button
                                        key={dm.id}
                                        onClick={() => setActiveChannel(dm)}
                                        className={`w-full flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 group ${activeChannel?.id === dm.id
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                            : 'text-gray-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm'
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full mr-3 ${activeChannel?.id === dm.id ? 'bg-indigo-300' : 'bg-gray-300 group-hover:bg-indigo-400'}`}></div>
                                        <span className="font-medium truncate">{dm.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-white">
                    {activeChannel ? (
                        <>
                            {/* Header */}
                            <div className="h-20 px-6 border-b border-gray-100 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                        <span className="text-xl font-bold">{activeChannel.name.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-lg leading-tight">
                                            {activeChannel.isPublic ? '#' : ''}{activeChannel.name}
                                        </h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                                {isConnected ? 'Connected' : 'Disconnected'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowMembers(!showMembers)}
                                        className={`p-2.5 rounded-xl transition-all duration-200 ${showMembers ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}
                                        title="Show/Hide Members"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a7 7 0 00-7 7v1h11v-1a7 7 0 00-7-7z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50/30">
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
                                        <div
                                            key={msg.id || index}
                                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isGroupStart ? 'mt-4' : 'mt-1'}`}
                                        >
                                            <div className={`flex flex-col max-w-[85%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                {/* Sender Name for others */}
                                                {isGroupStart && !isMe && (
                                                    <span className={`text-[12px] font-bold ${getSenderColor(msg.senderName)} ml-2 mb-0.5`}>
                                                        {msg.senderName}
                                                    </span>
                                                )}

                                                <div className={`relative px-3 py-2 shadow-sm transition-all duration-200 ${isMe
                                                    ? `bg-[#005cff] text-white ${isGroupStart ? 'rounded-2xl rounded-tr-none' : 'rounded-2xl'}`
                                                    : `bg-white border border-black/5 text-gray-800 ${isGroupStart ? 'rounded-2xl rounded-tl-none' : 'rounded-2xl'}`
                                                    }`}>

                                                    <p className="text-[14.5px] leading-tight whitespace-pre-wrap">{msg.content}</p>

                                                    {/* Internal meta (timestamp) */}
                                                    <div className={`mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-blue-100/70' : 'text-gray-400'}`}>
                                                        <span className="text-[9px] tabular-nums font-medium">
                                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {isMe && (
                                                            <div className="flex -space-x-1">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-6 bg-white border-t border-gray-100">
                                <form onSubmit={handleSendMessage} className="relative flex items-center gap-4">
                                    <div className="flex-1 relative group">
                                        <input
                                            type="text"
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            placeholder={`Message ${activeChannel.isPublic ? '#' : ''}${activeChannel.name}...`}
                                            className="w-full bg-gray-50 border-0 rounded-2xl px-6 py-4 pr-12 text-[15px] focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200 outline-none"
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
                                        disabled={!isConnected || !inputText.trim()}
                                        className="h-14 w-14 flex items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 rotate-90" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                        </svg>
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-gray-50/30 p-12">
                            <div className="max-w-md text-center">
                                <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 mx-auto mb-6 shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-3">Welcome to DocFlow Chat</h2>
                                <p className="text-gray-500 mb-8 leading-relaxed">Select a channel from the sidebar to join the conversation, or create a new one to collaborate with your team.</p>
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
                    <div className="w-64 border-l border-gray-100 bg-white flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-gray-100 h-20 flex items-center">
                            <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                Members
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{members.length}</span>
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-1">
                            {members.map((m: any) => (
                                <div
                                    key={m.id}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group relative"
                                >
                                    <div className="relative">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 border border-white shadow-sm flex items-center justify-center text-gray-600 font-bold text-sm uppercase">
                                            {m.firstName.charAt(0)}{m.lastName.charAt(0)}
                                        </div>
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-green-500`}></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-gray-800 truncate">{m.firstName} {m.lastName}</h4>
                                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">{m.email}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Modals (remains similar but styled) */}
                {showCreateChannel && (
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
                        <div className="bg-white p-8 rounded-3xl w-[400px] shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100">
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">Create Channel</h3>
                            <p className="text-gray-500 mb-6 text-sm">Channels are where your team communicates. They’re best when organized around a topic.</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-1.5 block">Name</label>
                                    <input
                                        type="text"
                                        value={newChannelName}
                                        onChange={(e) => setNewChannelName(e.target.value)}
                                        placeholder="e.g. marketing-updates"
                                        className="w-full bg-gray-50 border-0 rounded-2xl px-5 py-4 text-[15px] focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200 outline-none"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setShowCreateChannel(false)}
                                        className="flex-1 px-4 py-4 text-gray-600 font-bold hover:bg-gray-50 rounded-2xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateChannel}
                                        className="flex-1 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all duration-200"
                                    >
                                        Create
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showStartDM && (
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
                        <div className="bg-white p-8 rounded-3xl w-[450px] shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100 max-h-[80vh] flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">New Message</h3>
                                <p className="text-gray-500 text-sm">Select a colleague to start a private conversation.</p>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 mb-6">
                                {availableUsers.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <p className="text-gray-400 italic">No other members found in your company.</p>
                                    </div>
                                ) : (
                                    availableUsers.map((u: any) => (
                                        <button
                                            key={u.id}
                                            onClick={() => handleUserSelect(u.id)}
                                            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all duration-200 border border-transparent hover:border-gray-100"
                                        >
                                            <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                                                {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-bold text-gray-800">{u.firstName} {u.lastName}</h4>
                                                <p className="text-xs text-gray-400">{u.email}</p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                            <button
                                onClick={() => setShowStartDM(false)}
                                className="w-full py-4 text-gray-600 font-bold hover:bg-gray-50 rounded-2xl transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Navigation>
    );
};

export default ChatPage;
