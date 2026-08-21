import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
    X, 
    QrCode, 
    Copy, 
    Check, 
    Share2, 
    Building2, 
    Globe, 
    FileText, 
    Download, 
    DollarSign,
    ShieldCheck, 
    AlertCircle, 
    Sparkles, 
    RefreshCw, 
    Sliders, 
    Eye, 
    Palette, 
    Printer, 
    Send, 
    Lock, 
    Smartphone, 
    Zap, 
    ChevronRight, 
    ExternalLink,
    CheckCircle2,
    Clock,
    CreditCard
} from 'lucide-react';
import { QrSuccessOverlay, QrSuccessPayload } from './QrSuccessOverlay';
import { triggerSuccessHaptic, triggerHaptic } from '../utils/haptics';
import { USER_PROFILE } from './constants';
import { UserProfile, Account, AccountType } from '../types';

export interface ReceiveMoneyModalProps {
    onClose: () => void;
    accountNumber: string;
    routingNumber?: string;
    iban?: string;
    swiftBic?: string;
    userProfile?: UserProfile;
    accounts?: Account[];
    onSimulateInboundPayment?: (tx: any) => Promise<any> | void;
}

type ModalTab = 'generator' | 'coordinates' | 'print_sign' | 'letter';
type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'AED' | 'CHF' | 'SGD' | 'USDC';
type NetworkType = 'fednow' | 'wire' | 'swift' | 'crypto';
type CardTheme = 'obsidian' | 'emerald' | 'sapphire' | 'gold' | 'titanium';

const CURRENCIES: { id: Currency; symbol: string; label: string; rate: number }[] = [
    { id: 'USD', symbol: '$', label: 'US Dollar', rate: 1.0 },
    { id: 'EUR', symbol: '€', label: 'Euro', rate: 0.92 },
    { id: 'GBP', symbol: '£', label: 'British Pound', rate: 0.79 },
    { id: 'CAD', symbol: 'CA$', label: 'Canadian Dollar', rate: 1.36 },
    { id: 'AUD', symbol: 'AU$', label: 'Australian Dollar', rate: 1.52 },
    { id: 'JPY', symbol: '¥', label: 'Japanese Yen', rate: 156.4 },
    { id: 'AED', symbol: 'د.إ', label: 'UAE Dirham', rate: 3.67 },
    { id: 'CHF', symbol: 'Fr', label: 'Swiss Franc', rate: 0.89 },
    { id: 'SGD', symbol: 'S$', label: 'Singapore Dollar', rate: 1.35 },
    { id: 'USDC', symbol: '₮', label: 'USD Coin', rate: 1.0 },
];

const CARD_THEMES: Record<CardTheme, {
    name: string;
    cardBg: string;
    border: string;
    badgeBg: string;
    accentText: string;
    qrFg: string;
    gradientGlow: string;
}> = {
    obsidian: {
        name: 'Obsidian Reserve',
        cardBg: 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950',
        border: 'border-amber-500/30',
        badgeBg: 'bg-amber-500 border-amber-500/30 text-amber-300',
        accentText: 'text-amber-400',
        qrFg: '#1e293b',
        gradientGlow: 'from-amber-500/20 via-cyan-500/10 to-transparent'
    },
    emerald: {
        name: 'Sovereign Emerald',
        cardBg: 'bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-950',
        border: 'border-emerald-500/40',
        badgeBg: 'bg-emerald-500 border-emerald-500/30 text-emerald-300',
        accentText: 'text-emerald-400',
        qrFg: '#064e3b',
        gradientGlow: 'from-emerald-500/25 via-teal-500/10 to-transparent'
    },
    sapphire: {
        name: 'Royal Sapphire',
        cardBg: 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900',
        border: 'border-blue-500/40',
        badgeBg: 'bg-blue-500 border-blue-500/30 text-blue-300',
        accentText: 'text-blue-400',
        qrFg: '#1e3a8a',
        gradientGlow: 'from-blue-500/25 via-indigo-500/10 to-transparent'
    },
    gold: {
        name: 'Prestige Gold',
        cardBg: 'bg-gradient-to-br from-amber-950 via-slate-900 to-amber-900',
        border: 'border-yellow-500/50',
        badgeBg: 'bg-yellow-500 border-yellow-500/40 text-yellow-300',
        accentText: 'text-yellow-400',
        qrFg: '#451a03',
        gradientGlow: 'from-yellow-500/30 via-amber-500/15 to-transparent'
    },
    titanium: {
        name: 'Titanium Slate',
        cardBg: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950',
        border: 'border-slate-600/40',
        badgeBg: 'bg-slate-700 border-slate-500/30 text-[#1E293B]',
        accentText: 'text-cyan-400',
        qrFg: '#0f172a',
        gradientGlow: 'from-cyan-500/20 via-slate-400/10 to-transparent'
    }
};

