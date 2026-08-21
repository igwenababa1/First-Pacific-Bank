
import React, { useState } from 'react';
import { SpinnerIcon, LockClosedIcon, XIcon, ShieldCheckIcon, ExclamationCircleIcon, FaceIdIcon } from './Icons';
import { USER_PASSWORD } from './constants';
import { BiometricLogin } from './BiometricLogin';
import { Haptics } from '../utils/haptics';

interface LoginModalProps {
    onClose: () => void;
    onLogin: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showBiometric, setShowBiometric] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsProcessing(true);
        await Haptics.tap();

        if (!navigator.onLine) {
            await Haptics.error();
            setError('No internet connection.');
            setIsProcessing(false);
            return;
        }

        setTimeout(async () => {
            if (password === USER_PASSWORD) {
                await Haptics.success();
                onLogin();
                onClose();
            } else {
                await Haptics.error();
                setError('Incorrect password. Please try again.');
                setIsProcessing(false);
            }
        }, 1000);
    };

    if (showBiometric) {
        return (
            <BiometricLogin 
                onSuccess={() => {
                    onLogin();
                    onClose();
                }}
                onCancel={() => setShowBiometric(false)}
            />
        );
    }

    return (
        <div className="fixed inset-0 bg-black  flex items-center justify-center z-[100] p-4 animate-fade-in relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-slate-950/80 to-black/90 pointer-events-none opacity-50" />

            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-y-auto max-h-[95vh] custom-scrollbar relative animate-fade-in-up z-10">
                <button onClick={() => { Haptics.tap(); onClose(); }} className="absolute top-4 right-4 text-[#0F172A] hover:text-[#0F172A] dark:text-white transition-colors active:scale-90 z-20">
                    <XIcon className="w-6 h-6" />
                </button>
                
                <div className="p-6 md:p-8 text-center">
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-white/10 shadow-md">
                        <LockClosedIcon className="w-8 h-8 text-primary" />
                    </div>
                    
                    <h3 className="text-xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Session Expired</h3>
                    <p className="text-[#0F172A] dark:text-white text-sm mt-2">Please re-authenticate to continue your secure session.</p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <div className="space-y-2 text-left">
                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">Password</label>
                            <input 
                                type="password" 
                                inputMode="text"
                                autoComplete="current-password"
                                value={password} 
                                onChange={e => {
                                    setPassword(e.target.value);
                                    Haptics.selection();
                                }} 
                                className="w-full bg-black border border-slate-200 dark:border-white/10 rounded-xl p-4 text-[#0F172A] dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder-slate-700"
                                placeholder="Enter password"
                                autoFocus
                            />
                            {error && (
                                <div className="flex items-center gap-2 mt-2 text-red-500">
                                    <ExclamationCircleIcon className="w-4 h-4" />
                                    <p className="text-xs font-bold">{error}</p>
                                </div>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            disabled={isProcessing || !password}
                            className="w-full py-4 bg-primary hover:bg-primary-600 active:scale-[0.98] text-[#0F172A] dark:text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isProcessing ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <ShieldCheckIcon className="w-4 h-4" />}
                            {isProcessing ? 'Verifying...' : 'Authenticate'}
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200 dark:border-white/10"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-slate-50 dark:bg-slate-900 px-2 text-[#0F172A] font-bold tracking-widest">Or Secure Login</span>
                            </div>
                        </div>

                        <button 
                            type="button"
                            onClick={() => {
                                Haptics.auth();
                                setShowBiometric(true);
                            }}
                            className="w-full py-4 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-700 active:scale-[0.98] text-[#0F172A] dark:text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 border border-slate-100 dark:border-white/5"
                        >
                            <FaceIdIcon className="w-5 h-5" />
                            Use Face ID / Touch ID
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
