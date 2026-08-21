import React, { useState, useEffect, useRef } from 'react';
import { SpinnerIcon, FingerprintIcon, CheckCircleIcon, ExclamationTriangleIcon, ShieldCheckIcon, LockClosedIcon, XIcon, ServerIcon } from './Icons';
import { triggerHaptic } from '../utils/haptics';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SetupBiometricsModalProps {
    onClose: () => void;
    onEnable: () => void;
    userProfile: UserProfile;
}

type Step = 'info' | 'scanning' | 'processing' | 'success' | 'error';

const SCAN_INSTRUCTIONS = [
    { title: 'Scan 1 of 5: Center of Finger', desc: 'Place the center of your thumb or finger firmly on the sensor area.' },
    { title: 'Scan 2 of 5: Left Side Margin', desc: 'Slightly tilt your finger to register the left edge ridge details.' },
    { title: 'Scan 3 of 5: Right Side Margin', desc: 'Slightly tilt your finger to capture the right edge ridges.' },
    { title: 'Scan 4 of 5: Upper Tip Ridge', desc: 'Place the upper tip of your finger on the sensor area.' },
    { title: 'Scan 5 of 5: Print Boundaries', desc: 'Firmly roll your finger on the sensor to lock in final boundary data.' }
];

export const SetupBiometricsModal: React.FC<SetupBiometricsModalProps> = ({ onClose, onEnable, userProfile }) => {
    const [step, setStep] = useState<Step>('info');
    const [scansCompleted, setScansCompleted] = useState(0);
    const [currentScanProgress, setCurrentScanProgress] = useState(0);
    const [isScanning, setIsScanning] = useState(false);
    const [instructionText, setInstructionText] = useState('Press and hold the sensor below');
    const [processingLog, setProcessingLog] = useState<string>('');
    const [error, setError] = useState('');

    const scanTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Clean up timer on unmount
    useEffect(() => {
        return () => {
            if (scanTimerRef.current) clearInterval(scanTimerRef.current);
        };
    }, []);

    // Play standard clean synthesizer sound for interactive audio feedback
    const playBeep = (freq = 800, duration = 0.1, type: 'sine' | 'square' | 'triangle' = 'sine') => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = type;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            // Audio context not supported or allowed by policy
        }
    };

    // Press and hold start handler
    const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (step !== 'scanning' || isScanning) return;

        setIsScanning(true);
        triggerHaptic(10);
        playBeep(600, 0.08, 'sine');

        setInstructionText('Keep holding still...');

        let currentProgress = currentScanProgress;
        scanTimerRef.current = setInterval(() => {
            currentProgress += 4; // Scan speed: 25 steps * 100ms = 2.5 seconds per scan
            if (currentProgress >= 100) {
                currentProgress = 100;
                setCurrentScanProgress(100);
                clearInterval(scanTimerRef.current!);
                scanTimerRef.current = null;
                handleScanCompletion();
            } else {
                setCurrentScanProgress(currentProgress);
                // Pulse haptic feedback during scan
                if (currentProgress % 16 === 0) {
                    triggerHaptic(5);
                    playBeep(450 + currentProgress * 2, 0.04, 'sine');
                }
            }
        }, 100);
    };

    // Release handler
    const handlePressEnd = () => {
        if (!isScanning) return;
        setIsScanning(false);
        if (scanTimerRef.current) {
            clearInterval(scanTimerRef.current);
            scanTimerRef.current = null;
        }

        if (currentScanProgress < 100) {
            triggerHaptic(15);
            playBeep(250, 0.15, 'triangle');
            setInstructionText('Scan incomplete. Hold down on sensor.');
            setCurrentScanProgress(0); // Reset progress if released early
        }
    };

    const handleScanCompletion = () => {
        setIsScanning(false);
        triggerHaptic([30, 20, 30]);
        playBeep(880, 0.25, 'sine');

        const nextScansCompleted = scansCompleted + 1;
        setScansCompleted(nextScansCompleted);

        if (nextScansCompleted >= 5) {
            setStep('processing');
            handleProcessingSimulation();
        } else {
            setInstructionText('Lift finger and place it again to proceed');
            setCurrentScanProgress(0);
        }
    };

    const handleProcessingSimulation = () => {
        const logs = [
            'Analyzing ridge details...',
            'Mapping core minutiae database markers...',
            'Compiling AES-256 hardware-locked token...',
            'Synchronizing token credentials with Secure Enclave...',
            'Fingerprint bio-vector secured.'
        ];

        let index = 0;
        setProcessingLog(logs[0]);
        triggerHaptic(10);

        const logInterval = setInterval(() => {
            index++;
            if (index < logs.length) {
                setProcessingLog(logs[index]);
                triggerHaptic(10);
                playBeep(700 + index * 50, 0.08, 'sine');
            } else {
                clearInterval(logInterval);
                playBeep(1000, 0.4, 'sine');
                triggerHaptic([50, 50, 50]);
                setStep('success');
            }
        }, 1000);
    };

    const handleFinish = () => {
        onEnable();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-100  flex items-center justify-center z-[80] p-4" id="biometric-modal-overlay">
            <div className="bg-[#0b1329] border border-slate-200 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] w-full max-w-sm relative overflow-hidden flex flex-col min-h-[550px]" id="biometric-modal-container">
                
                {/* Visual Accent Gradients */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.12),transparent_50%)] pointer-events-none"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.06),transparent_50%)] pointer-events-none"></div>
                
                {/* Top Header Rail */}
                <div className="p-6 pb-2 flex justify-between items-center border-b border-black/5 relative z-10">
                    <div className="flex items-center gap-2">
                        <ShieldCheckIcon className="w-5 h-5 text-primary" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Secure Enclave Sync</span>
                    </div>
                    {step === 'info' && (
                        <button onClick={onClose} className="p-1.5 text-[#0F172A] hover:text-white rounded-full hover:bg-white transition-colors dark:bg-slate-800" id="close-biometrics-btn">
                            <XIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="flex-grow flex flex-col justify-center p-8 relative z-10">
                    <AnimatePresence mode="wait">
                        {step === 'info' && (
                            <motion.div
                                key="info"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.2 }}
                                className="text-center"
                                id="biometric-step-info"
                            >
                                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-b from-slate-900 to-slate-950 rounded-[2rem] mb-6 ring-1 ring-white/10 shadow-[0_0_40px_rgba(0,0,0,0.6)] relative">
                                    <div className="absolute inset-0 bg-primary/10 rounded-[2rem] animate-pulse"></div>
                                    <FingerprintIcon className="w-12 h-12 text-primary" />
                                    <div className="absolute -bottom-1 -right-1 bg-slate-100 p-1 rounded-full border border-slate-200">
                                        <LockClosedIcon className="w-3.5 h-3.5 text-emerald-500" />
                                    </div>
                                </div>
                                
                                <h2 className="text-2xl font-black text-white tracking-tight uppercase mb-2">Fingerprint Security</h2>
                                <p className="text-[#0F172A] text-xs leading-relaxed max-w-xs mx-auto mb-8 font-bold">
                                    Simulate registering high-fidelity bio-credentials directly with the device's secure enclave for instantaneous mobile biometric bypass authorizations.
                                </p>

                                <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                                    <div className="bg-slate-50 p-3.5 rounded-xl border border-black/5 flex flex-col gap-1.5 dark:bg-slate-900">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">Hardware Lock</span>
                                        </div>
                                        <p className="text-[11px] font-bold text-[#0F172A]">Biometric Vector</p>
                                    </div>
                                    <div className="bg-slate-50 p-3.5 rounded-xl border border-black/5 flex flex-col gap-1.5 dark:bg-slate-900">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                            <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">Speed Optimization</span>
                                        </div>
                                        <p className="text-[11px] font-bold text-[#0F172A]">0.1s Fast Bypass</p>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setStep('scanning')} 
                                    className="w-full py-4 bg-primary hover:bg-primary-600 active:scale-[0.98] text-slate-950 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-primary/20 transition-all"
                                    id="initiate-biometrics-btn"
                                >
                                    Initiate Setup
                                </button>
                                
                                <p className="mt-5 text-[9px] text-[#0F172A] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
                                    <LockClosedIcon className="w-3 h-3" /> FINGERPRINT_SHA_E4
                                </p>
                            </motion.div>
                        )}

                        {step === 'scanning' && (
                            <motion.div
                                key="scanning"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center"
                                id="biometric-step-scanning"
                            >
                                <div className="mb-4">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.25em]">
                                        {SCAN_INSTRUCTIONS[scansCompleted].title}
                                    </span>
                                    <p className="text-[11px] text-[#0F172A] font-bold max-w-[280px] mx-auto mt-1 leading-relaxed">
                                        {SCAN_INSTRUCTIONS[scansCompleted].desc}
                                    </p>
                                </div>

                                {/* Main Interactive Fingerprint Button */}
                                <div className="relative w-44 h-44 mx-auto my-6 flex items-center justify-center">
                                    {/* Glowing Radar Background Rings */}
                                    <div className={`absolute inset-0 rounded-full border border-black/5 transition-all duration-300 ${isScanning ? 'scale-110 border-primary/25 bg-primary/5' : ''}`}></div>
                                    <div className={`absolute inset-2 rounded-full border border-dashed border-black/5 transition-all duration-300 ${isScanning ? 'rotate-90 border-primary/30' : ''}`}></div>
                                    
                                    {/* Scan Progress Circle */}
                                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                        <circle 
                                            cx="50" 
                                            cy="50" 
                                            r="44" 
                                            stroke="rgba(255,255,255,0.04)" 
                                            strokeWidth="3.5" 
                                            fill="transparent" 
                                        />
                                        <circle 
                                            cx="50" 
                                            cy="50" 
                                            r="44" 
                                            stroke="url(#progressGradient)" 
                                            strokeWidth="4" 
                                            fill="transparent" 
                                            strokeDasharray={276.4}
                                            strokeDashoffset={276.4 - (276.4 * currentScanProgress) / 100}
                                            strokeLinecap="round"
                                            className="transition-all duration-100 ease-out"
                                        />
                                        <defs>
                                            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#D4AF37" />
                                                <stop offset="100%" stopColor="#10B981" />
                                            </linearGradient>
                                        </defs>
                                    </svg>

                                    {/* Simulated Laser sweep */}
                                    {isScanning && (
                                        <div className="absolute left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10B981] animate-scan-vertical z-20"></div>
                                    )}

                                    {/* Sensor Area Core Touch Target */}
                                    <button
                                        onMouseDown={handlePressStart}
                                        onMouseUp={handlePressEnd}
                                        onMouseLeave={handlePressEnd}
                                        onTouchStart={handlePressStart}
                                        onTouchEnd={handlePressEnd}
                                        className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden select-none cursor-pointer outline-none ${
                                            isScanning 
                                                ? 'bg-slate-50 border-2 border-emerald-500 shadow-[0_0_35px_rgba(16,185,129,0.4)] scale-95' 
                                                : 'bg-gradient-to-b from-slate-900 to-slate-950 border border-black/5 hover:border-primary/50 shadow-2xl active:scale-95'
                                        }`}
                                        id="fingerprint-scan-sensor"
                                    >
                                        <FingerprintIcon className={`w-14 h-14 transition-all duration-300 ${isScanning ? 'text-emerald-400 scale-110 animate-pulse' : 'text-primary'}`} />
                                        
                                        {/* Dynamic ripple overlay when active */}
                                        {isScanning && (
                                            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping pointer-events-none"></div>
                                        )}
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <p className={`text-xs font-black uppercase tracking-widest ${isScanning ? 'text-emerald-400 animate-pulse' : 'text-[#0F172A]'}`}>
                                        {isScanning ? 'Registering Print...' : instructionText}
                                    </p>

                                    {/* Scan Counter Progress Markers (5 blocks) */}
                                    <div className="flex justify-center gap-1.5 max-w-[180px] mx-auto pt-2">
                                        {[0, 1, 2, 3, 4].map((idx) => (
                                            <div 
                                                key={idx}
                                                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                                                    idx < scansCompleted 
                                                        ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                                                        : idx === scansCompleted && isScanning 
                                                        ? 'bg-primary/50 animate-pulse' 
                                                        : 'bg-white'
                                                }`}
                                            ></div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-[#0F172A] font-mono tracking-wider uppercase">
                                        Completed: {scansCompleted} of 5 sectors
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {step === 'processing' && (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center py-6"
                                id="biometric-step-processing"
                            >
                                <div className="w-20 h-20 mx-auto relative mb-8">
                                    <div className="absolute inset-0 border-4 border-black/5 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <ServerIcon className="w-7 h-7 text-primary animate-pulse" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">Compiling Handshake</h3>
                                
                                <div className="bg-slate-100 p-4 rounded-2xl border border-black/5 min-h-[60px] flex items-center justify-center max-w-[260px] mx-auto">
                                    <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest text-center animate-pulse leading-normal">
                                        {processingLog}
                                    </p>
                                </div>
                                <p className="text-[9px] text-[#0F172A] uppercase tracking-widest font-bold mt-8">Do not minimize standard terminal</p>
                            </motion.div>
                        )}

                        {step === 'success' && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center"
                                id="biometric-step-success"
                            >
                                <div className="relative inline-block mb-6">
                                    <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.25)]">
                                        <CheckCircleIcon className="w-12 h-12 text-emerald-400" />
                                    </div>
                                    <div className="absolute inset-0 border border-emerald-400/20 rounded-full animate-ping"></div>
                                </div>

                                <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">Handshake Secured</h3>
                                <p className="text-[#0F172A] text-xs leading-relaxed max-w-xs mx-auto mb-8 font-bold">
                                    Fingerprint bio-vector compiled successfully! Local device is now paired via secure hardware enclave key.
                                </p>

                                <button 
                                    onClick={handleFinish} 
                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-emerald-500/20 transition-all"
                                    id="complete-biometrics-btn"
                                >
                                    Complete Setup
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <style>{`
                @keyframes scan-vertical {
                    0%, 100% { top: 15%; opacity: 0; }
                    10% { opacity: 1; }
                    50% { top: 85%; opacity: 1; }
                    90% { opacity: 0; }
                }
                .animate-scan-vertical {
                    animation: scan-vertical 1.8s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};
