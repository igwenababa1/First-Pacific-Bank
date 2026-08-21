
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { applyBankPdfBackgroundAndWatermark, generateQrCodeDataUrl, embedVerificationQrCodeBlock } from '../utils/pdfWatermarkAndQr';
import { Account, AccountType, Transaction, VerificationLevel, TransactionStatus } from '../types';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { 
    CreditCardIcon, 
    PiggyBankIcon, 
    BuildingOfficeIcon, 
    BankIcon, 
    CheckCircleIcon, 
    PencilIcon, 
    ClockIcon,
    GlobeAmericasIcon,
    LockClosedIcon,
    ArrowsRightLeftIcon,
    TrendingUpIcon,
    ClipboardDocumentIcon,
    DocumentCheckIcon,
    ArrowDownTrayIcon,
    Cog8ToothIcon,
    XIcon,
    EyeIcon,
    EyeSlashIcon,
    WifiIcon,
    PremiumReservedBankLogo,
    VisaIcon,
    MastercardIcon,
    ShieldCheckIcon,
    MapPinIcon,
    PlusCircleIcon,
    UsersIcon
} from './Icons';
import { USER_PROFILE, BRANDING_CONFIG } from './constants';
import { useCurrency } from '../contexts/CurrencyContext';
import { SavingsGoalTracker } from './SavingsGoalTracker';
import { AnimatedCounter } from './AnimatedCounter';

import { UserProfile } from '../types';

interface AccountsProps {
    accounts: Account[];
    transactions: Transaction[];
    verificationLevel: VerificationLevel;
    onUpdateAccountNickname: (accountId: string, nickname: string) => void;
    onLinkAccount: () => void;
    onUpdateAccounts?: (updater: (prev: Account[]) => Account[]) => void;
    userProfile?: UserProfile;
}

// --- Visual Components ---

