
import React, { useState } from 'react';
import { DevicePhoneMobileIcon, KeypadIcon, XIcon, SpinnerIcon, CheckCircleIcon } from './Icons';
import { sendOtpSmsViaTextFlow } from '../utils/notificationService';
import { UserProfile } from '../types';

interface Setup2FAModalProps {
    onClose: () => void;
    settings: {
        enabled: boolean;
        method: 'sms' | 'app' | 'whatsapp' | null;
    };
    onUpdate: (settings: { enabled: boolean; method: 'sms' | 'app' | 'whatsapp' | null }) => void;
    userProfile: UserProfile;
}

type Step = 'select' | 'verify_sms' | 'verify_app' | 'success';

export const Setup2FAModal: React.FC<Setup2FAModalProps> = ({ onClose, settings, onUpdate, userProfile }) => {
    const [step, setStep] = useState<Step>('select');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Mask the phone number for display (e.g., +1 (***) ***-1234)
    const phone = userProfile.phone || '';
    const phoneDigits = phone.replace(/\D/g, '');
    const displayPhone = phoneDigits.length > 4 
        ? `+1 (***) ***-${phoneDigits.slice(-4)}` 
        : phone || 'Unknown Number';

    const handleEnableSms = async () => {
        if (!userProfile.phone) {
            setError('No phone number associated with this account.');
            return;
        }
        setError('');
        setIsProcessing(true);
        await sendOtpSmsViaTextFlow(userProfile.phone); 
        setIsProcessing(false);
        setStep('verify_sms');
    };

    const handleEnableApp = () => {
        setError('');
        setStep('verify_app');
    };

    const handleResendCode = async () => {
        if (!userProfile.phone) return;
        setError('');
        setIsProcessing(true);
        await sendOtpSmsViaTextFlow(userProfile.phone);
        setIsProcessing(false);
    };

    const handleVerify = () => {
        setError('');
        if (otp.length !== 6) {
            setError('Please enter a valid 6-digit code.');
            return;
        }
        
        setIsProcessing(true);
        setTimeout(() => {
            const method = step === 'verify_sms' ? 'sms' : 'app';
            onUpdate({ enabled: true, method });
            setIsProcessing(false);
            setStep('success');
        }, 1500);
    };

    const handleClearError = () => {
        setError('');
    };

    return (
        <div className="fixed inset-0 bg-slate-100  flex items-center justify-center z-[70] p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden animate-fade-in-up dark:bg-slate-800">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-[#1E293B]">Two-Factor Authentication</h3>
                    <button onClick={onClose} className="p-2 text-[#0F172A] dark:text-white hover:text-[#0F172A] rounded-full hover:bg-slate-100">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6">
                    {step === 'select' && (
                        <div className="space-y-4">
                            <p className="text-sm text-[#0F172A] text-center">Select a method to enable Two-Factor Authentication.</p>
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex justify-between items-center">
                                    <span>{error}</span>
                                    <button onClick={handleClearError} className="text-red-400 hover:text-red-600">
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <button onClick={handleEnableSms} disabled={isProcessing} className="w-full flex items-center space-x-3 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all group dark:bg-slate-900">
                                <div className="p-2 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform dark:bg-slate-800">
                                    <DevicePhoneMobileIcon className="w-6 h-6 text-primary" />
                                </div>
                                <div className="text-left flex-1">
                                    <p className="font-semibold text-[#0F172A]">SMS / WhatsApp</p>
                                    <p className="text-xs text-[#0F172A]">Receive secure codes via text message.</p>
                                </div>
                                {isProcessing && <SpinnerIcon className="w-5 h-5 ml-auto text-primary animate-spin" />}
                            </button>
                            <button onClick={handleEnableApp} className="w-full flex items-center space-x-3 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all group dark:bg-slate-900">
                                <div className="p-2 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform dark:bg-slate-800">
                                    <KeypadIcon className="w-6 h-6 text-primary" />
                                </div>
                                <div className="text-left flex-1">
                                    <p className="font-semibold text-[#0F172A]">Authenticator App</p>
                                    <p className="text-xs text-[#0F172A]">Use Google Authenticator or Authy.</p>
                                </div>
                            </button>
                        </div>
                    )}

                    {step === 'verify_sms' && (
                        <div className="text-center space-y-6">
                             <div>
                                 <h4 className="font-semibold text-[#0F172A]">Verify Code</h4>
                                 <p className="text-sm text-[#0F172A] mt-2">Enter the 6-digit code sent to {displayPhone} via SMS.</p>
                             </div>
                             <input 
                                type="text" 
                                value={otp} 
                                onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }} 
                                maxLength={6} 
                                className="w-48 mx-auto p-3 text-center text-3xl tracking-[0.5em] rounded-md border border-slate-300 focus:ring-2 focus:ring-primary outline-none font-mono" 
                                placeholder="000000" 
                                autoFocus 
                             />
                             {error && (
                                <div className="bg-red-50 text-red-600 p-2 rounded-lg text-xs font-semibold flex justify-between items-center max-w-[200px] mx-auto">
                                    <span>{error}</span>
                                    <button onClick={handleClearError} className="text-red-400 hover:text-red-600">
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                             )}
                             <div className="flex justify-center">
                                 <button 
                                     onClick={handleResendCode} 
                                     disabled={isProcessing}
                                     className="text-primary text-sm font-semibold hover:underline disabled:opacity-70"
                                 >
                                     Resend Code
                                 </button>
                             </div>
                             <div className="flex gap-3">
                                <button onClick={() => { setStep('select'); setError(''); setOtp(''); }} className="flex-1 py-2 text-[#0F172A] font-semibold hover:bg-slate-100 rounded-lg">Back</button>
                                <button onClick={handleVerify} disabled={isProcessing || otp.length !== 6} className="flex-1 py-2 bg-primary text-[#0F172A] dark:text-white font-semibold rounded-lg shadow-md hover:bg-primary-600 disabled:opacity-70 flex justify-center items-center">
                                    {isProcessing ? <SpinnerIcon className="w-5 h-5" /> : 'Verify'}
                                </button>
                             </div>
                        </div>
                    )}

                    {step === 'verify_app' && (
                        <div className="text-center space-y-6">
                             <div>
                                 <h4 className="font-semibold text-[#0F172A]">Setup Authenticator</h4>
                                 <p className="text-sm text-[#0F172A] mt-2">Scan the QR code below with your authenticator app.</p>
                             </div>
                             <div className="w-40 h-40 bg-slate-100 mx-auto rounded-lg flex items-center justify-center border border-slate-200">
                                 <img src="https://quickchart.io/qr?text=otpauth://totp/PremiumReserved:User?secret=JBSWY3DPEHPK3PXP&issuer=PremiumReservedBank&size=150" alt="QR Code" className="w-36 h-36" />
                             </div>
                             <input 
                                type="text" 
                                value={otp} 
                                onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }} 
                                maxLength={6} 
                                className="w-48 mx-auto p-3 text-center text-3xl tracking-[0.5em] rounded-md border border-slate-300 focus:ring-2 focus:ring-primary outline-none font-mono" 
                                placeholder="000000" 
                             />
                             {error && (
                                <div className="bg-red-50 text-red-600 p-2 rounded-lg text-xs font-semibold flex justify-between items-center max-w-[200px] mx-auto">
                                    <span>{error}</span>
                                    <button onClick={handleClearError} className="text-red-400 hover:text-red-600">
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                             )}
                             <div className="flex gap-3">
                                <button onClick={() => { setStep('select'); setError(''); setOtp(''); }} className="flex-1 py-2 text-[#0F172A] font-semibold hover:bg-slate-100 rounded-lg">Back</button>
                                <button onClick={handleVerify} disabled={isProcessing || otp.length !== 6} className="flex-1 py-2 bg-primary text-[#0F172A] dark:text-white font-semibold rounded-lg shadow-md hover:bg-primary-600 disabled:opacity-70 flex justify-center items-center">
                                    {isProcessing ? <SpinnerIcon className="w-5 h-5" /> : 'Enable'}
                                </button>
                             </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircleIcon className="w-10 h-10 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-[#1E293B]">2FA Enabled</h3>
                            <p className="text-[#0F172A] mt-2 text-sm">Your account is now more secure.</p>
                            <button onClick={onClose} className="mt-6 w-full py-2 bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white rounded-lg font-bold hover:bg-slate-100 dark:bg-slate-700">Done</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
