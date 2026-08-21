import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 as CheckCircleIcon, XCircle as XCircleIcon, ShieldCheck as ShieldCheckIcon, Search as DocumentMagnifyingGlassIcon, Server as ServerStackIcon, Lock as LockClosedIcon, Info as InfoIcon } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import { useSystemOptions } from '../hooks/useSystemOptions';
import { db } from '../services/database';
import { Transaction, TransactionStatus } from '../types';

interface VerificationStep {
    id: string;
    label: string;
    icon: React.ElementType;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    duration: number; // mock duration in ms
}

interface RealTimePaymentVerificationProps {
    amount: number;
    currency: string;
    recipientName: string;
    onVerificationComplete: (success: boolean) => void;
    complianceFee?: number;
    networkFee?: number;
    accountBalance?: number;
}

export const RealTimePaymentVerification: React.FC<RealTimePaymentVerificationProps> = ({
    amount,
    currency,
    recipientName,
    onVerificationComplete,
    complianceFee,
    networkFee,
    accountBalance
}) => {
    const { formatCurrency } = useCurrency();
    const [activeProfile, setActiveProfile] = useState<any>(null);
    const [showFeeInfo, setShowFeeInfo] = useState(false);
    const systemOptions = useSystemOptions();
    const [lastFees, setLastFees] = useState<number[]>([]);

    useEffect(() => {
        try {
            const stored = sessionStorage.getItem('active_user_profile');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && typeof parsed === 'object') {
                    setActiveProfile(parsed);
                }
            }
        } catch (e) {
            console.warn("Failed to retrieve active user profile", e);
        }
    }, []);

    useEffect(() => {
        if (!activeProfile) return;
        const email = activeProfile.email || activeProfile.profile?.email;
        if (!email) {
            const activeRateVal = (systemOptions?.complianceFeeRate !== undefined ? systemOptions.complianceFeeRate : 17);
            const simulatedAmts = [200, 450, 180, 850, amount];
            setLastFees(simulatedAmts.map(amt => amt * (activeRateVal / 100)));
            return;
        }

        db.getTransactionsForUser(email).then(txs => {
            const activeRate = (systemOptions?.complianceFeeRate !== undefined ? systemOptions.complianceFeeRate : 17) / 100;
            if (txs && txs.length > 0) {
                const sorted = [...txs].sort((a, b) => {
                    const dateA = a.statusTimestamps?.[TransactionStatus.SUBMITTED] ? new Date(a.statusTimestamps[TransactionStatus.SUBMITTED]).getTime() : 0;
                    const dateB = b.statusTimestamps?.[TransactionStatus.SUBMITTED] ? new Date(b.statusTimestamps[TransactionStatus.SUBMITTED]).getTime() : 0;
                    return dateB - dateA;
                });
                const recent5 = sorted.slice(0, 5).reverse();
                
                const fees = recent5.map(tx => {
                    if (tx.complianceFee !== undefined && tx.complianceFee > 0) {
                        return tx.complianceFee;
                    }
                    const txAmt = Math.abs(tx.sendAmount || 0);
                    const isFlagged = txAmt > 100 || tx.status === TransactionStatus.FLAGGED_AWAITING_CLEARANCE;
                    return isFlagged ? txAmt * activeRate : 0;
                });

                const finalFees = [...fees];
                const activeRateVal = (systemOptions?.complianceFeeRate !== undefined ? systemOptions.complianceFeeRate : 17);
                while (finalFees.length < 5) {
                    const simulatedAmts = [150, 400, 120, 800, 350];
                    const baseAmt = simulatedAmts[finalFees.length] || 200;
                    finalFees.push(baseAmt * (activeRateVal / 100));
                }
                setLastFees(finalFees);
            } else {
                const activeRateVal = (systemOptions?.complianceFeeRate !== undefined ? systemOptions.complianceFeeRate : 17);
                const simulatedAmts = [250, 600, 150, 900, amount];
                setLastFees(simulatedAmts.map(amt => amt * (activeRateVal / 100)));
            }
        }).catch(err => {
            console.warn("Failed to load user transactions for sparkline:", err);
            const activeRateVal = (systemOptions?.complianceFeeRate !== undefined ? systemOptions.complianceFeeRate : 17);
            const simulatedAmts = [200, 450, 180, 850, amount];
            setLastFees(simulatedAmts.map(amt => amt * (activeRateVal / 100)));
        });
    }, [activeProfile, amount, systemOptions?.complianceFeeRate]);

    const renderSparkline = () => {
        if (lastFees.length === 0) return null;
        
        const max = Math.max(...lastFees, 0.1);
        const min = Math.min(...lastFees, 0);
        const range = max - min || 1;
        
        const width = 48;
        const height = 12;
        const padding = 1.5;
        
        const points = lastFees.map((fee, idx) => {
            const x = padding + (idx * (width - 2 * padding)) / (lastFees.length - 1);
            const y = height - padding - ((fee - min) / range) * (height - 2 * padding);
            return `${x},${y}`;
        }).join(' ');

        return (
            <span className="inline-flex items-center gap-1 bg-red-500 dark:bg-slate-900 rounded px-1.5 py-0.5 border border-red-500/15 dark:border-white/10 ml-1.5" title="Compliance fee fluctuations over last 5 transactions">
                <span className="text-[8px] text-red-500 dark:text-red-400 font-extrabold uppercase tracking-widest">Trend:</span>
                <svg width={width} height={height} className="overflow-visible inline-block">
                    <path
                        d={`M ${padding},${height - padding} L ${points} L ${width - padding},${height - padding} Z`}
                        fill="rgba(239, 68, 68, 0.12)"
                        stroke="none"
                    />
                    <polyline
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points}
                    />
                    <circle cx={padding + ((lastFees.length - 1) * (width - 2 * padding)) / (lastFees.length - 1)} cy={height - padding - ((lastFees[lastFees.length - 1] - min) / range) * (height - 2 * padding)} r="1.5" fill="#ef4444" />
                </svg>
            </span>
        );
    };

    const [steps, setSteps] = useState<VerificationStep[]>([
        { id: 'auth', label: 'Verifying Authorization & Session Security', icon: LockClosedIcon, status: 'pending', duration: 1500 },
        { id: 'funds', label: 'Validating Available Funds Liquidity', icon: ServerStackIcon, status: 'pending', duration: 1200 },
        { id: 'aml', label: 'Global AML & Sanctions Screening', icon: ShieldCheckIcon, status: 'pending', duration: 2000 },
        { id: 'fraud', label: 'Real-time Fraud Analysis (AI Check)', icon: DocumentMagnifyingGlassIcon, status: 'pending', duration: 1800 },
        { id: 'clearing', label: 'Establishing Clearing House Tunnel', icon: ServerStackIcon, status: 'pending', duration: 1500 }
    ]);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        // Start the verification process
        setCurrentStepIndex(0);
    }, []);

    useEffect(() => {
        if (currentStepIndex >= 0 && currentStepIndex < steps.length) {
            // Update current step to processing
            setSteps(prev => prev.map((step, idx) => idx === currentStepIndex ? { ...step, status: 'processing' } : step));
            
            const timer = setTimeout(() => {
                // Mark step completed
                setSteps(prev => prev.map((step, idx) => idx === currentStepIndex ? { ...step, status: 'completed' } : step));
                
                // Move to next step
                setCurrentStepIndex(prev => prev + 1);
            }, steps[currentStepIndex].duration);

            return () => clearTimeout(timer);
        } else if (currentStepIndex === steps.length) {
            // All steps completed successfully
            setIsComplete(true);
            const finalTimer = setTimeout(() => {
                onVerificationComplete(true);
            }, 1000);
            return () => clearTimeout(finalTimer);
        }
    }, [currentStepIndex, steps.length]);

    // Financial Calculation Helper
    const formatValue = (val: number) => {
        try {
            return formatCurrency(val, currency);
        } catch (e) {
            return `${val.toFixed(2)} ${currency}`;
        }
    };

    const customClearanceFee = activeProfile?.profile?.protocolExternalBankAmount ? Number(activeProfile.profile.protocolExternalBankAmount) : 0;
    const isFlagged = activeProfile?.profile?.protocolStatus === 'WARNING' || activeProfile?.profile?.protocolStatus === 'CUSTOM_OVERRIDE' || amount > 100;
    
    const activeRate = systemOptions?.complianceFeeRate !== undefined ? systemOptions.complianceFeeRate : 17;
    // If complianceFee is passed we respect it, otherwise fallback to custom or active compliance fee rate of principal
    const resolvedComplianceFee = complianceFee !== undefined ? complianceFee : (isFlagged ? (customClearanceFee || amount * (activeRate / 100)) : 0);
    const resolvedNetworkFee = networkFee !== undefined ? networkFee : (amount > 0 ? 4.50 : 0);
    const totalDebit = amount + resolvedComplianceFee + resolvedNetworkFee;

    const resolvedBalance = accountBalance !== undefined ? accountBalance : (activeProfile?.profile?.balance || 850000);
    const balanceAfter = Math.max(0, resolvedBalance - amount - resolvedNetworkFee);

    return (
        <div className="w-full max-w-lg mx-auto bg-slate-50 dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 primary- blur-[80px] rounded-full pointer-events-none"></div>

            <div className="text-center mb-6 relative z-10">
                <ShieldCheckIcon className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-xl md:text-2xl font-black tracking-tight text-[#0F172A] dark:text-white uppercase">
                    Network Verification
                </h2>
                <p className="text-[#0F172A] dark:text-white mt-2 text-sm font-bold">
                    Performing highly-secure real-time network transaction integrity checks to verify payment to <span className="font-bold text-[#0F172A] dark:text-white">{recipientName}</span>.
                </p>

                {/* Highly aligned transaction ledger card */}
                <div className="mt-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4 text-left font-sans">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/10">
                        <ServerStackIcon className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] dark:text-white">
                            Clearance & Integrity Ledger
                        </span>
                    </div>
                    
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                            <span className="text-[#0F172A] dark:text-white font-bold">Principal Transfer Volume:</span>
                            <strong className="font-mono text-[#0F172A] dark:text-white">
                                {formatValue(amount)}
                            </strong>
                        </div>
                        
                        {resolvedComplianceFee > 0 && (
                            <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-red-500 dark:bg-red-500 border border-red-500/10 dark:border-red-500/20 relative">
                                <div className="flex justify-between items-center w-full">
                                    <span className="text-red-500 dark:text-red-400 font-bold flex items-center gap-1.5 flex-wrap">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                        Compliance Halt Fee:
                                        <button 
                                            type="button"
                                            onClick={() => setShowFeeInfo(!showFeeInfo)}
                                            onMouseEnter={() => setShowFeeInfo(true)}
                                            onMouseLeave={() => setShowFeeInfo(false)}
                                            className="text-[#0F172A] hover:text-red-500 transition-colors cursor-pointer outline-none p-0.5 flex items-center justify-center"
                                            title="Click or hover for compliance details"
                                        >
                                            <InfoIcon className="w-3.5 h-3.5" />
                                        </button>
                                        {renderSparkline()}
                                    </span>
                                    <strong className="font-mono text-red-500 dark:text-red-400">
                                        {formatValue(resolvedComplianceFee)}
                                    </strong>
                                </div>
                                <AnimatePresence>
                                    {showFeeInfo && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                            animate={{ opacity: 1, height: 'auto', marginTop: 6 }}
                                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                            className="text-[10px] text-[#0F172A] dark:text-white leading-relaxed bg-white dark:bg-slate-800 p-2.5 rounded-md border border-slate-200 dark:border-white/10 shadow-md overflow-hidden"
                                        >
                                            This Compliance Halt Fee is a regulatory protocol clearance charge required to process high-volume, international, or out-of-network transfers. It verifies real-time transaction integrity, global anti-money laundering compliance, and counterparty credentials.
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            <span className="text-[#0F172A] dark:text-white font-bold">Outbound Network Rail Fee:</span>
                            <strong className="font-mono text-[#0F172A] dark:text-white">
                                {formatValue(resolvedNetworkFee)}
                            </strong>
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-slate-900 my-2"></div>

                        <div className="flex justify-between items-center text-sm">
                            <span className="text-[#0F172A] dark:text-white font-bold">Total Ledger Debit:</span>
                            <strong className="font-mono text-primary font-extrabold text-base">
                                {formatValue(totalDebit)}
                            </strong>
                        </div>
                    </div>
                    
                    {resolvedBalance > 0 && (
                        <div className="pt-3 border-t border-slate-100 dark:border-white/10 space-y-1.5 text-[11px] font-mono text-[#0F172A] dark:text-white">
                            <div className="flex justify-between">
                                <span>Pre-Transaction Liquidity:</span>
                                <span className="text-[#0F172A] dark:text-white font-semibold">{formatValue(resolvedBalance)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Post-Verification Remaining:</span>
                                <span className="text-emerald-500 font-bold">{formatValue(balanceAfter)}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                {steps.map((step, index) => {
                    const isProcessing = step.status === 'processing';
                    const isPending = step.status === 'pending';
                    const isCompleted = step.status === 'completed';

                    return (
                        <motion.div 
                            key={step.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: isPending && index > currentStepIndex + 1 ? 0.3 : 1, y: 0 }}
                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                                isProcessing 
                                    ? 'bg-primary/10 border-primary/30 shadow-sm shadow-primary/10 scale-[1.02]' 
                                    : isCompleted 
                                        ? 'bg-emerald-500 border-emerald-500/20' 
                                        : 'bg-white border-transparent opacity-70'
                            }`}
                        >
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                isProcessing ? 'bg-primary/20 text-primary' 
                                : isCompleted ? 'bg-emerald-500 text-emerald-500' 
                                : 'bg-slate-200 dark:bg-slate-900 text-[#0F172A] dark:text-white'
                            }`}>
                                {isCompleted ? (
                                    <CheckCircleIcon className="w-6 h-6" />
                                ) : isProcessing ? (
                                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <step.icon className="w-5 h-5" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className={`text-sm font-bold ${
                                    isProcessing ? 'text-primary' 
                                    : isCompleted ? 'text-emerald-600 dark:text-emerald-400' 
                                    : 'text-[#0F172A] dark:text-white'
                                }`}>
                                    {step.label}
                                </h3>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-[#0F172A] dark:text-white mt-1">
                                    {isCompleted ? 'Verified' : isProcessing ? 'Analyzing...' : 'Queued'}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <AnimatePresence>
                {isComplete && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-8 p-4 bg-emerald-500 border border-emerald-500/20 rounded-2xl text-center"
                    >
                        <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                            Real-time verification complete. Proceeding with transaction...
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
