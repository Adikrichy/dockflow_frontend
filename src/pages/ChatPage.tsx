import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { chatService, companyService } from '../services/api';
import type { ChatChannelResponse } from '../services/api';
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
            // Note: chatService.getCompanyChannels requires companyId.
            // We'll try to get it from current company context
            const myCompany = await companyService.getCurrentCompany();
            if (myCompany) {
                const [companyChannels, userDMs] = await Promise.all([
                    chatService.getCompanyChannels(myCompany.id),
                    chatService.getUserDMs()
                ]);
                setChannels(companyChannels);
                setDMs(userDMs);
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
                // Map messages to local interface
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
        loadHistory();

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
        if (!inputText.trim() || !activeChannel) return;

        sendMessage(activeChannel.id, inputText);
        setInputText('');
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
            <div className="flex h-[calc(100vh-100px)] bg-white rounded-lg shadow overflow-hidden relative">
                {/* Sidebar */}
                <div className="w-64 bg-gray-50 border-r flex flex-col">
                    <div className="p-4 border-b flex justify-between items-center">
                        <h2 className="font-bold text-gray-700">Channels</h2>
                        <button onClick={() => setShowCreateChannel(true)} className="text-gray-500 hover:text-blue-600 text-2xl font-bold leading-none">+</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {channels.length === 0 && <p className="text-gray-400 text-sm px-2">No channels</p>}
                        {channels.map(channel => (
                            <button
                                key={channel.id}
                                onClick={() => setActiveChannel(channel)}
                                className={`w-full text-left px-3 py-2 rounded ${activeChannel?.id === channel.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                            >
                                # {channel.name}
                            </button>
                        ))}

                        <div className="pt-4 pb-2 px-2 flex justify-between items-center">
                            <h2 className="font-bold text-gray-700 text-sm uppercase">Direct Messages</h2>
                            <button onClick={openStartDM} className="text-gray-500 hover:text-blue-600 text-2xl font-bold leading-none">+</button>
                        </div>
                        {dms.length === 0 && <p className="text-gray-400 text-sm px-2">No conversations</p>}
                        {dms.map(dm => (
                            <button
                                key={dm.id}
                                onClick={() => setActiveChannel(dm)}
                                className={`w-full text-left px-3 py-2 rounded ${activeChannel?.id === dm.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                            >
                                • {dm.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col">
                    {activeChannel ? (
                        <>
                            {/* Header */}
                            <div className="p-4 border-b bg-white flex justify-between items-center">
                                <h3 className="font-bold text-lg">
                                    {activeChannel.isPublic ? '#' : '•'} {activeChannel.name}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    <span className="text-xs text-gray-500">{isConnected ? 'Online' : 'Offline'}</span>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {messages.map((msg, index) => {
                                    const isMe = msg.senderId === user?.id;
                                    return (
                                        <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] rounded-lg p-3 ${isMe ? 'bg-blue-600 text-white' : 'bg-white border text-gray-800'}`}>
                                                <div className="text-xs opacity-75 mb-1 flex justify-between gap-4">
                                                    <span className="font-bold">{msg.senderName}</span>
                                                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 bg-white border-t">
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        placeholder={`Message ${activeChannel.isPublic ? '#' : ''}${activeChannel.name}`}
                                        className="flex-1 input-field"
                                    />
                                    <button type="submit" className="btn-primary" disabled={!isConnected || !inputText.trim()}>
                                        Send
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500 flex-col gap-4">
                            <p className="text-xl">Select a channel to start chatting</p>
                            <p className="text-sm">or create a new one using + button</p>
                        </div>
                    )}
                </div>

                {/* Modals */}
                {showCreateChannel && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
                            <h3 className="font-bold text-lg mb-4">Create New Channel</h3>
                            <input
                                type="text"
                                value={newChannelName}
                                onChange={(e) => setNewChannelName(e.target.value)}
                                placeholder="Channel Name"
                                className="input-field mb-4"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowCreateChannel(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button onClick={handleCreateChannel} className="btn-primary">Create</button>
                            </div>
                        </div>
                    </div>
                )}

                {showStartDM && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg w-96 shadow-xl max-h-[80vh] flex flex-col">
                            <h3 className="font-bold text-lg mb-4">New Message</h3>
                            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                                {availableUsers.length === 0 ? (
                                    <p className="text-gray-500 text-center">No other members found</p>
                                ) : (
                                    availableUsers.map((u: any) => (
                                        <button
                                            key={u.id}
                                            onClick={() => handleUserSelect(u.id)}
                                            className="w-full text-left p-3 hover:bg-gray-100 rounded border flex justify-between items-center"
                                        >
                                            <span className="font-medium">{u.firstName} {u.lastName}</span>
                                            <span className="text-xs text-gray-500">{u.email}</span>
                                        </button>
                                    ))
                                )}
                            </div>
                            <div className="flex justify-end">
                                <button onClick={() => setShowStartDM(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Navigation>
    );
};

export default ChatPage;
