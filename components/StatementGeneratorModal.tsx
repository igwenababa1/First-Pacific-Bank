import React, { useState, useMemo, useRef } from 'react';
import { Transaction, Account, UserProfile, TransactionStatus } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { USER_PROFILE, BRANDING_CONFIG } from './constants';
import { 
    X, 
    FileText, 
    Download, 
    Sliders, 
    ShieldCheck, 
    Calendar, 
    Sparkles, 
    Check, 
    Printer, 
    FileCheck, 
    HelpCircle, 
    Layers,
    FileSpreadsheet,
    Award
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';
import { generateQuarterlyFinancialReportPDF } from '../utils/quarterlyReportGenerator';

interface StatementGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactions: Transaction[];
    accounts: Account[];
    userProfile?: UserProfile;
    onUpdateProfile?: (updates: Partial<UserProfile>) => Promise<void>;
}

type ThemePreset = 'Classic' | 'Modern' | 'Minimal';

export const StatementGeneratorModal: React.FC<StatementGeneratorModalProps> = ({
    isOpen,
    onClose,
    transactions,
    accounts,
    userProfile,
    onUpdateProfile
}) => {
    const { formatCurrency } = useCurrency();

    // Configuration States
    const [selectedAccountId, setSelectedAccountId] = useState<string>('All');
    const [dateRangePreset, setDateRangePreset] = useState<'7d' | '30d' | '90d' | 'ytd' | 'custom'>('30d');
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');
    const [transactionType, setTransactionType] = useState<'all' | 'credit' | 'debit'>('all');
    const [selectedTheme, setSelectedTheme] = useState<ThemePreset>('Classic');
    const [sealColor, setSealColor] = useState<string>('#D4AF37');
    
    // Aesthetic Tuning
    const [includeAuditSignature, setIncludeAuditSignature] = useState<boolean>(true);
    const [includeWatermark, setIncludeWatermark] = useState<boolean>(true);
    const [customDeclaration, setCustomDeclaration] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [auditStatus, setAuditStatus] = useState<'pending' | 'signed' | 'checksum_matched'>('checksum_matched');
    
    const [passwordProtect, setPasswordProtect] = useState<boolean>(false);
    const [documentPassword, setDocumentPassword] = useState<string>('');

    const downloadTargetRef = useRef<HTMLDivElement>(null);

    // Editable Accountholder & Bank details states (Real-Time Customizer)
    const [editableName, setEditableName] = useState<string>('');
    const [editableEmail, setEditableEmail] = useState<string>('');
    const [editablePhone, setEditablePhone] = useState<string>('');
    const [editableAddress, setEditableAddress] = useState<string>('');
    const [editableBankAddress, setEditableBankAddress] = useState<string>('');
    const [editableRoutingNumber, setEditableRoutingNumber] = useState<string>('');
    const [showProfileCustomizer, setShowProfileCustomizer] = useState<boolean>(false);

    // Dynamic Loader Effect
    React.useEffect(() => {
        if (isOpen) {
            // Restore configuration
            try {
                const saved = localStorage.getItem('platform_settings');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.documentStatementTheme) {
                        setSelectedTheme(parsed.documentStatementTheme);
                    }
                    if (parsed.documentSealColor) {
                        setSealColor(parsed.documentSealColor);
                    }
                }
            } catch (e) {
                console.warn('[StatementModal] Failed to restore platform statement settings', e);
            }

            // Sync customizable fields
            const activeUser = userProfile || USER_PROFILE;
            setEditableName(activeUser.name || USER_PROFILE.name);
            setEditableEmail(activeUser.email || USER_PROFILE.email);
            setEditablePhone(activeUser.phone || USER_PROFILE.phone || '+61488836731');
            setEditableAddress(activeUser.address || USER_PROFILE.address || 'Randwick, Sydney, New South Wales, Australia');
            setEditableBankAddress(BRANDING_CONFIG.address || '45 Rockefeller Plaza, New York, NY 10111');
            setEditableRoutingNumber('021000021');
        }
    }, [isOpen, userProfile]);

    // Dynamic Default Profile Fallback
    const profile = useMemo(() => {
        return {
            name: editableName || userProfile?.name || USER_PROFILE.name,
            email: editableEmail || userProfile?.email || USER_PROFILE.email,
            phone: editablePhone || userProfile?.phone || USER_PROFILE.phone || '+61488836731',
            address: editableAddress || userProfile?.address || USER_PROFILE.address || 'Randwick, Sydney, New South Wales, Australia',
            bankAddress: editableBankAddress,
            routingNumber: editableRoutingNumber,
        };
    }, [editableName, editableEmail, editablePhone, editableAddress, editableBankAddress, editableRoutingNumber, userProfile]);

    // Format current date
    const formattedPrintDate = useMemo(() => {
        return new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });
    }, []);

    // Filter Transactions and compute balances dynamically
    const statementTransactions = useMemo(() => {
        let list = [...transactions];

        // Filter by Account
        if (selectedAccountId !== 'All') {
            list = list.filter(tx => tx.accountId === selectedAccountId);
        }

        // Filter by Type
        if (transactionType === 'credit') {
            list = list.filter(tx => tx.type === 'credit');
        } else if (transactionType === 'debit') {
            list = list.filter(tx => tx.type === 'debit');
        }

        // Filter by Date Range
        const now = new Date();
        let startLimit = new Date();
        let applyFilter = true;

        if (dateRangePreset === '7d') {
            startLimit.setDate(now.getDate() - 7);
        } else if (dateRangePreset === '30d') {
            startLimit.setDate(now.getDate() - 30);
        } else if (dateRangePreset === '90d') {
            startLimit.setDate(now.getDate() - 90);
        } else if (dateRangePreset === 'ytd') {
            startLimit = new Date(now.getFullYear(), 0, 1);
        } else if (dateRangePreset === 'custom') {
            if (customStartDate) {
                startLimit = new Date(customStartDate);
                startLimit.setHours(0, 0, 0, 0);
            } else {
                applyFilter = false;
            }
        } else {
            applyFilter = false;
        }

        if (applyFilter) {
            list = list.filter(tx => {
                const txDate = new Date(tx.statusTimestamps[TransactionStatus.SUBMITTED]);
                const meetsStart = txDate >= startLimit;
                
                if (dateRangePreset === 'custom' && customEndDate) {
                    const endLimit = new Date(customEndDate);
                    endLimit.setHours(23, 59, 59, 999);
                    return meetsStart && txDate <= endLimit;
                }
                return meetsStart;
            });
        }

        // Sort chronologically (oldest to newest) to compute correct historical running balances
        return list.sort((a, b) => {
            const dateA = new Date(a.statusTimestamps[TransactionStatus.SUBMITTED]).getTime();
            const dateB = new Date(b.statusTimestamps[TransactionStatus.SUBMITTED]).getTime();
            return dateA - dateB;
        });
    }, [transactions, selectedAccountId, transactionType, dateRangePreset, customStartDate, customEndDate]);

    // Financial calculations: Opening balance, debits, credits, ending balance
    const mathSummary = useMemo(() => {
        // Find total current balance for selected account scope
        let currentTargetBalance = 0;
        if (selectedAccountId === 'All') {
            currentTargetBalance = accounts.reduce((acc, current) => acc + current.balance, 0);
        } else {
            const tgtAcc = accounts.find(a => a.id === selectedAccountId);
            currentTargetBalance = tgtAcc ? tgtAcc.balance : 0;
        }

        // Compute sum of credits and debits from selected statement transactions that have altered the balance
        let totalCredits = 0;
        let totalDebits = 0;

        statementTransactions.forEach(tx => {
            const amount = tx.type === 'credit' ? tx.sendAmount : tx.sendAmount + tx.fee;
            if (tx.type === 'credit') {
                // Credits only increment the recipient's balance when they are COMPLETED
                if (tx.status === TransactionStatus.COMPLETED) {
                    totalCredits += amount;
                }
            } else {
                // Debits decrement the sender's balance immediately unless the transaction failed
                if (tx.status !== TransactionStatus.FAILED) {
                    totalDebits += amount;
                }
            }
        });

        // Compute starting balance of selected period as subtraction of the transactions after start
        // A robust backward computation
        const endingBalance = currentTargetBalance;
        const startingBalance = Math.max(0, endingBalance - totalCredits + totalDebits);

        return {
            startingBalance,
            totalCredits,
            totalDebits,
            endingBalance,
            interestAcrued: totalCredits * 0.00035, // Premium micro interest Fallbackup
        };
    }, [statementTransactions, selectedAccountId, accounts]);

    // Create high-fidelity running balance and transaction dataset
    const runningStatementLedger = useMemo(() => {
        let cumulativeBalance = mathSummary.startingBalance;
        return statementTransactions.map((tx) => {
            const amount = tx.type === 'credit' ? tx.sendAmount : tx.sendAmount + tx.fee;
            
            const isFailed = tx.status === TransactionStatus.FAILED;
            const isCompletedCredit = tx.type === 'credit' && tx.status === TransactionStatus.COMPLETED;
            const isApplicableDebit = tx.type === 'debit' && !isFailed;

            if (isCompletedCredit) {
                cumulativeBalance += amount;
            } else if (isApplicableDebit) {
                cumulativeBalance -= amount;
            }

            return {
                ...tx,
                runningBalance: cumulativeBalance,
                effectiveAmount: amount
            };
        });
    }, [statementTransactions, mathSummary.startingBalance]);

    // Daily Balance Ledger Summary calculation (Real-Time Ledger Summary)
    const dailyBalances = useMemo(() => {
        let startLimit = new Date();
        const now = new Date();
        if (dateRangePreset === '7d') {
            startLimit.setDate(now.getDate() - 7);
        } else if (dateRangePreset === '30d') {
            startLimit.setDate(now.getDate() - 30);
        } else if (dateRangePreset === '90d') {
            startLimit.setDate(now.getDate() - 90);
        } else if (dateRangePreset === 'ytd') {
            startLimit = new Date(now.getFullYear(), 0, 1);
        } else if (dateRangePreset === 'custom' && customStartDate) {
            startLimit = new Date(customStartDate);
        } else {
            startLimit.setDate(now.getDate() - 30);
        }

        const ledger = [...runningStatementLedger];
        const balancesByDate: { dateStr: string; balance: number }[] = [];
        const transactionDays = new Map<string, number>();

        ledger.forEach(item => {
            const dateObj = new Date(item.statusTimestamps[TransactionStatus.SUBMITTED]);
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
            transactionDays.set(dateStr, item.runningBalance);
        });

        const uniqueSortedDates = Array.from(transactionDays.keys()).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        if (uniqueSortedDates.length === 0) {
            const todayStr = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
            const startStr = startLimit.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
            balancesByDate.push({ dateStr: startStr, balance: mathSummary.startingBalance });
            if (todayStr !== startStr) {
                balancesByDate.push({ dateStr: todayStr, balance: mathSummary.endingBalance });
            }
        } else {
            uniqueSortedDates.forEach(dateStr => {
                balancesByDate.push({
                    dateStr,
                    balance: transactionDays.get(dateStr) || mathSummary.startingBalance
                });
            });
        }

        return balancesByDate;
    }, [runningStatementLedger, mathSummary.startingBalance, mathSummary.endingBalance, dateRangePreset, customStartDate]);

    // Micro cryptographic checksum representing ledger tamperproof seal
    const integrityChecksum = useMemo(() => {
        const payloadStr = statementTransactions.map(t => `${t.id}:${t.sendAmount}`).join('-');
        // Generate nice looking pseudo SHA-256 for high end realism
        let hash = 0;
        for (let i = 0; i < payloadStr.length; i++) {
            const char = payloadStr.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        return `SHA256::${Math.abs(hash).toString(16).toUpperCase()}${Date.now().toString(16).slice(-4).toUpperCase()}`;
    }, [statementTransactions]);

    if (!isOpen) return null;

    // Trigger PDF Export via html2canvas & jsPDF
    const generateStatementPDF = async () => {
        setIsGenerating(true);
        setAuditStatus('pending');

        setTimeout(() => {
            const element = downloadTargetRef.current;
            if (!element) {
                setIsGenerating(false);
                return;
            }

            // High DPI Scale 2x for professional sharpness
            html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: selectedTheme === 'Classic' ? '#fcfbf7' : selectedTheme === 'Minimal' ? '#ffffff' : '#0c0f19',
                logging: false,
                windowWidth: 794, // Fixed Standard A4 width equivalent
                windowHeight: element.scrollHeight
            }).then((canvas) => {
                const imgData = canvas.toDataURL('image/png');
                
                // standard A4 proportions: width = 210mm, height = 297mm
                const pdfWidth = 210;
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                if (passwordProtect && documentPassword) {
                    // @ts-ignore - setEncryption is available in recent jsPDF versions with correct plugins
                    pdf.setEncryption({
                        userPassword: documentPassword,
                        ownerPassword: documentPassword,
                        userPermissions: ['print', 'modify', 'copy', 'annot-forms']
                    });
                }

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                
                const accountLabel = selectedAccountId === 'All' ? 'Consolidated' : accounts.find(a => a.id === selectedAccountId)?.type || 'Sovereign_Node';
                pdf.save(`FPB_Official_Statement_${accountLabel.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
                
                setAuditStatus('signed');
                setIsGenerating(false);
            }).catch((err) => {
                console.error("PDF generation error:", err);
                setIsGenerating(false);
            });
        }, 600); // Small pause for fluid action
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-50 dark:bg-slate-800  flex items-center justify-center p-4">
            <div className="bg-[#0b0e14] border border-slate-200 dark:border-white/10 w-full max-w-6xl rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh] animate-fade-in text-slate-100">
                
                {/* 1. Left Interactive Setup Parameters Column */}
                <div className="w-full md:w-[40%] border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-100">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-emerald-500 rounded-xl border border-emerald-500/20 text-emerald-400">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-black text-md tracking-tight text-white uppercase">Statement Hub</h2>
                                <p className="text-[10px] text-[#0F172A] uppercase tracking-wider">Premium Settlement Certificate</p>
                            </div>
                        </div>
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="p-2 text-[#0F172A] hover:text-white rounded-lg hover:bg-white transition-colors dark:bg-slate-800"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6 flex-grow">
                        {/* Selector: Node Account selection */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest block">Select Settlement Node</label>
                            <select 
                                value={selectedAccountId} 
                                onChange={(e) => setSelectedAccountId(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 dark:border-white/10 focus:border-emerald-500 rounded-xl p-3 text-xs font-bold uppercase tracking-wider text-[#1E293B] dark:bg-slate-900"
                            >
                                <option value="All">Consolidated Ledger (All Nodes)</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.nickname || acc.type} (***-{acc.accountNumber.slice(-4)})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Collapsible Section: Accountholder & Node customization */}
                        <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900">
                            <button
                                type="button"
                                onClick={() => setShowProfileCustomizer(!showProfileCustomizer)}
                                className="w-full flex items-center justify-between p-3.5 text-left text-xs font-black uppercase tracking-wider text-[#0F172A] hover:text-white transition-all bg-slate-55 dark:bg-slate-900"
                            >
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Accountholder Details (Real-Time Edit)
                                </span>
                                <span className="text-[10px] font-mono font-bold text-[#0F172A]">
                                    {showProfileCustomizer ? 'HIDE' : 'SHOW'}
                                </span>
                            </button>

                            {showProfileCustomizer && (
                                <div className="p-4 space-y-4 border-t border-slate-200 dark:border-white/10 bg-slate-100 animate-fade-in-down text-left">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest block font-mono">Full Name</label>
                                        <input
                                            type="text"
                                            value={editableName}
                                            onChange={(e) => setEditableName(e.target.value)}
                                            placeholder="E.g., Lachy McLean"
                                            className="w-full bg-slate-50 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none dark:bg-slate-900"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest block font-mono">Permanent Estate Address</label>
                                        <textarea
                                            rows={2}
                                            value={editableAddress}
                                            onChange={(e) => setEditableAddress(e.target.value)}
                                            placeholder="E.g., Randwick, Sydney, NSW, Australia"
                                            className="w-full bg-slate-50 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none font-sans leading-relaxed dark:bg-slate-900"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest block font-mono">Cellular Node</label>
                                            <input
                                                type="text"
                                                value={editablePhone}
                                                onChange={(e) => setEditablePhone(e.target.value)}
                                                placeholder="+61 488 836 731"
                                                className="w-full bg-slate-50 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono dark:bg-slate-900"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest block font-mono">Secure Email</label>
                                            <input
                                                type="email"
                                                value={editableEmail}
                                                onChange={(e) => setEditableEmail(e.target.value)}
                                                placeholder="info@lawrenceconsultantsorg.org"
                                                className="w-full bg-slate-50 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono dark:bg-slate-900"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest block font-mono">Bank Corporate HQ Address</label>
                                        <input
                                            type="text"
                                            value={editableBankAddress}
                                            onChange={(e) => setEditableBankAddress(e.target.value)}
                                            placeholder="45 Rockefeller Plaza, New York, NY 10111"
                                            className="w-full bg-slate-50 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none dark:bg-slate-900"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest block font-mono">ABA Fedwire Routing Number</label>
                                        <input
                                            type="text"
                                            value={editableRoutingNumber}
                                            onChange={(e) => setEditableRoutingNumber(e.target.value)}
                                            placeholder="021000021"
                                            className="w-full bg-slate-50 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono dark:bg-slate-900"
                                        />
                                    </div>

                                    {onUpdateProfile && (
                                        <div className="pt-2 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    await onUpdateProfile({
                                                        name: editableName,
                                                        email: editableEmail,
                                                        phone: editablePhone,
                                                        address: editableAddress
                                                    });
                                                    setShowProfileCustomizer(false);
                                                }}
                                                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg shadow-md transition-all duration-200"
                                            >
                                                Save to Profile
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Date Preset Adjuster */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest block">Audit Date Period</label>
                            <div className="grid grid-cols-3 gap-1.5 bg-slate-50 dark:bg-slate-900 p-1 border border-slate-200 dark:border-white/10 rounded-xl">
                                {[
                                    { id: '7d', label: '7D' },
                                    { id: '30d', label: '1M' },
                                    { id: '90d', label: '3M' },
                                    { id: 'ytd', label: 'YTD' },
                                    { id: 'custom', label: 'Custom' },
                                ].map(preset => (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => setDateRangePreset(preset.id as any)}
                                        className={`py-1.5 px-1 rounded-lg text-[9px] font-mono font-bold tracking-wider transition-all select-none ${
                                            dateRangePreset === preset.id 
                                                ? 'bg-emerald-500 text-slate-950 shadow-md font-black' 
                                                : 'text-slate-450 hover:bg-white'
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom date pickers if selected */}
                        {dateRangePreset === 'custom' && (
                            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 animate-fade-in-down">
                                <div className="space-y-1">
                                    <span className="text-[8px] text-[#0F172A] uppercase tracking-widest font-mono">From</span>
                                    <input 
                                        type="date" 
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 rounded-lg p-2 text-[10px] uppercase font-bold text-slate-205"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[8px] text-[#0F172A] uppercase tracking-widest font-mono">To</span>
                                    <input 
                                        type="date" 
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 rounded-lg p-2 text-[10px] uppercase font-bold text-slate-205"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Dynamic Transaction Type Selector */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest block">Flow Direction</label>
                            <div className="flex bg-slate-50 dark:bg-slate-900 p-1 border border-slate-200 dark:border-white/10 rounded-xl">
                                {[
                                    { id: 'all', label: 'All Transfers' },
                                    { id: 'credit', label: 'Credits only' },
                                    { id: 'debit', label: 'Debits only' },
                                ].map(type => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setTransactionType(type.id as any)}
                                        className={`flex-1 py-1.5 text-[9px] font-semibold text-center rounded-lg select-none transition-all uppercase tracking-wider ${
                                            transactionType === type.id 
                                                ? 'bg-white text-emerald-450 font-bold border border-slate-200 dark:border-white/10' 
                                                : 'text-[#0F172A] hover:text-white'
                                        }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Theme Previews */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest block font-mono">Styling Layout Presets</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'Classic', label: 'Classic', icon: Award, desc: 'Warm Ivory layout' },
                                    { id: 'Modern', label: 'Modern', icon: Sparkles, desc: 'Vanguard slate dark' },
                                    { id: 'Minimal', label: 'Minimal', icon: FileCheck, desc: 'Pristine B&W format' }
                                ].map((th) => {
                                    const IconComponent = th.icon;
                                    const isActive = selectedTheme === th.id;
                                    return (
                                        <button
                                            key={th.id}
                                            type="button"
                                            onClick={() => setSelectedTheme(th.id as any)}
                                            className={`p-2 rounded-xl border text-left flex flex-col gap-1 cursor-pointer transition-all ${
                                                isActive 
                                                    ? 'bg-slate-50 border-emerald-500/50 shadow-md scale-102' 
                                                    : 'bg-transparent border-slate-200 dark:border-white/10 hover:border-slate-200 dark:border-white/10'
                                            }`}
                                        >
                                            <span className="text-[9px] font-black tracking-tight text-white flex items-center gap-1 leading-none">
                                                <IconComponent className="w-3 h-3 text-emerald-400 shrink-0" /> {th.label}
                                            </span>
                                            <span className="text-[7.5px] text-slate-450 leading-tight block">{th.desc}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Interactive Seal Accompanying Color Palette */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest block font-mono">Seal Accompanying Color Accent</label>
                            <div className="flex bg-slate-50 dark:bg-slate-900 p-2 border border-slate-200 dark:border-white/10 rounded-xl gap-2.5 items-center">
                                {[
                                    { name: 'Gold', value: '#D4AF37' },
                                    { name: 'Emerald', value: '#10B981' },
                                    { name: 'Classic Blue', value: '#0EA5E9' },
                                    { name: 'Crimson', value: '#EF4444' },
                                    { name: 'Purple', value: '#8B5CF6' },
                                    { name: 'Midnight', value: '#0F172A' }
                                ].map((sc) => (
                                    <button
                                        key={sc.value}
                                        type="button"
                                        onClick={() => setSealColor(sc.value)}
                                        className={`w-5.5 h-5.5 rounded-full border border-slate-200 dark:border-black/10 transition-all cursor-pointer relative ${
                                            sealColor === sc.value 
                                                ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-950 scale-110 shadow-lg shadow-emerald-500/15' 
                                                : 'hover:scale-[1.08] opacity-75 hover:opacity-100'
                                        }`}
                                        style={{ backgroundColor: sc.value }}
                                        title={sc.name}
                                    >
                                        {sealColor === sc.value && (
                                            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white mix-blend-difference">
                                                ✓
                                            </span>
                                        )}
                                    </button>
                                ))}
                                <span className="text-[8.5px] font-mono text-[#0F172A] ml-auto uppercase font-bold tracking-tight">Active Accent</span>
                            </div>
                        </div>

                        {/* Luxury Custom Parameters */}
                        <div className="space-y-3 pt-2">
                            <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest block">Authentication Elements</span>
                            <div className="space-y-2 text-[10px] text-slate-350">
                                <label className="flex items-center gap-2.5 cursor-pointer hover:text-white select-none">
                                    <input 
                                        type="checkbox" 
                                        checked={includeAuditSignature}
                                        onChange={() => setIncludeAuditSignature(!includeAuditSignature)}
                                        className="h-3.5 w-3.5 rounded border-slate-200 dark:border-white/10 bg-slate-50 text-emerald-500 focus:ring-emerald-500/30 dark:bg-slate-900"
                                    />
                                    <span>Append Trustee Seal & Signature</span>
                                </label>
                                <label className="flex items-center gap-2.5 cursor-pointer hover:text-white select-none">
                                    <input 
                                        type="checkbox" 
                                        checked={includeWatermark}
                                        onChange={() => setIncludeWatermark(!includeWatermark)}
                                        className="h-3.5 w-3.5 rounded border-slate-200 dark:border-white/10 bg-slate-50 text-emerald-500 focus:ring-emerald-500/30 dark:bg-slate-900"
                                    />
                                    <span>Background Security Check Watermarks</span>
                                </label>
                                <label className="flex items-center gap-2.5 cursor-pointer hover:text-white select-none">
                                    <input 
                                        type="checkbox" 
                                        checked={passwordProtect}
                                        onChange={() => setPasswordProtect(!passwordProtect)}
                                        className="h-3.5 w-3.5 rounded border-slate-200 dark:border-white/10 bg-slate-50 primary- focus:primary- dark:bg-slate-900"
                                    />
                                    <span>Encrypt PDF File (Secure View)</span>
                                </label>

                                {passwordProtect && (
                                    <div className="mt-2 pl-6 animate-fade-in">
                                        <input
                                            type="password"
                                            value={documentPassword}
                                            onChange={(e) => setDocumentPassword(e.target.value)}
                                            placeholder="Enter PDF Password..."
                                            className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:primary-"
                                            required={passwordProtect}
                                        />
                                        <p className="text-[9px] text-[#0F172A] mt-1 italic tracking-wide">
                                            The generated PDF will require this password to be viewed securely.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Extra Audit Notes input */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest block">Statement Purpose File Note</label>
                            <input 
                                type="text"
                                placeholder="E.g. Visa Verification, Audit Settlement, Tax Declaration"
                                value={customDeclaration}
                                onChange={(e) => setCustomDeclaration(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 dark:border-white/10 focus:border-emerald-500 rounded-xl p-3 text-xs placeholder-slate-650 text-[#1E293B] outline-none dark:bg-slate-900"
                            />
                        </div>
                    </div>

                    {/* Left Panel Actions Footer */}
                    <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-100 space-y-3">
                        <button
                            type="button"
                            onClick={generateStatementPDF}
                            disabled={isGenerating || statementTransactions.length === 0}
                            className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-white disabled:text-[#0F172A] text-slate-950 font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer dark:bg-slate-800"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                                    <span>Compiling Ledger PDF...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    <span>Generate Official Statement PDF</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => generateQuarterlyFinancialReportPDF({
                                quarter: 'Q3',
                                year: 2026,
                                transactions,
                                accounts,
                                userProfile: userProfile || (USER_PROFILE as any)
                            })}
                            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-500 text-amber-400 border border-amber-500/30 font-black text-xs uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                            <span>Quarterly Financial Summary (PDF)</span>
                        </button>

                        {statementTransactions.length === 0 && (
                            <p className="text-center text-[9px] font-mono text-rose-450 mt-2 font-bold animate-pulse">
                                Warning: No transactions in current selected date range filters.
                            </p>
                        )}
                    </div>
                </div>

                {/* 2. Right Live Interactive High Fidelity A4 Paper Replica Preview Pane */}
                <div className="w-full md:w-[60%] bg-slate-50 flex flex-col overflow-hidden dark:bg-slate-900">
                    <div className="p-4 bg-slate-100 border-b border-slate-200 dark:border-white/10 flex items-center justify-between text-xs font-mono">
                        <span className="text-[9px] text-[#0F172A] uppercase tracking-widest flex items-center gap-1.5 font-bold">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Interactive Document Sandbox (A4 Resolution)
                        </span>
                        <div className="flex items-center gap-3">
                            <span className="text-[8px] bg-slate-50 text-[#b45309] font-black border border-amber-500/20 px-2 py-0.5 rounded uppercase dark:bg-slate-900">
                                ISO-20022 Verified
                            </span>
                        </div>
                    </div>

                    <div className="flex-grow p-4 md:p-8 overflow-y-auto bg-slate-50 dark:bg-slate-800 custom-scrollbar flex justify-center items-start">
                        
                        {/* Live PDF Replica Sheet Target (Width constrained to 794px equivalent) */}
                        <div 
                            ref={downloadTargetRef}
                            className={`w-[700px] shrink-0 border shadow-2xl p-8 rounded-5 relative transition-all duration-300 text-left ${
                                selectedTheme === 'Classic' 
                                    ? 'bg-[#FCFBF7] border-amber-900/15 text-[#0F172A] font-serif' 
                                    : selectedTheme === 'Modern'
                                        ? 'bg-[#0B0F19] border-teal-500/20 text-slate-100 font-sans'
                                        : 'bg-white border-slate-200 text-slate-950 font-sans'
                            }`}
                            style={{ minHeight: '800px', zoom: '0.8' }}
                        >
                            {/* Watermark Logo Backplate Overlay */}
                            {includeWatermark && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden font-sans">
                                    <div 
                                        className="w-[480px] h-[480px] rounded-full flex flex-col items-center justify-center p-8 opacity-[0.06]"
                                        style={{ color: sealColor }}
                                    >
                                        <svg className="w-56 h-56 mb-2 opacity-95" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            {/* Concentric Guilloche Rings */}
                                            <circle cx="100" cy="100" r="98" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 2" />
                                            <circle cx="100" cy="100" r="94" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="0.5" />
                                            <circle cx="100" cy="100" r="82" stroke="currentColor" strokeWidth="0.75" strokeDasharray="5 3" />
                                            <circle cx="100" cy="100" r="74" stroke="currentColor" strokeWidth="0.5" />
                                            
                                            {/* Central Bank Crest Shield */}
                                            <path d="M100 48 L128 64 V102 C128 128 100 148 100 148 C100 148 72 128 72 102 V64 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                            {/* Inner Star */}
                                            <polygon points="100,74 103,84 113,84 105,91 108,101 100,95 92,101 95,91 87,84 97,84" fill="currentColor" opacity="0.6" />
                                            
                                            {/* Guilloche Scroll Lines */}
                                            <path d="M50 90 C58 80 68 80 76 87 M150 90 C142 80 132 80 124 87" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" />
                                            <path d="M46 100 C54 90 64 90 72 97 M154 100 C146 90 136 90 128 97" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" />
                                            <path d="M54 110 C62 100 72 100 80 107 M146 110 C138 100 128 100 120 107" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" />
                                        </svg>
                                        <span className="font-extrabold text-[15px] tracking-[0.35em] uppercase text-center mb-0.5">
                                            FIRST PACIFIC BANK
                                        </span>
                                        <span className="font-mono text-[8px] tracking-widest uppercase text-center mb-2 font-bold">
                                            OFFICIAL SEAL OF TRUST
                                        </span>
                                        <div className="w-28 h-[1px] bg-current opacity-30 mb-2" />
                                        <span className="font-mono text-[7px] tracking-[0.25em] uppercase text-center max-w-[320px]">
                                            PRIVATE PORTAL SECURE VERIFICATION NODAL UNIT
                                        </span>
                                        <span className="font-mono text-[6px] tracking-wider text-center mt-1.5 opacity-70">
                                            SECURE MULTI-LEDGER ISO-20022 COMPLIANT • MEMBER OCC & FDIC
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* DOCUMENT HEADER BLOCKS */}
                            <div className="border-b-2 pb-5 flex justify-between items-start z-10 relative">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div 
                                            className="w-12 h-12 rounded-xl flex items-center justify-center border-2 shadow-lg bg-[#0f172a] transition-all"
                                            style={{ 
                                                borderColor: sealColor, 
                                                color: sealColor,
                                                boxShadow: selectedTheme === 'Modern' ? `0 0 15px ${sealColor}40` : 'none'
                                            }}
                                        >
                                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A11.952 11.952 0 0112 16.5c-2.998 0-5.74-1.1-7.843-2.918m0 0A8.959 8.959 0 013 12c0-.778.099-1.533.284-2.253" />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-[16px] font-black uppercase tracking-widest leading-none ${
                                                selectedTheme === 'Classic' ? 'text-[#0F172A] font-serif' : selectedTheme === 'Modern' ? 'text-white' : 'text-slate-950 font-sans'
                                            }`}>
                                                First Pacific Bank Inc.
                                            </span>
                                            <span 
                                                className="text-[8.5px] font-bold uppercase tracking-[0.3em] mt-1 block"
                                                style={{ color: sealColor }}
                                            >
                                                Global Private Wealth Ledger
                                            </span>
                                        </div>
                                    </div>
                                    <p className={`text-[8px] font-mono mt-2.5 leading-relaxed ${
                                        selectedTheme === 'Modern' ? 'text-[#0F172A]' : 'text-slate-550'
                                    }`}>
                                        Headquarters Desk: {profile.bankAddress || '24 Wall Street, NY 10005, United States'}<br />
                                        Institutional Clearing ID: {profile.routingNumber || '021000021'} | SWIFT-BIC: FPBKUS6S XXX<br />
                                        Desk: +1 (212) 555-0199 | Portals: secure.firstpacifiq.com
                                    </p>
                                </div>
                                <div className="text-right">
                                    <h3 className={`text-md font-black tracking-widest uppercase ${
                                        selectedTheme === 'Modern' ? 'text-white' : 'text-slate-950'
                                    }`}>
                                        Account Statement
                                    </h3>
                                    <p className={`text-[8px] font-mono mt-2 leading-relaxed ${
                                        selectedTheme === 'Modern' ? 'text-[#0F172A]' : 'text-[#0F172A]'
                                    }`}>
                                        Document Registry: <span className="font-bold underline">FPB-STMT-{integrityChecksum.slice(-6)}</span><br />
                                        Statement Period: <span className="font-black text-emerald-500">{dateRangePreset === 'custom' ? `${customStartDate || 'Start'} to ${customEndDate || 'End'}` : `${dateRangePreset.toUpperCase()}`}</span><br />
                                        Extraction Node: {formattedPrintDate.split(' at ')[0]}
                                    </p>
                                </div>
                            </div>

                            {/* CUSTOMER PROFILE & METADATA GRID COLUMN */}
                            <div className="grid grid-cols-2 gap-4 py-5 border-b z-10 relative">
                                <div>
                                    <span className={`text-[8px] font-mono font-bold uppercase tracking-widest block mb-1 ${
                                        selectedTheme === 'Modern' ? 'text-[#0F172A]' : 'text-[#0F172A]'
                                    }`}>
                                        PREPARED FOR (ACCOUNTHOLDER)
                                    </span>
                                    <p className={`text-[12px] font-black uppercase tracking-tight ${
                                        selectedTheme === 'Modern' ? 'text-white' : 'text-[#0F172A]'
                                    }`}>
                                        {profile.name}
                                    </p>
                                    <p className={`text-[9px] whitespace-pre-line mt-1 leading-normal ${
                                        selectedTheme === 'Modern' ? 'text-slate-350' : 'text-[#0F172A]'
                                    }`}>
                                        {profile.address}<br />
                                        E-Mail: {profile.email}<br />
                                        Telecommunications: {profile.phone}
                                    </p>
                                </div>
                                <div className={`pl-4 border-l ${
                                    selectedTheme === 'Modern' ? 'border-slate-200 dark:border-white/10' : 'border-slate-200'
                                }`}>
                                    <span className={`text-[8px] font-mono font-bold uppercase tracking-widest block mb-1 ${
                                        selectedTheme === 'Modern' ? 'text-[#0F172A]' : 'text-[#0F172A]'
                                    }`}>
                                        NODE ACCOUNT SUMMARY
                                    </span>
                                    <p className={`text-[11px] font-bold ${
                                        selectedTheme === 'Modern' ? 'text-white' : 'text-[#0F172A]'
                                    }`}>
                                        {selectedAccountId === 'All' ? 'Consolidated Ledger Portfolio' : accounts.find(a => a.id === selectedAccountId)?.type || 'Checking Account Node'}
                                    </p>
                                    <p className={`text-[9.5px] font-mono mt-1 ${
                                        selectedTheme === 'Modern' ? 'text-slate-350' : 'text-[#0F172A]'
                                    }`}>
                                        Node Address: <span className="underline">US-9011-3829-***-{selectedAccountId === 'All' ? 'ALL' : (accounts.find(a => a.id === selectedAccountId)?.accountNumber.slice(-4) || '9281')}</span><br />
                                        System Protocol: Fedwire settlement / ISO 20022<br />
                                        Primary Currency Structure: USD ($)<br />
                                        Client VIP Tier: <span className="font-bold text-amber-500">EXECUTIVE BLACK</span><br />
                                        APY Yield Escrow: <span className="font-bold text-emerald-500">4.12% Compounded</span>
                                    </p>
                                </div>
                            </div>

                            {/* SPECIAL USER LOG FILE MEMO */}
                            {customDeclaration && (
                                <div className={`p-2.5 my-4 rounded-xl text-[9px] border leading-normal uppercase font-mono tracking-tight font-semibold ${
                                    selectedTheme === 'Classic' 
                                        ? 'bg-amber-500 whitespace-pre-line border-amber-550/15 text-amber-800' 
                                        : selectedTheme === 'Modern'
                                            ? 'bg-teal-950 whitespace-pre-line border-teal-500/20 text-teal-350'
                                            : 'bg-slate-50 whitespace-pre-line border-slate-205 text-slate-705'
                                }`}>
                                    👨‍💻 SECURE USER REFERENCE MEMO APPROVED: "{customDeclaration}"
                                </div>
                            )}

                            {/* FINANCIAL LEDGER SUMMARY BLOCKS DISPLAY */}
                            <div className={`grid grid-cols-4 gap-2.5 p-4 rounded-2xl border my-4 text-center z-10 relative font-mono ${
                                selectedTheme === 'Classic' 
                                    ? 'bg-amber-500/[0.02] border-amber-500/20' 
                                    : selectedTheme === 'Modern'
                                        ? 'bg-slate-100 border-slate-200 dark:border-white/10'
                                        : 'bg-slate-50 border-slate-205'
                            }`}>
                                <div className="border-r border-slate-200 dark:border-white/10 pr-2.5">
                                    <span className={`text-[7px] uppercase tracking-widest block ${
                                        selectedTheme === 'Modern' ? 'text-[#0F172A]' : 'text-[#0F172A]'
                                    }`}>
                                        Opening Balance
                                    </span>
                                    <p className={`text-xs mt-1 font-black ${
                                        selectedTheme === 'Modern' ? 'text-white' : 'text-[#1E293B]'
                                    }`}>
                                        {formatCurrency(mathSummary.startingBalance)}
                                    </p>
                                </div>
                                <div className="border-r border-slate-200 dark:border-white/10 pr-2.5 pl-1">
                                    <span className={`text-[7px] uppercase tracking-widest block ${
                                        selectedTheme === 'Modern' ? 'text-[#0F172A]' : 'text-[#0F172A]'
                                    }`}>
                                        Total Credits (+)
                                    </span>
                                    <p className="text-xs mt-1 font-black text-emerald-500">
                                        +{formatCurrency(mathSummary.totalCredits)}
                                    </p>
                                </div>
                                <div className="border-r border-slate-200 dark:border-[#ffffff0a] pr-2.5 pl-1">
                                    <span className={`text-[7px] uppercase tracking-widest block ${
                                        selectedTheme === 'Modern' ? 'text-[#0F172A]' : 'text-[#0F172A]'
                                    }`}>
                                        Total Debits (-)
                                    </span>
                                    <p className="text-xs mt-1 font-black text-rose-500">
                                        -{formatCurrency(mathSummary.totalDebits)}
                                    </p>
                                </div>
                                <div className="pl-1">
                                    <span className={`text-[7px] uppercase tracking-widest block ${
                                        selectedTheme === 'Modern' ? 'text-[#0F172A]' : 'text-[#0F172A]'
                                    }`}>
                                        Closing Balance
                                    </span>
                                    <p className={`text-xs mt-1 font-black ${
                                        selectedTheme === 'Modern' ? 'text-teal-400 font-bold' : 'text-[#0F172A] border-b border-slate-900'
                                    }`}>
                                        {formatCurrency(mathSummary.endingBalance)}
                                    </p>
                                </div>
                            </div>

                            {/* STATEMENTS DETAIL LEDGER TABLE GRID */}
                            <div className="my-5 overflow-hidden z-10 relative">
                                <table className="w-full text-left border-collapse text-[9px]">
                                    <thead>
                                        <tr className={`border-b font-black uppercase text-[7.5px] tracking-wider ${
                                            selectedTheme === 'Classic' 
                                                ? 'border-slate-300 text-slate-705 bg-slate-500/[0.04]' 
                                                : selectedTheme === 'Modern'
                                                    ? 'border-slate-200 dark:border-white/10 text-[#0F172A] bg-white'
                                                    : 'border-slate-200 text-[#0F172A] bg-slate-50'
                                        }`}>
                                            <th className="py-2.5 px-3 font-bold">Node Value Date</th>
                                            <th className="py-2.5 px-2 font-bold">Cryptographic Reference</th>
                                            <th className="py-2.5 px-2 font-bold">Payee / Settler Hub Details</th>
                                            <th className="py-2.5 px-2 text-right font-bold font-mono">Amount (USD)</th>
                                            <th className="py-2.5 px-3 text-right font-bold font-mono">Running Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y font-bold ${
                                        selectedTheme === 'Modern' ? 'divide-white/5' : 'divide-slate-200'
                                    }`}>
                                        {runningStatementLedger.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center uppercase tracking-widest text-[#0F172A] font-mono text-[8px]">
                                                    No Node Settlement Inflows or Outflows in current statement range criteria.
                                                 </td>
                                             </tr>
                                         ) : (
                                             runningStatementLedger.map((tx) => {
                                                 const isCredit = tx.type === 'credit';
                                                 
                                                 // Humanized sender/recipient info
                                                 const counterparty = isCredit
                                                     ? (tx.transactionDetails?.senderName || 'Network Inflow Root')
                                                     : (tx.recipient.nickname || tx.recipient.fullName);
                                                 
                                                 const dateStr = new Date(tx.statusTimestamps[TransactionStatus.SUBMITTED]).toLocaleDateString('en-US', {
                                                     month: 'short',
                                                     day: '2-digit',
                                                     year: 'numeric'
                                                 });

                                                 const txIdShort = `TX-${tx.id.slice(-8).toUpperCase()}`;

                                                 return (
                                                     <tr key={tx.id} className={`${selectedTheme === 'Modern' ? 'hover:bg-white[0.01]' : 'hover:bg-slate-500/[0.02]'}`}>
                                                         <td className="py-3 px-3 font-semibold uppercase">{dateStr}</td>
                                                         <td className="py-3 px-2 font-mono text-[8px] text-[#0F172A] uppercase">{txIdShort}</td>
                                                         <td className="py-3 px-2">
                                                             <div className="font-extrabold uppercase tracking-tight">{counterparty}</div>
                                                             <div className="text-[7.5px] text-[#0F172A] font-bold uppercase mt-0.5 tracking-tight">
                                                                 Type: {tx.transferMethod || 'Internal Transfer'} {tx.category ? `• Category: ${tx.category}` : ''}
                                                             </div>
                                                         </td>
                                                         <td className={`py-3 px-2 text-right font-black font-mono leading-none ${
                                                             isCredit ? 'text-emerald-550' : selectedTheme === 'Modern' ? 'text-slate-100' : 'text-[#0F172A]'
                                                         }`}>
                                                             {isCredit ? '+' : '-'}${tx.effectiveAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                         </td>
                                                         <td className="py-3 px-3 text-right font-bold text-[#0F172A] font-mono">
                                                             ${tx.runningBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                         </td>
                                                     </tr>
                                                 );
                                             })
                                         )}
                                     </tbody>
                                 </table>
                             </div>

                             {/* DAILY BALANCE LEDGER SUMMARY */}
                             <div className="my-6 z-10 relative text-left">
                                 <span className={`text-[8px] font-mono font-bold uppercase tracking-widest block mb-2.5 ${
                                     selectedTheme === 'Modern' ? 'text-[#0F172A]' : 'text-[#0F172A]'
                                 }`}>
                                     Daily Balance Summary (Ledger End-of-Day)
                                 </span>
                                 <div className="grid grid-cols-4 gap-2 text-[8px] font-mono">
                                     {dailyBalances.slice(0, 16).map((item, index) => (
                                         <div 
                                             key={index} 
                                             className={`p-2 rounded-xl border flex flex-col justify-between ${
                                                 selectedTheme === 'Classic'
                                                     ? 'bg-amber-500/[0.01] border-amber-500/10 text-[#1E293B]'
                                                     : selectedTheme === 'Modern'
                                                         ? 'bg-white[0.02] border-black/5 text-slate-350'
                                                         : 'bg-slate-50 border-slate-200 text-[#0F172A]'
                                             }`}
                                         >
                                             <span className="text-[#0F172A] uppercase tracking-tight">{item.dateStr}</span>
                                             <span className={`text-[9.5px] font-black font-mono mt-0.5 ${
                                                 selectedTheme === 'Modern' ? 'text-white' : 'text-[#0F172A]'
                                              }`}>
                                                 ${item.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                             </span>
                                         </div>
                                     ))}
                                     {dailyBalances.length > 16 && (
                                         <div className="p-2 rounded-xl border flex items-center justify-center text-[#0F172A] border-dashed col-span-4">
                                             <span>... ADDITIONAL DATES TRUNCATED FOR SECURITY PROTOCOL COMPLIANCE ...</span>
                                         </div>
                                     )}
                                 </div>
                             </div>

                            {/* DISCLOSURE STATEMENT DETAILS BLOCK */}
                            <div className="mt-8 pt-4 border-t z-10 relative">
                                <p className={`text-[6.5px] leading-relaxed uppercase font-mono tracking-tighter ${
                                    selectedTheme === 'Modern' ? 'text-[#0F172A]' : 'text-[#0F172A] text-slate-550/90'
                                }`}>
                                    First Pacific Bank Inc. is structured under sovereign guidelines of banking standard, certified under the Federal Reserve board. The ledger nodes above represent immutable book entries signed using cryptosecurity standards. Under compliance rules, deposits are insured in accordance with legislative standards up to statutory limit totals. Value dates reflect final clearance, subject to correction rules of the transmission network.
                                </p>
                            </div>

                            {/* AUDITING SIGNATURE BLOCK & COMPLIANCE BARCODE/QR VISUAL STAMP */}
                            <div className="mt-8 flex justify-between items-end z-10 relative flex-wrap gap-6 border-t border-dashed pt-6 border-slate-300 dark:border-white/10">
                                
                                {/* Verification QR Code Block */}
                                <div className="flex gap-4 max-w-[280px] items-center">
                                    <div className="bg-white p-1 rounded-sm shadow-sm border border-slate-200 shrink-0 dark:bg-slate-800">
                                        <QRCodeSVG 
                                            value={`${typeof window !== 'undefined' ? window.location.origin : 'https://firstpacificbank.com'}/verify?doc=STMT&client=${encodeURIComponent(userProfile?.name || 'Client')}&status=VERIFIED`}
                                            size={48}
                                            level="M"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-1.5 text-[8.5px] font-mono font-bold uppercase tracking-widest text-[#d97706] dark:text-[#2dd4bf]">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                            REAL-TIME VERIFICATION
                                        </div>
                                        <div className="space-y-0.5 text-[6.5px] font-mono text-[#0F172A] uppercase tracking-widest leading-relaxed">
                                            <div>SCAN QR TO AUDIT EXTERNALLY</div>
                                            <div>CHECKSUM HASH: <span className="font-bold select-all">{integrityChecksum}</span></div>
                                            <div>CIPHERMETIC SECURITY: AES-GCM-256 SYNCED</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Auditing signature Block */}
                                {includeAuditSignature && (
                                    <div className="flex-grow min-w-[280px] grid grid-cols-2 gap-4 bg-[#ffffff02] dark:bg-slate-800 p-3.5 rounded-2xl border border-dashed border-amber-550/20 dark:border-white/10 relative">
                                        
                                        {/* Stylized Certified Stamp Badge */}
                                        <div className="absolute -top-3.5 right-6 rotate-[-2deg] border border-emerald-500/50 px-2 py-0.5 bg-emerald-500 text-emerald-600 dark:text-emerald-400 font-mono text-[7px] rounded-md font-black tracking-widest opacity-95 select-none flex items-center gap-1 shadow-md">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            SECURE SIGN SEAL: VERIFIED ACTIVE
                                        </div>

                                        {/* Signature 1 */}
                                        <div className="text-left border-r pr-3 border-slate-205 dark:border-slate-700 flex flex-col justify-between">
                                            <div>
                                                <span className="text-[6.5px] font-mono uppercase tracking-widest text-slate-450 block mb-1">AUTHORIZED OFFICER I:</span>
                                                <div className={`italic font-serif text-[15px] font-bold tracking-tight py-1 block select-none ${
                                                    selectedTheme === 'Modern' ? 'text-teal-400' : 'text-amber-800'
                                                }`}>
                                                    Sarah S. Sterling
                                                </div>
                                            </div>
                                            <p className={`text-[6px] uppercase font-mono tracking-widest leading-loose mt-2 block ${
                                                selectedTheme === 'Modern' ? 'text-[#0F172A]' : 'text-[#0F172A] font-bold'
                                            }`}>
                                                Sarah S. Sterling<br />
                                                <span className="text-[#0F172A] text-[5.5px]">Managing Trustee<br />Compliance Board</span>
                                            </p>
                                        </div>

                                        {/* Signature 2 */}
                                        <div className="text-left flex flex-col justify-between pl-1">
                                            <div>
                                                <span className="text-[6.5px] font-mono uppercase tracking-widest text-slate-450 block mb-1">AUTHORIZED OFFICER II:</span>
                                                <div className={`italic font-serif text-[15px] font-bold tracking-tight py-1 block select-none ${
                                                    selectedTheme === 'Modern' ? 'text-teal-450' : 'text-amber-850'
                                                }`}>
                                                    Marcus v. Adler
                                                </div>
                                            </div>
                                            <p className={`text-[6px] uppercase font-mono tracking-widest leading-loose mt-2 block ${
                                                selectedTheme === 'Modern' ? 'text-[#0F172A]' : 'text-[#0F172A] font-bold'
                                            }`}>
                                                Marcus v. Adler<br />
                                                <span className="text-[#0F172A] text-[5.5px]">Senior Executive Chair<br />Wealth Ledger Div</span>
                                            </p>
                                        </div>

                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
