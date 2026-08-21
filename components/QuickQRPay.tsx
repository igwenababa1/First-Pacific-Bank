import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { Download } from 'lucide-react';
import { 
    QrCodeIcon, 
    CheckCircleIcon, 
    ArrowPathIcon, 
    SpinnerIcon, 
    WalletIcon, 
    XIcon, 
    ArrowsRightLeftIcon,
    ChevronRightIcon,
    UserCircleIcon,
    CopyIcon,
    FingerprintIcon,
    LockClosedIcon,
    ShieldCheckIcon,
    ExclamationCircleIcon
} from './Icons.tsx';
import { QrScanner } from './QrScanner.tsx';
import { QrSuccessOverlay } from './QrSuccessOverlay';
import { QrContactPrompt } from './QrContactPrompt';
import { Account, AccountType, Recipient } from '../types';
import { db } from '../services/database';

interface QuickQRPayProps {
    accounts: Account[];
    createTransaction: (tx: any) => Promise<any>;
    userProfile: {
        name: string;
        email: string;
        phone?: string;
    };
    addNotification: (type: any, title: string, message: string, linkTo?: any, metadata?: any) => void;
    onContactSupport?: (transactionIdOrContext?: string) => void;
    recipients?: Recipient[];
    onAddRecipient?: (recipient: Recipient) => void;
    onDeleteRecipient?: (id: string) => void;
}

interface P2PPayload {
    type: 'p2p';
    senderAccountType?: string;
    recipientId: string;
    recipientName: string;
    recipientEmail?: string;
    accountNumber: string;
    routingNumber: string;
    bankName: string;
    amount?: number;
    description: string;
}

const DEMO_PEER_CODES = [
    {
        name: "Alex Mercer (Elite Web3 Peer)",
        avatar: "AM",
        color: "from-purple-500 to-indigo-500",
        amount: 45.00,
        description: "Rent splitting & server sync node",
        accountNumber: "FPB-P2P-882211",
        routingNumber: "021000021",
        bankName: "First Pacific Labs Direct Node"
    },
    {
        name: "Sovereign Brews Co.",
        avatar: "SB",
        color: "from-amber-500 to-orange-500",
        amount: 8.50,
        description: "Craft Espresso Beans & Roast Clearance",
        accountNumber: "FPB-MERCH-40012",
        routingNumber: "021000021",
        bankName: "First Pacific Merchant Ledger"
    },
    {
        name: "Esther Greenwood (Co-founder)",
        avatar: "EG",
        color: "from-teal-500 to-emerald-500",
        amount: 320.00,
        description: "Incubator Shared Retainer Sync",
        accountNumber: "FPB-P2P-990033",
        routingNumber: "021000021",
        bankName: "First Pacific Private Wealth Desk"
    }
];

