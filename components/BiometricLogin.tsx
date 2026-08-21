
import React, { useState, useEffect } from 'react';
import { 
    FaceIdIcon, 
    FingerprintIcon, 
    ShieldCheckIcon, 
    LockClosedIcon, 
    CheckCircleIcon, 
    XCircleIcon,
    SpinnerIcon
} from './Icons';
import { authenticateBiometric, isBiometricAvailable } from '../services/biometricService';

interface BiometricLoginProps {
    onSuccess: () => void;
    onCancel: () => void;
}

type BiometricState = 'idle' | 'scanning' | 'verifying' | 'success' | 'error' | 'locked';

export const BiometricLogin: React.FC<BiometricLoginProps> = ({ onSuccess, onCancel }) => {
    const [state, setState] = useState<BiometricState>('idle');
    const [attempts, setAttempts] = useState(0);
    const [message, setMessage] = useState('Authenticate to access Secure Enclave');
    const [biometricType, setBiometricType] = useState<'face' | 'touch'>('face');

    useEffect(() => {
        // Check availability on mount
        isBiometricAvailable().then(available => {
            if (!available) {
                setMessage("Biometric hardware not detected.");
                setState('error');
            } else {
                // Auto-start scanning for better UX
                handleAuthenticate();
            }
        });

        // Randomly decide type for demo (in real app, use platform detection)
        setBiometricType(Math.random() > 0.5 ? 'face' : 'touch');
    }, []);

    const handleAuthenticate = async () => {
        if (state === 'locked') return;

        setState('scanning');
        setMessage(biometricType === 'face' ? 'Scanning Face Geometry...' : 'Place Finger on Sensor...');

        // Simulate scanning delay for realism
        await new Promise(resolve => setTimeout(resolve, 1500));

        setState('verifying');
        setMessage('Verifying Secure Enclave Signature...');

        try {
            const success = await authenticateBiometric();
            
            if (success) {
                setState('success');
                setMessage('Identity Verified. Decrypting Vault...');
                setTimeout(() => {
                    onSuccess();
                }, 1000);
            } else {
                handleFailure();
            }
        } catch (error) {
            handleFailure();
        }
    };

    const handleFailure = () => {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 3) {
            setState('locked');
            setMessage('Too many failed attempts. Biometrics locked.');
        } else {
            setState('error');
            setMessage('Authentication Failed. Try Again.');
            // Auto-retry after a short delay if not locked
            setTimeout(() => {
                setState('idle');
                setMessage('Authenticate to access Secure Enclave');
            }, 2000);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-100  flex items-center justify-center z-[200] p-4 animate-fade-in">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col items-center p-10 text-center">
                
                {/* Header */}
                <div className="absolute top-6 left-0 right-0 flex justify-center">
                    <div className="flex items-center gap-2 px-4 py-1 bg-white rounded-full border border-slate-100 dark:border-white/10 dark:bg-slate-800">
                        <ShieldCheckIcon className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest">Bank-Grade Security</span>
                    </div>
                </div>

                {/* Main Visual Area */}
                <div className="mt-12 mb-8 relative w-40 h-40 flex items-center justify-center">
                    
                    {/* Scanning Ring Animation */}
                    {state === 'scanning' && (
                        <>
                            <div className="absolute inset-0 border-4 border-primary/30 rounded-full animate-ping"></div>
                            <div className="absolute inset-0 border-4 border-primary/50 rounded-full animate-pulse"></div>
                            <div className="absolute inset-[-20px] border border-primary/20 rounded-full animate-spin-slow"></div>
                        </>
                    )}

                    {/* Success Ring */}
                    {state === 'success' && (
                        <div className="absolute inset-0 bg-emerald-500 rounded-full animate-scale-in">
                            <div className="absolute inset-0 border-4 border-emerald-500 rounded-full"></div>
                        </div>
                    )}

                    {/* Error Ring */}
                    {(state === 'error' || state === 'locked') && (
                        <div className="absolute inset-0 bg-red-500 rounded-full animate-shake">
                            <div className="absolute inset-0 border-4 border-red-500 rounded-full"></div>
                        </div>
                    )}

                    {/* Icon */}
                    <div className="relative z-10 transition-all duration-500 transform">
                        {state === 'success' ? (
                            <CheckCircleIcon className="w-20 h-20 text-emerald-500 animate-bounce-short" />
                        ) : state === 'error' || state === 'locked' ? (
                            <XCircleIcon className="w-20 h-20 text-red-500" />
                        ) : biometricType === 'face' ? (
                            <FaceIdIcon className={`w-20 h-20 ${state === 'scanning' ? 'text-primary animate-pulse' : 'text-[#0F172A] dark:text-white'}`} />
                        ) : (
                            <FingerprintIcon className={`w-20 h-20 ${state === 'scanning' ? 'text-primary animate-pulse' : 'text-[#0F172A] dark:text-white'}`} />
                        )}
                    </div>
                </div>

                {/* Status Text */}
                <h3 className="text-2xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight mb-2 transition-all">
                    {state === 'success' ? 'Authenticated' : 
                     state === 'locked' ? 'Security Lockout' :
                     state === 'scanning' ? 'Scanning...' : 
                     state === 'verifying' ? 'Verifying...' :
                     biometricType === 'face' ? 'Face ID' : 'Touch ID'}
                </h3>
                
                <p className={`text-xs font-bold uppercase tracking-widest mb-8 transition-colors ${
                    state === 'error' || state === 'locked' ? 'text-red-400' : 
                    state === 'success' ? 'text-emerald-400' : 'text-[#0F172A]'
                }`}>
                    {message}
                </p>

                {/* Actions */}
                <div className="w-full space-y-4">
                    {state === 'idle' || state === 'error' ? (
                        <button 
                            onClick={handleAuthenticate}
                            className="w-full py-4 bg-white text-[#0F172A] font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg hover:bg-slate-200 transition-all active:scale-95 dark:bg-slate-800"
                        >
                            Try Again
                        </button>
                    ) : null}

                    <button 
                        onClick={onCancel}
                        className="w-full py-4 bg-transparent border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all hover:bg-white dark:bg-slate-800"
                    >
                        Use Password
                    </button>
                </div>

                {/* Footer Security Badge */}
                <div className="mt-8 flex items-center gap-2 opacity-70">
                    <LockClosedIcon className="w-3 h-3 text-[#0F172A]" />
                    <span className="text-[9px] text-[#0F172A] uppercase tracking-widest">Secured by Apple Secure Enclave</span>
                </div>

            </div>
        </div>
    );
};