export const ReceiveMoneyModal: React.FC<ReceiveMoneyModalProps> = ({
    onClose,
    accountNumber: initialAccountNumber,
    routingNumber: initialRoutingNumber = '021000021',
    iban = 'US33FPB021000021009842',
    swiftBic = 'FPBUSH22',
    userProfile,
    accounts = [],
    onSimulateInboundPayment
}) => {
    // Primary Tab Mode
    const [activeTab, setActiveTab] = useState<ModalTab>('generator');

    // Account & Currency Selection State
    const internalAccounts = accounts.length > 0 
        ? accounts.filter(a => a.type !== AccountType.EXTERNAL_LINKED)
        : [{
            id: 'acc_default',
            accountNumber: initialAccountNumber,
            routingNumber: initialRoutingNumber,
            nickname: 'Private Wealth Checking',
            type: AccountType.CHECKING,
            balance: 284920.50,
            currency: 'USD',
            features: []
        } as Account];

    const [selectedAccountId, setSelectedAccountId] = useState<string>(internalAccounts[0]?.id || 'acc_default');
    const selectedAccount = internalAccounts.find(a => a.id === selectedAccountId) || internalAccounts[0];

    const [currency, setCurrency] = useState<Currency>('USD');
    const [requestAmount, setRequestAmount] = useState<string>('');
    const [requestMemo, setRequestMemo] = useState<string>('P2P Direct Clearance');
    const [networkType, setNetworkType] = useState<NetworkType>('fednow');

    // Card Customizer State
    const [cardTheme, setCardTheme] = useState<CardTheme>('obsidian');
    const [includeLogoInQR, setIncludeLogoInQR] = useState<boolean>(true);
    const [isDynamicExpiry, setIsDynamicExpiry] = useState<boolean>(false);
    const [expirySeconds, setExpirySeconds] = useState<number>(900); // 15 mins
    const [includeNfcTag, setIncludeNfcTag] = useState<boolean>(true);

    // Feedback & Overlay States
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isDownloadingImage, setIsDownloadingImage] = useState(false);
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
    const [successPayload, setSuccessPayload] = useState<QrSuccessPayload | null>(null);

    // Simulation / Testing State
    const [isSimulatingScan, setIsSimulatingScan] = useState(false);
    const [simulationPhase, setSimulationPhase] = useState<'idle' | 'decoding' | 'verifying' | 'settling' | 'complete'>('idle');

    // Expiry Countdown Timer
    useEffect(() => {
        let timer: any;
        if (isDynamicExpiry && expirySeconds > 0) {
            timer = setInterval(() => {
                setExpirySeconds(prev => (prev > 1 ? prev - 1 : 900));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isDynamicExpiry, expirySeconds]);

    const formatExpiryTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleCopy = (text: string, fieldKey: string) => {
        navigator.clipboard.writeText(text);
        triggerSuccessHaptic();
        setCopiedField(fieldKey);
        setTimeout(() => setCopiedField(null), 2000);
    };

    // Calculate currency equivalent
    const selectedCurrObj = CURRENCIES.find(c => c.id === currency) || CURRENCIES[0];
    const numericAmount = parseFloat(requestAmount) || 0;
    const formattedAmountStr = numericAmount > 0 
        ? `${selectedCurrObj.symbol}${numericAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '';

    // Encoded JSON Payload String
    const qrPayloadObject = {
        type: 'p2p',
        recipientId: `usr_${(userProfile?.email || USER_PROFILE.email).replace(/[^a-zA-Z0-9]/g, '_')}`,
        recipientName: userProfile?.name || USER_PROFILE.name,
        recipientEmail: userProfile?.email || USER_PROFILE.email,
        accountNumber: selectedAccount.accountNumber || initialAccountNumber,
        routingNumber: selectedAccount.routingNumber || initialRoutingNumber,
        swiftBic: swiftBic,
        iban: iban,
        bankName: 'First Pacific Bank, N.A.',
        currency: currency,
        ...(numericAmount > 0 ? { amount: numericAmount } : {}),
        description: requestMemo || 'Direct Account Clearance',
        network: networkType,
        expiryToken: isDynamicExpiry ? `EXP-${Date.now() + expirySeconds * 1000}` : 'PERPETUAL',
        timestamp: new Date().toISOString()
    };

    const qrPayloadString = JSON.stringify(qrPayloadObject);
    const payUrlLink = `https://firstpacific.bank/pay?req=${btoa(qrPayloadString).slice(0, 32)}`;

    // Download QR Image
    const handleDownloadQRCard = () => {
        setIsDownloadingImage(true);
        triggerHaptic(20);

        setTimeout(() => {
            const cardElem = document.getElementById('qr-share-card');
            if (cardElem && typeof html2canvas !== 'undefined') {
                html2canvas(cardElem, {
                    scale: 3,
                    useCORS: true,
                    backgroundColor: null,
                    logging: false
                }).then((canvas: any) => {
                    const link = document.createElement('a');
                    link.download = `FPB_Receive_QR_${(userProfile?.name || 'User').replace(/\s+/g, '_')}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    setIsDownloadingImage(false);
                    triggerSuccessHaptic();
                }).catch(err => {
                    console.error('QR Export Error:', err);
                    setIsDownloadingImage(false);
                });
            } else {
                setIsDownloadingImage(false);
            }
        }, 300);
    };

    // Download Bank Official Verification PDF Letter
    const handleDownloadPdfLetter = () => {
        setIsGeneratingPdf(true);
        triggerHaptic(20);

        setTimeout(() => {
            const letterElem = document.getElementById('official-bank-letter');
            if (letterElem && typeof html2canvas !== 'undefined' && typeof jsPDF !== 'undefined') {
                html2canvas(letterElem, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                }).then((canvas: any) => {
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF({
                        orientation: 'portrait',
                        unit: 'px',
                        format: 'letter'
                    });
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                    pdf.save(`FPB_Account_Verification_${selectedAccount.accountNumber.slice(-4)}.pdf`);
                    setIsGeneratingPdf(false);
                    triggerSuccessHaptic();
                }).catch(err => {
                    console.error('PDF Generation error:', err);
                    setIsGeneratingPdf(false);
                });
            } else {
                setIsGeneratingPdf(false);
            }
        }, 400);
    };

    // Native Share
    const handleShare = async () => {
        const shareData = {
            title: 'First Pacific Bank Payment Request',
            text: numericAmount > 0 
                ? `Requesting ${formattedAmountStr} via First Pacific Bank.\nBeneficiary: ${userProfile?.name || USER_PROFILE.name}\nMemo: ${requestMemo}`
                : `First Pacific Bank Deposit Coordinates:\nName: ${userProfile?.name || USER_PROFILE.name}\nAccount: ${selectedAccount.accountNumber}\nRouting: ${selectedAccount.routingNumber || initialRoutingNumber}`,
            url: payUrlLink
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (e) {
                // share dismissed
            }
        } else {
            handleCopy(shareData.text, 'share_text');
        }
    };

    // Simulate Inbound QR Code Payment Clearance
    const handleSimulateInboundScan = async () => {
        setIsSimulatingScan(true);
        setSimulationPhase('decoding');
        triggerHaptic(30);

        await new Promise(r => setTimeout(r, 800));
        setSimulationPhase('verifying');
        triggerHaptic(20);

        await new Promise(r => setTimeout(r, 1000));
        setSimulationPhase('settling');
        triggerHaptic(20);

        await new Promise(r => setTimeout(r, 1200));

        const simAmount = numericAmount > 0 ? numericAmount : 150.00;
        const simTx = {
            id: `tx_qr_in_${Date.now()}`,
            accountId: selectedAccountId,
            type: 'INCOMING_TRANSFER',
            sendAmount: simAmount,
            receiveAmount: simAmount,
            amount: simAmount,
            description: `QR Code Deposit: ${requestMemo || 'Inbound Peer Clearance'}`,
            timestamp: new Date().toISOString(),
            status: 'COMPLETED',
            recipientName: userProfile?.name || USER_PROFILE.name,
            senderName: 'Apex Capital Clearing Node',
            category: 'TRANSFER'
        };

        if (onSimulateInboundPayment) {
            await onSimulateInboundPayment(simTx);
        }

        setSimulationPhase('complete');
        triggerSuccessHaptic();

        setSuccessPayload({
            recipientName: userProfile?.name || USER_PROFILE.name,
            accountNumber: selectedAccount.accountNumber,
            bankName: 'First Pacific Bank, N.A.',
            amount: simAmount,
            description: requestMemo || 'Inbound QR Code Peer Payment',
            routingNumber: selectedAccount.routingNumber || initialRoutingNumber,
            swiftBic: swiftBic,
            referenceId: `FEDNOW-${Math.floor(10000000 + Math.random() * 90000000)}`
        });

        setTimeout(() => {
            setIsSimulatingScan(false);
            setSimulationPhase('idle');
            setShowSuccessOverlay(true);
        }, 600);
    };

    const currentTheme = CARD_THEMES[cardTheme];

    return (
        <>
            {/* Hidden Offscreen Letter Container for PDF Download */}
            <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
                <div id="official-bank-letter" className="w-[800px] h-[1050px] bg-white text-[#0F172A] p-16 font-serif relative dark:bg-slate-800">
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold tracking-widest text-[#0F172A] uppercase">First Pacific Bank</h1>
                            <p className="text-xs font-sans tracking-[0.3em] text-[#0F172A] uppercase mt-1">Sovereign Treasury Services</p>
                        </div>
                        <div className="text-right text-xs text-[#0F172A] font-sans leading-relaxed">
                            <p className="font-bold text-[#1E293B]">45 Rockefeller Plaza</p>
                            <p>New York, NY 10111</p>
                            <p>clearance@firstpacific.bank</p>
                        </div>
                    </div>

                    <div className="space-y-6 font-sans text-sm leading-relaxed text-[#1E293B]">
                        <div className="flex justify-between font-mono text-xs border-b border-slate-200 pb-4">
                            <p><strong>ISSUE DATE:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p><strong>REF ID:</strong> VOD-FPB-{(Math.random() * 1000000).toFixed(0)}</p>
                        </div>

                        <p className="pt-4">To Whom It May Concern,</p>
                        
                        <p>
                            This document serves as official authentication that <strong>{userProfile?.name || USER_PROFILE.name}</strong> maintains an active, fully unrestricted account in good standing with First Pacific Bank, N.A.
                        </p>

                        <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl my-6 dark:bg-slate-900">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[#0F172A] mb-4 border-b border-slate-200 pb-2">Verified Account Specifications</h3>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-xs">
                                <div>
                                    <p className="text-[10px] text-[#0F172A] uppercase">Account Holder</p>
                                    <p className="font-bold text-[#0F172A]">{userProfile?.name || USER_PROFILE.name}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-[#0F172A] uppercase">Account Designation</p>
                                    <p className="font-bold text-[#0F172A]">{selectedAccount.nickname || 'Private Wealth Checking'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-[#0F172A] uppercase">Account Number</p>
                                    <p className="font-mono font-bold text-[#0F172A]">{selectedAccount.accountNumber}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-[#0F172A] uppercase">ABA Routing Number</p>
                                    <p className="font-mono font-bold text-[#0F172A]">{selectedAccount.routingNumber || initialRoutingNumber}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-[#0F172A] uppercase">SWIFT / BIC Code</p>
                                    <p className="font-mono font-bold text-[#0F172A]">{swiftBic}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-[#0F172A] uppercase">IBAN</p>
                                    <p className="font-mono font-bold text-[#0F172A]">{iban}</p>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-[#0F172A]">
                            This authorization hash has been digitally sealed under First Pacific Bank's hardware secure enclave protocols. Funds remitted to these coordinates are routed via FedNow and Fedwire nodes for zero-delay settlement.
                        </p>

                        <div className="pt-10 flex justify-between items-end">
                            <div>
                                <p className="font-serif italic text-2xl text-[#0F172A]">Jonathan P. Sterling</p>
                                <div className="border-t border-slate-400 pt-2 w-56 mt-2">
                                    <p className="font-bold text-xs">Jonathan P. Sterling</p>
                                    <p className="text-[10px] text-[#0F172A]">Chief Risk Officer, Sovereign Clearing</p>
                                </div>
                            </div>
                            
                            <div className="border-4 border-slate-300 rounded-full w-28 h-28 flex flex-col items-center justify-center text-center p-2 opacity-80 transform -rotate-6">
                                <p className="text-[9px] font-black uppercase text-[#1E293B]">FPB SEAL</p>
                                <p className="text-[7px] font-mono text-[#0F172A]">{new Date().getFullYear()}</p>
                                <p className="text-[8px] font-bold text-emerald-700 mt-1">VERIFIED</p>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-12 left-16 right-16 text-center text-[9px] text-[#0F172A] border-t border-slate-200 pt-4">
                        First Pacific Bank N.A. Member FDIC. Equal Housing Lender. Rockefeller Center, NY.
                    </div>
                </div>
            </div>

            {/* Main Modal Backdrop */}
            <div className="fixed inset-0 bg-slate-100  z-[200] flex items-center justify-center p-3 sm:p-6 animate-fade-in font-sans">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.94, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 15 }}
                    className="bg-slate-50 border border-slate-200/80 w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[92vh] dark:bg-slate-900"
                >
                    {/* Top Modal Navigation Header */}
                    <div className="p-5 sm:p-6 bg-slate-100 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-500 rounded-2xl border border-emerald-500/30 text-emerald-400 shadow-inner">
                                <QrCode className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                                    <span>Receive Money Hub</span>
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black bg-emerald-500 text-emerald-400 border border-emerald-500/30">
                                        LIVE QR GENERATOR
                                    </span>
                                </h2>
                                <p className="text-[11px] text-[#0F172A] font-bold mt-0.5">
                                    Generate real-time scannable QR cards & global wire coordinates
                                </p>
                            </div>
                        </div>

                        {/* Top Navigation Tabs */}
                        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-200 overflow-x-auto custom-scrollbar dark:bg-slate-900">
                            <button
                                onClick={() => { setActiveTab('generator'); triggerHaptic(10); }}
                                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'generator' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'text-[#0F172A] hover:text-white'}`}
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>QR Generator</span>
                            </button>
                            <button
                                onClick={() => { setActiveTab('coordinates'); triggerHaptic(10); }}
                                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'coordinates' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'text-[#0F172A] hover:text-white'}`}
                            >
                                <Building2 className="w-3.5 h-3.5" />
                                <span>Wire Coordinates</span>
                            </button>
                            <button
                                onClick={() => { setActiveTab('print_sign'); triggerHaptic(10); }}
                                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'print_sign' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'text-[#0F172A] hover:text-white'}`}
                            >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Desk Counter Sign</span>
                            </button>
                            <button
                                onClick={() => { setActiveTab('letter'); triggerHaptic(10); }}
                                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'letter' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'text-[#0F172A] hover:text-white'}`}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Bank Letter</span>
                            </button>
                        </div>

                        {/* Dismiss Close Button */}
                        <button 
                            onClick={onClose}
                            className="p-2.5 bg-white hover:bg-slate-700 text-[#0F172A] hover:text-white rounded-full transition-all border border-slate-300/80 self-end sm:self-auto dark:bg-slate-800"
                            title="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Main Content Body */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8">
                        
                        {/* TAB 1: ADVANCED DYNAMIC QR GENERATOR */}
                        {activeTab === 'generator' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                
                                {/* Left Controls Panel */}
                                <div className="lg:col-span-7 space-y-6">
                                    
                                    {/* 1. Account Selection */}
                                    <div className="bg-slate-100 border border-slate-200 rounded-3xl p-5 space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] flex items-center justify-between">
                                            <span className="flex items-center gap-1.5">
                                                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                                                <span>1. Destination Receiving Account</span>
                                            </span>
                                            <span className="text-emerald-400 font-mono">Available Balance</span>
                                        </label>

                                        <select
                                            value={selectedAccountId}
                                            onChange={(e) => {
                                                setSelectedAccountId(e.target.value);
                                                triggerHaptic(10);
                                            }}
                                            className="w-full bg-slate-50 border border-slate-300 text-white text-sm font-bold rounded-2xl p-3.5 outline-none focus:border-emerald-400 transition-all font-mono dark:bg-slate-900"
                                        >
                                            {internalAccounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.nickname || acc.type} (****{acc.accountNumber?.slice(-4)}) — ${(acc.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 2. Amount & Currency Configurator */}
                                    <div className="bg-slate-100 border border-slate-200 rounded-3xl p-5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] flex items-center gap-1.5">
                                                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                                                <span>2. Requested Amount & Currency</span>
                                            </label>
                                            <span className="text-[9px] font-mono text-[#0F172A] uppercase">Optional Custom Request</span>
                                        </div>

                                        {/* Currency Selector Pills */}
                                        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                                            {CURRENCIES.map(curr => (
                                                <button
                                                    key={curr.id}
                                                    onClick={() => { setCurrency(curr.id); triggerHaptic(10); }}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-1 border shrink-0 ${currency === curr.id ? 'bg-amber-500 text-amber-300 border-amber-500/50' : 'bg-slate-50 text-[#0F172A] border-slate-200 hover:text-white'}`}
                                                >
                                                    <span className="text-[10px]">{curr.symbol}</span>
                                                    <span>{curr.id}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Amount Input */}
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-mono font-bold text-amber-400">
                                                {selectedCurrObj.symbol}
                                            </span>
                                            <input 
                                                type="number"
                                                value={requestAmount}
                                                onChange={(e) => setRequestAmount(e.target.value)}
                                                placeholder="0.00 (leave empty for donor choice)"
                                                className="w-full bg-slate-50 border border-slate-300 focus:border-amber-400 text-white font-mono text-lg font-bold rounded-2xl py-3.5 pl-10 pr-4 outline-none transition-all placeholder:text-[#0F172A] dark:bg-slate-900"
                                            />
                                        </div>

                                        {/* Fast Preset Buttons */}
                                        <div className="flex flex-wrap items-center gap-2 pt-1">
                                            {['25', '50', '100', '250', '500', '1000', '2500'].map(val => (
                                                <button
                                                    key={val}
                                                    onClick={() => { setRequestAmount(val); triggerHaptic(10); }}
                                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-black border transition-all ${requestAmount === val ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20' : 'bg-slate-50 text-[#0F172A] border-slate-200 hover:border-slate-300'}`}
                                                >
                                                    +${val}
                                                </button>
                                            ))}
                                            {requestAmount && (
                                                <button
                                                    onClick={() => setRequestAmount('')}
                                                    className="px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold text-rose-400 bg-rose-500 border border-rose-500/20 hover:bg-rose-500 transition-all"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* 3. Reference Memo & Clearing Network */}
                                    <div className="bg-slate-100 border border-slate-200 rounded-3xl p-5 space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] flex items-center gap-1.5">
                                            <FileText className="w-3.5 h-3.5 text-blue-400" />
                                            <span>3. Reference Memo & Settlement Network</span>
                                        </label>

                                        <input 
                                            type="text"
                                            value={requestMemo}
                                            onChange={(e) => setRequestMemo(e.target.value)}
                                            placeholder="e.g. Consulting Retainer #1089"
                                            className="w-full bg-slate-50 border border-slate-300 text-white text-xs font-bold rounded-2xl p-3.5 outline-none focus:border-blue-400 transition-all dark:bg-slate-900"
                                        />

                                        {/* Network Pills */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                            {[
                                                { id: 'fednow', label: 'FedNow Realtime', desc: 'Instant 24/7' },
                                                { id: 'wire', label: 'Fedwire Direct', desc: 'Same Day High-Value' },
                                                { id: 'swift', label: 'Global SWIFT', desc: 'International' },
                                                { id: 'crypto', label: 'Crypto Liquidity', desc: 'USDC / Web3' }
                                            ].map(net => (
                                                <button
                                                    key={net.id}
                                                    onClick={() => { setNetworkType(net.id as NetworkType); triggerHaptic(10); }}
                                                    className={`p-2.5 rounded-2xl border text-left transition-all ${networkType === net.id ? 'bg-blue-500 border-blue-500 text-white' : 'bg-slate-50 border-slate-200 text-[#0F172A] hover:border-slate-300'}`}
                                                >
                                                    <p className="text-[10px] font-black uppercase">{net.label}</p>
                                                    <p className="text-[8px] text-[#0F172A] font-mono mt-0.5">{net.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 4. Visual Card Customizer & Security Toggles */}
                                    <div className="bg-slate-100 border border-slate-200 rounded-3xl p-5 space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] flex items-center gap-1.5">
                                            <Palette className="w-3.5 h-3.5 text-purple-400" />
                                            <span>4. Card Theme & Security Controls</span>
                                        </label>

                                        {/* Theme Selector */}
                                        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                                            {(Object.keys(CARD_THEMES) as CardTheme[]).map(themeKey => (
                                                <button
                                                    key={themeKey}
                                                    onClick={() => { setCardTheme(themeKey); triggerHaptic(10); }}
                                                    className={`px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border flex items-center gap-2 whitespace-nowrap ${cardTheme === themeKey ? 'bg-purple-500 text-slate-950 border-purple-400 shadow-md shadow-purple-500/20' : 'bg-slate-50 text-[#0F172A] border-slate-200 hover:border-slate-300'}`}
                                                >
                                                    <div className={`w-3 h-3 rounded-full ${CARD_THEMES[themeKey].cardBg}`} />
                                                    <span>{CARD_THEMES[themeKey].name}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Toggles Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                            {/* Security Crest Toggle */}
                                            <div 
                                                onClick={() => { setIncludeLogoInQR(!includeLogoInQR); triggerHaptic(10); }}
                                                className="p-3 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:border-slate-300 transition-all flex items-center justify-between dark:bg-slate-900"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                                    <div>
                                                        <p className="text-[10px] font-bold text-white">Bank Security Crest</p>
                                                        <p className="text-[8px] text-[#0F172A]">Embed verified emblem in QR</p>
                                                    </div>
                                                </div>
                                                <div className={`w-8 h-4 rounded-full transition-colors relative p-0.5 ${includeLogoInQR ? 'bg-emerald-500' : 'bg-white'}`}>
                                                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${includeLogoInQR ? 'translate-x-4' : 'translate-x-0'}`} />
                                                </div>
                                            </div>

                                            {/* Dynamic Expiry Toggle */}
                                            <div 
                                                onClick={() => { setIsDynamicExpiry(!isDynamicExpiry); triggerHaptic(10); }}
                                                className="p-3 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:border-slate-300 transition-all flex items-center justify-between dark:bg-slate-900"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-amber-400" />
                                                    <div>
                                                        <p className="text-[10px] font-bold text-white">15-Min Dynamic Token</p>
                                                        <p className="text-[8px] text-[#0F172A]">High-security single-use request</p>
                                                    </div>
                                                </div>
                                                <div className={`w-8 h-4 rounded-full transition-colors relative p-0.5 ${isDynamicExpiry ? 'bg-amber-500' : 'bg-white'}`}>
                                                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${isDynamicExpiry ? 'translate-x-4' : 'translate-x-0'}`} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right High-Resolution Interactive Card Workstation */}
                                <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-5">
                                    
                                    {/* Capturable Card Container */}
                                    <div 
                                        id="qr-share-card"
                                        className={`relative w-full max-w-[360px] p-6 sm:p-7 rounded-[2.5rem] border ${currentTheme.cardBg} ${currentTheme.border} shadow-[0_20px_60px_rgba(0,0,0,0.6)] text-center overflow-hidden flex flex-col items-center space-y-5 text-white`}
                                    >
                                        {/* Ambient Glows */}
                                        <div className={`absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br ${currentTheme.gradientGlow} rounded-full blur-3xl pointer-events-none`} />
                                        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500 rounded-full blur-3xl pointer-events-none" />

                                        {/* Header Branding */}
                                        <div className="w-full border-b border-black/5 pb-3.5 flex items-center justify-between z-10">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-white rounded-xl border border-white/20  dark:bg-slate-800">
                                                    <ShieldCheck className={`w-4 h-4 ${currentTheme.accentText}`} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                                                    First Pacific Bank
                                                </span>
                                            </div>

                                            <div className={`px-2.5 py-0.5 rounded-full text-[8px] font-mono font-black border uppercase tracking-widest ${currentTheme.badgeBg}`}>
                                                {networkType.toUpperCase()} NODE
                                            </div>
                                        </div>

                                        {/* User Details */}
                                        <div className="z-10">
                                            <h3 className="text-base font-black uppercase tracking-tight text-white leading-tight">
                                                {userProfile?.name || USER_PROFILE.name}
                                            </h3>
                                            <p className="text-[10px] text-[#0F172A] font-semibold mt-0.5 tracking-wider uppercase">
                                                Instant Peer Clearing Account
                                            </p>
                                        </div>

                                        {/* Interactive Scannable QR Frame */}
                                        <div 
                                            onClick={() => handleCopy(qrPayloadString, 'qr_code')}
                                            className="relative p-4 bg-white rounded-3xl w-full max-w-[210px] aspect-square flex items-center justify-center shadow-2xl border-4 border-white/20 z-10 group cursor-pointer transition-transform active:scale-95 dark:bg-slate-800"
                                            title="Click to copy raw QR payload string"
                                        >
                                            <QRCodeSVG 
                                                value={qrPayloadString}
                                                size={170}
                                                level="H"
                                                includeMargin={false}
                                                bgColor="#ffffff"
                                                fgColor={currentTheme.qrFg}
                                            />

                                            {/* Embedded Security Emblem */}
                                            {includeLogoInQR && (
                                                <div className="absolute inset-0 m-auto w-10 h-10 bg-slate-100 border-2 border-white rounded-xl flex items-center justify-center shadow-lg">
                                                    <ShieldCheck className={`w-5 h-5 ${currentTheme.accentText}`} />
                                                </div>
                                            )}

                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-slate-100 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex flex-col items-center justify-center p-3 text-center">
                                                <Copy className="w-6 h-6 text-emerald-400 mb-1" />
                                                <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                                                    {copiedField === 'qr_code' ? 'Copied Payload!' : 'Click to Copy Payload'}
                                                </span>
                                                <span className="text-[8px] text-[#0F172A] font-mono mt-1">
                                                    Cryptographically Signed
                                                </span>
                                            </div>
                                        </div>

                                        {/* Dynamic Expiry Timer Badge */}
                                        {isDynamicExpiry && (
                                            <div className="w-full bg-amber-500 border border-amber-500/30 rounded-2xl p-2 z-10 flex items-center justify-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                                <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                                                    Token Expires in {formatExpiryTime(expirySeconds)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Bank Specs Table */}
                                        <div className="w-full bg-slate-100 border border-black/5 rounded-2xl p-3 text-left space-y-1.5 z-10 font-mono text-[10px]">
                                            <div className="flex justify-between">
                                                <span className="text-[#0F172A]">ROUTING</span>
                                                <span className="text-white font-bold">{selectedAccount.routingNumber || initialRoutingNumber}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#0F172A]">ACCOUNT</span>
                                                <span className="text-white font-bold">{selectedAccount.accountNumber}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#0F172A]">MEMO</span>
                                                <span className="text-emerald-400 font-bold truncate max-w-[150px]">{requestMemo || 'N/A'}</span>
                                            </div>
                                        </div>

                                        {/* Amount Requested Banner */}
                                        {numericAmount > 0 && (
                                            <div className="w-full bg-amber-500 border border-amber-500/30 rounded-2xl py-2 px-3 z-10 text-center">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-[#0F172A]">Requested Amount</span>
                                                <p className="text-xl font-mono font-black text-amber-400 mt-0.5">
                                                    {formattedAmountStr}
                                                </p>
                                            </div>
                                        )}

                                        <div className="text-[8px] text-[#0F172A] font-bold z-10 uppercase tracking-widest">
                                            First Pacific Bank • Zero-Fee Direct Clearance
                                        </div>
                                    </div>

                                    {/* Workstation Action Toolbar */}
                                    <div className="w-full max-w-[360px] space-y-2.5">
                                        <div className="grid grid-cols-2 gap-2">
                                            <button 
                                                onClick={() => handleCopy(qrPayloadString, 'payload_btn')}
                                                className="py-3 bg-white hover:bg-slate-700 text-white font-black text-[11px] uppercase tracking-wider rounded-2xl border border-slate-300 transition-all flex items-center justify-center gap-1.5 dark:bg-slate-800"
                                            >
                                                {copiedField === 'payload_btn' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#0F172A]" />}
                                                <span>{copiedField === 'payload_btn' ? 'Copied' : 'Copy Payload'}</span>
                                            </button>

                                            <button 
                                                onClick={handleDownloadQRCard}
                                                disabled={isDownloadingImage}
                                                className="py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-2xl transition-all shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-70"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                <span>{isDownloadingImage ? 'Exporting...' : 'Save PNG'}</span>
                                            </button>
                                        </div>

                                        {/* TEST LIVE SCANNER SIMULATION BUTTON */}
                                        <button 
                                            onClick={handleSimulateInboundScan}
                                            disabled={isSimulatingScan}
                                            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
                                            <span>Simulate Inbound QR Scan</span>
                                        </button>

                                        <button 
                                            onClick={handleShare}
                                            className="w-full py-2.5 bg-slate-50 hover:bg-white text-[#0F172A] font-bold text-[10px] uppercase tracking-widest rounded-2xl border border-slate-200 flex items-center justify-center gap-1.5 dark:bg-slate-800"
                                        >
                                            <Share2 className="w-3.5 h-3.5 text-[#0F172A]" />
                                            <span>Share Link / Card</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: WIRE COORDINATES (ACH / WIRE / SWIFT) */}
                        {activeTab === 'coordinates' && (
                            <div className="max-w-3xl mx-auto space-y-6">
                                <div className="bg-slate-100 border border-slate-200 rounded-3xl p-6 text-left space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                                        <div>
                                            <h3 className="text-base font-black uppercase text-white tracking-wider">Domestic & Global Banking Coordinates</h3>
                                            <p className="text-xs text-[#0F172A] mt-0.5">Use these parameters for inbound direct deposits, employer payroll, or international wires</p>
                                        </div>
                                        <div className="px-3 py-1 bg-emerald-500 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-black uppercase">
                                            FDIC Insured
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                        <CoordinateRow 
                                            label="Beneficiary Account Name" 
                                            value={userProfile?.name || USER_PROFILE.name} 
                                            onCopy={() => handleCopy(userProfile?.name || USER_PROFILE.name, 'name')}
                                            copied={copiedField === 'name'}
                                        />
                                        <CoordinateRow 
                                            label="Depository Institution" 
                                            value="First Pacific Bank, N.A." 
                                            onCopy={() => handleCopy('First Pacific Bank, N.A.', 'bank')}
                                            copied={copiedField === 'bank'}
                                        />
                                        <CoordinateRow 
                                            label="Account Number" 
                                            value={selectedAccount.accountNumber} 
                                            onCopy={() => handleCopy(selectedAccount.accountNumber, 'acc')}
                                            copied={copiedField === 'acc'}
                                            isMono
                                        />
                                        <CoordinateRow 
                                            label="ABA Routing Number (ACH / Fedwire)" 
                                            value={selectedAccount.routingNumber || initialRoutingNumber} 
                                            onCopy={() => handleCopy(selectedAccount.routingNumber || initialRoutingNumber, 'route')}
                                            copied={copiedField === 'route'}
                                            isMono
                                        />
                                        <CoordinateRow 
                                            label="SWIFT / BIC (Global Wires)" 
                                            value={swiftBic} 
                                            onCopy={() => handleCopy(swiftBic, 'swift')}
                                            copied={copiedField === 'swift'}
                                            isMono
                                        />
                                        <CoordinateRow 
                                            label="IBAN (European Clearing)" 
                                            value={iban} 
                                            onCopy={() => handleCopy(iban, 'iban')}
                                            copied={copiedField === 'iban'}
                                            isMono
                                        />
                                    </div>

                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3 mt-4 dark:bg-slate-900">
                                        <Globe className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                        <div className="text-xs space-y-1">
                                            <p className="font-bold text-[#1E293B]">Intermediary Correspondent Bank</p>
                                            <p className="text-[#0F172A] leading-relaxed text-[11px]">
                                                For non-USD foreign currency wires, route through JPMorgan Chase Bank N.A. New York (SWIFT: CHASUS33) referencing account #{selectedAccount.accountNumber}.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: PRINTABLE DESK COUNTER SIGN */}
                        {activeTab === 'print_sign' && (
                            <div className="max-w-2xl mx-auto space-y-6 text-center">
                                <div className="bg-white text-[#0F172A] p-8 sm:p-12 rounded-[2.5rem] shadow-2xl border-4 border-slate-200 space-y-6 text-center dark:bg-slate-800" id="printable-merchant-sign">
                                    <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                                        <div className="text-left">
                                            <h2 className="text-xl font-black uppercase tracking-widest text-[#0F172A]">First Pacific Bank</h2>
                                            <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-[0.2em]">Instant Payment Node</p>
                                        </div>
                                        <div className="px-3 py-1 bg-slate-50 text-white rounded-full text-[10px] font-black uppercase tracking-wider dark:bg-slate-900">
                                            ACCEPTED HERE
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-xs text-[#0F172A] uppercase font-black tracking-widest">Pay Beneficiary</p>
                                        <h3 className="text-2xl font-black uppercase text-[#0F172A]">{userProfile?.name || USER_PROFILE.name}</h3>
                                        <p className="text-xs text-emerald-700 font-mono font-bold">{selectedAccount.nickname || 'Direct Account'}</p>
                                    </div>

                                    <div className="p-6 bg-slate-50 border-2 border-slate-900 rounded-3xl inline-block my-2 shadow-inner dark:bg-slate-900">
                                        <QRCodeSVG 
                                            value={qrPayloadString}
                                            size={220}
                                            level="H"
                                            includeMargin={false}
                                        />
                                    </div>

                                    <div className="space-y-1 text-xs font-mono text-[#0F172A]">
                                        <p><strong>ACCOUNT:</strong> {selectedAccount.accountNumber}</p>
                                        <p><strong>ROUTING:</strong> {selectedAccount.routingNumber || initialRoutingNumber}</p>
                                    </div>

                                    <div className="pt-4 border-t border-slate-200 text-[10px] text-[#0F172A] uppercase tracking-widest font-bold">
                                        Scan with any Banking App or Mobile Camera
                                    </div>
                                </div>

                                <button
                                    onClick={() => window.print()}
                                    className="py-3.5 px-8 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black uppercase text-xs tracking-wider rounded-2xl shadow transition-all active:scale-95 inline-flex items-center gap-2"
                                >
                                    <Printer className="w-4 h-4" />
                                    <span>Print Payment Desk Sign</span>
                                </button>
                            </div>
                        )}

                        {/* TAB 4: OFFICIAL BANK PROOF LETTER */}
                        {activeTab === 'letter' && (
                            <div className="max-w-2xl mx-auto space-y-6 text-center">
                                <div className="p-6 bg-slate-100 border border-slate-200 rounded-3xl text-left space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-blue-500 border border-blue-500/30 text-blue-400 rounded-2xl">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-white uppercase tracking-wider">Official Verification of Deposit Letter</h3>
                                            <p className="text-xs text-[#0F172A]">Formal PDF document stamped by First Pacific Treasury for proof of funds & account ownership</p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs font-mono dark:bg-slate-900">
                                        <div className="flex justify-between text-[#0F172A]">
                                            <span>ISSUER:</span>
                                            <span className="text-white font-bold">First Pacific Bank N.A. (New York)</span>
                                        </div>
                                        <div className="flex justify-between text-[#0F172A]">
                                            <span>SIGNATORY:</span>
                                            <span className="text-white font-bold">Jonathan P. Sterling (Chief Risk Officer)</span>
                                        </div>
                                        <div className="flex justify-between text-[#0F172A]">
                                            <span>SEAL STATUS:</span>
                                            <span className="text-emerald-400 font-bold">Hardware Enclave Authenticated</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleDownloadPdfLetter}
                                        disabled={isGeneratingPdf}
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        {isGeneratingPdf ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                        <span>Download Official PDF Letter</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* LIVE SIMULATION MODAL OVERLAY */}
            <AnimatePresence>
                {isSimulatingScan && (
                    <div className="fixed inset-0 bg-slate-100  z-[300] flex items-center justify-center p-4 font-sans">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-50 border border-emerald-500/40 w-full max-w-sm rounded-[2.5rem] p-8 text-center text-white space-y-6 shadow-[0_0_80px_rgba(16,185,129,0.3)] dark:bg-slate-900"
                        >
                            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                                <div className="absolute inset-0 border-4 border-emerald-500/30 rounded-full animate-ping" />
                                <div className="absolute inset-[-10px] border-2 border-emerald-500/50 rounded-full animate-spin" />
                                <Zap className="w-10 h-10 text-emerald-400 animate-bounce" />
                            </div>

                            <div className="space-y-2">
                                <span className="px-3 py-1 bg-emerald-500 text-emerald-300 border border-emerald-500/40 rounded-full text-[9px] font-mono font-black uppercase tracking-widest">
                                    {simulationPhase.toUpperCase()} NODE CLEARANCE
                                </span>
                                <h3 className="text-lg font-black uppercase tracking-tight">
                                    {simulationPhase === 'decoding' && 'Scanning QR Payload...'}
                                    {simulationPhase === 'verifying' && 'Verifying Enclave Keys...'}
                                    {simulationPhase === 'settling' && 'Executing FedNow Settlement...'}
                                    {simulationPhase === 'complete' && 'Deposit Settled!'}
                                </h3>
                                <p className="text-xs text-[#0F172A] font-mono">
                                    Simulating incoming P2P clearance from external peer node...
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* SUCCESS OVERLAY RECEIPT */}
            {successPayload && (
                <QrSuccessOverlay 
                    isOpen={showSuccessOverlay}
                    type="scan"
                    payload={successPayload}
                    onClose={() => setShowSuccessOverlay(false)}
                    onDownloadReceipt={handleDownloadPdfLetter}
                />
            )}
        </>
    );
};

// Helper row for Banking Coordinates
const CoordinateRow: React.FC<{
    label: string;
    value: string;
    onCopy: () => void;
    copied: boolean;
    isMono?: boolean;
}> = ({ label, value, onCopy, copied, isMono }) => (
    <div 
        onClick={onCopy}
        className="p-3.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-emerald-500/30 rounded-2xl cursor-pointer transition-all flex items-center justify-between group dark:bg-slate-800"
    >
        <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-[#0F172A] group-hover:text-emerald-400 transition-colors">{label}</p>
            <p className={`text-xs font-bold text-white mt-0.5 ${isMono ? 'font-mono' : ''}`}>{value}</p>
        </div>
        <div className="p-2 text-[#0F172A] group-hover:text-emerald-400 transition-colors">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </div>
    </div>
);