export const QuickQRPay: React.FC<QuickQRPayProps> = ({ 
    accounts, 
    createTransaction, 
    userProfile, 
    addNotification,
    onContactSupport,
    recipients = [],
    onAddRecipient,
    onDeleteRecipient
}) => {
    const navigate = useNavigate();

    const handleReportIssue = (extraContext?: string) => {
        const contextStr = extraContext || (p2pPayload 
            ? `QR Pay issue with ${p2pPayload.recipientName} (${p2pPayload.accountNumber || 'P2P'})`
            : 'QR Scanner Interface Issue');
        if (onContactSupport) {
            onContactSupport(contextStr);
        } else {
            navigate('/support');
        }
    };
    
    // Primary Tab Selection
    const [activeTab, setActiveTab] = useState<'receive' | 'send'>('send');
    
    // state for P2P Generation (RECEIVE FUNDS)
    const [receiveAccount, setReceiveAccount] = useState<Account>(accounts[0] || {} as Account);
    const [receiveAmount, setReceiveAmount] = useState<string>('');
    const [receiveDesc, setReceiveDesc] = useState<string>('P2P Instant Request');
    const [generatorCopied, setGeneratorCopied] = useState(false);
    const [showQrSuccessModal, setShowQrSuccessModal] = useState(false);

    // state for P2P Clearance (SEND FUNDS)
    const [isScanning, setIsScanning] = useState(false);
    const [p2pPayload, setP2PPayload] = useState<P2PPayload | null>(null);
    const [selectedDebtorAccount, setSelectedDebtorAccount] = useState<Account>(accounts[0] || {} as Account);
    const [clearanceStep, setClearanceStep] = useState<'idle' | 'input' | 'processing' | 'success' | 'error'>('idle');
    const [clearanceMessage, setClearanceMessage] = useState<string>('');
    const [blockchainLogs, setBlockchainLogs] = useState<string[]>([]);
    const [simulationTarget, setSimulationTarget] = useState<string>('');
    
    // Raw JSON input fallback
    const [rawPayloadInput, setRawPayloadInput] = useState('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Filter accounts to active ones with positive balances
    const internalAccounts = accounts.filter(acc => acc.type !== AccountType.EXTERNAL_LINKED);

    useEffect(() => {
        if (accounts.length > 0) {
            if (!receiveAccount.id) setReceiveAccount(accounts[0]);
            if (!selectedDebtorAccount.id) setSelectedDebtorAccount(accounts[0]);
        }
    }, [accounts, receiveAccount.id, selectedDebtorAccount.id]);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Construct request QR data
    const generatedQRString = JSON.stringify({
        type: 'p2p',
        recipientId: 'user_active_' + userProfile.email,
        recipientName: userProfile.name,
        recipientEmail: userProfile.email,
        accountNumber: receiveAccount.accountNumber,
        routingNumber: receiveAccount.routingNumber || '021000021',
        bankName: 'First Pacific Bank Credit Union',
        amount: receiveAmount ? parseFloat(receiveAmount) : undefined,
        description: receiveDesc
    });

    const triggerCopyKey = () => {
        navigator.clipboard.writeText(generatedQRString);
        setGeneratorCopied(true);
        setShowQrSuccessModal(true);
        showToast("QR Payment Payload Copied & Verified!");
        setTimeout(() => setGeneratorCopied(false), 2000);
    };

    const handleDownloadQRCard = async () => {
        const cardElement = document.getElementById('qr-share-card');
        if (!cardElement) {
            showToast("Error locating QR Card element");
            return;
        }
        
        try {
            showToast("Generating dynamic shareable image...");
            // Use html2canvas to capture the styled card
            const canvas = await html2canvas(cardElement, {
                backgroundColor: '#0b101c', // Match the right container bg
                scale: 3, // Very sharp 3x scale resolution
                logging: false,
                useCORS: true
            });
            
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `${userProfile.name.replace(/\s+/g, '_')}_FPB_QR_Deposit.png`;
            link.href = dataUrl;
            link.click();
            showToast("P2P QR Deposit Card downloaded!");
        } catch (err) {
            console.error("Failed to generate shareable QR card image:", err);
            showToast("Failed to generate QR image. Please try again.");
        }
    };

    // Analyze scanned data
    const handleQrScanComplete = (scannedData: string) => {
        try {
            let data: P2PPayload;
            if (scannedData.startsWith('{')) {
                data = JSON.parse(scannedData) as P2PPayload;
            } else {
                // Fallback parsing simple formats or plain values
                const parts = scannedData.split(' // ');
                data = {
                    type: 'p2p',
                    recipientId: 'peer_' + Date.now(),
                    recipientName: parts[0] || "External Sovereign Account",
                    accountNumber: parts[1] || "ACC-" + Math.floor(Math.random() * 900000 + 100000),
                    routingNumber: "021000021",
                    bankName: "Global Settlement Network",
                    amount: parts[2] ? parseFloat(parts[2]) : undefined,
                    description: parts[3] || "Immediate Peer Exchange"
                };
            }

            if (data.type === 'p2p' || !data.type) {
                // Pre-fill fields and prompt user
                setP2PPayload(data);
                setIsScanning(false);
                setClearanceStep('input');
                showToast(`Scanned payment request from ${data.recipientName}`);
            } else {
                throw new Error("Invalid payload type");
            }
        } catch (e) {
            console.error("QR Parse failure", e);
            showToast("Invalid QR format. Use peer-to-peer codes and try again.");
        }
    };

    const handleInjectPreset = (preset: typeof DEMO_PEER_CODES[0]) => {
        const data: P2PPayload = {
            type: 'p2p',
            recipientId: 'demo_' + preset.avatar,
            recipientName: preset.name,
            accountNumber: preset.accountNumber,
            routingNumber: preset.routingNumber,
            bankName: preset.bankName,
            amount: preset.amount,
            description: preset.description
        };
        setP2PPayload(data);
        setIsScanning(false);
        setClearanceStep('input');
        showToast(`Loaded payment request for ${preset.name}`);
    };

    const handleInjectCustom = (e: React.FormEvent) => {
        e.preventDefault();
        const amt = parseFloat(simulationTarget);
        if (isNaN(amt) || amt <= 0) {
            showToast("Please enter a valid simulated amount");
            return;
        }

        const data: P2PPayload = {
            type: 'p2p',
            recipientId: 'simulated_peer_' + Date.now().toString().slice(-4),
            recipientName: "Custom Simulated Receiver",
            accountNumber: "FPB-P2P-" + Math.floor(100000 + Math.random() * 900000),
            routingNumber: "021000021",
            bankName: "First Pacific Interledger Desk",
            amount: amt,
            description: "Simulated Sandboxed Peer Sync"
        };
        setP2PPayload(data);
        setClearanceStep('input');
        showToast("Simulated payload injected!");
    };

    // Execute direct transfer authorization sequence
    const handleClearTransfer = async () => {
        if (!p2pPayload) return;
        const sendAmt = p2pPayload.amount || 0;

        if (sendAmt <= 0) {
            showToast("Please specify a valid payment amount first.");
            return;
        }

        if (selectedDebtorAccount.balance < sendAmt) {
            setClearanceMessage(`Insufficient funds in selected account (${selectedDebtorAccount.nickname || selectedDebtorAccount.type})`);
            setClearanceStep('error');
            return;
        }

        // Start premium cryptographic ledger workflow
        setClearanceStep('processing');
        setBlockchainLogs([]);
        
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

        try {
            const logs = [
                "🔐 [SEC_INIT] Establishing secure TLS 1.3 cryptographic handshake with peer...",
                "🔑 [SIGN_AUTH] Validating peer's asymmetric public keys and routing status...",
                "🛡️ [LEDGER_LOCK] Parsing Double-Spend Prevention shields dynamically...",
                "🌐 [CONSENSUS] Reaching First Pacific real-time peer authorization consensus...",
                "🚀 [SETTLE] Committing single-hop zero-gas liquidity clearance..."
            ];

            for (let i = 0; i < logs.length; i++) {
                setBlockchainLogs(prev => [...prev, logs[i]]);
                await delay(800);
            }

            // Create actual transaction object
            const paymentTx = {
                accountId: selectedDebtorAccount.id,
                recipient: {
                    fullName: p2pPayload.recipientName,
                    accountNumber: p2pPayload.accountNumber,
                    routingNumber: p2pPayload.routingNumber,
                    bankName: p2pPayload.bankName,
                },
                sendAmount: sendAmt,
                receiveAmount: sendAmt,
                fee: 0,
                exchangeRate: 1,
                estimatedArrival: new Date(),
                description: `P2P Direct Swap // ${p2pPayload.description}`,
                category: 'Transfer'
            };

            const result = await createTransaction(paymentTx);
            if (result) {
                // Auto-save recipient to user contacts if not already present
                try {
                    const existing = recipients.find(r => 
                        (r.accountNumber && r.accountNumber.includes(p2pPayload.accountNumber)) ||
                        (r.realDetails?.accountNumber && r.realDetails.accountNumber.includes(p2pPayload.accountNumber)) ||
                        r.fullName?.toLowerCase().trim() === p2pPayload.recipientName.toLowerCase().trim()
                    );
                    if (!existing) {
                        const newRec: Recipient = {
                            id: `rec_qr_${Date.now()}`,
                            userId: db.getCurrentUserEmail() || 'user@firstpacific.com',
                            fullName: p2pPayload.recipientName,
                            bankName: p2pPayload.bankName || 'First Pacific Clearing Node',
                            accountNumber: p2pPayload.accountNumber,
                            country: { code: 'US', name: 'United States', currency: 'USD', symbol: '$' },
                            realDetails: {
                                accountNumber: p2pPayload.accountNumber,
                                routingNumber: p2pPayload.routingNumber || '021000021',
                                swiftBic: 'FPBUS33'
                            },
                            recipientType: 'bank',
                            category: 'Business',
                            trustScore: 99,
                            lastPaymentDate: new Date(),
                            email: p2pPayload.recipientEmail
                        };
                        await db.saveRecipient(newRec);
                        if (onAddRecipient) {
                            onAddRecipient(newRec);
                        }
                    } else {
                        await db.updateRecipient(existing.id, { lastPaymentDate: new Date() });
                    }
                } catch (recErr) {
                    console.warn('[QuickQRPay] Recipient auto-save note:', recErr);
                }

                setClearanceStep('success');
                addNotification(
                    'transfer' as any,
                    '⚡ P2P QR Pay Settlement Succeeded',
                    `Direct clearance of $${sendAmt.toFixed(2)} dispatched securely to ${p2pPayload.recipientName}.`,
                    undefined,
                    {
                        isQrPay: true,
                        merchantName: p2pPayload.recipientName,
                        amount: sendAmt,
                        date: new Date().toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }),
                        transactionId: result.id || `TXN-${Math.floor(Math.random() * 900000 + 100000)}`
                    }
                );
            } else {
                throw new Error("Local engine declined payment transaction.");
            }

        } catch (err: any) {
            console.error("Direct payment sync error", err);
            setClearanceMessage(err.message || "Cryptographic routing or balance checkout failed.");
            setClearanceStep('error');
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-24">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tight uppercase flex items-center gap-3">
                        <span className="p-2 bg-primary/10 rounded-2xl border border-primary/20">
                            <QrCodeIcon className="w-8 h-8 text-primary animate-pulse" />
                        </span>
                        Quick QR Pay
                    </h1>
                    <p className="text-sm text-[#0F172A] dark:text-white mt-2 font-bold">
                        Instant zero-latency peer-to-peer settlement via decentralized direct ledgers.
                    </p>
                </div>
                
                {/* Secondary Actions */}
                <div className="flex gap-2.5 items-center">
                    <button 
                        onClick={() => handleReportIssue()}
                        className="px-4 py-3 text-xs font-black uppercase tracking-wider text-amber-500 bg-amber-500 border border-amber-500/30 rounded-2xl hover:bg-amber-500 transition-all flex items-center gap-2"
                        title="Report issue with QR transaction"
                    >
                        <ExclamationCircleIcon className="w-4 h-4 text-amber-500" />
                        Report Issue
                    </button>
                    <button 
                        onClick={() => navigate('/history')}
                        className="px-5 py-3 text-xs font-black uppercase tracking-wider text-[#0F172A] dark:text-[#1E293B] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-primary/30 transition-all shadow-sm"
                    >
                        Ledger History
                    </button>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="px-5 py-3 text-xs font-black uppercase tracking-wider bg-primary hover:bg-primary-hover text-slate-950 rounded-2xl transition-all shadow-md shadow-primary/10"
                    >
                        Terminal Dashboard
                    </button>
                </div>
            </div>

            {/* Custom Interactive Toasts */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.95 }}
                        className="fixed bottom-8 right-8 z-[200] max-w-sm px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-primary/40 rounded-3xl shadow-[0_4px_30px_rgba(14,197,242,0.15)] flex items-center gap-3.5 "
                    >
                        <div className="p-1 bg-primary/20 rounded-lg border border-primary/30 text-primary">
                            <CheckCircleIcon className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-semibold text-[#1E293B]">{toastMessage}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mode Switcher Tabs */}
            <div className="flex justify-center">
                <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-1.5 rounded-2xl inline-flex gap-1.5 shadow-inner">
                    <button 
                        onClick={() => { setActiveTab('send'); setClearanceStep('idle'); }}
                        className={`px-8 py-3.5 rounded-xl xs:text-xs text-sm font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2.5 ${
                            activeTab === 'send' 
                            ? 'bg-[#0b101c] dark:bg-slate-900 text-primary dark:text-white border border-slate-200 dark:border-white/10 shadow-md shadow-black/10' 
                            : 'text-[#0F172A] dark:text-white hover:text-[#1E293B] dark:hover:text-[#1E293B]'
                        }`}
                    >
                        <UserCircleIcon className="w-4 h-4" />
                        Scan & Pay Peer
                    </button>
                    <button 
                        onClick={() => setActiveTab('receive')}
                        className={`px-8 py-3.5 rounded-xl xs:text-xs text-sm font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2.5 ${
                            activeTab === 'receive' 
                            ? 'bg-[#0b101c] dark:bg-slate-900 text-primary dark:text-white border border-slate-200 dark:border-white/10 shadow-md shadow-black/10' 
                            : 'text-[#0F172A] dark:text-white hover:text-[#1E293B] dark:hover:text-[#1E293B]'
                        }`}
                    >
                        <QrCodeIcon className="w-4 h-4" />
                        My P2P Code (Receive)
                    </button>
                </div>
            </div>

            {/* Central Workstations */}
            <div className="grid grid-cols-1 gap-8">
                
                {activeTab === 'receive' ? (
                    // Workstation 1: RECEIVE PAYMENT CODE GENERATOR
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
                    >
                        <div className="lg:col-span-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-xl flex flex-col justify-between">
                            <div>
                                <h3 className="text-xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight mb-2">Create Payment Request QR</h3>
                                <p className="text-sm text-[#0F172A] dark:text-white">Configure parameters to live-generate an addressable P2P ledger QR code.</p>
                            </div>

                            <div className="space-y-4">
                                {/* Receiving Account Picker */}
                                <div>
                                    <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2 flex justify-between">
                                        <span>RECEIVING ACCOUNT</span>
                                        <span className="text-[#0F172A] dark:text-white font-mono">Available Liquidity</span>
                                    </label>
                                    <select 
                                        value={receiveAccount.id} 
                                        onChange={(e) => setReceiveAccount(internalAccounts.find(a => a.id === e.target.value) || internalAccounts[0])}
                                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-sm text-[#0F172A] dark:text-white outline-none focus:border-primary/50 transition-colors"
                                    >
                                        {internalAccounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.nickname || acc.type} (****{acc.accountNumber.slice(-4)}) — {acc.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Custom Requested Amount */}
                                <div>
                                    <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2 flex justify-between">
                                        <span>REQUEST BUDGET (USD)</span>
                                        <span className="text-[#0F172A] font-mono">Optional</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#0F172A] text-sm font-bold">$</span>
                                        <input 
                                            type="number"
                                            placeholder="e.g. 50.00 (leave blank for donor's choice)"
                                            value={receiveAmount}
                                            onChange={(e) => setReceiveAmount(e.target.value)}
                                            className="w-full pl-9 pr-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-sm text-[#0F172A] dark:text-white outline-none focus:border-primary/50 transition-colors font-mono"
                                        />
                                    </div>
                                    
                                    {/* Fast Amount Presets */}
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {['10', '25', '50', '100', '250', '500'].map(val => (
                                            <button 
                                                key={val}
                                                onClick={() => setReceiveAmount(val)}
                                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                                                    receiveAmount === val 
                                                    ? 'bg-primary/20 border-primary text-primary' 
                                                    : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-white text-[#0F172A] dark:text-white border-slate-200 dark:border-white/10'
                                                }`}
                                            >
                                                + ${val}
                                            </button>
                                        ))}
                                        {receiveAmount && (
                                            <button 
                                                onClick={() => setReceiveAmount('')}
                                                className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-red-500 bg-red-500 border border-red-500/20 hover:bg-red-500 transition-all"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Custom Note Description */}
                                <div>
                                    <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2">LEDGER MEMO / REASON</label>
                                    <input 
                                        type="text"
                                        value={receiveDesc}
                                        onChange={(e) => setReceiveDesc(e.target.value)}
                                        placeholder="e.g. Office Dinner Split"
                                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-sm text-[#0F172A] dark:text-white outline-none focus:border-primary/50 transition-colors"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="p-4 primary- border primary- rounded-2xl flex gap-3 mt-6">
                                <ShieldCheckIcon className="w-5 h-5 primary- shrink-0 mt-0.5" />
                                <p className="text-xs text-[#0F172A] leading-relaxed">
                                    This QR code encodes your identity hash and securely references ledger endpoints securely. No banking keys are exposed.
                                </p>
                            </div>
                        </div>

                        {/* Right Preview Card */}
                        <div className="lg:col-span-5 flex flex-col items-center justify-center p-2">
                            {/* Capturable QR Share Card */}
                            <div 
                                id="qr-share-card" 
                                className="relative p-6 bg-slate-100 border border-slate-200 rounded-[2.5rem] flex flex-col items-center space-y-6 w-full max-w-[340px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center overflow-hidden"
                            >
                                {/* Background glowing gradients */}
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500 rounded-full blur-3xl pointer-events-none" />
                                
                                {/* Card Header */}
                                <div className="w-full border-b border-black/5 pb-4 flex items-center justify-between z-10">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-primary/20 rounded-xl border border-primary/30">
                                            <QrCodeIcon className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white">First Pacific Bank</span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[8px] font-mono font-black text-emerald-400 bg-emerald-400 border border-emerald-400/20 uppercase tracking-widest">
                                        SECURE DEPOSIT
                                    </span>
                                </div>

                                {/* User Details */}
                                <div className="z-10">
                                    <h4 className="text-base font-black text-white leading-tight uppercase">{userProfile.name}</h4>
                                    <p className="text-[10px] text-[#0F172A] font-semibold mt-1 uppercase tracking-widest">Instant Peer Clearing Node</p>
                                </div>

                                {/* QR Render Frame */}
                                <div className="relative p-4 bg-white rounded-3xl max-w-[200px] aspect-square flex items-center justify-center shadow-lg border border-white/15 z-10 dark:bg-slate-800">
                                    <QRCodeSVG 
                                        value={generatedQRString}
                                        size={160}
                                        level="H"
                                        includeMargin={false}
                                    />
                                    {/* Overlay Logo */}
                                    <div className="absolute inset-0 m-auto w-10 h-10 bg-slate-100 border-2 border-white rounded-lg flex items-center justify-center shadow-md">
                                        <QrCodeIcon className="w-5 h-5 text-primary" />
                                    </div>
                                </div>

                                {/* Bank metadata routing & account details */}
                                <div className="w-full bg-white border border-black/5 rounded-2xl p-3 text-left space-y-1.5 z-10 font-mono text-[10px] dark:bg-slate-800">
                                    <div className="flex justify-between">
                                        <span className="text-[#0F172A]">ROUTING</span>
                                        <span className="text-[#0F172A] font-bold">{receiveAccount.routingNumber || '021000021'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#0F172A]">ACCOUNT</span>
                                        <span className="text-[#0F172A] font-bold">{receiveAccount.accountNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#0F172A]">CLEARANCE</span>
                                        <span className="text-primary font-bold">{receiveAccount.nickname || receiveAccount.type}</span>
                                    </div>
                                </div>

                                {receiveAmount && (
                                    <div className="w-full bg-primary/10 border border-primary/20 rounded-2xl py-2 px-4 z-10">
                                        <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">Amount Requested</span>
                                        <p className="text-lg font-black text-primary font-mono mt-0.5">
                                            $ {parseFloat(receiveAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                )}

                                <div className="text-[8px] text-[#0F172A] font-bold z-10 leading-relaxed uppercase tracking-wider">
                                    Scanned via Ledger QR Pay Scanner • Zero-Gas Settlement
                                </div>
                            </div>

                            <p className="text-xs text-[#0F172A] max-w-xs font-bold my-4">
                                Dynamic card containing routing coordinates. Peer can scan or you can export and share the generated card.
                            </p>

                            <div className="w-full max-w-[340px] flex gap-3">
                                <button 
                                    onClick={triggerCopyKey}
                                    className="flex-1 py-3.5 bg-slate-50 hover:bg-white border border-black/5 active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 dark:bg-slate-800"
                                >
                                    <CopyIcon className="w-4 h-4 text-[#0F172A]" />
                                    <span>{generatorCopied ? "Copied!" : "Copy Payload"}</span>
                                </button>
                                <button 
                                    onClick={handleDownloadQRCard}
                                    className="flex-1 py-3.5 bg-primary hover:bg-primary/95 shadow-lg shadow-primary/20 active:scale-[0.98] text-[#0F172A] font-black text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Download Image</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    // Workstation 2: P2P TRANSFER WORKFLOW (SEND FUNDS)
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        {clearanceStep === 'idle' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                                
                                {/* Video Scanner Column */}
                                <div className="lg:col-span-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-xl min-h-[480px]">
                                    <div>
                                        <div className="flex items-center justify-between gap-4 mb-4">
                                            <h3 className="text-xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Camera scan</h3>
                                            {isScanning && (
                                                <button 
                                                    onClick={() => setIsScanning(false)}
                                                    className="px-4 py-2 text-xs font-black text-red-500 bg-red-400 hover:bg-red-400 border border-red-500/20 rounded-xl transition-all"
                                                >
                                                    Shutdown Camera
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-sm text-[#0F172A] dark:text-white mb-6">Initialize camera capture to lock onto a peer's dynamic ledger QR code.</p>
                                    </div>

                                    <div className="flex-1 flex flex-col items-center justify-center">
                                        {isScanning ? (
                                            <div className="w-full max-w-sm rounded-[2rem] overflow-hidden aspect-square border border-slate-300 dark:border-white/15 bg-slate-100 relative shadow-inner">
                                                <QrScanner 
                                                    hapticsEnabled={true}
                                                    onScan={handleQrScanComplete}
                                                    onClose={() => setIsScanning(false)}
                                                />
                                            </div>
                                        ) : (
                                            <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] bg-slate-50 dark:bg-slate-900 w-full max-w-md mx-auto relative group">
                                                <div className="p-4 bg-primary/10 rounded-full border border-primary/20 w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                                                    <QrCodeIcon className="w-8 h-8 text-primary" />
                                                </div>
                                                <h4 className="text-sm font-black text-[#1E293B] dark:text-slate-100 uppercase tracking-widest">Awaiting Video Link</h4>
                                                <p className="text-xs text-[#0F172A] dark:text-white mt-2 mb-6 max-w-xs mx-auto">
                                                    Camera requires permissions. Point lens at generated QR code to read parameters instantly.
                                                </p>
                                                <button 
                                                    onClick={() => setIsScanning(true)}
                                                    className="w-full md:w-auto px-8 py-4 bg-primary hover:bg-primary-hover text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-primary/10 hover:scale-[1.02]"
                                                >
                                                    Initialize Web Camera
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-center mt-4">
                                        <span className="text-[10px] text-[#0F172A] font-mono font-bold uppercase tracking-widest">
                                            W3C Camera API Integration
                                        </span>
                                    </div>
                                </div>

                                {/* Simulation & Fallback Control Column */}
                                <div className="lg:col-span-6 bg-slate-100 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl">
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Fast Simulation Deck</h3>
                                        <p className="text-sm text-[#0F172A] mb-6">Test the payment experience instantly without needing two physical devices or cameras.</p>
                                    </div>

                                    {/* Demo presets list */}
                                    <div className="space-y-4">
                                        <span className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest">CHOOSE A DEMO REQUEST TO SCAN (2 SEC DELAY SIM)</span>
                                        <div className="grid grid-cols-1 gap-2.5">
                                            {DEMO_PEER_CODES.map((preset, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleInjectPreset(preset)}
                                                    className="w-full p-4 bg-white[0.02] hover:bg-white[0.05] border border-slate-200 dark:border-white/10 hover:border-slate-200 dark:border-white/10 rounded-2xl transition-all text-left flex items-center justify-between group active:scale-[0.99] dark:bg-slate-800"
                                                >
                                                    <div className="flex items-center gap-3.5">
                                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${preset.color} flex items-center justify-center font-black text-slate-950 text-xs shadow-md shadow-black/20`}>
                                                            {preset.avatar}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-black text-white uppercase tracking-tight">{preset.name}</h4>
                                                            <p className="text-[11px] text-[#0F172A] truncate max-w-[210px] font-bold mt-0.5">{preset.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex items-center gap-2">
                                                        <span className="text-xs font-bold font-mono text-primary">${preset.amount.toFixed(2)}</span>
                                                        <ChevronRightIcon className="w-4 h-4 text-[#0F172A] group-hover:translate-x-0.5 transition-transform" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Simulated sandbox custom payload code injector */}
                                    <div className="border-t border-slate-200 dark:border-white/10 pt-6 mt-6">
                                        <span className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-3">CUSTOM INJECT SIMULATED AMNT SCAN</span>
                                        <form onSubmit={handleInjectCustom} className="flex gap-2.5">
                                            <div className="relative flex-1">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[11px] font-mono font-bold text-[#0F172A]">$</span>
                                                <input 
                                                    type="number"
                                                    value={simulationTarget}
                                                    onChange={e => setSimulationTarget(e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-full pl-8 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 dark:border-white/10 text-xs text-white outline-none focus:border-primary/50 font-mono dark:bg-slate-900"
                                                    required
                                                />
                                            </div>
                                            <button 
                                                type="submit"
                                                className="px-5 py-3.5 bg-white hover:bg-white text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all border border-slate-200 dark:border-white/10 dark:bg-slate-800"
                                            >
                                                Inject scan
                                            </button>
                                        </form>
                                    </div>

                                    {/* Direct Payload string input paste */}
                                    <div className="border-t border-slate-200 dark:border-white/10 pt-5 mt-5">
                                        <details className="group">
                                            <summary className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest cursor-pointer hover:text-[#0F172A] transition-colors flex items-center justify-between">
                                                <span>or manual payload string parser</span>
                                                <span className="font-mono text-[9px] group-open:rotate-90 transition-transform">▸</span>
                                            </summary>
                                            <div className="pt-3 space-y-2">
                                                <textarea 
                                                    value={rawPayloadInput}
                                                    onChange={e => setRawPayloadInput(e.target.value)}
                                                    placeholder='Paste P2P payload JSON string here...'
                                                    className="w-full p-3 h-20 bg-slate-50 border border-slate-200 dark:border-white/10 rounded-xl text-[11px] font-mono text-[#0F172A] outline-none focus:border-primary/50 dark:bg-slate-900"
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => handleQrScanComplete(rawPayloadInput)}
                                                    className="w-full py-2.5 bg-[#0b101c] text-primary text-xs font-black uppercase tracking-wider rounded-xl transition-all border border-primary/20 hover:bg-primary/5"
                                                >
                                                    Parse String
                                                </button>
                                            </div>
                                        </details>
                                    </div>
                                </div>

                            </div>
                        )}

                        {/* Interactive Clear Checkout Form */}
                        {clearanceStep === 'input' && p2pPayload && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-[#0b101d] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative max-w-2xl mx-auto"
                            >
                                <button 
                                    onClick={() => { setClearanceStep('idle'); setP2PPayload(null); }}
                                    className="absolute right-6 top-6 p-2 bg-white hover:bg-white rounded-full text-[#0F172A] hover:text-white transition-colors dark:bg-slate-800"
                                >
                                    <XIcon className="w-5 h-5" />
                                </button>

                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-white/10">
                                    <div className="p-2 bg-primary/20 rounded-xl border border-primary/30">
                                        <QrCodeIcon className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Direct Ledger Checkout</h3>
                                        <p className="text-[10px] text-teal-400 font-mono uppercase mt-0.5 tracking-wider">Settlement Node: FPB-CLEAR-P2P</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Payee detail summary card */}
                                    <div className="p-5 rounded-2xl bg-white[0.02] border border-slate-200 dark:border-white/10 space-y-4 dark:bg-slate-800">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-[10px] text-[#0F172A] font-mono font-bold uppercase tracking-widest">RECIPIENT PEER</span>
                                                <h4 className="text-base font-black text-white uppercase tracking-tight mt-1">{p2pPayload.recipientName}</h4>
                                                <p className="text-xs text-[#0F172A] mt-1">{p2pPayload.bankName} // {p2pPayload.accountNumber}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] text-[#0F172A] font-mono font-bold uppercase tracking-widest block">SETTLEMENT AMOUNT</span>
                                                {p2pPayload.amount !== undefined ? (
                                                    <span className="text-xl font-black text-primary font-mono block mt-1">${p2pPayload.amount.toFixed(2)}</span>
                                                ) : (
                                                    <div className="mt-2 text-right">
                                                        <span className="text-xs text-amber-500 bg-amber-500 border border-amber-500/20 px-2 py-1 rounded-lg uppercase font-bold tracking-wider">VARIABLE INBOUND</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="border-t border-slate-200 dark:border-white/10 pt-3.5 flex justify-between items-center text-xs">
                                            <span className="text-[#0F172A] font-bold">Clearance Memo:</span>
                                            <span className="text-white font-bold">{p2pPayload.description}</span>
                                        </div>

                                        {p2pPayload.amount === undefined && (
                                            <div className="border-t border-slate-200 dark:border-white/10 pt-4 space-y-2">
                                                <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest">ENTER SETTLEMENT INT AMOUNT</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F172A] font-mono text-xs">$</span>
                                                    <input 
                                                        type="number"
                                                        placeholder="0.00"
                                                        onChange={(e) => setP2PPayload({...p2pPayload, amount: parseFloat(e.target.value) || 0})}
                                                        className="w-full pl-8 pr-4 py-3 bg-slate-100 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-white font-mono outline-none focus:border-primary/50"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Source funding selection */}
                                    <div>
                                        <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2 flex justify-between">
                                            <span>DEBITING SOURCE ACCOUNT</span>
                                            <span className="text-[#0F172A] font-mono">Select Active Ledger</span>
                                        </label>
                                        <select 
                                            value={selectedDebtorAccount.id} 
                                            onChange={(e) => setSelectedDebtorAccount(internalAccounts.find(a => a.id === e.target.value) || internalAccounts[0])}
                                            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 dark:border-white/10 text-sm text-slate-100 outline-none focus:border-primary/50 transition-colors dark:bg-slate-900"
                                        >
                                            {internalAccounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.nickname || acc.type} (****{acc.accountNumber.slice(-4)}) — Cr: {acc.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Network disclaimers */}
                                    <div className="p-4 bg-emerald-500 rounded-2xl border border-emerald-500/15 flex gap-3 text-xs leading-relaxed text-[#0F172A]">
                                        <ShieldCheckIcon className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                        <p>
                                            <strong>Zero-Gas P2P Clearing Route:</strong> This transfer settles immediately through First Pacific&apos;s cryptographic ledger clearing desks. Core fees: <strong>$0.00</strong>. Clearance window: <strong>&lt; 80ms</strong>.
                                        </p>
                                    </div>

                                    {/* Core Action Button */}
                                    <div className="pt-4 flex gap-4">
                                        <button 
                                            type="button"
                                            onClick={() => { setClearanceStep('idle'); setP2PPayload(null); }}
                                            className="flex-1 py-4 bg-white hover:bg-white text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all border border-slate-200 dark:border-white/15 dark:bg-slate-800"
                                        >
                                            Abort Clearance
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={handleClearTransfer}
                                            className="flex-1 py-4 bg-primary hover:bg-primary-hover text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                        >
                                            <FingerprintIcon className="w-4 h-4" />
                                            Authorize Settlement
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Interactive Cryptographic processing handshake */}
                        {clearanceStep === 'processing' && (
                            <div className="bg-[#0b101c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl max-w-xl mx-auto flex flex-col items-center justify-center text-center min-h-[425px]">
                                <div className="space-y-4 mb-8">
                                    <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                                        <SpinnerIcon className="w-16 h-16 text-primary animate-spin" />
                                        <div className="absolute inset-0 m-auto w-10 h-10 bg-slate-50 border border-primary/20 rounded-full flex items-center justify-center dark:bg-slate-900">
                                            <FingerprintIcon className="w-5 h-5 text-primary animate-pulse" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Node Settle Synchronizing</h3>
                                        <p className="text-[10px] text-[#0F172A] font-mono tracking-widest uppercase mt-1">First Pacific Peer Network // Node {Math.floor(Math.random() * 500 + 400)}</p>
                                    </div>
                                </div>

                                <div className="w-full text-left bg-slate-100 border border-slate-200 dark:border-white/10 p-5 rounded-2xl max-h-[180px] overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-2 whitespace-pre-wrap text-emerald-400 shadow-inner">
                                    {blockchainLogs.map((log, idx) => (
                                        <motion.div 
                                            key={idx}
                                            initial={{ opacity: 0, x: -5 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="text-emerald-400 font-mono"
                                        >
                                            {log}
                                        </motion.div>
                                    ))}
                                    <div className="text-primary animate-pulse font-mono">⚡ Clear sync-buffer validation active...</div>
                                </div>
                            </div>
                        )}

                        {/* Direct Settlement Success State */}
                        {clearanceStep === 'success' && p2pPayload && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-[#0b101d] border border-emerald-500/20 rounded-[2.5rem] p-8 shadow-2xl max-w-lg mx-auto text-center space-y-6"
                            >
                                <div className="p-4 bg-emerald-500 border border-emerald-500/20 rounded-full inline-flex text-emerald-400 animate-pop-in mb-2 mx-auto">
                                    <CheckCircleIcon className="w-16 h-16" />
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Clearance Settled Instantaneously</h3>
                                    <p className="text-xs text-emerald-400 font-mono tracking-widest uppercase">TXN COMMITTED IMMUTABLY</p>
                                </div>

                                <div className="p-4 rounded-xl bg-white[0.01] border border-slate-200 dark:border-white/10 space-y-2 text-xs dark:bg-slate-800">
                                    <div className="flex justify-between">
                                        <span className="text-[#0F172A]">Ledger Hash:</span>
                                        <span className="text-[#1E293B] font-mono">0x{Math.random().toString(16).slice(2, 10)}...{Math.random().toString(16).slice(2, 6)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#0F172A]">Debited From:</span>
                                        <span className="text-[#1E293B]">{selectedDebtorAccount.nickname || selectedDebtorAccount.type}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#0F172A]">Credited To Peer:</span>
                                        <span className="text-[#1E293B] font-bold">{p2pPayload.recipientName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#0F172A]">Total Liquid Transfer:</span>
                                        <span className="text-primary font-black font-mono">${(p2pPayload.amount || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#0F172A]">Clearing Network Cost:</span>
                                        <span className="text-emerald-400 font-bold font-mono">$0.00</span>
                                    </div>
                                </div>

                                {/* Save Recipient to Contacts Prompt Card */}
                                <QrContactPrompt
                                    payload={{
                                        recipientName: p2pPayload.recipientName,
                                        accountNumber: p2pPayload.accountNumber,
                                        bankName: p2pPayload.bankName,
                                        routingNumber: p2pPayload.routingNumber,
                                        email: p2pPayload.recipientEmail,
                                        amount: p2pPayload.amount,
                                        description: p2pPayload.description
                                    }}
                                    recipients={recipients}
                                    onSaveRecipient={onAddRecipient}
                                    onDeleteRecipient={onDeleteRecipient}
                                    autoSaveOnMount={true}
                                />

                                <div className="pt-4 flex gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => { setClearanceStep('idle'); setP2PPayload(null); }}
                                        className="flex-1 py-4 bg-white hover:bg-white text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all border border-slate-200 dark:border-white/10 dark:bg-slate-800"
                                    >
                                        Scan Another
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => navigate('/dashboard')}
                                        className="flex-1 py-4 bg-[#0ec5f2] hover:bg-primary-hover text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                                    >
                                        Main Terminal
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Interactive Settle Error State */}
                        {clearanceStep === 'error' && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-[#0b101c] border border-red-500/20 rounded-[2.5rem] p-8 shadow-2xl max-w-lg mx-auto text-center space-y-6 animate-fade-in"
                            >
                                <div className="p-4 bg-red-500 border border-red-500/20 rounded-full inline-flex text-red-400 mb-2">
                                    <XIcon className="w-10 h-10" />
                                </div>
                                
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Clearance Refused / Held</h3>
                                    <p className="text-xs text-red-400 font-mono tracking-widest uppercase">PROTOCOL SAFETY VIOLATION</p>
                                </div>

                                <p className="text-sm text-[#0F172A] leading-relaxed bg-red-400/[0.02] border border-red-500/10 p-4 rounded-xl">
                                    {clearanceMessage || "The core settlement routing desk reported a double spend error, compliance block, or negative balance limit overflow check failure."}
                                </p>

                                <div className="pt-4 flex gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => { setClearanceStep('idle'); setP2PPayload(null); }}
                                        className="flex-1 py-4 bg-white hover:bg-white text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all border border-slate-200 dark:border-white/10 dark:bg-slate-800"
                                    >
                                        Reload Terminal
                                    </button>
                                </div>
                            </motion.div>
                        )}

                    </motion.div>
                )}
            </div>

            {/* Explanatory Info Card segment */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-md">
                <div className="flex gap-4 items-start">
                    <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 text-primary shrink-0 mt-1">
                        <LockClosedIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-base font-black text-[#0F172A] dark:text-white uppercase tracking-tight">First Pacific Cryptographic Interledger Ledger</h4>
                        <p className="text-xs text-[#0F172A] dark:text-white mt-2 leading-relaxed">
                            Peer-to-peer transfers bypass standard Federal ACH clearings and wire queue latencies entirely. When you initiate or retrieve transactions through Quick QR barcodes, First Pacific instantly maps ledger sync references and balances the credit books. Both nodes maintain an immutable entry signature. High value transactions (&ge; $5,000) are audited under standard compliance rule vectors.
                        </p>
                    </div>
                </div>
            </div>

            {/* Generated QR Code Success Overlay */}
            <QrSuccessOverlay
                isOpen={showQrSuccessModal}
                type="generate"
                payload={{
                    recipientName: userProfile.name,
                    accountNumber: receiveAccount.accountNumber,
                    bankName: 'First Pacific Bank Credit Union',
                    amount: receiveAmount ? parseFloat(receiveAmount) : undefined,
                    description: receiveDesc || 'P2P Dynamic Liquidity Request',
                    routingNumber: receiveAccount.routingNumber || '021000021'
                }}
                onClose={() => setShowQrSuccessModal(false)}
                onDownloadReceipt={() => handleDownloadQRCard()}
            />

            {/* Transfer Execution Success Overlay */}
            {p2pPayload && (
                <QrSuccessOverlay
                    isOpen={clearanceStep === 'success'}
                    type="scan"
                    payload={{
                        recipientName: p2pPayload.recipientName,
                        accountNumber: p2pPayload.accountNumber,
                        bankName: p2pPayload.bankName,
                        amount: p2pPayload.amount,
                        description: p2pPayload.description,
                        routingNumber: p2pPayload.routingNumber,
                        email: p2pPayload.recipientEmail,
                        referenceId: `FPB-QR-${Math.floor(100000000 + Math.random() * 900000000)}`
                    }}
                    recipients={recipients}
                    onSaveRecipient={onAddRecipient}
                    onDeleteRecipient={onDeleteRecipient}
                    onClose={() => setClearanceStep('idle')}
                    onDownloadReceipt={() => handleDownloadQRCard()}
                />
            )}

            {/* Floating 'Report Issue' Button for QR Scanner Interface */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleReportIssue()}
                className="fixed bottom-6 right-6 z-40 px-4.5 py-3.5 bg-slate-50 hover:bg-slate-50 border border-amber-500/40 hover:border-amber-400 text-amber-400 font-black text-xs uppercase tracking-wider rounded-2xl shadow-[0_8px_30px_rgba(245,158,11,0.25)]  flex items-center gap-2.5 transition-all group cursor-pointer dark:bg-slate-900"
                title="Report issue with QR scanning or payment"
            >
                <div className="p-1.5 bg-amber-500 rounded-xl group-hover:bg-amber-500 transition-colors">
                    <ExclamationCircleIcon className="w-4 h-4 text-amber-400" />
                </div>
                <span>Report Issue</span>
            </motion.button>

        </div>
    );
};
