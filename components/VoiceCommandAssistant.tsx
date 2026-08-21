import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Mic, MicOff, X, Sparkles, Volume2, VolumeX, Play, 
    ArrowRight, History, Command, HelpCircle, Check, Loader2 
} from 'lucide-react';

interface VoiceCommandAssistantProps {
    userProfile?: any;
    onOpenSendMoneyFlow?: (tab?: 'send' | 'split' | 'deposit') => void;
    onOpenContactSupport?: () => void;
    accounts?: any[];
    notifications?: any[];
}

export const VoiceCommandAssistant: React.FC<VoiceCommandAssistantProps> = ({
    userProfile,
    onOpenSendMoneyFlow,
    onOpenContactSupport,
    accounts = [],
    notifications = []
}) => {
    const navigate = useNavigate();
    
    // States
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isTtsEnabled, setIsTtsEnabled] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [manualText, setManualText] = useState('');
    const [showHelp, setShowHelp] = useState(false);
    
    // History log of commands
    const [history, setHistory] = useState<Array<{
        text: string;
        intent: string;
        spokenResponse: string;
        timestamp: Date;
    }>>([]);

    // Speech recognition object reference
    const recognitionRef = useRef<any>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // Active Voice Session Floating Visualizer references
    const floatingCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameIdRef = useRef<number | null>(null);
    const phaseRef = useRef<number>(0);

    const assistantAudioCtxRef = useRef<AudioContext | null>(null);
    const assistantAnalyserRef = useRef<AnalyserNode | null>(null);
    const assistantStreamRef = useRef<MediaStream | null>(null);

    // Audio confirmation chimes via Web Audio API 
    const playChime = React.useCallback((type: 'start' | 'success' | 'error') => {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            if (type === 'start') {
                osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
                osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12); // G5
                gain.gain.setValueAtTime(0.06, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
            } else if (type === 'success') {
                osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
                osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
                osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.16); // A5
                gain.gain.setValueAtTime(0.06, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
                osc.start();
                osc.stop(ctx.currentTime + 0.35);
            } else if (type === 'error') {
                osc.frequency.setValueAtTime(220.00, ctx.currentTime); // A3
                osc.frequency.linearRampToValueAtTime(146.83, ctx.currentTime + 0.22); // D3
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
                osc.start();
                osc.stop(ctx.currentTime + 0.25);
            }
        } catch (e) {
            console.warn("[Vocal Chime] AudioContext failed:", e);
        }
    }, []);

    // Speak text via browser Text-To-Speech Synthesis
    const speakText = React.useCallback((text: string) => {
        if (!isTtsEnabled) return;
        try {
            window.speechSynthesis.cancel(); // Stop playing any current feedback
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = window.speechSynthesis.getVoices();
            // Look for luxury sounding voices
            const premiumVoice = voices.find(v => 
                v.name.includes("Google US English") || 
                v.name.includes("Samantha") || 
                v.name.includes("Daniel") ||
                v.lang === "en-US"
            );
            if (premiumVoice) {
                utterance.voice = premiumVoice;
            }
            utterance.rate = 1.0;
            utterance.pitch = 1.05;
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.warn("[TTS] Synthesis failed:", e);
        }
    }, [isTtsEnabled]);

    // Handle incoming actions
    const handleParsedAction = React.useCallback((action: {
        intent: string;
        entities?: {
            recipient?: string;
            amount?: number;
            destination?: string;
            currency?: string;
        };
        spokenResponse: string;
        navigationPath?: string;
    }, userUtterance: string) => {
        playChime('success');
        speakText(action.spokenResponse);

        // Add to assistant log
        setHistory(prev => [
            {
                text: userUtterance,
                intent: action.intent,
                spokenResponse: action.spokenResponse,
                timestamp: new Date()
            },
            ...prev
        ].slice(0, 10)); // Keep last 10 entries

        // Execute navigation path if registered
        if (action.navigationPath && action.navigationPath !== '/') {
            setTimeout(() => {
                navigate(action.navigationPath!);
            }, 500);
        }

        // Execute transaction automation trigger if intent is send_money
        if (action.intent === 'send_money') {
            const recipient = action.entities?.recipient || 'John';
            const amount = action.entities?.amount || 100;
            
            // Set global coordinate variables for SendMoneyFlow to pick up
            (window as any).voicePreselectedAmount = amount;
            
            // Dispatches custom event to notify parent App state to open transfer wizard
            window.dispatchEvent(new CustomEvent('TRIGGER_VOICE_SEND_MONEY', {
                detail: { recipient, amount }
            }));

            // Fallback: Trigger default onOpenSendMoneyFlow prop if available
            if (onOpenSendMoneyFlow) {
                setTimeout(() => {
                    onOpenSendMoneyFlow('send');
                }, 600);
            }
        }

        // Execute contact support trigger if intent is support or help_me
        if (action.intent === 'support' || action.intent === 'help_me') {
            // Dispatches custom event to notify parent App state to open support ticket dialog
            window.dispatchEvent(new CustomEvent('TRIGGER_VOICE_SUPPORT'));

            // Fallback: Trigger onOpenContactSupport prop if available
            if (onOpenContactSupport) {
                setTimeout(() => {
                    onOpenContactSupport();
                }, 600);
            }
        }
        
        // Execute card lock toggle
        if (action.intent === 'toggle_card_lock') {
            window.dispatchEvent(new CustomEvent('TRIGGER_VOICE_TOGGLE_CARD'));
        }
    }, [navigate, onOpenSendMoneyFlow, onOpenContactSupport, playChime, speakText]);

    // Query our server-side API Route with the transcription
    const processCommandWithAI = React.useCallback(async (commandText: string) => {
        if (!commandText.trim()) return;

        // Perform instant shortcut intercept for "Help me" / physical/vocal quick help trigger
        const normalized = commandText.toLowerCase().trim();
        if (normalized === 'help me' || normalized.includes('help me')) {
            playChime('success');
            const spoken = "Opening our priority support concierge form to assist you immediately.";
            speakText(spoken);
            
            setHistory(prev => [
                {
                    text: commandText,
                    intent: 'help_me',
                    spokenResponse: spoken,
                    timestamp: new Date()
                },
                ...prev
            ].slice(0, 10));

            // Call support callback or dispatch event
            window.dispatchEvent(new CustomEvent('TRIGGER_VOICE_SUPPORT'));
            if (onOpenContactSupport) {
                setTimeout(() => {
                    onOpenContactSupport();
                }, 600);
            }

            setManualText('');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const response = await fetch('/api/voice-command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: commandText,
                    userContext: {
                        email: userProfile?.email || "info@lawrenceconsultantsorg.org",
                        accounts: accounts,
                        notifications: notifications
                    }
                })
            });

            if (!response.ok) {
                throw new Error("Clearance terminal rejected request.");
            }

            const data = await response.json();
            handleParsedAction(data, commandText);
        } catch (err: any) {
            console.error("[Voice Command Front] Processing failed:", err);
            setError("Connectivity alert: Falling back to local clearance module.");
            
            // Play error chime
            playChime('error');
        } finally {
            setIsProcessing(false);
            setManualText('');
        }
    }, [handleParsedAction, onOpenContactSupport, playChime, speakText, userProfile, accounts, notifications]);

    // Setup speech recognition
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech Recognition parameters blocked by hosting iFrame policies or browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
            setTranscript('');
            setInterimTranscript('');
            playChime('start');
        };

        recognition.onerror = (e: any) => {
            console.error("Speech Recognition Error:", e);
            if (e.error === 'not-allowed') {
                setError("Microphone permission denied. Check browser overlay settings.");
            } else {
                setError(`Voice recognition issue: ${e.error}`);
            }
            setIsListening(false);
            playChime('error');
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onresult = (e: any) => {
            let finalText = '';
            let interimText = '';

            for (let i = e.resultIndex; i < e.results.length; ++i) {
                if (e.results[i].isFinal) {
                    finalText += e.results[i][0].transcript;
                } else {
                    interimText += e.results[i][0].transcript;
                }
            }

            if (finalText) {
                setTranscript(prev => prev + finalText);
                setInterimTranscript('');
                // Execute command immediately upon detection
                processCommandWithAI(finalText);
            } else {
                setInterimTranscript(interimText);
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch(e) {}
            }
        };
    }, [playChime, processCommandWithAI]);

    // Active Voice Session visualizer capture setup
    const startVisualizerAudio = async () => {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
            if (!stream) return;
            
            assistantStreamRef.current = stream;
            const audioCtx = new AudioContextClass();
            assistantAudioCtxRef.current = audioCtx;
            
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            assistantAnalyserRef.current = analyser;
            
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
        } catch (e) {
            console.warn("[Voice Assistant Visualizer] standard mic stream capture failed:", e);
        }
    };

    const stopVisualizerAudio = () => {
        if (assistantStreamRef.current) {
            assistantStreamRef.current.getTracks().forEach(track => track.stop());
            assistantStreamRef.current = null;
        }
        if (assistantAudioCtxRef.current) {
            if (assistantAudioCtxRef.current.state !== 'closed') {
                assistantAudioCtxRef.current.close().catch(() => {});
            }
            assistantAudioCtxRef.current = null;
        }
        assistantAnalyserRef.current = null;
    };

    // Trigger visualizer mic stream listening
    useEffect(() => {
        if (isListening) {
            startVisualizerAudio();
        } else {
            stopVisualizerAudio();
        }
        return () => {
            stopVisualizerAudio();
        };
    }, [isListening]);

    // Draw real-time/synthetic physics waves on the floating canvas
    useEffect(() => {
        if (!isListening && !isProcessing) {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
                animationFrameIdRef.current = null;
            }
            return;
        }

        const drawWave = () => {
            const canvas = floatingCanvasRef.current;
            if (!canvas) {
                animationFrameIdRef.current = requestAnimationFrame(drawWave);
                return;
            }
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);

            // Fetch live voice data if active
            let rawVolume = 0;
            if (assistantAnalyserRef.current) {
                const dataArray = new Uint8Array(assistantAnalyserRef.current.frequencyBinCount);
                assistantAnalyserRef.current.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let j = 0; j < dataArray.length; j++) {
                    sum += dataArray[j];
                }
                rawVolume = sum / dataArray.length; // 0 to 255
            }

            // Map volume level to wave amplitude [0.5, 12.0]
            const baseAmp = isListening ? 3.5 : 1.5;
            const ampBoost = isListening ? (rawVolume / 80.0) * 12.0 : 0;
            const amplitude = Math.min(22.0, baseAmp + ampBoost);

            // Phase tracking for sideways movement
            phaseRef.current += 0.15;
            const phase = phaseRef.current;

            // Draw multi-layered glowing sine waves
            const drawSingleSine = (offsetPhase: number, color: string, thickness: number, opacity: number) => {
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = thickness;
                ctx.globalAlpha = opacity;

                for (let x = 0; x < width; x++) {
                    // Sine calculation styled symmetrically with a tailing window envelope
                    const envelope = Math.sin((x / width) * Math.PI); // 0 at edges, 1 at center
                    const freq = 0.12;
                    const y = (height / 2) + Math.sin(x * freq + phase + offsetPhase) * amplitude * envelope;
                    
                    if (x === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
            };

            // Layer 1: Ambient deep blue backwave
            drawSingleSine(0, '#06b6d4', 2.0, 0.4);
            // Layer 2: Main glowing cyan/emerald wave
            drawSingleSine(Math.PI * 0.45, '#34d399', 1.5, 0.75);
            // Layer 3: High frequency golden subtle noise wave
            drawSingleSine(Math.PI * 0.9, '#f59e0b', 1.0, 0.35);

            ctx.globalAlpha = 1.0;
            animationFrameIdRef.current = requestAnimationFrame(drawWave);
        };

        animationFrameIdRef.current = requestAnimationFrame(drawWave);

        return () => {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
                animationFrameIdRef.current = null;
            }
        };
    }, [isListening, isProcessing]);

    // Toggle Listening
    const toggleListening = () => {
        if (!recognitionRef.current) {
            setError("Web speech engine not available on this framework configuration.");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            try {
                recognitionRef.current.start();
            } catch(e) {
                console.error("Listening setup crash:", e);
            }
        }
    };

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Outside click dismiss
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                // Ensure we don't dismiss if clicking some portal elements
                const isClickInsideTrigger = (e.target as HTMLElement).closest('.voice-trigger');
                if (!isClickInsideTrigger) {
                    setIsOpen(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const exampleCommands = [
        "help me",
        "check my balance",
        "send 250 to John",
        "navigate to loans division",
        "locate closest branch or ATM",
        "show security settings",
        "ask portfolio advisor",
        "contact customer support"
    ];

    return (
        <>
            {/* Global Floating Trigger Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className={`voice-trigger fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-2xl border transition-all cursor-pointer ${
                    isOpen 
                        ? 'bg-amber-500 border-amber-600 text-slate-950' 
                        : 'bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] border-emerald-500/20 text-emerald-400 hover:text-emerald-300'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Sovereign AI Voice Assistant"
            >
                {isOpen ? (
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                    <div className="relative flex items-center justify-center w-full h-full">
                        {/* Outer pulsing ring for premium looks */}
                        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60 pointer-events-none" />
                        <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                )}
            </motion.button>

            {/* Main Premium Assistant UI Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={panelRef}
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 w-full max-w-[370px] sm:max-w-[420px] bg-[#090d16]/98  rounded-2xl border border-slate-200 dark:border-white/15 dark:border-emerald-500/25 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.8)] z-[49] overflow-hidden"
                    >
                        {/* Top Accent Security Indicator */}
                        <div className="bg-[#05080f] px-4 py-2 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Command className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="font-mono text-[8.5px] font-black uppercase text-[#0F172A] tracking-[0.2em]">VOICE CONSOLE // ENABLED</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-mono text-[8px] text-emerald-400 font-bold bg-emerald-950 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                TLS 1.3 SECURE
                            </div>
                        </div>

                        <div className="p-5">
                            {/* Inner Header with Title and Volume configuration */}
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-sans font-black text-xs text-white tracking-widest uppercase">First Pacific Voice</h3>
                                    <p className="text-[10px] text-[#0F172A] mt-1">Global Investment Portfolio Controller</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                                        className={`p-1.5 rounded-lg border transition-all ${
                                            isTtsEnabled 
                                                ? 'bg-emerald-950 border-emerald-500/30 text-emerald-400' 
                                                : 'bg-slate-50 border-slate-200 dark:border-white/10 text-[#0F172A]'
                                        }`}
                                        title={isTtsEnabled ? "Mute spoken feedback" : "Unmute spoken feedback"}
                                    >
                                        {isTtsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                    </button>
                                    <button 
                                        onClick={() => setShowHelp(!showHelp)}
                                        className={`p-1.5 rounded-lg border transition-all ${
                                            showHelp 
                                                ? 'bg-amber-950 border-amber-500/30 text-amber-400' 
                                                : 'bg-slate-50 border-slate-200 dark:border-white/10 text-[#0F172A]'
                                        }`}
                                        title="View vocal directory"
                                    >
                                        <HelpCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Help Directory View */}
                            <AnimatePresence>
                                {showHelp && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mb-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-[11px] text-[#0F172A] leading-relaxed overflow-hidden"
                                    >
                                        <div className="font-bold text-white mb-1.5 flex items-center gap-1">
                                            <Sparkles className="w-3 h-3 text-amber-400" />
                                            Active Vocal Protocol Guide
                                        </div>
                                        <p className="mb-2">Click the microphone below or use manual clearance inputs to speak commands. Recognized operations include:</p>
                                        <ul className="space-y-1 font-mono text-[9.5px]">
                                            <li className="flex items-center gap-1.5 text-[#0F172A]"><span className="text-emerald-400">●</span> "Send 100 to Sophia"</li>
                                            <li className="flex items-center gap-1.5 text-[#0F172A]"><span className="text-emerald-400">●</span> "Check checking balance"</li>
                                            <li className="flex items-center gap-1.5 text-[#0F172A]"><span className="text-emerald-400">●</span> "Navigate to active loans"</li>
                                            <li className="flex items-center gap-1.5 text-[#0F172A]"><span className="text-emerald-400">●</span> "Locate closest ATM branch"</li>
                                        </ul>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Main Interactive Listening Stage */}
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10 p-5 mb-4 flex flex-col items-center justify-center relative min-h-[160px]">
                                {isListening ? (
                                    <>
                                        {/* Animated Wave Bars */}
                                        <div className="flex items-end justify-center gap-1.5 h-12 mb-4">
                                            {[...Array(6)].map((_, i) => (
                                                <motion.div 
                                                    key={i}
                                                    animate={{ 
                                                        height: [12, Math.floor(Math.random() * 32) + 16, 12] 
                                                    }}
                                                    transition={{ 
                                                        duration: 0.4 + i * 0.08, 
                                                        repeat: Infinity,
                                                        ease: "easeInOut"
                                                    }}
                                                    className="w-1.5 bg-gradient-to-t from-emerald-500 to-amber-400 rounded-full"
                                                />
                                            ))}
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase animate-pulse mb-2">● LISTENING FOR CLEARANCE</p>
                                            <p className="text-xs text-white max-w-[260px] leading-relaxed italic">
                                                {interimTranscript || transcript || 'Speak now...'}
                                            </p>
                                        </div>
                                    </>
                                ) : isProcessing ? (
                                    <div className="text-center py-6">
                                        <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
                                        <p className="text-[10px] text-amber-400 font-mono tracking-widest uppercase">Decryption Ledger Active</p>
                                        <p className="text-xs text-[#0F172A] max-w-[220px] mx-auto mt-1">Resolving natural language intent queries...</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 flex flex-col items-center">
                                        <motion.button
                                            onClick={toggleListening}
                                            whileHover={{ scale: 1.05 }}
                                            className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500/10 to-[#1e3a8a]/20 border border-emerald-500/20 hover:border-emerald-400 flex items-center justify-center cursor-pointer mb-3 relative group"
                                        >
                                            <div className="absolute inset-0 rounded-full bg-emerald-500 group-hover:scale-110 transition-transform duration-300 pointer-events-none" />
                                            <Mic className="w-6 h-6 text-emerald-400 group-hover:text-emerald-300" />
                                        </motion.button>
                                        <p className="text-xs text-slate-100 font-bold mb-1">Click to trigger vocal dispatch</p>
                                        <p className="text-[10px] text-[#0F172A]">Access safe sovereign micro-routing instantly</p>
                                    </div>
                                )}

                                {/* Error Output */}
                                {error && (
                                    <div className="absolute bottom-2 left-2 right-2 bg-red-950 border border-red-500/20 px-3 py-1.5 rounded-lg text-[9px] text-red-400 text-center uppercase tracking-wider">
                                        {error}
                                    </div>
                                )}
                            </div>

                            {/* Manual Text Command Input Option */}
                            <div className="relative mb-4">
                                <input
                                    type="text"
                                    placeholder="Type banking command instead..."
                                    value={manualText}
                                    onChange={(e) => setManualText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            processCommandWithAI(manualText);
                                        }
                                    }}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 focus:border-emerald-500-20 rounded-lg py-2.5 pl-4 pr-10 text-[11px] text-slate-100 placeholder:text-[#0F172A] outline-none font-mono"
                                />
                                <button 
                                    onClick={() => processCommandWithAI(manualText)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white rounded-md text-emerald-400 cursor-pointer dark:bg-slate-800"
                                    disabled={!manualText.trim()}
                                >
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Quick Tap Examples */}
                            <div className="mb-4">
                                <p className="text-[9.5px] text-[#0F172A] font-bold uppercase tracking-wider mb-2">Command Shortcuts</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {exampleCommands.slice(0, 4).map((cmd, i) => (
                                        <button
                                            key={i}
                                            onClick={() => processCommandWithAI(cmd)}
                                            className="px-2.5 py-1 bg-[#0c1322] hover:bg-[#14203a] border border-white/[0.04] text-[9.5px] text-[#0F172A] rounded-full transition-all cursor-pointer whitespace-nowrap hover:scale-[1.02]"
                                        >
                                            {cmd}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* History Log */}
                            {history.length > 0 && (
                                <div className="border-t border-slate-200 dark:border-white/10 pt-3.5">
                                    <div className="flex items-center gap-1.5 text-[9.5px] text-[#0F172A] font-bold uppercase tracking-wider mb-2.5">
                                        <History className="w-3 h-3 text-emerald-500" />
                                        Activity ledger
                                    </div>
                                    <div className="space-y-2 max-h-[110px] overflow-y-auto custom-scrollbar">
                                        {history.map((item, i) => (
                                            <div key={i} className="bg-slate-50 dark:bg-slate-800 border border-white/[0.02] p-2 rounded-lg text-[10.5px]">
                                                <div className="flex items-center justify-between text-[9px] text-[#0F172A] font-mono mb-1">
                                                    <span>DISPATCHED CLIENT_UTTERANCE</span>
                                                    <span>{item.timestamp.toLocaleTimeString()}</span>
                                                </div>
                                                <div className="text-[#1E293B] mt-0.5 italic">"{item.text}"</div>
                                                <div className="text-emerald-400 mt-1 flex items-start gap-1">
                                                    <Check className="w-3 h-3 shrink-0 mt-0.5" />
                                                    <span>{item.spokenResponse}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Active Voice Session Floating Visualizer */}
            <AnimatePresence>
                {(isListening || isProcessing) && (
                    <motion.div
                        initial={{ opacity: 0, y: -40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -45, scale: 0.95 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[460px] bg-slate-50 dark:bg-slate-800 border border-cyan-500/30  rounded-full px-5 py-2.5 flex items-center justify-between gap-3 shadow-[0_0_30px_rgba(6,182,212,0.3)] z-[9999]"
                    >
                        {/* Left Status Indicators */}
                        <div className="flex items-center gap-2.5 max-w-[50%] overflow-hidden">
                            <div className="relative flex items-center justify-center shrink-0">
                                <span className="absolute w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                            </div>
                            <div className="truncate text-left">
                                <p className="text-[8px] font-mono font-black text-cyan-400 tracking-wider uppercase leading-none">
                                    {isProcessing ? "TRANSCRIPTION DECRYPTING..." : "SECURE COGNITIVE VOICE LINE"}
                                </p>
                                <p className="text-[10px] text-white italic font-sans font-semibold mt-1 truncate leading-none">
                                    {interimTranscript || transcript || (isProcessing ? "Processing command..." : "Awaiting your voice...")}
                                </p>
                            </div>
                        </div>

                        {/* Centered Real-time Audio Wave Canvas */}
                        <div className="w-24 h-6 relative overflow-hidden bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-200 flex items-center justify-center shrink-0">
                            <canvas ref={floatingCanvasRef} width={96} height={24} className="opacity-95" />
                        </div>

                        {/* Right Quick Controllers */}
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={toggleListening}
                                className={`p-1.5 rounded-full border transition-all scale-95 ${
                                    isListening 
                                        ? 'bg-cyan-950 border-cyan-500/20 text-cyan-400 hover:text-cyan-300' 
                                        : 'bg-red-950 border-red-500/20 text-red-400'
                                }`}
                                title={isListening ? "Pause listening" : "Resume listening"}
                            >
                                {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                            </button>
                            <div className="w-[1px] h-3.5 bg-white dark:bg-slate-800" />
                            <button
                                onClick={() => {
                                    if (recognitionRef.current) {
                                        try { recognitionRef.current.abort(); } catch(e) {}
                                    }
                                    setIsListening(false);
                                    setIsProcessing(false);
                                }}
                                className="p-1.5 rounded-full bg-slate-50 hover:bg-red-950 border border-slate-200 text-[#0F172A] hover:text-red-400 transition-all scale-95 dark:bg-slate-900"
                                title="Terminate Secure Session"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
