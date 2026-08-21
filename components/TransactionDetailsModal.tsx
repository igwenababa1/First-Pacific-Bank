import React, { useState } from 'react';
import { compressImage } from '../utils/imageProcessor';
import { Transaction, Account, TransactionStatus, UserProfile } from '../types';
import { db } from '../services/database';
import { PaymentProofScannerModal } from './PaymentProofScannerModal';
import { 
    XIcon, 
    CheckCircleIcon, 
    ClockIcon, 
    ShieldCheckIcon, 
    GlobeAmericasIcon, 
    BankIcon, 
    UserCircleIcon, 
    DocumentCheckIcon,
    ArrowDownTrayIcon,
    QuestionMarkCircleIcon,
    ArrowPathIcon,
    MapPinIcon,
    CreditCardIcon,
    CalendarDaysIcon,
    CameraIcon,
    BrandLogo,
    getBankIcon,
    ShoppingBagIcon,
    ServerIcon,
    LockClosedIcon,
    ChatBubbleLeftRightIcon,
    FlagIcon,
    ShareIcon
} from './Icons';
import { USER_PROFILE, BANKS_BY_COUNTRY, SERVICES_CONFIG } from './constants';
import { useCurrency } from '../contexts/CurrencyContext';
import { socket } from '../services/socket';
import { autoCategorizeTransactionWithGemini } from '../services/geminiService';

interface TransactionDetailsModalProps {
    transaction: Transaction;
    account?: Account;
    userProfile?: UserProfile;
    onClose: () => void;
    onDownloadReceipt: (transaction: Transaction) => void;
    onRepeatTransaction: (transaction: Transaction) => void;
    onContactSupport: (transactionId: string) => void;
    onRefundTransaction?: (transactionId: string, amount: number, accountId: string) => void;
    onUpdateNote?: (transactionId: string, note: string) => void;
    onUpdateTags?: (transactionId: string, tags: string[]) => void;
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className }) => (
    <div className={`flex justify-between items-start py-3 border-b border-slate-200 dark:border-white/10 last:border-0 ${className}`}>
        <span className="text-sm text-[#0F172A] dark:text-white font-bold">{label}</span>
        <span className="text-sm font-semibold text-[#1E293B] dark:text-slate-100 text-right max-w-[60%] break-words">{value}</span>
    </div>
);

