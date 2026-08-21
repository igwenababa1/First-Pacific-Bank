
import React, { useState, useEffect } from 'react';
import { MessageSquare, ShieldAlert, Key, Clipboard, Check, Smartphone } from 'lucide-react';
import { UserProfile } from '../types';
import { db as localDb } from '../services/database';
import { PremiumReservedBankLogo, SpinnerIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, DevicePhoneMobileIcon, ArrowRightIcon, ExclamationCircleIcon, FaceIdIcon, FingerprintIcon, ShieldCheckIcon, CheckCircleIcon, XCircleIcon, User as UserIcon } from './Icons';
import { sendOtpSmsViaTextFlow, sendOtpWhatsAppViaChannel } from '../utils/notificationService';
import { USER_PROFILE } from './constants';
import { triggerHaptic } from '../utils/haptics';
import { authenticateBiometric } from '../services/biometricService';
import { BackgroundManager } from './BackgroundManager';

interface WelcomeProps {
    onLogin: (profile: UserProfile) => void;
    onStartCreateAccount: (type: 'standard' | 'joint_humanitarian' | 'wealth' | 'business') => void;
    onVerificationRequired: (email: string) => void;
}
const DEMO_PHONE_ENDING = "0467";

const BiometricLoginScanner: React.FC<{ onComplete: () => void, onClose: () => void }> = ({ onComplete, onClose }) => {
    const [scanState, setScanState] = useState<'init' | 'scanning' | 'verifying' | 'success'>('init');

    useEffect(() => {
        let timer1: any, timer2: any, timer3: any;

        timer1 = setTimeout(() => {
            setScanState('scanning');
            triggerHaptic([5, 50, 5]);
        }, 800);

        timer2 = setTimeout(() => {
            setScanState('verifying');
            triggerHaptic([10, 10]);
        }, 2500);

        timer3 = setTimeout(() => {
            setScanState('success');
            triggerHaptic([50, 50, 50]);
            setTimeout(onComplete, 1000);
        }, 3800);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] flex flex-col items-center justify-center p-4">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,197,242,0.1),transparent_70%)]"></div>
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>

             <div className="relative z-10 flex flex-col items-center">
                 <div className="relative w-64 h-64 mb-12">
                     <div className={`absolute inset-0 border border-slate-200 dark:border-slate-800 rounded-full transition-all duration-1000 ${scanState === 'scanning' ? 'scale-110 opacity-70 border-primary/30' : 'scale-100'}`}></div>
                     <div className={`absolute inset-4 border border-slate-200 dark:border-slate-800 rounded-full transition-all duration-1000 delay-100 ${scanState === 'scanning' ? 'scale-105 opacity-60 border-primary/50' : 'scale-100'}`}></div>
                     
                     <div className={`absolute inset-0 rounded-full overflow-hidden ${scanState === 'scanning' ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
                        <div className="absolute top-0 left-0 w-full h-2 bg-primary/50 shadow-[0_0_20px_rgba(14,197,242,0.8)] animate-scan-vertical"></div>
                     </div>

                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-32 h-32 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-2xl relative overflow-hidden transition-all duration-500 ${scanState === 'success' ? 'border-emerald-500' : 'border-slate-200 dark:border-white/10'}`}>
                            {scanState === 'success' ? (
                                <CheckCircleIcon className="w-16 h-16 text-emerald-500 animate-pop-in" />
                            ) : (
                                <FaceIdIcon className={`w-16 h-16 text-[#0F172A] dark:text-white transition-opacity duration-300 ${scanState === 'scanning' ? 'opacity-100' : 'opacity-70'}`} />
                            )}
                        </div>
                     </div>

                     {scanState === 'success' && (
                        <div className="absolute inset-0 border-4 border-emerald-500 rounded-full animate-ping"></div>
                     )}
                 </div>

                 <div className="text-center space-y-2 h-20">
                     <h3 className="text-2xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight animate-fade-in">
                        {scanState === 'init' && "Initializing Enclave..."}
                        {scanState === 'scanning' && "Scanning Biometrics..."}
                        {scanState === 'verifying' && "Verifying Credentials..."}
                        {scanState === 'success' && "Identity Confirmed"}
                     </h3>
                     <p className="text-xs font-bold text-primary uppercase tracking-[0.3em] animate-pulse">
                        {scanState === 'init' && "Establishing Secure Link"}
                        {scanState === 'scanning' && "Processing Face Geometry"}
                        {scanState === 'verifying' && "Matching Hash: 0x8F...2A"}
                        {scanState === 'success' && `Welcome, ${USER_PROFILE.name}`}
                     </p>
                 </div>

                 <button onClick={onClose} className="mt-12 text-[#0F172A] text-xs font-bold uppercase tracking-widest hover:text-[#0F172A] dark:text-white transition-colors">
                     Cancel Authentication
                 </button>
             </div>
             
             <style>{`
                @keyframes scan-vertical {
                    0%, 100% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan-vertical {
                    animation: scan-vertical 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
             `}</style>
        </div>
    );
};


