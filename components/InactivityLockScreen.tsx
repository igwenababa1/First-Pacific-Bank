import React, { useState, useEffect, useRef } from 'react';
import { 
    Lock, 
    Unlock, 
    Key, 
    Eye, 
    EyeOff, 
    ShieldCheck, 
    AlertCircle, 
    CheckCircle2, 
    Zap, 
    RefreshCw, 
    Cpu,
    Sparkles,
    Fingerprint
} from 'lucide-react';
import { UserProfile } from '../types';
import { db } from '../services/database';
import { authenticateBiometric } from '../services/biometricService';

interface InactivityLockScreenProps {
    user: UserProfile;
    onUnlock: () => void;
    requireBiometric?: boolean;
}

export const InactivityLockScreen: React.FC<InactivityLockScreenProps> = ({ user, onUnlock, requireBiometric = false }) => {
    const isBiometricsActive = requireBiometric || user.securitySettings?.biometricsEnabled || false;
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [unlockSuccess, setUnlockSuccess] = useState(false);

    // Biometric scanner state
    const [useManualPassword, setUseManualPassword] = useState(!isBiometricsActive);
    const [isBiometricScanning, setIsBiometricScanning] = useState(false);
    const [biometricProgress, setBiometricProgress] = useState(0);
    const [biometricStatus, setBiometricStatus] = useState('Secure Enclave Link Established. Ready for Face ID or Fingerprint.');
// Webcam/Camera feature
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (isBiometricScanning) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isBiometricScanning]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
        } catch (err) {
            console.error("Camera access denied or unavailable", err);
            setBiometricStatus("CAMERA UNAVAILABLE - FALLBACK SCAN");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };



    const handleBiometricScan = async () => {
        if (isBiometricScanning) return;
        setIsBiometricScanning(true);
        setBiometricProgress(20);
        setError(null);
        setBiometricStatus('Initiating hardware biometric verification (Touch ID / Face ID)...');

        try {
            const success = await authenticateBiometric();
            if (success) {
                setBiometricProgress(100);
                setBiometricStatus('Biometric signature verified! Unlocking ledger session...');
                setUnlockSuccess(true);
                await db.logUserAction('auth_unlock', { email: user.email, method: 'Enclave Biometric Verify' });
                setTimeout(() => {
                    setIsBiometricScanning(false);
                    onUnlock();
                }, 800);
            } else {
                setBiometricStatus('Biometric verification failed. Retry or enter PIN.');
                setIsBiometricScanning(false);
                setError('Biometric verification failed.');
            }
        } catch (err) {
            console.error("Biometric scan error", err);
            setBiometricStatus('Sensor error. Fallback to Master PIN/Password.');
            setIsBiometricScanning(false);
            setError('Biometric sensor error.');
        }
    };

    const handleUnlock = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError(null);
        setIsUnlocking(true);

        try {
            // Verify utilizing our secure local database service
            const result = await db.authenticate(user.email, password);
            if (result && result !== 'VERIFICATION_REQUIRED' && result !== 'BANNED') {
                // Generate a visual satisfaction animation on successful master clearance verification
                setUnlockSuccess(true);
                await db.logUserAction('auth_unlock', { email: user.email, method: 'Inactivity Resume' });
                
                setTimeout(() => {
                    setIsUnlocking(false);
                    onUnlock();
                }, 1000);
            } else {
                setTimeout(() => {
                    setError('Credential verification failed. Security vault remains locked.');
                    setIsUnlocking(false);
                }, 1000);
            }
        } catch (err: any) {
            setError('Verification service unavailable. Access held.');
            setIsUnlocking(false);
        }
    };

    return (
        <div id="inactivity-lock-screen" className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950  animate-fade-in">
            {/* Ambient Background Glow Loops */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full max-w-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10  rounded-[2.5rem] p-8 md:p-10 shadow-[0_24px_80px_rgba(0,0,0,0.6)] relative overflow-hidden text-center animate-lock-appear">
                
                {/* Visual Premium Header Security Clearance Ring */}
                <div className="relative mx-auto w-24 h-24 mb-6 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20 animate-spin-slow"></div>
                    <div className="absolute inset-2 rounded-full border border-emerald-500/20"></div>
                    
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg ${
						unlockSuccess 
							? 'bg-emerald-500 border border-emerald-400/50 text-emerald-400' 
							: 'bg-primary/10 border border-primary/30 text-primary'
					}`}>
                        {unlockSuccess ? (
                            <Unlock className="w-8 h-8 animate-bounce" />
                        ) : requireBiometric && !useManualPassword ? (
                            <Fingerprint className={`w-8 h-8 ${isBiometricScanning ? 'animate-pulse text-emerald-400' : 'text-primary'}`} />
                        ) : (
                            <Lock className="w-8 h-8" />
                        )}
                    </div>
                </div>

                <div className="space-y-2 mb-8">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] bg-rose-500 text-rose-400 border border-rose-500/20">
                        <Cpu className="w-3 h-3 animate-pulse" />
                        Inactivity Timeout Secured
                    </span>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Portfolio Frozen</h2>
                    <p className="text-[#0F172A] text-xs max-w-sm mx-auto leading-relaxed">
                        {requireBiometric && !useManualPassword 
                            ? "This ledger session is locked. Complete an instant biological biometric scan to secure and restore your institutional assets." 
                            : "To protect your institutional capital and dynamic assets, we have temporarily locked this ledger session. Enter your secure password to resume immediately."}
                    </p>
                </div>

                {/* Profile Display */}
                <div className="flex items-center gap-3 bg-white[0.02] border border-slate-200 dark:border-white/5 p-3.5 rounded-2xl mb-6 text-left dark:bg-slate-800">
                    <img 
                        src={user.profilePictureUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300&auto=format&fit=crop'} 
                        alt={user.name} 
                        className="w-10 h-10 rounded-full border border-primary/30 object-cover"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-[#0F172A] font-extrabold uppercase tracking-widest">Active Partner</p>
                        <p className="text-sm font-black text-white truncate">{user.name}</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        <span className="text-[8px] font-mono text-[#0F172A] uppercase mt-1">SESSION STABLE</span>
                    </div>
                </div>

                {/* Interactive Body (Biometrics vs Password) */}
                {requireBiometric && !useManualPassword ? (
                    <div className="space-y-5">
                        
                        {/* Biometric Scan Area */}
                        <div className="relative bg-black border border-slate-200 dark:border-white/10 p-5 rounded-2xl flex flex-col items-center justify-center overflow-hidden min-h-[145px]">
                            {isBiometricScanning && (
                                <div className="absolute top-0 inset-x-0 h-0.5 bg-emerald-500 shadow-[0_0_12px_#10b981] animate-scan-beam z-10"></div>
                            )}
                            
                            {isBiometricScanning && (
                                <video
                                    ref={videoRef}
                                    className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen"
                                    muted
                                    playsInline
                                />
                            )}


                            <Fingerprint className={`w-14 h-14 mb-3 transition-all duration-350 ${
                                isBiometricScanning 
                                    ? 'text-emerald-400 scale-110 animate-pulse' 
                                    : unlockSuccess 
                                        ? 'text-emerald-500 scale-110' 
                                        : 'text-[#0F172A] hover:text-primary cursor-pointer active:scale-95'
                            }`} onClick={handleBiometricScan} />

                            <div className="w-full space-y-1.5 z-20">
                                <p className="text-[10px] font-mono font-bold text-slate-350 tracking-wide text-center uppercase">
                                    {isBiometricScanning ? `AUTHENTICATING: ${biometricProgress}%` : unlockSuccess ? "DECRYPTION COMPLETE" : "SECURE ENCLAVE SENSOR READY"}
                                </p>
                                <p className="text-[9px] font-mono text-slate-505 dark:text-white leading-normal px-2 truncate">
                                    {biometricStatus}
                                </p>
                            </div>

                            {isBiometricScanning && (
                                <div className="w-full bg-slate-800 h-1.5 mt-3 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-150" style={{ width: `${biometricProgress}%` }}></div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={handleBiometricScan}
                                disabled={isBiometricScanning || unlockSuccess}
                                className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-2 ${
                                    isBiometricScanning
                                        ? 'bg-slate-800 text-[#0F172A] cursor-not-allowed'
                                        : unlockSuccess
                                            ? 'bg-emerald-500 text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                                            : 'bg-primary text-slate-950 hover:bg-primary-400 hover:shadow-primary/20 shadow-[0_4px_24px_rgba(14,197,242,0.15)]'
                                }`}
                            >
                                {isBiometricScanning ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                                        Scanning Face / Fingerprint...
                                    </>
                                ) : unlockSuccess ? (
                                    <>
                                        <ShieldCheck className="w-4 h-4" />
                                        Verified
                                    </>
                                ) : (
                                    <>
                                        <Fingerprint className="w-4 h-4" />
                                        Scan Biometrics
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setUseManualPassword(true)}
                                className="text-[10px] font-mono text-[#0F172A] hover:text-white uppercase tracking-wider underline cursor-pointer"
                            >
                                Fallback to Master Password
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Password Input Form fallback or default */
                    <form onSubmit={handleUnlock} className="space-y-4 text-left">
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-[#0F172A] font-black uppercase tracking-[0.2em] ml-1">Master Password</label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (error) setError(null);
                                    }}
                                    disabled={isUnlocking || unlockSuccess}
                                    placeholder="••••••••"
                                    className="w-full bg-black border border-slate-200 dark:border-white/10 hover:border-primary/40 focus:border-primary focus:ring-1 focus:ring-primary text-white text-sm px-4 py-3.5 rounded-xl font-mono tracking-widest transition-all outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#0F172A] hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-start gap-2 text-rose-400 text-xs bg-rose-500 border border-rose-500/10 p-3 rounded-xl">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <p className="font-semibold leading-normal">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isUnlocking || !password}
                            className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-2 ${
								unlockSuccess 
									? 'bg-emerald-500 text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.3)]' 
									: 'bg-primary text-slate-950 hover:bg-primary-400 shadow-[0_4px_24px_rgba(14,197,242,0.15)] disabled:opacity-40'
							}`}
                        >
                            {isUnlocking ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Synchornizing Decryption Hash...
                                </>
                            ) : unlockSuccess ? (
                                <>
                                    <ShieldCheck className="w-4 h-4" />
                                    Access Restored!
                                </>
                            ) : (
                                <>
                                    <Unlock className="w-4 h-4" />
                                    Resume Secure Terminal
                                </>
                            )}
                        </button>

                        {requireBiometric && (
                            <div className="text-center mt-3">
                                <button
                                    type="button"
                                    onClick={() => setUseManualPassword(false)}
                                    className="text-[10px] font-mono text-[#0F172A] hover:text-white uppercase tracking-wider underline cursor-pointer"
                                >
                                    Return to Biometric Lock Screen
                                </button>
                            </div>
                        )}
                    </form>
                )}

                {/* Legal & Safe Sandbox Disclaimer */}
                <p className="text-[9px] text-[#0F172A] font-bold uppercase tracking-widest text-center mt-6">
                    🛡️ End-to-End Cryptomining & Quantum Defended Session
                </p>
            </div>

            <style>{`
                @keyframes lock-appear {
                    0% { opacity: 0; transform: scale(0.95) translateY(10px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-lock-appear {
                    animation: lock-appear 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-spin-slow {
                    animation: spin 15s linear infinite;
                }
                @keyframes scan-beam {
                    0% { top: 0%; }
                    50% { top: 100%; }
                    100% { top: 0%; }
                }
                .animate-scan-beam {
                    animation: scan-beam 2.2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};
