import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    X, 
    FileText, 
    Calendar, 
    Download, 
    CheckCircle2, 
    ShieldCheck, 
    ArrowRight, 
    Sparkles, 
    DollarSign, 
    Filter, 
    CreditCard, 
    Building2, 
    Clock, 
    RefreshCw 
} from 'lucide-react';
import { UserProfile, Account, Transaction, TransactionStatus } from '../types';
import { generateUsBankStatementPDF } from '../utils/generateUsBankStatementPdf';
import { triggerHaptic, triggerSuccessHaptic } from '../utils/haptics';

interface GeneratePdfStatementModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile;
    accounts: Account[];
    transactions: Transaction[];
    defaultAccountId?: string;
}

export const GeneratePdfStatementModal: React.FC<GeneratePdfStatementModalProps> = ({
    isOpen,
    onClose,
    userProfile,
    accounts = [],
    transactions = [],
    defaultAccountId = 'ALL'
}) => {
    // Quick Date Presets Generator
    const getPresetDates = (preset: string) => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        const formatDate = (d: Date) => d.toISOString().split('T')[0];

        switch (preset) {
            case 'CURRENT_MONTH': {
                const firstDay = new Date(year, month, 1);
                return { start: formatDate(firstDay), end: formatDate(now) };
            }
            case 'PREVIOUS_MONTH': {
                const firstDayPrev = new Date(year, month - 1, 1);
                const lastDayPrev = new Date(year, month, 0);
                return { start: formatDate(firstDayPrev), end: formatDate(lastDayPrev) };
            }
            case 'LAST_30_DAYS': {
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return { start: formatDate(thirtyDaysAgo), end: formatDate(now) };
            }
            case 'LAST_90_DAYS': {
                const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                return { start: formatDate(ninetyDaysAgo), end: formatDate(now) };
            }
            case 'YTD': {
                const janFirst = new Date(year, 0, 1);
                return { start: formatDate(janFirst), end: formatDate(now) };
            }
            default:
                return { start: formatDate(new Date(year, month, 1)), end: formatDate(now) };
        }
    };

    const initialDates = getPresetDates('CURRENT_MONTH');

    const [selectedAccountId, setSelectedAccountId] = useState<string>(defaultAccountId);
    const [preset, setPreset] = useState<string>('CURRENT_MONTH');
    const [startDate, setStartDate] = useState<string>(initialDates.start);
    const [endDate, setEndDate] = useState<string>(initialDates.end);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progressStatus, setProgressStatus] = useState<string>('');
    const [generatedSuccess, setGeneratedSuccess] = useState(false);

    // Handle preset click
    const handlePresetChange = (presetKey: string) => {
        setPreset(presetKey);
        triggerHaptic(10);
        if (presetKey !== 'CUSTOM') {
            const dates = getPresetDates(presetKey);
            setStartDate(dates.start);
            setEndDate(dates.end);
        }
    };

    // Calculate live statistics for selected period & account
    const summaryStats = useMemo(() => {
        const startMs = new Date(`${startDate}T00:00:00`).getTime();
        const endMs = new Date(`${endDate}T23:59:59`).getTime();

        let accountTxs = transactions;
        if (selectedAccountId !== 'ALL') {
            accountTxs = transactions.filter(tx => 
                tx.accountId === selectedAccountId
            );
        }

        const periodTxs = accountTxs.filter(tx => {
            const txDate = tx.statusTimestamps?.[TransactionStatus.SUBMITTED] 
                || tx.statusTimestamps?.['Submitted']
                || Date.now();
            const time = new Date(txDate).getTime();
            return time >= startMs && time <= endMs;
        });

        let totalInflow = 0;
        let totalOutflow = 0;

        periodTxs.forEach(tx => {
            const amt = Number(tx.sendAmount || 0);
            if (tx.type === 'credit') {
                totalInflow += amt;
            } else {
                totalOutflow += amt;
            }
        });

        const selectedAccObj = accounts.find(a => a.id === selectedAccountId);
        const endingBalance = selectedAccObj 
            ? selectedAccObj.balance 
            : accounts.reduce((sum, a) => sum + a.balance, 0);

        const startingBalance = endingBalance - totalInflow + totalOutflow;

        return {
            count: periodTxs.length,
            totalInflow,
            totalOutflow,
            startingBalance,
            endingBalance,
            netChange: totalInflow - totalOutflow
        };
    }, [startDate, endDate, selectedAccountId, accounts, transactions]);

    const handleGeneratePdf = async () => {
        setIsGenerating(true);
        setGeneratedSuccess(false);
        triggerHaptic(25);

        try {
            await generateUsBankStatementPDF({
                userProfile,
                accounts,
                transactions,
                selectedAccountId,
                startDate,
                endDate,
                presetName: preset,
                download: true,
                onProgress: (msg) => setProgressStatus(msg)
            });

            triggerSuccessHaptic();
            setGeneratedSuccess(true);
            setTimeout(() => {
                setGeneratedSuccess(false);
            }, 3000);
        } catch (err) {
            console.error("Failed to generate PDF statement:", err);
        } finally {
            setIsGenerating(false);
            setProgressStatus('');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-100  overflow-y-auto font-sans">
                {/* Background Ambient Glow */}
                <div className="absolute w-[500px] h-[500px] bg-emerald-500 rounded-full blur-[140px] pointer-events-none" />

                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: -10 }}
                    transition={{ type: "spring", stiffness: 260, damping: 24 }}
                    className="relative w-full max-w-3xl bg-slate-50 border border-slate-300/60 dark:border-white/15 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.6)] overflow-hidden p-6 md:p-8 my-8 text-white dark:bg-slate-900"
                >
                    {/* Close Button */}
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2.5 bg-white hover:bg-white text-[#0F172A] hover:text-white rounded-full transition-all border border-black/5 dark:bg-slate-800"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Header Title */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl border border-emerald-500/30 text-emerald-400">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">
                                    Generate Official Bank Statement
                                </h2>
                                <span className="bg-emerald-500 text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                                    jsPDF Core
                                </span>
                            </div>
                            <p className="text-xs text-[#0F172A] mt-0.5">
                                Download certified account activity reports formatted for tax, loan, or audit verification.
                            </p>
                        </div>
                    </div>

                    {/* Content Form Body */}
                    <div className="space-y-6">

                        {/* 1. Account Picker */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] flex items-center gap-1.5 font-mono">
                                <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Select Source Account
                            </label>
                            <select
                                value={selectedAccountId}
                                onChange={(e) => { setSelectedAccountId(e.target.value); triggerHaptic(10); }}
                                className="w-full bg-slate-100 border border-white/15 rounded-2xl px-4 py-3 text-xs md:text-sm text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            >
                                <option value="ALL">Consolidated Portfolio (All Accounts Included)</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.type || 'Account'} (•••• {acc.accountNumber ? acc.accountNumber.slice(-4) : '4821'}) — ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 2. Date Range Presets */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] flex items-center gap-1.5 font-mono">
                                <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Statement Cycle Presets
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                                {[
                                    { key: 'CURRENT_MONTH', label: 'This Month' },
                                    { key: 'LAST_30_DAYS', label: 'Last 30 Days' },
                                    { key: 'PREVIOUS_MONTH', label: 'Prev Month' },
                                    { key: 'LAST_90_DAYS', label: 'Last 90 Days' },
                                    { key: 'YTD', label: 'Year to Date' },
                                    { key: 'CUSTOM', label: 'Custom' },
                                ].map(p => (
                                    <button
                                        key={p.key}
                                        type="button"
                                        onClick={() => handlePresetChange(p.key)}
                                        className={`py-2 px-3 text-[11px] font-bold rounded-xl border transition-all ${
                                            preset === p.key
                                                ? 'bg-emerald-500 text-emerald-400 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                                                : 'bg-slate-100 text-[#0F172A] border-black/5 hover:border-white/20 hover:text-white'
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 3. Date Range Pickers (Start Date & End Date) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-100 p-4 rounded-2xl border border-black/5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-[#0F172A] block font-mono">
                                    Start Date
                                </label>
                                <input 
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        setPreset('CUSTOM');
                                    }}
                                    className="w-full bg-slate-50 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-900"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-[#0F172A] block font-mono">
                                    End Date
                                </label>
                                <input 
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        setPreset('CUSTOM');
                                    }}
                                    className="w-full bg-slate-50 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-900"
                                />
                            </div>
                        </div>

                        {/* 4. Live Executive Statement Summary Box */}
                        <div className="bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 border border-black/5 rounded-2xl p-5 space-y-3">
                            <div className="flex justify-between items-center border-b border-black/5 pb-3">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-emerald-400" />
                                    <span className="text-xs font-black uppercase tracking-wider text-white">
                                        Statement Period Live Summary
                                    </span>
                                </div>
                                <span className="text-[10px] font-mono text-[#0F172A]">
                                    {summaryStats.count} Recorded Ledger Items
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                                <div className="bg-white p-3 rounded-xl border border-black/5 dark:bg-slate-800">
                                    <span className="text-[9px] text-[#0F172A] uppercase block font-sans">Starting Balance</span>
                                    <span className="font-bold text-white text-sm block mt-0.5">
                                        ${summaryStats.startingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>

                                <div className="bg-emerald-500 p-3 rounded-xl border border-emerald-500/20">
                                    <span className="text-[9px] text-emerald-400 uppercase block font-sans">Total Inflows (+)</span>
                                    <span className="font-bold text-emerald-400 text-sm block mt-0.5">
                                        +${summaryStats.totalInflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>

                                <div className="bg-rose-500 p-3 rounded-xl border border-rose-500/20">
                                    <span className="text-[9px] text-rose-400 uppercase block font-sans">Total Outflows (-)</span>
                                    <span className="font-bold text-rose-400 text-sm block mt-0.5">
                                        -${summaryStats.totalOutflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>

                                <div className="bg-white p-3 rounded-xl border border-black/5 dark:bg-slate-800">
                                    <span className="text-[9px] text-[#0F172A] uppercase block font-sans">Ending Balance</span>
                                    <span className="font-bold text-white text-sm block mt-0.5">
                                        ${summaryStats.endingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Progress or status bar */}
                        {isGenerating && (
                            <div className="flex items-center gap-3 bg-emerald-500 border border-emerald-500/30 p-3.5 rounded-2xl text-xs text-emerald-400 font-mono animate-pulse">
                                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                                <span>{progressStatus || 'Generating certified PDF document...'}</span>
                            </div>
                        )}

                        {generatedSuccess && (
                            <div className="flex items-center gap-2 bg-emerald-500 border border-emerald-500/40 p-3.5 rounded-2xl text-xs text-emerald-300 font-bold">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                <span>Official Account Statement PDF successfully downloaded to your device!</span>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-2 flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="sm:w-1/3 py-3.5 bg-white hover:bg-slate-700 text-[#0F172A] font-bold text-xs uppercase tracking-wider rounded-xl border border-black/5 transition-all dark:bg-slate-800"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleGeneratePdf}
                                disabled={isGenerating}
                                className="sm:w-2/3 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                <Download className="w-4 h-4 stroke-[2.5]" />
                                <span>{isGenerating ? "Compiling PDF..." : "Generate & Download PDF Statement"}</span>
                            </button>
                        </div>

                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
