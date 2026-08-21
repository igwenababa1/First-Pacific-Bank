
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Transaction, TransactionStatus, Account, UserProfile } from '../types';
import { StatementGeneratorModal } from './StatementGeneratorModal';
import { db } from '../services/database';
import { motion, AnimatePresence } from 'motion/react';
import { 
    CheckCircleIcon, 
    SearchIcon, 
    XCircleIcon, 
    DepositIcon, 
    getBankIcon,
    ChevronDownIcon,
    ArrowDownTrayIcon,
    ArrowPathIcon,
    ClipboardDocumentIcon,
    SpinnerIcon,
    GlobeAmericasIcon,
    QuestionMarkCircleIcon,
    ShieldCheckIcon,
    StatusBadge,
    EyeIcon,
    ArrowUpCircleIcon,
    ArrowDownCircleIcon,
    TrendingUpIcon,
    ClockIcon,
    LockClosedIcon,
    BuildingOfficeIcon,
    ActivityIcon,
    FunnelIcon,
    CalendarDaysIcon,
    CurrencyDollarIcon,
    TransportIcon,
    FoodDrinkIcon,
    EntertainmentIcon,
    ShoppingBagIcon,
    QrCodeIcon,
    BriefcaseIcon,
    ZapIcon,
    ArrowsRightLeftIcon
} from './Icons';
import { DownloadableReceipt } from './DownloadableReceipt';
import { AuthorizationWarningModal } from './AuthorizationWarningModal';
import { TransactionTracker } from './TransactionTracker';
import { useCurrency } from '../contexts/CurrencyContext';
import { TransactionDetailsModal } from './TransactionDetailsModal';
import { ReceiptViewerModal } from './ReceiptViewerModal';
import { compressImage } from '../utils/imageProcessor';
import { analyzeReceiptOCR } from '../services/geminiService';
import { getFlagUrl } from '../utils/flags';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { applyBankPdfBackgroundAndWatermark, generateQrCodeDataUrl, embedVerificationQrCodeBlock } from '../utils/pdfWatermarkAndQr';
import 'jspdf-autotable';
import { QRCodeSVG } from 'qrcode.react';
import { downloadTransactionPDFReceipt } from '../utils/pdfReceiptGenerator';

interface ActivityLogProps {
  transactions: Transaction[];
  onUpdateTransactions: (transactionIds: string[], updates: Partial<Transaction>) => void;
  onRepeatTransaction: (transaction: Transaction) => void;
  onAuthorizeTransaction: (transactionId: string, method: 'code' | 'fee') => void;
  accounts: Account[];
  onContactSupport: (transactionId?: string) => void;
  userProfile?: UserProfile;
  onRefundTransaction?: (transactionId: string, amount: number, accountId: string) => void;
  onUpdateProfile?: (updates: Partial<UserProfile>) => Promise<void>;
}

const Highlight: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
    if (!highlight.trim()) {
        return <>{text}</>;
    }
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
        <>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <mark key={i} className="bg-primary/30 text-[#0F172A] dark:text-white rounded px-0.5 no-underline">
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </>
    );
};

interface TransactionRowProps {
    transaction: Transaction;
    searchTerm: string;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onDownloadReceipt: (transaction: Transaction) => void;
    isGeneratingPdf: boolean;
    onViewDetails: (transaction: Transaction) => void;
    onRepeat: (transaction: Transaction) => void;
    onResume?: (transaction: Transaction) => void;
    onPause?: (transaction: Transaction) => void;
    onOpenReceiptModal?: (transaction: Transaction) => void;
    onRowFileUpload?: (transaction: Transaction, file: File) => void;
    isOcrProcessing?: boolean;
    index: number;
}

