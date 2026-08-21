import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    CheckCircle2, 
    ArrowRight, 
    Sparkles, 
    ShieldCheck, 
    Building2, 
    CreditCard, 
    Send, 
    Download, 
    Copy, 
    Check, 
    X, 
    Zap, 
    Lock, 
    Activity, 
    FileText, 
    Globe, 
    DollarSign,
    ExternalLink
} from 'lucide-react';
import { triggerHaptic, triggerSuccessHaptic } from '../utils/haptics';

export interface TransactionSuccessData {
    amount: number;
    currency?: string;
    sourceAccountName?: string;
    sourceAccountType?: string;
    sourceAccountNumber?: string;
    sourceInitialBalance?: number;
    recipientName?: string;
    recipientBank?: string;
    recipientAccountNumber?: string;
    recipientInitialBalance?: number;
    referenceId?: string;
    timestamp?: string;
    fee?: number;
    exchangeRate?: number;
    memo?: string;
    network?: 'FedNow' | 'SWIFT' | 'ACH' | 'Internal Clearing';
}

interface TransactionSuccessAnimationProps {
    isOpen: boolean;
    data: TransactionSuccessData;
    onClose: () => void;
    onDownloadReceipt?: () => void;
}

export const TransactionSuccessAnimation: React.FC<TransactionSuccessAnimationProps> = ({
    isOpen,
    data,
    onClose,
    onDownloadReceipt
}) => {
    const [animationStage, setAnimationStage] = useState<'idle' | 'encrypting' | 'transferring' | 'completed'>('idle');
    const [copied, setCopied] = useState(false);
    const [sourceBalance, setSourceBalance] = useState(data.sourceInitialBalance || 24850.00);
    const [receiverBalance, setReceiverBalance] = useState(data.recipientInitialBalance || 3120.00);

    const amount = data.amount || 1250.00;
    const currency = data.currency || 'USD';
    const sourceName = data.sourceAccountName || 'First Sovereign Checking';
    const sourceAccNo = data.sourceAccountNumber || '•••• 4821';
    const recipientName = data.recipientName || 'Elena Rostova';
    const recipientBank = data.recipientBank || 'JP Morgan Chase Bank';
    const recipientAccNo = data.recipientAccountNumber || '•••• 9102';
    const refId = data.referenceId || `TX-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const network = data.network || 'FedNow';

    useEffect(() => {
        if (!isOpen) {
            setAnimationStage('idle');
            return;
        }

        triggerHaptic(30);
        setAnimationStage('encrypting');

        const initialSrc = data.sourceInitialBalance || 24850.00;
        const initialRec = data.recipientInitialBalance || 3120.00;
        setSourceBalance(initialSrc);
        setReceiverBalance(initialRec);

        // Sequence Timers
        const timer1 = setTimeout(() => {
            setAnimationStage('transferring');
            triggerHaptic([20, 20]);

            // Animate counter balance over 1.8 seconds
            const startTime = Date.now();
            const duration = 1800;

            const interval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease out quad
                const easeProgress = 1 - (1 - progress) * (1 - progress);

                setSourceBalance(initialSrc - amount * easeProgress);
                setReceiverBalance(initialRec + amount * easeProgress);

                if (progress >= 1) {
                    clearInterval(interval);
                }
            }, 30);

        }, 1200);

        const timer2 = setTimeout(() => {
            setAnimationStage('completed');
            triggerSuccessHaptic();
        }, 3400);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [isOpen, amount, data.sourceInitialBalance, data.recipientInitialBalance]);

    const handleCopyRef = () => {
        navigator.clipboard.writeText(refId);
        setCopied(true);
        triggerHaptic(15);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-100  overflow-y-auto font-sans">
                    {/* Ambient Glow Orbs */}
                    <div className="absolute w-[600px] h-[600px] bg-emerald-500/15 rounded-full blur-[160px] pointer-events-none animate-pulse" />
                    <div className="absolute w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none top-1/4 right-10" />

                    <motion.div
                        initial={{ scale: 0.88, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: -20 }}
                        transition={{ type: "spring", stiffness: 240, damping: 22 }}
                        className="relative w-full max-w-2xl bg-slate-50 border border-slate-300/60 dark:border-white/15 rounded-[2.5rem] shadow-[0_0_100px_rgba(16,185,129,0.2)] overflow-hidden p-6 md:p-10 my-8 dark:bg-slate-900"
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2.5 bg-white hover:bg-white text-[#0F172A] hover:text-white rounded-full transition-all border border-black/5 z-20 dark:bg-slate-800"
                            title="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Top Badge Banner */}
                        <div className="flex flex-col items-center text-center space-y-3 mb-8">
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-[0.2em] shadow-inner"
                            >
                                <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
                                {animationStage === 'encrypting' && 'Establishing Cryptographic Enclave...'}
                                {animationStage === 'transferring' && `${network} Real-Time Transit Active`}
                                {animationStage === 'completed' && 'Sovereign Ledger Settlement Confirmed'}
                            </motion.div>

                            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                                {animationStage === 'completed' ? 'Transaction Completed' : 'Processing Sovereign Transfer'}
                            </h2>
                            <p className="text-xs text-[#0F172A] max-w-md font-mono">
                                Reference Code: <span className="text-emerald-400 font-bold">{refId}</span> • Direct Node Route: <span className="text-cyan-400">{network}</span>
                            </p>
                        </div>

                        {/* Visual Source -> Transit -> Target Transfer Card Sequence */}
                        <div className="relative bg-slate-100 border border-black/5 rounded-3xl p-6 md:p-8 mb-8 overflow-hidden">
                            {/* Grid background pattern */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4">
                                {/* Source Card Block */}
                                <motion.div 
                                    animate={{ 
                                        scale: animationStage === 'encrypting' ? [1, 1.04, 1] : 1,
                                        borderColor: animationStage === 'transferring' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.1)'
                                    }}
                                    transition={{ duration: 1.5, repeat: animationStage === 'encrypting' ? Infinity : 0 }}
                                    className="w-full md:w-5/12 bg-slate-50 border border-black/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-40 relative overflow-hidden dark:bg-slate-900"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-white rounded-xl text-primary border border-black/5 dark:bg-slate-800">
                                                <CreditCard className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest block font-mono">Source Account</span>
                                                <span className="text-xs font-black text-white truncate max-w-[120px] block">{sourceName}</span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-mono text-[#0F172A] bg-white px-2 py-0.5 rounded border border-black/5 dark:bg-slate-800">{sourceAccNo}</span>
                                    </div>

                                    <div>
                                        <span className="text-[10px] font-mono text-[#0F172A] block uppercase">Updated Balance</span>
                                        <div className="text-lg font-black font-mono text-white flex items-center gap-1">
                                            <span>${sourceBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            {animationStage === 'transferring' && (
                                                <motion.span 
                                                    initial={{ opacity: 0, y: -5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="text-xs text-rose-400 font-bold"
                                                >
                                                    -${amount.toLocaleString()}
                                                </motion.span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Pulse Ring when transferring */}
                                    {animationStage === 'transferring' && (
                                        <motion.div 
                                            initial={{ scale: 0.8, opacity: 0.8 }}
                                            animate={{ scale: 1.3, opacity: 0 }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                            className="absolute inset-0 border-2 border-emerald-500 rounded-2xl pointer-events-none"
                                        />
                                    )}
                                </motion.div>

                                {/* Animated Kinetic Transit Particle Beam */}
                                <div className="w-full md:w-2/12 flex md:flex-col items-center justify-center relative my-2 md:my-0 h-16 md:h-auto">
                                    {/* Line Container */}
                                    <div className="w-full md:w-1 h-1 md:h-24 bg-white rounded-full relative overflow-hidden flex items-center justify-center dark:bg-slate-800">
                                        {/* Flowing Gradient Stream */}
                                        <motion.div 
                                            initial={{ x: '-100%', y: '-100%' }}
                                            animate={{ 
                                                x: animationStage === 'transferring' ? ['-100%', '100%'] : '0%',
                                                y: animationStage === 'transferring' ? ['-100%', '100%'] : '0%'
                                            }}
                                            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                                            className="w-full h-full bg-gradient-to-r md:bg-gradient-to-b from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981]"
                                        />
                                    </div>

                                    {/* Flying Amount Pill Token */}
                                    <AnimatePresence>
                                        {animationStage === 'transferring' && (
                                            <motion.div
                                                initial={{ scale: 0.5, opacity: 0, x: -60 }}
                                                animate={{ scale: [0.8, 1.1, 0.9], opacity: 1, x: [ -40, 0, 40] }}
                                                exit={{ scale: 0.5, opacity: 0 }}
                                                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                                                className="absolute z-20 px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs rounded-full shadow-[0_0_20px_rgba(16,185,129,0.8)] border border-emerald-300 flex items-center gap-1 font-mono whitespace-nowrap"
                                            >
                                                <DollarSign className="w-3.5 h-3.5 stroke-[3]" />
                                                {amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {animationStage === 'completed' && (
                                        <motion.div 
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute z-20 p-2 bg-emerald-500 text-slate-950 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.9)]"
                                        >
                                            <Check className="w-5 h-5 stroke-[3]" />
                                        </motion.div>
                                    )}
                                </div>

                                {/* Target Account Card Block */}
                                <motion.div 
                                    animate={{ 
                                        scale: animationStage === 'completed' ? [1, 1.03, 1] : 1,
                                        borderColor: animationStage === 'completed' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.1)'
                                    }}
                                    className="w-full md:w-5/12 bg-slate-50 border border-black/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-40 relative overflow-hidden dark:bg-slate-900"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-white rounded-xl text-emerald-400 border border-black/5 dark:bg-slate-800">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest block font-mono">Receiver</span>
                                                <span className="text-xs font-black text-white truncate max-w-[120px] block">{recipientName}</span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-mono text-[#0F172A] bg-white px-2 py-0.5 rounded border border-black/5 dark:bg-slate-800">{recipientAccNo}</span>
                                    </div>

                                    <div>
                                        <span className="text-[10px] font-mono text-[#0F172A] block uppercase">{recipientBank}</span>
                                        <div className="text-lg font-black font-mono text-emerald-400 flex items-center gap-1">
                                            <span>${receiverBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            {animationStage === 'completed' && (
                                                <motion.span 
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="text-xs text-emerald-300 font-bold"
                                                >
                                                    +${amount.toLocaleString()}
                                                </motion.span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Pulse Glow when completed */}
                                    {animationStage === 'completed' && (
                                        <motion.div 
                                            initial={{ opacity: 0.8 }}
                                            animate={{ opacity: 0 }}
                                            transition={{ duration: 1.5 }}
                                            className="absolute inset-0 bg-emerald-500/20 pointer-events-none"
                                        />
                                    )}
                                </motion.div>
                            </div>

                            {/* Progress Status Bar */}
                            <div className="mt-8 pt-6 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                                        <Activity className="w-4 h-4 animate-pulse" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                                            {animationStage === 'encrypting' && 'Step 1/3: 256-Bit Mutual Handshake'}
                                            {animationStage === 'transferring' && 'Step 2/3: Real-Time FedNow Ledger Clearing'}
                                            {animationStage === 'completed' && 'Step 3/3: Sovereign Ledger Immutable Lock'}
                                        </p>
                                        <p className="text-[10px] text-[#0F172A]">Zero-latency instant settlement protocol</p>
                                    </div>
                                </div>

                                <div className="w-full md:w-48 bg-white rounded-full h-2 overflow-hidden border border-black/5 dark:bg-slate-800">
                                    <motion.div 
                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                                        initial={{ width: '10%' }}
                                        animate={{ 
                                            width: animationStage === 'encrypting' ? '35%' : animationStage === 'transferring' ? '75%' : '100%' 
                                        }}
                                        transition={{ duration: 0.6 }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Transaction Receipt Details Modal */}
                        <div className="bg-slate-100 border border-black/5 rounded-2xl p-5 space-y-3 mb-8 text-xs font-mono">
                            <div className="flex justify-between pb-2 border-b border-black/5 text-[#0F172A]">
                                <span>Transfer Amount</span>
                                <span className="text-white font-bold font-mono text-sm">${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency}</span>
                            </div>
                            <div className="flex justify-between pb-2 border-b border-black/5 text-[#0F172A]">
                                <span>Network Transfer Fee</span>
                                <span className="text-emerald-400 font-bold">$0.00 (Waived Premier Tier)</span>
                            </div>
                            <div className="flex justify-between pb-2 border-b border-black/5 text-[#0F172A]">
                                <span>Settlement Timestamp</span>
                                <span className="text-white">{data.timestamp || new Date().toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-[#0F172A]">
                                <span>Reference Transaction ID</span>
                                <button 
                                    onClick={handleCopyRef}
                                    className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20"
                                >
                                    <span>{refId}</span>
                                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            {onDownloadReceipt && (
                                <button
                                    onClick={onDownloadReceipt}
                                    className="flex-1 py-3.5 bg-white hover:bg-slate-700 text-white text-xs font-black uppercase tracking-wider rounded-xl border border-black/5 flex items-center justify-center gap-2 transition-all dark:bg-slate-800"
                                >
                                    <Download className="w-4 h-4" /> Download Official Receipt
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                Return to Dashboard <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
