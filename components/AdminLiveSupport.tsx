import React, { useState, useEffect, useRef } from 'react';
import { 
    MessageSquareIcon, 
    XIcon, 
    SendIcon, 
    UserIcon, 
    ShieldIcon, 
    CheckCircleIcon, 
    Minimize2Icon, 
    AlertCircleIcon,
    RefreshCwIcon,
    PhoneIcon,
    PhoneOffIcon,
    MicIcon,
    MicOffIcon,
    BotIcon,
    SparklesIcon,
    Volume2Icon,
    WifiIcon,
    SparkleIcon,
    VolumeXIcon,
    CircleIcon,
    Copy as CopyIcon,
    Trash2 as TrashIcon,
    Undo2 as UndoIcon,
    Redo2 as RedoIcon,
    Video as VideoIcon,
    VideoOff as VideoOffIcon,
    Loader as LoaderIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../services/database';
import { ChatMessage, ChatSession, UserProfile } from '../types';
import { socket } from '../services/socket';

// --- ROBUST DATE AND TIME PARSING HELPER UTILITIES ---
const parseRobustDate = (val: any): Date => {
    if (!val) return new Date();
    if (val instanceof Date) return val;
    if (typeof val.toDate === 'function') {
        try { return val.toDate(); } catch(e) {}
    }
    if (val.seconds !== undefined) {
        return new Date(val.seconds * 1000);
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
};

const formatSafeTime = (timestampInput: any): string => {
    if (!timestampInput) return '--:--';
    try {
        const d = parseRobustDate(timestampInput);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
};

const formatSafeDate = (timestampInput: any): string => {
    if (!timestampInput) return '--/--/----';
    try {
        const d = parseRobustDate(timestampInput);
        return d.toLocaleDateString();
    } catch (err) {
        return new Date().toLocaleDateString();
    }
};

export const AdminLiveSupport: React.FC<{ 
    adminEmail: string, 
    initiationTarget?: { email: string, profile: UserProfile } | null, 
    onInitiationComplete?: () => void 
}> = ({ adminEmail, initiationTarget, onInitiationComplete }) => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
    const [inputValue, setInputValue] = useState('');
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
    const [isEmojiTrayOpen, setIsEmojiTrayOpen] = useState(false);
    const [activeFormat, setActiveFormat] = useState<string | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [incomingAlert, setIncomingAlert] = useState<ChatMessage | null>(null);
    const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);

    // RICH DECK TEXT COMPOSER STATE NODES
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [history, setHistory] = useState<string[]>([""]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const updateTextWithHistory = (newVal: string) => {
        setInputValue(newVal);
        if (newVal !== history[historyIndex]) {
            const nextHistory = history.slice(0, historyIndex + 1);
            setHistory([...nextHistory, newVal]);
            setHistoryIndex(nextHistory.length);
        }
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const prevIdx = historyIndex - 1;
            setHistoryIndex(prevIdx);
            setInputValue(history[prevIdx]);
        } else {
            showToast("Nothing to undo.");
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const nextIdx = historyIndex + 1;
            setHistoryIndex(nextIdx);
            setInputValue(history[nextIdx]);
        } else {
            showToast("Nothing to redo.");
        }
    };

    const handleCopy = () => {
        if (!inputValue) {
            showToast("No content to copy.");
            return;
        }
        navigator.clipboard.writeText(inputValue);
        showToast("Composer content copied to clipboard!");
    };

    const handleClear = () => {
        updateTextWithHistory("");
        showToast("Composer content cleared.");
    };

    const insertFormat = (prefix: string, suffix: string = prefix) => {
        const textarea = textareaRef.current;
        if (!textarea) {
            const newVal = inputValue + prefix + (prefix !== suffix ? "text" : "") + suffix;
            updateTextWithHistory(newVal);
            return;
        }
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);
        const replacement = prefix + (selectedText || "") + suffix;
        const newVal = text.substring(0, start) + replacement + text.substring(end);
        
        updateTextWithHistory(newVal);
        
        // Retain cursor-selection positions smoothly
        setTimeout(() => {
            textarea.focus();
            const offset = prefix.length;
            if (selectedText) {
                textarea.setSelectionRange(start, start + offset + selectedText.length + suffix.length);
            } else {
                textarea.setSelectionRange(start + offset, start + offset);
            }
        }, 50);
    };

    // Real-Time Chat Status Tracking System (Seen / Read / Replied / Typing)
    const [peerChatStatus, setPeerChatStatus] = useState<Record<string, { status: 'seen' | 'read' | 'replied' | 'typing'; timestamp: string }>>({});
    const [adminIsTyping, setAdminIsTyping] = useState(false);

    // AI Absence Autopilot States
    const [isAutopilotEnabled, setIsAutopilotEnabled] = useState<Record<string, boolean>>({});

    // AI Executive Smart Copilot Interactive Chat States
    const [isCopilotOpen, setIsCopilotOpen] = useState(false); // Default false for clean dual-pane, openable on demand!
    const [isCopilotFullscreen, setIsCopilotFullscreen] = useState(false); // Let admin expand into a full widescreen cyber-center deliberately
    const [windowPosition, setWindowPosition] = useState({ x: 0, y: 0 }); // Drag coordinates positioning
    const [isDragging, setIsDragging] = useState(false);
    const [isSyncingLedger, setIsSyncingLedger] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const dragStart = useRef({ x: 0, y: 0 });

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    const [copilotMessages, setCopilotMessages] = useState<Array<{ sender: 'admin' | 'copilot', content: string, timestamp: Date, suggestedTab?: string | null }>>([
        { sender: 'copilot', content: "Greetings Administrator. I am your Senior AI Executive Smart Copilot. Select a secure chat queue session to let me analyze user transaction history, credit metrics, and draft elite high-trust responses in real time.", timestamp: new Date(), suggestedTab: null }
    ]);
    const [copilotInput, setCopilotInput] = useState('');
    const [isCopilotTyping, setIsCopilotTyping] = useState(false);

    // Voice Call Connection States
    const [callState, setCallState] = useState<'idle' | 'dialing' | 'connected' | 'incoming'>('idle');
    const [isMuted, setIsMuted] = useState(false);
    const [isScramblerActive, setIsScramblerActive] = useState(false);
    const callCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // --- WEBRTC TELEMETRY & NOTE EXTRACTIONS ---
    const [callDuration, setCallDuration] = useState(0);
    const [finalCallDuration, setFinalCallDuration] = useState(0);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [summaryNotes, setSummaryNotes] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [showRecordDisclaimer, setShowRecordDisclaimer] = useState(false);
    const [callStats, setCallStats] = useState({ latency: 22, jitter: 0.9, packetLoss: 0.0 });
    const callTimerRef = useRef<any>(null);

    // Web Audio Instantiations
    const audioCtxRef = useRef<AudioContext | null>(null);
    const ringOsc1 = useRef<OscillatorNode | null>(null);
    const ringOsc2 = useRef<OscillatorNode | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const scramblerFilterRef = useRef<BiquadFilterNode | null>(null);
    const peerConnRef = useRef<RTCPeerConnection | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

    // Video states on admin side
    const [isVideoActive, setIsVideoActive] = useState(false);
    const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
    const [remoteVideoStream, setRemoteVideoStream] = useState<MediaStream | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = localVideoStream;
        }
    }, [localVideoStream]);

    useEffect(() => {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteVideoStream;
        }
    }, [remoteVideoStream]);

    const [realPresence, setRealPresence] = useState<Record<string, { email: string, status: string, currentPath: string, lastSeen: number }>>({});

    const activeMessages = activeSessionId ? (messages[activeSessionId] || []) : [];

    // Process presence data dynamically from real-time events for elite visuals
    const getPresenceState = (email: string) => {
        const presence = realPresence[email];
        if (presence) {
            const isOffline = presence.status === 'offline' || Date.now() - presence.lastSeen > 25000;
            if (isOffline) {
                return { 
                    label: 'OFFLINE', 
                    color: 'bg-slate-600 text-[#0F172A] border-slate-300/30', 
                    text: 'text-[#0F172A]', 
                    detail: `Disconnected ${formatSafeTime(presence.lastSeen)}` 
                };
            }
            const labelText = presence.status === 'active' ? 'FULLY ACTIVE' : 'ONLINE (IDLE)';
            const colorClass = presence.status === 'active' ? 'bg-emerald-400 text-emerald-400 border-emerald-500/30' : 'bg-cyan-400 text-cyan-400 border-cyan-500/30';
            const textClass = presence.status === 'active' ? 'text-emerald-400' : 'text-cyan-400';
            const detailText = `Viewing ${presence.currentPath || 'Dashboard'}`;
            return { label: labelText, color: colorClass, text: textClass, detail: detailText };
        }

        // Fallback for sessions prior to first heartbeat update
        const code = email.charCodeAt(0) ? email.charCodeAt(0) : 0;
        const hash = code % 2;
        if (hash === 0) return { label: 'FULLY ACTIVE', color: 'bg-emerald-400 text-emerald-400 border-emerald-500/30', text: 'text-emerald-400', detail: 'Home Portal' };
        return { label: 'ONLINE NOW', color: 'bg-cyan-400 text-cyan-400 border-cyan-500/30', text: 'text-cyan-400', detail: 'Overview Dashboard' };
    };

    // Load active session profile
    useEffect(() => {
        if (activeSessionId) {
            db.getUserProfile(activeSessionId).then(profile => {
                setActiveProfile(profile);
                // Introduce default contextual message to Copilot on switch
                if (profile) {
                    setCopilotMessages([
                        { 
                            sender: 'copilot', 
                            content: `I have thoroughly decrypted client profile and ledger credentials for ${profile.name || 'Elite Member'}.\n\n` + 
                                     `🔑 Name: ${profile.name}\n` +
                                     `💵 Total Balance: $${(profile.balance || 0).toLocaleString()}\n` +
                                     `🛡️ Security clearance: LEVEL-4 SOVEREIGN PRIVILEGE\n` +
                                     `🌍 Location Node: New York Corporate\n\n` +
                                     `How would you like to assist with their transaction flow today? I can help draft verification bypass logs, clear IMF compliance flags, or handle wire holding inquiries.`,
                            timestamp: new Date() 
                        }
                    ]);
                }
            });
        } else {
            setActiveProfile(null);
        }
    }, [activeSessionId]);

    useEffect(() => {
        if (initiationTarget) {
            const sid = initiationTarget.email;
            setActiveSessionId(sid);
            setIsMinimized(false);
            
            // Generate session if not exists
            setSessions(prev => {
                const existing = prev.find(s => s.id === sid);
                if (existing) return prev;
                return [{
                    id: sid,
                    userId: sid,
                    userName: initiationTarget.profile.name,
                    startedAt: new Date(),
                    lastUpdatedAt: new Date(),
                    status: 'active',
                    unreadAdminCount: 0,
                    unreadUserCount: 0
                }, ...prev];
            });

            if (!messages[sid]) {
                db.getChatMessages(sid).then(msgs => {
                    setMessages(prev => ({ ...prev, [sid]: msgs || [] }));
                });
            }

            if (onInitiationComplete) onInitiationComplete();
        }
    }, [initiationTarget, onInitiationComplete, messages]);

    // Emit read receipt when active session changes or when a new user message arrives in active session
    useEffect(() => {
        if (!activeSessionId) return;
        
        // Notify user in real-time that Admin has opened/viewed the communications
        socket.emit('chat:read_receipt', {
            sessionId: activeSessionId,
            userId: adminEmail,
            timestamp: new Date().toISOString()
        });

        // Update database to mark sessions as read
        const markSessionAsRead = async () => {
            const currentSession = sessions.find(s => s.id === activeSessionId);
            if (currentSession && currentSession.unreadAdminCount > 0) {
                const refreshed = { ...currentSession, unreadAdminCount: 0 };
                await db.saveChatSession(refreshed);
                setSessions(prev =>
                    prev.map(s => (s.id === activeSessionId ? refreshed : s))
                );
            }
        };
        markSessionAsRead();
    }, [activeSessionId, activeMessages.length, adminEmail]);

    // Admin Typing Broadcast Effect
    useEffect(() => {
        if (!activeSessionId) return;
        socket.emit('chat:typing', { sessionId: activeSessionId, senderId: adminEmail, isTyping: inputValue.length > 0 });
        
        let timer: any;
        if (inputValue.length > 0) {
            timer = setTimeout(() => {
                socket.emit('chat:typing', { sessionId: activeSessionId, senderId: adminEmail, isTyping: false });
            }, 3000);
        }
        
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [inputValue, activeSessionId, adminEmail]);

    // Audio Context alert sound
    const playAlertSound = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
        } catch(e) {}
    };

    // Load initial sessions
    useEffect(() => {
        const load = async () => {
            const allSessions = await db.getChatSessions();
            setSessions(allSessions.sort((a,b) => parseRobustDate(b.lastUpdatedAt).getTime() - parseRobustDate(a.lastUpdatedAt).getTime()));
        };
        load();
    }, []);

    // Load messages for active session
    useEffect(() => {
        if (!activeSessionId) return;
        const loadMsgs = async () => {
            const msgs = await db.getChatMessages(activeSessionId);
            setMessages(prev => ({ ...prev, [activeSessionId]: msgs }));
            
            // Mark read
            setSessions(prev => prev.map(s => {
                if(s.id === activeSessionId) return { ...s, unreadAdminCount: 0 };
                return s;
            }));
            
            const updatedSessions = await db.getChatSessions();
            const sessionIndex = updatedSessions.findIndex(s => s.id === activeSessionId);
            if (sessionIndex !== -1) {
                updatedSessions[sessionIndex].unreadAdminCount = 0;
                await db.saveChatSession(updatedSessions[sessionIndex]);
            }
        };
        loadMsgs();
    }, [activeSessionId]);

    // Track active connection call duration timer
    useEffect(() => {
        if (callState === 'connected') {
            setCallDuration(0);
            callTimerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            if (callTimerRef.current) {
                clearInterval(callTimerRef.current);
                callTimerRef.current = null;
            }
        }
        return () => {
            if (callTimerRef.current) {
                clearInterval(callTimerRef.current);
            }
        };
    }, [callState]);

    // Real-time voice connection quality telemetry statistics
    useEffect(() => {
        let statsInterval: any = null;
        if (callState === 'connected') {
            setCallStats({ latency: 18, jitter: 0.6, packetLoss: 0.0 });
            statsInterval = setInterval(async () => {
                let latencyVal = Math.round(15 + Math.random() * 12);
                let jitterVal = parseFloat((0.4 + Math.random() * 0.8).toFixed(2));
                let lossVal = parseFloat((Math.random() < 0.05 ? Math.random() * 0.05 : 0).toFixed(2));

                if (peerConnRef.current) {
                    try {
                        const rstats = await peerConnRef.current.getStats();
                        rstats.forEach(report => {
                            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                                if (report.currentRoundTripTime !== undefined) {
                                    latencyVal = Math.round(report.currentRoundTripTime * 1000);
                                }
                            }
                            if (report.type === 'inbound-rtp' && report.kind === 'audio') {
                                if (report.jitter !== undefined) {
                                    jitterVal = parseFloat((report.jitter * 1000).toFixed(2));
                                }
                                if (report.packetsLost !== undefined && report.packetsReceived !== undefined) {
                                    const total = report.packetsLost + report.packetsReceived;
                                    if (total > 0) {
                                        lossVal = parseFloat(((report.packetsLost / total) * 100).toFixed(2));
                                    }
                                }
                            }
                        });
                    } catch (e) {
                        // ignore and fall back to clean randomized simulation
                    }
                }
                setCallStats({ latency: latencyVal, jitter: jitterVal, packetLoss: lossVal });
            }, 2000);
        } else {
            setCallStats({ latency: 0, jitter: 0, packetLoss: 0 });
        }
        return () => {
            if (statsInterval) clearInterval(statsInterval);
        };
    }, [callState]);

    // Socket listening handles active user presence states, calls, and chat syncs
    useEffect(() => {
        const handleReceiveMsg = async (msg: ChatMessage) => {
            setMessages(prev => {
                const sessionMsgs = prev[msg.sessionId] || [];
                if (sessionMsgs.find(m => m.id === msg.id)) return prev;
                return { ...prev, [msg.sessionId]: [...sessionMsgs, msg] };
            });

            const isUser = msg.senderId === 'user';
            const fallbackName = msg.sessionId.split('@')[0];

            // Update session inside local state queue dynamically
            setSessions(prev => {
                const sessionExists = prev.find(s => s.id === msg.sessionId);
                if (sessionExists) {
                    return prev.map(s => {
                        if (s.id === msg.sessionId) {
                            return { 
                                ...s, 
                                userName: isUser ? msg.senderName : s.userName,
                                unreadAdminCount: (msg.senderId !== adminEmail && activeSessionId !== msg.sessionId) 
                                    ? s.unreadAdminCount + 1 
                                    : s.unreadAdminCount, 
                                lastUpdatedAt: new Date(msg.timestamp) 
                            };
                        }
                        return s;
                    }).sort((a,b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime());
                } else {
                    const newSession: ChatSession = {
                        id: msg.sessionId,
                        userId: msg.sessionId,
                        userName: isUser ? msg.senderName : fallbackName,
                        startedAt: new Date(msg.timestamp),
                        lastUpdatedAt: new Date(msg.timestamp),
                        status: 'active',
                        unreadAdminCount: msg.senderId !== adminEmail ? 1 : 0,
                        unreadUserCount: msg.senderId === adminEmail ? 1 : 0
                    };
                    return [newSession, ...prev];
                }
            });

            if (isUser) {
                if (activeSessionId !== msg.sessionId || isMinimized) {
                    playAlertSound();
                    setIncomingAlert(msg);
                    setTimeout(() => setIncomingAlert(null), 5000);
                }
            }
        };

        const handleAlert = (msg: any) => {
            if (msg.senderId === 'user' && activeSessionId !== msg.sessionId) {
                playAlertSound();
                setIncomingAlert(msg);
                setTimeout(() => setIncomingAlert(null), 5000);
            }
        };

        const handleAutopilotStatusChange = (data: { sessionId: string, enabled: boolean }) => {
            setIsAutopilotEnabled(prev => ({ ...prev, [data.sessionId]: data.enabled }));
        };

        // Voice Socket Handling on Administrator Side
        const handleVoiceInvite = (data: any) => {
            if (data.sessionId === activeSessionId) {
                if (data.type === 'start_request') {
                    setCallState('incoming');
                    playAdminRinger();
                } else if (data.type === 'terminate') {
                    handleEndCall();
                }
            }
        };

        const handleVoiceAccept = (data: any) => {
            if (data.sessionId === activeSessionId) {
                // Customer accepted physical call!
                stopDialTone();
                setCallState('connected');
                initilizeWebAudioStream();
            }
        };

        const handleVoiceTerminate = (data: any) => {
            if (data.sessionId === activeSessionId) {
                handleEndCall();
            }
        };

        const handlePresenceUpdate = (entries: Array<[string, any]>) => {
            console.log("[WS PRESENCE UPDATE] Received entries:", entries);
            const presenceMap: Record<string, any> = {};
            for (const [email, presence] of entries) {
                presenceMap[email] = presence;
            }
            setRealPresence(presenceMap);
        };

        const handleWebRTCAnswer = async (data: any) => {
            if (data.sessionId === activeSessionId && peerConnRef.current) {
                try {
                    console.log("[WebRTC Agent] Received answer from customer:", data.answer);
                    await peerConnRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
                } catch (e) {
                    console.error("[WebRTC Agent] Remote description setting failed:", e);
                }
            }
        };

        const handleRemoteICECandidate = async (data: any) => {
            if (data.sessionId === activeSessionId && peerConnRef.current && data.sender !== 'admin') {
                try {
                    if (data.candidate) {
                        console.log("[WebRTC Agent] Received customer ICE candidate:", data.candidate);
                        await peerConnRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                    }
                } catch (e) {
                    console.error("[WebRTC Agent] ICE candidate absorption failed:", e);
                }
            }
        };

        const handlePeerTyping = (data: { sessionId: string; senderId: string; isTyping: boolean }) => {
            if (data.sessionId === activeSessionId && data.senderId !== adminEmail) {
                setPeerChatStatus(prev => ({
                    ...prev,
                    [data.sessionId]: {
                        status: data.isTyping ? 'typing' as const : 'seen' as const,
                        timestamp: new Date().toISOString()
                    }
                }));
            }
        };

        const handlePeerReadReceipt = (data: { sessionId: string; userId: string; timestamp: string }) => {
            if (data.sessionId === activeSessionId && data.userId !== adminEmail) {
                setPeerChatStatus(prev => ({
                    ...prev,
                    [data.sessionId]: {
                        status: 'read' as const,
                        timestamp: data.timestamp || new Date().toISOString()
                    }
                }));
            }
        };

        const handleVideoToggleRemote = (data: any) => {
            if (data.sessionId === activeSessionId && data.sender !== 'admin') {
                setIsVideoActive(data.isVideoActive);
                if (data.isVideoActive) {
                    initilizeWebAudioStream(true);
                }
            }
        };

        socket.on('chat:receive_message', handleReceiveMsg);
        socket.on('admin:chat_alert', handleAlert);
        socket.on('chat:voice_call_invite', handleVoiceInvite);
        socket.on('chat:voice_call_accept', handleVoiceAccept);
        socket.on('chat:voice_call_terminate', handleVoiceTerminate);
        socket.on('presence_update', handlePresenceUpdate);
        socket.on('webrtc:answer', handleWebRTCAnswer);
        socket.on('webrtc:ice_candidate', handleRemoteICECandidate);
        socket.on('webrtc:video_toggle', handleVideoToggleRemote);
        socket.on('chat:autopilot_status_change', handleAutopilotStatusChange);
        socket.on('chat:typing', handlePeerTyping);
        socket.on('chat:read_receipt', handlePeerReadReceipt);

        return () => {
            socket.off('chat:receive_message', handleReceiveMsg);
            socket.off('admin:chat_alert', handleAlert);
            socket.off('chat:voice_call_invite', handleVoiceInvite);
            socket.off('chat:voice_call_accept', handleVoiceAccept);
            socket.off('chat:voice_call_terminate', handleVoiceTerminate);
            socket.off('presence_update', handlePresenceUpdate);
            socket.off('webrtc:answer', handleWebRTCAnswer);
            socket.off('webrtc:ice_candidate', handleRemoteICECandidate);
            socket.off('webrtc:video_toggle', handleVideoToggleRemote);
            socket.off('chat:autopilot_status_change', handleAutopilotStatusChange);
            socket.off('chat:typing', handlePeerTyping);
            socket.off('chat:read_receipt', handlePeerReadReceipt);
        };
    }, [activeSessionId, isMinimized]);

    // Scroll to bottom
    useEffect(() => {
        if (!isMinimized && activeSessionId) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, activeSessionId, isMinimized]);

    // UI triggers to dispatch typical human replies
    const handleSend = async () => {
        if (!inputValue.trim() || !activeSessionId) return;

        const newMsg: ChatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            sessionId: activeSessionId,
            senderId: adminEmail,
            senderName: 'Support',
            content: inputValue.trim(),
            timestamp: new Date(),
            read: false
        };

        setInputValue('');
        setMessages(prev => ({ 
            ...prev, 
            [activeSessionId]: [...(prev[activeSessionId] || []), newMsg] 
        }));

        await db.saveChatMessage(newMsg);

        // Update session
        const session = sessions.find(s => s.id === activeSessionId);
        if (session) {
            session.lastUpdatedAt = new Date();
            session.unreadUserCount += 1;
            await db.saveChatSession(session);
        }

        socket.emit('chat:send_message', newMsg);
    };

    // Toggle AI Absence Autopilot
    const handleToggleAutopilot = (sid: string) => {
        const targetState = !isAutopilotEnabled[sid];
        setIsAutopilotEnabled(prev => ({ ...prev, [sid]: targetState }));
        socket.emit('admin:toggle_autopilot', { sessionId: sid, enabled: targetState });
    };

    // Chat with the AI Executive Smart Copilot Interactive Panel
    const handleSendCopilotMessage = async (overrideMsg?: string) => {
        const msgText = overrideMsg || copilotInput;
        if (!msgText.trim() || !activeSessionId) return;

        const userMsg = { sender: 'admin' as const, content: msgText, timestamp: new Date() };
        setCopilotMessages(prev => [...prev, userMsg]);
        setCopilotInput('');
        setIsCopilotTyping(true);

        try {
            const chatHistory = activeMessages.slice(-8).map(m => ({ role: m.senderId === 'user' ? 'user' : 'model', content: m.content }));
            const response = await fetch('/api/admin/copilot-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: userMsg.content,
                    chatContext: chatHistory,
                    clientInfo: activeProfile || { email: activeSessionId, name: 'Sovereign client' }
                })
            });

            if (response.ok) {
                const data = await response.json();
                setCopilotMessages(prev => [...prev, {
                    sender: 'copilot',
                    content: data.response || "No feedback generated.",
                    timestamp: new Date(),
                    suggestedTab: data.suggestedTab || null
                }]);
            } else {
                setCopilotMessages(prev => [...prev, {
                    sender: 'copilot',
                    content: "Authorization clearance required for this operation. I am standing by.",
                    timestamp: new Date(),
                    suggestedTab: null
                }]);
            }
        } catch (e) {
            console.warn("[Copilot Web Query] Failed", e);
            setCopilotMessages(prev => [...prev, {
                sender: 'copilot',
                content: "Sovereign firewall delayed deep analysis. Direct operational control is with you.",
                timestamp: new Date(),
                suggestedTab: null
            }]);
        } finally {
            setIsCopilotTyping(false);
        }
    };

    // Trigger AI response on behalf of Administrator
    const triggerDirectAiBotReply = () => {
        if (!activeSessionId) return;
        const lastUserMsg = [...activeMessages].reverse().find(m => m.senderId === 'user');
        socket.emit('chat:trigger_ai_reply', { 
            sessionId: activeSessionId, 
            content: lastUserMsg ? lastUserMsg.content : "Inquire secure status summary" 
        });
    };

    // VOICE CALL METRICS & PROCEDURAL SIGNALS (WEB AUDIO API)
    const playDialTone = () => {
        try {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            
            // US Rhythmic Telephone Ring Tone is a pair of 440Hz + 480Hz modulated oscillators
            ringOsc1.current = audioCtxRef.current.createOscillator();
            ringOsc2.current = audioCtxRef.current.createOscillator();
            
            const ringGain = audioCtxRef.current.createGain();
            
            ringOsc1.current.frequency.value = 440;
            ringOsc2.current.frequency.value = 480;
            
            ringOsc1.current.connect(ringGain);
            ringOsc2.current.connect(ringGain);
            ringGain.connect(audioCtxRef.current.destination);
            
            ringGain.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
            
            // Rhythmically modulate telephone ring: 2 seconds on, 4 seconds off
            let tick = 0;
            const interval = setInterval(() => {
                if (callState !== 'dialing') {
                    clearInterval(interval);
                    return;
                }
                const now = audioCtxRef.current?.currentTime || 0;
                if (tick % 3 === 0) {
                    ringGain.gain.setValueAtTime(0.15, now);
                } else if (tick % 3 === 1) {
                    ringGain.gain.setValueAtTime(0, now);
                }
                tick++;
            }, 2000);
            
            ringOsc1.current.start();
            ringOsc2.current.start();
        } catch (e) {
            console.error("Dial Tone error:", e);
        }
    };

    const stopDialTone = () => {
        try {
            ringOsc1.current?.stop();
            ringOsc2.current?.stop();
            ringOsc1.current = null;
            ringOsc2.current = null;
        } catch (e) {}
    };

    const playAdminRinger = () => {
        try {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            ringOsc1.current = audioCtxRef.current.createOscillator();
            ringOsc2.current = audioCtxRef.current.createOscillator();
            const ringGain = audioCtxRef.current.createGain();
            
            ringOsc1.current.frequency.value = 440;
            ringOsc2.current.frequency.value = 480;
            
            ringOsc1.current.connect(ringGain);
            ringOsc2.current.connect(ringGain);
            ringGain.connect(audioCtxRef.current.destination);
            
            ringGain.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
            
            let tick = 0;
            const ringerInterval = setInterval(() => {
                if (callState !== 'incoming') {
                    clearInterval(ringerInterval);
                    try {
                        ringOsc1.current?.stop();
                        ringOsc2.current?.stop();
                    } catch(e){}
                    return;
                }
                const now = audioCtxRef.current?.currentTime || 0;
                if (tick % 3 === 0) {
                    ringGain.gain.setValueAtTime(0.12, now);
                } else if (tick % 3 === 1) {
                    ringGain.gain.setValueAtTime(0, now);
                }
                tick++;
            }, 1000);
            
            ringOsc1.current.start();
            ringOsc2.current.start();
        } catch (e) {
            console.error("Admin ringer error:", e);
        }
    };

    const stopAdminRinger = () => {
        try {
            ringOsc1.current?.stop();
            ringOsc2.current?.stop();
            ringOsc1.current = null;
            ringOsc2.current = null;
        } catch (e) {}
    };

    const handleAdminAcceptCall = () => {
        stopAdminRinger();
        setCallState('connected');
        socket.emit('chat:voice_call_accept', { sessionId: activeSessionId });
        initilizeWebAudioStream();
    };

    const startWebRTCPeerConnection = async (stream: MediaStream) => {
        try {
            console.log("[WebRTC Agent] Instantiating high-fidelity sound bridge...");
            
            if (peerConnRef.current) {
                peerConnRef.current.close();
            }

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun1.l.google.com:19302' }]
            });
            peerConnRef.current = pc;

            // Stream tracks
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('webrtc:ice_candidate', {
                        sessionId: activeSessionId,
                        candidate: event.candidate,
                        sender: 'admin'
                    });
                }
            };

            pc.ontrack = (event) => {
                console.log("[WebRTC Agent] Received direct customer sound track:", event.track.kind);
                const [remoteStream] = event.streams;
                if (remoteStream) {
                    if (event.track.kind === 'video') {
                        setRemoteVideoStream(remoteStream);
                    } else {
                        if (!remoteAudioRef.current) {
                            const audio = document.createElement('audio');
                            audio.autoplay = true;
                            audio.setAttribute('playsinline', 'true');
                            remoteAudioRef.current = audio;
                            document.body.appendChild(audio);
                        }
                        remoteAudioRef.current.srcObject = remoteStream;
                    }
                }
            };

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit('webrtc:offer', {
                sessionId: activeSessionId,
                offer: offer
            });
        } catch (e) {
            console.error("[WebRTC Agent] Connection creation failed:", e);
        }
    };

    // Capture standard User Audio & Pipe into custom Analyser loops for genuine live response 
    const initilizeWebAudioStream = async (videoEnabled: boolean = false) => {
        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            }
            if (audioCtxRef.current.state === 'suspended') {
                await audioCtxRef.current.resume();
            }

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: videoEnabled ? { width: 480, height: 360, facingMode: 'user' } : false
            }).catch(() => null);
            
            analyserRef.current = audioCtxRef.current.createAnalyser();
            analyserRef.current.fftSize = 64; // Small sample rate for canvas visualizer rows

            if (stream) {
                localStreamRef.current = stream;
                setLocalVideoStream(stream);

                const audioTrack = stream.getAudioTracks()[0];
                if (audioTrack) {
                    audioSourceRef.current = audioCtxRef.current.createMediaStreamSource(new MediaStream([audioTrack]));
                    
                    // Add retro voice scrambler filter channel if active
                    if (isScramblerActive) {
                        scramblerFilterRef.current = audioCtxRef.current.createBiquadFilter();
                        scramblerFilterRef.current.type = 'peaking';
                        scramblerFilterRef.current.frequency.value = 1200; // scramble
                        scramblerFilterRef.current.Q.value = 8.0;
                        scramblerFilterRef.current.gain.value = 15;
                        
                        audioSourceRef.current.connect(scramblerFilterRef.current);
                        scramblerFilterRef.current.connect(analyserRef.current);
                    } else {
                        audioSourceRef.current.connect(analyserRef.current);
                    }
                    
                    // Keep local audio quiet to prevent extreme feedback
                    const gain = audioCtxRef.current.createGain();
                    gain.gain.value = 0.05;
                    analyserRef.current.connect(gain);
                    gain.connect(audioCtxRef.current.destination);
                }

                if (peerConnRef.current) {
                    const senders = peerConnRef.current.getSenders();
                    stream.getTracks().forEach(track => {
                        const sender = senders.find(s => s.track?.kind === track.kind);
                        if (sender) {
                            sender.replaceTrack(track);
                        } else {
                            peerConnRef.current?.addTrack(track, stream);
                        }
                    });
                } else {
                    // Start WebRTC sound tunnel
                    startWebRTCPeerConnection(stream);
                }
            }

            // Begin Drawing responsive Audio waves
            runWaveVisualizer();
        } catch (e) {
            console.error("Audio streaming failure, running simulation:", e);
            runWaveVisualizer(); // Fallback to synthetic waves
        }
    };

    const handleToggleVideo = () => {
        const nextState = !isVideoActive;
        setIsVideoActive(nextState);
        initilizeWebAudioStream(nextState);
        socket.emit('webrtc:video_toggle', { sessionId: activeSessionId, isVideoActive: nextState, sender: 'admin' });
    };

    const runWaveVisualizer = () => {
        const canvas = callCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyserRef.current ? analyserRef.current.frequencyBinCount : 32;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (callState === 'idle') return;
            animationFrameRef.current = requestAnimationFrame(draw);

            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);

            if (analyserRef.current) {
                analyserRef.current.getByteFrequencyData(dataArray);
            } else {
                // Procedural idle oscillator
                for (let i = 0; i < bufferLength; i++) {
                    dataArray[i] = Math.sin(Date.now() * 0.005 + i * 0.3) * 35 + 40;
                }
            }

            // Draw clean geometric neon responsive sound wavebars
            const barWidth = (width / bufferLength) * 1.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * height * 1.1;
                
                // Design-centric solid neon gold/cyan gradients
                ctx.fillStyle = `rgba(245, 158, 11, ${0.4 + (dataArray[i] / 255)})`;
                ctx.fillRect(x, height / 2 - barHeight / 2, barWidth - 2, barHeight);
                ctx.fillRect(x, height / 2 + barHeight / 2 - 1, barWidth - 2, 2); // Double symmetrical
                
                x += barWidth;
            }
        };
        draw();
    };

    const handleInitiateCall = () => {
        if (!activeSessionId) return;
        setCallState('dialing');
        playDialTone();
        
        socket.emit('chat:voice_call_invite', { sessionId: activeSessionId, type: 'start' });
    };

    const handleEndCall = () => {
        stopDialTone();
        stopAdminRinger();
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (peerConnRef.current) {
            peerConnRef.current.close();
            peerConnRef.current = null;
        }
        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
            remoteAudioRef.current.remove();
            remoteAudioRef.current = null;
        }

        setIsRecording(false);
        if (callState === 'connected' || callState === 'dialing') {
            setFinalCallDuration(callDuration);
            setShowSummaryModal(true);
            setSummaryNotes('');
        }

        setCallState('idle');
        socket.emit('chat:voice_call_invite', { sessionId: activeSessionId, type: 'terminate' });
    };

    const handleSaveSummaryNotes = async () => {
        if (!activeProfile) return;

        const timestamp = new Date().toISOString();
        const newInteraction = {
            id: 'call_' + Date.now(),
            type: 'Real-time Secure Voice Call',
            duration: finalCallDuration,
            notes: summaryNotes.trim() || 'No notes provided by representative.',
            timestamp,
            agentEmail: adminEmail || 'Verified Wealth Advisor'
        };

        const currentInteractions = activeProfile.interactions || [];
        const updatedInteractions = [newInteraction, ...currentInteractions];

        try {
            await db.updateUserProfile(activeProfile.email, {
                interactions: updatedInteractions
            });
            setActiveProfile(prev => prev ? { ...prev, interactions: updatedInteractions } : null);
            setShowSummaryModal(false);
            setSummaryNotes('');
        } catch (e) {
            console.error('[Summary Notes Error] Cannot save:', e);
            alert('Unable to persist summary ledger note. Please try again.');
        }
    };

    useEffect(() => {
        return () => {
            stopDialTone();
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (peerConnRef.current) {
                peerConnRef.current.close();
            }
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = null;
                remoteAudioRef.current.remove();
            }
        };
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('.cursor-pointer')) return;
        setIsDragging(true);
        dragStart.current = { x: e.clientX - windowPosition.x, y: e.clientY - windowPosition.y };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            setWindowPosition({
                x: e.clientX - dragStart.current.x,
                y: e.clientY - dragStart.current.y
            });
        };
        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const handleSyncLedger = async () => {
        if (isSyncingLedger) return;
        setIsSyncingLedger(true);
        try {
            const allSessions = await db.getChatSessions();
            setSessions(allSessions.sort((a,b) => parseRobustDate(b.lastUpdatedAt).getTime() - parseRobustDate(a.lastUpdatedAt).getTime()));
            showToast("Sovereign Support Queue synced.");
        } catch (e) {
            showToast("Failed to fetch ledger queue.");
        } finally {
            setTimeout(() => {
                setIsSyncingLedger(false);
            }, 700);
        }
    };

    const totalUnread = sessions.reduce((acc, s) => acc + s.unreadAdminCount, 0);

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex items-end gap-4 pointer-events-none">
            
            {/* Incoming Alert Popup */}
            {incomingAlert && !isMinimized && activeSessionId !== incomingAlert.sessionId && (
                <div onClick={() => { setActiveSessionId(incomingAlert.sessionId); setIsMinimized(false); setIncomingAlert(null); }} className="pointer-events-auto cursor-pointer bg-slate-100 border border-emerald-500/50 shadow-[0_10px_40px_rgba(16,185,129,0.3)] rounded-2xl p-4 flex items-center gap-4 animate-fade-in mb-4 max-w-sm">
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                        <AlertCircleIcon className="w-5 h-5 text-emerald-400 animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-emerald-400 tracking-widest uppercase mb-1">Incoming Lead Intercept</p>
                        <p className="text-sm font-bold text-white truncate">{incomingAlert.senderName}</p>
                        <p className="text-xs text-[#0F172A] truncate">{incomingAlert.content}</p>
                    </div>
                </div>
            )}

            {/* Chat Manager Window */}
            {sessions.length > 0 && (
                <div 
                    style={{ transform: `translate(${windowPosition.x}px, ${windowPosition.y}px)` }}
                    className={`pointer-events-auto bg-slate-50 dark:bg-slate-900  border border-slate-200 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-[width] duration-300 flex ${
                        isMinimized 
                            ? 'w-[340px] h-14 cursor-pointer' 
                            : isCopilotOpen 
                                ? 'w-[1240px] h-[720px]' 
                                : 'w-[840px] h-[720px]'
                    }`}
                >
                    
                    {/* Header for minimized state */}
                    {isMinimized && (
                        <div 
                            onMouseDown={handleMouseDown}
                            className="w-full flex items-center justify-between px-5 hover:bg-white transition-colors cursor-grab active:cursor-grabbing select-none dark:bg-slate-800" 
                            onClick={() => setIsMinimized(false)}
                        >
                            <div className="flex items-center gap-3">
                                <ShieldIcon className="w-5 h-5 text-emerald-400" />
                                <span className="font-bold text-sm tracking-wide text-white">Sovereign Desk Intercept</span>
                            </div>
                            {totalUnread > 0 && (
                                <span className="p-1 px-2.5 rounded-full bg-red-500 text-white font-black tracking-widest text-[10px] animate-pulse">
                                    {totalUnread} NEW
                                </span>
                            )}
                        </div>
                    )}

                    {/* Full View */}
                    {!isMinimized && (
                        <>
                            {/* Sidebar (Session List) */}
                            <div className="w-[280px] bg-slate-100 border-r border-slate-200/80 flex flex-col h-full shrink-0">
                                <div 
                                    onMouseDown={handleMouseDown}
                                    className="p-4 border-b border-slate-200/80 bg-slate-50 dark:bg-slate-900 flex justify-between items-center cursor-grab active:cursor-grabbing select-none"
                                >
                                    <h2 className="text-xs font-bold uppercase text-emerald-400 tracking-widest flex items-center gap-2">
                                        <ShieldIcon className="w-4 h-4" />
                                        Support Queue
                                    </h2>
                                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                        <button 
                                            onClick={handleSyncLedger} 
                                            className="p-1 px-1.5 rounded-lg hover:bg-white text-[#0F172A] hover:text-emerald-400 transition-colors dark:bg-slate-800"
                                            title="Sync Sovereign Ledger Queue"
                                        >
                                            <RefreshCwIcon className={`w-3.5 h-3.5 ${isSyncingLedger ? 'animate-spin text-emerald-450' : ''}`} />
                                        </button>
                                        <button onClick={() => setIsMinimized(true)} className="p-1 px-1.5 rounded-lg hover:bg-white text-[#0F172A] transition-colors dark:bg-slate-800">
                                            <Minimize2Icon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5 bg-slate-50 dark:bg-slate-800">
                                    {sessions.map(s => {
                                        const presence = getPresenceState(s.id);
                                        const isAutopilotOn = isAutopilotEnabled[s.id] || false;
                                        return (
                                            <button 
                                                key={s.id}
                                                onClick={() => setActiveSessionId(s.id)}
                                                className={`w-full text-left p-3.5 rounded-2xl transition-all border shrink-0 flex flex-col gap-1 ${activeSessionId === s.id ? 'bg-emerald-500 border-emerald-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]' : 'border-transparent hover:bg-white'}`}
                                            >
                                                <div className="flex justify-between items-start w-full">
                                                    <span className={`font-semibold text-sm truncate max-w-[140px] ${activeSessionId === s.id ? 'text-emerald-400' : 'text-[#1E293B]'}`}>
                                                        {s.userName}
                                                    </span>
                                                    <div className="flex flex-col items-end shrink-0">
                                                        <span className="text-[9px] font-mono text-[#0F172A]">
                                                            {formatSafeTime(s.lastUpdatedAt)}
                                                        </span>
                                                        {peerChatStatus[s.id] && (
                                                            <span className={`text-[8px] font-mono leading-none tracking-wider font-bold uppercase mt-0.5 ${
                                                                peerChatStatus[s.id].status === 'typing' ? 'text-cyan-450 animate-pulse' :
                                                                peerChatStatus[s.id].status === 'read' ? 'text-emerald-450' :
                                                                peerChatStatus[s.id].status === 'replied' ? 'text-slate-450' : 'text-[#0F172A]'
                                                            }`}>
                                                                {peerChatStatus[s.id].status}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Genuine Online / Active Indicator badges */}
                                                <div className="flex items-center justify-between mt-1">
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <span className="relative flex h-2 w-2">
                                                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${presence.color}`}></span>
                                                            <span className={`relative inline-flex rounded-full h-2 w-2 ${presence.color}`}></span>
                                                        </span>
                                                        <span className={`text-[9px] font-bold uppercase tracking-wider font-mono ${presence.text}`}>
                                                            {presence.label}
                                                        </span>
                                                    </div>
                                                    
                                                    {isAutopilotOn && (
                                                        <span className="bg-purple-950 border border-purple-500/30 text-[8px] font-mono rounded text-purple-300 px-1 hover:brightness-110">
                                                            🤖 AI
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <p className="text-[10px] text-[#0F172A] font-mono mt-0.5 truncate w-full">{presence.detail}</p>
                                                
                                                {s.unreadAdminCount > 0 && (
                                                    <div className="mt-2.5 flex items-center gap-1.5 bg-red-950 px-2 py-1 rounded-lg border border-red-500/10 shrink-0">
                                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce"></div>
                                                        <span className="text-[8px] uppercase tracking-wider font-extrabold text-red-400 font-mono leading-none">{s.unreadAdminCount} UNRESOLVED CASE</span>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 flex flex-col h-full bg-[#080d16] relative overflow-hidden">
                                {activeSessionId ? (
                                    <>
                                        {/* Chat Header */}
                                        <div 
                                            onMouseDown={handleMouseDown}
                                            className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200/80 flex items-center justify-between shrink-0 cursor-grab active:cursor-grabbing select-none"
                                        >
                                            <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-300/50 dark:bg-slate-800">
                                                    <UserIcon className="w-5 h-5 text-[#0F172A]" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-white text-base tracking-wide flex items-center gap-2">
                                                        {sessions.find(s=>s.id === activeSessionId)?.userName}
                                                        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <p className="text-xs text-[#0F172A] font-mono">{activeSessionId}</p>
                                                        <span className="text-[9px] uppercase tracking-widest font-bold font-mono px-1.5 py-0.5 rounded bg-white text-emerald-400 border border-emerald-500/20 dark:bg-slate-800">
                                                            {getPresenceState(activeSessionId).detail}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Top Toolbar Actions: Real-time Audio Phone line Call and Bot Autopilot Toggles */}
                                            <div className="flex items-center gap-2.5" onClick={e => e.stopPropagation()}>
                                                
                                                {/* Senior AI Copilot Toggle Button */}
                                                <button 
                                                    onClick={() => setIsCopilotOpen(!isCopilotOpen)}
                                                    className={`p-2 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider font-mono flex items-center gap-2 transition-all ${
                                                        isCopilotOpen
                                                            ? 'bg-amber-950 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-pulse' 
                                                            : 'bg-slate-100 text-[#0F172A] border-slate-200 hover:text-white hover:border-slate-300 shadow-md'
                                                    }`}
                                                    title="Toggle Senior AI Co-Pilot Intelligence Pane"
                                                >
                                                    <SparklesIcon className={`w-3.5 h-3.5 ${isCopilotOpen ? 'animate-bounce text-amber-400' : 'text-amber-500'}`} />
                                                    AI Copilot: {isCopilotOpen ? 'OPEN' : 'CLOSED'}
                                                </button>

                                                {/* Sovereign AI Autopilot Absence Assist Active Toggle */}
                                                <button 
                                                    onClick={() => handleToggleAutopilot(activeSessionId)}
                                                    className={`p-2 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider font-mono flex items-center gap-2 transition-all ${
                                                        isAutopilotEnabled[activeSessionId]
                                                            ? 'bg-purple-950 text-purple-300 border-purple-500/40 shadow-[0_0_15px_rgba(147,51,234,0.15)]' 
                                                            : 'bg-slate-100 text-[#0F172A] border-slate-200 hover:text-white hover:border-slate-300'
                                                    }`}
                                                    title="When enabled, Sovereign AI automatically responds during your absence"
                                                >
                                                    <BotIcon className={`w-3.5 h-3.5 ${isAutopilotEnabled[activeSessionId] ? 'animate-bounce text-purple-400' : ''}`} />
                                                    Absence Autopilot: {isAutopilotEnabled[activeSessionId] ? 'ON' : 'OFF'}
                                                </button>

                                                {/* Real-time calling section */}
                                                {callState === 'idle' ? (
                                                    <button 
                                                        onClick={handleInitiateCall}
                                                        className="bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg hover:shadow-emerald-900/30 hover:scale-[1.02] transition-all border border-emerald-500/30"
                                                    >
                                                        <PhoneIcon className="w-3.5 h-3.5 animate-pulse" />
                                                        Start Audio Call
                                                    </button>
                                                ) : callState === 'incoming' ? (
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={handleEndCall}
                                                            className="bg-red-600 hover:bg-red-500 text-white p-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all border border-red-500/30"
                                                        >
                                                            <PhoneOffIcon className="w-3.5 h-3.5" />
                                                            Decline
                                                        </button>
                                                        <button 
                                                            onClick={handleAdminAcceptCall}
                                                            className="bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all border border-emerald-500/30"
                                                        >
                                                            <PhoneIcon className="w-3.5 h-3.5 animate-bounce" />
                                                            Accept Call
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={handleEndCall}
                                                        className="bg-red-600 hover:bg-red-500 text-white p-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all border border-red-500/30"
                                                    >
                                                        <PhoneOffIcon className="w-3.5 h-3.5 animate-bounce" />
                                                        End Audio Call ({callState.toUpperCase()})
                                                    </button>
                                                )}

                                            </div>
                                        </div>

                                         {/* Direct Caller Interlock Screen Overlay */}
                                         <AnimatePresence>
                                             {callState !== 'idle' && (
                                                 <motion.div 
                                                     key="voice-overlay"
                                                     initial={{ opacity: 0, y: -20, scale: 0.98 }}
                                                     animate={{ opacity: 1, y: 0, scale: 1 }}
                                                     exit={{ opacity: 0, y: -20, scale: 0.98 }}
                                                     transition={{ duration: 0.3, ease: "easeOut" }}
                                                     className="absolute top-0 left-0 w-full bg-slate-50 dark:bg-slate-800 border-b border-emerald-500/20  p-5 z-40 flex flex-col gap-3 overflow-hidden"
                                                 >
                                                     {/* Record Consent/Privacy Disclaimer Popup */}
                                                     {showRecordDisclaimer && (
                                                         <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800  flex flex-col justify-center p-6 z-50 text-center">
                                                             <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-2 font-mono">⚠️ SECURE LINE RECORDING DISCLAIMER</h4>
                                                             <p className="text-[11px] text-[#0F172A] max-w-md mx-auto leading-relaxed mb-5 font-mono">
                                                                 Under Sovereign Vault compliance security protocols, recording this conversation will log the speech transcript directly to the auditing compliance logs ledger. Consent from the verified customer is required before starting.
                                                             </p>
                                                             <div className="flex gap-3 justify-center max-w-xs mx-auto w-full">
                                                                 <button 
                                                                     onClick={() => setShowRecordDisclaimer(false)}
                                                                     className="flex-1 bg-slate-50 hover:bg-white text-[#0F172A] border border-slate-850 p-2.5 rounded-xl text-[10px] font-bold font-mono transition-colors dark:bg-slate-800"
                                                                 >
                                                                     DECLINE
                                                                 </button>
                                                                 <button 
                                                                     onClick={() => {
                                                                         setIsRecording(true);
                                                                         setShowRecordDisclaimer(false);
                                                                     }}
                                                                     className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 p-2.5 rounded-xl text-[10px] font-black font-mono transition-all shadow-lg shadow-amber-500/10"
                                                                 >
                                                                     CONSENT & RECORD
                                                                 </button>
                                                             </div>
                                                         </div>
                                                     )}

                                                     <div className="flex justify-between items-center">
                                                         <div className="flex items-center gap-3">
                                                             <div className="relative">
                                                                 <div className="absolute -inset-1 rounded-full bg-amber-500 animate-ping"></div>
                                                                 <div className="w-10 h-10 rounded-full bg-amber-500 border border-amber-500/30 flex items-center justify-center">
                                                                     <PhoneIcon className="w-5 h-5 text-amber-500 animate-pulse" />
                                                                 </div>
                                                             </div>
                                                             <div>
                                                                 <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                                                     Sovereign Voice Crypt Corridor (SSL)
                                                                     <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500 text-amber-400 font-mono">
                                                                         {callState === 'dialing' ? 'Dialing Satellite Node...' : 'E2E SECURED'}
                                                                     </span>
                                                                 </h4>
                                                                 <p className="text-[10px] text-[#0F172A] font-mono mt-0.5">Carrier Node: fp-tunnel-va.private.fpb</p>
                                                             </div>
                                                         </div>
                                                         
                                                         {/* In-Call Settings */}
                                                         <div className="flex items-center gap-2 pointer-events-auto">
                                                             {/* Connection Quality Stats */}
                                                             {callState === 'connected' && (
                                                                 <div className="flex items-center gap-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 px-3 py-1.5 rounded-xl font-mono text-[9px] mr-2">
                                                                     <div className="flex items-center gap-1.5">
                                                                         <span className="text-[#0F172A]">RTT:</span>
                                                                         <span className={`font-bold ${callStats.latency < 25 ? 'text-emerald-400' : 'text-amber-400'}`}>{callStats.latency}ms</span>
                                                                     </div>
                                                                     <div className="w-[1px] h-2.5 bg-white dark:bg-slate-800" />
                                                                     <div className="flex items-center gap-1.5">
                                                                         <span className="text-[#0F172A]">JIT:</span>
                                                                         <span className="font-bold text-cyan-400">{callStats.jitter}ms</span>
                                                                     </div>
                                                                     <div className="w-[1px] h-2.5 bg-white dark:bg-slate-800" />
                                                                     <div className="flex items-center gap-1.5">
                                                                         <span className="text-[#0F172A]">LOSS:</span>
                                                                         <span className={`font-bold ${callStats.packetLoss === 0 ? 'text-emerald-400' : 'text-red-400'}`}>{callStats.packetLoss}%</span>
                                                                     </div>
                                                                     {isRecording && (
                                                                         <>
                                                                             <div className="w-[1px] h-2.5 bg-white dark:bg-slate-800" />
                                                                             <div className="flex items-center gap-1">
                                                                                 <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                                                                                 <span className="text-red-400 font-bold uppercase tracking-wider text-[8px] font-mono leading-none">REC</span>
                                                                             </div>
                                                                         </>
                                                                     )}
                                                                 </div>
                                                             )}

                                                             {/* Duration Timer */}
                                                             {callState === 'connected' && (
                                                                 <div className="text-[11px] font-mono font-bold text-[#0F172A] bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 mr-1.5 dark:bg-slate-900">
                                                                     {Math.floor(callDuration / 60).toString().padStart(2, '0')}:{(callDuration % 60).toString().padStart(2, '0')}
                                                                 </div>
                                                             )}

                                                             {callState === 'connected' && (
                                                                 <>
                                                                     <button 
                                                                         onClick={() => {
                                                                             if (isRecording) {
                                                                                 setIsRecording(false);
                                                                             } else {
                                                                                 setShowRecordDisclaimer(true);
                                                                             }
                                                                         }}
                                                                         className={`p-2 px-3 text-[10px] font-mono font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
                                                                             isRecording 
                                                                                 ? 'bg-red-500 text-red-300 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse' 
                                                                                 : 'bg-slate-850 text-[#0F172A] border-slate-750 hover:text-white'
                                                                         }`}
                                                                         title="Initiate voice record sequence with compliance logger"
                                                                     >
                                                                         <CircleIcon className={`w-2 h-2 ${isRecording ? 'fill-red-500 text-red-500' : 'text-[#0F172A]'}`} />
                                                                         {isRecording ? "RECORD: ON" : "RECORD CALL"}
                                                                     </button>

                                                                     <button 
                                                                         onClick={() => {
                                                                             if (localStreamRef.current) {
                                                                                 const audTrack = localStreamRef.current.getAudioTracks()[0];
                                                                                 if (audTrack) audTrack.enabled = !audTrack.enabled;
                                                                             }
                                                                             setIsMuted(!isMuted);
                                                                         }}
                                                                         className={`p-2 rounded-xl text-xs font-bold transition-all ${isMuted ? 'bg-red-500 text-red-400 border border-red-500/30' : 'bg-white text-[#0F172A] hover:text-white hover:bg-slate-700'}`}
                                                                     >
                                                                         {isMuted ? <MicOffIcon className="w-4 h-4" /> : <MicIcon className="w-4 h-4" />}
                                                                     </button>

                                                                     <button 
                                                                         onClick={() => {
                                                                             setIsScramblerActive(!isScramblerActive);
                                                                             // Toggle high scrambling filter
                                                                             initilizeWebAudioStream(isVideoActive);
                                                                         }}
                                                                         className={`p-2 px-3 text-[10px] font-mono font-bold rounded-xl border transition-all ${isScramblerActive ? 'bg-amber-500 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'bg-white text-[#0F172A] border-slate-300 hover:text-white'}`}
                                                                         title="Encrypt with a lowpass/peaking filter at module level"
                                                                     >
                                                                         🛡️ Scrambler: {isScramblerActive ? "ON" : "OFF"}
                                                                     </button>

                                                                     <button 
                                                                         onClick={handleToggleVideo}
                                                                         className={`p-2 rounded-xl text-xs font-bold transition-all border ${isVideoActive ? 'bg-cyan-500 text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'bg-white text-[#0F172A] border-slate-300 hover:text-white hover:bg-slate-700'}`}
                                                                         title={isVideoActive ? "Turn Off Camera" : "Turn On Camera"}
                                                                     >
                                                                         {isVideoActive ? <VideoIcon className="w-4 h-4 animate-pulse" /> : <VideoOffIcon className="w-4 h-4" />}
                                                                     </button>
                                                                 </>
                                                             )}
                                                         </div>
                                                     </div>
                                                     
                                                     {/* Video Conferencing Modules */}
                                                     {isVideoActive && (
                                                         <div className="w-full grid grid-cols-2 gap-2 my-2 shrink-0">
                                                             {/* Local Video feed (Admin) */}
                                                             <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner flex items-center justify-center">
                                                                 {localVideoStream ? (
                                                                     <video 
                                                                         ref={localVideoRef} 
                                                                         autoPlay 
                                                                         playsInline 
                                                                         muted 
                                                                         className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" 
                                                                     />
                                                                 ) : (
                                                                     <div className="flex flex-col items-center gap-1 text-[9px] font-mono text-[#0F172A]">
                                                                         <LoaderIcon className="w-4 h-4 text-cyan-400 animate-spin" />
                                                                         <span>CONNECTING CAMERA...</span>
                                                                     </div>
                                                                 )}
                                                                 <div className="absolute top-1.5 left-1.5 bg-slate-100 p-1 px-2 rounded-lg text-[8px] font-mono font-bold uppercase text-emerald-400">
                                                                     Agent Feed
                                                                 </div>
                                                             </div>
                                                             
                                                             {/* Remote Video feed (Client) */}
                                                             <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-850 flex items-center justify-center">
                                                                 {remoteVideoStream ? (
                                                                     <video 
                                                                         ref={remoteVideoRef} 
                                                                         autoPlay 
                                                                         playsInline 
                                                                         className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" 
                                                                     />
                                                                 ) : (
                                                                     <div className="flex flex-col items-center gap-1 text-[9px] font-mono text-[#0F172A]">
                                                                         <LoaderIcon className="w-4 h-4 text-cyan-400 animate-spin" />
                                                                         <span>WAITING FOR CLIENT...</span>
                                                                     </div>
                                                                 )}
                                                                 <div className="absolute top-1.5 left-1.5 bg-slate-100 p-1 px-2 rounded-lg text-[8px] font-mono font-bold uppercase text-cyan-400">
                                                                     Client KYC
                                                                 </div>
                                                             </div>
                                                         </div>
                                                     )}

                                                     {/* Canvas Drawing Waveform Indicator */}
                                                     <div className="w-full h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl relative border border-slate-200/80 overflow-hidden flex items-center justify-center shrink-0">
                                                         <canvas ref={callCanvasRef} width={800} height={64} className="w-full h-full opacity-90" />
                                                         {callState === 'dialing' && (
                                                             <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800 [1px] flex items-center justify-center">
                                                                 <motion.div 
                                                                     initial={{ opacity: 0, scale: 0.9 }}
                                                                     animate={{ opacity: 1, scale: 1 }}
                                                                     className="flex flex-col items-center gap-1.5"
                                                                 >
                                                                     <motion.div 
                                                                         animate={{ rotate: 360 }}
                                                                         transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                                                         className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent"
                                                                     />
                                                                     <p className="text-[10px] uppercase tracking-widest font-mono text-amber-500 animate-pulse font-black">Connecting Secure Carrier Corridor Matrix...</p>
                                                                 </motion.div>
                                                             </div>
                                                         )}
                                                         {callState === 'incoming' && (
                                                             <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800  flex items-center justify-between px-6 z-50">
                                                                 <div className="flex items-center gap-3">
                                                                     <div className="relative">
                                                                         <div className="absolute -inset-1 rounded-full bg-emerald-500 animate-ping"></div>
                                                                         <div className="w-8 h-8 rounded-full bg-emerald-500 border border-emerald-500/30 flex items-center justify-center">
                                                                             <PhoneIcon className="w-4 h-4 text-emerald-400 animate-pulse" />
                                                                         </div>
                                                                     </div>
                                                                     <div className="text-left">
                                                                         <h5 className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest">Incoming Secured Sound Corridor Request</h5>
                                                                         <p className="text-[9px] text-[#0F172A] font-mono mt-0.5">Verified portfolio client is requesting a live audio interlock.</p>
                                                                     </div>
                                                                 </div>
                                                                 
                                                                 <div className="flex gap-2">
                                                                     <button 
                                                                         onClick={handleEndCall}
                                                                         className="bg-red-950 hover:bg-red-900 border border-red-500/30 text-red-400 font-mono text-[9px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg font-black transition-colors"
                                                                     >
                                                                         Decline
                                                                     </button>
                                                                     <button 
                                                                         onClick={handleAdminAcceptCall}
                                                                         className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[9px] uppercase tracking-wider px-4 py-1.5 rounded-lg font-black transition-all shadow-lg shadow-emerald-950/20"
                                                                     >
                                                                         Accept Secure Link
                                                                     </button>
                                                                 </div>
                                                             </div>
                                                         )}
                                                     </div>
                                                 </motion.div>
                                             )}
                                         </AnimatePresence>

                                        {/* Messages dialogue log */}
                                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-100">
                                            {activeMessages.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-[#0F172A] gap-3 opacity-30 mt-10">
                                                    <MessageSquareIcon className="w-16 h-16" />
                                                    <p className="font-mono text-center text-xs uppercase tracking-widest">Beginning Encrypted Ledger Intercept History</p>
                                                </div>
                                            ) : (
                                                activeMessages.map((msg, idx) => {
                                                    const isUser = msg.senderId === 'user';
                                                    const isAI = msg.senderId === 'ai_bot';
                                                    const isSupport = !isUser && !isAI;

                                                    // Determine real-time read receipt delivery status
                                                    const isReadByPeer = peerChatStatus[activeSessionId]?.status === 'read';

                                                    return (
                                                        <motion.div 
                                                            key={msg.id} 
                                                            initial={{ opacity: 0, y: 12 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ duration: 0.25 }}
                                                            className={`flex flex-col max-w-[85%] ${!isUser ? 'self-end items-end' : 'self-start items-start'}`}
                                                        >
                                                            {/* Sender Badge Label with elite spacious formatting */}
                                                            <div className="flex items-center gap-2 mb-1.5 px-1">
                                                                <span className={`text-[9px] uppercase tracking-[0.18em] font-black font-mono ${
                                                                    isUser 
                                                                        ? 'text-emerald-400' 
                                                                        : isAI 
                                                                            ? 'text-purple-400' 
                                                                            : 'text-[#0F172A]'
                                                                }`}>
                                                                    {isUser ? '👤 SOVEREIGN CLIENT' : isAI ? '🤖 CO-PILOT ASSIST' : '🏦 DESK OFFICER'}
                                                                </span>
                                                            </div>

                                                            {/* Themed and modernized high-contrast chat bubbles */}
                                                            <div className={`p-4 px-5 rounded-[22px] text-[13.5px] leading-relaxed tracking-[0.02em] border shadow-md transition-all ${
                                                                !isUser
                                                                    ? isAI 
                                                                        ? 'bg-purple-950 text-purple-100 rounded-tr-none border-purple-500/25 shadow-[0_4px_16px_rgba(147,51,234,0.08)]'
                                                                        : 'bg-slate-50 text-slate-100 rounded-tr-none border-slate-200 shadow-[0_6px_20px_rgba(0,0,0,0.18)] font-sans' 
                                                                    : 'bg-emerald-950 text-emerald-100 rounded-tl-none border-emerald-500/15 shadow-[0_4px_16px_rgba(16,185,129,0.04)] font-sans'
                                                            }`}>
                                                                <p className="whitespace-pre-wrap">{msg.content}</p>

                                                                {/* Dynamic Certified PDF Document Dispatch visual support */}
                                                                {msg.content.includes('.pdf') && (
                                                                    <div className="mt-3 p-3 bg-slate-100 border border-black/5 rounded-xl flex items-center justify-between gap-3 animate-fade-in text-xs font-mono">
                                                                        <div className="flex items-center gap-2 text-[#0F172A]">
                                                                            <div className="w-8 h-8 rounded bg-red-500 flex items-center justify-center text-red-400 font-bold text-[10px]">PDF</div>
                                                                            <div>
                                                                                <p className="text-white font-bold truncate max-w-[150px]">
                                                                                    {msg.content.split('\n')[0].replace(/\[ATTACHMENT:\s*|\]/g, '') || "clearance_order.pdf"}
                                                                                </p>
                                                                                <p className="text-[9px] text-[#0F172A]">First Pacific Certified (240 KB)</p>
                                                                            </div>
                                                                        </div>
                                                                        <span className="text-[10px] text-emerald-400 px-2 py-0.5 rounded bg-emerald-500 border border-emerald-500/20 uppercase font-black tracking-widest">Signed</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Read Ticks Status & Timestamp */}
                                                            <div className="flex items-center gap-2 mt-1.5 px-1">
                                                                <span className="text-[9.5px] font-mono text-[#0F172A] font-bold">
                                                                    {formatSafeTime(msg.timestamp)}
                                                                </span>
                                                                {!isUser && (
                                                                    <div className="flex items-center gap-1 font-mono text-[9px] font-black">
                                                                        {isReadByPeer ? (
                                                                            <span className="text-emerald-400 flex items-center gap-1 bg-emerald-500 px-2 py-0.5 rounded border border-emerald-500/15 animate-fade-in shadow-inner">
                                                                                <span className="text-[11px]">✓✓</span> Seen
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[#0F172A] flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-black/5 dark:bg-slate-800">
                                                                                <span className="text-[11px]">✓</span> Sent
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })
                                            )}
                                            <div ref={messagesEndRef} className="h-1 shrink-0" />
                                        </div>

                                        {/* Advanced Action Deck & Sophisticated Chat Composer */}
                                        <div className="bg-slate-50 border-t border-slate-200 shrink-0 p-4 space-y-3 dark:bg-slate-900">
                                            
                                            {/* Top toolbar for rapid templates/emojis and clearances */}
                                            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 max-w-full">
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {/* Quick presets trigger */}
                                                    <button 
                                                        onClick={() => setIsTemplatesOpen(!isTemplatesOpen)}
                                                        className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-bold transition-all ${
                                                            isTemplatesOpen 
                                                                ? 'bg-emerald-500 text-emerald-400 border-emerald-500/30' 
                                                                : 'bg-slate-100 text-[#0F172A] border-slate-200 hover:text-white hover:bg-slate-850'
                                                        }`}
                                                    >
                                                        <span>📋 Presets</span>
                                                    </button>

                                                    {/* Emoji Selector Trigger */}
                                                    <button 
                                                        onClick={() => setIsEmojiTrayOpen(!isEmojiTrayOpen)}
                                                        className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-bold transition-all ${
                                                            isEmojiTrayOpen 
                                                                ? 'bg-purple-500 text-purple-400 border-purple-500/30' 
                                                                : 'bg-slate-100 text-[#0F172A] border-slate-200 hover:text-white hover:bg-slate-850'
                                                        }`}
                                                    >
                                                        <span>😊 Emoji</span>
                                                    </button>

                                                    {/* Attaching VIP Certificate Clearance PDF Override tool */}
                                                    <button 
                                                        onClick={() => {
                                                            const signatureName = activeProfile?.name || "Holder";
                                                            setInputValue(prev => prev + `[ATTACHMENT: Digital_Clearance_Override_Order_${signatureName.replace(/\s+/g, '_')}.pdf]\n🔐 SECURITY OVERRIDE COMPLETED. Direct transactional clearance authorized.`);
                                                            showToast("Injected VIP Clearance Doc template.");
                                                        }}
                                                        className="text-xs px-3 py-1.5 rounded-lg border bg-slate-100 text-[#0F172A] border-slate-200 hover:text-white hover:bg-slate-850 font-bold flex items-center gap-1.5"
                                                    >
                                                        <span>📄 Attach PDF</span>
                                                    </button>
                                                </div>

                                                {/* Custom Markdown format injectors & Rich Composer Decks */}
                                                <div className="flex items-center gap-1 text-[11px] font-mono shrink-0 bg-slate-100 p-1 rounded-lg border border-slate-200">
                                                    <button 
                                                        onClick={() => insertFormat("**")}
                                                        className="px-2 py-1 bg-white hover:bg-white text-[#0F172A] rounded font-bold transition-colors dark:bg-slate-800"
                                                        title="Bold Text"
                                                    >
                                                        B
                                                    </button>
                                                    <button 
                                                        onClick={() => insertFormat("*")}
                                                        className="px-2 py-1 bg-white hover:bg-white text-[#0F172A] rounded italic transition-colors dark:bg-slate-800"
                                                        title="Italic Text"
                                                     >
                                                        I
                                                    </button>
                                                    <button 
                                                        onClick={() => insertFormat("`")}
                                                        className="px-2 py-1 bg-white hover:bg-white text-[#0F172A] rounded font-mono transition-colors dark:bg-slate-800"
                                                        title="Code block"
                                                    >
                                                        &lt;/&gt;
                                                    </button>
                                                    <div className="h-4 w-[1px] bg-slate-850 mx-1"></div>
                                                    <button 
                                                        onClick={handleUndo}
                                                        className="p-1 hover:bg-white text-[#0F172A] hover:text-white rounded transition-all cursor-pointer dark:bg-slate-800"
                                                        title="Undo (Ctrl+Z)"
                                                    >
                                                        <UndoIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button 
                                                        onClick={handleRedo}
                                                        className="p-1 hover:bg-white text-[#0F172A] hover:text-white rounded transition-all cursor-pointer dark:bg-slate-800"
                                                        title="Redo (Ctrl+Y)"
                                                    >
                                                        <RedoIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button 
                                                        onClick={handleCopy}
                                                        className="p-1 hover:bg-white text-[#0F172A] hover:text-white rounded transition-all cursor-pointer dark:bg-slate-800"
                                                        title="Copy Entire message"
                                                    >
                                                        <CopyIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button 
                                                        onClick={handleClear}
                                                        className="p-1 hover:bg-white text-[#0F172A] hover:text-rose-400 rounded transition-all cursor-pointer dark:bg-slate-800"
                                                        title="Clear all text"
                                                    >
                                                        <TrashIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Emoji list expander tray */}
                                            <AnimatePresence>
                                                {isEmojiTrayOpen && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="bg-slate-100 border border-slate-850 rounded-xl p-2 flex items-center gap-1.5 overflow-x-auto"
                                                    >
                                                        {["😊", "👍", "🔒", "✅", "⚠️", "🚀", "💳", "🏦", "📄", "💫", "🔑", "🤝"].map(emo => (
                                                            <button 
                                                                key={emo}
                                                                onClick={() => {
                                                                    setInputValue(prev => prev + emo);
                                                                    setIsEmojiTrayOpen(false);
                                                                }}
                                                                className="text-lg p-1.5 hover:bg-white rounded-lg transition-all transform active:scale-95 shrink-0 dark:bg-slate-800"
                                                            >
                                                                {emo}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Preset template tray */}
                                            <AnimatePresence>
                                                {isTemplatesOpen && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="bg-slate-100 border border-slate-850 rounded-xl p-3 space-y-2 max-h-[140px] overflow-y-auto"
                                                    >
                                                        <p className="text-[10px] text-[#0F172A] uppercase tracking-widest font-black font-mono">Premium Bureau Dispatch Templates</p>
                                                        <div className="grid grid-cols-1 gap-1.5">
                                                             {[
                                                                 { label: "✅ Security Clearance Complete", text: "🔐 SECURITY CLEARED: Sovereign compliance check completed successfully. Your high-value authorization ledger is cleared." },
                                                                 { label: "💼 Multi-Signature Authority", text: "ℹ️ LAW HALT ACTION: Please complete verification. Provide security signature coordinates or contact real-time support." },
                                                                 { label: "💳 Wire Settlement Batching", text: "🏦 DESK SETTLEMENT: Global coordinates authenticated. Transfer scheduled for processing." },
                                                                 { label: "🛡️ Sovereign KYC Override", text: "🛡️ COMPLIANCE OVERRIDE: Outgoing credentials bypassed following elite advisor validation rules." }
                                                             ].map(tpl => (
                                                                 <button 
                                                                     key={tpl.label}
                                                                     onClick={() => {
                                                                         setInputValue(tpl.text);
                                                                         setIsTemplatesOpen(false);
                                                                     }}
                                                                     className="text-left text-xs text-[#0F172A] hover:text-white p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all font-mono dark:bg-slate-800"
                                                                 >
                                                                     {tpl.label}
                                                                 </button>
                                                             ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Textarea Composer with character counter and send action */}
                                            <div className="flex items-end gap-3 bg-slate-100 border border-slate-855 rounded-xl p-2.5 focus-within:border-emerald-500/40 focus-within:ring-1 focus-within:ring-emerald-500/40 transition-all">
                                                <textarea 
                                                    ref={textareaRef}
                                                    placeholder="Type secure response to customer (Markdown supported)..."
                                                    value={inputValue}
                                                    onChange={e => updateTextWithHistory(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleSend();
                                                        } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                                                            e.preventDefault();
                                                            handleUndo();
                                                        } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                                                            e.preventDefault();
                                                            handleRedo();
                                                        }
                                                    }}
                                                    className="flex-1 bg-transparent border-0 text-[#1E293B] text-sm focus:outline-none focus:ring-0 font-sans resize-none py-1.5 max-h-[100px] min-h-[44px] leading-relaxed custom-scrollbar"
                                                />
                                                
                                                <div className="flex flex-col items-center justify-end shrink-0 gap-1.5 font-mono">
                                                    <span className="text-[9px] font-mono font-bold text-[#0F172A] px-1">{inputValue.length}</span>
                                                    <button 
                                                        onClick={handleSend}
                                                        disabled={!inputValue.trim()}
                                                        className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 px-3.5 rounded-lg transition-all disabled:opacity-35 flex items-center justify-center cursor-pointer transform active:scale-95"
                                                    >
                                                        <SendIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-[#0F172A] gap-4 opacity-40">
                                        <ShieldIcon className="w-16 h-16 text-slate-550" />
                                        <p className="font-mono text-xs tracking-[0.2em] uppercase">Select active communication stream to intercept</p>
                                    </div>
                                )}
                            </div>

                            {/* Companion Copilot sidebar panel */}
                            {isCopilotOpen && (
                                <div className="w-[400px] bg-slate-955 border-l border-slate-200 flex flex-col h-full shrink-0 animate-fade-in relative font-sans" onClick={e => e.stopPropagation()}>
                                    {/* Sidebar header */}
                                    <div onMouseDown={handleMouseDown} className="p-4 border-b border-slate-200 bg-slate-50 dark:bg-slate-900 flex justify-between items-center cursor-grab active:cursor-grabbing select-none shrink-0">
                                        <div className="flex items-center gap-2">
                                            <SparklesIcon className="w-4 h-4 text-amber-400 animate-pulse" />
                                            <span className="text-xs font-black uppercase text-amber-400 tracking-wider font-mono">SUPPORT COPILOT</span>
                                        </div>
                                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                            <button 
                                                onClick={() => setIsCopilotFullscreen(true)}
                                                className="p-1.5 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-500 text-amber-400 text-[9px] font-extrabold font-mono tracking-widest transition-all"
                                                title="Expand to Fullscreen Command Center"
                                            >
                                                WAR-ROOM
                                            </button>
                                            <button onClick={() => setIsCopilotOpen(false)} className="p-1 px-1.5 rounded-lg hover:bg-white text-[#0F172A] transition-colors dark:bg-slate-800">
                                                <XIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Scrollable Intelligence Feed & Dossier */}
                                    <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-slate-50 dark:bg-slate-800">
                                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                            {/* Client Dossier Badge */}
                                            {activeProfile ? (
                                                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-805">
                                                        <div className="w-8 h-8 rounded-lg bg-amber-500 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold font-mono text-sm">
                                                            {activeProfile.name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-bold text-[#1E293B] truncate">{activeProfile.name}</p>
                                                            <p className="text-[10px] font-mono text-[#0F172A] truncate">{activeProfile.email}</p>
                                                        </div>
                                                        <span className="text-[8px] font-mono bg-amber-500 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded font-black">VIP V</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                                                        <div className="bg-slate-100 px-2 py-1.5 rounded border border-slate-900 text-[#0F172A] font-mono">
                                                            <span className="text-[#0F172A] block text-[8px] uppercase">Balance</span>
                                                            <span className="text-amber-400 font-bold font-mono text-xs">${(activeProfile.balance || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="bg-slate-100 px-2 py-1.5 rounded border border-slate-900 text-[#0F172A] font-mono">
                                                            <span className="text-[#0F172A] block text-[8px] uppercase">Clearance</span>
                                                            <span className="text-[#0F172A] font-bold text-[9.5px]">SCC Approved</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl">
                                                    <p className="text-[10px] font-mono text-slate-550 uppercase tracking-widest">Select target customer session</p>
                                                </div>
                                            )}

                                            {/* Copilot Dialogue Feeds */}
                                            <div className="space-y-4 pt-2">
                                                <span className="text-[9px] font-mono font-black uppercase text-amber-400/80 tracking-widest block border-b border-slate-900 pb-1">CO-PILOT DIALOGUE</span>
                                                {copilotMessages.map((m, idx) => {
                                                    const isCopilot = m.sender === 'copilot';
                                                    return (
                                                        <div key={idx} className={`flex flex-col max-w-[90%] ${isCopilot ? 'self-start' : 'self-end'}`}>
                                                            <span className="text-[8px] font-mono font-bold text-slate-555 mb-1">
                                                                {isCopilot ? "CO-PILOT INTEL" : "YOU"}
                                                            </span>
                                                            <div className={`p-3.5 rounded-2xl text-xs leading-relaxed relative ${
                                                                isCopilot 
                                                                    ? 'bg-amber-500/[0.03] text-[#0F172A] border border-amber-500/20 shadow-[0_4px_12px_rgba(245,158,11,0.03)]' 
                                                                    : 'bg-slate-50 text-slate-100 border border-slate-200'
                                                            }`}>
                                                                <p className="whitespace-pre-wrap">{m.content}</p>

                                                                {isCopilot && m.suggestedTab && (
                                                                    <div className="mt-2.5 p-2 bg-amber-500 border border-amber-500/30 rounded-lg flex flex-col gap-1.5">
                                                                        <span className="text-[9px] font-mono text-amber-500 font-bold uppercase">PROPOSED ROUTE:</span>
                                                                        <button 
                                                                            onClick={() => {
                                                                                window.dispatchEvent(new CustomEvent('admin:navigate', { detail: { tab: m.suggestedTab } }));
                                                                                showToast(`Navigation dispatched to ${m.suggestedTab}`);
                                                                            }}
                                                                            className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold uppercase text-[9px] tracking-wider py-1.5 rounded transition-all font-mono"
                                                                        >
                                                                            NAVIGATE TO {m.suggestedTab.toUpperCase()}
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                {isCopilot && idx > 0 && !m.content.includes("decrypt") && (
                                                                    <button 
                                                                        onClick={() => {
                                                                            setInputValue(m.content);
                                                                            showToast("Draft cloned to Customer Send Box.");
                                                                        }}
                                                                        className="w-full mt-2.5 bg-amber-500 hover:bg-amber-500 text-amber-400 border border-amber-500/25 font-bold uppercase tracking-wider text-[8.5px] font-mono py-1.5 rounded transition-colors text-center"
                                                                    >
                                                                        📥 Draft to Dialogue Send Box
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {isCopilotTyping && (
                                                    <div className="flex flex-col max-w-[80%] self-start animate-pulse">
                                                        <span className="text-[8px] font-mono font-bold text-slate-555 mb-1">CO-PILOT ANALYZING</span>
                                                        <div className="bg-amber-500/[0.02] border border-amber-500/10 p-3 rounded-xl">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="h-1.5 w-1.5 bg-amber-400 rounded-full animate-bounce"></span>
                                                                <span className="h-1.5 w-1.5 bg-amber-400 rounded-full animate-bounce delay-100"></span>
                                                                <span className="h-1.5 w-1.5 bg-amber-405 rounded-full animate-bounce delay-200"></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Suggestions chip presets */}
                                        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-900 shrink-0 flex flex-wrap gap-1.5">
                                            <button 
                                                onClick={() => setCopilotInput("Audit recent transaction ledger indexes and clearance anomalies.")}
                                                className="bg-slate-100 hover:bg-slate-850 hover:text-white border border-slate-850 text-[#0F172A] rounded-lg p-1.5 px-2 text-[9px] font-mono transition-all"
                                            >
                                                🔍 Risk Audit
                                            </button>
                                            <button 
                                                onClick={() => setCopilotInput("Explain requirements to bypass regional limits on high yield private gold accounts.")}
                                                className="bg-slate-955 hover:bg-slate-850 hover:text-white border border-slate-855 text-[#0F172A] rounded-lg p-1.5 px-2 text-[9px] font-mono transition-all"
                                            >
                                                🔑 Limit Bypass
                                            </button>
                                            <button 
                                                onClick={() => setCopilotInput("Sovereign Clearance Corridor (SCC) guarantee request protocols.")}
                                                className="bg-slate-955 hover:bg-slate-850 hover:text-white border border-slate-855 text-[#0F172A] rounded-lg p-1.5 px-2 text-[9px] font-mono transition-all"
                                            >
                                                📝 SCC Protocol
                                            </button>
                                        </div>

                                        {/* Input Box */}
                                        <div className="p-3 bg-slate-50 border-t border-slate-850 shrink-0 flex items-center gap-2 dark:bg-slate-900">
                                            <input 
                                                type="text" 
                                                placeholder="Prompt Senior AI ..."
                                                value={copilotInput}
                                                onChange={e => setCopilotInput(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleSendCopilotMessage()}
                                                className="flex-1 bg-slate-100 border border-slate-200 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                                            />
                                            <button 
                                                onClick={() => handleSendCopilotMessage()}
                                                disabled={!copilotInput.trim()}
                                                className="bg-amber-600 hover:bg-amber-500 text-white p-2 rounded-lg border border-amber-500/25 transition-all disabled:opacity-40"
                                            >
                                                <SendIcon className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Redesigned AI Executive Smart Copilot Core Pane - Ultra Premium Design */}
                            {isCopilotFullscreen ? (
                                <div className="fixed inset-0 z-[10000] bg-slate-50 dark:bg-slate-800  flex flex-col h-screen w-screen p-6 overflow-hidden pointer-events-auto animate-fade-in font-sans">
                                    {/* Glassmorphism Header */}
                                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 shrink-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-amber-500 border border-amber-500/20 flex items-center justify-center animate-pulse">
                                                <SparklesIcon className="w-5 h-5 text-amber-400" />
                                            </div>
                                            <div>
                                                <h2 className="text-sm font-black font-sans uppercase tracking-[0.25em] text-amber-400">AI Executive Smart Copilot Center</h2>
                                                <span className="text-[10px] font-mono text-[#0F172A] block mt-0.5">Sovereign Decision Node: Active • Private Wealth Division</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {/* Node status indicators */}
                                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl text-[10px] font-mono text-[#0F172A] dark:bg-slate-900">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                                <span>GENEVA CENTRAL CORE: ONLINE</span>
                                            </div>
                                            <button 
                                                onClick={() => setIsCopilotOpen(false)} 
                                                className="p-3 px-5 rounded-xl hover:bg-white text-[#0F172A] transition-colors text-xs font-bold uppercase tracking-wider font-mono border border-slate-200 bg-slate-50 dark:bg-slate-900 animate-fade-in"
                                            >
                                                Exit Pilot Console
                                            </button>
                                        </div>
                                    </div>

                                    {/* Main Three-Column Dashboard Grid */}
                                    <div className="flex-1 grid grid-cols-12 gap-6 mt-6 overflow-hidden min-h-0">
                                        
                                        {/* Column 1: Client Portfolio dossier [col-span-3] */}
                                        <div className="col-span-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 rounded-2xl p-5 flex flex-col h-full overflow-y-auto custom-scrollbar">
                                            <span className="text-[9px] font-mono font-black uppercase text-amber-400 tracking-widest block mb-4 border-b border-slate-200/80 pb-2">Client Passport Matrix</span>
                                            
                                            {activeProfile ? (
                                                <div className="space-y-5">
                                                    {/* Avatar & Main identities */}
                                                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-855 rounded-2xl p-4">
                                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500/10 via-amber-400/20 to-amber-600/5 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-lg font-mono">
                                                            {activeProfile.name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-bold text-slate-100 truncate">{activeProfile.name}</p>
                                                            <p className="text-[10px] font-mono text-[#0F172A] truncate mt-0.5">{activeProfile.email}</p>
                                                            <p className="text-[9px] font-mono bg-amber-500 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded-md inline-block mt-1 font-bold">VIP CLASS-V</p>
                                                        </div>
                                                    </div>

                                                    {/* Balance HUD Metric */}
                                                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-855 rounded-2xl p-5 text-center relative overflow-hidden group">
                                                        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/[0.02] to-transparent pointer-events-none"></div>
                                                        <span className="text-[8px] font-mono font-bold text-[#0F172A] tracking-wider block uppercase mb-1">AGGREGATE VAULT CAPITAL</span>
                                                        <span className="text-2xl font-black font-mono text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                                            ${(activeProfile.balance || 0).toLocaleString()}
                                                        </span>
                                                        <span className="text-[9px] font-mono text-emerald-400 block mt-2 font-bold">↑ ACCRUING HIGH YIELD PRIVILEGE</span>
                                                    </div>

                                                    {/* Details table */}
                                                    <div className="space-y-2.5">
                                                        <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/40 rounded-xl flex justify-between items-center text-[11px]">
                                                            <span className="text-[#0F172A] font-mono">KYC Level</span>
                                                            <span className="font-bold text-[#0F172A]">Level {activeProfile.kycLevel || 3} Verified</span>
                                                        </div>
                                                        <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/40 rounded-xl flex justify-between items-center text-[11px]">
                                                            <span className="text-[#0F172A] font-mono">Clearance Limit</span>
                                                            <span className="font-bold text-[#0F172A]">Unlimited (SCC override)</span>
                                                        </div>
                                                        <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/40 rounded-xl flex justify-between items-center text-[11px]">
                                                            <span className="text-[#0F172A] font-mono">Region Cluster</span>
                                                            <span className="font-bold text-[#0F172A]">Offshore Desk Zurich</span>
                                                        </div>
                                                    </div>

                                                    {/* Interaction History Ledger Section */}
                                                    <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-2xl flex flex-col gap-2">
                                                        <span className="text-[8px] font-mono font-bold text-[#0F172A] uppercase tracking-widest block">Interaction History Ledger</span>
                                                        {(!activeProfile.interactions || activeProfile.interactions.length === 0) ? (
                                                            <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-900 rounded-xl text-center">
                                                                <p className="text-[10px] text-[#0F172A] font-mono italic">NO AUDIT LOG ENTRIES REGISTERED</p>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-0.5">
                                                                {(activeProfile.interactions || []).map((inter: any) => (
                                                                    <div key={inter.id} className="p-2.5 bg-slate-955 border border-slate-855 rounded-xl text-[10px] space-y-1">
                                                                        <div className="flex justify-between items-center text-[8px] font-mono text-amber-500/90 font-bold">
                                                                            <span>📞 SECURE AUDIO LINK</span>
                                                                            <span>{Math.floor(inter.duration / 60)}m {inter.duration % 60}s</span>
                                                                        </div>
                                                                        <p className="text-[#0F172A] leading-normal font-sans text-xs break-words">{inter.notes}</p>
                                                                        <div className="flex justify-between text-[8px] font-mono text-slate-550 pt-0.5 border-t border-slate-900">
                                                                            <span>Rep: {inter.agentEmail?.split('@')[0]}</span>
                                                                            <span>{formatSafeDate(inter.timestamp)}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Action center center */}
                                                    <div className="pt-2 space-y-2">
                                                        <span className="text-[8px] font-mono font-bold text-[#0F172A] uppercase tracking-widest block">Core Intercept Triggers</span>
                                                        <button 
                                                            onClick={() => handleSendCopilotMessage("Explain Sovereign Clearance Corridor Policies and how we bypass limits.")}
                                                            className="w-full bg-slate-100 hover:bg-slate-850 text-[#0F172A] font-semibold hover:text-white border border-slate-200 hover:border-slate-300 text-[10px] font-mono p-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                                        >
                                                            📜 Corridor Bylaws Check
                                                        </button>
                                                        <button 
                                                            onClick={() => handleSendCopilotMessage("Draft detailed risk evaluation for balance levels based on account logs.")}
                                                            className="w-full bg-slate-100 hover:bg-slate-850 text-[#0F172A] font-semibold hover:text-white border border-slate-200 hover:border-slate-300 text-[10px] font-mono p-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                                        >
                                                            🛡️ Ledger Risk Audit
                                                        </button>
                                                    </div>

                                                </div>
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center text-slate-650 gap-2 opacity-70 py-20">
                                                    <UserIcon className="w-10 h-10" />
                                                    <p className="font-mono text-[10px] text-center">NO ACTIVE DOSSIER SELECT</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Column 2: Prompt Console / Copilot Intelligence [col-span-6] */}
                                        <div className="col-span-6 bg-slate-50 dark:bg-slate-900 border border-slate-200/40 rounded-2xl p-5 flex flex-col h-full overflow-hidden">
                                            <span className="text-[9px] font-mono font-black uppercase text-amber-400 tracking-widest block mb-4 border-b border-slate-200/80 pb-2 shrink-0">Intelligence Command Center</span>
                                            
                                            {/* Chat Feed */}
                                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-800 border border-slate-905 rounded-2xl mb-4 custom-scrollbar">
                                                {copilotMessages.map((m, idx) => {
                                                    const isCopilot = m.sender === 'copilot';
                                                    return (
                                                        <div 
                                                            key={idx} 
                                                            className={`flex flex-col max-w-[85%] ${isCopilot ? 'self-start' : 'self-end'}`}
                                                        >
                                                            <span className="text-[8px] font-mono font-bold text-[#0F172A] mb-0.5">
                                                                {isCopilot ? "CO-PILOT INTEL" : "YOU"}
                                                            </span>
                                                            <div className={`p-4 rounded-2xl text-xs leading-relaxed relative ${
                                                                isCopilot 
                                                                    ? 'bg-amber-500/[0.03] text-[#0F172A] border border-amber-500/20 shadow-[0_4px_12px_rgba(245,158,11,0.03)]' 
                                                                    : 'bg-slate-50 text-slate-100 border border-slate-200'
                                                            }`}>
                                                                <p className="whitespace-pre-wrap">{m.content}</p>

                                                                {/* Display suggested tab force navigator right in the chat message log if proposed! */}
                                                                {isCopilot && m.suggestedTab && (
                                                                    <div className="mt-3 p-3 bg-amber-500 border border-amber-500/30 rounded-xl flex flex-col gap-2">
                                                                        <div className="flex justify-between items-center text-[10px] font-mono text-amber-500 font-bold">
                                                                            <span>PROPOSED ESCALATION PATH:</span>
                                                                            <span>CONFIDENCE: 98%</span>
                                                                        </div>
                                                                        <button 
                                                                            onClick={() => {
                                                                                console.log(`[Copilot Realtime Dispatch] Navigating to ${m.suggestedTab}`);
                                                                                window.dispatchEvent(new CustomEvent('admin:navigate', { detail: { tab: m.suggestedTab } }));
                                                                                setIsCopilotOpen(false); // Close Copilot so they view target tab instantly
                                                                            }}
                                                                            className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold uppercase text-[10px] tracking-wider py-2 rounded-lg transition-all animate-pulse shadow-md font-mono flex items-center justify-center gap-1.5"
                                                                        >
                                                                            <span>⚡ DISPATCH OVERDESK ROUTE TO:</span>
                                                                            <span className="bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded text-[9.5px] border border-slate-200 dark:border-black/10 select-none">
                                                                                {m.suggestedTab.toUpperCase()}
                                                                            </span>
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                {/* If Copilot draft message, allow human to paste directly as user reply or load directly into client input */}
                                                                {isCopilot && idx > 0 && !m.content.includes("decrypt") && (
                                                                    <div className="flex gap-2 mt-3.5 border-t border-slate-200/50 pt-3">
                                                                        <button 
                                                                            onClick={() => {
                                                                                setInputValue(m.content);
                                                                                // Provide short success toast/signal
                                                                                alert("Draft response cloned to Customer Send Box in active communication stream.");
                                                                            }}
                                                                            className="flex-1 bg-amber-500 hover:bg-amber-500 text-amber-400 border border-amber-500/20 font-bold uppercase tracking-wider text-[9px] font-mono px-2 py-2 rounded-lg transition-colors text-center"
                                                                        >
                                                                            📥 Draft Output to Client Chat
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {isCopilotTyping && (
                                                    <div className="flex flex-col max-w-[80%] self-start animate-pulse">
                                                        <span className="text-[8px] font-mono font-bold text-[#0F172A] mb-0.5">CO-PILOT THINKING</span>
                                                        <div className="bg-amber-500/[0.02] border border-amber-500/10 p-3 rounded-xl">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="h-1.5 w-1.5 bg-amber-400 rounded-full animate-bounce"></span>
                                                                <span className="h-1.5 w-1.5 bg-amber-400 rounded-full animate-bounce delay-100"></span>
                                                                <span className="h-1.5 w-1.5 bg-amber-400 rounded-full animate-bounce delay-200"></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Pre-baked Suggestion chips triggers */}
                                            <div className="shrink-0 mb-3 flex flex-wrap gap-2">
                                                <button 
                                                    onClick={() => handleSendCopilotMessage("Audit recent transaction ledger indexes and clearance anomalies.")}
                                                    className="bg-slate-50 hover:bg-slate-850 hover:text-white border border-slate-805 text-slate-405 rounded-xl p-2 px-3 text-[10px] font-mono transition-all dark:bg-slate-900"
                                                >
                                                    🔍 Audit Transaction Anomalies
                                                </button>
                                                <button 
                                                    onClick={() => handleSendCopilotMessage("Explain requirements to bypass regional limits on high yield private gold accounts.")}
                                                    className="bg-slate-50 hover:bg-slate-850 hover:text-white border border-slate-850 text-slate-405 rounded-xl p-2 px-3 text-[10px] font-mono transition-all dark:bg-slate-900"
                                                >
                                                    🔑 Regional Limit Bypass
                                                </button>
                                                <button 
                                                    onClick={() => handleSendCopilotMessage("Sovereign Clearance Corridor (SCC) guarantee request protocols.")}
                                                    className="bg-slate-50 hover:bg-slate-850 hover:text-white border border-slate-850 text-slate-405 rounded-xl p-2 px-3 text-[10px] font-mono transition-all dark:bg-slate-900"
                                                >
                                                    📝 SCC Wire Protocols
                                                </button>
                                            </div>

                                            {/* Input form */}
                                            <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl shrink-0 flex items-center gap-3">
                                                <input 
                                                    type="text" 
                                                    placeholder="Ask Senior AI Executive Smart Copilot (e.g. Audit ledger risk indicators for wire bypass)..."
                                                    value={copilotInput}
                                                    onChange={e => setCopilotInput(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleSendCopilotMessage()}
                                                    className="flex-1 bg-transparent text-xs text-white focus:outline-none font-sans"
                                                />
                                                <button 
                                                    onClick={() => handleSendCopilotMessage()}
                                                    disabled={!copilotInput.trim()}
                                                    className="bg-amber-600 hover:bg-amber-500 text-white p-2.5 px-4 rounded-xl border border-amber-500/25 transition-all disabled:opacity-40 shrink-0"
                                                >
                                                    <SendIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                        </div>

                                        {/* Column 3: Secure Live Intercept Wiretap Feed [col-span-3] */}
                                        <div className="col-span-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 rounded-2xl p-5 flex flex-col h-full overflow-hidden">
                                            <span className="text-[9px] font-mono font-black uppercase text-amber-400 tracking-widest block mb-4 border-b border-slate-200/80 pb-2 shrink-0">Workspace Intercept Feed</span>
                                            
                                            {/* Customer status header */}
                                            {activeProfile ? (
                                                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-850 p-3 rounded-xl mb-3 flex items-center justify-between shrink-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <WifiIcon className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                                                        <span className="text-[10px] font-mono font-bold text-[#0F172A]">CLIENT DIRECT PIPELINE</span>
                                                    </div>
                                                    <span className={`text-[9.5px] font-mono font-black px-2 py-0.5 rounded border ${
                                                        getPresenceState(activeProfile.email).label.includes('OFFLINE')
                                                            ? 'border-slate-200/80 text-[#0F172A] bg-slate-50 dark:bg-slate-900'
                                                            : 'border-emerald-500/20 text-emerald-400 bg-emerald-500 animate-pulse'
                                                    }`}>
                                                        {getPresenceState(activeProfile.email).label}
                                                    </span>
                                                </div>
                                            ) : null}

                                            {/* Customer Chat Session Log */}
                                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-800 border border-slate-855 rounded-2xl custom-scrollbar min-h-0">
                                                <span className="text-[8px] font-mono text-slate-550 uppercase tracking-widest block text-center border-b border-slate-900 pb-1.5 mb-2">Live Intercept Logs</span>
                                                
                                                {activeMessages.length === 0 ? (
                                                    <div className="h-full flex flex-col items-center justify-center text-slate-650 opacity-40 text-center py-20">
                                                        <MessageSquareIcon className="w-8 h-8 opacity-40 mb-2" />
                                                        <p className="text-[10px] font-mono uppercase tracking-widest">No Direct Intercept Streams Active</p>
                                                    </div>
                                                ) : (
                                                    activeMessages.map((msg, index) => {
                                                        const isUser = msg.senderId === 'user';
                                                        return (
                                                            <div key={index} className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}>
                                                                <span className="text-[8px] font-mono text-[#0F172A] mb-0.5">
                                                                    {isUser ? 'CLIENT' : 'YOU / ADMIN'}
                                                                </span>
                                                                <div className={`p-2.5 rounded-xl text-[10.5px] leading-relaxed max-w-[90%] border ${
                                                                    isUser 
                                                                        ? 'bg-slate-50 dark:bg-slate-900 text-[#0F172A] border-slate-200/80' 
                                                                        : 'bg-emerald-500/[0.03] text-emerald-200 border-emerald-500/10'
                                                                }`}>
                                                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>

                                            {/* Context metadata block in columns */}
                                            <div className="bg-slate-50 dark:bg-slate-800 p-3.5 border border-slate-850 rounded-2xl mt-4 space-y-2 shrink-0">
                                                <div className="flex justify-between items-center text-[10px] font-mono">
                                                    <span className="text-[#0F172A]">Live Heartbeat</span>
                                                    <span className="text-emerald-400 font-bold">Enabled (10s interval)</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] font-mono">
                                                    <span className="text-[#0F172A]">Sovereign Encryption</span>
                                                    <span className="text-cyan-400 font-bold">SHA-512 ACTIVE</span>
                                                </div>
                                            </div>

                                        </div>

                                    </div>
                                </div>
                            ) : null}
                        </>
                    )}
                </div>
            )}

            {/* Post-Call Summary Modal Overlay */}
            <AnimatePresence>
                {showSummaryModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-50 dark:bg-slate-800  z-50 flex items-center justify-center p-4 pointer-events-auto"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 15 }}
                            className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-2xl relative dark:bg-slate-900"
                        >
                            <div className="p-5 border-b border-slate-200 bg-slate-50 dark:bg-slate-800">
                                <h3 className="text-sm font-black text-amber-400 uppercase tracking-widest font-mono">📞 SESSION DISCONNECT LEDGER</h3>
                                <p className="text-[10px] text-[#0F172A] font-mono mt-0.5">Secure line transmission summary audit report</p>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-850 rounded-xl">
                                        <span className="text-[8px] font-mono text-[#0F172A] block uppercase">CLIENT ID</span>
                                        <span className="text-xs font-bold font-mono text-[#1E293B] mt-1 block truncate">{activeProfile?.email}</span>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-855 rounded-xl">
                                        <span className="text-[8px] font-mono text-[#0F172A] block uppercase">TOTAL DURATION</span>
                                        <span className="text-xs font-bold font-mono text-amber-400 mt-1 block">
                                            {Math.floor(finalCallDuration / 60)}m {finalCallDuration % 60}s
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-mono font-bold text-[#0F172A] uppercase tracking-wider block">Advisor Interaction Notes</label>
                                    <textarea
                                        value={summaryNotes}
                                        onChange={(e) => setSummaryNotes(e.target.value)}
                                        placeholder="Describe meeting outcomes, instructions, portfolio adjustments, or requests logged..."
                                        className="w-full h-32 bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-700 focus:outline-none focus:border-amber-500/40 transition-colors custom-scrollbar resize-none font-sans"
                                    />
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 flex gap-3 justify-end">
                                <button 
                                    onClick={() => {
                                        setShowSummaryModal(false);
                                        setSummaryNotes('');
                                    }}
                                    className="p-2.5 px-4 bg-slate-50 border border-slate-200 hover:bg-slate-850 text-[#0F172A] hover:text-white rounded-xl text-[10px] font-bold font-mono transition-colors dark:bg-slate-900"
                                >
                                    DISCARD & EXIT
                                </button>
                                <button 
                                    onClick={handleSaveSummaryNotes}
                                    className="p-2.5 px-5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl text-[10px] font-black font-mono transition-all uppercase tracking-wider shadow-md shadow-emerald-900/10"
                                >
                                    COMMIT DISPATCH NOTE
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