const StatusTimeline: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
    const steps = [
        { status: TransactionStatus.SUBMITTED, label: 'Submitted' },
        { status: TransactionStatus.AWAITING_AUTHORIZATION, label: 'Authorization' },
        { status: TransactionStatus.IN_TRANSIT, label: 'Processing' },
        { status: TransactionStatus.FUNDS_ARRIVED, label: 'Completed' }
    ];

    const currentStepIndex = steps.findIndex(s => s.status === transaction.status);
    const relevantSteps = steps.filter((_, index) => {
        if (transaction.status === TransactionStatus.FUNDS_ARRIVED) return true;
        return index <= (currentStepIndex === -1 ? 0 : currentStepIndex);
    });

    return (
        <div className="space-y-6 relative pl-4 border-l-2 border-slate-200 dark:border-slate-300 ml-2 my-4">
            {Object.entries(transaction.statusTimestamps).map(([status, date], index) => {
                const dateObj = new Date(date as Date);
                return (
                    <div key={status} className="relative">
                        <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-white dark:border-slate-700 ring-2 ring-primary/20"></div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline">
                            <p className="text-sm font-bold text-[#0F172A] dark:text-white capitalize">{status.replace(/_/g, ' ').toLowerCase()}</p>
                            <p className="text-xs text-[#0F172A] dark:text-white font-mono">
                                {dateObj.toLocaleDateString()} • {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// Helper to guess domain for logo
const getEntityDomain = (tx: Transaction): string | null => {
    // If it's a card transaction with merchant info
    if ((tx as any).merchantInfo?.name) {
        const name = (tx as any).merchantInfo.name.toLowerCase().replace(/\s/g, '');
        return `${name}.com`;
    }

    // Use recipient data
    if (tx.recipient) {
        if (tx.recipient.recipientType === 'service' && tx.recipient.serviceName) {
             if (SERVICES_CONFIG[tx.recipient.serviceName]) {
                 return SERVICES_CONFIG[tx.recipient.serviceName].domain;
             }
             return `${tx.recipient.serviceName.toLowerCase().replace(/\s/g, '')}.com`;
        }
        
        // Check known banks map
        for (const country in BANKS_BY_COUNTRY) {
            const bank = BANKS_BY_COUNTRY[country].find(b => b.name === tx.recipient.bankName);
            if (bank) return bank.domain;
        }
        
        // Generic Fallback
        return `${tx.recipient.bankName.toLowerCase().replace(/\s/g, '')}.com`;
    }

    // Try description for vendors (e.g. "Starbucks", "Uber")
    const words = tx.description.split(' ');
    if (words.length > 0) {
        const potentialBrand = words[0].toLowerCase();
        if (['uber', 'apple', 'starbucks', 'amazon', 'netflix', 'spotify'].includes(potentialBrand)) {
            return `${potentialBrand}.com`;
        }
    }
    
    return null;
};


export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({ 
    transaction, 
    account, 
    userProfile,
    onClose, 
    onDownloadReceipt, 
    onRepeatTransaction,
    onContactSupport,
    onRefundTransaction,
    onUpdateNote,
    onUpdateTags
}) => {
    const { formatCurrency } = useCurrency();
    const isCredit = transaction.type === 'credit';
    const totalAmount = isCredit ? transaction.sendAmount : transaction.sendAmount + transaction.fee;

    // Determine fallback icon
    const HeaderIcon = isCredit ? BankIcon : (transaction.transferMethod === 'wire' ? GlobeAmericasIcon : ShoppingBagIcon);
    const domain = getEntityDomain(transaction);
    const entityName = transaction.recipient?.bankName || transaction.recipient?.serviceName || transaction.description;

    // Resolve address display
    const displayRecipientAddress = transaction.recipientAddress || 
        (transaction.recipient?.streetAddress 
            ? `${transaction.recipient.streetAddress}${transaction.recipient.city ? `, ${transaction.recipient.city}` : ''}${transaction.recipient.postalCode ? ` ${transaction.recipient.postalCode}` : ''}` 
            : null);

    // Advanced Reversal State Engine
    // 0: Normal detail, 1: Safety PIN requirement, 2: Simulating clearing rollback progress logs, 3: Completed refund
    const [reversalStep, setReversalStep] = useState<number>(0);
    const [pinInput, setPinInput] = useState<string>('');
    const [pinError, setPinError] = useState<string>('');
    const [progressLogs, setProgressLogs] = useState<string[]>([]);
    const [currentPercent, setCurrentPercent] = useState<number>(0);

    const [haltCodeInput, setHaltCodeInput] = useState('');
    const [haltCodeError, setHaltCodeError] = useState('');
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [unlockSuccess, setUnlockSuccess] = useState(false);

    const [localMemo, setLocalMemo] = useState(transaction.transactionDetails?.memo || '');
    const [newCustomTag, setNewCustomTag] = useState('');
    const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);

    const handleAddCustomTag = () => {
        const tagToAdd = newCustomTag.trim().replace(/^#/, '');
        if (!tagToAdd || !onUpdateTags) return;
        const currentTags = transaction.tags || [];
        if (!currentTags.includes(tagToAdd)) {
            onUpdateTags(transaction.id, [...currentTags, tagToAdd]);
        }
        setNewCustomTag('');
    };

    const handleRemoveTag = (tagToRemove: string) => {
        if (!onUpdateTags) return;
        const currentTags = transaction.tags || [];
        onUpdateTags(transaction.id, currentTags.filter(t => t !== tagToRemove));
    };

    // Attach Payment Proof State
    const [isProofScannerModalOpen, setIsProofScannerModalOpen] = useState(false);
    const [proofAttachedBase64, setProofAttachedBase64] = useState<string | null>(transaction.paymentProof || null);
    const [proofSourceType, setProofSourceType] = useState<'camera' | 'file' | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isSubmittingProof, setIsSubmittingProof] = useState(false);
    const [proofSubmitSuccess, setProofSubmitSuccess] = useState(false);
    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    const [streamRef, setStreamRef] = React.useState<MediaStream | null>(null);

    const startCamera = async () => {
        setIsCameraActive(true);
        setProofSubmitSuccess(false);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStreamRef(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error('[Camera API Error]', err);
            alert('Failed to access camera. Please check camera permissions or upload an image file instead.');
            setIsCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (streamRef) {
            streamRef.getTracks().forEach(track => track.stop());
            setStreamRef(null);
        }
        setIsCameraActive(false);
    };

    const captureSnapshot = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth || 640;
            canvas.height = videoRef.current.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setProofAttachedBase64(dataUrl);
                setProofSourceType('camera');
            }
            stopCamera();
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setProofSubmitSuccess(false);
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressed = await compressImage(file);
                setProofAttachedBase64(compressed);
                setProofSourceType('file');
            } catch (err) {
                console.error("Compression failed:", err);
                const reader = new FileReader();
                reader.onload = () => {
                    if (typeof reader.result === 'string') {
                        setProofAttachedBase64(reader.result);
                        setProofSourceType('file');
                    }
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const handleSubmitProof = async () => {
        if (!proofAttachedBase64) return;
        setIsSubmittingProof(true);
        try {
            const updatedTx: Transaction = {
                ...transaction,
                status: TransactionStatus.AWAITING_PAYMENT_VERIFICATION,
                paymentProof: proofAttachedBase64,
                paymentProofTimestamp: new Date().toISOString(),
                verificationRequested: true,
                statusTimestamps: {
                    ...(transaction.statusTimestamps || {}),
                    [TransactionStatus.AWAITING_PAYMENT_VERIFICATION]: new Date()
                }
            };

            await db.saveTransaction(updatedTx);
            
            try {
                socket.emit('user:payment_proof_uploaded', {
                    txId: transaction.id,
                    proofAttached: true
                });
                window.dispatchEvent(new CustomEvent('ADMIN_NOTIFICATION_UPDATE', {
                    detail: {
                        type: 'payment_proof',
                        message: `New payment proof uploaded for transaction ${transaction.id}`,
                        txId: transaction.id
                    }
                }));
                window.dispatchEvent(new CustomEvent('REALTIME_LEDGER_UPDATE', { detail: [updatedTx] }));
                window.dispatchEvent(new CustomEvent('db_transactions_updated', { detail: [updatedTx] }));
            } catch (e) {
                console.warn(e);
            }

            setProofSubmitSuccess(true);
            setTimeout(() => setProofSubmitSuccess(false), 8000);
        } catch (err) {
            console.error('[Submit Proof Error]', err);
            alert('Failed to submit proof. Please try again.');
        } finally {
            setIsSubmittingProof(false);
        }
    };

    const handleSaveMemo = () => {
        if (onUpdateNote && localMemo !== transaction.transactionDetails?.memo) {
            onUpdateNote(transaction.id, localMemo);
        }
    };

    const isReversible = !isCredit && 
        transaction.status !== TransactionStatus.REVERSED && 
        (transaction.status as string) !== 'Reversed' &&
        transaction.status !== TransactionStatus.FAILED;

    const executeReversalLogs = () => {
        setReversalStep(2);
        setCurrentPercent(0);
        setProgressLogs([]);
        
        const logs = [
            `[SECURE_CHANNEL] Establishing TLS encrypted trunk with Clearing House...`,
            `[LOCATE_BATCH] Scanning active FedWire/ACH queue for TraceID: CLR-TRCK-${transaction.id.slice(-6).toUpperCase()}`,
            `[AUTHORIZE_BYPASS] Validation signature certified on profile ${userProfile?.email || USER_PROFILE.email}`,
            `[BENEFICIARY_SEIZURE] Revoked settling instruction with beneficiary institution ${transaction.recipient?.bankName || 'Partner Bank'}`,
            `[LEDGER_ROLLBACK] Instructing core ledger system to refund checking balance...`,
            `[CLEARED] Balance transaction re-credit process approved successfully!`
        ];

        let index = 0;
        const interval = setInterval(() => {
            if (index < logs.length) {
                setProgressLogs(prev => [...prev, logs[index]]);
                setCurrentPercent((index + 1) * 16.6);
                index++;
            } else {
                clearInterval(interval);
                // Call back parent state engine
                if (onRefundTransaction) {
                    onRefundTransaction(transaction.id, totalAmount, transaction.accountId);
                }
                setReversalStep(3);
            }
        }, 800);
    };

    const handleConfirmPin = (e: React.FormEvent) => {
        e.preventDefault();
        if (pinInput.trim().length < 4) {
            setPinError('Institutional override PIN must be at least 4 digits.');
            return;
        }
        setPinError('');
        executeReversalLogs();
    };

    const handleVerifyHaltCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setHaltCodeError('');
        setIsUnlocking(true);
        
        setTimeout(async () => {
            const entered = haltCodeInput.trim().toUpperCase();
            if (!entered) {
                setHaltCodeError('Please enter a Compliance Halt Code.');
                setIsUnlocking(false);
                return;
            }
            
            // Read latest from db to get the up-to-date regulatoryAuthCode
            let storedCode = '';
            try {
                const latestTxs = await db.getAllTransactions();
                const latestTx = latestTxs.find(t => t.id === transaction.id);
                if (latestTx) {
                    transaction.regulatoryAuthCode = latestTx.regulatoryAuthCode;
                }
                storedCode = ((latestTx?.regulatoryAuthCode || transaction.regulatoryAuthCode || '') as string).trim().toUpperCase();
            } catch (err) {
                console.warn("Failed to read latest transactions from DB, falling back to local object: ", err);
                storedCode = ((transaction.regulatoryAuthCode || '') as string).trim().toUpperCase();
            }
            
            if (storedCode && entered === storedCode) {
                try {
                    if (transaction.type === 'credit') {
                        const targetEmail = userProfile?.email || USER_PROFILE.email;
                        const accountsList = await db.getAccounts(targetEmail);
                        const targetAccount = accountsList.find(a => a.id === transaction.accountId);
                        
                        if (targetAccount) {
                            const newBalance = targetAccount.balance + transaction.receiveAmount;
                            await db.updateAccountBalance(targetEmail, targetAccount.id, newBalance);
                            console.log(`[Escrow Settlement - Halt Code] Successfully credited ${transaction.receiveAmount} to account ${targetAccount.id}. New Balance: ${newBalance}`);
                        }
                    }

                    await db.updateTransactionStatus(transaction.id, TransactionStatus.COMPLETED);
                    transaction.status = TransactionStatus.COMPLETED;
                    if (!transaction.statusTimestamps) transaction.statusTimestamps = {} as any;
                    (transaction.statusTimestamps as any)[TransactionStatus.COMPLETED] = new Date();
                    setUnlockSuccess(true);
                    
                    // Trigger a reload window custom event or update parent if needed
                    window.dispatchEvent(new CustomEvent('TRANSACTION_STATUS_UPDATED', { detail: { id: transaction.id, status: TransactionStatus.COMPLETED } }));
                } catch (err) {
                    console.error("Failed to update transaction status:", err);
                    setHaltCodeError('Failed to access secure ledger node. Please retry.');
                }
            } else {
                setHaltCodeError('Invalid Compliance Halt Code. Please inspect support documentation.');
            }
            setIsUnlocking(false);
        }, 1500);
    };

    const handlePayFeeAndCredit = async (e: React.FormEvent) => {
        e.preventDefault();
        setHaltCodeError('');
        setIsUnlocking(true);
        
        setTimeout(async () => {
            try {
                // 1. Get user's accounts to update balance IF this is an incoming transaction
                if (transaction.type === 'credit') {
                    const targetEmail = userProfile?.email || USER_PROFILE.email;
                    const accountsList = await db.getAccounts(targetEmail);
                    const targetAccount = accountsList.find(a => a.id === transaction.accountId);
                    
                    if (targetAccount) {
                        const newBalance = targetAccount.balance + transaction.receiveAmount;
                        await db.updateAccountBalance(targetEmail, targetAccount.id, newBalance);
                        console.log(`[Escrow Settlement] Successfully credited ${transaction.receiveAmount} to account ${targetAccount.id}. New Balance: ${newBalance}`);
                    } else {
                        throw new Error("Target checking account not found.");
                    }
                }

                // 2. Update transaction status to COMPLETED
                await db.updateTransactionStatus(transaction.id, TransactionStatus.COMPLETED);
                transaction.status = TransactionStatus.COMPLETED;
                if (!transaction.statusTimestamps) transaction.statusTimestamps = {} as any;
                (transaction.statusTimestamps as any)[TransactionStatus.COMPLETED] = new Date();
                
                setUnlockSuccess(true);
                
                // 3. Dispatch events to notify parent components and trigger state reload
                window.dispatchEvent(new CustomEvent('TRANSACTION_STATUS_UPDATED', { 
                    detail: { 
                        id: transaction.id, 
                        status: TransactionStatus.COMPLETED,
                        accountId: transaction.accountId,
                        amount: transaction.receiveAmount
                    } 
                }));
                window.dispatchEvent(new CustomEvent('db_accounts_updated'));
            } catch (err) {
                console.error("Failed to execute routing fee clearance & credit:", err);
                setHaltCodeError('Clearance Desk Error: Failed to secure federal transit corridor. Please retry.');
            } finally {
                setIsUnlocking(false);
            }
        }, 2500);
    };

    return (
        <div className="fixed inset-0 bg-slate-100  z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up border border-slate-200 dark:border-white/10"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-start bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center space-x-4">
                        <div className={`p-1.5 rounded-xl shadow-lg border border-slate-200 dark:border-white/10 ${isCredit ? 'bg-white' : 'bg-white'}`}>
                            <div className="w-12 h-12 flex items-center justify-center overflow-hidden rounded-lg">
                                <BrandLogo 
                                    domain={domain || ''} 
                                    name={entityName} 
                                    fallback={HeaderIcon} 
                                    className="w-full h-full object-contain" 
                                />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white">
                                {isCredit ? '+' : '-'}{formatCurrency(totalAmount, 'USD')}
                            </h2>
                            <div className="flex items-center space-x-2 mt-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    (transaction.status as string) === TransactionStatus.FUNDS_ARRIVED || (transaction.status as string) === TransactionStatus.COMPLETED
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                    : (transaction.status as string) === 'Reversed' || transaction.status === TransactionStatus.REVERSED
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 animate-pulse'
                                    : (transaction.status as string) === TransactionStatus.PAUSED_ON_HOLD
                                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                }`}>
                                    {(transaction.status as string) === 'Reversed' || transaction.status === TransactionStatus.REVERSED ? (
                                        <ShieldCheckIcon className="w-3 h-3 mr-1"/>
                                    ) : (transaction.status as string) === TransactionStatus.PAUSED_ON_HOLD ? (
                                        <ClockIcon className="w-3 h-3 mr-1 animate-pulse" />
                                    ) : (
                                        (transaction.status as string) === TransactionStatus.FUNDS_ARRIVED || (transaction.status as string) === TransactionStatus.COMPLETED ? <CheckCircleIcon className="w-3 h-3 mr-1"/> : <ClockIcon className="w-3 h-3 mr-1"/>
                                    )}
                                    {transaction.status}
                                </span>
                                <span className="text-xs text-[#0F172A] dark:text-white font-mono">#{transaction.id.slice(-8)}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:hover:text-[#0F172A] dark:text-[#1E293B] rounded-full hover:bg-slate-200 dark:hover:bg-white transition-colors dark:bg-slate-800">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content switching based on reversal step */}
                {reversalStep === 0 && (
                    <div className="flex-grow overflow-y-auto p-6 space-y-8 custom-scrollbar">

                        {/* Quick Actions Floating Menu */}
                        <div className="flex gap-2 justify-center mb-2 animate-fade-in-up">
                            <button 
                                onClick={() => onContactSupport(transaction.id)}
                                className="flex-1 flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-white border border-slate-200 dark:border-white/10 transition-all shadow-sm group"
                            >
                                <ChatBubbleLeftRightIcon className="w-5 h-5 text-[#0F172A] group-hover:text-primary transition-colors" />
                                <span className="text-[9px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest">Message Support</span>
                            </button>
                            <button 
                                onClick={() => { alert("Transaction flagged for manual review."); }}
                                className="flex-1 flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-white border border-slate-200 dark:border-white/10 transition-all shadow-sm group"
                            >
                                <FlagIcon className="w-5 h-5 text-[#0F172A] group-hover:text-rose-500 transition-colors" />
                                <span className="text-[9px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest">Flag Transaction</span>
                            </button>
                            <button 
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({
                                            title: 'Transaction Details',
                                            text: `Transaction ${transaction.id} for ${formatCurrency(totalAmount, 'USD')}`,
                                        });
                                    } else {
                                        alert("Sharing is not supported on this device.");
                                    }
                                }}
                                className="flex-1 flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-white border border-slate-200 dark:border-white/10 transition-all shadow-sm group"
                            >
                                <ShareIcon className="w-5 h-5 text-[#0F172A] group-hover:text-indigo-400 transition-colors" />
                                <span className="text-[9px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest">Share Details</span>
                            </button>
                            <button 
                                onClick={() => onDownloadReceipt(transaction)}
                                className="flex-1 flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-white border border-slate-200 dark:border-white/10 transition-all shadow-sm group"
                            >
                                <ArrowDownTrayIcon className="w-5 h-5 text-[#0F172A] group-hover:text-amber-500 transition-colors" />
                                <span className="text-[9px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest">Download PDF</span>
                            </button>
                        </div>
                        
                        {/* Parties */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                            {isCredit && (
                                /* Simulated Bank Official Stamp */
                                <div className="absolute right-4 -top-3.5 transform rotate-[-6deg] opacity-[0.85] pointer-events-none z-30 select-none hidden sm:block">
                                    <div className="border-[2.5px] border-amber-600 dark:border-amber-505 text-amber-600 dark:text-amber-500 rounded-lg px-3 py-1.5 text-center uppercase font-mono font-black scale-90 mix-blend-multiply flex flex-col items-center">
                                        <span className="text-[6px] tracking-widest leading-none mb-0.5">FEDERAL INTERBANK SYSTEM</span>
                                        <span className="text-[9px] leading-none mb-0.5 tracking-tighter">OFFICIAL VERIFICATION</span>
                                        <span className="text-[8px] font-bold leading-none mb-0.5 whitespace-nowrap text-amber-700 dark:text-amber-400">FIRST PACIFIC PREMIUM RESERVED</span>
                                        <span className="text-[5.5px] border-t border-amber-600 dark:border-amber-505 mt-1 pt-0.5 tracking-wider font-sans uppercase">DEPUTY COMPLIANCE COMPLIANT</span>
                                    </div>
                                </div>
                            )}
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10">
                                <h3 className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <UserCircleIcon className="w-4 h-4"/> From
                                </h3>
                                {isCredit ? (
                                    <div className="space-y-1.5">
                                        <p className="font-bold text-[#1E293B] dark:text-slate-100">{transaction.senderName || transaction.description}</p>
                                        
                                        <div className="pt-1.5 border-t border-slate-200/50 dark:border-white/10">
                                            <p className="text-[9px] uppercase tracking-widest text-[#0F172A] dark:text-white font-bold mb-0.5">Originating Institution</p>
                                            <p className="text-xs font-bold text-slate-750 dark:text-slate-350">
                                                {transaction.senderDetails?.financialInstitution || 'Federal Reserve Clearing House'}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[9px] uppercase tracking-widest text-[#0F172A] dark:text-white font-bold mb-0.5">Reference Tracking ID</p>
                                            <p className="font-mono text-[11px] font-black text-indigo-500 dark:text-indigo-400">
                                                {transaction.settlementDetails?.traceId || `CLR-TRCK-${transaction.id.slice(-8).toUpperCase()}`}
                                            </p>
                                        </div>
                                        
                                        {transaction.senderDetails?.accountNumberMasked && (
                                            <p className="text-xs text-[#0F172A] dark:text-white font-mono pt-1">
                                                Acct: {transaction.senderDetails.accountNumberMasked}
                                            </p>
                                        )}
                                        <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wider pt-1.5">
                                            Verified External Inbound Settlement
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="font-bold text-[#1E293B] dark:text-slate-100">{userProfile?.name || USER_PROFILE.name}</p>
                                        <p className="text-sm text-[#0F172A] dark:text-white mt-0.5">{account?.nickname || 'Checking Account'} •••• {account?.accountNumber.slice(-4)}</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10">
                                <h3 className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <UserCircleIcon className="w-4 h-4"/> To
                                </h3>
                                {isCredit ? (
                                    <div>
                                        <p className="font-bold text-[#1E293B] dark:text-slate-100">{userProfile?.name || USER_PROFILE.name}</p>
                                        <p className="text-sm text-[#0F172A] dark:text-white mt-0.5">{account?.nickname} •••• {account?.accountNumber.slice(-4)}</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="font-bold text-[#1E293B] dark:text-slate-100">{transaction.recipient.fullName}</p>
                                        <p className="text-sm text-[#0F172A] dark:text-white mt-0.5">{transaction.recipient.bankName} •••• {transaction.recipient.accountNumber.slice(-4)}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Financial Details */}
                        <div>
                            <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-4">Transaction Details</h3>
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-white/10">
                                <DetailRow label="Principal Amount" value={formatCurrency(transaction.sendAmount, 'USD')} />
                                {!isCredit && <DetailRow label="Service Fee" value={formatCurrency(transaction.fee, 'USD')} />}
                                {transaction.complianceFee !== undefined && transaction.complianceFee > 0 && (
                                    <DetailRow 
                                        label="Compliance Halt Fee" 
                                        value={formatCurrency(transaction.complianceFee, 'USD')} 
                                        className="text-indigo-500 dark:text-indigo-400 font-bold"
                                    />
                                )}
                                {!isCredit && transaction.exchangeRate !== 1 && (
                                    <DetailRow 
                                        label="Exchange Rate" 
                                        value={`1 USD = ${transaction.exchangeRate.toFixed(4)} ${transaction.receiveCurrency}`} 
                                    />
                                )}
                                {!isCredit && (
                                    <DetailRow 
                                        label="Recipient Received" 
                                        value={formatCurrency(transaction.receiveAmount, transaction.receiveCurrency)} 
                                        className="border-none pt-3 mt-1"
                                    />
                                )}
                                <DetailRow label="Category" value={transaction.purpose || 'General'} />
                                <DetailRow 
                                    label="AI Auto-Category" 
                                    value={
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-bold uppercase tracking-widest text-[10px]">
                                                ✨ {transaction.category || 'Categorizing...'}
                                            </span>
                                            <button
                                                type="button"
                                                disabled={isAutoCategorizing}
                                                onClick={async () => {
                                                    setIsAutoCategorizing(true);
                                                    try {
                                                        const res = await autoCategorizeTransactionWithGemini(
                                                            transaction.description,
                                                            transaction.sendAmount,
                                                            transaction.recipient?.bankName || transaction.recipient?.fullName
                                                        );
                                                        if (res && !res.isError) {
                                                            transaction.category = res.category;
                                                            transaction.tags = res.tags;
                                                            transaction.confidence = res.confidence;
                                                            await db.saveTransaction(transaction);
                                                            if (onUpdateTags) onUpdateTags(transaction.id, res.tags);
                                                        }
                                                    } catch (err) {
                                                        console.error("Auto categorize failure:", err);
                                                    } finally {
                                                        setIsAutoCategorizing(false);
                                                    }
                                                }}
                                                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer disabled:opacity-70"
                                            >
                                                {isAutoCategorizing ? 'Analyzing...' : 'Re-analyze Gemini'}
                                            </button>
                                        </div>
                                    } 
                                />
                                {transaction.tags && transaction.tags.length > 0 && (
                                    <DetailRow 
                                        label="AI Suggested Tags" 
                                        value={
                                            <div className="flex gap-1.5 flex-wrap justify-end">
                                                {transaction.tags.map(tag => (
                                                    <span key={tag} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-[#0F172A] dark:text-white rounded text-[10px] font-mono tracking-wide">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        } 
                                    />
                                )}
                                {transaction.confidence !== undefined && (
                                    <DetailRow 
                                        label="AI Classification Confidence" 
                                        value={
                                            <span className="font-mono text-xs font-bold text-indigo-400">
                                                {(transaction.confidence * 100).toFixed(0)}%
                                            </span>
                                        } 
                                    />
                                )}
                                <DetailRow label="Reference ID" value={<span className="font-mono text-xs">{transaction.id}</span>} className="border-none" />
                            </div>
                        </div>

                        {/* Settlement Data (New Institutional Section) */}
                        {(transaction.traceId || transaction.correspondentBank || transaction.regulatoryAuthCode || transaction.settlementDetails) && (
                            <div>
                                <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-4 flex items-center gap-2">
                                    <ServerIcon className="w-5 h-5 text-[#0F172A]"/> Settlement & Clearing Ledger
                                </h3>
                                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-white/10">
                                    {(transaction.traceId || transaction.settlementDetails?.traceId) && (
                                        <DetailRow 
                                            label="Clearing IMAD Trace ID" 
                                            value={<span className="font-mono text-xs text-[#1E293B] dark:text-slate-100 font-bold">{transaction.traceId || transaction.settlementDetails?.traceId}</span>} 
                                        />
                                    )}
                                    {transaction.settlementDetails?.uetr && (
                                        <DetailRow 
                                            label="SWIFT End-to-End Reference (UETR)" 
                                            value={<span className="font-mono text-xs text-indigo-500 dark:text-indigo-400 font-bold">{transaction.settlementDetails.uetr}</span>} 
                                        />
                                    )}
                                    {transaction.settlementDetails?.clearingSystemRef && (
                                        <DetailRow 
                                            label="Clearing System Channel" 
                                            value={<span className="font-semibold text-[#0F172A] dark:text-white">{transaction.settlementDetails.clearingSystemRef}</span>} 
                                        />
                                    )}
                                    {transaction.settlementDetails?.valueDate && (
                                        <DetailRow 
                                            label="Interbank Value Date" 
                                            value={<span className="font-mono text-xs text-[#0F172A] dark:text-white font-bold">{new Date(transaction.settlementDetails.valueDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>} 
                                        />
                                    )}
                                    {transaction.correspondentBank && <DetailRow label="Intermediary Bank" value={transaction.correspondentBank} />}
                                    {transaction.remittanceInformation && <DetailRow label="ISO Remittance Info" value={transaction.remittanceInformation} />}
                                    {transaction.regulatoryAuthCode && (
                                        <DetailRow 
                                            label="Regulatory Auth" 
                                            value={<span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">{transaction.regulatoryAuthCode}</span>} 
                                            className="border-none"
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Interactive Warning banner if transaction is Reversible */}
                        {isReversible && (
                            <div className="bg-rose-500/15 border border-rose-500/30 p-4 rounded-xl flex items-start gap-4">
                                <div className="text-rose-500 mt-0.5">⚡</div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-black text-rose-700 dark:text-rose-400">Institutional Reversal Shield Available</h4>
                                    <p className="text-xs text-rose-600/90 dark:text-rose-350 leading-relaxed font-semibold">
                                        This outbound transfer has not fully settled. You hold clearing jurisdiction privilege to cancel this transfer instantly and execute a complete capital recoil back to your checking account.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Compliance Halt Code Input UI for Locked Transactions */}
                        {(transaction.status === TransactionStatus.AWAITING_PAYMENT_VERIFICATION || transaction.status === TransactionStatus.FLAGGED_AWAITING_CLEARANCE || (transaction as any).status === 'Awaiting Payment Verification' || (transaction as any).status === 'Flagged for Review') && (
                            <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-4 animate-fade-in relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none select-none">
                                    <LockClosedIcon className="w-24 h-24 text-amber-500" />
                                </div>
                                
                                {transaction.status === TransactionStatus.AWAITING_PAYMENT_VERIFICATION || (transaction as any).status === 'Awaiting Payment Verification' ? (
                                    <>
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
                                            <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest font-mono">Sovereign Clearing Escrow Active</h4>
                                        </div>
                                        <p className="text-xs text-[#0F172A] dark:text-white leading-relaxed font-semibold">
                                            {transaction.type === 'credit' 
                                                ? `This incoming credit is currently held in escrow pending routing verification. To verify the transfer and release the net credit of $${(transaction.receiveAmount || transaction.sendAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })} to your checking account, a transit processing fee must be authorized or proof of payment uploaded.`
                                                : `This outbound transfer of $${(transaction.receiveAmount || transaction.sendAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })} is currently held pending security clearance. To complete the transfer to the recipient, a transit processing fee must be authorized or proof of payment uploaded.`
                                            }
                                        </p>
                                        
                                        {unlockSuccess ? (
                                            <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center gap-3">
                                                <CheckCircleIcon className="w-5 h-5 text-emerald-500 animate-bounce animate-pulse" />
                                                <div className="text-xs text-emerald-400 font-bold">
                                                    {transaction.type === 'credit'
                                                        ? `Clearance successful! $${(transaction.receiveAmount || transaction.sendAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })} has been credited to your active portfolio checking balance.`
                                                        : `Clearance successful! The outbound transfer has been released from escrow and finalized.`}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 pt-1">
                                                <div className="bg-slate-100 p-4 rounded-xl border border-black/5 space-y-2">
                                                    <div className="flex justify-between items-center text-[10px] font-mono">
                                                        <span className="text-[#0F172A] font-black uppercase">Clearing Reference ID</span>
                                                        <span className="text-white font-black">{transaction.id.toUpperCase().slice(-12)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] font-mono">
                                                        <span className="text-[#0F172A] font-black uppercase">Secured Gross Transfer</span>
                                                        <span className="text-emerald-400 font-black">${(transaction.receiveAmount || transaction.sendAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] font-mono">
                                                        <span className="text-[#0F172A] font-black uppercase">Federal Clearance Fee</span>
                                                        <span className="text-rose-400 font-black">
                                                            {transaction.complianceFee !== undefined && transaction.complianceFee > 0
                                                                ? formatCurrency(transaction.complianceFee, 'USD')
                                                                : '$35.00'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={handlePayFeeAndCredit}
                                                    disabled={isUnlocking}
                                                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg transition-all disabled:opacity-70 active:scale-[0.98] flex items-center justify-center gap-2"
                                                >
                                                    {isUnlocking ? (
                                                        <>
                                                            <span className="animate-spin h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full"></span>
                                                            <span>Securing Transit Corridor...</span>
                                                        </>
                                                    ) : (
                                                        transaction.type === 'credit' 
                                                            ? 'Pay Routing Fee & Credit Funds' 
                                                            : 'Pay Routing Fee & Release Transfer'
                                                    )}
                                                </button>
                                                {haltCodeError && (
                                                    <p className="text-[10px] text-rose-500 font-bold font-mono uppercase mt-1 text-center">{haltCodeError}</p>
                                                 )}

                                                 {/* Attach Payment Proof Feature */}
                                                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-black/5 space-y-4 text-left dark:bg-slate-900">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <CameraIcon className="w-4 h-4 text-amber-400" />
                                                            <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Attach & Validate Payment Proof</span>
                                                        </div>
                                                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                                            AI Instant Auto-Clear
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-[#0F172A] leading-relaxed font-semibold">
                                                        Upload a receipt screenshot or launch our camera-based document scanner to instantly extract and cross-verify payment proof against transaction metadata.
                                                    </p>

                                                    {/* Prominent Instant AI Camera Document Scanner Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsProofScannerModalOpen(true)}
                                                        className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 hover:from-amber-400 hover:to-emerald-300 text-slate-950 font-black uppercase text-xs tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
                                                    >
                                                        <CameraIcon className="w-4 h-4 text-slate-950 group-hover:scale-110 transition-transform" />
                                                        <span>📷 Instant AI Camera Document Scan & Validate</span>
                                                    </button>

                                                    {proofAttachedBase64 ? (
                                                        <div className="space-y-3">
                                                            <div className="relative aspect-video rounded-lg overflow-hidden border border-black/5 bg-slate-100">
                                                                <img src={proofAttachedBase64} alt="Payment Proof" className="object-contain w-full h-full" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setProofAttachedBase64(null);
                                                                        setProofSourceType(null);
                                                                    }}
                                                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                                                >
                                                                    <XIcon className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                            
                                                            <button
                                                                type="button"
                                                                onClick={handleSubmitProof}
                                                                disabled={isSubmittingProof}
                                                                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase text-[10px] tracking-widest rounded-lg shadow-md transition-all disabled:opacity-70"
                                                            >
                                                                {isSubmittingProof ? 'Transmitting Proof...' : 'Transmit Proof to Admin Desk'}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {isCameraActive ? (
                                                                <div className="space-y-2">
                                                                    <div className="relative aspect-video rounded-lg overflow-hidden border border-amber-500/30 bg-slate-100">
                                                                        <video
                                                                            ref={videoRef}
                                                                            autoPlay
                                                                            playsInline
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={captureSnapshot}
                                                                            className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs tracking-wider uppercase transition-all"
                                                                        >
                                                                            Capture Snapshot
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={stopCamera}
                                                                            className="px-4 py-2 bg-white hover:bg-slate-700 text-[#0F172A] font-bold rounded-lg text-xs tracking-wider uppercase transition-all dark:bg-slate-800"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={startCamera}
                                                                        className="py-3 px-2 border border-black/5 rounded-xl hover:bg-white flex flex-col items-center justify-center gap-1.5 transition-all group active:scale-95 dark:bg-slate-800"
                                                                    >
                                                                        <CameraIcon className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                                                                        <span className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider">Use Camera</span>
                                                                    </button>
                                                                    <label className="py-3 px-2 border border-black/5 rounded-xl hover:bg-white flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group active:scale-95 dark:bg-slate-800">
                                                                        <ArrowDownTrayIcon className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform rotate-180" />
                                                                        <span className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider">Upload File</span>
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            onChange={handleFileUpload}
                                                                            className="hidden"
                                                                        />
                                                                    </label>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {proofSubmitSuccess && (
                                                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] text-emerald-400 font-bold text-center uppercase tracking-wider animate-pulse">
                                                            ✓ Proof uploaded successfully. Compliance officers have been notified.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
                                            <h4 className="text-sm font-black text-amber-500 uppercase tracking-wider">Regulatory Compliance Lock Active</h4>
                                        </div>
                                        <p className="text-xs text-[#0F172A] dark:text-white leading-relaxed font-semibold">
                                            This transfer of <strong className="text-[#0F172A] dark:text-white">${transaction.sendAmount.toLocaleString()}</strong> of international liquidity is currently held in escrow pending manual clearance code authorization. Please insert your official <strong>Compliance Halt Code/Unlock Code</strong> (provided by support services or advisories) below to continue.
                                        </p>
                                        
                                        {unlockSuccess ? (
                                            <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-lg flex items-center gap-3">
                                                <CheckCircleIcon className="w-5 h-5 text-emerald-500 animate-bounce" />
                                                <div className="text-xs text-emerald-400 font-bold">
                                                    Compliance Hold Released. Settlement has cleared successfully!
                                                </div>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleVerifyHaltCode} className="space-y-3 relative">
                                                <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest font-mono">Input Secure Clearance Code</label>
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        value={haltCodeInput}
                                                        onChange={(e) => { setHaltCodeInput(e.target.value.toUpperCase()); setHaltCodeError(''); }}
                                                        placeholder="HALT-XXXXXX"
                                                        className="flex-grow bg-slate-50 border border-black/5 rounded-xl p-3 text-center tracking-widest font-mono font-bold text-white uppercase outline-none focus:border-amber-500 text-sm dark:bg-slate-900"
                                                    />
                                                    <button 
                                                        type="submit"
                                                        disabled={isUnlocking}
                                                        className="px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black uppercase text-[10px] tracking-wider rounded-xl shadow-lg transition-all disabled:opacity-70 active:scale-[0.98]"
                                                    >
                                                        {isUnlocking ? 'Unlocking...' : 'Unlock & Finalize'}
                                                    </button>
                                                </div>
                                                {haltCodeError && (
                                                    <p className="text-[10px] text-rose-500 font-bold font-mono uppercase mt-1">{haltCodeError}</p>
                                                )}
                                            </form>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Additional Information Section */}
                        {(transaction.senderName || displayRecipientAddress || transaction.description || transaction.presetJustification || true) && (
                            <div>
                                <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-4 flex items-center gap-2">
                                    <DocumentCheckIcon className="w-5 h-5 text-[#0F172A]"/> Additional Information
                                </h3>
                                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-white/10 space-y-4">
                                    {transaction.senderName && <DetailRow label="Sender Name" value={transaction.senderName} />}
                                    {displayRecipientAddress && <DetailRow label="Recipient Address" value={displayRecipientAddress} />}
                                    {transaction.description && <DetailRow label="Notes" value={transaction.description} />}
                                    {transaction.presetJustification && (
                                        <DetailRow 
                                            label="Compliance Justification" 
                                            value={<span className="text-amber-500 dark:text-amber-400 font-semibold">{transaction.presetJustification}</span>} 
                                        />
                                    )}
                                    <div className="pt-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">
                                                Memo / Tax Note
                                            </label>
                                        </div>
                                        <textarea
                                            value={localMemo}
                                            onChange={(e) => setLocalMemo(e.target.value)}
                                            onBlur={handleSaveMemo}
                                            placeholder="Add personal comments or tax-related memos..."
                                            className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white border border-slate-200 dark:border-white/10 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm resize-none h-20 placeholder:text-[#0F172A]"
                                        />
                                        <p className="text-[10px] text-[#0F172A] mt-1 mb-4">Changes are saved automatically.</p>

                                        {/* Tagging System UI */}
                                        <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest block">
                                                    Transaction Labels & Custom Tags
                                                </label>
                                                <span className="text-[10px] font-mono text-[#0F172A]">
                                                    {(transaction.tags || []).length} active tags
                                                </span>
                                            </div>

                                            {/* Current Active Tags */}
                                            <div className="flex flex-wrap gap-2">
                                                {(transaction.tags || []).map(tag => (
                                                    <span
                                                        key={tag}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold font-mono bg-indigo-600 text-white shadow-sm border border-indigo-500"
                                                    >
                                                        #{tag}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveTag(tag)}
                                                            className="hover:text-rose-300 font-black ml-0.5 text-sm"
                                                            title="Remove Tag"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                                {(!transaction.tags || transaction.tags.length === 0) && (
                                                    <p className="text-xs text-[#0F172A] italic">No custom tags attached yet.</p>
                                                )}
                                            </div>

                                            {/* Add Custom Tag Form */}
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newCustomTag}
                                                    onChange={(e) => setNewCustomTag(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleAddCustomTag();
                                                        }
                                                    }}
                                                    placeholder="Type custom tag name (e.g. Invoice-2026)..."
                                                    className="flex-grow px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono text-[#0F172A] dark:text-white outline-none focus:border-indigo-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddCustomTag}
                                                    disabled={!newCustomTag.trim()}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-40 transition-all shrink-0"
                                                >
                                                    + Add Tag
                                                </button>
                                            </div>

                                            {/* Preset Tags Suggestions */}
                                            <div className="pt-2 border-t border-dashed border-slate-200 dark:border-white/10">
                                                <span className="text-[9px] font-bold text-[#0F172A] uppercase tracking-widest block mb-1.5">
                                                    Quick Preset Labels:
                                                </span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {['Tax-Deductible', 'Business Expense', 'Personal', 'Medical', 'Travel', 'Utilities', 'Entertainment', 'Payroll'].map(presetTag => {
                                                        const hasTag = (transaction.tags || []).includes(presetTag);
                                                        return (
                                                            <button
                                                                key={presetTag}
                                                                type="button"
                                                                onClick={() => {
                                                                    if (!onUpdateTags) return;
                                                                    const currentTags = transaction.tags || [];
                                                                    const newTags = hasTag
                                                                        ? currentTags.filter(t => t !== presetTag)
                                                                        : [...currentTags, presetTag];
                                                                    onUpdateTags(transaction.id, newTags);
                                                                }}
                                                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono border transition-all ${hasTag ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500' : 'bg-slate-100 dark:bg-slate-900 text-[#0F172A] dark:text-white border-slate-200 dark:border-white/10 hover:border-slate-400 dark:hover:border-slate-600'}`}
                                                            >
                                                                {hasTag ? `✓ #${presetTag}` : `+ #${presetTag}`}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Timeline */}
                        <div>
                            <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-2">Audit Log</h3>
                            <StatusTimeline transaction={transaction} />
                        </div>

                    </div>
                )}

                {reversalStep === 1 && (
                    <form onSubmit={handleConfirmPin} className="p-8 space-y-6 flex-grow overflow-y-auto w-full max-w-md mx-auto flex flex-col justify-center">
                        <div className="text-center space-y-2">
                            <div className="mx-auto w-12 h-12 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full flex items-center justify-center text-xl shadow-inner">
                                🛡️
                            </div>
                            <h3 className="text-lg font-black text-[#0F172A] dark:text-white">Active Clearance Passcode</h3>
                            <p className="text-xs text-[#0F172A] leading-relaxed font-semibold">
                                Please type your Account Authority Passcode or master profile security signature to proceed with tracing, seizing, and recalling checkout capital.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest block font-mono">Profile Security Signature</label>
                            <input 
                                type="password" 
                                autoFocus
                                value={pinInput}
                                onChange={(e) => { setPinInput(e.target.value); setPinError(''); }}
                                placeholder="••••"
                                maxLength={8}
                                className="w-full text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/15 rounded-xl py-3 text-xl font-bold font-mono tracking-widest outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-[#0F172A] dark:text-white"
                            />
                            {pinError && <p className="text-xs font-bold text-rose-500 font-mono mt-1 text-center">{pinError}</p>}
                        </div>

                        <div className="flex gap-3 justify-end pt-4 bg-transparent border-none">
                            <button 
                                type="button"
                                onClick={() => setReversalStep(0)}
                                className="px-5 py-3 rounded-xl hover:bg-slate-150 dark:hover:bg-white text-[#0F172A] dark:text-white font-bold text-xs uppercase tracking-wider transition-colors dark:bg-slate-800"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-500/20 transition-all active:scale-[0.98]"
                            >
                                Decrypt & Seize Funds
                            </button>
                        </div>
                    </form>
                )}

                {reversalStep === 2 && (
                    <div className="p-8 space-y-6 flex-grow flex flex-col justify-center items-center">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-4 border-rose-500/25 border-t-rose-500 animate-spin" />
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
                                <span className="text-[10px] font-mono font-black text-rose-500">RECOIL</span>
                            </div>
                        </div>

                        <div className="text-center space-y-1">
                            <h3 className="text-base font-black text-slate-850 dark:text-white uppercase tracking-wider">clearing batch ledger rollback</h3>
                            <p className="text-xs text-rose-505 dark:text-rose-400 font-mono">Transmission: Federal Reserve Clearing Intracom-3...</p>
                        </div>

                        <div className="w-full max-w-md bg-slate-100 border border-slate-200 dark:border-white/10 font-mono text-[9px] text-emerald-400 p-4 rounded-xl shadow-inner space-y-1 select-all h-[150px] overflow-y-auto">
                            <div className="text-[#0F172A] mb-1 border-b border-slate-200 dark:border-white/10 pb-1 font-black uppercase tracking-wider text-[8px]">
                                &gt; SYSCON_ROLLBACK_ENGINE --EXEC-TRUNC
                            </div>
                            {progressLogs.map((log, i) => (
                                <div key={i} className="flex gap-1 items-start">
                                    <span className="text-rose-500 shrink-0">&gt;</span>
                                    <span>{log}</span>
                                </div>
                            ))}
                            <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden mt-3 dark:bg-slate-900">
                                <div 
                                    className="bg-rose-500 h-full rounded-full transition-all duration-300"
                                    style={{ width: `${currentPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {reversalStep === 3 && (
                    <div className="p-8 space-y-6 flex-grow flex flex-col justify-center items-center text-center animate-fade-in">
                        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 rounded-full flex items-center justify-center text-3xl shadow-inner animate-bounce">
                            ✓
                        </div>
                        <div className="space-y-2 max-w-sm">
                            <h3 className="text-xl font-black text-slate-850 dark:text-white uppercase tracking-wider">Ledger Reversal Cleared</h3>
                            <p className="text-xs text-[#0F172A] font-semibold leading-relaxed">
                                Our real-time reconciliation controller successfully intercepted and voided ACH Transfer Reference <span className="font-mono text-rose-500">CLR-TRCK-{transaction.id.slice(-8).toUpperCase()}</span>.
                            </p>
                            <p className="text-xs text-emerald-500 font-bold">
                                Principal amount of {formatCurrency(totalAmount, 'USD')} has been credited back to your account balance successfully!
                            </p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="px-8 py-3 bg-slate-50 hover:bg-slate-100 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-[0.98] dark:bg-slate-900"
                        >
                            Return to Ledger
                        </button>
                    </div>
                )}

                {reversalStep === 4 && (
                    <div className="p-8 space-y-6 flex-grow flex flex-col justify-center items-center text-center animate-fade-in">
                        <div className="w-16 h-16 bg-amber-500/10 text-amber-500 border border-amber-500/25 rounded-full flex items-center justify-center text-3xl shadow-inner animate-pulse">
                            <ShieldCheckIcon className="w-8 h-8" />
                        </div>
                        <div className="space-y-2 max-w-sm">
                            <h3 className="text-xl font-black text-slate-850 dark:text-white uppercase tracking-wider">Recall Secure Protocol Initiated</h3>
                            <p className="text-xs text-[#0F172A] font-semibold leading-relaxed">
                                An urgent block has been placed on ACH Transfer Reference <span className="font-mono text-amber-500">CLR-TRCK-{transaction.id.slice(-8).toUpperCase()}</span>.
                            </p>
                            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mt-4">
                                Our compliance and operations team has been notified.
                            </p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="px-8 py-3 bg-slate-50 hover:bg-slate-100 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-[0.98] dark:bg-slate-900"
                        >
                            Understood
                        </button>
                    </div>
                )}

                {/* Footer Actions */}
                {reversalStep === 0 && (
                    <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 flex flex-wrap gap-2.5 justify-between items-center">
                        <div className="flex gap-2">
                            {isReversible && (
                                <button 
                                    onClick={() => setReversalStep(1)}
                                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-black text-rose-500 border border-rose-500/30 hover:border-rose-500/60 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl transition-all shadow-md tracking-wider uppercase"
                                >
                                    <span>⚡ Immediate Reversal</span>
                                </button>
                            )}
                            {isReversible && (
                                <button 
                                    onClick={() => {
                                        socket.emit('user:pending_intervention', {
                                            txId: transaction.id,
                                            type: 'URGENT RECALL',
                                            status: 'Recall Intervention Requested',
                                            name: userProfile?.name || USER_PROFILE.name || 'User',
                                            email: userProfile?.email || USER_PROFILE.email || 'user@email.com',
                                            recipientName: entityName || 'Unknown',
                                            amount: totalAmount,
                                            currency: 'USD',
                                        });
                                        setReversalStep(4);
                                    }}
                                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-black text-amber-500 border border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5 hover:bg-amber-500/10 rounded-xl transition-all shadow-md tracking-wider uppercase"
                                >
                                    <span>Initiate Recall</span>
                                </button>
                            )}
                        </div>

                        <div className="flex gap-2 shrink-0">
                            <button 
                                onClick={() => onContactSupport(transaction.id)}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-[#0F172A] dark:text-white hover:bg-slate-200 dark:hover:bg-slate-100 dark:bg-slate-700 rounded-lg transition-colors"
                            >
                                <QuestionMarkCircleIcon className="w-5 h-5" />
                                <span>Support</span>
                            </button>
                            {!isCredit && (
                                <button 
                                    onClick={() => onRepeatTransaction(transaction)}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-[#0F172A] dark:text-white hover:bg-slate-200 dark:hover:bg-slate-100 dark:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <ArrowPathIcon className="w-5 h-5" />
                                    <span>Repeat</span>
                                </button>
                            )}
                            <button 
                                onClick={() => onDownloadReceipt(transaction)}
                                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-[#0F172A] dark:text-white bg-primary hover:bg-primary-600 rounded-lg shadow-md transition-all transform active:scale-[0.98]"
                            >
                                <ArrowDownTrayIcon className="w-5 h-5" />
                                <span>Download PDF Receipt</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <PaymentProofScannerModal
                isOpen={isProofScannerModalOpen}
                onClose={() => setIsProofScannerModalOpen(false)}
                transaction={transaction}
                onVerificationSuccess={(updatedTx) => {
                    setIsProofScannerModalOpen(false);
                    setUnlockSuccess(true);
                    if (updatedTx.paymentProof) {
                        setProofAttachedBase64(updatedTx.paymentProof);
                    }
                }}
            />
        </div>
    );
};
