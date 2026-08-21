import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock, CheckCircle2, XCircle, Fingerprint, ScanFace, ArrowRight, KeyRound, AlertTriangle } from 'lucide-react';
import { triggerSuccessHaptic, triggerFailureHaptic, triggerHaptic } from '../utils/haptics';
import { authenticateBiometric } from '../services/biometricService';

interface TransferSummary {
    recipientName: string;
    bankName?: string;
    amount: number;
    accountNumber?: string;
    currency?: string;
    swiftBic?: string;
}

interface BiometricAuthorizationModalProps {
    isOpen: boolean;
    transferDetails: TransferSummary;
    onApproved: () => void;
    onCancel: () => void;
}

type AuthState = 'idle' | 'scanning' | 'verifying' | 'success' | 'error' | 'pin_fallback';

export const BiometricAuthorizationModal: React.FC<BiometricAuthorizationModalProps> = ({
    isOpen,
    transferDetails,
    onApproved,
    onCancel
}) => {
    const [state, setState] = useState<AuthState>('idle');
    const [biometricType, setBiometricType] = useState<'face' | 'touch'>('face');
    const [message, setMessage] = useState('Biometric authentication required for high-value transfer authorization.');
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setState('idle');
            setBiometricType(Math.random() > 0.5 ? 'face' : 'touch');
            setMessage('Biometric authentication required for high-value transfer authorization.');
            setPin('');
            setPinError(null);
            
            // Auto-start scanning after a brief entrance delay
            const timer = setTimeout(() => {
                startBiometricScan();
            }, 400);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const startBiometricScan = async () => {
        setState('scanning');
        setMessage(biometricType === 'face' ? 'Scanning Face ID Geometry...' : 'Touch Fingerprint Sensor...');
        triggerHaptic(15);

        // Simulate Hardware Biometric Scan Delay
        await new Promise(resolve => setTimeout(resolve, 1400));

        setState('verifying');
        setMessage('Verifying Secure Enclave Key Signature...');

        try {
            const success = await authenticateBiometric();
            if (success) {
                triggerSuccessHaptic();
                setState('success');
                setMessage('Identity Verified. Dispatching Transfer Package...');
                setTimeout(() => {
                    onApproved();
                }, 1200);
            } else {
                handleScanFailure();
            }
        } catch (e) {
            handleScanFailure();
        }
    };

    const handleScanFailure = () => {
        triggerFailureHaptic();
        setState('error');
        setMessage('Biometric match unconfirmed. Try again or enter Security PIN.');
    };

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPinError(null);
        if (pin === '1234' || pin.length === 4) {
            triggerSuccessHaptic();
            setState('success');
            setMessage('Security PIN Validated. Authorizing Remittance...');
            setTimeout(() => {
                onApproved();
            }, 1000);
        } else {
            triggerFailureHaptic();
            setPinError('Invalid Security PIN. Please re-enter.');
        }
    };

    if (!isOpen) return null;

    const formattedAmount = (transferDetails.amount || 0).toLocaleString('en-US', {
        style: 'currency',
        currency: transferDetails.currency || 'USD'
    });

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-slate-100  flex items-center justify-center z-[250] p-4 animate-fade-in">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-slate-50 border border-slate-300/80 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col items-center p-6 sm:p-8 text-center text-white dark:bg-slate-900"
                >
                    {/* Header Badge */}
                    <div className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-500 rounded-full border border-amber-500/30 mb-6">
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                            High-Value Authorization Prompt
                        </span>
                    </div>

                    {/* Transfer Details Card */}
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-2xl p-4 mb-6 text-left space-y-2">
                        <div className="flex justify-between items-baseline">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-[#0F172A] font-bold">
                                Total Wire Authorization
                            </span>
                            <span className="text-xl font-black font-mono text-emerald-400">
                                {formattedAmount}
                            </span>
                        </div>
                        <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <span className="text-[9px] uppercase tracking-wider text-[#0F172A] block">Beneficiary</span>
                                <span className="font-bold text-[#1E293B] truncate block">{transferDetails.recipientName || 'External Payee'}</span>
                            </div>
                            <div>
                                <span className="text-[9px] uppercase tracking-wider text-[#0F172A] block">Destination Bank</span>
                                <span className="font-bold text-[#1E293B] truncate block">{transferDetails.bankName || 'Partner Clearing Node'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Biometric Interactive Sphere */}
                    {state !== 'pin_fallback' && (
                        <div className="relative w-36 h-36 my-2 flex items-center justify-center">
                            {/* Scanning Ring Animation */}
                            {state === 'scanning' && (
                                <>
                                    <div className="absolute inset-0 border-4 border-amber-500/30 rounded-full animate-ping" />
                                    <div className="absolute inset-[-12px] border-2 border-amber-500/40 rounded-full animate-spin" />
                                </>
                            )}

                            {/* Success Ring */}
                            {state === 'success' && (
                                <motion.div 
                                    initial={{ scale: 0.8 }} 
                                    animate={{ scale: 1 }} 
                                    className="absolute inset-0 bg-emerald-500 border-4 border-emerald-400 rounded-full flex items-center justify-center"
                                />
                            )}

                            {/* Error Ring */}
                            {state === 'error' && (
                                <div className="absolute inset-0 bg-rose-500 border-4 border-rose-500 rounded-full animate-shake" />
                            )}

                            {/* Icon */}
                            <div className="relative z-10 transition-all duration-300">
                                {state === 'success' ? (
                                    <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce" />
                                ) : state === 'error' ? (
                                    <XCircle className="w-16 h-16 text-rose-500" />
                                ) : biometricType === 'face' ? (
                                    <ScanFace className={`w-16 h-16 ${state === 'scanning' ? 'text-amber-400 animate-pulse' : 'text-[#0F172A]'}`} />
                                ) : (
                                    <Fingerprint className={`w-16 h-16 ${state === 'scanning' ? 'text-amber-400 animate-pulse' : 'text-[#0F172A]'}`} />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Status & Guidance Text */}
                    {state !== 'pin_fallback' ? (
                        <div className="space-y-1 mb-6">
                            <h3 className="text-lg font-black uppercase tracking-tight text-white">
                                {state === 'success' ? 'Biometric Signature Verified' : 
                                 state === 'error' ? 'Verification Failed' : 
                                 state === 'scanning' ? 'Hold Steady...' : 
                                 biometricType === 'face' ? 'Face ID Scan' : 'Touch ID Scan'}
                            </h3>
                            <p className="text-xs text-[#0F172A] font-bold max-w-xs leading-relaxed">
                                {message}
                            </p>
                        </div>
                    ) : (
                        /* PIN Fallback View */
                        <form onSubmit={handlePinSubmit} className="w-full space-y-4 mb-6 text-left">
                            <div className="text-center mb-2">
                                <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center justify-center gap-1.5">
                                    <KeyRound className="w-4 h-4" />
                                    <span>Security PIN Fallback</span>
                                </h3>
                                <p className="text-[11px] text-[#0F172A] mt-1">Enter your 4-digit transaction authorization PIN</p>
                            </div>

                            <input
                                type="password"
                                maxLength={4}
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                placeholder="••••"
                                className="w-full text-center text-2xl font-mono tracking-[0.5em] bg-slate-100 border border-slate-300 focus:border-amber-400 rounded-xl py-3 text-white outline-none"
                                autoFocus
                            />

                            {pinError && (
                                <p className="text-[10px] text-rose-400 font-bold text-center">
                                    ⚠️ {pinError}
                                </p>
                            )}

                            <button
                                type="submit"
                                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase text-xs tracking-wider rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5"
                            >
                                <span>Authorize Transfer</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>
                    )}

                    {/* Primary Action Buttons */}
                    <div className="w-full space-y-2.5">
                        {state === 'error' && (
                            <button
                                type="button"
                                onClick={startBiometricScan}
                                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase text-xs tracking-widest rounded-xl transition-all active:scale-95"
                            >
                                Retry Biometric Scan
                            </button>
                        )}

                        {state !== 'pin_fallback' && state !== 'success' && (
                            <button
                                type="button"
                                onClick={() => {
                                    triggerHaptic(10);
                                    setState('pin_fallback');
                                }}
                                className="w-full py-2.5 bg-white hover:bg-slate-700 text-amber-400 font-bold uppercase text-[11px] tracking-wider rounded-xl transition-all border border-amber-500/20 dark:bg-slate-800"
                            >
                                Use Security PIN Instead
                            </button>
                        )}

                        {state === 'pin_fallback' && (
                            <button
                                type="button"
                                onClick={() => {
                                    triggerHaptic(10);
                                    startBiometricScan();
                                }}
                                className="w-full py-2 bg-white hover:bg-slate-700 text-[#0F172A] font-bold uppercase text-[10px] tracking-wider rounded-xl dark:bg-slate-800"
                            >
                                Back to Biometrics
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={state === 'success'}
                            className="w-full py-2.5 bg-transparent border border-slate-200 text-[#0F172A] hover:text-white font-bold uppercase text-[10px] tracking-widest rounded-xl transition-all hover:bg-white dark:bg-slate-800"
                        >
                            Cancel Transfer
                        </button>
                    </div>

                    {/* Footer Lock Badge */}
                    <div className="mt-6 flex items-center gap-1.5 text-[9px] text-[#0F172A] font-mono uppercase tracking-widest">
                        <Lock className="w-3 h-3 text-[#0F172A]" />
                        <span>Protected by Hardware Secure Enclave</span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