const LinkedCardVisual: React.FC<{ type: AccountType; lastFour: string }> = ({ type, lastFour }) => {
    // Determine card style based on account type
    const getStyle = () => {
        switch (type) {
            case AccountType.CHECKING: return "bg-gradient-to-br from-slate-900 to-black border-slate-200 dark:border-slate-300"; // Obsidian
            case AccountType.SAVINGS: return "bg-gradient-to-br from-emerald-800 to-teal-900 border-emerald-700"; // Emerald
            case AccountType.BUSINESS: return "bg-gradient-to-br primary- to-indigo-900 primary-"; // Cobalt
            default: return "bg-white dark:bg-slate-900 border-slate-600";
        }
    };

    return (
        <div className={`relative w-40 h-24 rounded-xl shadow-2xl border ${getStyle()} flex flex-col justify-between p-3 overflow-hidden transition-transform transform hover:scale-105 hover:-rotate-2`}>
            {/* Texture */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
            <div className="absolute top-0 right-0 p-2 opacity-70"><WifiIcon className="w-4 h-4 text-[#0F172A] dark:text-white rotate-90" /></div>
            
            <div className="relative z-10 flex items-center gap-1.5">
                <div className="w-6 h-4 bg-yellow-200 rounded-sm"></div>
                <PremiumReservedBankLogo className="w-4 h-4 text-[#0F172A] dark:text-white" />
            </div>

            <div className="relative z-10">
                <p className="text-[#0F172A] dark:text-white font-mono text-[10px] tracking-widest shadow-black drop-shadow-md">•••• {lastFour}</p>
                <div className="flex justify-between items-end mt-1">
                     <p className="text-[6px] text-[#0F172A] dark:text-white uppercase tracking-wider">World Elite</p>
                     <VisaIcon className="w-8 h-auto text-[#0F172A] dark:text-white/90" />
                </div>
            </div>
        </div>
    );
};

const DetailRow: React.FC<{ label: string; value: string; isSecret?: boolean; onCopy?: () => void; isMono?: boolean }> = ({ label, value, isSecret = false, onCopy, isMono }) => {
    const [revealed, setRevealed] = useState(!isSecret);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (onCopy) onCopy();
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex justify-between items-center py-4 border-b border-slate-100 dark:border-white/10 last:border-0 group hover:bg-white[0.02] px-4 -mx-4 transition-colors dark:bg-slate-800">
            <span className="text-xs font-bold text-[#0F172A] uppercase tracking-widest flex items-center gap-2">
                {label}
            </span>
            <div className="flex items-center gap-3">
                <span className={`text-sm font-bold text-[#0F172A] dark:text-[#1E293B] ${isMono ? 'font-mono tracking-wide' : ''} ${!revealed ? 'blur-sm select-none' : ''}`}>
                    {revealed ? value : '••••••••••••'}
                </span>
                <div className="flex gap-1">
                    {isSecret && (
                        <button onClick={() => setRevealed(!revealed)} className="p-1.5 hover:bg-white rounded-lg text-[#0F172A] hover:text-[#0F172A] dark:text-white transition-colors dark:bg-slate-800">
                            {revealed ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                    )}
                    <button onClick={handleCopy} className="p-1.5 hover:bg-white rounded-lg text-[#0F172A] hover:text-primary transition-colors dark:bg-slate-800">
                        {copied ? <CheckCircleIcon className="w-4 h-4 text-emerald-500" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Modal Component ---

export const AccountDetailModal: React.FC<{ 
    account: Account; 
    onClose: () => void; 
    transactions: Transaction[];
    userProfile?: UserProfile;
}> = ({ account, onClose, transactions, userProfile }) => {
    const { formatCurrency } = useCurrency();
    const [activeTab, setActiveTab] = useState<'overview' | 'card' | 'management' | 'settings'>('overview');
    
    // Real-time processing states
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [processingStep, setProcessingStep] = useState(0);
    const [actionComplete, setActionComplete] = useState<string | null>(null);

    // Settings states
    const [settings, setSettings] = useState([
        { id: 'od', label: "Overdraft Protection", desc: "Auto-pull from Savings if balance < $0", active: true },
        { id: 'ru', label: "Round-up Savings", desc: "Round up debits to nearest dollar", active: false },
        { id: 'intl', label: "International Transaction Lock", desc: "Block non-domestic originations", active: false },
        { id: 'hva', label: "High-Value Alert", desc: "SMS for tx > $1,000", active: true },
    ]);

    const handleAction = (actionName: string, steps: string[]) => {
        setIsProcessing(actionName);
        setProcessingStep(0);
        setActionComplete(null);
        
        let step = 0;
        const interval = setInterval(() => {
            step++;
            if (step >= steps.length) {
                clearInterval(interval);
                setIsProcessing(null);
                setActionComplete(actionName);
                setTimeout(() => setActionComplete(null), 4000);
            } else {
                setProcessingStep(step);
            }
        }, 1200);
    };

    const handleDownloadStatement = () => {
        setIsProcessing('Generating Statement');
        setProcessingStep(0);
        setActionComplete(null);
        
        setTimeout(() => {
            const doc = new jsPDF();
            const date = new Date().toLocaleDateString();

            applyBankPdfBackgroundAndWatermark(doc, { title: 'Monthly Statement', documentRef: `REF: FPB-STMT-${date.replace(/\//g, '')}` });

            // 2-Column Symmetrical Top Cards: Owner Registry (Left) & Metadata (Right)
            doc.setFillColor(248, 250, 252); // slate-50
            doc.rect(20, 58, 80, 26, 'F');
            doc.setDrawColor(226, 232, 240); // slate-200
            doc.setLineWidth(0.3);
            doc.rect(20, 58, 80, 26);
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7.5);
            doc.setTextColor(71, 85, 105); // slate-600
            doc.text("ACCOUNT HOLDER REGISTRY", 23, 64);
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(15, 23, 42); // slate-900
            doc.text(userProfile?.name || 'Authorized Portfolio', 23, 70);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139); // slate-500
            const contactPhone = userProfile?.phone || 'Standard Registered Escrow Vault';
            doc.text(`Contact: ${contactPhone}`, 23, 75);
            const contactAddress = userProfile?.address || 'Standard Registered Escrow Vault';
            const truncatedContactAddress = contactAddress.length > 35 ? contactAddress.substring(0, 35) + '...' : contactAddress;
            doc.text(`Address: ${truncatedContactAddress}`, 23, 80);

            doc.setFillColor(248, 250, 252); // slate-50
            doc.rect(110, 58, 80, 26, 'F');
            doc.rect(110, 58, 80, 26);
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7.5);
            doc.setTextColor(71, 85, 105); // slate-600
            doc.text("STATEMENT METADATA", 113, 64);
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(30, 58, 138); // deep blue
            doc.text(`Product: ${account.nickname || account.type}`, 113, 70);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139); // slate-500
            doc.text(`Account Number: ${account.accountNumber}`, 113, 75);
            doc.text(`Statement Date: ${date}`, 113, 80);

            // Dynamic Calculations
            let totalCredits = 0;
            let totalDebits = 0;
            const accountHistory = transactions.filter(t => t.accountId === account.id).slice(0, 20);
            accountHistory.forEach(tx => {
                const amt = tx.type === 'credit' ? tx.sendAmount : (tx.sendAmount + tx.fee);
                if (tx.type === 'credit') {
                    totalCredits += amt;
                } else {
                    totalDebits += amt;
                }
            });
            const startingBalance = account.balance - totalCredits + totalDebits;

            // Balance Summary Box
            doc.setFillColor(248, 250, 252); // slate-50
            doc.rect(20, 92, 170, 20, 'F');
            doc.setDrawColor(226, 232, 240); // slate-200
            doc.rect(20, 92, 170, 20);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139); // slate-500
            doc.text('STARTING BALANCE', 24, 98);
            doc.text('TOTAL DEPOSITS (+)', 66, 98);
            doc.text('TOTAL WITHDRAWALS (-)', 108, 98);
            doc.text('ENDING BALANCE', 150, 98);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.setTextColor(15, 23, 42); // slate-900
            doc.text(formatCurrency(startingBalance), 24, 106);
            doc.setTextColor(22, 163, 74); // green-600
            doc.text(`+${formatCurrency(totalCredits)}`, 66, 106);
            doc.setTextColor(220, 38, 38); // red-600
            doc.text(`-${formatCurrency(totalDebits)}`, 108, 106);
            doc.setTextColor(5, 8, 16);
            doc.text(formatCurrency(account.balance), 150, 106);

            // Transactions Table Header
            const tableTop = 119;
            const colX1 = 20;
            const colX2 = 50;
            const colX3 = 150;
            const colX4 = 190;

            doc.setFillColor(241, 245, 249); // slate-100
            doc.rect(colX1, tableTop, colX4 - colX1, 8, 'F');
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 116, 139);
            doc.text('Date', colX1 + 3, tableTop + 5.5);
            doc.text('Description', colX2 + 3, tableTop + 5.5);
            doc.text('Amount', colX4 - 3, tableTop + 5.5, { align: 'right' });

            // Transactions Data
            let y = tableTop + 8;
            let currentTableStart = tableTop;

            accountHistory.forEach((tx, idx) => {
                const txDate = new Date(tx.statusTimestamps?.[TransactionStatus.SUBMITTED] || Date.now()).toLocaleDateString();
                const amount = `${tx.type === 'credit' ? '+' : '-'}${formatCurrency(tx.type === 'credit' ? tx.sendAmount : tx.sendAmount + tx.fee)}`;
                
                if (idx % 2 === 1) {
                    doc.setFillColor(248, 250, 252);
                    doc.rect(colX1, y, colX4 - colX1, 8, 'F');
                }

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(15, 23, 42);
                doc.text(txDate, colX1 + 3, y + 5.5);
                
                // Truncate description if too long
                const desc = tx.description.length > 50 ? tx.description.substring(0, 50) + '...' : tx.description;
                doc.text(desc, colX2 + 3, y + 5.5);
                
                if (tx.type === 'credit') {
                    doc.setTextColor(22, 163, 74);
                } else {
                    doc.setTextColor(220, 38, 38);
                }
                doc.text(amount, colX4 - 3, y + 5.5, { align: 'right' });
                
                // Divider line
                doc.setDrawColor(226, 232, 240);
                doc.line(colX1, y + 8, colX4, y + 8);

                y += 8;

                if (y > 270) {
                    // Draw border frame and grid lines for the completed part of current page
                    doc.setDrawColor(203, 213, 225);
                    doc.setLineWidth(0.35);
                    doc.rect(colX1, currentTableStart, colX4 - colX1, y - currentTableStart);
                    doc.line(colX2, currentTableStart, colX2, y);
                    doc.line(colX3, currentTableStart, colX3, y);

                    // Add new page
                    doc.addPage();
                    applyBankPdfBackgroundAndWatermark(doc, { title: 'Monthly Statement', documentRef: 'CONT' });

                    // Re-draw table header for continuation
                    currentTableStart = 20;
                    y = currentTableStart;

                    doc.setFillColor(241, 245, 249);
                    doc.rect(colX1, y, colX4 - colX1, 8, 'F');
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(100, 116, 139);
                    doc.text('Date', colX1 + 3, y + 5.5);
                    doc.text('Description', colX2 + 3, y + 5.5);
                    doc.text('Amount', colX4 - 3, y + 5.5, { align: 'right' });
                    
                    y += 8;
                }
            });

            // Draw outer border and vertical lines for final table page
            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.35);
            doc.rect(colX1, currentTableStart, colX4 - colX1, y - currentTableStart);
            doc.line(colX2, currentTableStart, colX2, y);
            doc.line(colX3, currentTableStart, colX3, y);

            // Embed Verification QR Code Block
            const originHost = typeof window !== 'undefined' ? window.location.origin : 'https://firstpacificbank.com';
            const verifyPayload = `${originHost}/verify?doc=STMT_${account.accountNumber.slice(-4)}_${date.replace(/\//g, '-')}&status=VERIFIED`;
            generateQrCodeDataUrl(verifyPayload, 200).then(qrDataUrl => {
                embedVerificationQrCodeBlock(doc, qrDataUrl, 20, 260, { width: 170, height: 20 });
                doc.save(`Statement_${account.accountNumber.slice(-4)}_${date.replace(/\//g, '-')}.pdf`);
                setIsProcessing(null);
                setActionComplete('Statement Generated');
                setTimeout(() => setActionComplete(null), 4000);
            });
        }, 1500);
    };

    const toggleSetting = (id: string) => {
        setSettings(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
        // Trigger small visual indicator if you like
    };

    // Simulate Realistic Banking Data if not provided
    const generatedRouting = useMemo(() => `0${parseInt(account.id.slice(-8), 36).toString().slice(0, 8)}`, [account.id]);
    const generatedSwift = useMemo(() => `PRBUS33${account.type === AccountType.BUSINESS ? 'XXX' : ''}`, [account.type]);
    const generatedIban = useMemo(() => `US${Math.floor(Math.random() * 90) + 10}PRB${generatedRouting}${account.accountNumber.replace(/\s/g, '')}`, [generatedRouting, account.accountNumber]);
    
    const routingNumber = account.routingNumber || generatedRouting;
    const swiftCode = account.swiftBic || generatedSwift;
    const iban = account.iban || generatedIban;
    const branchAddress = "45 Rockefeller Plaza, New York, NY 10111 (Main Branch)";
    
    // Calculate Ledger Balance (Available + random hold)
    const holdAmount = useMemo(() => Math.floor(Math.random() * 500), []);
    const ledgerBalance = account.balance + holdAmount;

    // Filter transactions for this account
    const accountHistory = transactions.filter(t => t.accountId === account.id).slice(0, 5);

    return (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-800  z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#0c121e] w-full max-w-5xl h-[90vh] rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden relative animate-fade-in-up">
                
                {/* Modal Header */}
                <div className="p-8 border-b border-slate-100 dark:border-white/10 flex justify-between items-start bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border border-slate-200 dark:border-white/10 ${account.type === AccountType.CHECKING ? 'primary-' : account.type === AccountType.SAVINGS ? 'bg-emerald-600' : 'bg-purple-600'}`}>
                             {account.type === AccountType.CHECKING ? <CreditCardIcon className="w-8 h-8 text-[#0F172A] dark:text-white"/> : 
                              account.type === AccountType.SAVINGS ? <PiggyBankIcon className="w-8 h-8 text-[#0F172A] dark:text-white"/> :
                              <BuildingOfficeIcon className="w-8 h-8 text-[#0F172A] dark:text-white"/>}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase">{account.nickname || account.type}</h2>
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-green-500 text-green-400 border border-green-500/20 uppercase tracking-wider flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Active
                                </span>
                            </div>
                            <p className="text-sm font-mono text-[#0F172A] dark:text-white tracking-widest mt-1">{account.accountNumber}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white hover:bg-white rounded-2xl text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white transition-colors dark:bg-slate-800">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row flex-grow overflow-hidden">
                    {/* Left Sidebar: Navigation & Quick Stats */}
                    <div className="w-full lg:w-1/3 bg-slate-50 dark:bg-slate-900 border-r border-slate-100 dark:border-white/10 p-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
                        
                        {/* Balance Card */}
                        <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-100 dark:border-white/10 shadow-inner">
                            <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2">Available Liquidity</p>
                            <p className="text-4xl font-black text-[#0F172A] dark:text-white font-mono tracking-tight">
                                <AnimatedCounter value={account.balance} formatCurrency={formatCurrency} />
                            </p>
                            
                            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-[#0F172A]">Ledger Balance</span>
                                    <span className="text-[#0F172A] dark:text-white font-mono">{formatCurrency(ledgerBalance)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-[#0F172A]">Pending Holds</span>
                                    <span className="text-amber-400 font-mono">-{formatCurrency(holdAmount)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex flex-col gap-2">
                            {[
                                { id: 'overview', label: 'Node Overview', icon: GlobeAmericasIcon },
                                { id: 'card', label: 'Linked Instrument', icon: CreditCardIcon },
                                { id: 'management', label: 'Account Management', icon: DocumentCheckIcon },
                                { id: 'settings', label: 'Configuration', icon: Cog8ToothIcon }
                            ].map(tab => (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center justify-between p-4 rounded-2xl transition-all group ${activeTab === tab.id ? 'bg-primary/10 border border-primary/30 shadow-[0_0_20px_rgba(0,82,255,0.1)]' : 'hover:bg-white border border-transparent'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${activeTab === tab.id ? 'bg-primary text-[#0F172A] dark:text-white' : 'bg-white dark:bg-slate-900 text-[#0F172A] group-hover:text-[#0F172A] dark:text-white'}`}>
                                            <tab.icon className="w-5 h-5" />
                                        </div>
                                        <span className={`text-xs font-bold uppercase tracking-wider ${activeTab === tab.id ? 'text-[#0F172A] dark:text-white' : 'text-[#0F172A] group-hover:text-[#0F172A] dark:text-white'}`}>{tab.label}</span>
                                    </div>
                                    {activeTab === tab.id && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#0EA5E9]"></div>}
                                </button>
                            ))}
                        </div>

                        {/* Yield / Interest Info if Savings */}
                        {account.type === AccountType.SAVINGS && (
                            <div className="p-5 bg-emerald-900 rounded-2xl border border-emerald-500/20">
                                <div className="flex items-center gap-3 mb-2">
                                    <TrendingUpIcon className="w-5 h-5 text-emerald-400" />
                                    <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Yield Active</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-2xl font-bold text-[#0F172A] dark:text-white">4.25%</p>
                                        <p className="text-[10px] text-emerald-300/70 uppercase">Annual Percentage Yield</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-[#0F172A] dark:text-white">+$1,240</p>
                                        <p className="text-[10px] text-emerald-300/70 uppercase">YTD Earnings</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Content Area */}
                    <div className="flex-1 bg-[#0c121e] p-10 overflow-y-auto custom-scrollbar relative">
                        {isProcessing && (
                            <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800  z-50 flex flex-col items-center justify-center animate-fade-in">
                                <div className="w-24 h-24 relative mb-6">
                                    <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
                                    <div className="absolute inset-2 border-r-2 border-amber-500 rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>
                                    <BankIcon className="absolute inset-0 m-auto w-8 h-8 text-white animate-pulse" />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">{isProcessing}</h3>
                                <p className="text-primary font-mono text-xs tracking-wider">
                                    {processingStep === 0 && "Initiating secure connection..."}
                                    {processingStep === 1 && "Verifying node credentials..."}
                                    {processingStep === 2 && "Generating cryptographic payload..."}
                                    {processingStep >= 3 && "Finalizing output..."}
                                </p>
                            </div>
                        )}
                        
                        {actionComplete && (
                            <div className="absolute inset-0 bg-emerald-950  z-50 flex flex-col items-center justify-center animate-fade-in">
                                <CheckCircleIcon className="w-24 h-24 text-emerald-400 mb-6 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                                <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">{actionComplete} Successful</h3>
                                <p className="text-emerald-400 font-mono text-xs tracking-wider">Operation completed securely.</p>
                            </div>
                        )}
                        
                        {activeTab === 'overview' && (
                            <div className="space-y-10 animate-fade-in">
                                <div>
                                    <h3 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                                        <BankIcon className="w-5 h-5 text-primary" /> Routing Coordinates
                                    </h3>
                                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-3xl p-6 shadow-inner">
                                        <DetailRow label="Institution" value="Premium Reserved Bank, N.A." />
                                        <DetailRow label="Home Branch" value={branchAddress} onCopy={() => navigator.clipboard.writeText(branchAddress)} />
                                        <DetailRow label="Routing (ABA)" value={routingNumber} isSecret onCopy={() => navigator.clipboard.writeText(routingNumber)} isMono />
                                        <DetailRow label="Account Number" value={account.accountNumber.replace(/\D/g,'')} isSecret onCopy={() => navigator.clipboard.writeText(account.accountNumber)} isMono />
                                        <DetailRow label="SWIFT / BIC" value={swiftCode} onCopy={() => navigator.clipboard.writeText(swiftCode)} isMono />
                                        <DetailRow label="IBAN (USD)" value={iban} isSecret onCopy={() => navigator.clipboard.writeText(iban)} isMono />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                                        <ClockIcon className="w-5 h-5 text-primary" /> Recent Ledger Activity
                                    </h3>
                                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-3xl overflow-hidden">
                                        {accountHistory.length > 0 ? accountHistory.map(tx => (
                                            <div key={tx.id} className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-white/10 last:border-0 hover:bg-white[0.02] transition-colors group dark:bg-slate-800">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-xl ${tx.type === 'credit' ? 'bg-emerald-500 text-emerald-500' : 'bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white'}`}>
                                                        {tx.type === 'credit' ? <ArrowsRightLeftIcon className="w-5 h-5 rotate-45" /> : <ArrowsRightLeftIcon className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-[#0F172A] dark:text-[#1E293B] text-sm group-hover:text-[#0F172A] dark:text-white transition-colors">{tx.description}</p>
                                                        <p className="text-[10px] text-[#0F172A] uppercase font-bold tracking-wider mt-1">{new Date(tx.statusTimestamps?.[TransactionStatus.SUBMITTED] || Date.now()).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <span className={`font-mono font-bold ${tx.type === 'credit' ? 'text-emerald-400' : 'text-[#0F172A] dark:text-white'}`}>
                                                    {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.type === 'credit' ? tx.sendAmount : tx.sendAmount + tx.fee)}
                                                </span>
                                            </div>
                                        )) : (
                                            <div className="p-12 text-center text-[#0F172A] text-xs font-bold uppercase tracking-widest border-2 border-dashed border-slate-100 dark:border-white/10 m-4 rounded-2xl">
                                                No recent activity recorded on this node
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={handleDownloadStatement} className="w-full mt-4 py-4 bg-white hover:bg-white rounded-2xl text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest transition-all hover:text-primary dark:bg-slate-800">
                                        Download Monthly Statement
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'card' && (
                            <div className="h-full flex flex-col items-center justify-center space-y-10 animate-fade-in">
                                <div className="text-center">
                                    <h3 className="text-2xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Linked Payment Instrument</h3>
                                    <p className="text-[#0F172A] dark:text-white text-sm mt-2">Physical card associated with this node.</p>
                                </div>

                                <div className="relative group perspective-1000">
                                    <div className={`relative w-[400px] h-[250px] rounded-[2rem] p-8 shadow-2xl transition-transform duration-700 transform group-hover:rotate-y-12 ${account.type === 'Global Checking' ? 'bg-slate-100 border-slate-200 dark:border-slate-700' : 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-200 dark:border-white/10'} border`}>
                                        {/* Card Visual Content (High Fidelity) */}
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
                                        <div className="relative z-10 h-full flex flex-col justify-between">
                                            <div className="flex justify-between items-start">
                                                <PremiumReservedBankLogo className="w-10 h-10 text-[#0F172A] dark:text-white" />
                                                <WifiIcon className="w-8 h-8 text-[#0F172A] dark:text-white/50 rotate-90" />
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-9 bg-yellow-200 rounded-md"></div>
                                                <p className="text-2xl font-mono text-[#0F172A] dark:text-white tracking-widest shadow-black drop-shadow-md">•••• {account.accountNumber.slice(-4)}</p>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[8px] font-black text-[#0F172A] dark:text-white uppercase tracking-[0.2em] mb-1">Cardholder</p>
                                                    <p className="text-[#0F172A] dark:text-white font-bold uppercase tracking-wider">{userProfile?.name || USER_PROFILE.name}</p>
                                                </div>
                                                <VisaIcon className="w-16 h-auto text-[#0F172A] dark:text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                                    <button onClick={() => handleAction('Security Lock', ['', ''])} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-red-500/50 hover:bg-red-500 group transition-all">
                                        <LockClosedIcon className="w-6 h-6 text-[#0F172A] dark:text-white group-hover:text-red-500 mx-auto mb-2" />
                                        <p className="text-xs font-bold text-[#0F172A] dark:text-white group-hover:text-red-400">Lock Card</p>
                                    </button>
                                    <button onClick={() => handleAction('Travel Mode Handshake', ['', '', ''])} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-primary/50 hover:bg-primary/10 group transition-all">
                                        <GlobeAmericasIcon className="w-6 h-6 text-[#0F172A] dark:text-white group-hover:text-primary mx-auto mb-2" />
                                        <p className="text-xs font-bold text-[#0F172A] dark:text-white group-hover:text-primary">Travel Mode</p>
                                    </button>
                                    <button onClick={() => handleAction('PIN Verification Check', ['', ''])} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-primary/50 hover:bg-primary/10 group transition-all">
                                        <ShieldCheckIcon className="w-6 h-6 text-[#0F172A] dark:text-white group-hover:text-primary mx-auto mb-2" />
                                        <p className="text-xs font-bold text-[#0F172A] dark:text-white group-hover:text-primary">View PIN</p>
                                    </button>
                                    <button onClick={() => handleAction('Replacement Request', ['', '', '', ''])} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-primary/50 hover:bg-primary/10 group transition-all">
                                        <ArrowDownTrayIcon className="w-6 h-6 text-[#0F172A] dark:text-white group-hover:text-primary mx-auto mb-2" />
                                        <p className="text-xs font-bold text-[#0F172A] dark:text-white group-hover:text-primary">Replace</p>
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'management' && (
                            <div className="space-y-8 animate-fade-in">
                                <h3 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                                    <DocumentCheckIcon className="w-5 h-5 text-primary" /> Account Management
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button onClick={handleDownloadStatement} className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-3xl hover:border-primary/30 hover:bg-primary/5 transition-all group text-left">
                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:text-primary text-[#0F172A] dark:text-white transition-colors">
                                            <DocumentCheckIcon className="w-5 h-5" />
                                        </div>
                                        <h4 className="text-sm font-bold text-[#0F172A] dark:text-white mb-1">Monthly Statement</h4>
                                        <p className="text-[10px] text-[#0F172A] uppercase tracking-wider font-bold">Download official document</p>
                                    </button>

                                    <button onClick={() => handleAction('Beneficiary Sync', ['', '', ''])} className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-3xl hover:border-primary/30 hover:bg-primary/5 transition-all group text-left">
                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:text-primary text-[#0F172A] dark:text-white transition-colors">
                                            <UsersIcon className="w-5 h-5" />
                                        </div>
                                        <h4 className="text-sm font-bold text-[#0F172A] dark:text-white mb-1">Beneficiaries</h4>
                                        <p className="text-[10px] text-[#0F172A] uppercase tracking-wider font-bold">Manage trusted contacts</p>
                                    </button>

                                    <button onClick={() => handleAction('Payroll Integration', ['', '', '', ''])} className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-3xl hover:border-primary/30 hover:bg-primary/5 transition-all group text-left">
                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:text-primary text-[#0F172A] dark:text-white transition-colors">
                                            <ArrowDownTrayIcon className="w-5 h-5" />
                                        </div>
                                        <h4 className="text-sm font-bold text-[#0F172A] dark:text-white mb-1">Direct Deposit</h4>
                                        <p className="text-[10px] text-[#0F172A] uppercase tracking-wider font-bold">Generate employer form</p>
                                    </button>

                                    <button onClick={() => handleAction('Limit Authorization', ['', '', ''])} className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-3xl hover:border-primary/30 hover:bg-primary/5 transition-all group text-left">
                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:text-primary text-[#0F172A] dark:text-white transition-colors">
                                            <ShieldCheckIcon className="w-5 h-5" />
                                        </div>
                                        <h4 className="text-sm font-bold text-[#0F172A] dark:text-white mb-1">Account Limits</h4>
                                        <p className="text-[10px] text-[#0F172A] uppercase tracking-wider font-bold">View & request increases</p>
                                    </button>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-3xl p-6 shadow-inner mt-8">
                                    <h4 className="text-sm font-bold text-[#0F172A] dark:text-white mb-4 uppercase tracking-wider">Wire Transfer Instructions</h4>
                                    <DetailRow label="Bank Name" value="Premium Reserved Bank, N.A." />
                                    <DetailRow label="Routing Number" value={routingNumber} isSecret onCopy={() => navigator.clipboard.writeText(routingNumber)} isMono />
                                    <DetailRow label="Account Number" value={account.fullAccountNumber || account.accountNumber.replace(/\D/g,'')} isSecret onCopy={() => navigator.clipboard.writeText(account.fullAccountNumber || account.accountNumber.replace(/\D/g,''))} isMono />
                                    <DetailRow label="SWIFT Code" value={swiftCode} onCopy={() => navigator.clipboard.writeText(swiftCode)} isMono />
                                    <DetailRow label="IBAN" value={iban} onCopy={() => navigator.clipboard.writeText(iban)} isMono />
                                    <DetailRow label="Bank Address" value={branchAddress} onCopy={() => navigator.clipboard.writeText(branchAddress)} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="space-y-8 animate-fade-in">
                                <h3 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-tight mb-6">Account Configuration</h3>
                                
                                <div className="space-y-4">
                                    {settings.map((setting) => (
                                        <div key={setting.id} onClick={() => toggleSetting(setting.id)} className="flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/10 cursor-pointer hover:border-primary/30 transition-all">
                                            <div>
                                                <p className="font-bold text-[#0F172A] dark:text-[#1E293B] text-sm">{setting.label}</p>
                                                <p className="text-[10px] text-[#0F172A] font-bold uppercase tracking-wider mt-1">{setting.desc}</p>
                                            </div>
                                            <div className={`w-12 h-6 rounded-full relative transition-colors ${setting.active ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${setting.active ? 'left-7' : 'left-1'}`}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-6 border-t border-slate-100 dark:border-white/10">
                                    <button onClick={() => handleAction('Account Freeze Directive', ['', '', ''])} className="w-full py-5 bg-red-500 hover:bg-red-500 text-red-500 font-black uppercase tracking-widest text-xs rounded-2xl border border-red-500/30 transition-all flex items-center justify-center gap-3">
                                        <LockClosedIcon className="w-4 h-4" /> Freeze Node Access
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

const ACCOUNT_BACKGROUNDS: Record<AccountType, string> = {
    [AccountType.CHECKING]: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=800&auto=format&fit=crop",
    [AccountType.SAVINGS]: "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=800&auto=format&fit=crop",
    [AccountType.JOINT]: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=800&auto=format&fit=crop",
    [AccountType.BUSINESS]: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop",
    [AccountType.EXTERNAL_LINKED]: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
};

const AccountCard: React.FC<{ 
    account: Account; 
    onUpdateNickname: (id: string, name: string) => void; 
    verificationLevel: VerificationLevel; 
    onClick: () => void;
    subaccounts?: Account[];
    onQuickTransfer?: (fromId: string, toId: string, amount: number) => void;
}> = ({ account, onUpdateNickname, verificationLevel, onClick, subaccounts = [], onQuickTransfer }) => {
    const { formatCurrency } = useCurrency();
    const [isEditing, setIsEditing] = useState(false);
    const [nickname, setNickname] = useState(account.nickname || '');
    
    // Parallax & Premium Zoom Effects
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const rotateX = useTransform(mouseY, [-100, 100], [4, -4]);
    const rotateY = useTransform(mouseX, [-100, 100], [-4, 4]);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        mouseX.set(e.clientX - centerX);
        mouseY.set(e.clientY - centerY);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    const handleSave = (e: React.FocusEvent | React.FormEvent) => {
        e.stopPropagation();
        onUpdateNickname(account.id, nickname);
        setIsEditing(false);
    };

    const bgTransform = useTransform(
        [rotateX, rotateY],
        ([rx, ry]) => `scale(1.15) translateX(${-(ry as number) * 2}px) translateY(${(rx as number) * 2}px) translateZ(-20px)`
    );

    const bgImage = ACCOUNT_BACKGROUNDS[account.type] || ACCOUNT_BACKGROUNDS[AccountType.CHECKING];

    return (
        <motion.div 
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            whileHover={{ 
                scale: 1.02, 
                y: -4, 
                boxShadow: "0 25px 45px -10px rgba(0, 0, 0, 0.45), 0 0 32px 2px rgba(16, 185, 129, 0.22), 0 0 10px rgba(255, 255, 255, 0.1)" 
            }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            style={{ rotateX, rotateY, transformPerspective: 1000 }}
            className="relative bg-slate-50 rounded-[2.5rem] shadow-xl border border-slate-300/50 dark:border-white/10 hover:border-emerald-400/50 p-8 group cursor-pointer overflow-hidden transform-gpu transition-colors duration-300 dark:bg-slate-900"
        >
            {/* Soft Ambient Hover Glow Layer */}
            <div className="absolute inset-0 rounded-[2.5rem] ring-1 ring-inset ring-emerald-400/0 group-hover:ring-emerald-400/40 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none z-10"></div>

            {/* Premium Zoom Shifting Background */}
            <motion.div 
                className="absolute inset-[-15%] w-[130%] h-[130%] pointer-events-none transition-transform duration-300 ease-out z-0 opacity-40 group-hover:opacity-70 mix-blend-luminosity"
                style={{
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transform: bgTransform
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/60 to-slate-950/90 z-0 pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-0 pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-0 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
                
                {/* Account Info */}
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border border-slate-200 dark:border-white/10 ${account.type === AccountType.CHECKING ? 'primary- primary-' : account.type === AccountType.SAVINGS ? 'bg-emerald-600 text-emerald-400' : account.type === AccountType.JOINT ? 'bg-amber-500 text-amber-400' : 'bg-slate-100 dark:bg-slate-700 text-[#0F172A] dark:text-white'}`}>
                             {account.type === AccountType.CHECKING ? <CreditCardIcon className="w-7 h-7"/> : 
                              account.type === AccountType.SAVINGS ? <PiggyBankIcon className="w-7 h-7"/> :
                              account.type === AccountType.JOINT ? <UsersIcon className="w-7 h-7"/> :
                              <BuildingOfficeIcon className="w-7 h-7"/>}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                {isEditing ? (
                                    <input 
                                        value={nickname} 
                                        onChange={e => setNickname(e.target.value)} 
                                        onBlur={handleSave} 
                                        onClick={e => e.stopPropagation()}
                                        autoFocus 
                                        className="font-black text-xl text-[#0F172A] dark:text-white bg-transparent border-b-2 border-primary outline-none py-1" 
                                    />
                                ) : (
                                    <h3 className="font-black text-xl text-[#0F172A] dark:text-white tracking-tight uppercase group-hover:text-primary transition-colors">{account.nickname || account.type}</h3>
                                )}
                                {!isEditing && (
                                    <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-1.5 bg-white rounded-lg text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white transition-colors opacity-0 group-hover:opacity-100 dark:bg-slate-800">
                                        <PencilIcon className="w-3 h-3" />
                                    </button>
                                )}
                             </div>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">{account.type}</p>
                                <span className="text-[#0F172A] text-[10px]">•</span>
                                <p className="text-[10px] text-[#0F172A] dark:text-white font-mono tracking-widest">{account.accountNumber}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex gap-2">
                        {account.type === AccountType.SAVINGS && (
                            <span className="px-3 py-1 bg-emerald-500 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1">
                                <TrendingUpIcon className="w-3 h-3" /> 4.25% APY
                            </span>
                        )}
                        {account.type === AccountType.JOINT && (
                            <span className="px-3 py-1 bg-amber-500 border border-amber-500/20 text-amber-400 text-[9px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1">
                                <UsersIcon className="w-3 h-3" /> Multi-owner Ledger
                            </span>
                        )}
                        <span className="px-3 py-1 bg-white border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white text-[9px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 dark:bg-slate-800">
                            <ShieldCheckIcon className="w-3 h-3" /> Protected
                        </span>
                    </div>
                </div>
                
                {/* Visual Connection: Card & Balance */}
                <div className="flex flex-col items-end gap-6">
                    <div className="text-right">
                        <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-[0.3em] mb-1 block">Available Liquidity</span>
                        <p className="text-4xl font-black text-[#0F172A] dark:text-white font-mono tracking-tighter">
                            {account.type === AccountType.EXTERNAL_LINKED ? 'SYNC_ACTIVE' : <AnimatedCounter value={account.balance} formatCurrency={formatCurrency} />}
                        </p>
                    </div>

                    {/* The 3D Card Visual */}
                    {account.type !== AccountType.EXTERNAL_LINKED && (
                        <div className="perspective-1000 group-hover:scale-105 transition-transform duration-500">
                            <div className="transform rotate-y-12 rotate-x-6 hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700">
                                <LinkedCardVisual type={account.type} lastFour={account.accountNumber.slice(-4)} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Subaccounts Container inside main card */}
            {subaccounts.length > 0 && (
                <div className="mt-8 pt-8 border-t border-slate-200/50 dark:border-white/10 space-y-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                            Partitioned Subaccounts ({subaccounts.length})
                        </h4>
                        <span className="text-[10px] text-[#0F172A] font-mono text-xs">Internal Allocations</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {subaccounts.map(sub => (
                            <div key={sub.id} className="p-5 bg-white dark:bg-slate-800 rounded-[1.5rem] border border-slate-200/40 dark:border-white/10 hover:border-primary/20 hover:bg-white dark:hover:bg-slate-50 dark:bg-slate-800 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="space-y-1">
                                    <h5 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-wide">{sub.nickname || sub.type}</h5>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] text-[#0F172A] font-mono">{sub.accountNumber}</p>
                                        <span className="text-[#0F172A] text-[10px]">•</span>
                                        <p className="text-[10px] text-[#0F172A] uppercase tracking-widest font-bold">{sub.type}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                    <div className="text-right">
                                        <p className="text-xl font-black text-[#0F172A] dark:text-white font-mono tracking-tight">
                                            <AnimatedCounter value={sub.balance} formatCurrency={formatCurrency} />
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => {
                                                const amtStr = prompt(`Fund "${sub.nickname || sub.type}" from master "${account.nickname || account.type}":\n(Master Available Balance: ${formatCurrency(account.balance)})`);
                                                if (amtStr) {
                                                    const amt = parseFloat(amtStr);
                                                    if (!isNaN(amt) && amt > 0 && amt <= account.balance) {
                                                        onQuickTransfer?.(account.id, sub.id, amt);
                                                    } else {
                                                        alert("Invalid transfer quantum or insufficient master liquidity.");
                                                    }
                                                }
                                            }}
                                            className="px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/25 text-primary text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all"
                                        >
                                            Inward Fund
                                        </button>
                                        <button 
                                            onClick={() => {
                                                const amtStr = prompt(`Sweep funds from "${sub.nickname || sub.type}" back to master "${account.nickname || account.type}":\n(Subaccount Available Balance: ${formatCurrency(sub.balance)})`);
                                                if (amtStr) {
                                                    const amt = parseFloat(amtStr);
                                                    if (!isNaN(amt) && amt > 0 && amt <= sub.balance) {
                                                        onQuickTransfer?.(sub.id, account.id, amt);
                                                    } else {
                                                        alert("Invalid sweep quantum or insufficient subaccount liquidity.");
                                                    }
                                                }
                                            }}
                                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-700 text-[#0F172A] dark:text-[#1E293B] text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all border border-slate-200 dark:border-white/10"
                                        >
                                            Sweep Back
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-white/10 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-[#0F172A]">
                <span>Node Status: <span className="text-emerald-500">Online</span></span>
                <span className="flex items-center gap-1 group-hover:text-primary transition-colors">
                    Manage Node <ArrowDownTrayIcon className="w-3 h-3 rotate-[-90deg]" />
                </span>
            </div>
        </motion.div>
    );
};

interface AccountComparisonDetails {
  name: string;
  type: AccountType;
  interestRate: string;
  maintenanceFee: string;
  transactionBenefits: string[];
  minimumBalance: string;
  withdrawalLimits: string;
  clearingTime: string;
  cardType: string;
  keyAcro: string;
}

const COMPARISON_DATA: Record<AccountType, AccountComparisonDetails> = {
  [AccountType.CHECKING]: {
    name: "Global Checking",
    type: AccountType.CHECKING,
    interestRate: "0.45% APY",
    maintenanceFee: "$0 / month (No minimum)",
    transactionBenefits: [
      "Unlimited instant global wires",
      "0% foreign exchange spread markup",
      "Complimentary Obsidian Visa Card",
      "Real-time fraud prevention engine",
      "No fee at over 80,000 global ATMs"
    ],
    minimumBalance: "$0 (No deposit minimum)",
    withdrawalLimits: "Unlimited transfers & POS payments",
    clearingTime: "Real-time clearing & settlement",
    cardType: "Obsidian Visa Metal",
    keyAcro: "CH"
  },
  [AccountType.SAVINGS]: {
    name: "High-Yield Savings",
    type: AccountType.SAVINGS,
    interestRate: "5.85% APY (Paid monthly)",
    maintenanceFee: "$0 / month",
    transactionBenefits: [
      "Interest compounding daily",
      "Automated savings goal tracker",
      "Direct integration with asset yield pools",
      "24/7 dedicated wealth advisory access",
      "Instant internal transfers to checking"
    ],
    minimumBalance: "$1,000 to earn high-yield rate",
    withdrawalLimits: "6 free withdrawals per cycle",
    clearingTime: "Same-day clearing",
    cardType: "Not applicable (Investment only)",
    keyAcro: "SV"
  },
  [AccountType.BUSINESS]: {
    name: "Business Pro",
    type: AccountType.BUSINESS,
    interestRate: "1.25% APY (On balances >$50k)",
    maintenanceFee: "$15 / month (Waived with $5k avg balance)",
    transactionBenefits: [
      "Bulk payout processing & API integration",
      "Custom employee expense debit cards",
      "QuickBooks & Xero direct ledger sync",
      "Priority SWIFT & SEPA routing corridors",
      "Dedicated account relationship manager"
    ],
    minimumBalance: "$2,000 minimum deposit",
    withdrawalLimits: "Custom business-defined limits",
    clearingTime: "Instant within network, SEPA/SWIFT in <1 hour",
    cardType: "Cobalt World Elite Mastercard",
    keyAcro: "BS"
  },
  [AccountType.JOINT]: {
    name: "Joint Reserve",
    type: AccountType.JOINT,
    interestRate: "3.50% APY (On combined savings)",
    maintenanceFee: "$0 / month",
    transactionBenefits: [
      "Dual multi-signature authorization controls",
      "Combined monthly consolidated statements",
      "Two complimentary World Elite cards",
      "Direct shared-expense automated splitting",
      "Real-time dual SMS activity updates"
    ],
    minimumBalance: "$500 minimum combined balance",
    withdrawalLimits: "Standard limits apply per signature",
    clearingTime: "Real-time clearing & settlement",
    cardType: "Premium Joint Titanium Visa",
    keyAcro: "JT"
  },
  [AccountType.EXTERNAL_LINKED]: {
    name: "External Linked Account",
    type: AccountType.EXTERNAL_LINKED,
    interestRate: "N/A (Governed by external bank)",
    maintenanceFee: "N/A (Governed by external bank)",
    transactionBenefits: [
      "Direct ACH debit and credit sweeping",
      "Auto-replenishment threshold transfers",
      "Consolidated multi-bank wealth tracking",
      "Secure encrypted Plaid handshake"
    ],
    minimumBalance: "N/A",
    withdrawalLimits: "$50,000 maximum daily transfer limit",
    clearingTime: "2-3 business days ACH clearing",
    cardType: "Third-party card (non-PRB)",
    keyAcro: "EX"
  }
};

export const Accounts: React.FC<AccountsProps> = ({ accounts, transactions, verificationLevel, onUpdateAccountNickname, onLinkAccount, onUpdateAccounts, userProfile }) => {
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const navigate = useNavigate();
    const { formatCurrency } = useCurrency();
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    const handleGenerateMonthlyReport = () => {
        setIsGeneratingReport(true);
        
        setTimeout(() => {
            try {
                const doc = new jsPDF();
                const now = new Date();
                const date = now.toLocaleDateString();
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

                applyBankPdfBackgroundAndWatermark(doc, { title: 'Consolidated Performance Report', documentRef: `REF: FPB-PERF-${date.replace(/\//g, '')}` });
                
                // 2-Column Symmetrical Top Cards: Owner Registry (Left) & Metadata (Right)
                doc.setFillColor(248, 250, 252); // slate-50
                doc.rect(20, 58, 80, 26, 'F');
                doc.setDrawColor(226, 232, 240); // slate-200
                doc.setLineWidth(0.3);
                doc.rect(20, 58, 80, 26);
                
                doc.setFont("helvetica", "bold");
                doc.setFontSize(7.5);
                doc.setTextColor(71, 85, 105); // slate-600
                doc.text("PORTFOLIO OWNER REGISTRY", 23, 64);
                
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                doc.setTextColor(15, 23, 42); // slate-900
                doc.text(userProfile?.name || USER_PROFILE.name || 'Authorized Portfolio', 23, 70);
                
                doc.setFont("helvetica", "normal");
                doc.setFontSize(7.5);
                doc.setTextColor(100, 116, 139); // slate-500
                const contactPhone = userProfile?.phone || USER_PROFILE.phone || 'Standard Registered Escrow Vault';
                doc.text(`Contact: ${contactPhone}`, 23, 75);
                const contactAddress = userProfile?.address || USER_PROFILE.address || 'Standard Registered Escrow Vault';
                const truncatedContactAddress = contactAddress.length > 35 ? contactAddress.substring(0, 35) + '...' : contactAddress;
                doc.text(`Address: ${truncatedContactAddress}`, 23, 80);

                doc.setFillColor(248, 250, 252); // slate-50
                doc.rect(110, 58, 80, 26, 'F');
                doc.rect(110, 58, 80, 26);
                
                doc.setFont("helvetica", "bold");
                doc.setFontSize(7.5);
                doc.setTextColor(71, 85, 105); // slate-600
                doc.text("REPORT METADATA", 113, 64);
                
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                doc.setTextColor(30, 58, 138); // deep blue
                doc.text(`Scope: All Reserves & Trusts`, 113, 70);
                
                doc.setFont("helvetica", "normal");
                doc.setFontSize(7.5);
                doc.setTextColor(100, 116, 139); // slate-500
                doc.text(`Reporting Period: Last 30 Days`, 113, 75);
                doc.text(`Generated Date: ${date}`, 113, 80);

                // Filter transactions for last 30 days
                const recentTx = (transactions || []).filter(tx => {
                    const txDateStr = tx.statusTimestamps?.[TransactionStatus.SUBMITTED] || tx.statusTimestamps?.['Submitted'] || tx.scheduledDate || Date.now();
                    const txDate = new Date(txDateStr);
                    return txDate >= thirtyDaysAgo && txDate <= now;
                });

                // Dynamic calculations
                const endingBalance = (accounts || [])
                    .filter((acc) => acc.type !== AccountType.EXTERNAL_LINKED)
                    .reduce((sum, acc) => sum + (acc.balance || 0), 0);

                let totalCredits = 0;
                let totalDebits = 0;
                recentTx.forEach(tx => {
                    const amt = tx.type === 'credit' ? tx.sendAmount : (tx.sendAmount + (tx.fee || 0));
                    if (tx.type === 'credit') {
                        totalCredits += amt;
                    } else {
                        totalDebits += amt;
                    }
                });

                const startingBalance = endingBalance - totalCredits + totalDebits;

                // Balance Summary Box
                doc.setFillColor(248, 250, 252); // slate-50
                doc.rect(20, 92, 170, 20, 'F');
                doc.setDrawColor(226, 232, 240); // slate-200
                doc.rect(20, 92, 170, 20);

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7.5);
                doc.setTextColor(100, 116, 139); // slate-500
                doc.text('STARTING RESERVE', 24, 98);
                doc.text('TOTAL INFLOWS (+)', 66, 98);
                doc.text('TOTAL OUTFLOWS (-)', 108, 98);
                doc.text('CONSOLIDATED BALANCE', 150, 98);

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9.5);
                doc.setTextColor(15, 23, 42); // slate-900
                doc.text(formatCurrency(startingBalance), 24, 106);
                doc.setTextColor(22, 163, 74); // green-600
                doc.text(`+${formatCurrency(totalCredits)}`, 66, 106);
                doc.setTextColor(220, 38, 38); // red-600
                doc.text(`-${formatCurrency(totalDebits)}`, 108, 106);
                doc.setTextColor(5, 8, 16);
                doc.text(formatCurrency(endingBalance), 150, 106);

                // Section title: Account performance breakdown
                doc.setTextColor(15, 23, 42);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text('Asset Reserve Allocation', 20, 122);

                // Show a breakdown of the user's primary accounts
                let accountY = 128;
                (accounts || []).filter(acc => acc.type !== AccountType.EXTERNAL_LINKED).slice(0, 4).forEach((acc) => {
                    doc.setFillColor(248, 250, 252);
                    doc.rect(20, accountY, 170, 10, 'F');
                    doc.setDrawColor(241, 245, 249);
                    doc.rect(20, accountY, 170, 10);
                    
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8);
                    doc.setTextColor(15, 23, 42);
                    doc.text(acc.nickname || acc.type, 24, accountY + 6.5);
                    
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7.5);
                    doc.setTextColor(100, 116, 139);
                    doc.text(`Account No: ${acc.accountNumber}`, 80, accountY + 6.5);
                    
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8.5);
                    doc.setTextColor(15, 23, 42);
                    doc.text(formatCurrency(acc.balance), 186, accountY + 6.5, { align: 'right' });
                    
                    accountY += 12;
                });

                // Transactions Table Header
                const tableTop = accountY + 4;
                const colX1 = 20;
                const colX2 = 50;
                const colX3 = 150;
                const colX4 = 190;

                doc.setFillColor(241, 245, 249); // slate-100
                doc.rect(colX1, tableTop, colX4 - colX1, 8, 'F');
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(100, 116, 139);
                doc.text('Date', colX1 + 3, tableTop + 5.5);
                doc.text('Transaction Details', colX2 + 3, tableTop + 5.5);
                doc.text('Amount', colX4 - 3, tableTop + 5.5, { align: 'right' });

                // Transactions Data
                let y = tableTop + 8;
                let currentTableStart = tableTop;

                const sortedRecentTx = [...recentTx].sort((a, b) => {
                    const dateA = new Date(a.statusTimestamps?.[TransactionStatus.SUBMITTED] || Date.now()).getTime();
                    const dateB = new Date(b.statusTimestamps?.[TransactionStatus.SUBMITTED] || Date.now()).getTime();
                    return dateB - dateA;
                }).slice(0, 12); // showing top 12 transactions in last 30 days for consolidated report

                if (sortedRecentTx.length === 0) {
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(8);
                    doc.setTextColor(100, 116, 139);
                    doc.text("No transactions recorded during this 30-day reporting period.", colX1 + 3, y + 6);
                    y += 12;
                } else {
                    sortedRecentTx.forEach((tx, idx) => {
                        const txDate = new Date(tx.statusTimestamps?.[TransactionStatus.SUBMITTED] || Date.now()).toLocaleDateString();
                        const amount = `${tx.type === 'credit' ? '+' : '-'}${formatCurrency(tx.type === 'credit' ? tx.sendAmount : tx.sendAmount + (tx.fee || 0))}`;
                        
                        if (idx % 2 === 1) {
                            doc.setFillColor(248, 250, 252);
                            doc.rect(colX1, y, colX4 - colX1, 8, 'F');
                        }

                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(8);
                        doc.setTextColor(15, 23, 42);
                        doc.text(txDate, colX1 + 3, y + 5.5);
                        
                        const desc = tx.description.length > 50 ? tx.description.substring(0, 50) + '...' : tx.description;
                        doc.text(desc, colX2 + 3, y + 5.5);
                        
                        if (tx.type === 'credit') {
                            doc.setTextColor(22, 163, 74);
                        } else {
                            doc.setTextColor(220, 38, 38);
                        }
                        doc.text(amount, colX4 - 3, y + 5.5, { align: 'right' });
                        
                        // Divider line
                        doc.setDrawColor(226, 232, 240);
                        doc.line(colX1, y + 8, colX4, y + 8);

                        y += 8;
                    });
                }

                // Draw outer border and vertical lines for final table page
                doc.setDrawColor(203, 213, 225);
                doc.setLineWidth(0.35);
                doc.rect(colX1, currentTableStart, colX4 - colX1, y - currentTableStart);
                doc.line(colX2, currentTableStart, colX2, y);
                doc.line(colX3, currentTableStart, colX3, y);

                // Embed Verification QR Code Block
                const originHost = typeof window !== 'undefined' ? window.location.origin : 'https://firstpacificbank.com';
                const verifyPayload = `${originHost}/verify?doc=CONS_REP_${date.replace(/\//g, '-')}&status=VERIFIED`;
                generateQrCodeDataUrl(verifyPayload, 200).then(qrDataUrl => {
                    embedVerificationQrCodeBlock(doc, qrDataUrl, 20, 260, { width: 170, height: 20 });
                    doc.save(`Consolidated_Monthly_Report_${date.replace(/\//g, '-')}.pdf`);
                    setIsGeneratingReport(false);
                });
            } catch (err) {
                console.error("Failed to generate PDF monthly report", err);
                setIsGeneratingReport(false);
            }
        }, 1500);
    };

    // Subaccount Creation State
    const [isSubaccountModalOpen, setIsSubaccountModalOpen] = useState(false);
    const [parentAccountId, setParentAccountId] = useState('');
    const [subNickname, setSubNickname] = useState('');
    const [subType, setSubType] = useState<AccountType>(AccountType.SAVINGS);
    const [fundingAmount, setFundingAmount] = useState('0');

    // Compare Accounts State
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
    const [compareAccount1, setCompareAccount1] = useState<AccountType>(AccountType.CHECKING);
    const [compareAccount2, setCompareAccount2] = useState<AccountType>(AccountType.SAVINGS);

    // Toggle Visibility State for Joint & Sub-Accounts
    const [showJointAndSub, setShowJointAndSub] = useState(true);

    // Filter parent-only internal accounts to prevent subaccount duplication in the primary grid
    const internalAccounts = accounts.filter(acc => acc.type !== AccountType.EXTERNAL_LINKED && acc.type !== AccountType.JOINT && !acc.parentId);
    const externalAccounts = accounts.filter(acc => acc.type === AccountType.EXTERNAL_LINKED);
    const jointAndSubAccounts = accounts.filter(acc => acc.type === AccountType.JOINT || !!acc.parentId);

    const handleQuickTransfer = (fromId: string, toId: string, amount: number) => {
        if (onUpdateAccounts) {
            onUpdateAccounts(prev => prev.map(acc => {
                if (acc.id === fromId) {
                    return { ...acc, balance: parseFloat((acc.balance - amount).toFixed(2)) };
                }
                if (acc.id === toId) {
                    return { ...acc, balance: parseFloat((acc.balance + amount).toFixed(2)) };
                }
                return acc;
            }));
        }
    };

    const handleCreateSubaccount = (e: React.FormEvent) => {
        e.preventDefault();
        const parent = accounts.find(a => a.id === parentAccountId);
        if (!parent) {
            alert("Parent account not selected.");
            return;
        }
        const fundAmt = parseFloat(fundingAmount);
        if (isNaN(fundAmt) || fundAmt < 0 || fundAmt > parent.balance) {
            alert("Invalid funding amount or insufficient available master liquidity.");
            return;
        }

        const randomSuffix = Math.floor(100 + Math.random() * 900);
        const newSub: Account = {
            id: `acc_sub_${Date.now()}`,
            type: subType,
            parentId: parentAccountId,
            nickname: subNickname || `${parent.nickname || parent.type} Sub`,
            accountNumber: `${parent.accountNumber}-${randomSuffix}`,
            fullAccountNumber: `${parent.fullAccountNumber || parent.accountNumber.replace(/\s+/g,'')}S${randomSuffix}`,
            routingNumber: parent.routingNumber,
            swiftBic: parent.swiftBic,
            iban: parent.iban ? `${parent.iban}S${randomSuffix}` : undefined,
            balance: fundAmt,
            features: ['Partitioned Vault', 'Parent Direct Sweep'],
            status: 'Active'
        };

        if (onUpdateAccounts) {
            onUpdateAccounts(prev => prev.map(a => {
                if (a.id === parentAccountId) {
                    return { ...a, balance: parseFloat((a.balance - fundAmt).toFixed(2)) };
                }
                return a;
            }).concat(newSub));

            // Reset Form and close Modal
            setIsSubaccountModalOpen(false);
            setParentAccountId('');
            setSubNickname('');
            setFundingAmount('0');
        }
    };

    return (
        <>
            {selectedAccount && (
                <AccountDetailModal 
                    account={selectedAccount} 
                    onClose={() => setSelectedAccount(null)} 
                    transactions={transactions}
                    userProfile={userProfile}
                />
            )}

            {/* Subaccount Creation Modal */}
            {isSubaccountModalOpen && (
                <div className="fixed inset-0 bg-slate-50 dark:bg-slate-800  z-[150] flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsSubaccountModalOpen(false)}>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-[#0c121e] border border-slate-200 dark:border-white/10 p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative"
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={() => setIsSubaccountModalOpen(false)} className="absolute top-6 right-6 p-2 bg-white hover:bg-white rounded-xl transition-colors dark:bg-slate-800">
                            <XIcon className="w-5 h-5 text-[#0F172A]" />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-primary/20 rounded-xl border border-primary/30">
                                <PlusCircleIcon className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="text-xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Provision Subaccount</h3>
                        </div>

                        <form onSubmit={handleCreateSubaccount} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2">Master Funding Account</label>
                                <select 
                                    value={parentAccountId}
                                    onChange={e => setParentAccountId(e.target.value)}
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 dark:border-white/10 text-sm text-[#0F172A] dark:text-[#1E293B] focus:border-primary/50 outline-none dark:bg-slate-900"
                                    required
                                >
                                    <option value="" disabled>Select parent account...</option>
                                    {internalAccounts.map(parent => (
                                        <option key={parent.id} value={parent.id}>
                                            {parent.nickname || parent.type} (Avail: {parent.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2">Subaccount Alias / Nickname</label>
                                <input 
                                    type="text" 
                                    value={subNickname} 
                                    onChange={e => setSubNickname(e.target.value)}
                                    placeholder="e.g. Offshore Bonds Portfolio, Real Estate Reserves"
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 dark:border-white/10 text-sm text-[#1E293B] focus:border-primary/50 outline-none dark:bg-slate-900"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2">Account Type</label>
                                    <select 
                                        value={subType}
                                        onChange={e => setSubType(e.target.value as AccountType)}
                                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 dark:border-white/10 text-sm text-[#1E293B] focus:border-primary/50 outline-none dark:bg-slate-900"
                                    >
                                        <option value={AccountType.SAVINGS}>Savings (4.25% APY)</option>
                                        <option value={AccountType.CHECKING}>Checking</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2">Initial Funding (USD)</label>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={fundingAmount}
                                        onChange={e => setFundingAmount(e.target.value)}
                                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 dark:border-white/10 text-sm text-[#1E293B] focus:border-primary/50 outline-none font-mono dark:bg-slate-900"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button type="submit" className="w-full py-4 bg-primary hover:bg-primary-hover text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl transition-all">
                                    Confirm Security Provisioning
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Compare Accounts Modal */}
            {isCompareModalOpen && (
                <div className="fixed inset-0 bg-slate-50 dark:bg-slate-800  z-[150] flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsCompareModalOpen(false)}>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-[#0c121e] border border-slate-200 dark:border-white/10 p-6 md:p-8 rounded-[2.5rem] w-full max-w-4xl shadow-2xl relative max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={() => setIsCompareModalOpen(false)} className="absolute top-6 right-6 p-2 bg-white hover:bg-white rounded-xl transition-colors dark:bg-slate-800">
                            <XIcon className="w-5 h-5 text-[#0F172A]" />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-primary/20 rounded-xl border border-primary/30">
                                <TrendingUpIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Compare Account Benefits</h3>
                                <p className="text-xs text-[#0F172A]">Analyze interest yields, transactional structures, and institutional privilege tiers side-by-side.</p>
                            </div>
                        </div>

                        {/* Account Selector Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-slate-100 p-6 rounded-2xl border border-black/5">
                            <div>
                                <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2">Account Type A</label>
                                <select 
                                    value={compareAccount1}
                                    onChange={e => setCompareAccount1(e.target.value as AccountType)}
                                    className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 dark:border-white/10 text-sm text-[#0F172A] dark:text-[#1E293B] focus:border-primary/50 outline-none font-bold dark:bg-slate-900"
                                >
                                    {Object.values(AccountType).map(type => (
                                        <option key={type} value={type} disabled={type === compareAccount2}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2">Account Type B</label>
                                <select 
                                    value={compareAccount2}
                                    onChange={e => setCompareAccount2(e.target.value as AccountType)}
                                    className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 dark:border-white/10 text-sm text-[#0F172A] dark:text-[#1E293B] focus:border-primary/50 outline-none font-bold dark:bg-slate-900"
                                >
                                    {Object.values(AccountType).map(type => (
                                        <option key={type} value={type} disabled={type === compareAccount1}>{type}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Comparison Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-black/5 pt-6">
                            {/* Account A Column */}
                            <div className="space-y-6">
                                <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-primary px-2.5 py-1 bg-primary/10 rounded-lg border border-primary/20">Tier A</span>
                                        <span className="text-xs font-mono text-[#0F172A]">{COMPARISON_DATA[compareAccount1].keyAcro} Premium</span>
                                    </div>
                                    <h4 className="text-xl font-black text-white">{COMPARISON_DATA[compareAccount1].name}</h4>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h5 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Interest Rate (APY)</h5>
                                        <p className="text-base font-bold text-emerald-400">{COMPARISON_DATA[compareAccount1].interestRate}</p>
                                    </div>

                                    <div>
                                        <h5 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Maintenance & Fees</h5>
                                        <p className="text-sm font-bold text-[#1E293B]">{COMPARISON_DATA[compareAccount1].maintenanceFee}</p>
                                    </div>

                                    <div>
                                        <h5 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Minimum Funding Balance</h5>
                                        <p className="text-sm font-bold text-[#1E293B]">{COMPARISON_DATA[compareAccount1].minimumBalance}</p>
                                    </div>

                                    <div>
                                        <h5 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Card Privilege</h5>
                                        <p className="text-sm font-bold text-[#1E293B]">{COMPARISON_DATA[compareAccount1].cardType}</p>
                                    </div>

                                    <div>
                                        <h5 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Withdrawal Limits</h5>
                                        <p className="text-sm text-[#0F172A]">{COMPARISON_DATA[compareAccount1].withdrawalLimits}</p>
                                    </div>

                                    <div>
                                        <h5 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Clearing Settlement Time</h5>
                                        <p className="text-sm text-[#0F172A]">{COMPARISON_DATA[compareAccount1].clearingTime}</p>
                                    </div>

                                    <div>
                                        <h5 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2">Signature Transaction Benefits</h5>
                                        <ul className="space-y-2">
                                            {COMPARISON_DATA[compareAccount1].transactionBenefits.map((benefit, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-xs text-[#0F172A]">
                                                    <CheckCircleIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                                    <span>{benefit}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Account B Column */}
                            <div className="space-y-6 border-t md:border-t-0 md:border-l border-black/5 pt-6 md:pt-0 md:pl-8">
                                <div className="p-5 rounded-2xl bg-amber-500 border border-amber-500/20">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 px-2.5 py-1 bg-amber-500 rounded-lg border border-amber-500/20">Tier B</span>
                                        <span className="text-xs font-mono text-[#0F172A]">{COMPARISON_DATA[compareAccount2].keyAcro} Premium</span>
                                    </div>
                                    <h4 className="text-xl font-black text-white">{COMPARISON_DATA[compareAccount2].name}</h4>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h5 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Interest Rate (APY)</h5>
                                        <p className="text-base font-bold text-emerald-400">{COMPARISON_DATA[compareAccount2].interestRate}</p>
                                    </div>

                                    <div>
                                        <h5 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Maintenance & Fees</h5>
                                        <p className="text-sm font-bold text-[#1E293B]">{COMPARISON_DATA[compareAccount2].maintenanceFee}</p>
                                    </div>

                                    <div>
                                        <h5 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Minimum Funding Balance</h5>
                                        <p className="text-sm font-bold text-[#1E293B]">{COMPARISON_DATA[compareAccount2].minimumBalance}</p>
                                    </div>

                                    <div>
                                        <h5 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Card Privilege</h5>
                                        <p className="text-sm font-bold text-[#1E293B]">{COMPARISON_DATA[compareAccount2].cardType}</p>
                                    </div>

                                    <div>
                                        <h5 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Withdrawal Limits</h5>
                                        <p className="text-sm text-[#0F172A]">{COMPARISON_DATA[compareAccount2].withdrawalLimits}</p>
                                    </div>

                                    <div>
                                        <h5 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Clearing Settlement Time</h5>
                                        <p className="text-sm text-[#0F172A]">{COMPARISON_DATA[compareAccount2].clearingTime}</p>
                                    </div>

                                    <div>
                                        <h5 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2">Signature Transaction Benefits</h5>
                                        <ul className="space-y-2">
                                            {COMPARISON_DATA[compareAccount2].transactionBenefits.map((benefit, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-xs text-[#0F172A]">
                                                    <CheckCircleIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                                    <span>{benefit}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            <div className="space-y-12 max-w-5xl mx-auto animate-fade-in-up pb-20">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-100 dark:border-white/10 pb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
                                <BuildingOfficeIcon className="w-6 h-6 text-primary" />
                            </div>
                            <h2 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tight uppercase">Account Management</h2>
                        </div>
                        <p className="text-[#0F172A] dark:text-white max-w-lg font-bold">Manage your global institutional positions, private trusts, and offshore reserves through a unified settlement layer.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={handleGenerateMonthlyReport}
                            disabled={isGeneratingReport}
                            className={`px-5 py-3 ${
                                isGeneratingReport
                                    ? "bg-slate-100 dark:bg-slate-900 text-[#0F172A] border-slate-200 dark:border-white/10 cursor-not-allowed"
                                    : "bg-emerald-500 hover:bg-emerald-500 text-emerald-400 hover:text-[#0F172A] border border-emerald-500/20 hover:border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.05)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                            } border rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2`}
                        >
                            {isGeneratingReport ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <ArrowDownTrayIcon className="w-4 h-4" />
                                    <span>Generate Monthly Report</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => setIsCompareModalOpen(true)}
                            className="px-5 py-3 bg-primary/10 hover:bg-primary text-primary hover:text-[#0F172A] border border-primary/20 hover:border-primary rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-[0_0_12px_rgba(14,197,242,0.05)] hover:shadow-[0_0_20px_rgba(14,197,242,0.2)] flex items-center gap-2"
                        >
                            <TrendingUpIcon className="w-4 h-4" />
                            Compare Accounts
                        </button>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                    {[
                        { label: 'Transfer Funds', icon: ArrowsRightLeftIcon, route: '/wallet' },
                        { label: 'Pay Bills', icon: DocumentCheckIcon, route: '/utilities' },
                        { label: 'Deposit Check', icon: ArrowDownTrayIcon, route: '/wallet' },
                        { label: 'Send Wire', icon: GlobeAmericasIcon, route: '/wire-transfer' },
                        { label: 'Joint Accounts', icon: UsersIcon, route: '/joint-accounts' },
                        { label: 'Add Subaccount', icon: PlusCircleIcon, action: () => {
                            if (internalAccounts.length > 0) {
                                setParentAccountId(internalAccounts[0].id);
                            }
                            setIsSubaccountModalOpen(true);
                        }}
                    ].map((action, i) => (
                        <button key={i} onClick={() => action.route ? navigate(action.route) : action.action?.()} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-primary/30 hover:shadow-lg transition-all group flex flex-col items-center justify-center gap-3">
                            <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl group-hover:bg-primary/10 group-hover:text-primary text-[#0F172A] transition-colors">
                                <action.icon className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider">{action.label}</span>
                        </button>
                    ))}
                </div>

                {/* Savings Goal Tracker */}
                <SavingsGoalTracker accounts={accounts} />

                {/* Internal Accounts Section */}
                <div className="space-y-6">
                    {internalAccounts.map(account => (
                        <AccountCard 
                            key={account.id} 
                            account={account} 
                            onUpdateNickname={onUpdateAccountNickname}
                            verificationLevel={verificationLevel}
                            onClick={() => setSelectedAccount(account)}
                            subaccounts={accounts.filter(sub => sub.parentId === account.id)}
                            onQuickTransfer={handleQuickTransfer}
                        />
                    ))}
                </div>

                {/* Joint & Sub-Accounts Section */}
                <div className="pt-12 border-t border-slate-100 dark:border-white/10 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight uppercase">Joint & Sub-Accounts</h2>
                                <span className="px-2.5 py-1 rounded-xl text-xs bg-primary/10 text-primary border border-primary/20 font-black tracking-wider font-mono">
                                    {jointAndSubAccounts.length}
                                </span>
                            </div>
                            <p className="text-sm text-[#0F172A] dark:text-white font-bold">Shared multi-owner ledgers and parent-funded sub-allocations.</p>
                        </div>
                        <button 
                            onClick={() => setShowJointAndSub(!showJointAndSub)}
                            className="flex items-center gap-2.5 px-6 py-3 text-xs font-black uppercase tracking-wider text-[#0F172A] dark:text-[#1E293B] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-primary/30 transition-all shadow-sm"
                        >
                            {showJointAndSub ? (
                                <>
                                    <EyeSlashIcon className="w-4 h-4 text-[#0F172A]" />
                                    <span>Hide Accounts</span>
                                </>
                            ) : (
                                <>
                                    <EyeIcon className="w-4 h-4 text-primary animate-pulse" />
                                    <span>Show Accounts</span>
                                </>
                            )}
                        </button>
                    </div>

                    {showJointAndSub ? (
                        <div className="grid grid-cols-1 gap-6">
                            {jointAndSubAccounts.map(account => (
                                <AccountCard 
                                    key={account.id} 
                                    account={account} 
                                    onUpdateNickname={onUpdateAccountNickname}
                                    verificationLevel={verificationLevel}
                                    onClick={() => setSelectedAccount(account)}
                                    subaccounts={accounts.filter(sub => sub.parentId === account.id)}
                                    onQuickTransfer={handleQuickTransfer}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 border border-dashed border-slate-200 dark:border-white/10 rounded-3xl text-center bg-slate-50 dark:bg-slate-900">
                            <p className="text-xs font-bold text-[#0F172A] uppercase tracking-widest flex items-center justify-center gap-2">
                                <LockClosedIcon className="w-4 h-4" />
                                Joint & Sub-Accounts Hidden
                            </p>
                        </div>
                    )}
                </div>

                {/* Linked Accounts Section */}
                <div className="pt-12 border-t border-slate-100 dark:border-white/10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div>
                            <h2 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight uppercase">Connected Gateways</h2>
                            <p className="text-sm text-[#0F172A] dark:text-white font-bold">External bridge accounts for inter-bank settlement.</p>
                        </div>
                        <button 
                            onClick={onLinkAccount} 
                            className="flex items-center gap-3 px-8 py-4 text-xs font-black uppercase tracking-[0.2em] text-[#0F172A] dark:text-white bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 dark:text-white hover:scale-105 rounded-2xl shadow-2xl transition-all active:scale-95"
                        >
                            <PlusCircleIcon className="w-5 h-5" />
                            <span>Initialize Link</span>
                        </button>
                    </div>
                    
                    {externalAccounts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {externalAccounts.map(account => (
                                <AccountCard 
                                    key={account.id} 
                                    account={account} 
                                    onUpdateNickname={onUpdateAccountNickname}
                                    verificationLevel={verificationLevel}
                                    onClick={() => setSelectedAccount(account)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 shadow-inner">
                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 text-[#0F172A] dark:text-white dark:text-white shadow-lg">
                                <BankIcon className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black text-[#0F172A] dark:text-white uppercase tracking-widest">No External Nodes Connected</h3>
                            <p className="text-[#0F172A] dark:text-white text-sm mt-3 mb-10 max-w-sm mx-auto leading-relaxed">Establish a secure bridge via Plaid or SWIFT to facilitate automated liquidity injection into your primary portfolios.</p>
                            <button 
                                onClick={onLinkAccount} 
                                className="inline-flex items-center gap-2 px-10 py-4 text-xs font-black uppercase tracking-widest text-primary border-2 border-primary hover:bg-primary hover:text-[#0F172A] dark:text-white rounded-2xl transition-all shadow-lg"
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                <span>Establish Connection</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Statements & Documents Section */}
                <div className="pt-12 border-t border-slate-100 dark:border-white/10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div>
                            <h2 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight uppercase">Statements & Documents</h2>
                            <p className="text-sm text-[#0F172A] dark:text-white font-bold">Access your official tax forms and monthly statements.</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { title: '2023 Tax Form 1099-INT', date: 'Jan 31, 2024', icon: DocumentCheckIcon },
                            { title: 'December 2023 Statement', date: 'Dec 31, 2023', icon: ClipboardDocumentIcon },
                            { title: 'November 2023 Statement', date: 'Nov 30, 2023', icon: ClipboardDocumentIcon },
                        ].map((doc, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 flex items-center justify-between group hover:border-primary/30 transition-all cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl text-[#0F172A] group-hover:text-primary transition-colors">
                                        <doc.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">{doc.title}</h4>
                                        <p className="text-xs text-[#0F172A] uppercase tracking-wider mt-1">{doc.date}</p>
                                    </div>
                                </div>
                                <ArrowDownTrayIcon className="w-5 h-5 text-[#0F172A] dark:text-white group-hover:text-primary transition-colors" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Beneficiaries & Trusted Contacts Section */}
                <div className="pt-12 border-t border-slate-100 dark:border-white/10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div>
                            <h2 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight uppercase">Beneficiaries & Contacts</h2>
                            <p className="text-sm text-[#0F172A] dark:text-white font-bold">Manage trusted individuals authorized on your accounts.</p>
                        </div>
                        <button className="flex items-center gap-3 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#0F172A] dark:text-white bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 dark:text-white hover:scale-105 rounded-2xl shadow-2xl transition-all active:scale-95">
                            <PlusCircleIcon className="w-4 h-4" />
                            <span>Add Contact</span>
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { name: 'Sarah Ansell', role: 'Primary Beneficiary', percentage: '100%', status: 'Verified' },
                            { name: 'James Ansell', role: 'Trusted Contact', percentage: 'N/A', status: 'Pending' },
                        ].map((contact, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 flex items-center justify-between group hover:border-primary/30 transition-all cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-[#0F172A] font-bold text-lg">
                                        {contact.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">{contact.name}</h4>
                                        <p className="text-xs text-[#0F172A] uppercase tracking-wider mt-1">{contact.role}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg ${contact.status === 'Verified' ? 'bg-emerald-500 text-emerald-500' : 'bg-amber-500 text-amber-500'}`}>
                                        {contact.status}
                                    </span>
                                    {contact.percentage !== 'N/A' && (
                                        <p className="text-xs font-bold text-[#0F172A] dark:text-white mt-2">{contact.percentage} Allocation</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Direct Deposit Setup Section */}
                <div className="pt-12 border-t border-slate-100 dark:border-white/10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div>
                            <h2 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight uppercase">Direct Deposit Setup</h2>
                            <p className="text-sm text-[#0F172A] dark:text-white font-bold">Generate a pre-filled form to provide to your employer.</p>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                <DocumentCheckIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-1">Pre-filled Direct Deposit Form</h3>
                                <p className="text-sm text-[#0F172A] dark:text-white">Includes your routing and account numbers for easy setup.</p>
                            </div>
                        </div>
                        <button className="flex items-center gap-3 px-8 py-4 text-xs font-black uppercase tracking-[0.2em] text-[#0F172A] dark:text-white bg-primary hover:bg-primary-600 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 whitespace-nowrap">
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            <span>Download PDF</span>
                        </button>
                    </div>
                </div>

                {/* Account Limits & Thresholds Section */}
                <div className="pt-12 border-t border-slate-100 dark:border-white/10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div>
                            <h2 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight uppercase">Account Limits & Thresholds</h2>
                            <p className="text-sm text-[#0F172A] dark:text-white font-bold">View and manage your daily transaction limits.</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { title: 'Daily ATM Withdrawal', used: 200, limit: 1000, type: 'currency' },
                            { title: 'Daily Point of Sale', used: 1500, limit: 5000, type: 'currency' },
                            { title: 'Daily Wire Transfer', used: 0, limit: 50000, type: 'currency' },
                            { title: 'Daily Mobile Deposit', used: 500, limit: 10000, type: 'currency' },
                        ].map((limit, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">{limit.title}</h4>
                                    <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                                        {limit.type === 'currency' ? `$${limit.used.toLocaleString()} / $${limit.limit.toLocaleString()}` : `${limit.used} / ${limit.limit}`}
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${limit.used / limit.limit > 0.8 ? 'bg-red-500' : limit.used / limit.limit > 0.5 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                        style={{ width: `${(limit.used / limit.limit) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .rotate-y-12 { transform: rotateY(12deg); }
                .rotate-x-6 { transform: rotateX(6deg); }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 2px; }
            `}</style>
        </>
    );
};
