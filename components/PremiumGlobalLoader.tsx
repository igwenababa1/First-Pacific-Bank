import React, { useState, useEffect, useRef } from 'react';
import { 
    Coins, Zap, Shield, Sparkles, RefreshCw, Volume2, VolumeX, Play, HelpCircle, 
    Layers, Cpu, Compass, Activity, CheckCircle, ChevronRight, Check
} from 'lucide-react';

interface PremiumGlobalLoaderProps {
    isVisible: boolean;
    onClose?: () => void;
    autoCloseDuration?: number; // fallback auto-close if triggered manually
    onlyCoins?: boolean; // new prop to automatically show only the coin engine
}

type CoinType = 'BTC' | 'USD' | 'ETH' | 'EUR';

interface Particle {
    id: number;
    x: number;
    y: number;
    angle: number;
    speed: number;
    color: string;
    size: number;
}

export const PremiumGlobalLoader: React.FC<PremiumGlobalLoaderProps> = ({
    isVisible,
    onClose,
    autoCloseDuration = 1200,
    onlyCoins = true
}) => {
    const [activeCoin, setActiveCoin] = useState<CoinType>('BTC');
    const [spinSpeed, setSpinSpeed] = useState<number>(3); // 1 = slow, 3 = balanced, 6 = hyper, 9 = quantum
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [isFlipped, setIsFlipped] = useState<boolean>(false);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [statusMessage, setStatusMessage] = useState<string>('Initializing Secure Enclave');
    const [progress, setProgress] = useState<number>(0);
    const [localVisible, setLocalVisible] = useState(isVisible);
    const [localOnlyCoins, setLocalOnlyCoins] = useState(onlyCoins);

    const animationRef = useRef<number | null>(null);
    const particleIdCounter = useRef<number>(0);

    const coinsList: CoinType[] = ['BTC', 'USD', 'ETH', 'EUR'];

    // Sync onlyCoins state over turns
    useEffect(() => {
        setLocalOnlyCoins(onlyCoins);
    }, [onlyCoins]);

    // List of amazing high-tech phrases to loop through on load
    const statusPhrases = [
        'Connecting First Pacific Secure Node',
        'Validating Sovereign Ledger Balance',
        'Decrypting Quantum Chip Channels',
        'Authorizing Federal Handshake Gateway',
        'Securing Cryptographic Node Sync',
        'Clearing Centurion Cache Buffers',
        'Ready: Transaction Stream Active'
    ];

    // Handle prop visibility shifts with smooth fade-in and exit
    useEffect(() => {
        if (isVisible) {
            setLocalVisible(true);
            setProgress(0);
            setStatusMessage(statusPhrases[0]);
            
            // Increment progress simulated
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    // Random increment for realism
                    const next = prev + Math.floor(Math.random() * 15) + 5;
                    return Math.min(next, 100);
                });
            }, 120);

            return () => clearInterval(interval);
        } else {
            // Give 300ms transition time to fade out before hiding
            const timer = setTimeout(() => {
                setLocalVisible(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    // Support global custom event trigger so other screens can launch this dynamically
    useEffect(() => {
        const handleForceTrigger = (e: Event) => {
            const customEvent = e as CustomEvent;
            const customDuration = customEvent.detail?.duration || 1800;
            setLocalVisible(true);
            setProgress(0);
            setStatusMessage('Manual Sovereign Node Verification...');
            
            let current = 0;
            const stepMs = customDuration / 20;
            const interval = setInterval(() => {
                current += 5;
                setProgress(current);
                if (current >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setLocalVisible(false);
                    }, 400);
                }
            }, stepMs);
        };

        window.addEventListener('TRIGGER_PREMIUM_LOADER', handleForceTrigger);
        return () => window.removeEventListener('TRIGGER_PREMIUM_LOADER', handleForceTrigger);
    }, []);

    // Update status phrase based on progress
    useEffect(() => {
        if (progress > 0 && progress < 100) {
            const index = Math.min(
                Math.floor((progress / 100) * statusPhrases.length),
                statusPhrases.length - 1
            );
            setStatusMessage(statusPhrases[index]);
        } else if (progress === 100) {
            setStatusMessage('Sovereign Clearance Authorized');
        }
    }, [progress]);

    // Coin Autoplay sequencer (cycle coins automatically every 2.5 seconds if not hovered/interacted)
    useEffect(() => {
        if (!isVisible) return;
        const interval = setInterval(() => {
            if (!isFlipped) {
                // Auto switch coin
                setActiveCoin(prev => {
                    const idx = coinsList.indexOf(prev);
                    return coinsList[(idx + 1) % coinsList.length];
                });
            }
        }, 2200);

        return () => clearInterval(interval);
    }, [isVisible, isFlipped]);

    // Audio sound synthesizer using AudioContext API
    const playCoinDing = (freq: number = 880, type: OscillatorType = 'sine') => {
        if (!soundEnabled) return;
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            
            // Sweet coin chime harmonic
            gain.gain.setValueAtTime(0.02, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.6);
        } catch (_) {}
    };

    // Release sparkles / particles outward from the coin
    const triggerSparkles = () => {
        const count = 22;
        const colors = ['#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#ffffff'];
        const newParticles: Particle[] = [];
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 3.5;
            const size = 3 + Math.random() * 5;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            newParticles.push({
                id: particleIdCounter.current++,
                x: 0,
                y: 0,
                angle,
                speed,
                color,
                size
            });
        }
        
        setParticles(prev => [...prev, ...newParticles]);
    };

    // Animate particles
    useEffect(() => {
        if (particles.length === 0) return;
        
        const updateParticles = () => {
            setParticles(prev => 
                prev
                    .map(p => ({
                        ...p,
                        x: p.x + Math.cos(p.angle) * p.speed,
                        y: p.y + Math.sin(p.angle) * p.speed,
                        speed: p.speed * 0.94, // friction
                        size: Math.max(0, p.size - 0.12)
                    }))
                    .filter(p => p.size > 0.5)
            );
        };

        const timer = setInterval(updateParticles, 16);
        return () => clearInterval(timer);
    }, [particles]);

    // Trigger coin interaction
    const handleCoinClick = () => {
        setIsFlipped(true);
        triggerSparkles();
        
        // Select custom chimes depending on active coin
        if (activeCoin === 'BTC') {
            playCoinDing(987.77, 'triangle'); // B5 triangle coin ding
        } else if (activeCoin === 'USD') {
            playCoinDing(1046.50, 'sine'); // C6 sine clean chime
        } else if (activeCoin === 'ETH') {
            playCoinDing(1174.66, 'sine'); // D6 bell
        } else {
            playCoinDing(880.00, 'triangle'); // A5
        }

        setTimeout(() => {
            setIsFlipped(false);
        }, 600);
    };

    if (!localVisible) return null;

    // Conic gradient calculations for "a unique colourful cycle rotating without touching the edge endpoint"
    // An open-ended arc that rotating continuously
    const speedClasses: Record<number, string> = {
        1: 'animate-[spin_4s_linear_infinite]',
        3: 'animate-[spin_2s_linear_infinite]',
        6: 'animate-[spin_1.2s_linear_infinite]',
        9: 'animate-[spin_0.6s_linear_infinite]'
    };

    const speedLabels: Record<number, string> = {
        1: 'Sovereign Cruise',
        3: 'Quantum Sync',
        6: 'Superluminal Accelerator',
        9: 'Singularity Drift'
    };

    return (
        <div 
            className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950  transition-all duration-300 ${
                isVisible ? 'opacity-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
        >
            {/* Ambient visual grids */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
            
            {/* Sparkle container */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden xl:max-w-7xl mx-auto">
                {particles.map(p => (
                    <div
                        key={p.id}
                        className="absolute rounded-full shadow-lg"
                        style={{
                            left: `calc(50% + ${p.x}px)`,
                            top: `calc(50% - 40px + ${p.y}px)`,
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            backgroundColor: p.color,
                            boxShadow: `0 0 8px ${p.color}, 0 0 16px ${p.color}`,
                            opacity: p.size / 8,
                            transform: 'translate(-50%, -50%)',
                        }}
                    />
                ))}
            </div>

            {/* Glowing spot backgrounds */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary/10 blur-3xl opacity-60 mix-blend-screen pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full bg-amber-500 blur-3xl opacity-70 mix-blend-screen pointer-events-none" />

            {/* Main Interactive Loading Frame */}
            {localOnlyCoins ? (
                <div id="loading-coins-minimal" className="flex flex-col items-center justify-center space-y-6 relative z-10 animate-fade-in p-6 select-none max-w-sm">
                    {/* THE ROTATING INTERACTIVE ENCLAVE WITH REALISM COINS */}
                    <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
                        
                        {/* The unique colourful cycle rotating without touching the edge endpoint (Hollow ring with gap) */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                            
                            {/* Conic rotating gradient svg */}
                            <svg className={`w-52 h-52 ${speedClasses[spinSpeed]} transition-all duration-500`} viewBox="0 0 100 100">
                                <defs>
                                    <linearGradient id="colourfulCycleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#06b6d4" />
                                        <stop offset="35%" stopColor="#8b5cf6" />
                                        <stop offset="70%" stopColor="#ec4899" />
                                        <stop offset="100%" stopColor="#f59e0b" />
                                    </linearGradient>
                                </defs>
                                {/* Colorful open circular loop without touching endpoints (accomplished by leaving dasharray gap) */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    stroke="url(#colourfulCycleGradient)"
                                    strokeWidth="5.5"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray="180 60" /* gap of 60 ensures endpoints NEVER touch */
                                    className="drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                                />
                            </svg>
                        </div>

                        {/* Outer ambient decorative rotating ring - counter-direction */}
                        <div className="absolute w-[240px] h-[240px] border border-dashed border-slate-100 dark:border-white/5 rounded-full animate-[spin_10s_linear_infinite_reverse] pointer-events-none" />

                        {/* CENTRAL REALISM COINS (3D Styled Coin view with flip triggers) */}
                        <button 
                            id="btn-coin-flip"
                            onClick={handleCoinClick}
                            className={`absolute w-32 h-32 rounded-full cursor-pointer group focus:outline-none transition-transform active:scale-95 duration-200 z-10`}
                            title="Click to Flip Coin & trigger audio chime!"
                        >
                            {/* Realistic Shimmer / 3D tilt effect wrapping */}
                            <div className={`w-full h-full rounded-full relative transition-transform duration-500 ease-out preserve-3d ${
                                isFlipped ? '[transform:rotateY(360deg)]' : ''
                            }`}>
                                
                                {/* COIN COVERS */}
                                
                                {/* COIN 1: BITCOIN EMBOSSED */}
                                {activeCoin === 'BTC' && (
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#f59e0b] via-[#d97706] to-[#78350f] border-4 border-[#fbbf24] shadow-[0_8px_20px_rgba(245,158,11,0.35),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-4px_8px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center p-2 text-[#0F172A] dark:text-white overflow-hidden select-none backface-hidden">
                                        <div className="absolute inset-x-0 top-0 h-1/2 bg-white -skew-y-12 blur-[1px] dark:bg-slate-800" />
                                        <div className="w-11 h-11 rounded-full border border-[#f59e0b]/40 flex items-center justify-center bg-black shadow-inner">
                                            <span className="text-4xl font-extrabold text-[#fef08a] font-mono leading-none drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.6)]">₿</span>
                                        </div>
                                        <span className="font-mono text-[6px] text-[#fef08a] font-black uppercase tracking-[0.25em] mt-2 drop-shadow">SOVEREIGN BTC</span>
                                    </div>
                                )}

                                {/* COIN 2: GOLD RESERVE USD */}
                                {activeCoin === 'USD' && (
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#facc15] via-[#a16207] to-[#451a03] border-4 border-[#fefe3c] shadow-[0_8px_20px_rgba(250,204,21,0.35),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-4px_8px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center p-2 text-[#0F172A] dark:text-white overflow-hidden select-none backface-hidden">
                                        <div className="absolute inset-x-0 top-0 h-1/2 bg-white -skew-y-12 blur-[1px] dark:bg-slate-800" />
                                        <div className="w-11 h-11 rounded-full border border-[#a16207]/40 flex items-center justify-center bg-black shadow-inner">
                                            <span className="text-3xl font-extrabold text-[#fef08a] font-serif leading-none drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.6)]">$</span>
                                        </div>
                                        <span className="font-mono text-[5.5px] text-[#fef08a] font-bold uppercase tracking-[0.12em] mt-1.5 drop-shadow text-center">PACIFIC RESERVE</span>
                                    </div>
                                )}

                                {/* COIN 3: PLATINUM ETHEREUM */}
                                {activeCoin === 'ETH' && (
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#94a3b8] via-[#475569] to-[#0f172a] border-4 border-[#e2e8f0] shadow-[0_8px_20px_rgba(148,163,184,0.35),inset_0_2px_4px_rgba(255,255,255,0.5),inset_0_-4px_8px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center p-2 text-[#0F172A] dark:text-white overflow-hidden select-none backface-hidden">
                                        <div className="absolute inset-x-0 top-0 h-1/2 bg-white -skew-y-12 blur-[1px] dark:bg-slate-800" />
                                        <div className="w-11 h-11 rounded-full border border-slate-400/30 flex items-center justify-center bg-white shadow-inner dark:bg-slate-800">
                                            {/* Pure styled vector octahedron logo */}
                                            <svg className="w-6 h-10 text-slate-100 drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.8)]" viewBox="0 0 24 38" fill="currentColor">
                                                <polygon points="12,0 0,20 12,28" className="opacity-80" />
                                                <polygon points="12,0 24,20 12,28" className="opacity-100" />
                                                <polygon points="12,38 0,23 12,28" className="opacity-70" />
                                                <polygon points="12,38 24,23 12,28" className="opacity-90" />
                                            </svg>
                                        </div>
                                        <span className="font-mono text-[6px] text-[#0F172A] dark:text-[#334155] font-black uppercase tracking-[0.25em] mt-2 drop-shadow">AURIC ETH</span>
                                    </div>
                                )}

                                {/* COIN 4: BIMETALLIC EURO */}
                                {activeCoin === 'EUR' && (
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#d1d5db] via-[#4b5563] to-[#1f2937] border-4 border-slate-300 shadow-[0_8px_20px_rgba(156,163,175,0.3),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-4px_8px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center p-1.5 overflow-hidden select-none backface-hidden">
                                        
                                        {/* Golden Core Inner Ring of bimetallic structure */}
                                        <div className="w-[84px] h-[84px] rounded-full bg-gradient-to-br from-[#f59e0b] via-[#b45309] to-[#451a03] border-2 border-[#d97706] shadow-inner flex flex-col items-center justify-center p-1 relative">
                                            <div className="absolute inset-x-0 top-0 h-1/2 bg-white -skew-y-12 blur-[0.5px] dark:bg-slate-800" />
                                            <span className="text-2xl font-black text-[#fef08a] leading-none drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.7)]">€</span>
                                            <span className="font-mono text-[5px] text-[#fbbf24] font-bold uppercase tracking-wider mt-1 drop-shadow">SOVEREIGN</span>
                                        </div>
                                    </div>
                                )}

                            </div>

                            {/* Hover flare visual */}
                            <div className="absolute inset-0 rounded-full bg-white group-hover:bg-white transition-colors duration-300 pointer-events-none dark:bg-slate-800" />
                        </button>
                        
                        {/* Ring lights indicator */}
                        <div className="absolute -bottom-1 flex justify-center gap-1.5 z-20 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 py-1 px-3.5 rounded-full select-none">
                            {coinsList.map(c => {
                                const isSelected = activeCoin === c;
                                return (
                                    <button
                                        key={c}
                                        onClick={() => {
                                            setActiveCoin(c);
                                            setSpinSpeed(prev => Math.min(9, prev + 1));
                                            playCoinDing(900, 'sine');
                                            triggerSparkles();
                                            // Reset speed lock-down after a bit
                                            setTimeout(() => setSpinSpeed(3), 1200);
                                        }}
                                        className={`text-[8.5px] font-mono leading-none px-1 rounded transition-all cursor-pointer ${
                                            isSelected 
                                                ? 'text-[#06b6d4] font-black scale-110 drop-shadow-[0_0_4px_#06b6d4]' 
                                                : 'text-[#0F172A] hover:text-[#0F172A] dark:text-[#334155] font-bold'
                                        }`}
                                    >
                                        {c}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Minimal status indicator */}
                    <div className="flex flex-col items-center justify-center space-y-1.5 mt-2">
                        <p className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-[#06b6d4] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#06b6d4] animate-ping"></span>
                            {statusMessage}
                        </p>
                        <p className="text-[8px] font-mono font-bold text-[#0F172A] dark:text-white uppercase tracking-[0.15em]">{progress}% Ledger Transmitted</p>
                    </div>

                    {/* Expand utility control button */}
                    <button
                        onClick={() => setLocalOnlyCoins(false)}
                        className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-white active:scale-95 text-[#0F172A] hover:text-[#0F172A] dark:text-white hover:dark:text-white border border-slate-200 dark:border-white/5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer inline-flex items-center gap-1.5 mt-2"
                    >
                        <span>⚙️ Access Master Controls Panel</span>
                    </button>
                </div>
            ) : (
                <div id="loading-dashboard-pane" className="w-[90%] max-w-lg p-8 md:p-10 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl relative z-10 text-center space-y-8  animate-fade-in">
                    
                    {/* Header branding */}
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 bg-white[0.03] border border-slate-100 dark:border-white/5 px-3.5 py-1 rounded-full text-[#0F172A] dark:text-white text-[10px] font-black uppercase tracking-[0.3em] dark:bg-slate-800">
                            <Cpu className="w-3.5 h-3.5 text-primary rotate-45" />
                            First Pacific Bank
                        </div>
                        <h2 className="text-2xl font-black text-[#0F172A] dark:text-white uppercase tracking-tighter mt-1">Sovereign Cloud Node</h2>
                    </div>

                    {/* THE ROTATING INTERACTIVE ENCLAVE WITH REALISM COINS */}
                    <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
                        
                        {/* The unique colourful cycle rotating without touching the edge endpoint (Hollow ring with gap) */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                            
                            {/* Conic rotating gradient svg */}
                            <svg className={`w-52 h-52 ${speedClasses[spinSpeed]} transition-all duration-500`} viewBox="0 0 100 100">
                                <defs>
                                    <linearGradient id="colourfulCycleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#06b6d4" />
                                        <stop offset="35%" stopColor="#8b5cf6" />
                                        <stop offset="70%" stopColor="#ec4899" />
                                        <stop offset="100%" stopColor="#f59e0b" />
                                    </linearGradient>
                                </defs>
                                {/* Colorful open circular loop without touching endpoints (accomplished by leaving dasharray gap) */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    stroke="url(#colourfulCycleGradient)"
                                    strokeWidth="5.5"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray="180 60" /* gap of 60 ensures endpoints NEVER touch */
                                    className="drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                                />
                            </svg>
                        </div>

                        {/* Outer ambient decorative rotating ring - counter-direction */}
                        <div className="absolute w-[240px] h-[240px] border border-dashed border-slate-100 dark:border-white/5 rounded-full animate-[spin_10s_linear_infinite_reverse] pointer-events-none" />

                        {/* CENTRAL REALISM COINS (3D Styled Coin view with flip triggers) */}
                        <button 
                            onClick={handleCoinClick}
                            className={`absolute w-32 h-32 rounded-full cursor-pointer group focus:outline-none transition-transform active:scale-95 duration-200 z-10`}
                            title="Click to Flip Coin & trigger audio chime!"
                        >
                            {/* Realistic Shimmer / 3D tilt effect wrapping */}
                            <div className={`w-full h-full rounded-full relative transition-transform duration-500 ease-out preserve-3d ${
                                isFlipped ? '[transform:rotateY(360deg)]' : ''
                            }`}>
                                
                                {/* COIN COVERS */}
                                
                                {/* COIN 1: BITCOIN EMBOSSED */}
                                {activeCoin === 'BTC' && (
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#f59e0b] via-[#d97706] to-[#78350f] border-4 border-[#fbbf24] shadow-[0_8px_20px_rgba(245,158,11,0.35),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-4px_8px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center p-2 text-[#0F172A] dark:text-white overflow-hidden select-none backface-hidden">
                                        <div className="absolute inset-x-0 top-0 h-1/2 bg-white -skew-y-12 blur-[1px] dark:bg-slate-800" />
                                        <div className="w-11 h-11 rounded-full border border-[#f59e0b]/40 flex items-center justify-center bg-black shadow-inner">
                                            <span className="text-4xl font-extrabold text-[#fef08a] font-mono leading-none drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.6)]">₿</span>
                                        </div>
                                        <span className="font-mono text-[6px] text-[#fef08a] font-black uppercase tracking-[0.25em] mt-2 drop-shadow">SOVEREIGN BTC</span>
                                    </div>
                                )}

                                {/* COIN 2: GOLD RESERVE USD */}
                                {activeCoin === 'USD' && (
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#facc15] via-[#a16207] to-[#451a03] border-4 border-[#fefe3c] shadow-[0_8px_20px_rgba(250,204,21,0.35),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-4px_8px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center p-2 text-[#0F172A] dark:text-white overflow-hidden select-none backface-hidden">
                                        <div className="absolute inset-x-0 top-0 h-1/2 bg-white -skew-y-12 blur-[1px] dark:bg-slate-800" />
                                        <div className="w-11 h-11 rounded-full border border-[#a16207]/40 flex items-center justify-center bg-black shadow-inner">
                                            <span className="text-3xl font-extrabold text-[#fef08a] font-serif leading-none drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.6)]">$</span>
                                        </div>
                                        <span className="font-mono text-[5.5px] text-[#fef08a] font-bold uppercase tracking-[0.12em] mt-1.5 drop-shadow text-center">PACIFIC RESERVE</span>
                                    </div>
                                )}

                                {/* COIN 3: PLATINUM ETHEREUM */}
                                {activeCoin === 'ETH' && (
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#94a3b8] via-[#475569] to-[#0f172a] border-4 border-[#e2e8f0] shadow-[0_8px_20px_rgba(148,163,184,0.35),inset_0_2px_4px_rgba(255,255,255,0.5),inset_0_-4px_8px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center p-2 text-[#0F172A] dark:text-white overflow-hidden select-none backface-hidden">
                                        <div className="absolute inset-x-0 top-0 h-1/2 bg-white -skew-y-12 blur-[1px] dark:bg-slate-800" />
                                        <div className="w-11 h-11 rounded-full border border-slate-400/30 flex items-center justify-center bg-white shadow-inner dark:bg-slate-800">
                                            {/* Pure styled vector octahedron logo */}
                                            <svg className="w-6 h-10 text-slate-100 drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.8)]" viewBox="0 0 24 38" fill="currentColor">
                                                <polygon points="12,0 0,20 12,28" className="opacity-80" />
                                                <polygon points="12,0 24,20 12,28" className="opacity-100" />
                                                <polygon points="12,38 0,23 12,28" className="opacity-70" />
                                                <polygon points="12,38 24,23 12,28" className="opacity-90" />
                                            </svg>
                                        </div>
                                        <span className="font-mono text-[6px] text-[#0F172A] dark:text-[#334155] font-black uppercase tracking-[0.25em] mt-2 drop-shadow">AURIC ETH</span>
                                    </div>
                                )}

                                {/* COIN 4: BIMETALLIC EURO */}
                                {activeCoin === 'EUR' && (
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#d1d5db] via-[#4b5563] to-[#1f2937] border-4 border-slate-300 shadow-[0_8px_20px_rgba(156,163,175,0.3),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-4px_8px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center p-1.5 overflow-hidden select-none backface-hidden">
                                        
                                        {/* Golden Core Inner Ring of bimetallic structure */}
                                        <div className="w-[84px] h-[84px] rounded-full bg-gradient-to-br from-[#f59e0b] via-[#b45309] to-[#451a03] border-2 border-[#d97706] shadow-inner flex flex-col items-center justify-center p-1 relative">
                                            <div className="absolute inset-x-0 top-0 h-1/2 bg-white -skew-y-12 blur-[0.5px] dark:bg-slate-800" />
                                            <span className="text-2xl font-black text-[#fef08a] leading-none drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.7)]">€</span>
                                            <span className="font-mono text-[5px] text-[#fbbf24] font-bold uppercase tracking-wider mt-1 drop-shadow">SOVEREIGN</span>
                                        </div>
                                    </div>
                                )}

                            </div>

                            {/* Hover flare visual */}
                            <div className="absolute inset-0 rounded-full bg-white group-hover:bg-white transition-colors duration-300 pointer-events-none dark:bg-slate-800" />
                        </button>
                        
                        {/* Ring lights indicator */}
                        <div className="absolute -bottom-1 flex justify-center gap-1.5 z-20 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 py-1 px-3.5 rounded-full select-none">
                            {coinsList.map(c => {
                                const isSelected = activeCoin === c;
                                return (
                                    <button
                                        key={c}
                                        onClick={() => {
                                            setActiveCoin(c);
                                            setSpinSpeed(prev => Math.min(9, prev + 1));
                                            playCoinDing(900, 'sine');
                                            triggerSparkles();
                                            // Reset speed lock-down after a bit
                                            setTimeout(() => setSpinSpeed(3), 1200);
                                        }}
                                        className={`text-[8.5px] font-mono leading-none px-1 rounded transition-all cursor-pointer ${
                                            isSelected 
                                                ? 'text-[#06b6d4] font-black scale-110 drop-shadow-[0_0_4px_#06b6d4]' 
                                                : 'text-[#0F172A] hover:text-[#0F172A] dark:text-[#334155] font-bold'
                                        }`}
                                    >
                                        {c}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Progress & High Tech loading bar */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs font-mono px-1">
                            <span className="text-[#0F172A] dark:text-white flex items-center gap-1.5 animate-pulse">
                                <Compass className="w-3.5 h-3.5 text-primary animate-spin" />
                                {statusMessage}
                            </span>
                            <span className="text-[#0F172A] dark:text-slate-200 font-black tracking-widest">{progress}%</span>
                        </div>

                        {/* Progress Track */}
                        <div className="h-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-full overflow-hidden p-0.5">
                            <div 
                                className="h-full bg-gradient-to-r from-cyan-400 via-primary to-indigo-500 rounded-full transition-all duration-300 ease-out relative"
                                style={{ width: `${progress}%` }}
                            >
                                {/* Running scanner beam */}
                                <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-r from-transparent to-white/30 skew-x-12 animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* USER INTERACTION CONTROLS - Speed, Sound, Manual Coin switch */}
                    <div className="pt-4 border-t border-slate-100 dark:border-white/5 grid grid-cols-2 gap-4 text-left">
                        
                        {/* Engine Speed selection */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between leading-none items-center">
                                <label className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest flex items-center gap-1">
                                    <Activity className="w-3 h-3 text-cyan-400" />
                                    Cycle Speed
                                </label>
                                <span className="text-[7.5px] font-mono font-bold text-primary">{speedLabels[spinSpeed]}</span>
                            </div>
                            <div className="flex gap-1">
                                {([1, 3, 6, 9] as const).map(speed => (
                                    <button
                                        key={speed}
                                        onClick={() => {
                                            setSpinSpeed(speed);
                                            playCoinDing(500 + speed * 60, 'triangle');
                                            triggerSparkles();
                                        }}
                                        className={`flex-1 py-1 rounded-md text-[8.5px] font-mono font-extrabold text-center transition ${
                                            spinSpeed === speed
                                                ? 'bg-primary text-slate-950 font-black shadow-md shadow-primary/10'
                                                : 'bg-black border border-slate-100 dark:border-white/5 text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white hover:bg-white[0.02]'
                                        }`}
                                    >
                                        {speed === 1 ? 'SLW' : speed === 3 ? 'BAL' : speed === 6 ? 'HYP' : 'QNT'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sound Trigger */}
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest flex items-center gap-1">
                                {soundEnabled ? <Volume2 className="w-3 h-3 text-emerald-400 animate-bounce" /> : <VolumeX className="w-3 h-3 text-red-400" />}
                                Enclave Tone Synthesizer
                            </label>
                            <button
                                onClick={() => {
                                    setSoundEnabled(!soundEnabled);
                                    // Play short tone immediately to test
                                    if (!soundEnabled) {
                                        setTimeout(() => {
                                            try {
                                                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                                                const osc = ctx.createOscillator();
                                                const gain = ctx.createGain();
                                                osc.frequency.value = 880;
                                                gain.gain.setValueAtTime(0.01, ctx.currentTime);
                                                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
                                                osc.connect(gain);
                                                gain.connect(ctx.destination);
                                                osc.start();
                                                osc.stop(ctx.currentTime + 0.15);
                                            } catch (_) {}
                                        }, 80);
                                    }
                                }}
                                className={`w-full py-1 px-3 border rounded-md text-[8.5px] font-mono font-bold flex items-center justify-center gap-1.5 transition ${
                                    soundEnabled
                                        ? 'bg-emerald-500 border-emerald-500/20 text-emerald-400'
                                        : 'bg-red-500 border-red-500/20 text-red-400'
                                }`}
                            >
                                {soundEnabled ? 'Synthesizer Active' : 'Sound Synthesizer Muted'}
                            </button>
                        </div>

                    </div>

                    {/* Subtext info & Collapse Toggle */}
                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex flex-col items-center gap-2">
                        <div className="text-[8px] font-mono text-[#0F172A] uppercase tracking-widest flex items-center justify-center gap-1">
                            <Shield className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>SECURE CHIP PROTOCOL ACCREDITATION ISSUED BY FIRST PACIFIC UNION</span>
                        </div>
                        <button
                            onClick={() => setLocalOnlyCoins(true)}
                            className="text-[8.5px] font-mono text-cyan-400 hover:text-cyan-350 cursor-pointer uppercase tracking-widest underline underline-offset-2 transition-colors mt-1"
                        >
                            Collapse to Coins Minimalist View &larr;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