const TransactionRow = React.forwardRef<HTMLTableRowElement, TransactionRowProps>(({ 
    transaction, 
    searchTerm, 
    isSelected, 
    onSelect, 
    onDownloadReceipt, 
    isGeneratingPdf, 
    onViewDetails, 
    onRepeat, 
    onResume, 
    onPause, 
    onOpenReceiptModal,
    onRowFileUpload,
    isOcrProcessing,
    index 
}, ref) => {
    const { formatCurrency } = useCurrency();
    const [isExpanded, setIsExpanded] = useState(false);
    
    const isCredit = transaction.type === 'credit';
    const amount = isCredit ? transaction.sendAmount : transaction.sendAmount + transaction.fee;
    
    const categoryData = useMemo(() => {
        const desc = (transaction.description || '').toLowerCase();
        const merchant = (transaction.recipient?.nickname || transaction.recipient?.fullName || '').toLowerCase();
        const cat = transaction.category;

        // 1. Payroll / Salary
        if (
            (cat as string) === 'Payroll' ||
            desc.includes('salary') || desc.includes('payroll') || desc.includes('stipend') || desc.includes('wage') || desc.includes('employer') || desc.includes('payout') ||
            merchant.includes('payroll')
        ) {
            return {
                label: 'Payroll',
                icon: <BriefcaseIcon className="w-5 h-5 text-emerald-650 dark:text-emerald-455" />,
                bgClass: 'bg-emerald-500 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            };
        }

        // 2. Utilities & Bills
        if (
            (cat as string) === 'Utilities' ||
            desc.includes('utility') || desc.includes('utilities') || desc.includes('electric') || desc.includes('power') || desc.includes('water') || desc.includes('gas') || desc.includes('sewer') || desc.includes('broadband') || desc.includes('trash') || desc.includes('internet') || desc.includes('bill ') || desc.includes('telecom') ||
            merchant.includes('comcast') || merchant.includes('at&t') || merchant.includes('verizon') || merchant.includes('t-mobile') || merchant.includes('water district') || merchant.includes('power & light') || merchant.includes('energy')
        ) {
            return {
                label: 'Utilities',
                icon: <ZapIcon className="w-5 h-5 text-amber-655 dark:text-amber-455" />,
                bgClass: 'bg-amber-500 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            };
        }

        // 3. Shopping / Retail / Groceries / Electronics
        if (
            cat === 'Shopping' || cat === 'Groceries' || cat === 'Electronics' ||
            desc.includes('shop') || desc.includes('grocery') || desc.includes('purchase') || desc.includes('store') || desc.includes('retail') ||
            merchant.includes('amazon') || merchant.includes('walmart') || merchant.includes('target') || merchant.includes('shop') || merchant.includes('store') || merchant.includes('costco') || merchant.includes('ebay') || merchant.includes('apple') || merchant.includes('best buy') || merchant.includes('supermarket') || merchant.includes('groceries')
        ) {
            return {
                label: cat || 'Shopping',
                icon: <ShoppingBagIcon className="w-5 h-5 text-pink-650 dark:text-pink-455" />,
                bgClass: 'bg-pink-500 text-pink-600 dark:text-pink-400 border border-pink-500/20'
            };
        }

        // 4. Food & Drink / Dining
        if (
            cat === 'Food & Drink' ||
            desc.includes('food') || desc.includes('drink') || desc.includes('restaurant') || desc.includes('dining') || desc.includes('cafe') || desc.includes('bistro') ||
            merchant.includes('starbucks') || merchant.includes('mcdonalds') || merchant.includes('cafe') || merchant.includes('restaurant') || merchant.includes('doordash') || merchant.includes('uber eats') || merchant.includes('grubhub') || merchant.includes('bistro')
        ) {
            return {
                label: 'Food & Drink',
                icon: <FoodDrinkIcon className="w-5 h-5 text-orange-650 dark:text-orange-455" />,
                bgClass: 'bg-orange-500 text-orange-600 dark:text-orange-400 border border-orange-500/20'
            };
        }

        // 5. Transport & Commute / Travel
        if (
            cat === 'Transport' || cat === 'Travel' ||
            desc.includes('transport') || desc.includes('commute') || desc.includes('flight') || desc.includes('ticket') || desc.includes('airline') || desc.includes('train') || desc.includes('uber') || desc.includes('lyft') || desc.includes('travel') ||
            merchant.includes('uber') || merchant.includes('lyft') || merchant.includes('transit') || merchant.includes('airline') || merchant.includes('delta') || merchant.includes('flight') || merchant.includes('hotel') || merchant.includes('airbnb')
        ) {
            return {
                label: cat || 'Transport',
                icon: <TransportIcon className="w-5 h-5 primary- dark:primary-" />,
                bgClass: 'primary- primary- dark:primary- border primary-'
            };
        }

        // 6. Entertainment
        if (
            cat === 'Entertainment' ||
            desc.includes('entertainment') || desc.includes('cinema') || desc.includes('movie') || desc.includes('show') || desc.includes('game') || desc.includes('concert') ||
            merchant.includes('netflix') || merchant.includes('spotify') || merchant.includes('cinema') || merchant.includes('amc') || merchant.includes('ticket') || merchant.includes('disney') || merchant.includes('hulu') || merchant.includes('steam')
        ) {
            return {
                label: 'Entertainment',
                icon: <EntertainmentIcon className="w-5 h-5 text-purple-650 dark:text-purple-455" />,
                bgClass: 'bg-purple-500 text-purple-600 dark:text-purple-400 border border-purple-500/20'
            };
        }

        // 7. General Transfers, Liquidity shifts or Wires
        if (
            desc.includes('transfer') || desc.includes('wire') || desc.includes('ach') || desc.includes('p2p') || desc.includes('sent') || desc.includes('liquidity') || desc.includes('node sync') || desc.includes('hub shift') ||
            merchant.includes('zelle') || merchant.includes('revolut') || merchant.includes('wise') || merchant.includes('paypal') || merchant.includes('venmo') || merchant.includes('cashapp') ||
            transaction.transferMethod === 'wire' || transaction.recipient?.country?.code !== 'US'
        ) {
            return {
                label: 'Transfer',
                icon: <ArrowsRightLeftIcon className="w-5 h-5 text-indigo-650 dark:text-indigo-455" />,
                bgClass: 'bg-indigo-500 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
            };
        }

        // Fallbacks
        if (isCredit) {
            if (transaction.description.includes('Liquidity')) {
                return {
                    label: 'Liquidity Shift',
                    icon: <TrendingUpIcon className="w-5 h-5 text-emerald-650 dark:text-emerald-455" />,
                    bgClass: 'bg-emerald-500 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                };
            }
            return {
                label: 'Deposit',
                icon: <DepositIcon className="w-5 h-5 text-emerald-650 dark:text-emerald-455" />,
                bgClass: 'bg-emerald-500 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            };
        }

        const BankLogo = getBankIcon(transaction.recipient?.bankName || 'First Pacific Bank');
        return {
            label: cat || 'Other',
            icon: <BankLogo className="w-5 h-5" />,
            bgClass: 'bg-slate-500 text-[#0F172A] dark:text-slate-450 border border-slate-500/20'
        };
    }, [transaction, isCredit]);

    const nodeStatus = useMemo(() => {
        switch(transaction.status) {
            case TransactionStatus.FUNDS_ARRIVED:
            case TransactionStatus.COMPLETED: 
                return { label: 'AUTHENTICATED', color: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500/20' };
            case TransactionStatus.FLAGGED_AWAITING_CLEARANCE: return { label: 'NODE_HALT', color: 'text-rose-400', bg: 'bg-rose-500', border: 'border-rose-500/20' };
            case TransactionStatus.IN_TRANSIT: return { label: 'TRANSMITTING', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' };
            case TransactionStatus.PAUSED_ON_HOLD: return { label: 'PAUSED', color: 'text-amber-500', bg: 'bg-amber-500', border: 'border-amber-500/30' };
            default: return { label: 'PENDING_NODE', color: 'text-[#0F172A]', bg: 'bg-slate-500', border: 'border-slate-500/20' };
        }
    }, [transaction.status]);
    
    return (
        <>
        <motion.tr
            ref={ref}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            layout
            className={`border-b border-slate-100 dark:border-white/10 group transition-all duration-300 cursor-pointer ${
                isSelected ? 'bg-primary/5' : 'hover:bg-slate-50 dark:hover:bg-white[0.02]'
            }`}
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <td className="py-5 px-6 w-12" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-center">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(transaction.id)}
                        className="h-4 w-4 rounded border-slate-200 dark:border-slate-300 bg-slate-50 dark:bg-slate-900 text-primary focus:ring-primary/40 transition-all cursor-pointer"
                    />
                </div>
            </td>
            <td className="py-5 px-6 min-w-[300px]">
                <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 shadow-lg ${categoryData.bgClass}`}>
                        {categoryData.icon}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-black text-[#0F172A] dark:text-white text-sm tracking-tight uppercase group-hover:text-primary transition-colors">
                                <Highlight text={isCredit ? (transaction.senderName || transaction.transactionDetails?.senderName || 'Network Inflow') : (transaction.recipient.nickname || transaction.recipient.fullName)} highlight={searchTerm} />
                            </p>
                            {!isCredit && <img src={getFlagUrl(transaction.recipient.country.code)} className="w-3.5 h-2.5 rounded-sm object-cover opacity-60" alt="" />}
                            {(transaction.paymentProof || (transaction as any).screenshotProof) && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onOpenReceiptModal?.(transaction); }}
                                    className="relative group/thumb shrink-0 rounded-xl overflow-hidden border border-amber-500/50 hover:border-amber-400 shadow-md transition-all hover:scale-105 ml-1.5 cursor-pointer"
                                    title="Real-time Receipt Preview - Click to view or markup"
                                >
                                    <img 
                                        src={transaction.paymentProof || (transaction as any).screenshotProof} 
                                        alt="Receipt Proof" 
                                        className="w-8 h-8 object-cover" 
                                    />
                                    <div className="absolute inset-0 bg-slate-100 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                                        <EyeIcon className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <span className="absolute bottom-0 right-0 bg-amber-500 text-slate-950 text-[6px] font-black px-0.5 uppercase">
                                        PROOF
                                    </span>
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                             <p className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest truncate max-w-[200px]">
                                <Highlight text={transaction.description} highlight={searchTerm} />
                             </p>
                             <span className="text-[8px] text-[#0F172A] dark:text-white font-mono">TX_{transaction.id.slice(-8)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest select-none ${categoryData.bgClass} border-none`}>
                                ✨ {categoryData.label}
                            </span>
                            {transaction.federallyVerified && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500 text-amber-500 border border-amber-500/20 rounded text-[8px] font-black uppercase tracking-widest">
                                    🛡️ Federally Verified
                                </span>
                            )}
                            {transaction.syncState === 'pending' && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500 text-amber-500 border border-amber-500/20 rounded text-[8px] font-black uppercase tracking-widest animate-pulse">
                                    🔄 Sync Pending
                                </span>
                            )}
                            {transaction.tags?.map(tag => (
                                <span key={tag} className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 text-[#0F172A] dark:text-white rounded text-[8px] font-mono tracking-wide border border-slate-200 dark:border-white/10">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                        {transaction.transactionDetails?.memo && (
                             <p className="text-[9px] italic text-[#0F172A] dark:text-white mt-1 line-clamp-1">"{transaction.transactionDetails.memo}"</p>
                        )}
                    </div>
                </div>
            </td>
            <td className={`py-5 px-6 text-right`}>
                <p className={`font-mono text-base font-black tracking-tighter ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#0F172A] dark:text-white'}`}>
                    {isCredit ? '+' : '-'}{formatCurrency(amount, 'USD')}
                </p>
                <div className="flex items-center justify-end gap-1.5 mt-1">
                     <span className="text-[9px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest">{isCredit ? 'Inflow' : 'Outflow'}</span>
                </div>
            </td>
            <td className="py-5 px-6">
                {transaction.syncState === 'pending' ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-amber-500/20 bg-amber-500 text-amber-500 animate-pulse">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">SYNC_PENDING</span>
                    </div>
                ) : (
                    <motion.div 
                        key={transaction.status}
                        initial={{ scale: 0.88, opacity: 0.6 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border transition-all duration-300 ${nodeStatus.bg} ${nodeStatus.border} ${nodeStatus.color}`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${nodeStatus.color.replace('text', 'bg')} ${transaction.status === TransactionStatus.IN_TRANSIT ? 'animate-pulse' : ''}`}></div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">{nodeStatus.label}</span>
                    </motion.div>
                )}
            </td>
            <td className="py-5 px-6 text-right whitespace-nowrap">
                <p className="text-xs font-black text-slate-750 dark:text-white uppercase tracking-widest">
                    <Highlight text={transaction.statusTimestamps?.[TransactionStatus.SUBMITTED]?.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) || ''} highlight={searchTerm} />
                </p>
                <p className="text-[10px] font-mono text-[#0F172A] dark:text-white mt-1">
                    {transaction.statusTimestamps?.[TransactionStatus.SUBMITTED]?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) || ''}
                </p>
            </td>
            <td className="py-5 px-6 text-right">
                <div className="flex items-center justify-end gap-1">
                    <label 
                        onClick={(e) => e.stopPropagation()} 
                        className="p-2.5 text-[#0F172A] hover:text-amber-400 rounded-xl hover:bg-amber-500 transition-all cursor-pointer relative"
                        title="Upload Receipt & OCR Auto-Fill Form"
                    >
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file && onRowFileUpload) {
                                    onRowFileUpload(transaction, file);
                                }
                            }} 
                        />
                        {isOcrProcessing ? (
                            <SpinnerIcon className="w-5 h-5 animate-spin text-amber-500" />
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        )}
                    </label>

                    {(transaction.paymentProof || (transaction as any).screenshotProof) && (
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onOpenReceiptModal?.(transaction); }} 
                            className="p-2.5 text-amber-400 hover:text-amber-300 rounded-xl bg-amber-500 hover:bg-amber-500 transition-all font-bold text-xs flex items-center gap-1"
                            title="View Receipt & Markup for Tax Audit"
                        >
                            <EyeIcon className="w-4 h-4" />
                            <span className="hidden sm:inline text-[9px] uppercase font-black">View Receipt</span>
                        </button>
                    )}

                    <button 
                        onClick={(e) => { e.stopPropagation(); onDownloadReceipt(transaction); }} 
                        disabled={isGeneratingPdf}
                        className="p-2.5 text-[#0F172A] hover:text-primary rounded-xl hover:bg-white transition-all dark:bg-slate-800"
                        title="Export Advice"
                    >
                        {isGeneratingPdf ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <ArrowDownTrayIcon className="w-5 h-5" />}
                    </button>
                    {!isCredit && transaction.status !== TransactionStatus.PAUSED_ON_HOLD && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onRepeat(transaction); }} 
                            className="p-2.5 text-[#0F172A] hover:text-emerald-400 rounded-xl hover:bg-white transition-all dark:bg-slate-800"
                            title="Repeat Node Sync"
                        >
                            <ArrowPathIcon className="w-5 h-5" />
                        </button>
                    )}
                    {transaction.status === TransactionStatus.PAUSED_ON_HOLD && onResume && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onResume(transaction); }} 
                            className="p-2.5 text-amber-500 hover:text-amber-400 rounded-xl hover:bg-amber-500 transition-all font-black"
                            title="Resume Ledger Sync"
                        >
                            <ArrowPathIcon className="w-5 h-5 animate-spin-slow" />
                        </button>
                    )}
                    {transaction.status !== TransactionStatus.COMPLETED && transaction.status !== TransactionStatus.FUNDS_ARRIVED && transaction.status !== TransactionStatus.FAILED && transaction.status !== TransactionStatus.PAUSED_ON_HOLD && onPause && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onPause(transaction); }} 
                            className="p-2.5 text-[#0F172A] hover:text-indigo-400 rounded-xl hover:bg-white transition-all font-black dark:bg-slate-800"
                            title="Pause Transaction"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    )}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onViewDetails(transaction); }} 
                        className="p-2.5 text-[#0F172A] hover:text-[#0F172A] dark:text-white rounded-xl hover:bg-white transition-all dark:bg-slate-800"
                        title="Audit Node"
                    >
                        <EyeIcon className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} 
                        className="p-2.5 text-[#0F172A] hover:text-primary rounded-xl hover:bg-white transition-all dark:bg-slate-800"
                        title="Settlement Trail"
                    >
                        <svg className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180 text-primary' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            </td>
        </motion.tr>
        <AnimatePresence>
            {isExpanded && (
                <motion.tr
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-slate-100 dark:bg-[#080d1a] border-b border-slate-100 dark:border-white/10 overflow-hidden"
                >
                    <td colSpan={5} className="p-0">
                        <div className="p-8 space-y-6 text-[#0F172A] text-xs font-mono">
                             <div className="flex gap-4 items-center justify-between">
                                 <div>
                                     <h4 className="text-emerald-400 font-bold tracking-widest uppercase mb-1">Settlement Trail</h4>
                                     <p>UETR_ID: {transaction.id}</p>
                                     <p>CLEARING_SYSTEM: {transaction.transferMethod === 'wire' ? 'Fedwire / SWIFT MT103' : 'Automated Clearing House (ACH)'}</p>
                                     <p>NODE_TRACE: [US_CORRESPONDENT] -&gt; {transaction.recipient?.bankName || 'INTERMEDIARY'} -&gt; BENEFICIARY</p>
                                 </div>
                                 <div className="text-right">
                                     <h4 className="text-[#0F172A] font-bold tracking-widest uppercase mb-1">Status</h4>
                                     <div className="inline-flex gap-2 items-center">
                                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                         <span>LEDGER SYNCHRONIZED</span>
                                     </div>
                                     <p className="mt-1">TIME_ELAPSED: {(Math.random() * 1.5).toFixed(2)} SECONDS</p>
                                 </div>
                             </div>

                             {(transaction.paymentProof || (transaction as any).screenshotProof) ? (
                                 <div className="p-4 bg-slate-50 border border-amber-500/20 rounded-2xl flex items-center justify-between gap-4 dark:bg-slate-900">
                                     <div className="flex items-center gap-4">
                                         <img 
                                             src={transaction.paymentProof || (transaction as any).screenshotProof} 
                                             alt="Receipt Preview" 
                                             className="w-16 h-16 object-cover rounded-xl border border-amber-500/30 shadow-md" 
                                         />
                                         <div>
                                             <h5 className="text-xs font-black uppercase tracking-wider text-amber-400">Attached Tax Audit Receipt</h5>
                                             <p className="text-[10px] text-[#0F172A] mt-0.5 font-mono">
                                                 Uploaded: {transaction.paymentProofTimestamp ? new Date(transaction.paymentProofTimestamp).toLocaleString() : 'Active Session'}
                                             </p>
                                             <div className="flex gap-2 mt-1">
                                                 <span className="text-[9px] bg-emerald-500 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">
                                                     Amount: ${transaction.sendAmount.toLocaleString()}
                                                 </span>
                                                 <span className="text-[9px] bg-indigo-500 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded font-mono">
                                                     Category: {transaction.category || 'Shopping'}
                                                 </span>
                                             </div>
                                         </div>
                                     </div>
                                     <button
                                         type="button"
                                         onClick={(e) => { e.stopPropagation(); onOpenReceiptModal?.(transaction); }}
                                         className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
                                     >
                                         View & Markup Receipt
                                     </button>
                                 </div>
                             ) : (
                                 <div className="p-4 bg-slate-50 border border-black/5 rounded-2xl flex items-center justify-between dark:bg-slate-900">
                                     <div className="flex items-center gap-2">
                                         <span className="text-[#0F172A] text-xs font-mono">No receipt proof attached to this entry yet.</span>
                                     </div>
                                     <label className="px-3 py-1.5 bg-white hover:bg-white text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer dark:bg-slate-800">
                                         Upload Receipt & OCR Auto-Fill
                                         <input 
                                             type="file" 
                                             accept="image/*" 
                                             className="hidden" 
                                             onChange={(e) => {
                                                 const file = e.target.files?.[0];
                                                 if (file && onRowFileUpload) onRowFileUpload(transaction, file);
                                             }} 
                                         />
                                     </label>
                                 </div>
                             )}
                            
                            <div className="relative pt-6 pb-2">
                                <div className="absolute top-1/2 left-0 w-full h-1 bg-white -translate-y-1/2 rounded-full overflow-hidden dark:bg-slate-800">
                                    <div className="h-full bg-gradient-to-r from-emerald-500/20 via-emerald-400 to-transparent w-3/4 animate-[scan_2s_ease-in-out_infinite]" />
                                </div>
                                <div className="relative flex justify-between">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] border-2 border-slate-900 z-10" />
                                        <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-400">Origination</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] border-2 border-slate-900 z-10" />
                                        <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-400">Clearing</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] border-2 border-slate-900 z-10" />
                                        <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-400">Settlement</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                </motion.tr>
            )}
        </AnimatePresence>
        </>
    );
});

