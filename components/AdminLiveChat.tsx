import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { socket } from '../services/socket';
import { db as generalDb } from '../services/database';
import { ChatMessage, ChatSession } from '../types';
import { 
    UserIcon, 
    XIcon, 
    SendIcon, 
    Paperclip as PaperclipIcon, 
    File as FileIcon, 
    Image as ImageIcon, 
    Camera as CameraIcon, 
    Loader2 as LoaderIcon, 
    Check as CheckIcon, 
    CheckCheck as CheckCheckIcon,
    Bot as BotIcon
} from 'lucide-react';

export const AdminLiveChat: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSession, setActiveSession] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Typing Status & Attachment States
    const [userTyping, setUserTyping] = useState<boolean>(false);
    const [attachment, setAttachment] = useState<{ url: string; name: string; type: string } | null>(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load sessions and initial messages from database
    const loadAllData = async () => {
        try {
            const dbSessions = await generalDb.getChatSessions();
            setSessions(dbSessions);

            let allMsgs: ChatMessage[] = [];
            for (const sess of dbSessions) {
                const msgs = await generalDb.getChatMessages(sess.id);
                allMsgs = [...allMsgs, ...msgs];
            }
            // Sort messages chronologically
            allMsgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            setMessages(allMsgs);
        } catch (err) {
            console.error("Failed to load historical support chat data:", err);
        }
    };

    useEffect(() => {
        loadAllData();
    }, []);

    // Scroll to bottom helper
    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, activeSession, isOpen, userTyping]);

    // Handle read receipt sync for a session
    const markSessionAsRead = async (sessionId: string) => {
        try {
            // Send socket event to inform user
            socket.emit('chat:read_receipt', {
                sessionId: sessionId,
                userId: 'admin',
                timestamp: new Date().toISOString()
            });

            // Mark local and remote db messages as read
            const sessionMsgs = messages.filter(m => m.sessionId === sessionId);
            let anyUpdated = false;

            for (const msg of sessionMsgs) {
                if (msg.senderId === 'user' && !msg.read) {
                    msg.read = true;
                    // @ts-ignore
                    msg.status = 'seen';
                    await generalDb.saveChatMessage(msg);
                    anyUpdated = true;
                }
            }

            if (anyUpdated) {
                setMessages(prev => prev.map(m => (m.sessionId === sessionId && m.senderId === 'user') ? { ...m, read: true, status: 'seen' } : m));
            }

            // Update session counters
            const dbSessions = await generalDb.getChatSessions();
            const currentSess = dbSessions.find(s => s.id === sessionId);
            if (currentSess) {
                currentSess.unreadAdminCount = 0;
                await generalDb.saveChatSession(currentSess);
                setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, unreadAdminCount: 0 } : s));
            }
        } catch (err) {
            console.error("Error marking session read:", err);
        }
    };

    useEffect(() => {
        if (isOpen && activeSession) {
            markSessionAsRead(activeSession);
        }
    }, [isOpen, activeSession]);

    // Emit typing status to user based on admin typing input
    useEffect(() => {
        if (!activeSession) return;
        socket.emit('chat:typing', { sessionId: activeSession, senderId: 'admin', isTyping: inputValue.length > 0 });
        
        let timer: any;
        if (inputValue.length > 0) {
            timer = setTimeout(() => {
                socket.emit('chat:typing', { sessionId: activeSession, senderId: 'admin', isTyping: false });
            }, 3000);
        }
        
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [inputValue, activeSession]);

    // Socket Event Listeners
    useEffect(() => {
        const handleReceive = async (msg: ChatMessage) => {
            setMessages(prev => {
                if (prev.find(m => m.id === msg.id)) return prev;
                return [...prev, msg].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            });

            // Send delivered receipt immediately if message is from customer
            if (msg.senderId === 'user') {
                socket.emit('chat:delivered_receipt', {
                    sessionId: msg.sessionId,
                    msgId: msg.id,
                    senderId: 'admin'
                });
            }

            // If chat is open and is active session, auto-read
            if (isOpen && activeSession === msg.sessionId) {
                await markSessionAsRead(activeSession);
            } else {
                setUnreadCount(c => c + 1);
                // Increment unread count for session
                setSessions(prev => prev.map(s => s.id === msg.sessionId ? { ...s, unreadAdminCount: (s.unreadAdminCount || 0) + 1 } : s));
            }
        };

        const handleTyping = (data: { sessionId: string; senderId: string; isTyping: boolean }) => {
            if (activeSession === data.sessionId && data.senderId === 'user') {
                setUserTyping(data.isTyping);
            }
        };

        const handleReadReceipt = (data: { sessionId: string; userId: string; timestamp: string }) => {
            if (data.userId === 'user') {
                // User has read our admin messages
                setMessages(prev => prev.map(m => (m.sessionId === data.sessionId && m.senderId !== 'user') ? { ...m, read: true, status: 'read' as const } : m));
            }
        };

        const handleDeliveredReceipt = (data: { sessionId: string; msgId: string; senderId: string }) => {
            if (data.senderId === 'user') {
                setMessages(prev => prev.map(m => m.id === data.msgId ? { ...m, status: 'delivered' as const } : m));
            }
        };

        const handleRateSession = (data: { sessionId: string; rating: number; ratingFeedback: string }) => {
            setSessions(prev => prev.map(s => s.id === data.sessionId ? { ...s, status: 'resolved', rating: data.rating, ratingFeedback: data.ratingFeedback } : s));
        };

        socket.on('chat:receive_message', handleReceive);
        socket.on('chat:typing', handleTyping);
        socket.on('chat:read_receipt', handleReadReceipt);
        socket.on('chat:delivered_receipt', handleDeliveredReceipt);
        socket.on('chat:rate_session', handleRateSession);

        return () => {
            socket.off('chat:receive_message', handleReceive);
            socket.off('chat:typing', handleTyping);
            socket.off('chat:read_receipt', handleReadReceipt);
            socket.off('chat:delivered_receipt', handleDeliveredReceipt);
            socket.off('chat:rate_session', handleRateSession);
        };
    }, [isOpen, activeSession, messages]);

    // File selection & upload handler
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const maxBytes = 5 * 1024 * 1024;
        if (file.size > maxBytes) {
            setFileError('File size must be less than 5MB');
            return;
        }

        setFileError(null);
        setUploadingFile(true);

        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const base64 = reader.result as string;
                    const url = await generalDb.uploadFile(base64, 'support_attachments', 'chats');
                    setAttachment({
                        url: url,
                        name: file.name,
                        type: file.type
                    });
                } catch (uploadErr) {
                    console.error("Admin upload failed:", uploadErr);
                    setFileError("Upload failed. Try again.");
                } finally {
                    setUploadingFile(false);
                }
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error("Admin reading file error:", err);
            setFileError("Failed to read file.");
            setUploadingFile(false);
        }
    };

    // Send Message handler
    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const textContent = inputValue.trim();
        if ((!textContent && !attachment) || !activeSession) return;

        const msgId = `msg_${Date.now()}_admin_${Math.random().toString(36).substr(2, 5)}`;
        const newMsg: ChatMessage = {
            id: msgId,
            sessionId: activeSession,
            senderId: 'admin',
            senderName: 'FPB Private Desk',
            content: textContent,
            timestamp: new Date(),
            read: false,
            // @ts-ignore
            status: 'sent',
            attachmentUrl: attachment?.url || undefined,
            attachmentName: attachment?.name || undefined,
            attachmentType: attachment?.type || undefined
        };

        setInputValue('');
        setAttachment(null);
        setMessages(prev => [...prev, newMsg]);

        // Save to database
        await generalDb.saveChatMessage(newMsg);

        // Update active session metadata
        const dbSessions = await generalDb.getChatSessions();
        const currentSess = dbSessions.find(s => s.id === activeSession);
        if (currentSess) {
            currentSess.lastUpdatedAt = new Date();
            await generalDb.saveChatSession(currentSess);
        }

        // Emit through socket
        socket.emit('chat:send_message', newMsg);
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => { setIsOpen(true); setUnreadCount(0); }}
                className="fixed bottom-6 right-6 p-4 bg-slate-50 border-2 border-emerald-500/35 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all z-50 flex items-center justify-center cursor-pointer dark:bg-slate-900"
            >
                <div className="relative">
                    <UserIcon className="w-6 h-6 text-emerald-400 animate-pulse" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-3 -right-3 bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-bounce">
                            {unreadCount}
                        </span>
                    )}
                </div>
            </button>
        );
    }

    const currentMessages = messages.filter(m => m.sessionId === activeSession);
    const sessionList = Array.from(new Set(messages.map(m => m.sessionId)));

    return (
        <div className="fixed bottom-6 right-6 w-[440px] sm:w-[500px] h-[36rem] bg-[#070b13] border-2 border-emerald-500/25  rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.8)] flex flex-col z-50 overflow-hidden font-sans text-white">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-emerald-950 to-slate-900 border-b border-slate-200 relative flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <div>
                        <h3 className="font-extrabold text-white text-xs uppercase tracking-widest">Sovereign Desk Panel</h3>
                        <p className="text-[9px] text-[#0ec5f2] font-mono uppercase tracking-wider">Live Administrative Terminal</p>
                    </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-[#0F172A] hover:text-white transition-colors bg-white hover:bg-white p-2 rounded-xl dark:bg-slate-800">
                    <XIcon className="w-4 h-4" />
                </button>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
                {/* Session Sidebar list */}
                <div className="w-1/3 bg-slate-100 border-r border-slate-200/60 overflow-y-auto custom-scrollbar shrink-0">
                    <div className="p-2 border-b border-slate-200/40 text-[9px] uppercase font-bold tracking-wider text-[#0F172A]">
                        Secure Channels
                    </div>
                    {sessionList.map(s => {
                        const sessMsgs = messages.filter(m => m.sessionId === s);
                        const lastMsg = sessMsgs[sessMsgs.length - 1];
                        const activeSessInfo = sessions.find(sess => sess.id === s);
                        const unread = activeSessInfo?.unreadAdminCount || 0;

                        return (
                            <button 
                                key={s} 
                                onClick={() => setActiveSession(s)}
                                className={`w-full text-left p-3 border-b border-slate-900 transition-all flex flex-col gap-1 ${activeSession === s ? 'bg-emerald-500 border-l-4 border-l-emerald-500' : 'hover:bg-white'}`}
                            >
                                <div className="flex justify-between items-center w-full">
                                    <span className="text-[10px] font-black text-[#0F172A] truncate max-w-[80%]">{s}</span>
                                    {unread > 0 && (
                                        <span className="bg-emerald-500 text-black font-black text-[8px] px-1.5 py-0.5 rounded-full shrink-0">
                                            {unread}
                                        </span>
                                    )}
                                </div>
                                <div className="text-[9px] text-[#0F172A] truncate w-full italic" dangerouslySetInnerHTML={{ __html: lastMsg?.content || '' }} />
                            </button>
                        );
                    })}
                    {sessionList.length === 0 && (
                        <div className="p-4 text-center text-[#0F172A] text-xs mt-10">No channels active</div>
                    )}
                </div>
                
                {/* Active Chat Conversation Panel */}
                <div className="w-2/3 flex flex-col bg-[#05090f] relative overflow-hidden">
                    {!activeSession ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-[#0F172A] gap-3 text-center p-6">
                            <BotIcon className="w-12 h-12 opacity-15 text-emerald-500 animate-pulse" />
                            <p className="text-xs font-mono uppercase tracking-widest leading-relaxed">
                                Establish active clearance link. Select a customer portfolio channel.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Active Session Clearance Header */}
                            <div className="p-3 bg-slate-50 border-b border-slate-200/80 flex justify-between items-center shrink-0 dark:bg-slate-900">
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[8px] font-mono font-bold text-[#0F172A] uppercase tracking-widest">CHANNEL Clearance:</span>
                                    <span className="text-xs font-black text-emerald-400 truncate max-w-[150px]">{activeSession}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {/* Rating badge if resolved and rated */}
                                    {sessions.find(s => s.id === activeSession)?.rating ? (
                                        <div className="flex flex-col items-end gap-0.5">
                                            <div className="flex items-center gap-1 bg-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-lg text-[9px] font-bold text-amber-400">
                                                <svg className="w-2.5 h-2.5 fill-amber-400" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                                <span>{sessions.find(s => s.id === activeSession)?.rating} Stars</span>
                                            </div>
                                            {sessions.find(s => s.id === activeSession)?.ratingFeedback && (
                                                <span className="text-[8px] text-amber-300 font-mono italic max-w-[140px] truncate" title={sessions.find(s => s.id === activeSession)?.ratingFeedback}>
                                                    "{sessions.find(s => s.id === activeSession)?.ratingFeedback}"
                                                </span>
                                            )}
                                        </div>
                                    ) : sessions.find(s => s.id === activeSession)?.status === 'resolved' ? (
                                        <div className="bg-slate-850 border border-slate-200 px-2 py-1 rounded-lg text-[9px] font-bold text-[#0F172A] uppercase tracking-wider">
                                            Resolved
                                        </div>
                                    ) : (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const dbSessions = await generalDb.getChatSessions();
                                                    const s = dbSessions.find(sess => sess.id === activeSession);
                                                    if (s) {
                                                        s.status = 'resolved';
                                                        await generalDb.saveChatSession(s);
                                                        setSessions(prev => prev.map(item => item.id === activeSession ? { ...item, status: 'resolved' } : item));
                                                        socket.emit('chat:session_resolved', { sessionId: activeSession });
                                                    }
                                                } catch (err) {
                                                    console.error("Failed to resolve session:", err);
                                                }
                                            }}
                                            className="bg-emerald-600 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-400 hover:text-white px-2 py-1 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
                                        >
                                            Resolve
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Messages List with entry animations */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
                                <AnimatePresence initial={false}>
                                    {currentMessages.map((msg, i) => {
                                        const isAgent = msg.senderId === 'admin' || msg.senderId === 'ai_bot';

                                        return (
                                            <motion.div 
                                                key={msg.id || i} 
                                                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                transition={{ duration: 0.2 }}
                                                className={`flex flex-col max-w-[85%] ${isAgent ? 'ml-auto justify-end self-end' : 'self-start'}`}
                                            >
                                                <div className={`p-2.5 rounded-2xl text-xs leading-relaxed border ${
                                                    isAgent 
                                                        ? 'bg-emerald-700 border-emerald-600/30 text-white rounded-tr-sm' 
                                                        : 'bg-slate-50 border-slate-200 text-[#1E293B] rounded-tl-sm'
                                                } prose prose-invert`}>
                                                    <div className="text-[8px] opacity-60 mb-1 uppercase tracking-widest font-mono font-bold flex items-center gap-1">
                                                        {msg.senderId === 'ai_bot' ? <BotIcon className="w-3.5 h-3.5" /> : null}
                                                        {msg.senderName || (msg.senderId === 'ai_bot' ? 'Core AI' : 'Customer')}
                                                    </div>
                                                    <div dangerouslySetInnerHTML={{ __html: msg.content }} />

                                                    {/* Attachments rendering */}
                                                    {msg.attachmentUrl && (
                                                        <div className="mt-2 rounded-lg overflow-hidden border border-slate-850 bg-slate-100">
                                                            {msg.attachmentType?.startsWith('image/') || msg.attachmentName?.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                                                                <img 
                                                                    src={msg.attachmentUrl} 
                                                                    alt={msg.attachmentName || "Attached asset"} 
                                                                    className="max-h-40 object-cover w-full cursor-pointer hover:opacity-90 transition-opacity"
                                                                    referrerPolicy="no-referrer"
                                                                    onClick={() => window.open(msg.attachmentUrl, '_blank')}
                                                                />
                                                            ) : (
                                                                <a 
                                                                    href={msg.attachmentUrl} 
                                                                    target="_blank" 
                                                                    rel="noreferrer" 
                                                                    className="flex items-center gap-2 p-2 hover:bg-white text-cyan-400 underline text-[10px] dark:bg-slate-800"
                                                                >
                                                                    <PaperclipIcon className="w-3.5 h-3.5 shrink-0" />
                                                                    <span className="truncate max-w-[120px]">{msg.attachmentName || 'Download asset'}</span>
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={`text-[8px] font-mono mt-1 flex items-center gap-1 text-[#0F172A] ${isAgent ? 'justify-end' : 'justify-start ml-1'}`}>
                                                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    {isAgent && (
                                                        <span className="flex items-center gap-0.5">
                                                            {msg.read || msg.status === 'read' || msg.status === 'seen' ? (
                                                                <>
                                                                    <CheckCheckIcon className="w-3 h-3 text-emerald-400" />
                                                                    <span className="text-[7px] text-emerald-400 font-bold">Read</span>
                                                                </>
                                                            ) : msg.status === 'delivered' ? (
                                                                <>
                                                                    <CheckCheckIcon className="w-3 h-3 text-[#0F172A]" />
                                                                    <span className="text-[7px] text-[#0F172A] font-bold">Delivered</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CheckIcon className="w-3 h-3 text-[#0F172A]" />
                                                                    <span className="text-[7px] text-[#0F172A] font-bold">Sent</span>
                                                                </>
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>

                                {/* User typing indicator */}
                                {userTyping && (
                                    <div className="flex justify-start gap-1 items-center text-[#0F172A] animate-pulse text-[10px] font-mono px-2">
                                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
                                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                        <span className="ml-1">Customer typing secure request...</span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Input Form Area */}
                            <div className="p-3 bg-slate-100 border-t border-slate-200 flex flex-col gap-2 shrink-0">
                                {/* Error Bar */}
                                {fileError && (
                                    <div className="text-[10px] text-red-400 bg-red-950 p-1.5 rounded-lg border border-red-900/30">
                                        {fileError}
                                    </div>
                                )}

                                {/* Attachment preview */}
                                {attachment && (
                                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200 text-[10px] dark:bg-slate-900">
                                        <div className="flex items-center gap-2 truncate max-w-[80%] text-[#0F172A]">
                                            {attachment.type.startsWith('image/') ? <ImageIcon className="w-3.5 h-3.5 text-emerald-400" /> : <FileIcon className="w-3.5 h-3.5 text-emerald-400" />}
                                            <span className="truncate">{attachment.name}</span>
                                        </div>
                                        <button onClick={() => setAttachment(null)} className="text-[#0F172A] hover:text-red-400 transition-colors">
                                            <XIcon className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-end gap-2">
                                    {/* File Input */}
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*,application/pdf,.doc,.docx"
                                        onChange={handleFileChange}
                                    />

                                    {/* Paperclip selector */}
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingFile}
                                        className="bg-slate-50 hover:bg-slate-850 p-2.5 rounded-xl transition-all border border-slate-200 text-[#0F172A] hover:text-white flex items-center justify-center disabled:opacity-70 h-[38px] cursor-pointer dark:bg-slate-900"
                                        title="Attach asset file"
                                    >
                                        {uploadingFile ? <LoaderIcon className="w-4 h-4 animate-spin text-emerald-400" /> : <PaperclipIcon className="w-4 h-4" />}
                                    </button>

                                    {/* Camera selector */}
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            fileInputRef.current?.setAttribute('capture', 'environment');
                                            fileInputRef.current?.click();
                                        }}
                                        disabled={uploadingFile}
                                        className="bg-slate-50 hover:bg-slate-850 p-2.5 rounded-xl transition-all border border-slate-200 text-[#0F172A] hover:text-white flex items-center justify-center disabled:opacity-70 h-[38px] cursor-pointer dark:bg-slate-900"
                                        title="Capture camera image"
                                    >
                                        <CameraIcon className="w-4 h-4" />
                                    </button>

                                    {/* ReactQuill Input wrap */}
                                    <div 
                                        className="flex-1 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs max-h-[100px] overflow-y-auto"
                                    >
                                        <textarea
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSend();
                                                }
                                            }}
                                            placeholder="Reply to user..."
                                            className="w-full bg-transparent text-white p-3.5 outline-none resize-none min-h-[38px]"
                                            rows={1}
                                        />
                                    </div>

                                    {/* Submit */}
                                    <button 
                                        onClick={() => handleSend()}
                                        disabled={uploadingFile || (!inputValue.trim() && !attachment)}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-xl disabled:opacity-45 transition-all h-[38px] flex items-center justify-center shrink-0 cursor-pointer"
                                    >
                                        <SendIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
