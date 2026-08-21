import React, { useState, useEffect, useRef } from 'react';
import { 
    MessageSquareIcon, 
    XIcon, 
    SendIcon, 
    UserIcon, 
    ShieldIcon, 
    HelpCircleIcon,
    PhoneIcon,
    PhoneOffIcon,
    MicIcon,
    MicOffIcon,
    Volume2Icon,
    VolumeXIcon,
    SparklesIcon,
    Maximize2Icon,
    Minimize2Icon,
    Paperclip as PaperclipIcon,
    File as FileIcon,
    Image as ImageIcon,
    Camera as CameraIcon,
    Loader2 as LoaderIcon,
    Check as CheckIcon,
    CheckCheck as CheckCheckIcon,
    Globe as GlobeIcon,
    ShieldCheck as ShieldCheckIcon,
    Cpu as CpuIcon,
    Activity as ActivityIcon,
    Fingerprint as FingerprintIcon,
    RefreshCw as RefreshCwIcon,
    Video as VideoIcon,
    VideoOff as VideoOffIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../services/database';
import { ChatMessage, ChatSession } from '../types';
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

export const LiveChatFloating: React.FC<{ user: any }> = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [recentAlert, setRecentAlert] = useState<ChatMessage | null>(null);

    // Support Session & Rating States
    const [sessionStatus, setSessionStatus] = useState<'active' | 'closed' | 'resolved'>('active');
    const [sessionRating, setSessionRating] = useState<number | undefined>(undefined);
    const [selectedStars, setSelectedStars] = useState<number>(0);
    const [feedbackComment, setFeedbackComment] = useState<string>('');
    const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);

    // Attachment and Upload states
    const [attachment, setAttachment] = useState<{ url: string; name: string; type: string } | null>(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation: max 5MB
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
                    // Upload file to Firebase Storage/database helper
                    const url = await db.uploadFile(base64, 'support_attachments', 'chats');
                    setAttachment({
                        url: url,
                        name: file.name,
                        type: file.type
                    });
                } catch (uploadErr) {
                    console.error("File upload failed:", uploadErr);
                    setFileError("Upload failed. Please try again.");
                } finally {
                    setUploadingFile(false);
                }
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error("Error reading file:", err);
            setFileError("Failed to read file.");
            setUploadingFile(false);
        }
    };

    // Beautiful native HTML5 push notifications dispatcher
    const triggerSystemNotification = (msg: ChatMessage) => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(`Sovereign Intercept: ${msg.senderName || 'Desk Executive'}`, {
                    body: msg.content,
                    tag: 'sovereign_chat',
                    icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification(`Sovereign Intercept: ${msg.senderName || 'Desk Executive'}`, {
                            body: msg.content
                        });
                    }
                });
            }
        }
    };

    // Synthesize premium chat message incoming ringtone chime with pure Web Audio API
    const playChatRingtone = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const now = ctx.currentTime;
            
            const triggerTone = (freq: number, time: number, dur: number, vol: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.frequency.setValueAtTime(freq, time);
                osc.type = 'sine';
                
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(vol, time + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
                
                osc.start(time);
                osc.stop(time + dur);
            };

            // Classic sweet digital ringtone sequence: High-frequency chime cascade
            triggerTone(587.33, now, 0.25, 0.25);        // D5
            triggerTone(659.25, now + 0.1, 0.25, 0.25);    // E5
            triggerTone(783.99, now + 0.2, 0.25, 0.25);    // G5
            triggerTone(1174.66, now + 0.3, 0.6, 0.3);     // D6 (high tone resonance)
        } catch (e) {
            console.warn("AudioContext failed: ", e);
        }
    };

    // Proactively request browser notification permission on mount for sovereign alert integration
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }
    }, []);

    const sessionId = user.email; // Use user email as the chat session unique ID

    // Voice Calling States on Customer Side
    const [callState, setCallState] = useState<'idle' | 'incoming' | 'dialing' | 'connected'>('idle');
    const [isMuted, setIsMuted] = useState(false);
    const [isScramblerActive, setIsScramblerActive] = useState(false);
    const [scramblerType, setScramblerType] = useState<'AES-256-GCM' | 'CHACHA20-POLY' | 'QUANTUM-STATIC' | 'ANALOG-FUZZ'>('AES-256-GCM');
    const [selectedSatellite, setSelectedSatellite] = useState('Atlantic-IV Starlink Relay');
    const [noiseCancellation, setNoiseCancellation] = useState(true);
    const [keyVerificationState, setKeyVerificationState] = useState<'unverified' | 'verifying' | 'verified'>('unverified');
    const [telemetry, setTelemetry] = useState({ bitrate: 512, latency: 12, jitter: 1.1, packetLoss: 0.0 });
    const [directBriefingPlaying, setDirectBriefingPlaying] = useState(false);

    // Voice Biometric States
    const [showBiometrics, setShowBiometrics] = useState(false);
    const [vocalBiometricState, setVocalBiometricState] = useState<'idle' | 'enrolling' | 'enroll_success' | 'authenticating' | 'auth_success' | 'auth_failed'>('idle');
    const [vocalPrintTemplate, setVocalPrintTemplate] = useState<string | null>(() => {
        try { return localStorage.getItem('vocal_print_signature'); } catch(e) { return null; }
    });
    const [biometricScore, setBiometricScore] = useState<number>(0);
    const [isVoiceScanning, setIsVoiceScanning] = useState(false);
    const [voiceScanText, setVoiceScanText] = useState('');
    const biometricCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const biometricAnimFrameRef = useRef<number | null>(null);
    const biometricAudioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    // Video Conferencing States
    const [isVideoActive, setIsVideoActive] = useState(false);
    const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
    const [remoteVideoStream, setRemoteVideoStream] = useState<MediaStream | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

    const clientCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const clientAnimFrameRef = useRef<number | null>(null);
    const pipCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const [callDuration, setCallDuration] = useState(0);
    const callTimerRef = useRef<any>(null);

    // Fluctuate telemetry values during connected state
    useEffect(() => {
        if (callState !== 'connected') return;
        const telemetryInterval = setInterval(() => {
            setTelemetry(prev => ({
                bitrate: 512 + Math.floor(Math.random() * 6) - 3,
                latency: Math.max(4, 11 + Math.floor(Math.random() * 4) - 2),
                jitter: Math.max(0.1, Number((1.1 + (Math.random() * 0.4 - 0.2)).toFixed(2))),
                packetLoss: Math.random() < 0.08 ? 0.01 : 0.00
            }));
        }, 1500);
        return () => clearInterval(telemetryInterval);
    }, [callState]);

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

    // Synthesize procedural professional dialing tone
    const playCustomerDialTone = () => {
        try {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc1 = audioCtxRef.current.createOscillator();
            const osc2 = audioCtxRef.current.createOscillator();
            const gainNode = audioCtxRef.current.createGain();
            
            osc1.frequency.setValueAtTime(350, audioCtxRef.current.currentTime);
            osc2.frequency.setValueAtTime(440, audioCtxRef.current.currentTime);
            
            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(audioCtxRef.current.destination);
            
            gainNode.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
            
            let pulse = true;
            const dialInterval = setInterval(() => {
                if (callState !== 'dialing') {
                    clearInterval(dialInterval);
                    try {
                        osc1.stop();
                        osc2.stop();
                    } catch(e){}
                    return;
                }
                const now = audioCtxRef.current?.currentTime || 0;
                if (pulse) {
                    gainNode.gain.setValueAtTime(0.06, now);
                } else {
                    gainNode.gain.setValueAtTime(0, now);
                }
                pulse = !pulse;
            }, 1000);
            
            osc1.start();
            osc2.start();
        } catch (e) {}
    };

    // Customer initiates real-time direct sound pipeline
    const handleInitiateCall = () => {
        setShowBiometrics(true);
        if (vocalPrintTemplate) {
            setVocalBiometricState('idle');
            setVoiceScanText('Vocal print signature detected. Ready for identity verification.');
        } else {
            setVocalBiometricState('idle');
            setVoiceScanText('No registered vocal key found. Cryptographic registration required.');
        }
    };

    // Speak professional banking executive voice briefing using Web Speech Synthesis
    const triggerVoiceBriefing = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setDirectBriefingPlaying(true);
            const userName = user.profile?.name || 'Sovereign Client';
            const text = `Acoustic sound bridge active. Welcome, ${userName}. Line routing established via ${selectedSatellite}. Direct scrambler active using ${scramblerType} encryption protocol. Your private asset clearing pipelines and treasury systems are locked and protected. A verified portfolio advisor is synchronized.`;
            const utterance = new SpeechSynthesisUtterance(text);
            
            const voices = window.speechSynthesis.getVoices();
            const premiumVoice = voices.find(v => 
                v.name.includes('Premium') || 
                v.name.includes('Natural') || 
                v.name.includes('Google') || 
                v.name.includes('Samantha') ||
                v.name.includes('Daniel')
            );
            if (premiumVoice) utterance.voice = premiumVoice;
            utterance.pitch = 0.96;
            utterance.rate = 0.90;
            utterance.onend = () => setDirectBriefingPlaying(false);
            utterance.onerror = () => setDirectBriefingPlaying(false);
            window.speechSynthesis.speak(utterance);
        }
    };

    // Audio Context References
    const audioCtxRef = useRef<AudioContext | null>(null);
    const ringerOsc = useRef<OscillatorNode | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const peerConnRef = useRef<RTCPeerConnection | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

    // Real-Time Chat Status Tracking System (Seen / Read / Replied / Typing)
    const [peerChatStatus, setPeerChatStatus] = useState<{ status: 'seen' | 'read' | 'replied' | 'typing'; timestamp: string } | null>(null);

    const handleSubmitRating = async () => {
        if (selectedStars === 0) return;
        try {
            const allSess = await db.getChatSessions();
            const currentSess = allSess.find(s => s.id === sessionId);
            if (currentSess) {
                const updatedSess: ChatSession = {
                    ...currentSess,
                    rating: selectedStars,
                    ratingFeedback: feedbackComment,
                    ratingTimestamp: new Date().toISOString()
                };
                await db.saveChatSession(updatedSess);
                setSessionRating(selectedStars);
                setRatingSubmitted(true);
                
                // Emit socket event to notify admin
                socket.emit('chat:rate_session', {
                    sessionId: sessionId,
                    rating: selectedStars,
                    ratingFeedback: feedbackComment
                });
            }
        } catch (err) {
            console.error("Failed to submit rating:", err);
        }
    };

    const handleExportPDF = async () => {
        try {
            const { jsPDF } = await import('jspdf');
            
            const tempContainer = document.createElement('div');
            tempContainer.style.width = '700px';
            tempContainer.style.padding = '40px';
            tempContainer.style.fontFamily = 'Inter, "Helvetica Neue", sans-serif';
            tempContainer.style.backgroundColor = '#ffffff';
            tempContainer.style.color = '#1e293b';
            
            // Add header
            const header = document.createElement('div');
            header.style.borderBottom = '3px solid #10b981';
            header.style.paddingBottom = '20px';
            header.style.marginBottom = '30px';
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';
            
            const titleContainer = document.createElement('div');
            const bankName = document.createElement('h1');
            bankName.innerText = 'FIRST PACIFIC PRIVATE BANK';
            bankName.style.fontSize = '18px';
            bankName.style.fontWeight = '800';
            bankName.style.color = '#064e3b';
            bankName.style.letterSpacing = '0.05em';
            bankName.style.margin = '0';
            
            const docTitle = document.createElement('h2');
            docTitle.innerText = 'Support Conversation Transcript';
            docTitle.style.fontSize = '12px';
            docTitle.style.fontWeight = '600';
            docTitle.style.color = '#64748b';
            docTitle.style.margin = '4px 0 0 0';
            docTitle.style.textTransform = 'uppercase';
            
            titleContainer.appendChild(bankName);
            titleContainer.appendChild(docTitle);
            
            const metadata = document.createElement('div');
            metadata.style.textAlign = 'right';
            metadata.style.fontSize = '10px';
            metadata.style.color = '#64748b';
            metadata.style.fontFamily = 'monospace';
            metadata.innerHTML = `
                <div>SESSION ID: ${sessionId}</div>
                <div>DATE: ${new Date().toLocaleDateString()}</div>
                <div>TIME: ${new Date().toLocaleTimeString()}</div>
            `;
            
            header.appendChild(titleContainer);
            header.appendChild(metadata);
            tempContainer.appendChild(header);
            
            // Add message log
            const messageLog = document.createElement('div');
            messageLog.style.display = 'flex';
            messageLog.style.flexDirection = 'column';
            messageLog.style.gap = '20px';
            
            messages.forEach(msg => {
                const isMe = msg.senderId === 'user';
                
                const messageRow = document.createElement('div');
                messageRow.style.display = 'flex';
                messageRow.style.flexDirection = 'column';
                messageRow.style.alignItems = isMe ? 'flex-end' : 'flex-start';
                messageRow.style.width = '100%';
                
                // Sender name & time
                const msgHeader = document.createElement('div');
                msgHeader.style.fontSize = '10px';
                msgHeader.style.fontWeight = 'bold';
                msgHeader.style.color = '#64748b';
                msgHeader.style.marginBottom = '4px';
                msgHeader.style.display = 'flex';
                msgHeader.style.gap = '8px';
                msgHeader.innerText = `${isMe ? 'You' : (msg.senderName || 'Desk Executive')} • ${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                
                // Message bubble
                const bubble = document.createElement('div');
                bubble.style.padding = '12px 16px';
                bubble.style.borderRadius = '16px';
                bubble.style.fontSize = '12px';
                bubble.style.lineHeight = '1.6';
                bubble.style.maxWidth = '80%';
                bubble.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                if (isMe) {
                    bubble.style.backgroundColor = '#10b981';
                    bubble.style.color = '#ffffff';
                    bubble.style.borderBottomRightRadius = '4px';
                    bubble.innerHTML = msg.content;
                    const elements = bubble.querySelectorAll('p, span, strong, em');
                    elements.forEach(el => {
                        (el as HTMLElement).style.color = '#ffffff';
                    });
                } else {
                    bubble.style.backgroundColor = '#f1f5f9';
                    bubble.style.color = '#1e293b';
                    bubble.style.border = '1px solid #e2e8f0';
                    bubble.style.borderBottomLeftRadius = '4px';
                    bubble.innerHTML = msg.content;
                    const elements = bubble.querySelectorAll('p, span, strong, em');
                    elements.forEach(el => {
                        (el as HTMLElement).style.color = '#1e293b';
                    });
                }
                
                messageRow.appendChild(msgHeader);
                messageRow.appendChild(bubble);
                messageLog.appendChild(messageRow);
            });
            
            tempContainer.appendChild(messageLog);
            
            // Append to body temporarily
            document.body.appendChild(tempContainer);
            
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: 'a4'
            });
            
            await doc.html(tempContainer, {
                callback: function (pdf) {
                    pdf.save(`support_transcript_${sessionId}.pdf`);
                    document.body.removeChild(tempContainer);
                },
                x: 10,
                y: 10,
                width: 430,
                windowWidth: 700
            });
        } catch (err) {
            console.error("Failed to export PDF:", err);
        }
    };

    // Dynamic presence heartbeat to registry
    useEffect(() => {
        if (!user || !user.email) return;
        
        const sendHeartbeat = () => {
            socket.emit('user:heartbeat', {
                email: user.email,
                currentPath: window.location.pathname === '/' ? 'Main Portal' : window.location.pathname,
                status: 'active'
            });
        };
        
        sendHeartbeat();
        const interval = setInterval(sendHeartbeat, 10000); // Every 10 seconds for real-time fidelity
        
        return () => {
            clearInterval(interval);
        };
    }, [user]);

    // Load initial messages
    useEffect(() => {
        if (!isOpen) return;
        const loadMessages = async () => {
            const msgs = await db.getChatMessages(sessionId);
            setMessages(msgs);
            setUnreadCount(0);

            // Check if session status is resolved or has been rated
            const allSess = await db.getChatSessions();
            const currentSess = allSess.find(s => s.id === sessionId);
            if (currentSess) {
                setSessionStatus(currentSess.status);
                if (currentSess.rating) {
                    setSessionRating(currentSess.rating);
                }
            }
        };
        loadMessages();
    }, [isOpen, sessionId]);

    // Emit read receipt back to admin when client has opened/views messages
    useEffect(() => {
        if (isOpen && sessionId) {
            socket.emit('chat:read_receipt', {
                sessionId: sessionId,
                userId: 'user',
                timestamp: new Date().toISOString()
            });
            // Mark non-user messages as read locally
            setMessages(prev => prev.map(m => m.senderId !== 'user' && !m.read ? { ...m, read: true, status: 'read' } : m));
        }
    }, [isOpen, messages.length, sessionId]);

    // Emit typing status to admin based on client typing input
    useEffect(() => {
        if (!sessionId) return;
        socket.emit('chat:typing', { sessionId: sessionId, senderId: 'user', isTyping: inputValue.length > 0 });
        
        let timer: any;
        if (inputValue.length > 0) {
            timer = setTimeout(() => {
                socket.emit('chat:typing', { sessionId: sessionId, senderId: 'user', isTyping: false });
            }, 3000);
        }
        
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [inputValue, sessionId]);

    // Create/Active session in queue when chat is opened
    useEffect(() => {
        if (!isOpen) return;
        const initChatSession = async () => {
            // Check if session already exists
            const allSess = await db.getChatSessions();
            const existingSess = allSess.find(s => s.id === sessionId);
            if (existingSess) {
                setSessionStatus(existingSess.status);
                if (existingSess.rating) {
                    setSessionRating(existingSess.rating);
                }
                return;
            }

            // Update/Create the session in the database
            const session: ChatSession = {
                id: sessionId,
                userId: user.email,
                userName: user.profile?.name || 'Customer',
                startedAt: new Date(),
                lastUpdatedAt: new Date(),
                status: 'active',
                unreadAdminCount: 0,
                unreadUserCount: 0
            };
            await db.saveChatSession(session);
            setSessionStatus('active');

            // Let the admin know via socket that a user has opened the chat terminal
            socket.emit('chat:send_message', {
                id: `msg_join_${Date.now()}`,
                sessionId: sessionId,
                senderId: 'system',
                senderName: 'System Notice',
                content: `🔔 Customer ${user.profile?.name || user.email} opened the support terminal. Ready to receive compliance and asset clearance requests.`,
                timestamp: new Date(),
                read: false
            });
        };
        initChatSession();
    }, [isOpen, sessionId, user]);

    // Socket listening on client side
    useEffect(() => {
        const handleReceiveMessage = (msg: ChatMessage) => {
            if (msg.sessionId === sessionId) {
                setMessages(prev => {
                    if (prev.find(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
                
                if (msg.senderId !== 'user') {
                    // Play sweet ringtune sound
                    playChatRingtone();
                    // Native HTML5 system push notification
                    triggerSystemNotification(msg);
                    
                    if (!isOpen) {
                        setUnreadCount(prev => prev + 1);
                        setRecentAlert(msg);
                    }

                    // Emit delivery receipt
                    socket.emit('chat:delivered_receipt', {
                        sessionId: sessionId,
                        msgId: msg.id,
                        senderId: 'user'
                    });

                    // If open, also emit read receipt
                    if (isOpen) {
                        socket.emit('chat:read_receipt', {
                            sessionId: sessionId,
                            userId: 'user',
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            }
        };

        const handleVoiceInvite = (data: any) => {
            if (data.sessionId === sessionId) {
                if (data.type === 'start') {
                    setIsOpen(true); // Open support chat instantly so they see the urgent incoming line
                    setCallState('incoming');
                    playRingTone();
                } else if (data.type === 'start_request') {
                    // This was requested by user, so keep dialing
                    setCallState('dialing');
                } else if (data.type === 'terminate') {
                    handleEndCall(false);
                }
            }
        };

        const handleVoiceAccept = (data: any) => {
            if (data.sessionId === sessionId) {
                setCallState('connected');
                initializeMediaStream(isVideoActive);
            }
        };

        const handleVideoToggleRemote = (data: any) => {
            if (data.sessionId === sessionId && data.sender !== 'user') {
                setIsVideoActive(data.isVideoActive);
                if (data.isVideoActive) {
                    initializeMediaStream(true);
                }
            }
        };

        const handleWebRTCOffer = async (data: any) => {
            if (data.sessionId === sessionId) {
                try {
                    console.log("[WebRTC Client] Processing offer from support agent...");
                    
                    if (peerConnRef.current) {
                        peerConnRef.current.close();
                    }

                    const pc = new RTCPeerConnection({
                        iceServers: [{ urls: 'stun:stun1.l.google.com:19302' }]
                    });
                    peerConnRef.current = pc;

                    // Stream tracks
                    if (localStreamRef.current) {
                        localStreamRef.current.getTracks().forEach(track => {
                            pc.addTrack(track, localStreamRef.current!);
                        });
                    }

                    pc.onicecandidate = (event) => {
                        if (event.candidate) {
                            socket.emit('webrtc:ice_candidate', {
                                sessionId: sessionId,
                                candidate: event.candidate,
                                sender: 'user'
                            });
                        }
                    };

                    pc.ontrack = (event) => {
                        console.log("[WebRTC Client] Received secure track from Agent:", event.track.kind);
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

                    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);

                    socket.emit('webrtc:answer', {
                        sessionId: sessionId,
                        answer: answer
                    });
                } catch (e) {
                    console.error("[WebRTC Client] Offer error:", e);
                }
            }
        };

        const handleRemoteICECandidate = async (data: any) => {
            if (data.sessionId === sessionId && peerConnRef.current && data.sender !== 'user') {
                try {
                    if (data.candidate) {
                        console.log("[WebRTC Client] Adding ICE candidate:", data.candidate);
                        await peerConnRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                    }
                } catch (e) {
                    console.error("[WebRTC Client] ICE candidate error:", e);
                }
            }
        };

        const handlePeerTyping = (data: { sessionId: string; senderId: string; isTyping: boolean }) => {
            if (data.sessionId === sessionId && data.senderId !== 'user') {
                setPeerChatStatus(data.isTyping ? { status: 'typing' as const, timestamp: new Date().toISOString() } : null);
            }
        };

        const handlePeerReadReceipt = (data: { sessionId: string; userId: string; timestamp: string }) => {
            if (data.sessionId === sessionId && data.userId !== 'user') {
                setPeerChatStatus({ status: 'read' as const, timestamp: data.timestamp || new Date().toISOString() });
                setMessages(prev => prev.map(m => m.senderId === 'user' ? { ...m, read: true, status: 'read' as const } : m));
            }
        };

        const handlePeerDeliveredReceipt = (data: { sessionId: string; msgId: string; senderId: string }) => {
            if (data.sessionId === sessionId && data.senderId !== 'user') {
                setMessages(prev => prev.map(m => m.id === data.msgId ? { ...m, status: 'delivered' as const } : m));
            }
        };

        const handleSessionResolved = (data: { sessionId: string }) => {
            if (data.sessionId === sessionId) {
                setSessionStatus('resolved');
            }
        };

        socket.on('chat:receive_message', handleReceiveMessage);
        socket.on('chat:voice_call_invite', handleVoiceInvite);
        socket.on('chat:voice_call_accept', handleVoiceAccept);
        socket.on('webrtc:offer', handleWebRTCOffer);
        socket.on('webrtc:ice_candidate', handleRemoteICECandidate);
        socket.on('webrtc:video_toggle', handleVideoToggleRemote);
        socket.on('chat:typing', handlePeerTyping);
        socket.on('chat:read_receipt', handlePeerReadReceipt);
        socket.on('chat:delivered_receipt', handlePeerDeliveredReceipt);
        socket.on('chat:session_resolved', handleSessionResolved);

        return () => {
            socket.off('chat:receive_message', handleReceiveMessage);
            socket.off('chat:voice_call_invite', handleVoiceInvite);
            socket.off('chat:voice_call_accept', handleVoiceAccept);
            socket.off('webrtc:offer', handleWebRTCOffer);
            socket.off('webrtc:ice_candidate', handleRemoteICECandidate);
            socket.off('webrtc:video_toggle', handleVideoToggleRemote);
            socket.off('chat:typing', handlePeerTyping);
            socket.off('chat:read_receipt', handlePeerReadReceipt);
            socket.off('chat:delivered_receipt', handlePeerDeliveredReceipt);
            socket.off('chat:session_resolved', handleSessionResolved);
        };
    }, [sessionId, isOpen]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    const handleSend = async () => {
        const textContent = inputValue.trim();
        if (!textContent && !attachment) return;

        const newMsg: ChatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            sessionId: sessionId,
            senderId: 'user',
            senderName: user.profile?.name || 'Customer',
            content: textContent,
            timestamp: new Date(),
            read: false,
            status: 'sent',
            // @ts-ignore
            attachmentUrl: attachment?.url || undefined,
            attachmentName: attachment?.name || undefined,
            attachmentType: attachment?.type || undefined
        };

        setInputValue('');
        setAttachment(null);
        setMessages(prev => [...prev, newMsg]);

        // Save locally for persistence
        await db.saveChatMessage(newMsg);

        // Update/create the session
        const session: ChatSession = {
            id: sessionId,
            userId: user.email,
            userName: user.profile?.name || 'Customer',
            startedAt: new Date(),
            lastUpdatedAt: new Date(),
            status: 'active',
            unreadAdminCount: 1,
            unreadUserCount: 0
        };
        await db.saveChatSession(session);

        // Emit to server
        socket.emit('chat:send_message', newMsg);
    };

    // Synthesize procedural telephone ringer for customer node
    const playRingTone = () => {
        try {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            ringerOsc.current = audioCtxRef.current.createOscillator();
            const ringGain = audioCtxRef.current.createGain();
            
            // Warbling high frequency 1000Hz alert
            ringerOsc.current.frequency.setValueAtTime(800, audioCtxRef.current.currentTime);
            ringerOsc.current.connect(ringGain);
            ringGain.connect(audioCtxRef.current.destination);
            
            ringGain.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
            
            let tick = 0;
            const ringerInterval = setInterval(() => {
                if (callState !== 'incoming') {
                    clearInterval(ringerInterval);
                    return;
                }
                const now = audioCtxRef.current?.currentTime || 0;
                if (tick % 2 === 0) {
                    ringerOsc.current?.frequency.setValueAtTime(850, now);
                    ringGain.gain.setValueAtTime(0.12, now);
                } else {
                    ringerOsc.current?.frequency.setValueAtTime(750, now);
                    ringGain.gain.setValueAtTime(0, now);
                }
                tick++;
            }, 500);

            ringerOsc.current.start();
        } catch (e) {}
    };

    const stopRingTone = () => {
        try {
            ringerOsc.current?.stop();
            ringerOsc.current = null;
        } catch (e) {}
    };

    // Client accept direct secure sound corridor
    const handleAcceptCall = async () => {
        stopRingTone();
        setCallState('connected');
        socket.emit('chat:voice_call_accept', { sessionId: sessionId });
        initializeMediaStream(isVideoActive);
    };

    const handleRejectCall = () => {
        stopRingTone();
        setCallState('idle');
        socket.emit('chat:voice_call_terminate', { sessionId: sessionId });
    };

    const initializeMediaStream = async (videoEnabled: boolean) => {
        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            }
            if (audioCtxRef.current.state === 'suspended') {
                await audioCtxRef.current.resume();
            }

            // Stop any existing tracks of the local stream to refresh cleanly
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: videoEnabled ? { width: 480, height: 360, facingMode: 'user' } : false
            }).catch(() => null);

            if (stream) {
                localStreamRef.current = stream;
                setLocalVideoStream(stream);

                const audioTrack = stream.getAudioTracks()[0];
                if (audioTrack) {
                    audioSourceRef.current = audioCtxRef.current.createMediaStreamSource(new MediaStream([audioTrack]));
                    analyserRef.current = audioCtxRef.current.createAnalyser();
                    analyserRef.current.fftSize = 64;
                    audioSourceRef.current.connect(analyserRef.current);
                    
                    const gain = audioCtxRef.current.createGain();
                    gain.gain.value = 0.05;
                    analyserRef.current.connect(gain);
                    gain.connect(audioCtxRef.current.destination);
                }

                // If peer connection exists, swap/add tracks
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
                }
            }

            runClientWaveVisualizer();
        } catch (e) {
            console.warn("Client media acquisition error, visualizer running in simulation:", e);
            runClientWaveVisualizer();
        }
    };

    const handleToggleVideo = () => {
        const nextState = !isVideoActive;
        setIsVideoActive(nextState);
        initializeMediaStream(nextState);
        socket.emit('webrtc:video_toggle', { sessionId: sessionId, isVideoActive: nextState, sender: 'user' });
    };

    const runClientWaveVisualizer = () => {
        const draw = () => {
            if (callState === 'idle') return;
            clientAnimFrameRef.current = requestAnimationFrame(draw);

            const bufferLength = analyserRef.current ? analyserRef.current.frequencyBinCount : 32;
            const dataArray = new Uint8Array(bufferLength);

            if (analyserRef.current) {
                analyserRef.current.getByteFrequencyData(dataArray);
            } else {
                // Procedural noise for simulation
                for (let i = 0; i < bufferLength; i++) {
                    dataArray[i] = Math.cos(Date.now() * 0.007 + i * 0.45) * 30 + 45;
                }
            }

            const drawOnCanvas = (canvas: HTMLCanvasElement | null, colorPrefix: string) => {
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                const width = canvas.width;
                const height = canvas.height;
                ctx.clearRect(0, 0, width, height);

                const barWidth = (width / bufferLength) * 1.5;
                let barHeight;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    barHeight = (dataArray[i] / 255) * height * 1.0;
                    ctx.fillStyle = `${colorPrefix}${0.4 + (dataArray[i] / 255)})`;
                    ctx.fillRect(x, height / 2 - barHeight / 2, barWidth - 1, barHeight);
                    ctx.fillRect(x, height / 2 + barHeight / 2 - 1, barWidth - 1, 2);
                    x += barWidth;
                }
            };

            drawOnCanvas(clientCanvasRef.current, 'rgba(6, 182, 212, ');
            drawOnCanvas(pipCanvasRef.current, 'rgba(52, 211, 153, '); // Emerald color for active client PiP corridor wave
        };
        draw();
    };

    const playBiometricSuccessChime = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
            osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {}
    };

    const runBiometricVisualizer = (stream: MediaStream) => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const draw = () => {
                if (!biometricCanvasRef.current) return;
                biometricAnimFrameRef.current = requestAnimationFrame(draw);

                analyser.getByteFrequencyData(dataArray);

                const canvas = biometricCanvasRef.current;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                const width = canvas.width;
                const height = canvas.height;
                ctx.clearRect(0, 0, width, height);

                const centerX = width / 2;
                const centerY = height / 2;
                const baseRadius = Math.min(width, height) * 0.28;

                ctx.strokeStyle = '#10b981'; // Emerald
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                for (let i = 0; i < bufferLength; i++) {
                    const angle = (i / bufferLength) * Math.PI * 2;
                    const offset = (dataArray[i] / 255) * 22;
                    const r = baseRadius + offset;
                    const x = centerX + Math.cos(angle) * r;
                    const y = centerY + Math.sin(angle) * r;
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.stroke();

                const barWidth = width / bufferLength;
                for (let i = 0; i < bufferLength; i++) {
                    const barHeight = (dataArray[i] / 255) * height * 0.35;
                    ctx.fillStyle = `rgba(16, 185, 129, ${0.1 + (dataArray[i] / 255) * 0.75})`;
                    ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
                }
            };
            draw();
        } catch (e) {
            console.error("Biometric visualizer error:", e);
        }
    };

    const startVocalBiometricCapture = async (isEnrollMode: boolean) => {
        try {
            setIsVoiceScanning(true);
            setVoiceScanText("Initializing micro-acoustic sensors...");
            setBiometricScore(0);

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
            if (!stream) {
                setVoiceScanText("Sensor Access Denied. Check browser mic permissions.");
                setIsVoiceScanning(false);
                return;
            }

            runBiometricVisualizer(stream);

            let countdown = 3;
            const phraseStages = [
                "Capturing harmonic formants...",
                "Mapping timbre spectrum...",
                "Synthesizing cryptographic vocal signature..."
            ];

            const interval = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    setVoiceScanText(phraseStages[3 - countdown - 1] || "Analyzing acoustics...");
                } else {
                    clearInterval(interval);
                    if (biometricAnimFrameRef.current) {
                        cancelAnimationFrame(biometricAnimFrameRef.current);
                        biometricAnimFrameRef.current = null;
                    }
                    stream.getTracks().forEach(t => t.stop());

                    if (isEnrollMode) {
                        const mockSignature = Array.from({ length: 16 }, () => Math.floor(100 + Math.random() * 800));
                        const signatureString = JSON.stringify(mockSignature);
                        localStorage.setItem('vocal_print_signature', signatureString);
                        setVocalPrintTemplate(signatureString);
                        setVocalBiometricState('enroll_success');
                        setVoiceScanText("Vocal print registered & cryptographically sealed!");
                        playBiometricSuccessChime();
                    } else {
                        const randomScore = Number((96.4 + Math.random() * 3.2).toFixed(2));
                        setBiometricScore(randomScore);
                        setVocalBiometricState('auth_success');
                        setVoiceScanText(`Acoustic match confirmed: ${randomScore}% Identity Verified!`);
                        playBiometricSuccessChime();

                        setTimeout(() => {
                            setShowBiometrics(false);
                            setVocalBiometricState('idle');
                            setIsVoiceScanning(false);
                            setCallState('dialing');
                            playCustomerDialTone();
                            socket.emit('chat:voice_call_invite', { sessionId: sessionId, type: 'start_request' });
                        }, 1800);
                    }
                    setIsVoiceScanning(false);
                }
            }, 1000);

        } catch (e) {
            console.error(e);
            setVoiceScanText("Physical acoustic verification failed.");
            setIsVoiceScanning(false);
        }
    };

    const handleResetVocalPrint = () => {
        localStorage.removeItem('vocal_print_signature');
        setVocalPrintTemplate(null);
        setVocalBiometricState('idle');
        setBiometricScore(0);
        setVoiceScanText('');
    };

    const handleEndCall = (shouldEmit = true) => {
        stopRingTone();
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setDirectBriefingPlaying(false);
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        setLocalVideoStream(null);
        setRemoteVideoStream(null);
        setIsVideoActive(false);

        if (clientAnimFrameRef.current) {
            cancelAnimationFrame(clientAnimFrameRef.current);
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
        setCallState('idle');
        if (shouldEmit) {
            socket.emit('chat:voice_call_terminate', { sessionId: sessionId });
        }
    };

    // Track active connection call duration timer on customer side
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

    useEffect(() => {
        return () => {
            stopRingTone();
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (clientAnimFrameRef.current) {
                cancelAnimationFrame(clientAnimFrameRef.current);
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

    return (
        <>
            {/* Top-Right Premium Interactive Slide-in Alarm/Message Banner Alert */}
            <AnimatePresence>
                {recentAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, scale: 0.9, x: 100 }}
                        animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9, x: 50 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="fixed top-6 right-4 sm:right-6 w-96 max-w-[calc(100vw-32px)] z-[9999] bg-white dark:bg-slate-900 border-2 border-emerald-500/30  p-5 rounded-3xl shadow-[0_25px_60px_-15px_rgba(16,185,129,0.25)] flex flex-col gap-3 text-left overflow-hidden"
                    >
                        {/* Shimmer/Resonance background pulse effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent animate-pulse pointer-events-none" />

                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                <span className="text-[10px] font-mono tracking-widest text-[#0ec5f2] border border-[#0ec5f2]/20 px-2 py-0.5 rounded uppercase font-black bg-[#0ec5f2]/5">
                                    LIVE INTERCEPT MESSAGE
                                </span>
                            </div>
                            <button
                                onClick={() => setRecentAlert(null)}
                                className="p-1 px-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:hover:text-white transition-colors cursor-pointer dark:bg-slate-800"
                            >
                                <XIcon className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex gap-3 items-start relative z-10 mt-1">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-300/50 shrink-0 text-[#0F172A] dark:text-white font-extrabold text-sm uppercase">
                                {recentAlert.senderName ? recentAlert.senderName[0] : 'S'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-wide">
                                    {recentAlert.senderName || "Compliance Desk Officer"}
                                </p>
                                <p className="text-xs text-[#0F172A] dark:text-slate-350 mt-1 leading-relaxed line-clamp-3">
                                    {recentAlert.content}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-white/10 pt-3 mt-1 relative z-10">
                            <button
                                onClick={() => setRecentAlert(null)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-[10px] font-black uppercase tracking-wider text-[#0F172A] dark:text-white hover:text-[#1E293B] dark:hover:text-[#1E293B] transition-all cursor-pointer"
                            >
                                Dismiss
                            </button>
                            <button
                                onClick={() => {
                                    setIsOpen(true);
                                    setRecentAlert(null);
                                }}
                                className="px-4 py-1.5 rounded-xl bg-emerald-600 dark:bg-emerald-550 hover:bg-emerald-555 dark:hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
                            >
                                <MessageSquareIcon className="w-3.5 h-3.5" />
                                Open chat line
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="fixed bottom-6 right-6 z-50">
            {/* Chat button / PiP Active Call Overlay */}
            {!isOpen && callState === 'connected' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 15 }}
                    className="bg-slate-50 dark:bg-slate-900 border-2 border-emerald-500/35  p-4 rounded-3xl shadow-[0_20px_50px_rgba(16,185,129,0.3)] flex flex-col gap-3 w-72 pointer-events-auto transition-all"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-extrabold">SECURE SUPPORT PiP</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-350 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                            {Math.floor(callDuration / 60).toString().padStart(2, '0')}:{(callDuration % 60).toString().padStart(2, '0')}
                        </span>
                    </div>

                    {/* Compact Waveform */}
                    <div className="w-full h-11 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-850 overflow-hidden relative flex items-center justify-center">
                        <canvas ref={pipCanvasRef} width={256} height={44} className="w-full h-full opacity-90" />
                    </div>

                    {/* Controllers */}
                    <div className="flex items-center justify-between border-t border-slate-200/80 pt-2.5 mt-0.5">
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => {
                                    if (localStreamRef.current) {
                                        const track = localStreamRef.current.getAudioTracks()[0];
                                        if (track) track.enabled = !track.enabled;
                                    }
                                    setIsMuted(!isMuted);
                                }}
                                className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                                    isMuted 
                                        ? 'bg-red-500 border-red-500/30 text-red-400 hover:bg-red-500' 
                                        : 'bg-slate-100 border-slate-200 text-[#0F172A] hover:text-white hover:bg-white'
                                }`}
                                title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                            >
                                {isMuted ? <MicOffIcon className="w-3.5 h-3.5 animate-pulse" /> : <MicIcon className="w-3.5 h-3.5" />}
                            </button>

                            <button
                                onClick={() => setIsOpen(true)}
                                className="p-2 rounded-xl font-mono text-[10px] font-bold border bg-slate-50 border-slate-200 text-cyan-400 hover:text-cyan-300 hover:bg-white flex items-center gap-1 transition-all dark:bg-slate-800"
                                title="Expand to Support Window"
                            >
                                <Maximize2Icon className="w-3.5 h-3.5" />
                                <span>RE-DOCK</span>
                            </button>
                        </div>

                        <button
                            onClick={() => handleEndCall(true)}
                            className="bg-red-655 hover:bg-red-500 hover:scale-105 active:scale-95 text-white p-2 px-3.5 rounded-xl font-bold uppercase text-[9px] font-mono tracking-wider shadow-lg shadow-red-950/20 transition-all flex items-center gap-1.5"
                            title="Disconnect Secure support Corridor"
                        >
                            <PhoneOffIcon className="w-3.5 h-3.5" />
                            <span>DISCONNECT</span>
                        </button>
                    </div>
                </motion.div>
            )}

            {!isOpen && callState !== 'connected' && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="relative bg-emerald-650 hover:bg-emerald-600 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center justify-center border-4 border-slate-100 dark:border-slate-900 pointer-events-auto"
                >
                    <MessageSquareIcon className="w-6 h-6 animate-pulse" />
                    {unreadCount > 0 ? (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-100 dark:border-slate-900 animate-bounce">
                            {unreadCount}
                        </div>
                    ) : (
                        <div className="absolute -top-1 -right-1 bg-emerald-400 h-3.5 w-3.5 rounded-full border-2 border-slate-100 dark:border-slate-900 animate-ping"></div>
                    )}
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white dark:bg-[#0a0f18] w-80 sm:w-[410px] h-[520px] rounded-3xl shadow-3xl flex flex-col border border-slate-200 dark:border-slate-700/80 overflow-hidden animate-fade-in origin-bottom-right transition-all pointer-events-auto">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-700 to-teal-900 p-4 shrink-0 flex justify-between items-center text-white">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-xl  border border-slate-200 dark:border-white/10 dark:bg-slate-800">
                                <ShieldIcon className="w-5 h-5 text-emerald-300" />
                            </div>
                            <div>
                                <h3 className="font-extrabold tracking-wider text-xs uppercase text-emerald-300">Sovereign Intercept Line</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,1)]"></div>
                                    <span className="text-[10px] uppercase tracking-widest font-mono text-emerald-250">SLA DESK SECURED & ACTIVE</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {messages.length > 0 && (
                                <button 
                                    onClick={handleExportPDF} 
                                    className="text-white/70 hover:text-white hover:bg-slate-100 bg-slate-100 p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                                    title="Export Conversation history to PDF"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    <span className="text-[9px] uppercase tracking-wider font-mono font-black hidden sm:inline">Export</span>
                                </button>
                            )}
                            {callState === 'idle' && (
                                <button 
                                    onClick={handleInitiateCall}
                                    className="text-emerald-300 hover:text-white hover:bg-slate-100 bg-slate-100 p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                                    title="Initiate Secure Voice Crypt Corridor"
                                >
                                    <PhoneIcon className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
                                    <span className="text-[9px] uppercase tracking-wider font-mono font-black hidden sm:inline">Sound Corridor</span>
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors bg-slate-100 hover:bg-slate-100 p-2 rounded-xl">
                                <XIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area / Connection Interlock View */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#060a10] custom-scrollbar flex flex-col relative">
                        
                        {/* Vocal Biometrics Portal */}
                        <AnimatePresence>
                            {showBiometrics && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-[#060a10]/98  flex flex-col items-center justify-between p-6 text-center z-50 overflow-hidden text-white pointer-events-auto"
                                >
                                    <div className="w-full flex justify-between items-center shrink-0 border-b border-slate-200 pb-3">
                                        <div className="flex items-center gap-2">
                                            <FingerprintIcon className="w-4 h-4 text-emerald-400 animate-pulse" />
                                            <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-black">BIOMETRIC VAULT</span>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                if (biometricAnimFrameRef.current) {
                                                    cancelAnimationFrame(biometricAnimFrameRef.current);
                                                }
                                                setShowBiometrics(false);
                                                setVocalBiometricState('idle');
                                                setIsVoiceScanning(false);
                                            }}
                                            className="text-[#0F172A] hover:text-white p-1"
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex-1 flex flex-col items-center justify-center w-full py-4">
                                        {/* Canvas for voice fingerprint visualizer */}
                                        <div className="relative w-36 h-36 flex items-center justify-center bg-slate-100 rounded-full border border-emerald-500/20 mb-4 overflow-hidden shadow-2xl">
                                            <canvas 
                                                ref={biometricCanvasRef} 
                                                width={144} 
                                                height={144} 
                                                className="absolute inset-0 w-full h-full"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                {isVoiceScanning ? (
                                                    <MicIcon className="w-10 h-10 text-emerald-400 animate-pulse" />
                                                ) : vocalBiometricState === 'auth_success' || vocalBiometricState === 'enroll_success' ? (
                                                    <ShieldCheckIcon className="w-12 h-12 text-emerald-400" />
                                                ) : (
                                                    <FingerprintIcon className="w-12 h-12 text-[#0F172A]" />
                                                )}
                                            </div>
                                        </div>

                                        <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest font-mono mb-2">
                                            {vocalPrintTemplate ? 'Voice Print Match Required' : 'Acoustic Enrollment'}
                                        </h4>
                                        <p className="text-[11px] text-[#0F172A] max-w-xs leading-relaxed mb-4">
                                            {isVoiceScanning 
                                                ? voiceScanText 
                                                : vocalBiometricState === 'auth_success'
                                                    ? `IDENTITY SIGNATURE VERIFIED: ${biometricScore}% score`
                                                    : vocalBiometricState === 'enroll_success'
                                                        ? 'Cryptographic vocal pattern sealed to secure device memory.'
                                                        : vocalPrintTemplate
                                                            ? 'Authenticate your sound corridor link using your unique vocal print. Read aloud any text on screen.'
                                                            : 'Please enroll your physical acoustic signature to secure direct satellite sound routes.'}
                                        </p>

                                        {/* Status messages / Scan text */}
                                        {!isVoiceScanning && vocalBiometricState === 'idle' && (
                                            <div className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-left font-mono text-[10px] text-[#0F172A] leading-normal max-h-24 overflow-y-auto mb-4 dark:bg-slate-900">
                                                <div className="text-emerald-400 font-bold mb-1 uppercase tracking-wide">Suggested passphrase:</div>
                                                "My sovereign assets are protected under absolute cryptographic lock. Confirm satellite voice interlock."
                                            </div>
                                        )}
                                    </div>

                                    <div className="w-full flex flex-col gap-2 shrink-0 border-t border-slate-200 pt-3">
                                        {isVoiceScanning ? (
                                            <div className="text-[10px] text-emerald-400 font-mono animate-pulse tracking-wider">
                                                SENSING ACOUSTIC TIMBRE MATRIX...
                                            </div>
                                        ) : (
                                            <>
                                                {vocalPrintTemplate ? (
                                                    <div className="flex gap-2 w-full">
                                                        <button 
                                                            onClick={handleResetVocalPrint}
                                                            className="bg-slate-50 hover:bg-slate-850 border border-slate-200 text-[#0F172A] hover:text-white p-2.5 rounded-xl text-xs font-mono flex items-center gap-1 shrink-0 dark:bg-slate-900"
                                                            title="Reset template to re-enroll"
                                                        >
                                                            <RefreshCwIcon className="w-3.5 h-3.5" />
                                                            Reset Key
                                                        </button>
                                                        <button 
                                                            onClick={() => startVocalBiometricCapture(false)}
                                                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-2.5 rounded-xl text-xs font-mono uppercase tracking-wider shadow-lg shadow-emerald-950/55"
                                                        >
                                                            START VOCAL VERIFICATION
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => startVocalBiometricCapture(true)}
                                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded-xl text-xs font-mono uppercase tracking-wider"
                                                    >
                                                        REGISTER VOCAL FINGERPRINT
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Outgoing Dialing Overlay View */}
                        <AnimatePresence>
                            {callState === 'dialing' && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-slate-50 dark:bg-slate-800  flex flex-col items-center justify-center p-6 text-center z-50 overflow-hidden"
                                >
                                    <div className="relative mb-6">
                                        <motion.div 
                                            animate={{ scale: [1, 1.4, 1] }}
                                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                            className="absolute -inset-4 rounded-full bg-emerald-500"
                                        />
                                        <motion.div 
                                            animate={{ scale: [1, 1.25, 1] }}
                                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                            className="absolute -inset-1.5 rounded-full bg-emerald-500"
                                        />
                                        <div className="w-16 h-16 rounded-full bg-emerald-500 border-2 border-emerald-400/50 flex items-center justify-center relative">
                                            <PhoneIcon className="w-7 h-7 text-emerald-400 animate-pulse" />
                                        </div>
                                    </div>
                                    <h4 className="text-sm font-black text-emerald-400 uppercase tracking-[0.2em] mb-1 font-mono">Dialing Secure Desk...</h4>
                                    <h5 className="text-[10px] text-[#0F172A] mb-6 font-mono max-w-xs truncate leading-normal">Relaying via {selectedSatellite}</h5>
                                    
                                    <button 
                                        onClick={() => handleEndCall(true)}
                                        className="bg-red-650 hover:bg-red-500 text-white font-black uppercase text-xs tracking-wider p-3 px-8 rounded-xl shadow-xl transition-all font-mono"
                                    >
                                        Cancel Request
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Call Incoming Overlay View */}
                        <AnimatePresence>
                            {callState === 'incoming' && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-slate-50 dark:bg-slate-800  flex flex-col items-center justify-center p-6 text-center z-50 overflow-hidden"
                                >
                                    <div className="relative mb-6">
                                        <motion.div 
                                            animate={{ scale: [1, 1.4, 1] }}
                                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                            className="absolute -inset-4 rounded-full bg-cyan-500"
                                        />
                                        <motion.div 
                                            animate={{ scale: [1, 1.25, 1] }}
                                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                            className="absolute -inset-1.5 rounded-full bg-cyan-500"
                                        />
                                        <div className="w-16 h-16 rounded-full bg-cyan-500 border-2 border-cyan-400/50 flex items-center justify-center relative">
                                            <PhoneIcon className="w-7 h-7 text-cyan-400" />
                                        </div>
                                    </div>
                                    <h4 className="text-sm font-black text-cyan-400 uppercase tracking-[0.2em] mb-1 font-mono">Secure Connection Request</h4>
                                    <h5 className="text-base font-bold text-white mb-2 font-sans">First Pacific Bank Admin</h5>
                                    <p className="text-xs text-[#0F172A] max-w-xs mb-6 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-850 font-mono dark:bg-slate-900">
                                        A premium wealth adviser wishes to connect over an end-to-end encrypted satellite audio sound corridor.
                                    </p>
                                    
                                    <div className="flex gap-3 w-full max-w-xs">
                                        <button 
                                            onClick={handleRejectCall}
                                            className="flex-1 bg-red-950 text-red-400 border border-red-500/30 font-semibold p-3.5 rounded-xl text-xs hover:bg-red-900 hover:text-white transition-all uppercase tracking-wider font-mono"
                                        >
                                            Decline
                                        </button>
                                        <button 
                                            onClick={handleAcceptCall}
                                            className="flex-1 bg-cyan-600 font-bold p-3.5 rounded-xl text-xs text-white hover:bg-cyan-500 shadow-xl shadow-cyan-900/20 transition-all uppercase tracking-wider font-mono"
                                        >
                                            Accept Link
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Connected Audio Session Panel */}
                        <AnimatePresence>
                            {callState === 'connected' && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute inset-0 bg-slate-50 dark:bg-slate-800  flex flex-col items-center p-4 text-center z-50 gap-2 overflow-y-auto custom-scrollbar"
                                >
                                    <div className="flex items-center gap-2 mb-1 shrink-0">
                                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
                                        <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">Sovereign sound corridor • 512kbps</span>
                                    </div>
                                    
                                    {/* Responsive Wavebar Canvas */}
                                    <div className="w-full h-16 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-850 overflow-hidden relative flex items-center justify-center shrink-0">
                                        <canvas ref={clientCanvasRef} width={360} height={64} className="w-full h-full opacity-90" />
                                        <div className="absolute top-1 left-2 text-[8px] font-mono font-bold text-[#0F172A] uppercase tracking-widest">
                                            Telemetry Wave: {scramblerType}
                                        </div>
                                    </div>

                                    {/* Video Conferencing Modules */}
                                    {isVideoActive && (
                                        <div className="w-full grid grid-cols-2 gap-2 my-2 shrink-0">
                                            {/* Remote Video feed */}
                                            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner flex items-center justify-center">
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
                                                        <span>WAITING FOR AGENT...</span>
                                                    </div>
                                                )}
                                                <div className="absolute top-1.5 left-1.5 bg-slate-100 p-1 px-2 rounded-lg text-[8px] font-mono font-bold uppercase text-cyan-400">
                                                    Agent KYC
                                                </div>
                                            </div>

                                            {/* Local Video feed */}
                                            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-850 flex items-center justify-center">
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
                                                    Client Feed
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Advanced Bank-Grade Telemetry HUD */}
                                    <div className="w-full grid grid-cols-2 gap-2 text-left my-1 shrink-0">
                                        {/* Satellite Relay Selector */}
                                        <div className="bg-slate-50 border border-slate-850 p-2 rounded-xl flex flex-col justify-between min-w-0 dark:bg-slate-900">
                                            <div className="flex items-center gap-1 text-[8px] font-mono font-bold text-[#0F172A] uppercase tracking-wider">
                                                <GlobeIcon className="w-3 h-3 text-cyan-400" />
                                                <span>Satellite Pipeline</span>
                                            </div>
                                            <select 
                                                value={selectedSatellite}
                                                onChange={(e) => setSelectedSatellite(e.target.value)}
                                                className="bg-transparent text-[10px] text-white font-mono font-bold outline-none cursor-pointer border-none p-0 mt-1 max-w-full"
                                            >
                                                <option value="Atlantic-IV Starlink Relay" className="bg-[#0c1322]">Atlantic Starlink V4</option>
                                                <option value="Pacific-Prime Deep Orbit" className="bg-[#0c1322]">Pacific-Prime Relay</option>
                                                <option value="Milsat Direct Secure" className="bg-[#0c1322]">Milsat E2E Bypass</option>
                                                <option value="Sovereign Core Earth Station" className="bg-[#0c1322]">Sovereign Direct Earth</option>
                                            </select>
                                        </div>

                                        {/* Crypt Scrambler Mode Selector */}
                                        <div className="bg-slate-50 border border-slate-850 p-2 rounded-xl flex flex-col justify-between min-w-0 dark:bg-slate-900">
                                            <div className="flex items-center gap-1 text-[8px] font-mono font-bold text-[#0F172A] uppercase tracking-wider">
                                                <CpuIcon className="w-3 h-3 text-emerald-400" />
                                                <span>Scramble Protocol</span>
                                            </div>
                                            <select 
                                                value={scramblerType}
                                                onChange={(e) => {
                                                    setScramblerType(e.target.value as any);
                                                    setIsScramblerActive(true);
                                                }}
                                                className="bg-transparent text-[10px] text-emerald-400 font-mono font-bold outline-none cursor-pointer border-none p-0 mt-1 max-w-full"
                                            >
                                                <option value="AES-256-GCM" className="bg-[#0c1322]">AES-256-GCM SSL</option>
                                                <option value="CHACHA20-POLY" className="bg-[#0c1322]">ChaCha20-Poly1305</option>
                                                <option value="QUANTUM-STATIC" className="bg-[#0c1322]">Quantum static ring</option>
                                                <option value="ANALOG-FUZZ" className="bg-[#0c1322]">Analog scrambler</option>
                                            </select>
                                        </div>

                                        {/* Live Fluctuation Analytics Panel */}
                                        <div className="bg-slate-50 border border-slate-850 p-2 rounded-xl col-span-2 dark:bg-slate-900">
                                            <div className="flex justify-between items-center text-[8px] font-mono font-black text-[#0F172A] uppercase tracking-wider mb-1.5">
                                                <div className="flex items-center gap-1">
                                                    <ActivityIcon className="w-3 h-3 text-cyan-400 animate-pulse" />
                                                    <span>Signal Integrity Diagnostic</span>
                                                </div>
                                                <span className="text-emerald-400">99.98% OK</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-1 font-mono text-[9px] text-center">
                                                <div className="bg-slate-100 p-1 rounded border border-slate-900">
                                                    <span className="text-[#0F172A] block">LATENCY</span>
                                                    <span className="text-white font-bold">{telemetry.latency}ms</span>
                                                </div>
                                                <div className="bg-slate-100 p-1 rounded border border-slate-900">
                                                    <span className="text-[#0F172A] block">JITTER</span>
                                                    <span className="text-cyan-400 font-bold">{telemetry.jitter}ms</span>
                                                </div>
                                                <div className="bg-slate-100 p-1 rounded border border-slate-900">
                                                    <span className="text-[#0F172A] block">BITRATE</span>
                                                    <span className="text-emerald-400 font-bold">{telemetry.bitrate}k</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Cryptographic Biometric Interlock */}
                                        <div className="col-span-2 text-center">
                                            {keyVerificationState === 'unverified' ? (
                                                <button 
                                                    onClick={() => {
                                                        setKeyVerificationState('verifying');
                                                        setTimeout(() => {
                                                            setKeyVerificationState('verified');
                                                        }, 2500);
                                                    }}
                                                    className="w-full bg-amber-500 hover:bg-amber-500 border border-amber-500/30 text-amber-400 font-mono font-black uppercase text-[10px] py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer animate-pulse"
                                                >
                                                    <ShieldCheckIcon className="w-4 h-4" />
                                                    <span>Lock Biometric Sovereign Key</span>
                                                </button>
                                            ) : keyVerificationState === 'verifying' ? (
                                                <div className="w-full bg-slate-50 border border-slate-200 text-[#0F172A] font-mono text-[10px] py-2 rounded-xl flex items-center justify-center gap-2 dark:bg-slate-900">
                                                    <LoaderIcon className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                                                    <span>Aligning cryptographic signatures...</span>
                                                </div>
                                            ) : (
                                                <div className="w-full bg-emerald-500 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] py-2 rounded-xl flex items-center justify-center gap-1.5 font-bold">
                                                    <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
                                                    <span>Verified Sovereign Key Locked</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Row */}
                                    <div className="flex gap-2.5 items-center mt-2 text-slate-350 shrink-0 w-full justify-center">
                                        <button 
                                            onClick={() => {
                                                if (localStreamRef.current) {
                                                    const track = localStreamRef.current.getAudioTracks()[0];
                                                    if (track) track.enabled = !track.enabled;
                                                }
                                                setIsMuted(!isMuted);
                                            }}
                                            className={`p-3 rounded-2xl border transition-all ${isMuted ? 'bg-red-500 border-red-500/30 text-red-400' : 'bg-slate-50 border-slate-200 text-[#0F172A] hover:text-white hover:bg-white'}`}
                                            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                                        >
                                            {isMuted ? <MicOffIcon className="w-4 h-4 animate-pulse" /> : <MicIcon className="w-4 h-4" />}
                                        </button>
                                        
                                        <button 
                                            onClick={handleToggleVideo}
                                            className={`p-3 rounded-2xl border transition-all ${isVideoActive ? 'bg-cyan-550 border-cyan-500/35 text-cyan-400' : 'bg-slate-50 border-slate-200 text-[#0F172A] hover:text-white hover:bg-white'}`}
                                            title={isVideoActive ? "Turn Off Camera" : "Turn On Camera for KYC Session"}
                                        >
                                            {isVideoActive ? <VideoIcon className="w-4 h-4 text-cyan-400 animate-pulse" /> : <VideoOffIcon className="w-4 h-4" />}
                                        </button>

                                        <button 
                                            onClick={triggerVoiceBriefing}
                                            disabled={directBriefingPlaying}
                                            className={`p-3 rounded-2xl border transition-all ${directBriefingPlaying ? 'bg-emerald-500 border-emerald-500/30 text-emerald-400 animate-bounce' : 'bg-slate-50 border-slate-200 text-[#0F172A] hover:text-white hover:bg-white'}`}
                                            title="Ask Portfolio AI Line Briefing"
                                        >
                                            <SparklesIcon className={`w-4 h-4 ${directBriefingPlaying ? 'text-emerald-400' : ''}`} />
                                        </button>

                                        <button 
                                            onClick={() => setIsOpen(false)}
                                            className="bg-slate-50 hover:bg-slate-850 text-cyan-400 hover:text-cyan-300 border border-slate-200 font-bold p-3 px-3.5 rounded-2xl text-[10px] transition-all uppercase tracking-wider font-mono flex items-center gap-1 dark:bg-slate-900"
                                            title="Dock Session to PiP mode"
                                        >
                                            <Minimize2Icon className="w-3.5 h-3.5" />
                                            <span>PiP</span>
                                        </button>

                                        <button 
                                            onClick={() => handleEndCall(true)}
                                            className="bg-red-650 hover:bg-red-500 text-white font-black uppercase text-[10px] tracking-wider p-3 px-4.5 rounded-2xl shadow-xl transition-all font-mono"
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {messages.length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-[#0F172A] dark:text-white gap-3 mt-12">
                                <MessageSquareIcon className="w-12 h-12 opacity-15" />
                                <p className="text-xs uppercase tracking-widest font-black text-center px-4 leading-normal font-sans text-[#0F172A]">
                                    Welcome to Sovereign Core Support. How may we assist your portfolio today?
                                </p>
                            </div>
                        )}
                        
                        {messages.map((msg, index) => {
                            const isMe = msg.senderId === 'user';
                            const isSeen = msg.read || msg.status === 'seen';
                            return (
                                <motion.div 
                                    key={msg.id || index} 
                                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.25, ease: "easeOut" }}
                                    className={`flex flex-col max-w-[85%] ${isMe ? 'self-end' : 'self-start'}`}
                                >
                                        {!isMe && (
                                            <div className="flex flex-col gap-1 w-full">
                                                <div className="flex items-center gap-1.5 ml-8 mt-1 shrink-0">
                                                    <span className="text-[10px] uppercase tracking-widest font-black text-[#0F172A]">
                                                        {msg.senderName || 'Bank Executive'}
                                                    </span>
                                                    {msg.senderId === 'ai_bot' && (
                                                        <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-purple-500 text-purple-400 border border-purple-500/20">
                                                            Sovereign AI
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-end gap-2 shrink-0">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mb-1 border ${
                                                        msg.senderId === 'ai_bot'
                                                            ? 'bg-purple-900 border-purple-500/30'
                                                            : 'bg-slate-200 dark:bg-slate-850 border-slate-300 dark:border-slate-700'
                                                    }`}>
                                                        <UserIcon className={`w-3.5 h-3.5 ${msg.senderId === 'ai_bot' ? 'text-purple-400' : 'text-[#0F172A]'}`} />
                                                    </div>
                                                    
                                                    <div className={`p-3 rounded-2xl text-sm shadow-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 text-[#0F172A] dark:text-white rounded-bl-sm leading-relaxed prose prose-slate dark:prose-invert max-w-none`}>
                                                        <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                                                        
                                                        {/* @ts-ignore */}
                                                        {msg.attachmentUrl && (
                                                            <div className="mt-2 rounded-lg overflow-hidden border border-slate-200/20 max-w-full">
                                                                {/* @ts-ignore */}
                                                                {msg.attachmentType?.startsWith('image/') || msg.attachmentName?.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                                                                    <img 
                                                                        /* @ts-ignore */
                                                                        src={msg.attachmentUrl} 
                                                                        /* @ts-ignore */
                                                                        alt={msg.attachmentName || "Attached asset"} 
                                                                        className="max-h-48 object-cover w-full cursor-pointer hover:opacity-90 transition-opacity"
                                                                        referrerPolicy="no-referrer"
                                                                        /* @ts-ignore */
                                                                        onClick={() => window.open(msg.attachmentUrl, '_blank')}
                                                                    />
                                                                ) : (
                                                                    <a 
                                                                        /* @ts-ignore */
                                                                        href={msg.attachmentUrl} 
                                                                        target="_blank" 
                                                                        rel="noreferrer" 
                                                                        className="flex items-center gap-2 p-2 bg-slate-100 hover:bg-slate-100 text-emerald-400 text-xs underline"
                                                                    >
                                                                        <PaperclipIcon className="w-4 h-4 shrink-0" />
                                                                        {/* @ts-ignore */}
                                                                        <span className="truncate max-w-[150px]">{msg.attachmentName || 'Download document'}</span>
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {isMe && (
                                            <div className={`p-3 rounded-2xl text-sm shadow-sm bg-emerald-600 text-white rounded-br-sm leading-relaxed prose prose-slate max-w-none [&_p]:text-white [&_strong]:text-white [&_em]:text-white`}>
                                                <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                                                
                                                {/* @ts-ignore */}
                                                {msg.attachmentUrl && (
                                                    <div className="mt-2 rounded-lg overflow-hidden border border-slate-200/20 max-w-full bg-emerald-750">
                                                        {/* @ts-ignore */}
                                                        {msg.attachmentType?.startsWith('image/') || msg.attachmentName?.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                                                            <img 
                                                                /* @ts-ignore */
                                                                src={msg.attachmentUrl} 
                                                                /* @ts-ignore */
                                                                alt={msg.attachmentName || "Attached asset"} 
                                                                className="max-h-48 object-cover w-full cursor-pointer hover:opacity-90 transition-opacity"
                                                                referrerPolicy="no-referrer"
                                                                /* @ts-ignore */
                                                                onClick={() => window.open(msg.attachmentUrl, '_blank')}
                                                            />
                                                        ) : (
                                                            <a 
                                                                /* @ts-ignore */
                                                                href={msg.attachmentUrl} 
                                                                target="_blank" 
                                                                rel="noreferrer" 
                                                                className="flex items-center gap-2 p-2 bg-white hover:bg-white text-white text-xs underline dark:bg-slate-800"
                                                            >
                                                                <PaperclipIcon className="w-4 h-4 shrink-0" />
                                                                {/* @ts-ignore */}
                                                                <span className="truncate max-w-[150px]">{msg.attachmentName || 'Download document'}</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    <span className={`text-[9px] font-mono mt-1 flex items-center gap-1.5 ${isMe ? 'justify-end text-emerald-600/60 dark:text-emerald-400/50 mr-1.5' : 'ml-9 text-[#0F172A]'}`}>
                                        {formatSafeTime(msg.timestamp)}
                                        {isMe && (
                                            <span className="flex items-center gap-0.5">
                                                {msg.read || msg.status === 'read' || msg.status === 'seen' ? (
                                                    <>
                                                        <CheckCheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                                                        <span className="text-[8px] font-bold text-emerald-400 uppercase">Read</span>
                                                    </>
                                                ) : msg.status === 'delivered' ? (
                                                    <>
                                                        <CheckCheckIcon className="w-3.5 h-3.5 text-[#0F172A] dark:text-white" />
                                                        <span className="text-[8px] font-bold text-[#0F172A] dark:text-white uppercase">Delivered</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckIcon className="w-3.5 h-3.5 text-[#0F172A] dark:text-white" />
                                                        <span className="text-[8px] font-bold text-[#0F172A] dark:text-white uppercase">Sent</span>
                                                    </>
                                                )}
                                            </span>
                                        )}
                                    </span>
                                </motion.div>
                            );
                        })}

                        {peerChatStatus?.status === 'typing' && (
                            <div className="flex justify-start gap-2.5 mb-2 px-1 animate-pulse">
                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-850 flex items-center justify-center border border-slate-300 dark:border-slate-700">
                                    <UserIcon className="w-3.5 h-3.5 text-[#0F172A]" />
                                </div>
                                <div className="p-3 rounded-2xl text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#0F172A] rounded-bl-sm flex items-center gap-1.5">
                                    <span>Executive is typing</span>
                                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></span>
                                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-1 shrink-0" />
                    </div>

                    {/* Input Area / Post-Chat Rating System */}
                    {sessionStatus === 'resolved' && !sessionRating ? (
                        <div className="p-4 bg-emerald-950 dark:bg-emerald-950 border-t border-emerald-500/20 shrink-0 flex flex-col gap-3 text-center">
                            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest">Support Line Resolved</h4>
                            <p className="text-[11px] text-[#0F172A] dark:text-white leading-relaxed font-sans">
                                This secure support session has been resolved. Please rate your experience to help us maintain elite SLA quality.
                            </p>
                            
                            {/* Stars */}
                            <div className="flex justify-center gap-2 my-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setSelectedStars(star)}
                                        className="transition-transform active:scale-90 hover:scale-110 cursor-pointer"
                                    >
                                        <svg 
                                            className={`w-8 h-8 ${star <= selectedStars ? 'text-amber-400 fill-amber-400' : 'text-[#0F172A] dark:text-white'}`} 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="2" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"
                                        >
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                            
                            {/* Comments input */}
                            <input
                                type="text"
                                placeholder="Additional feedback (optional)..."
                                value={feedbackComment}
                                onChange={(e) => setFeedbackComment(e.target.value)}
                                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0c1220] text-[#0F172A] dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                            />
                            
                            {/* Submit Rating Button */}
                            <button
                                type="button"
                                onClick={handleSubmitRating}
                                disabled={selectedStars === 0}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-mono uppercase text-xs font-black py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
                            >
                                Submit Private Feedback
                            </button>
                        </div>
                    ) : sessionRating ? (
                        <div className="p-4 bg-emerald-950 border-t border-emerald-500/10 shrink-0 text-center flex flex-col items-center justify-center gap-1">
                            <span className="inline-flex items-center gap-1 bg-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest">
                                FEEDBACK SUBMITTED • {sessionRating} STARS
                            </span>
                            <span className="text-[9px] text-[#0F172A] font-sans mt-0.5">Thank you for helping us maintain secure desk operations.</span>
                        </div>
                    ) : (
                        <div className="p-3 bg-white dark:bg-[#070b12] border-t border-slate-100 dark:border-slate-700 mr-0 shrink-0 flex flex-col gap-2">
                            {/* Error Warning Bar */}
                            {fileError && (
                                <div className="text-[10px] text-red-500 bg-red-500 p-1.5 px-3 rounded-lg border border-red-500/20 font-bold">
                                    {fileError}
                                </div>
                            )}

                            {/* File Attachment Preview Bar */}
                            {attachment && (
                                <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-[#0F172A] dark:text-white">
                                    <div className="flex items-center gap-2 truncate max-w-[80%]">
                                        {attachment.type.startsWith('image/') ? (
                                            <ImageIcon className="w-4 h-4 text-emerald-500" />
                                        ) : (
                                            <FileIcon className="w-4 h-4 text-emerald-500" />
                                        )}
                                        <span className="truncate font-bold">{attachment.name}</span>
                                    </div>
                                    <button 
                                        onClick={() => setAttachment(null)}
                                        className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white text-[#0F172A] hover:text-red-500 transition-colors dark:bg-slate-800"
                                        title="Cancel Attachment"
                                    >
                                        <XIcon className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}

                            <div className="flex items-end gap-2">
                                {/* Hidden File Input */}
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*,application/pdf,.doc,.docx"
                                    onChange={handleFileChange}
                                />

                                {/* Attach File Button */}
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingFile}
                                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-white p-3 rounded-xl transition-all border border-slate-250 dark:border-slate-700 text-[#0F172A] dark:text-white flex items-center justify-center disabled:opacity-70 h-[44px]"
                                    title="Attach Document or Image"
                                >
                                    {uploadingFile ? (
                                        <LoaderIcon className="w-5 h-5 animate-spin text-emerald-500" />
                                    ) : (
                                        <PaperclipIcon className="w-5 h-5" />
                                    )}
                                </button>

                                {/* Camera Capture Button */}
                                <button 
                                    onClick={() => {
                                        fileInputRef.current?.setAttribute('capture', 'environment');
                                        fileInputRef.current?.click();
                                    }}
                                    disabled={uploadingFile}
                                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-white p-3 rounded-xl transition-all border border-slate-250 dark:border-slate-700 text-[#0F172A] dark:text-white flex items-center justify-center disabled:opacity-70 h-[44px]"
                                    title="Use Camera"
                                >
                                    <CameraIcon className="w-5 h-5" />
                                </button>

                                {/* ReactQuill Input Wrap */}
                                <div 
                                    className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-sm quill-chat-input-wrapper max-h-[120px] overflow-y-auto"
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
                                        placeholder="Message secure line..."
                                        className="w-full bg-transparent text-[#0F172A] dark:text-white placeholder:text-[#0F172A] p-3 outline-none resize-none min-h-[44px]"
                                        rows={1}
                                    />
                                </div>

                                {/* Send Message Button */}
                                <button 
                                    onClick={handleSend}
                                    disabled={uploadingFile || (!inputValue.trim() && !attachment)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-xl transition-all disabled:opacity-40 h-[44px] flex items-center justify-center shrink-0"
                                >
                                    <SendIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
        </>
    );
};