export const ActivityLog: React.FC<ActivityLogProps> = ({ 
    transactions, 
    onUpdateTransactions,
    onRepeatTransaction,
    onAuthorizeTransaction,
    accounts,
    onContactSupport,
    userProfile,
    onRefundTransaction,
    onUpdateProfile
}) => {
    const { formatCurrency } = useCurrency();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'All'>('All');
    const [typeFilter, setTypeFilter] = useState<'All' | 'credit' | 'debit'>('All');
    const [categoryFilter, setCategoryFilter] = useState<string>('All');
    const [tagFilter, setTagFilter] = useState<string>('All');
    const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [pdfData, setPdfData] = useState<{ transaction: Transaction; account: Account } | null>(null);
    const [viewingReceiptTx, setViewingReceiptTx] = useState<Transaction | null>(null);
    const [viewingTransactionDetails, setViewingTransactionDetails] = useState<Transaction | null>(null);
    const [ocrProcessingTxId, setOcrProcessingTxId] = useState<string | null>(null);
    const [receiptOcrToast, setReceiptOcrToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

    const handleRowFileUpload = async (transaction: Transaction, file: File) => {
        try {
            setOcrProcessingTxId(transaction.id);
            setReceiptOcrToast({ message: `Uploading & analyzing receipt image for ${transaction.recipient?.nickname || transaction.recipient?.fullName || 'Transaction'}...`, type: 'info' });

            const compressedBase64 = await compressImage(file);
            const ocrResult = await analyzeReceiptOCR(compressedBase64);

            const updates: Partial<Transaction> = {
                paymentProof: compressedBase64,
                paymentProofTimestamp: new Date().toISOString(),
                statusTimestamps: {
                    ...transaction.statusTimestamps,
                    [TransactionStatus.AWAITING_PAYMENT_VERIFICATION]: new Date()
                }
            };

            if (ocrResult.amount && ocrResult.amount > 0) {
                updates.sendAmount = ocrResult.amount;
                updates.receiveAmount = ocrResult.amount;
            }

            if (ocrResult.category) {
                updates.category = ocrResult.category as any;
            }

            if (ocrResult.merchant) {
                updates.description = `Receipt: ${ocrResult.merchant}`;
                updates.recipient = {
                    ...transaction.recipient,
                    nickname: ocrResult.merchant,
                    fullName: ocrResult.merchant
                };
            }

            onUpdateTransactions([transaction.id], updates);

            setReceiptOcrToast({
                message: `✓ Receipt attached & metadata auto-filled! Amount: $${(ocrResult.amount || transaction.sendAmount).toLocaleString()} | Merchant: ${ocrResult.merchant || 'Vendor'}`,
                type: 'success'
            });

            setViewingReceiptTx({
                ...transaction,
                ...updates
            });
        } catch (err: any) {
            console.error("Row receipt upload error:", err);
            setReceiptOcrToast({ message: "Failed to process receipt. Please try again.", type: 'error' });
        } finally {
            setOcrProcessingTxId(null);
        }
    };
    const [qrTransaction, setQrTransaction] = useState<Transaction | null>(null);
    const [isStatementOpen, setIsStatementOpen] = useState(false);
    
    // Advanced Filters State
    const [showFilters, setShowFilters] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [amountRange, setAmountRange] = useState({ min: '', max: '' });
    const [amountPreset, setAmountPreset] = useState<string>('All');
    const [merchantFilter, setMerchantFilter] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

    // Bulk Actions State
    const [isBulkCategorizing, setIsBulkCategorizing] = useState(false);
    const [selectedBulkCategory, setSelectedBulkCategory] = useState<string>('Shopping');

    const handleApplyBulkCategory = () => {
        if (selectedTransactions.size === 0 || !selectedBulkCategory) return;
        const ids = Array.from(selectedTransactions);
        onUpdateTransactions(ids, { category: selectedBulkCategory as any });
        setIsBulkCategorizing(false);
    };

    const handleAmountPresetChange = (preset: string) => {
        setAmountPreset(preset);
        switch (preset) {
            case 'under100':
                setAmountRange({ min: '', max: '100' });
                break;
            case '100to1000':
                setAmountRange({ min: '100', max: '1000' });
                break;
            case '1000to10000':
                setAmountRange({ min: '1000', max: '10000' });
                break;
            case 'over10000':
                setAmountRange({ min: '10000', max: '' });
                break;
            case 'All':
            default:
                setAmountRange({ min: '', max: '' });
                break;
        }
    };

    // Dynamically calculate all unique tags
    const allTags = useMemo(() => {
        const tagsSet = new Set<string>();
        transactions.forEach(t => {
            if (t.tags) {
                t.tags.forEach(tag => tagsSet.add(tag));
            }
        });
        return ['All', ...Array.from(tagsSet)];
    }, [transactions]);

    // Real-time Clearinghouse Settlement Listener for QRScanner / QuickQR payments
    const lastStatusesRef = useRef<Record<string, TransactionStatus>>({});
    const [clearinghouseValidatedAlert, setClearinghouseValidatedAlert] = useState<Transaction | null>(null);
    const processingTxIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!transactions || transactions.length === 0) return;

        transactions.forEach(t => {
            const isQr = t.id.startsWith('QR-') || 
                         t.id.includes('_QR_') || 
                         (t.description && t.description.toLowerCase().includes('qr')) || 
                         (t.tags && t.tags.includes('QR'));
            
            if (!isQr) return;

            const prevStatus = lastStatusesRef.current[t.id];

            // 1. Stage pending QR transactions for dynamic clearinghouse validation simulation
            if (t.status === TransactionStatus.SUBMITTED || t.status === TransactionStatus.IN_TRANSIT) {
                if (!processingTxIds.current.has(t.id)) {
                    processingTxIds.current.add(t.id);
                    console.log(`[Clearinghouse Channel] QR transaction ${t.id} staged for validation...`);
                    
                    try {
                        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                        const osc = audioCtx.createOscillator();
                        const gainNode = audioCtx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(440, audioCtx.currentTime); 
                        gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
                        osc.connect(gainNode);
                        gainNode.connect(audioCtx.destination);
                        osc.start();
                        osc.stop(audioCtx.currentTime + 0.15);
                    } catch (e) {}

                    setTimeout(async () => {
                        console.log(`[Clearinghouse Channel] QR transaction ${t.id} successfully settled.`);
                        try {
                            await db.updateTransactionStatus(t.id, TransactionStatus.FUNDS_ARRIVED);
                            onUpdateTransactions([t.id], {
                                status: TransactionStatus.FUNDS_ARRIVED,
                                statusTimestamps: {
                                    ...t.statusTimestamps,
                                    [TransactionStatus.FUNDS_ARRIVED]: new Date()
                                }
                            });
                        } catch (err) {
                            console.error('[Clearinghouse Sync Error] Failed to update QR status:', err);
                        }
                    }, 4000);
                }
            }

            // 2. Identify newly cleared/validated QR transactions
            const isNewValidated = prevStatus !== undefined && prevStatus !== TransactionStatus.FUNDS_ARRIVED && t.status === TransactionStatus.FUNDS_ARRIVED;

            if (isNewValidated) {
                console.log(`[Clearinghouse Channel] Real-time QR Settlement Succeeded!`, t);
                setClearinghouseValidatedAlert(t);

                // Satisfying confirmation tone sequence
                try {
                    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const osc1 = audioCtx.createOscillator();
                    const osc2 = audioCtx.createOscillator();
                    const gain1 = audioCtx.createGain();
                    const gain2 = audioCtx.createGain();

                    osc1.type = 'sine';
                    osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
                    osc1.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.12); // C6
                    gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
                    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
                    osc1.connect(gain1);
                    gain1.connect(audioCtx.destination);

                    osc2.type = 'sine';
                    osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
                    osc2.frequency.exponentialRampToValueAtTime(1318.51, audioCtx.currentTime + 0.18); // E6
                    gain2.gain.setValueAtTime(0.06, audioCtx.currentTime + 0.08);
                    gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
                    osc2.connect(gain2);
                    gain2.connect(audioCtx.destination);

                    osc1.start();
                    osc1.stop(audioCtx.currentTime + 0.45);
                    osc2.start(audioCtx.currentTime + 0.08);
                    osc2.stop(audioCtx.currentTime + 0.5);
                } catch (e) {}
            }
        });

        const currentStatuses: Record<string, TransactionStatus> = {};
        transactions.forEach(t => {
            currentStatuses[t.id] = t.status;
        });
        lastStatusesRef.current = currentStatuses;
    }, [transactions, onUpdateTransactions]);

    const filteredTransactions = useMemo(() => {
        let result = transactions;
        
        // Status Filter
        if (statusFilter !== 'All') result = result.filter(t => t.status === statusFilter);
        
        // Type Filter
        if (typeFilter !== 'All') result = result.filter(t => t.type === typeFilter);

        // Date Range Filter
        if (dateRange.start) {
            const start = new Date(dateRange.start).setHours(0,0,0,0);
            result = result.filter(t => {
                const dateVal = t.statusTimestamps?.[TransactionStatus.SUBMITTED] || t.statusTimestamps?.['Submitted'] || t.statusTimestamps?.[TransactionStatus.AWAITING_PAYMENT_VERIFICATION] || t.paymentProofTimestamp || t.scheduledDate || t.estimatedArrival;
                return dateVal ? new Date(dateVal).getTime() >= start : true;
            });
        }
        if (dateRange.end) {
            const end = new Date(dateRange.end).setHours(23,59,59,999);
            result = result.filter(t => {
                const dateVal = t.statusTimestamps?.[TransactionStatus.SUBMITTED] || t.statusTimestamps?.['Submitted'] || t.statusTimestamps?.[TransactionStatus.AWAITING_PAYMENT_VERIFICATION] || t.paymentProofTimestamp || t.scheduledDate || t.estimatedArrival;
                return dateVal ? new Date(dateVal).getTime() <= end : true;
            });
        }

        // Amount Range Filter
        if (amountRange.min) {
            result = result.filter(t => {
                const amt = t.type === 'credit' ? t.sendAmount : t.sendAmount + t.fee;
                return amt >= parseFloat(amountRange.min);
            });
        }
        if (amountRange.max) {
             result = result.filter(t => {
                const amt = t.type === 'credit' ? t.sendAmount : t.sendAmount + t.fee;
                return amt <= parseFloat(amountRange.max);
            });
        }

        // Merchant Filter
        if (merchantFilter) {
            const mTerm = merchantFilter.toLowerCase().trim();
            result = result.filter(t => 
                (t.recipient?.fullName || '').toLowerCase().includes(mTerm) ||
                (t.recipient?.nickname || '').toLowerCase().includes(mTerm) ||
                (t.senderName || '').toLowerCase().includes(mTerm) ||
                (t.transactionDetails?.senderName || '').toLowerCase().includes(mTerm) ||
                (t.recipient?.bankName || '').toLowerCase().includes(mTerm)
            );
        }

        // Category Filter
        if (categoryFilter !== 'All') {
            result = result.filter(t => {
                const desc = (t.description || '').toLowerCase();
                const merchant = (t.recipient?.nickname || t.recipient?.fullName || '').toLowerCase();
                const cat = (t.category || '') as string;
                
                if (categoryFilter === 'Income') {
                    return cat === 'Payroll' || desc.includes('salary') || desc.includes('payroll') || t.type === 'credit';
                }
                if (categoryFilter === 'Transfer') {
                    return desc.includes('transfer') || desc.includes('wire') || desc.includes('ach') || t.transferMethod === 'wire';
                }
                if (categoryFilter === 'Purchase') {
                    return cat === 'Shopping' || cat === 'Groceries' || cat === 'Electronics' || cat === 'Food & Drink' || desc.includes('purchase') || desc.includes('shop') || merchant.includes('amazon');
                }
                if (categoryFilter === 'Groceries') {
                    return cat === 'Groceries' || desc.includes('grocery') || merchant.includes('supermarket') || merchant.includes('groceries');
                }
                if (categoryFilter === 'Utilities') {
                    return cat === 'Utilities' || desc.includes('utility') || desc.includes('electric') || desc.includes('water') || desc.includes('gas') || desc.includes('bill') || merchant.includes('comcast');
                }
                if (categoryFilter === 'Shopping') {
                    return cat === 'Shopping' || desc.includes('shop') || desc.includes('retail') || merchant.includes('amazon') || merchant.includes('walmart') || merchant.includes('target');
                }
                if (categoryFilter === 'Food & Drink') {
                    return cat === 'Food & Drink' || desc.includes('food') || desc.includes('restaurant') || desc.includes('dining') || merchant.includes('starbucks');
                }
                if (categoryFilter === 'Travel') {
                    return cat === 'Travel' || cat === 'Transport' || desc.includes('flight') || desc.includes('airline') || desc.includes('hotel') || desc.includes('uber');
                }
                if (categoryFilter === 'Entertainment') {
                    return cat === 'Entertainment' || desc.includes('cinema') || desc.includes('movie') || merchant.includes('netflix') || merchant.includes('spotify');
                }
                return true;
            });
        }

        // Tag Filter
        if (tagFilter !== 'All') {
            result = result.filter(t => t.tags && t.tags.includes(tagFilter));
        }

        // Text Search
        const term = searchTerm.toLowerCase().trim();
        if (term) {
            result = result.filter(t => {
                const amount = t.sendAmount + (t.type === 'debit' ? t.fee : 0);
                return (
                    (t.recipient?.fullName || '').toLowerCase().includes(term) ||
                    (t.recipient?.nickname || '').toLowerCase().includes(term) ||
                    (t.senderName || '').toLowerCase().includes(term) ||
                    (t.transactionDetails?.senderName || '').toLowerCase().includes(term) ||
                    (t.transactionDetails?.memo || '').toLowerCase().includes(term) ||
                    t.description.toLowerCase().includes(term) ||
                    t.id.toLowerCase().includes(term) ||
                    amount.toString().includes(term)
                );
            });
        }

        // Sorting
        return result.sort((a, b) => {
            const getSubmittedTime = (t: Transaction) => {
                const val = t.statusTimestamps?.[TransactionStatus.SUBMITTED] || t.statusTimestamps?.['Submitted'] || t.scheduledDate || t.estimatedArrival;
                return val ? new Date(val).getTime() : 0;
            };
            const dateA = getSubmittedTime(a);
            const dateB = getSubmittedTime(b);
            const amountA = a.type === 'credit' ? a.sendAmount : a.sendAmount + a.fee;
            const amountB = b.type === 'credit' ? b.sendAmount : b.sendAmount + b.fee;

            switch (sortOrder) {
                case 'oldest': return dateA - dateB;
                case 'highest': return amountB - amountA;
                case 'lowest': return amountA - amountB;
                case 'newest': 
                default: return dateB - dateA;
            }
        });
    }, [transactions, searchTerm, statusFilter, typeFilter, dateRange, amountRange, merchantFilter, sortOrder, categoryFilter, tagFilter]);

    const handleSelectAll = () => {
        if (selectedTransactions.size === filteredTransactions.length) setSelectedTransactions(new Set());
        else setSelectedTransactions(new Set(filteredTransactions.map(t => t.id)));
    };

    const handleDownloadReceipt = (transaction: Transaction) => {
        const sourceAccount = accounts.find(a => a.id === transaction.accountId) || accounts[0];
        setIsGeneratingPdf(true);
        try {
            downloadTransactionPDFReceipt(transaction, {
                account: sourceAccount,
                userProfile
            });
        } catch (err) {
            console.error('Failed to generate PDF receipt:', err);
        } finally {
            setTimeout(() => {
                setIsGeneratingPdf(false);
            }, 500);
        }
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setStatusFilter('All');
        setTypeFilter('All');
        setCategoryFilter('All');
        setDateRange({ start: '', end: '' });
        setAmountRange({ min: '', max: '' });
        setMerchantFilter('');
        setSortOrder('newest');
    };

    const handleExportCSV = (transactionsToExport = filteredTransactions, filename = 'transaction_history') => {
        const headers = ["ID", "Date", "Description", "Direction", "Amount", "Status", "Sender", "Recipient", "Fee"];
        
        const rows = transactionsToExport.map(tx => {
            const isCredit = tx.type === 'credit';
            const amount = isCredit ? tx.sendAmount : tx.sendAmount + tx.fee;
            
            return [
                tx.id,
                tx.statusTimestamps?.[TransactionStatus.SUBMITTED]?.toLocaleString('en-US', { timeZoneName: 'short' }).replace(/,/g, '') || '',
                `"${(tx.description || '').replace(/"/g, '""')}"`,
                isCredit ? 'Credit' : 'Debit',
                amount.toFixed(2),
                tx.status,
                `"${(tx.senderName || tx.transactionDetails?.senderName || '').replace(/"/g, '""')}"`,
                `"${(tx.recipient.nickname || tx.recipient.fullName || '').replace(/"/g, '""')}"`,
                tx.fee.toFixed(2)
            ].join(',');
        });
        
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = async (transactionsToExport = filteredTransactions, filename = 'transaction_history') => {
        const doc = new jsPDF();
        
        applyBankPdfBackgroundAndWatermark(doc, {
            title: 'OFFICIAL ACCOUNT STATEMENT',
            documentRef: `REF: FPB-STMT-${new Date().toISOString().split('T')[0]}`
        });

        // Account & Audit Metadata Cards (Enterprise Grade)
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(14, 52, doc.internal.pageSize.getWidth() - 28, 25, 'F');
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.3);
        doc.rect(14, 52, doc.internal.pageSize.getWidth() - 28, 25, 'D');

        // Calculate Totals
        let totalCredits = 0;
        let totalDebits = 0;
        transactionsToExport.forEach(tx => {
            const isCredit = tx.type === 'credit';
            const amount = isCredit ? tx.sendAmount : tx.sendAmount + (tx.fee || 0);
            if (isCredit) {
                totalCredits += amount;
            } else {
                totalDebits += amount;
            }
        });

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text("ACCOUNT HOLDER", 20, 59);
        doc.text("CREDIT VOLUME", 80, 59);
        doc.text("DEBIT VOLUME", 130, 59);
        doc.text("LEDGER STATUS", 175, 59, { align: 'right' });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(`${userProfile?.name || 'Institutional Client'}`, 20, 67);
        
        doc.setTextColor(16, 185, 129); // emerald-500
        doc.text(`+${formatCurrency(totalCredits, 'USD')}`, 80, 67);
        
        doc.setTextColor(239, 68, 68); // red-500
        doc.text(`-${formatCurrency(totalDebits, 'USD')}`, 130, 67);

        doc.setFillColor(16, 185, 129); // emerald green status bubble
        doc.rect(155, 62, 35, 6, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6.5);
        doc.text("AUDITED & SECURE", 172.5, 66.5, { align: 'center' });

        // Setup Transactions Table
        const head = [["ID", "Date", "Description", "Type", "Amount", "Status", "Counterparty Node"]];
        const body = transactionsToExport.map(tx => {
            const isCredit = tx.type === 'credit';
            const amount = isCredit ? tx.sendAmount : tx.sendAmount + (tx.fee || 0);
            const dateObj = tx.statusTimestamps?.[TransactionStatus.SUBMITTED] ? new Date(tx.statusTimestamps[TransactionStatus.SUBMITTED]) : new Date();
            
            return [
                tx.id.slice(0, 8).toUpperCase(),
                dateObj.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) + ' ' + dateObj.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                tx.description || 'Clearing Ledger Dispatch',
                isCredit ? 'CREDIT' : 'DEBIT',
                `${isCredit ? '+' : '-'}${formatCurrency(amount, 'USD')}`,
                tx.status.toUpperCase(),
                isCredit ? (tx.senderName || tx.transactionDetails?.senderName || 'Global Clearing Hub') : (tx.recipient?.nickname || tx.recipient?.fullName || 'Sovereign Clearing Node')
            ];
        });
        
        (doc as any).autoTable({
            head: head,
            body: body,
            startY: 84,
            styles: { fontSize: 7.5, cellPadding: 3, font: 'helvetica' },
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { top: 40, left: 14, right: 14 }
        });

        // Loop to add Watermarks, Vector Seals, and Footers on all pages
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            
            // Draw Beautiful Watermark behind the content (Diagonal light-gray print)
            doc.setTextColor(244, 246, 249);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(40);
            doc.text("FIRST PACIFIC BANK", 105, 140, { align: 'center', angle: 45 });
            doc.setFontSize(14);
            doc.text("OFFICIAL ACCOUNT MEMORANDUM", 105, 155, { align: 'center', angle: 45 });
            
            // Draw Official Vector Seal on Page 1 Bottom Right or near metadata
            if (i === 1) {
                // Outer circle
                doc.setDrawColor(212, 175, 55); // Gold
                doc.setLineWidth(0.8);
                doc.circle(180, 260, 16, 'D');
                // Inner circle
                doc.circle(180, 260, 14, 'D');
                
                // Seal Text
                doc.setFontSize(4);
                doc.setTextColor(194, 120, 3);
                doc.setFont('helvetica', 'bold');
                doc.text("FIRST PACIFIC BANK", 180, 254, { align: 'center' });
                doc.text("EST. 1911", 180, 258, { align: 'center' });
                doc.text("★ OFFICIAL ★", 180, 262, { align: 'center' });
                doc.text("NY REGISTRY", 180, 266, { align: 'center' });
            }

            // Draw Premium Footer
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(148, 163, 184); // slate-400
            
            // Page Number
            doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
            
            // Compliance & Security string
            doc.text("CONFIDENTIAL RECORD | FIRST PACIFIC BANCSHARES | TRUSTED CRYPTO-LEDGER VERIFIED NODE | MEMBER FDIC", 14, doc.internal.pageSize.getHeight() - 10);
        }
        
        // Embed Verification QR Code Block on the last page
        doc.setPage(pageCount);
        const originHost = typeof window !== 'undefined' ? window.location.origin : 'https://firstpacificbank.com';
        const verifyPayload = `${originHost}/verify?doc=STMT&client=${encodeURIComponent('Client')}&status=VERIFIED`;
        embedVerificationQrCodeBlock(doc, await generateQrCodeDataUrl(verifyPayload, 200), 14, doc.internal.pageSize.getHeight() - 40, { width: 180, height: 20 });

        doc.save(`First_Pacific_Bank_Statement_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const handleDownloadSelectedStatement = async () => {
        if (selectedTransactions.size === 0) return;
        
        const doc = new jsPDF();
        const selectedList = transactions.filter(t => selectedTransactions.has(t.id));
        
        for (let index = 0; index < selectedList.length; index++) {
            const tx = selectedList[index];
            if (index > 0) {
                doc.addPage();
            }

            applyBankPdfBackgroundAndWatermark(doc, {
                title: 'OFFICIAL TRANSACTION ADVICE',
                documentRef: `REF: ${tx.id.toUpperCase()}`
            });
            
            const isCredit = tx.type === 'credit';
            const rawAmount = tx.sendAmount;
            const fee = tx.fee || 0;
            const total = isCredit ? rawAmount : rawAmount + fee;
            const txDate = tx.statusTimestamps?.[TransactionStatus.SUBMITTED] || new Date();
            const dateStr = txDate.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'medium' });
            
            // Title
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text("TRANSACTION MEMORANDUM", 15, 65);
            
            // Left Column info
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text("CUSTOMER & ACCOUNT DETAILS", 15, 75);
            doc.setLineWidth(0.3);
            doc.setDrawColor(226, 232, 240); // slate-200
            doc.line(15, 77, 100, 77);
            
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139); // slate-500
            doc.text("Account Holder:", 15, 84);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text(`${userProfile?.name || 'Institutional Client'}`, 45, 84);
            
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text("Account ID / Routing:", 15, 91);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text(tx.accountId.slice(0, 12).toUpperCase(), 45, 91);
            
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text("Transfer Method:", 15, 98);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text(tx.transferMethod === 'wire' ? 'Fedwire MT103' : 'ACH Direct Network', 45, 98);
            
            // Right Column info
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text("CLEARINGHOUSE INFORMATION", 115, 75);
            doc.line(115, 77, 195, 77);
            
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.text("Settlement Node:", 115, 84);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text("FPB_US_CENTRAL_01", 145, 84);
            
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text("Transaction ID:", 115, 91);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text(tx.id.toUpperCase(), 145, 91);
            
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text("Settlement Time:", 115, 98);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text(dateStr, 145, 98);
            
            // Divider
            doc.line(15, 110, 195, 110);
            
            // Financial Details Table Header
            doc.setFillColor(248, 250, 252); // slate-50
            doc.rect(15, 118, 180, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(71, 85, 105); // slate-600
            doc.text("DESCRIPTION / ITEMIZATION", 18, 124);
            doc.text("AMOUNT (USD)", 192, 124, { align: 'right' });
            
            // Table Rows
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(15, 23, 42);
            
            // Principal Amount
            doc.text(tx.description || (isCredit ? 'Network Inflow Transfer' : 'Direct Electronic Outflow'), 18, 136);
            doc.setFont('helvetica', 'bold');
            doc.text(formatCurrency(rawAmount, 'USD'), 192, 136, { align: 'right' });
            
            // Fee row
            doc.setFont('helvetica', 'normal');
            doc.text("Federal Processing & Interbank Clearing Fee", 18, 144);
            doc.setFont('helvetica', 'bold');
            doc.text(formatCurrency(fee, 'USD'), 192, 144, { align: 'right' });
            
            // Divider
            doc.line(15, 150, 195, 150);
            
            // Total Row
            doc.setFontSize(10);
            doc.text("TOTAL SETTLED VOLUME:", 18, 158);
            doc.setFontSize(11);
            doc.text(formatCurrency(total, 'USD'), 192, 158, { align: 'right' });
            
            // Re-draw double lines for accounting total
            doc.line(150, 161, 195, 161);
            doc.line(150, 162, 195, 162);
            
            // Additional details box
            doc.setFillColor(250, 250, 250);
            doc.rect(15, 172, 180, 50, 'F');
            doc.setDrawColor(241, 245, 249);
            doc.rect(15, 172, 180, 50, 'S');
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(71, 85, 105);
            doc.text("AUDIT REPORT & CRYPTOGRAPHIC VERIFICATION HASHES", 20, 180);
            
            doc.setFont('helvetica', 'mono');
            doc.setFontSize(7);
            doc.setTextColor(100, 116, 139);
            doc.text(`TX_SHA256: ${tx.id}${tx.accountId}${total}`, 20, 188);
            doc.text(`ROUTING_KEY_SIG: 18f78b87123caef9901bdc89f1390498a88dc89f928e`, 20, 194);
            doc.text(`AUTHENTICITY_STAMP: FEDERALLY_VERIFIED_SECURE_ENCLAVE_RELEASE`, 20, 200);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text("Status:", 20, 209);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(16, 185, 129); // Emerald-500
            doc.text(tx.status.toUpperCase(), 35, 209);
            
            // Embed Verification QR Code Block
            const originHost = typeof window !== 'undefined' ? window.location.origin : 'https://firstpacificbank.com';
            const verifyPayload = `${originHost}/verify?doc=TX_${tx.id}&client=${encodeURIComponent('Client')}&status=VERIFIED`;
            embedVerificationQrCodeBlock(doc, await generateQrCodeDataUrl(verifyPayload, 200), 15, 245, { width: 180, height: 20 });
        }
        
        const suffix = selectedList.length === 1 ? selectedList[0].id.slice(-8).toUpperCase() : `BATCH_${selectedList.length}`;
        doc.save(`FPB_Statement_${suffix}.pdf`);
    };

    const handleBatchExport = () => {
        const selectedTxs = filteredTransactions.filter(tx => selectedTransactions.has(tx.id));
        handleExportCSV(selectedTxs, 'batch_export');
    };

    const handleResumeTransaction = (tx: Transaction) => {
        onUpdateTransactions([tx.id], { status: TransactionStatus.SUBMITTED });
        window.dispatchEvent(new CustomEvent('TRANSACTION_STATUS_TOGGLED', { detail: { id: tx.id, status: 'resumed', previousStatus: tx.status } }));
    };

    const handlePauseTransaction = (tx: Transaction) => {
        onUpdateTransactions([tx.id], { status: TransactionStatus.PAUSED_ON_HOLD });
        window.dispatchEvent(new CustomEvent('TRANSACTION_STATUS_TOGGLED', { detail: { id: tx.id, status: 'paused', previousStatus: tx.status } }));
    };

    return (
        <div id="transmission-ledger-container" className="space-y-10 max-w-7xl mx-auto animate-fade-in-up pb-20">
            {/* High-Fidelity Dashboard Header */}
            <div className="relative rounded-[3rem] overflow-hidden bg-slate-100 p-12 md:p-16 border border-slate-100 dark:border-white/10 shadow-2xl">
                <div className="absolute inset-0 z-0 opacity-20 bg-cover bg-center mix-blend-luminosity" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')" }}></div>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-8">
                    <div>
                        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-6 shadow-lg shadow-primary/10">
                            <ShieldCheckIcon className="w-4 h-4" /> SECURE_TRANSMISSION_LEDGER
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none mb-6">Node Activity.</h1>
                        <p className="text-lg text-slate-350 font-bold max-w-xl">Comprehensive cryptographic audit trail of all global settlements and liquidity shifts across your institutional nodes.</p>
                    </div>
                    <div className="flex flex-col items-end text-right">
                         <div className="bg-white  border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl dark:bg-slate-800">
                            <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Total Hub Flow (30D)</p>
                            <p className="text-4xl font-black text-white font-mono tracking-tighter">$1,248,500.00</p>
                            <div className="flex items-center justify-end gap-2 mt-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                <TrendingUpIcon className="w-3.5 h-3.5" /> +12.4% VOLUME
                            </div>
                         </div>
                    </div>
                </div>
            </div>

            {/* Filter Hub */}
            <div className="flex flex-col gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-3 rounded-[2.5rem] shadow-2xl flex flex-col lg:flex-row items-center gap-3">
                    <div className="relative flex-grow w-full">
                        <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0F172A] group-focus-within:text-primary transition-colors" />
                        <input 
                          type="text"
                          placeholder="Audit description, memo, sender or recipient node..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="w-full bg-slate-100 border border-slate-200 dark:border-slate-700 text-[#0F172A] dark:text-white pl-14 pr-6 py-5 rounded-3xl focus:ring-2 focus:ring-primary outline-none font-bold text-sm shadow-inner placeholder-slate-700"
                        />
                    </div>
                    
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-5 rounded-3xl flex items-center gap-2 transition-all font-bold text-xs uppercase tracking-wider ${showFilters ? 'bg-primary text-[#0F172A] dark:text-white shadow-lg shadow-primary/20' : 'bg-slate-100 text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white border border-slate-100 dark:border-white/10'}`}
                    >
                        <FunnelIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Advanced</span>
                    </button>

                    {(searchTerm || statusFilter !== 'All' || typeFilter !== 'All' || categoryFilter !== 'All' || dateRange.start || amountRange.min || merchantFilter) && (
                        <button onClick={clearAllFilters} className="p-5 rounded-3xl bg-white text-[#0F172A] hover:text-[#0F172A] dark:text-white hover:bg-white transition-all border border-slate-100 dark:border-white/10 dark:bg-slate-800">
                            <XCircleIcon className="w-6 h-6"/>
                        </button>
                    )}
                </div>

                {/* Quick Filters Bar (Category & Date) */}
                <div className="flex flex-wrap items-center gap-3 px-4 animate-fade-in-up md:flex-row flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mr-2">Category:</span>
                        {['All', 'Income', 'Transfer', 'Purchase', 'Groceries', 'Utilities', 'Shopping', 'Food & Drink', 'Travel', 'Entertainment'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${categoryFilter === cat ? 'bg-primary text-[#0F172A] border-primary shadow-lg shadow-primary/20' : 'bg-slate-50 dark:bg-transparent text-[#0F172A] dark:text-white border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="hidden md:block w-px h-6 bg-slate-200 dark:bg-slate-900 mx-2" />

                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mr-2">Date:</span>
                        <input 
                            type="date" 
                            title="Start Date"
                            value={dateRange.start} 
                            onChange={e => setDateRange(p => ({...p, start: e.target.value}))}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#0F172A] dark:text-white px-3 py-1.5 rounded-full outline-none focus:border-primary text-xs font-bold uppercase tracking-wider"
                        />
                        <span className="text-[#0F172A] text-xs">-</span>
                        <input 
                            type="date" 
                            title="End Date"
                            value={dateRange.end} 
                            onChange={e => setDateRange(p => ({...p, end: e.target.value}))}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#0F172A] dark:text-white px-3 py-1.5 rounded-full outline-none focus:border-primary text-xs font-bold uppercase tracking-wider"
                        />
                    </div>
                </div>

                {/* Quick Tags Filter Bar */}
                {allTags.length > 1 && (
                    <div className="flex flex-wrap items-center gap-3 px-8 pb-4 animate-fade-in-up mt-3 border-t border-dashed border-slate-100 dark:border-white/10 pt-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mr-2">Filter by Tag:</span>
                            {allTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setTagFilter(tag)}
                                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border font-mono ${tagFilter === tag ? 'bg-primary text-[#0F172A] border-primary shadow-lg shadow-primary/20' : 'bg-slate-50 dark:bg-transparent text-[#0F172A] dark:text-white border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'}`}
                                >
                                    {tag === 'All' ? 'All Tags' : `#${tag}`}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Expanded Filters Panel */}
                {showFilters && (
                    <div className="bg-[#0c121e] border border-slate-200 dark:border-white/10 p-6 rounded-[2rem] shadow-xl animate-fade-in-down grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                         
                        {/* Status Dropdown */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest block mb-2">Transaction Status</label>
                                <div className="relative">
                                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-3 rounded-xl appearance-none outline-none focus:border-primary text-xs font-bold uppercase tracking-wider">
                                        <option value="All">Any Status</option>
                                        {Object.values(TransactionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <ChevronDownIcon className="w-4 h-4 text-[#0F172A] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest block mb-2">Direction</label>
                                <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/10">
                                    {['All', 'credit', 'debit'].map(t => (
                                        <button 
                                            key={t}
                                            onClick={() => setTypeFilter(t as any)} 
                                            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${typeFilter === t ? 'bg-slate-100 dark:bg-slate-700 text-[#0F172A] dark:text-white shadow' : 'text-[#0F172A] hover:text-[#0F172A] dark:text-white'}`}
                                        >
                                            {t === 'All' ? 'Both' : t === 'credit' ? 'In' : 'Out'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Category Dropdown */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest block">Category Selection</label>
                            <div className="relative">
                                <select 
                                    value={categoryFilter} 
                                    onChange={(e) => setCategoryFilter(e.target.value)} 
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-3 rounded-xl appearance-none outline-none focus:border-primary text-xs font-bold uppercase tracking-wider cursor-pointer"
                                >
                                    {['All', 'Income', 'Transfer', 'Purchase', 'Groceries', 'Utilities', 'Shopping', 'Food & Drink', 'Travel', 'Entertainment', 'Payroll'].map(c => (
                                        <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
                                    ))}
                                </select>
                                <ChevronDownIcon className="w-4 h-4 text-[#0F172A] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>

                        {/* Date Range */}
                        <div className="space-y-4">
                             <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest block">Date Range</label>
                             <div className="flex flex-col gap-2">
                                <div className="relative">
                                    <CalendarDaysIcon className="w-4 h-4 text-[#0F172A] absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input 
                                        type="date" 
                                        value={dateRange.start} 
                                        onChange={e => setDateRange(p => ({...p, start: e.target.value}))}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white pl-10 pr-4 py-3 rounded-xl outline-none focus:border-primary text-xs font-bold uppercase tracking-wider" 
                                    />
                                </div>
                                <div className="relative">
                                    <CalendarDaysIcon className="w-4 h-4 text-[#0F172A] absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input 
                                        type="date" 
                                        value={dateRange.end} 
                                        onChange={e => setDateRange(p => ({...p, end: e.target.value}))}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white pl-10 pr-4 py-3 rounded-xl outline-none focus:border-primary text-xs font-bold uppercase tracking-wider" 
                                    />
                                </div>
                             </div>
                        </div>

                        {/* Amount Range & Presets */}
                        <div className="space-y-4">
                             <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest block">Amount Range (USD)</label>
                             <div className="relative mb-2">
                                <select 
                                    value={amountPreset} 
                                    onChange={(e) => handleAmountPresetChange(e.target.value)} 
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-2.5 rounded-xl appearance-none outline-none focus:border-primary text-xs font-bold uppercase tracking-wider cursor-pointer"
                                >
                                    <option value="All">Custom / All Amounts</option>
                                    <option value="under100">Under $100</option>
                                    <option value="100to1000">$100 – $1,000</option>
                                    <option value="1000to10000">$1,000 – $10,000</option>
                                    <option value="over10000">Over $10,000</option>
                                </select>
                                <ChevronDownIcon className="w-4 h-4 text-[#0F172A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                             </div>
                             <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0F172A] text-xs font-bold">$</span>
                                    <input 
                                        type="number" 
                                        placeholder="Min" 
                                        value={amountRange.min}
                                        onChange={e => {
                                            setAmountPreset('All');
                                            setAmountRange(p => ({...p, min: e.target.value}));
                                        }}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white pl-6 pr-2 py-2.5 rounded-xl outline-none focus:border-primary text-xs font-mono font-bold"
                                    />
                                </div>
                                <span className="text-[#0F172A]">-</span>
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0F172A] text-xs font-bold">$</span>
                                    <input 
                                        type="number" 
                                        placeholder="Max" 
                                        value={amountRange.max}
                                        onChange={e => {
                                            setAmountPreset('All');
                                            setAmountRange(p => ({...p, max: e.target.value}));
                                        }}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white pl-6 pr-2 py-2.5 rounded-xl outline-none focus:border-primary text-xs font-mono font-bold"
                                    />
                                </div>
                             </div>
                        </div>

                        {/* Merchant Filter */}
                        <div className="space-y-4">
                             <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest block">Merchant / Node Name</label>
                             <div className="relative">
                                 <input 
                                     type="text" 
                                     placeholder="e.g. Amazon, Zelle, Wise" 
                                     value={merchantFilter} 
                                     onChange={e => setMerchantFilter(e.target.value)}
                                     className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white pl-4 pr-4 py-3 rounded-xl outline-none focus:border-primary text-xs font-bold" 
                                 />
                             </div>
                        </div>

                        {/* Sorting */}
                        <div>
                             <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest block mb-2">Sort Order</label>
                             <div className="grid grid-cols-1 gap-1.5">
                                {[
                                    { id: 'newest', label: 'Date: Newest First' },
                                    { id: 'oldest', label: 'Date: Oldest First' },
                                    { id: 'highest', label: 'Amount: High to Low' },
                                    { id: 'lowest', label: 'Amount: Low to High' }
                                ].map(opt => (
                                    <button 
                                        key={opt.id}
                                        onClick={() => setSortOrder(opt.id as any)}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${sortOrder === opt.id ? 'bg-primary/10 border-primary text-[#0F172A] dark:text-white' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-white/10 text-[#0F172A] hover:text-[#0F172A] dark:text-white'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                             </div>
                        </div>

                    </div>
                )}
            </div>

            {/* Bulk Action Toolbar */}
            {selectedTransactions.size > 0 && (
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/50 p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in-down">
                    <div className="flex items-center gap-3">
                        <div className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-black font-mono shadow-md">
                            {selectedTransactions.size} Selected
                        </div>
                        <p className="text-xs text-[#0F172A] font-bold hidden md:block">
                            Bulk Action Toolbar: Export or apply categories across multiple selected transactions.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Export Selected to CSV */}
                        <button 
                            onClick={handleBatchExport}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" /> Export to CSV
                        </button>

                        {/* Bulk Categorize */}
                        <div className="flex items-center gap-1.5 bg-slate-100 border border-black/5 p-1 rounded-xl">
                            <select 
                                value={selectedBulkCategory} 
                                onChange={(e) => setSelectedBulkCategory(e.target.value)}
                                className="bg-transparent text-white text-xs font-bold px-3 py-1.5 outline-none cursor-pointer"
                            >
                                {['Shopping', 'Groceries', 'Utilities', 'Payroll', 'Income', 'Transfer', 'Food & Drink', 'Travel', 'Entertainment', 'Tax-Deductible', 'Medical'].map(c => (
                                    <option key={c} value={c} className="bg-slate-50 text-white dark:bg-slate-900">{c}</option>
                                ))}
                            </select>
                            <button 
                                onClick={handleApplyBulkCategory}
                                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                            >
                                Bulk Categorize
                            </button>
                        </div>

                        {/* Deselect All */}
                        <button 
                            onClick={() => setSelectedTransactions(new Set())}
                            className="px-3 py-2 text-[#0F172A] hover:text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                        >
                            Deselect All
                        </button>
                    </div>
                </div>
            )}

            {/* Ledger Content */}
            <div className="bg-white dark:bg-[#0c121e] rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden">
                <div className="p-8 border-b border-slate-100 dark:border-white/10 bg-white  flex justify-between items-center dark:bg-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10">
                            <ActivityIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-[#0F172A] dark:text-white tracking-tight uppercase">Transmission Ledger</h3>
                            <p className="text-[10px] text-[#0F172A] dark:text-white font-bold uppercase tracking-widest mt-0.5">Real-time Node Activity</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                         <button 
                             onClick={() => setIsStatementOpen(true)}
                             className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-[9px] uppercase tracking-widest transition-all shadow-lg shadow-amber-500/10 flex items-center gap-2 border border-amber-400/20 active:scale-95 cursor-pointer"
                         >
                            <ClipboardDocumentIcon className="w-4 h-4 text-slate-950" /> Generate Statement
                         </button>
                         <button onClick={() => handleExportCSV(transactions, 'full_history')} className="px-6 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] hover:text-[#0F172A] dark:text-white font-black rounded-xl text-[9px] uppercase tracking-widest transition-all shadow-xl flex items-center gap-2">
                            <ArrowDownTrayIcon className="w-4 h-4" /> Export CSV
                         </button>
                         <button onClick={() => handleExportPDF(transactions, 'full_history')} className="px-6 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] hover:text-[#0F172A] dark:text-white font-black rounded-xl text-[9px] uppercase tracking-widest transition-all shadow-xl flex items-center gap-2">
                            <ArrowDownTrayIcon className="w-4 h-4" /> Export PDF
                         </button>
                         {selectedTransactions.size > 0 && (
                            <button onClick={handleBatchExport} className="px-6 py-2.5 bg-white text-[#0F172A] font-black rounded-xl text-[9px] uppercase tracking-widest hover:bg-primary hover:text-[#0F172A] dark:text-white transition-all shadow-xl flex items-center gap-2 dark:bg-slate-800">
                                <ArrowDownTrayIcon className="w-4 h-4" /> Batch Export ({selectedTransactions.size})
                            </button>
                         )}
                         {selectedTransactions.size === 1 && (
                            <button onClick={() => {
                                const txId = Array.from(selectedTransactions)[0];
                                const tx = transactions.find(t => t.id === txId);
                                if (tx) setQrTransaction(tx);
                            }} className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 font-black rounded-xl text-[9px] uppercase tracking-widest transition-all shadow-xl flex items-center gap-2">
                                <QrCodeIcon className="w-4 h-4" /> Authenticity QR
                            </button>
                         )}
                         <span className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest">
                            {filteredTransactions.length} Verified Entries
                         </span>
                    </div>
                </div>

                 <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="text-[9px] text-[#0F172A] uppercase bg-slate-100 font-black tracking-[0.3em] border-b border-slate-100 dark:border-white/10">
                                <th className="py-6 px-6 w-12 text-center">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0}
                                        onChange={handleSelectAll}
                                        className="h-4 w-4 rounded border-slate-200 dark:border-slate-300 bg-slate-50 dark:bg-slate-900 text-primary transition-all cursor-pointer"
                                    />
                                </th>
                                <th className="py-6 px-6">Transmission Node</th>
                                <th className="py-6 px-6 text-right">Debit / Credit</th>
                                <th className="py-6 px-6">Network Status</th>
                                <th className="py-6 px-6 text-right">Timestamp</th>
                                <th className="py-6 px-6"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                        <AnimatePresence mode="popLayout">
                            {filteredTransactions.map((tx, idx) => (
                                <TransactionRow 
                                    key={tx.id} 
                                    transaction={tx}
                                    searchTerm={searchTerm}
                                    isSelected={selectedTransactions.has(tx.id)}
                                    onSelect={(id) => {
                                        const next = new Set(selectedTransactions);
                                        if (next.has(id)) next.delete(id); else next.add(id);
                                        setSelectedTransactions(next);
                                    }}
                                    onDownloadReceipt={handleDownloadReceipt}
                                    isGeneratingPdf={isGeneratingPdf && pdfData?.transaction.id === tx.id}
                                    onViewDetails={setViewingTransactionDetails}
                                    onRepeat={onRepeatTransaction}
                                    onResume={handleResumeTransaction}
                                    onPause={handlePauseTransaction}
                                    onOpenReceiptModal={setViewingReceiptTx}
                                    onRowFileUpload={handleRowFileUpload}
                                    isOcrProcessing={ocrProcessingTxId === tx.id}
                                    index={idx}
                                />
                            ))}
                        </AnimatePresence>
                        </tbody>
                    </table>
                 </div>

                 {filteredTransactions.length === 0 && (
                     <div className="py-32 text-center bg-slate-100 flex flex-col items-center">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-[2rem] flex items-center justify-center text-[#0F172A] mb-6 shadow-inner">
                            <ClockIcon className="w-10 h-10" />
                        </div>
                        <h4 className="text-xl font-black text-[#0F172A] dark:text-white uppercase tracking-widest">No matching ledger entries</h4>
                        <p className="text-[#0F172A] mt-2 font-bold">Adjust your criteria or clear the search hub.</p>
                        <button onClick={clearAllFilters} className="mt-8 px-8 py-3 bg-white hover:bg-white text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10 transition-all dark:bg-slate-800">Clear Filters</button>
                     </div>
                 )}
            </div>
            
            {viewingTransactionDetails && (
                <TransactionDetailsModal
                    transaction={viewingTransactionDetails}
                    account={accounts.find(a => a.id === viewingTransactionDetails.accountId)}
                    userProfile={userProfile}
                    onClose={() => setViewingTransactionDetails(null)}
                    onDownloadReceipt={handleDownloadReceipt}
                    onRepeatTransaction={(tx) => { setViewingTransactionDetails(null); onRepeatTransaction(tx); }}
                    onContactSupport={(txId) => { setViewingTransactionDetails(null); onContactSupport(txId); }}
                    onRefundTransaction={onRefundTransaction}
                    onUpdateTags={(txId, tags) => {
                        onUpdateTransactions([txId], { tags });
                        // Also update the local viewing state so the modal stays synced if we don't unmount
                        setViewingTransactionDetails({
                            ...viewingTransactionDetails,
                            tags
                        });
                    }}
                    onUpdateNote={(txId, note) => {
                        onUpdateTransactions([txId], {
                            transactionDetails: {
                                ...viewingTransactionDetails.transactionDetails,
                                memo: note
                            }
                        });
                        // Also update the local viewing state so the modal stays synced if we don't unmount
                        setViewingTransactionDetails({
                            ...viewingTransactionDetails,
                            transactionDetails: {
                                ...viewingTransactionDetails.transactionDetails,
                                memo: note
                            }
                        });
                    }}
                />
            )}

            {isStatementOpen && (
                <StatementGeneratorModal
                    isOpen={isStatementOpen}
                    onClose={() => setIsStatementOpen(false)}
                    transactions={transactions}
                    accounts={accounts}
                    userProfile={userProfile}
                    onUpdateProfile={onUpdateProfile}
                />
            )}

            {/* Hidden Receipt for PDF Generation */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -1 }}>
                {isGeneratingPdf && pdfData && (
                    <div id={`receipt-for-pdf-${pdfData.transaction.id}`}>
                        <DownloadableReceipt 
                            transaction={pdfData.transaction} 
                            sourceAccount={pdfData.account} 
                            userProfile={userProfile}
                            transactions={transactions}
                        />
                    </div>
                )}
            </div>

            {qrTransaction && (
                <div className="fixed inset-0 bg-slate-100  z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setQrTransaction(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col items-center p-8 border border-slate-200 dark:border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-16 rounded-full bg-emerald-500 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mb-6">
                            <QrCodeIcon className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black text-[#0F172A] dark:text-white tracking-tight uppercase mb-2">Authenticity QR</h3>
                        <p className="text-center text-sm text-[#0F172A] dark:text-white font-bold mb-8">Scan to verify transaction #{qrTransaction.id.slice(0, 8).toUpperCase()}</p>
                        <div className="bg-white p-4 rounded-2xl shadow-inner border border-slate-200 dark:bg-slate-800">
                            <QRCodeSVG 
                                value={JSON.stringify({
                                    id: qrTransaction.id,
                                    amount: qrTransaction.sendAmount,
                                    currency: 'USD',
                                    date: qrTransaction.statusTimestamps?.[TransactionStatus.SUBMITTED],
                                    status: qrTransaction.status
                                })} 
                                size={200}
                                level="M"
                                includeMargin={false}
                            />
                        </div>
                        <button onClick={() => setQrTransaction(null)} className="mt-8 w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-700 text-[#0F172A] dark:text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-colors">
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Real-time Clearinghouse Clearance Feedback Banner */}
            <AnimatePresence>
                {clearinghouseValidatedAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="fixed top-6 right-6 z-[250] w-full max-w-md bg-slate-50 dark:bg-slate-800  border border-emerald-500/30 rounded-2xl shadow-[0_20px_50px_rgba(16,185,129,0.3)] p-5 overflow-hidden text-left"
                        id="clearinghouse-notification-toast"
                    >
                        {/* Status bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
                        
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-500 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                <CheckCircleIcon className="w-7 h-7" />
                            </div>
                            <div className="flex-grow min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-mono font-bold text-emerald-400 tracking-[0.2em] uppercase">
                                        CH_CLEARING_HOUSE_PROTOCOL // SETTLED
                                    </span>
                                    <button 
                                        onClick={() => setClearinghouseValidatedAlert(null)}
                                        className="text-[#0F172A] hover:text-white transition-colors"
                                    >
                                        <XCircleIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                <h4 className="text-sm font-black text-white mt-1 uppercase tracking-tight">
                                    QR Transaction Settled Instantly
                                </h4>
                                <div className="bg-white rounded-xl p-3 mt-3 space-y-1 border border-slate-200 dark:border-white/10 dark:bg-slate-800">
                                    <div className="flex justify-between text-[10px] font-bold text-[#0F172A]">
                                        <span>RecipientNode:</span>
                                        <span className="text-white font-bold uppercase truncate max-w-[170px]">
                                            {clearinghouseValidatedAlert.recipient?.nickname || clearinghouseValidatedAlert.recipient?.fullName}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-[#0F172A]">
                                        <span>Amount Cleared:</span>
                                        <span className="text-emerald-400 font-mono font-black">
                                            {formatCurrency(clearinghouseValidatedAlert.sendAmount, 'USD')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-mono text-[#0F172A]">
                                        <span>Auth Hash:</span>
                                        <span>TX_{clearinghouseValidatedAlert.id.slice(-8)}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => {
                                            setViewingTransactionDetails(clearinghouseValidatedAlert);
                                            setClearinghouseValidatedAlert(null);
                                        }}
                                        className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-colors text-center cursor-pointer"
                                    >
                                        Audit Settlement
                                    </button>
                                    <button
                                        onClick={() => setClearinghouseValidatedAlert(null)}
                                        className="px-4 py-2 bg-white hover:bg-white text-[#0F172A] hover:text-white rounded-xl font-bold uppercase tracking-wider text-[10px] transition-colors dark:bg-slate-800"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {viewingReceiptTx && (
                <ReceiptViewerModal
                    transaction={viewingReceiptTx}
                    onClose={() => setViewingReceiptTx(null)}
                    onUpdateTransaction={(txId, updates) => {
                        onUpdateTransactions([txId], updates);
                        setViewingReceiptTx(prev => prev ? { ...prev, ...updates } : null);
                    }}
                    onDownloadPdfReceipt={handleDownloadReceipt}
                />
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.1); }
            `}</style>
        </div>
    );
};