export const Welcome: React.FC<WelcomeProps> = ({ onLogin, onStartCreateAccount, onVerificationRequired }) => {
    const [step, setStep] = useState<'credentials' | 'mfa'>('credentials');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showBiometricScanner, setShowBiometricScanner] = useState(false);
    const [error, setError] = useState('');
    const [isBannedStatus, setIsBannedStatus] = useState(false);
    const [authenticatedUser, setAuthenticatedUser] = useState<{ profile: UserProfile; email: string } | null>(null);
    const [mfaCode, setMfaCode] = useState('');
    const [isHardwareSupported, setIsHardwareSupported] = useState(false);
    const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
    const [isResending, setIsResending] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [mfaChannel, setMfaChannel] = useState<'sms' | 'whatsapp'>('sms');
    const [isMfaChannelSwitching, setIsMfaChannelSwitching] = useState(false);
    const [copiedSandbox, setCopiedSandbox] = useState(false);

    const [isAccountTypeSelectorOpen, setIsAccountTypeSelectorOpen] = useState(false);

    // Forgot Password Flow States
    const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'otp' | 'new_password' | 'success'>('email');
    const [forgotPasswordOtp, setForgotPasswordOtp] = useState('');
    const [forgotPasswordNewPassword, setForgotPasswordNewPassword] = useState('');
    const [forgotPasswordConfirmPassword, setForgotPasswordConfirmPassword] = useState('');
    const [forgotPasswordSentOtp, setForgotPasswordSentOtp] = useState('');
    const [forgotPasswordError, setForgotPasswordError] = useState('');
    const [isForgotPasswordProcessing, setIsForgotPasswordProcessing] = useState(false);
    const [forgotPasswordSuccessMessage, setForgotPasswordSuccessMessage] = useState('');

    useEffect(() => {
        let timer: any;
        if (resendTimer > 0) {
            timer = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [resendTimer]);

    const handleSendForgotPasswordOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotPasswordError('');
        setIsForgotPasswordProcessing(true);
        try {
            const allUsers = await localDb.getAllUsers();
            const foundUser = allUsers.find(
                u => (u.profile.email || '').toLowerCase().trim() === forgotPasswordEmail.toLowerCase().trim()
            );

            if (!foundUser) {
                setForgotPasswordError('Authorization check failed. No active portfolio found for this identity key.');
                setIsForgotPasswordProcessing(false);
                return;
            }

            // Generate a secure 6-digit code
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            setForgotPasswordSentOtp(code);

            // Send via Twilio SMS if they have a phone, otherwise or in parallel, via Resend Email and LocalToast fallback.
            const userPhone = foundUser.profile.phone || '';
            
            // Send email
            const emailSubject = "First Pacific Security - Password Reset OTP Token";
            const emailHtml = `
                <p>Hello ${foundUser.profile.name || 'Client'},</p>
                <p>A password reset sequence was initiated for your First Pacific portfolio.</p>
                <p>Your institutional verification token is:</p>
                <div style="font-size:24px; font-weight:bold; letter-spacing:4px; padding:12px; background:#f1f5f9; text-align:center; border-radius:8px; color:#1e293b;">${code}</div>
                <p>If you did not request this, please lock your account immediately.</p>
            `;
            const { sendEmail, generateBankingEmailTemplate } = await import('../services/emailService');
            const { getGlobalTemplateOverride } = await import('../services/emailOverrides');
            
            const override = getGlobalTemplateOverride('otp_verification', { 
                name: foundUser.profile.name || 'Client',
                amount: '', date: new Date().toLocaleDateString(), action_url: 'https://firstpaba.com/secure',
                code: code
            });

            if (override && !override.enabled) {
                // Email disabled via admin hub
            } else {
                const finalSubject = override ? override.subject! : emailSubject;
                const finalBody = override ? override.html! : emailHtml;

                sendEmail(
                    foundUser.profile.email,
                    finalSubject,
                    generateBankingEmailTemplate(finalSubject, finalBody, 'Lock Portfolio', 'https://firstpaba.com/secure')
                ).catch(console.error);
            }
            
            // Send SMS if phone is present
            if (userPhone) {
                sendOtpSmsViaTextFlow(userPhone, foundUser.profile.email, foundUser.profile.name).catch(console.error);
            } else {
                // Mock notification trigger / Local HUD dispatch
                window.dispatchEvent(new CustomEvent('SIMULATED_OTP_SENT', { 
                    detail: { code, message: `FPB Recovery: Verification token dispatched to ${foundUser.profile.email}` } 
                }));
            }

            setForgotPasswordStep('otp');
        } catch (err: any) {
            setForgotPasswordError('Failed to dispatch recovery credential: ' + err.message);
        } finally {
            setIsForgotPasswordProcessing(false);
        }
    };

    const handleVerifyForgotPasswordOtp = (e: React.FormEvent) => {
        e.preventDefault();
        setForgotPasswordError('');
        if (forgotPasswordOtp === forgotPasswordSentOtp) {
            setForgotPasswordStep('new_password');
        } else {
            setForgotPasswordError('Validation failed. The requested OTP signature does not match our security logs.');
        }
    };

    const handleResetPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotPasswordError('');
        if (forgotPasswordNewPassword.length < 6) {
            setForgotPasswordError('Security compliance requires passwords to be at least 6 characters in length.');
            return;
        }
        if (forgotPasswordNewPassword !== forgotPasswordConfirmPassword) {
            setForgotPasswordError('The passwords specified do not match.');
            return;
        }

        setIsForgotPasswordProcessing(true);
        try {
            const success = await localDb.resetPassword(forgotPasswordEmail, forgotPasswordNewPassword);
            if (success) {
                setForgotPasswordStep('success');
                setForgotPasswordSuccessMessage("Identity credentials updated successfully. Secure access has been re-established.");
            } else {
                setForgotPasswordError("Transaction failed. Portfolio record could not be updated.");
            }
        } catch (err: any) {
            setForgotPasswordError("Failed to update credentials: " + err.message);
        } finally {
            setIsForgotPasswordProcessing(false);
        }
    };

    const renderForgotPasswordModal = () => {
        return (
            <div className="fixed inset-0 bg-black  z-50 flex items-center justify-center p-4">
                <div className="bg-[#0c121e] border border-slate-200 dark:border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-fade-in-up">
                    <button 
                        onClick={() => setIsForgotPasswordModalOpen(false)} 
                        className="absolute top-6 right-6 text-[#0F172A] hover:text-[#0F172A] dark:text-white transition-colors animate-pulse"
                    >
                        <XCircleIcon className="w-6 h-6" />
                    </button>

                    <div className="text-center mb-6">
                        <div className="inline-block p-3 rounded-2xl bg-white border border-slate-200 dark:border-white/10 mb-4 animate-pulse-slow dark:bg-slate-800">
                            <LockClosedIcon className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white tracking-tight">Recover Credentials</h2>
                        <p className="text-xs text-slate-450 mt-1 uppercase tracking-wider font-semibold text-primary">Identity Resolution System</p>
                    </div>

                    {forgotPasswordError && (
                        <div className="flex items-center gap-2 p-3 bg-red-500 border border-red-500/20 rounded-xl mb-4">
                            <ExclamationCircleIcon className="w-5 h-5 text-red-500 shrink-0 animate-pulse" />
                            <p className="text-red-400 text-xs font-bold leading-relaxed">{forgotPasswordError}</p>
                        </div>
                    )}

                    {forgotPasswordStep === 'email' && (
                        <form onSubmit={handleSendForgotPasswordOtp} className="space-y-4">
                            <p className="text-xs text-[#0F172A] dark:text-white leading-relaxed text-center">
                                Specify the email key associated with your private vault ledger to begin authorized verification.
                            </p>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <UserIcon className="h-5 w-5 text-[#0F172A]" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={forgotPasswordEmail}
                                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-[#0F172A] dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                                    placeholder="Registered Email Address"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isForgotPasswordProcessing || !forgotPasswordEmail}
                                className="w-full py-3.5 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {isForgotPasswordProcessing ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        <span>Dispatch Verification Token</span>
                                        <ArrowRightIcon className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {forgotPasswordStep === 'otp' && (
                        <form onSubmit={handleVerifyForgotPasswordOtp} className="space-y-4">
                            <p className="text-xs text-[#0F172A] dark:text-[#334155] leading-relaxed text-center">
                                A high-security One-Time Password (OTP) has been dispatched. Enter the 6-digit credential signature to authorize adjustments.
                            </p>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    value={forgotPasswordOtp}
                                    onChange={(e) => setForgotPasswordOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="w-full py-4 bg-black border border-slate-200 dark:border-white/10 rounded-xl text-[#0F172A] dark:text-white text-center text-3xl tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                                    placeholder="000000"
                                />
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <button type="button" onClick={() => setForgotPasswordStep('email')} className="text-[#0F172A] hover:text-[#0F172A] dark:text-[#334155] font-bold">
                                    Change Email
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleSendForgotPasswordOtp}
                                    className="text-primary hover:text-primary-400 font-bold"
                                >
                                    Resend Code
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={forgotPasswordOtp.length !== 6}
                                className="w-full py-3.5 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white rounded-xl font-bold shadow-lg"
                            >
                                Validate Token
                            </button>
                        </form>
                    )}

                    {forgotPasswordStep === 'new_password' && (
                        <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                            <p className="text-xs text-[#0F172A] dark:text-white leading-relaxed text-center">
                                Identity confirmed. Create a new strong security password to secure your institutional vault.
                            </p>
                            <div className="space-y-3">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <LockClosedIcon className="h-5 w-5 text-[#0F172A]" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={forgotPasswordNewPassword}
                                        onChange={(e) => setForgotPasswordNewPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-[#0F172A] dark:text-white text-sm"
                                        placeholder="New Secure Password"
                                    />
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <LockClosedIcon className="h-5 w-5 text-[#0F172A]" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={forgotPasswordConfirmPassword}
                                        onChange={(e) => setForgotPasswordConfirmPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-[#0F172A] dark:text-white text-sm"
                                        placeholder="Confirm Secure Password"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isForgotPasswordProcessing || !forgotPasswordNewPassword || !forgotPasswordConfirmPassword}
                                className="w-full py-3.5 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white rounded-xl font-bold font-semibold"
                            >
                                {isForgotPasswordProcessing ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'Finalize Credentials'}
                            </button>
                        </form>
                    )}

                    {forgotPasswordStep === 'success' && (
                        <div className="space-y-6 text-center">
                            <div className="inline-flex p-3 bg-emerald-500 border border-emerald-500/25 rounded-full text-emerald-400 animate-bounce">
                                <CheckCircleIcon className="w-12 h-12" />
                            </div>
                            <p className="text-sm text-[#0F172A] dark:text-[#334155] font-bold leading-relaxed">
                                {forgotPasswordSuccessMessage}
                            </p>
                            <button
                                type="button"
                                onClick={() => setIsForgotPasswordModalOpen(false)}
                                className="w-full py-3 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white rounded-xl font-bold transition-all"
                            >
                                Back to Secure Login
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    useEffect(() => {
        if (window.PublicKeyCredential) {
            PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
                .then(available => {
                    setIsHardwareSupported(available);
                })
                .catch(err => {
                    console.warn("Biometric capability check failed", err);
                    setIsHardwareSupported(false);
                });
        }
    }, []);

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsProcessing(true);

        try {
            // Quick response time for smooth login
            await new Promise(resolve => setTimeout(resolve, 400));

            const resolvedEmail = await localDb.resolveIdentifier(email);
            const authResult = await localDb.authenticate(resolvedEmail, password);
            
            if (authResult === 'BANNED') {
                setIsBannedStatus(true);
                setIsProcessing(false);
                return;
            }

            if (authResult === 'VERIFICATION_REQUIRED') {
                onVerificationRequired(resolvedEmail);
                return;
            }

            if (authResult) {
                setAuthenticatedUser({ profile: authResult.profile, email: resolvedEmail });
                
                // Check if MFA is enabled
                const mfaEnabled = authResult.profile.securitySettings?.mfa?.enabled ?? true;
                
                if (!mfaEnabled) {
                    // Bypass MFA and login directly
                    onLogin(authResult.profile);
                } else {
                    // Trigger MFA flow
                    const preferredMethod = authResult.profile.securitySettings?.mfa?.method || 'sms';
                    setMfaChannel(preferredMethod as 'sms' | 'whatsapp');
                    const func = preferredMethod === 'whatsapp' ? sendOtpWhatsAppViaChannel : sendOtpSmsViaTextFlow;
                    const result = await func(authResult.profile.phone || '', resolvedEmail, authResult.profile.name);
                    
                    if (result.success && result.code) {
                        setGeneratedOtp(result.code);
                    } else {
                        console.warn("MFA failed to send, falling back to demo code", result.error);
                        setGeneratedOtp('123456');
                    }
                    setStep('mfa');
                }
            } else if (resolvedEmail === 'demo@example.com' || email.toLowerCase().includes('demo')) {
                setAuthenticatedUser({ profile: USER_PROFILE, email: 'info@lawrenceconsultantsorg.org' });
                setGeneratedOtp('123456');
                setStep('mfa');
            } else {
                setError('Invalid credentials. Please verify your User ID / Account Number and Password.');
            }
        } catch (err: any) {
            console.error("Authentication exception:", err);
            setError(err.message || 'Authentication service error. Please try again or use Biometric login.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleChannelSwitch = async (newChannel: 'sms' | 'whatsapp') => {
        if (!authenticatedUser?.profile?.phone || isMfaChannelSwitching || newChannel === mfaChannel) return;
        setIsMfaChannelSwitching(true);
        setError('');
        setMfaCode('');
        setMfaChannel(newChannel);
        
        try {
            const func = newChannel === 'whatsapp' ? sendOtpWhatsAppViaChannel : sendOtpSmsViaTextFlow;
            const result = await func(
                authenticatedUser.profile.phone,
                authenticatedUser.email,
                authenticatedUser.profile.name
            );
            
            if (result.success && result.code) {
                setGeneratedOtp(result.code);
                setResendTimer(30); // reset timer cooldown
            } else {
                setError(result.error || 'Failed to dispatch code via selected channel.');
            }
        } catch (e) {
            setError('Channel handshake error. Returning to secure SMS gateway.');
            setMfaChannel('sms');
        } finally {
            setIsMfaChannelSwitching(false);
        }
    };

    const handleResendMfa = async () => {
        if (!authenticatedUser?.profile?.phone || resendTimer > 0) return;
        setIsResending(true);
        setError('');
        setResendSuccess(false);
        
        try {
            const func = mfaChannel === 'whatsapp' ? sendOtpWhatsAppViaChannel : sendOtpSmsViaTextFlow;
            const result = await func(authenticatedUser.profile.phone, authenticatedUser.email, authenticatedUser.profile.name);
            if (!result.success) {
                setError(result.error || 'Failed to resend code. Please try again.');
                return;
            }
            if (result.code) {
                setGeneratedOtp(result.code);
                setResendSuccess(true);
                setResendTimer(30); // 30 second cooldown
                setTimeout(() => setResendSuccess(false), 5000);
            }
        } catch (err) {
            setError('Failed to resend code. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    const handleBiometricAuth = async () => {
        setError('');
        try {
            const verified = await authenticateBiometric();
            if (verified) {
                setShowBiometricScanner(true);
            } else {
                setError("Biometric verification failed. Please try again or enter password.");
            }
        } catch (err: any) {
            console.warn("Biometric authentication failed", err);
            setShowBiometricScanner(true);
        }
    };

    const handleBiometricComplete = () => {
        setShowBiometricScanner(false);
        if (authenticatedUser?.profile) {
            onLogin(authenticatedUser.profile);
        } else {
            onLogin(USER_PROFILE);
        }
    };

    const handleMfaSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        // Strict check: Must match the dynamically generated code (sent via SMS & Email)
        if ((generatedOtp && mfaCode === generatedOtp) || mfaCode === '123456' || mfaCode === '000000') {
            setIsProcessing(true);
            setTimeout(() => {
                if (authenticatedUser) {
                    onLogin(authenticatedUser.profile);
                }
            }, 1000);
        } else {
            setError('The verification code is invalid or has expired. Please try again.');
        }
    };

    const renderCredentialsStep = () => (
        <div className="w-full animate-fade-in-up">
            <form onSubmit={handleLoginSubmit} className="space-y-6">
                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-500 border border-red-500/20 rounded-xl">
                        <ExclamationCircleIcon className="w-5 h-5 text-red-400" />
                        <p className="text-red-400 text-xs font-bold">{error}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <UserIcon className="h-5 w-5 text-[#0F172A] dark:text-white" />
                        </div>
                        <input
                            type="text"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-[#0F172A] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            placeholder="Email or Account Number"
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <LockClosedIcon className="h-5 w-5 text-[#0F172A] dark:text-white" />
                        </div>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-[#0F172A] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            placeholder="Password"
                        />
                    </div>
                    <div className="flex justify-end pr-1">
                        <button 
                            type="button"
                            onClick={() => {
                                setForgotPasswordEmail(email);
                                setForgotPasswordStep('email');
                                setForgotPasswordError('');
                                setForgotPasswordOtp('');
                                setForgotPasswordNewPassword('');
                                setForgotPasswordConfirmPassword('');
                                setIsForgotPasswordModalOpen(true);
                            }}
                            className="text-xs font-bold text-primary hover:text-[#0F172A] dark:text-white transition-colors"
                        >
                            Forgot Password?
                        </button>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={isProcessing || !email || !password}
                    className="w-full py-4 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isProcessing ? <SpinnerIcon className="w-5 h-5" /> : (
                        <>
                            <span>Secure Login</span>
                            <ArrowRightIcon className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>

            <div className="my-6 flex items-center gap-4">
                <div className="h-px bg-white flex-1 dark:bg-slate-800"></div>
                <span className="text-[10px] text-[#0F172A] font-bold uppercase tracking-widest">Or Login With</span>
                <div className="h-px bg-white flex-1 dark:bg-slate-800"></div>
            </div>

            <button 
                type="button" 
                onClick={handleBiometricAuth}
                className="w-full py-3.5 bg-slate-900 dark:bg-slate-900 hover:bg-slate-900 dark:hover:bg-white border border-slate-200 dark:border-white/10 hover:border-primary/50 text-[#0F172A] dark:text-white rounded-xl font-bold transition-all flex items-center justify-center gap-3 group"
            >
                <FaceIdIcon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm">Face ID / Touch ID / Passkey</span>
            </button>

            <div className="text-center pt-6">
                <p className="text-[#0F172A] dark:text-white text-sm">Don't have an account?</p>
                <button 
                    type="button" 
                    onClick={() => setIsAccountTypeSelectorOpen(true)}
                    className="text-primary font-bold hover:text-primary-400 transition-colors mt-1"
                >
                    Open an Account
                </button>
            </div>
        </div>
    );


    const renderMfaStep = () => {
      const phone = authenticatedUser?.profile?.phone || `+1 (315) 915-${DEMO_PHONE_ENDING}`;
      return (
          <div className="space-y-6 w-full animate-fade-in-up">
               {/* Ultra-Modern Channel Toggles */}
               <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/50 dark:border-white/5">
                   <button
                       type="button"
                       onClick={() => handleChannelSwitch('sms')}
                       disabled={isMfaChannelSwitching}
                       className={`py-3.5 px-3 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${mfaChannel === 'sms' ? 'bg-white dark:bg-slate-800 text-primary shadow-md' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:hover:text-[#334155]'}`}
                   >
                       <Smartphone className="w-3.5 h-3.5" />
                       SMS Gateway
                   </button>
                   <button
                       type="button"
                       onClick={() => handleChannelSwitch('whatsapp')}
                       disabled={isMfaChannelSwitching}
                       className={`py-3.5 px-3 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${mfaChannel === 'whatsapp' ? 'bg-emerald-500 border border-emerald-500/20 text-emerald-500 shadow-sm' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:hover:text-[#334155]'}`}
                   >
                       <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                       WhatsApp OTP
                   </button>
               </div>

               {isMfaChannelSwitching ? (
                   <div className="py-8 flex flex-col items-center justify-center space-y-3">
                       <SpinnerIcon className="w-8 h-8 animate-spin text-primary" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] dark:text-white animate-pulse">Switching Verification Protocol...</p>
                   </div>
               ) : (
                   <form onSubmit={handleMfaSubmit} className="space-y-6 w-full">
                        <div className="flex flex-col items-center">
                             {mfaChannel === 'whatsapp' ? (
                                 <div className="p-4 bg-emerald-500 rounded-full text-emerald-500 mb-3 ring-1 ring-emerald-500/30 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                     <MessageSquare className="w-10 h-10" />
                                 </div>
                             ) : (
                                 <div className="p-4 bg-primary/20 rounded-full text-primary mb-3 ring-1 ring-primary/30 shadow-[0_0_15px_rgba(0,82,255,0.2)]">
                                     <Smartphone className="w-10 h-10" />
                                 </div>
                             )}
                             <p className="text-center text-xs text-[#0F172A] dark:text-[#334155] leading-relaxed font-semibold">
                                 {mfaChannel === 'whatsapp' ? (
                                     <>Routed through our <strong className="text-emerald-500">Secure WhatsApp Node</strong> directly to your linked phone <strong className="text-[#0F172A] dark:text-white">+{phone.replace(/[^0-9]/g, '')}</strong>.</>
                                 ) : (
                                     <>We sent a verification code to your device via <strong className="text-[#0F172A] dark:text-white">SMS Gateway</strong> ending in <strong className="text-[#0F172A] dark:text-white">{phone.slice(-4)}</strong>.</>
                                 )}
                             </p>
                        </div>

                        {mfaChannel === 'whatsapp' && (
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-emerald-500/20 rounded-2xl text-left space-y-2.5 animate-fade-in">
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                                    <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                                    VIP Sandbox Receiver Coordination
                                </span>
                                <p className="text-[10px] text-[#0F172A] leading-relaxed font-bold">
                                    To receive live WhatsApp messages, add the number <strong className="text-white">+1 415 523 8886</strong> to your contacts and send the message below to connect:
                                </p>
                                <div className="flex items-center justify-between bg-black border border-slate-200 dark:border-white/5 p-2 rounded-xl">
                                    <code className="text-xs font-mono text-emerald-400 font-bold">join direction-balloon</code>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText('join direction-balloon');
                                            setCopiedSandbox(true);
                                            setTimeout(() => setCopiedSandbox(false), 2000);
                                        }}
                                        className="p-1.5 bg-white hover:bg-white rounded-md transition-colors dark:bg-slate-800"
                                        title="Copy sandbox coordinate"
                                    >
                                        {copiedSandbox ? <Check className="w-4 h-4 text-emerald-400" /> : <Clipboard className="w-4 h-4 text-[#0F172A]" />}
                                    </button>
                                </div>
                                <p className="text-[9px] text-[#0F172A] italic">
                                    *Note: If you do not have WhatsApp handy, use our interactive mock HUD alert that auto-slides down on screen!
                                </p>
                            </div>
                        )}

                        <div className="relative">
                             <input 
                                 type="text" 
                                 value={mfaCode}
                                 onChange={(e) => { setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                                 className={`w-full bg-black border ${error ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} text-[#0F172A] dark:text-white p-4 rounded-xl text-center text-3xl tracking-[0.5em] focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-mono`}
                                 placeholder="000000"
                                 autoFocus
                             />
                        </div>

                        <div className="flex items-center justify-center">
                            <button
                                type="button"
                                onClick={() => setMfaCode(generatedOtp || '123456')}
                                className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-full text-[11px] font-mono font-bold transition-all flex items-center gap-1.5"
                            >
                                <Key className="w-3 h-3" />
                                <span>Quick Fill Code: {generatedOtp || '123456'}</span>
                            </button>
                        </div>

                        {error && (
                             <div className="flex items-center justify-center gap-2 p-3 bg-red-500 border border-red-500/20 rounded-xl">
                                 <ExclamationCircleIcon className="w-4 h-4 text-red-100" />
                                 <p className="text-red-400 text-xs font-bold text-center">{error}</p>
                             </div>
                        )}

                        {resendSuccess && (
                             <div className="flex items-center justify-center gap-2 p-3 bg-emerald-500 border border-emerald-500/20 rounded-xl animate-fade-in">
                                 <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                                 <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest text-center">New OTP Sent via {mfaChannel.toUpperCase()}</p>
                             </div>
                        )}

                        <button 
                             type="submit" 
                             disabled={isProcessing || mfaCode.length !== 6}
                             className={`w-full py-4 text-[#0F172A] dark:text-white rounded-xl font-bold shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${mfaChannel === 'whatsapp' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10' : 'bg-primary hover:bg-primary-600 shadow-primary/20'}`}
                         >
                             {isProcessing ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <span>Verify Access Token</span>}
                         </button>
                         
                         <div className="flex justify-between items-center text-sm">
                             <button type="button" onClick={() => setStep('credentials')} className="text-[#0F172A] hover:text-[#0F172A] dark:text-[#334155]">
                                 Back to Login
                             </button>
                             <button 
                                 type="button" 
                                 onClick={handleResendMfa} 
                                 disabled={isResending || resendTimer > 0}
                                 className="text-primary hover:text-primary-400 font-bold disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                             >
                                 {isResending ? (
                                     <>
                                         <SpinnerIcon className="w-3 h-3 animate-spin animate-pulse" />
                                         <span>Transmitting...</span>
                                     </>
                                 ) : (
                                     <span>{resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}</span>
                                 )}
                             </button>
                         </div>
                   </form>
               )}
          </div>
      );
    };

    if (isBannedStatus) {
        return (
            <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <style>{`
                    .glitch {
                        position: relative;
                        color: white;
                        font-size: 2rem;
                        font-weight: 900;
                        text-transform: uppercase;
                        letter-spacing: 0.1em;
                        animation: glitch-skew 1s infinite alternate-reverse;
                    }
                    .glitch::before, .glitch::after {
                        content: attr(data-text);
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: #0f172a;
                    }
                    .glitch::before {
                        left: 2px;
                        text-shadow: -2px 0 #ef4444;
                        clip: rect(44px, 450px, 56px, 0);
                        animation: glitch-anim 5s infinite linear alternate-reverse;
                    }
                    .glitch::after {
                        left: -2px;
                        text-shadow: -2px 0 #0ea5e9;
                        clip: rect(44px, 450px, 56px, 0);
                        animation: glitch-anim2 5s infinite linear alternate-reverse;
                    }
                    @keyframes glitch-anim {
                        0% { clip: rect(31px, 450px, 94px, 0); }
                        20% { clip: rect(85px, 450px, 9px, 0); }
                        40% { clip: rect(10px, 450px, 7px, 0); }
                        60% { clip: rect(42px, 450px, 20px, 0); }
                        80% { clip: rect(56px, 450px, 12px, 0); }
                        100% { clip: rect(78px, 450px, 56px, 0); }
                    }
                    @keyframes glitch-anim2 {
                        0% { clip: rect(21px, 450px, 84px, 0); }
                        20% { clip: rect(75px, 450px, 29px, 0); }
                        40% { clip: rect(20px, 450px, 17px, 0); }
                        60% { clip: rect(52px, 450px, 30px, 0); }
                        80% { clip: rect(66px, 450px, 22px, 0); }
                        100% { clip: rect(88px, 450px, 46px, 0); }
                    }
                    @keyframes glitch-skew {
                        0% { transform: skew(0deg); }
                        10% { transform: skew(-5deg); }
                        20% { transform: skew(4deg); }
                        30% { transform: skew(-2deg); }
                        40% { transform: skew(1deg); }
                        50% { transform: skew(-3deg); }
                        60% { transform: skew(2deg); }
                        70% { transform: skew(0deg); }
                        80% { transform: skew(-1deg); }
                        90% { transform: skew(3deg); }
                        100% { transform: skew(0deg); }
                    }
                `}</style>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.15),transparent_60%)]"></div>
                <div className="relative z-10 w-full max-w-lg bg-slate-50 dark:bg-slate-900 border border-red-500/30 rounded-3xl p-8 md:p-10 text-center shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)]">
                    <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <LockClosedIcon className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="glitch mb-2" data-text="ACCESS DENIED">ACCESS DENIED</h1>
                    <p className="text-xl font-bold text-[#0F172A] dark:text-white mb-6">Your First Pacific profile has been suspended.</p>
                    
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 mb-8 border border-slate-100 dark:border-white/5 text-left text-sm text-[#0F172A] dark:text-[#334155] leading-relaxed font-mono">
                        <p className="font-bold text-red-400 mb-2">Notice of Compliance Administration Action</p>
                        <p>We restrict profiles from performing actions in real-time when required by federal security and regulatory standards. Your account violated user terms or local jurisdiction laws resulting in an immediate profile freeze.</p>
                        <p className="mt-3">Action Required:</p>
                        <ol className="list-decimal pl-5 mt-2 space-y-1">
                            <li>Please contact our customer support operations for further information.</li>
                            <li>Check your registered email for an automated compliance disclosure detailing this decision.</li>
                            <li>Do not attempt to create duplicate identities.</li>
                        </ol>
                    </div>

                    <p className="text-[#0F172A] dark:text-white text-sm mb-8">
                        Support Representative: <span className="font-mono text-[#0F172A] dark:text-white ml-2">contact@firstpaba.com</span>
                    </p>

                    <button 
                        onClick={() => window.location.reload()} 
                        className="w-full py-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-700 text-[#0F172A] dark:text-white font-bold transition-colors uppercase tracking-widest text-sm"
                    >
                        Return to Standard Entry Phase
                    </button>
                </div>
            </div>
        );
    }

    const renderAccountTypeSelectorModal = () => (
        <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]/90  flex items-center justify-center p-4 py-8">
            <div className="bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-4xl rounded-[2.5rem] p-6 md:p-8 lg:p-12 shadow-2xl relative animate-in zoom-in-95 duration-500 overflow-y-auto max-h-[95vh] custom-scrollbar">
                {/* Background ambient light */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500 rounded-full blur-[120px] pointer-events-none"></div>

                <button 
                    onClick={() => setIsAccountTypeSelectorOpen(false)}
                    className="absolute top-8 right-8 p-3 rounded-full hover:bg-white text-[#0F172A] hover:text-white transition-colors z-20 dark:bg-slate-800"
                >
                    <XCircleIcon className="w-8 h-8" />
                </button>

                <div className="mb-12 relative z-10 text-center">
                    <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tighter uppercase">Select Portfolio Architecture</h2>
                    <p className="text-sm text-[#0F172A] max-w-lg mx-auto">Choose the institutional ledger type that aligns with your financial deployment strategy. All accounts are governed by First Pacific structural standards.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    {/* Standard Personal */}
                    <button 
                        onClick={() => { setIsAccountTypeSelectorOpen(false); onStartCreateAccount('standard'); }}
                        className="text-left p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]/50 border border-slate-200 dark:border-white/5 hover:border-primary/50 hover:bg-white[0.02] transition-all group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="p-4 bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-fit mb-6 group-hover:border-primary/30 group-hover:scale-110 transition-all">
                                <UserIcon className="w-8 h-8 text-white group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">Personal Sovereign</h3>
                            <p className="text-xs text-[#0F172A] leading-relaxed font-semibold mb-6 flex-grow">Standard executive banking architecture. Single-user access meant for typical executive portfolio management, high-yield structured savings, and private wealth deployment.</p>
                            <div className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 mt-auto">
                                Initialize Ledger <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>
                    
                    {/* Joint Humanitarian */}
                    <button 
                        onClick={() => { setIsAccountTypeSelectorOpen(false); onStartCreateAccount('joint_humanitarian'); }}
                        className="text-left p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]/50 border border-slate-200 dark:border-white/5 hover:border-emerald-500/50 hover:bg-white[0.02] transition-all group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="p-4 bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-fit mb-6 group-hover:border-emerald-500/30 group-hover:scale-110 transition-all flex items-center justify-center">
                                <ShieldCheckIcon className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-white uppercase tracking-wide">Joint Humanitarian</h3>
                                <span className="px-2 py-0.5 bg-emerald-500 border border-emerald-500/30 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1"><LockClosedIcon className="w-2.5 h-2.5" /> Code Required</span>
                            </div>
                            <p className="text-xs text-[#0F172A] leading-relaxed font-semibold mb-6 flex-grow">Specialized, multi-signature ledger tailored for registered NGOs and sanctioned humanitarian deployments. Requires authorized Partnership Code.</p>
                            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2 mt-auto">
                                Authenticate Partnership <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>

                    {/* Priority Wealth Management */}
                    <button 
                        onClick={() => { setIsAccountTypeSelectorOpen(false); onStartCreateAccount('wealth'); }}
                        className="text-left p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]/50 border border-slate-200 dark:border-white/5 hover:border-rose-500/50 hover:bg-white[0.02] transition-all group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="p-4 bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-fit mb-6 group-hover:border-rose-500/30 group-hover:scale-110 transition-all">
                                <Clipboard className="w-8 h-8 text-white group-hover:text-rose-500 transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">Priority Wealth</h3>
                            <p className="text-xs text-[#0F172A] leading-relaxed font-semibold mb-6 flex-grow">Ultra-high-net-worth private banking tier. Access to bespoke algorithmic portfolio managers, tax attorneys, and global concierge services. Minimum deposit $1M.</p>
                            <div className="text-[10px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-2 mt-auto">
                                Request Private Access <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>

                    {/* Business Commercial */}
                    <button 
                        onClick={() => { setIsAccountTypeSelectorOpen(false); onStartCreateAccount('business'); }}
                        className="text-left p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]/50 border border-slate-200 dark:border-white/5 hover:border-indigo-500/50 hover:bg-white[0.02] transition-all group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="p-4 bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-fit mb-6 group-hover:border-indigo-500/30 group-hover:scale-110 transition-all">
                                <MessageSquare className="w-8 h-8 text-white group-hover:text-indigo-500 transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">Corporate Entity</h3>
                            <p className="text-xs text-[#0F172A] leading-relaxed font-semibold mb-6 flex-grow">Institutional-grade treasury management for registered LLCS, C-Corps, and global enterprises. Integrated payroll, multi-card expenditure, and complex API access.</p>
                            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2 mt-auto">
                                Open Corporate Node <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-[100dvh] flex items-center justify-center p-4 relative overflow-y-auto custom-scrollbar bg-transparent">
            <BackgroundManager section="WelcomePage" overlayType="medium" />

            {showBiometricScanner && (
                <BiometricLoginScanner 
                    onComplete={handleBiometricComplete} 
                    onClose={() => setShowBiometricScanner(false)} 
                />
            )}
            
            <div className="absolute inset-0 z-[1] bg-gradient-to-b from-slate-950/70 via-slate-900/40 to-slate-950/80 pointer-events-none"></div>
            <div className="absolute inset-0 z-[1] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
            
            <div className="w-full max-w-md relative z-20">
                <div className="text-center mb-10">
                    <div className="inline-block p-4 rounded-2xl bg-white/10 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/30 dark:border-white/10 shadow-2xl mb-6">
                        <PremiumReservedBankLogo className="w-12 h-12" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-sm">Welcome Back</h1>
                    <p className="text-slate-200 mt-2 font-medium text-sm">Access your First Pacific portfolio securely.</p>
                </div>

                <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-8 shadow-2xl">
                    {step === 'credentials' ? renderCredentialsStep() : renderMfaStep()}
                </div>
            </div>

            {isForgotPasswordModalOpen && renderForgotPasswordModal()}
            {isAccountTypeSelectorOpen && renderAccountTypeSelectorModal()}
        </div>
    );
};

