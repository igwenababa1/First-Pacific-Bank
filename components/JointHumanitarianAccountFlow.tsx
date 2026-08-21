import React, { useState } from 'react';
import { UserProfile, Account } from '../types';
import { db } from '../services/database';
import { generateUserAvatar } from '../services/avatarService';
import { ArrowRightIcon, CheckCircleIcon, ShieldCheckIcon, DocumentTextIcon, ArrowPathIcon } from './Icons';

interface Props {
    onBack: () => void;
    onSuccess: (profile: UserProfile, accounts: Account[]) => void;
    onVerificationRequired: (email: string) => void;
}

export const JointHumanitarianAccountFlow: React.FC<Props> = ({ onBack, onSuccess, onVerificationRequired }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        partnershipCode: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        foundationName: '',
        foundationRegNumber: '',
        pdfSigned: false,
    });
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMessage, setProcessingMessage] = useState('');
    const [createdAccounts, setCreatedAccounts] = useState<Account[]>([]);
    const [createdProfile, setCreatedProfile] = useState<UserProfile | null>(null);

    const [isRequestingCode, setIsRequestingCode] = useState(false);
    const [requestCodeEmail, setRequestCodeEmail] = useState('');
    const [codeSentSuccess, setCodeSentSuccess] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleNext = async () => {
        if (step === 1) {
            if (!formData.password || formData.password !== formData.confirmPassword) {
                setError('Passwords do not match or are empty.');
                return;
            }
        } else if (step === 2) {
            if (!formData.partnershipCode.startsWith('WIMC-') && formData.partnershipCode !== 'WIMC-ANN-0608') {
                setError('Invalid Partnership Code or Reference Number.');
                return;
            }
        } else if (step === 3) {
            if (!formData.firstName || !formData.lastName || !formData.email || !formData.foundationName) {
                setError('Please fill in all foundation and personal details.');
                return;
            }
        } else if (step === 4) {
            if (!formData.pdfSigned) {
                setError('You must upload the signed Final Agreement PDF to proceed.');
                return;
            }
            // Execute submission
            await registerAccount();
            return;
        }
        setStep(s => s + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const registerAccount = async () => {
        setIsProcessing(true);
        setProcessingMessage('Authenticating Partnership Code...');
        
        setTimeout(async () => {
            try {
                setProcessingMessage('Generating Secure Enclave Keys...');
                const fullName = `${formData.firstName} ${formData.lastName}`;
                let avatarUrl = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300&auto=format&fit=crop';
                
                try {
                    const generatedAvatar = await generateUserAvatar(fullName);
                    if (generatedAvatar) avatarUrl = generatedAvatar;
                } catch (err) {
                    // Ignore
                }

                const profile: UserProfile = {
                    name: fullName,
                    email: formData.email,
                    phone: formData.phone || '',
                    profilePictureUrl: avatarUrl,
                    lastLogin: { date: new Date(), from: 'Apex Cloud Node' },
                    kycStatus: 'verified' // Pre-verified via partnership code usually, or leave it pending
                };
                
                // Use a default pin '0000' or similar for now as it's not requested
                const creationResult = await db.createUser(profile, formData.password, '1234');
                
                if (creationResult === 'VERIFICATION_REQUIRED') {
                    setIsProcessing(false);
                    onVerificationRequired(formData.email);
                    return;
                }

                setProcessingMessage('Allocating Foundation Ledger...');
                await new Promise((res) => setTimeout(res, 800));
                
                const accounts = await db.getAccounts(profile.email);
                
                // Add a joint specific account or modify the primary one contextually
                if (accounts.length > 0) {
                    accounts[0].nickname = `${formData.foundationName} Joint Account`;
                }

                setCreatedProfile(profile);
                setCreatedAccounts(accounts);
                setStep(5);
            } catch (err: any) {
                setError(err.message || "Failed to create foundation account");
            } finally {
                setIsProcessing(false);
            }
        }, 1500);
    };

    const requestPartnershipCode = async () => {
        if (!requestCodeEmail) {
            setError('Please enter a valid email address to receive the code.');
            return;
        }
        setIsRequestingCode(true);
        setError('');
        
        try {
            const randomCode = `WIMC-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
            
            const htmlBody = `
                <div style="font-family: sans-serif; background: #020617; color: #fff; padding: 40px; text-align: center;">
                    <h2 style="color: #10b981; text-transform: uppercase; letter-spacing: 2px;">Partnership Code Provisioned</h2>
                    <p style="color: #94a3b8; font-size: 14px;">Your secure joint humanitarian partnership code for First Pacific Bank is:</p>
                    <div style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 20px; font-size: 24px; font-weight: 900; letter-spacing: 4px; border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; margin: 30px auto; max-width: 400px; text-align: center;">
                        ${randomCode}
                    </div>
                    <p style="color: #64748b; font-size: 12px;">This code is strictly confidential and valid for immediate use.</p>
                </div>
            `;

            const res = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: requestCodeEmail,
                    subject: 'Confidential Partnership Code - First Pacific Bank',
                    htmlBody
                })
            });

            if (res.ok) {
                setCodeSentSuccess('Code successfully dispatched to your email.');
                setFormData(prev => ({ ...prev, partnershipCode: randomCode })); // Auto-fill for convenience
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to dispatch email.');
            }
        } catch (err: any) {
            setError(err.message || 'Error communicating with mail server.');
        } finally {
            setIsRequestingCode(false);
        }
    };

    if (isProcessing) {
        return (
            <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-white text-center">
                <ArrowPathIcon className="w-16 h-16 animate-spin text-emerald-500 mb-8" />
                <h2 className="text-2xl font-black uppercase tracking-widest mb-4">Processing Application</h2>
                <p className="text-emerald-400 font-mono text-sm tracking-wider animate-pulse">{processingMessage}</p>
            </div>
        );
    }

    if (step === 5 && createdProfile) {
        return (
            <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 overflow-hidden relative">
                {/* Background flare */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="relative z-10 w-full max-w-xl bg-slate-50 border border-slate-200 dark:border-white/10 rounded-3xl p-8 md:p-12 text-center shadow-2xl  dark:bg-slate-900">
                    <div className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border-2 border-emerald-500/30">
                        <CheckCircleIcon className="w-12 h-12 text-emerald-400" />
                    </div>
                    
                    <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-4">Partnership Established</h2>
                    <p className="text-[#0F172A] mb-8 max-w-md mx-auto">
                        Your Joint Humanitarian Account for <strong className="text-white">{formData.foundationName}</strong> has been successfully instantiated.
                    </p>

                    <button 
                        onClick={() => onSuccess(createdProfile, createdAccounts)}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
                    >
                        Access Sovereign Dashboard
                        <ArrowRightIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-white relative">
            <div className="w-full max-w-lg">
                <button onClick={onBack} className="text-[#0F172A] hover:text-white uppercase tracking-widest text-[10px] font-bold mb-8 flex items-center gap-2 transition-colors">
                    ← Abandon Application
                </button>

                <div className="space-y-8">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-widest mb-2">Joint Humanitarian Setup</h1>
                        <div className="flex gap-2 overflow-hidden bg-white rounded-full h-1 mt-4 dark:bg-slate-800">
                            {[1,2,3,4].map(i => (
                                <div key={i} className={`flex-1 h-full transition-colors ${step >= i ? 'bg-emerald-500' : 'bg-transparent'}`} />
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-rose-500 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-bold font-mono text-center">
                            {error}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div>
                                <h3 className="text-lg font-bold mb-4">Create your login password</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-2">Secure Password</label>
                                        <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none dark:bg-slate-900" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-2">Confirm Password</label>
                                        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none dark:bg-slate-900" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div>
                                <h3 className="text-lg font-bold mb-4">Partnership Verification</h3>
                                <div>
                                    <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-2">Partnership Code / Reference Number</label>
                                    <input type="text" name="partnershipCode" value={formData.partnershipCode} onChange={handleChange} placeholder="e.g. WIMC-ANN-0608" className="w-full bg-slate-50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none font-mono uppercase transition-colors dark:bg-slate-900" />
                                </div>
                            </div>
                            
                            <div className="pt-6 border-t border-slate-200 dark:border-white/10">
                                <h4 className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-4">Don't have a code?</h4>
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-1">Enter email to generate secure code</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="email" 
                                            value={requestCodeEmail} 
                                            onChange={(e) => setRequestCodeEmail(e.target.value)} 
                                            placeholder="authorized@ngo.org" 
                                            className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none"
                                        />
                                        <button 
                                            onClick={requestPartnershipCode}
                                            disabled={isRequestingCode}
                                            className="px-6 bg-emerald-600 text-emerald-500 hover:bg-emerald-600 border border-emerald-500/20 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all disabled:opacity-70 whitespace-nowrap"
                                        >
                                            {isRequestingCode ? 'Generating...' : 'Request Code'}
                                        </button>
                                    </div>
                                    {codeSentSuccess && (
                                        <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mt-2">{codeSentSuccess}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div>
                                <h3 className="text-lg font-bold mb-4">Personal & Foundation Details</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-2">First Name</label>
                                            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none dark:bg-slate-900" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-2">Last Name</label>
                                            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none dark:bg-slate-900" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-2">Professional Email</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none dark:bg-slate-900" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-2">Direct Phone</label>
                                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none dark:bg-slate-900" />
                                    </div>
                                    <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                                        <label className="block text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-2">Foundation / NGO Name</label>
                                        <input type="text" name="foundationName" value={formData.foundationName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none space-y-2 dark:bg-slate-900" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div>
                                <h3 className="text-lg font-bold mb-4">Required Documentation</h3>
                                <p className="text-xs text-[#0F172A] mb-6">Please upload the signed Final Agreement PDF to finalize the Joint Humanitarian setup.</p>
                                
                                <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${formData.pdfSigned ? 'border-emerald-500 bg-emerald-500' : 'border-slate-200 dark:border-white/10 hover:bg-white'}`}
                                    onClick={() => {
                                        setFormData(p => ({ ...p, pdfSigned: true }));
                                        setError('');
                                    }}
                                >
                                    {formData.pdfSigned ? (
                                        <div className="space-y-4">
                                            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                                                <CheckCircleIcon className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-emerald-400 font-bold font-mono text-[10px] uppercase tracking-wider">Document Embedded</p>
                                                <p className="text-xs text-[#0F172A] mt-1">Final_Agreement_Signed.pdf</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 pointer-events-none">
                                            <DocumentTextIcon className="w-12 h-12 text-[#0F172A] mx-auto" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] mt-4">Click to simulate upload</p>
                                            <p className="text-[10px] font-mono text-[#0F172A]">Supported formats: PDF, DOCX</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-6 border-t border-slate-200 dark:border-white/10 flex gap-4">
                        {step > 1 && (
                            <button onClick={() => setStep(s => s - 1)} className="px-6 py-4 bg-slate-50 border border-slate-200 dark:border-white/10 hover:bg-white text-white rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all dark:bg-slate-800">
                                Back
                            </button>
                        )}
                        <button onClick={handleNext} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2">
                            {step === 4 ? 'Finalize & Submit' : 'Continue'}
                            <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
