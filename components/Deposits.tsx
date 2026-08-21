import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    ArrowDownLeft, 
    ShieldCheck, 
    Building2, 
    Coins, 
    Copy, 
    Check, 
    Sparkles, 
    Camera, 
    Globe, 
    Workflow,
    TrendingUp,
    BookmarkCheck,
    Cpu,
    BadgeAlert,
    QrCode
} from 'lucide-react';
import { Account, Transaction, TransactionStatus } from '../types';

interface DepositsProps {
    accounts: Account[];
    onAddFunds: (amount: number, accountId?: string) => Promise<void>;
    createTransaction: (tx: any) => Promise<any>;
}

export const Deposits: React.FC<DepositsProps> = ({ accounts, onAddFunds, createTransaction }) => {
    const [selectedAccount, setSelectedAccount] = useState<Account>(accounts[0] || {} as Account);
    const [amount, setAmount] = useState<string>('25000');
    const [depositMode, setDepositMode] = useState<'ach' | 'bullion' | 'crypto' | 'check'>('ach');
    
    // UI details
    const [copiedSec, setCopiedSec] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [processingStep, setProcessingStep] = useState<string>('');
    const [processSuccess, setProcessSuccess] = useState<boolean>(false);

    // Dynamic state simulations
    const [bullionPurity, setBullionPurity] = useState<'99.9% fine' | '24k Sovereign Fine'>('24k Sovereign Fine');
    const [bullionOz, setBullionOz] = useState<string>('10.5');
    const [cryptoToken, setCryptoToken] = useState<string>('USDC');
    const [liveGoldPrice, setLiveGoldPrice] = useState<number>(2348.80);

    // Check uploading simulation
    const [checkImage, setCheckImage] = useState<string | null>(null);
    const [checkFileName, setCheckFileName] = useState<string>('');
    const [ocrScanStep, setOcrScanStep] = useState<string>('');

    // Real Camera API state
    const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [isExtractingCheck, setIsExtractingCheck] = useState<boolean>(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [cameraStream]);

    const startCamera = async () => {
        try {
            playBeep(900, 0.1);
            setIsCameraActive(true);
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setCameraStream(stream);
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(e => console.error("Error playing video:", e));
                }
            }, 100);
        } catch (err: any) {
            console.error("Camera access failed:", err);
            alert("Could not access camera. Please check permissions.");
            setIsCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setIsCameraActive(false);
    };

    const capturePhotoAndExtract = async () => {
        if (!videoRef.current) return;
        try {
            playBeep(1000, 0.15);
            setIsExtractingCheck(true);
            setOcrScanStep('CAPTURING CHECK FRAME...');

            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth || 640;
            canvas.height = videoRef.current.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            }
            const base64Image = canvas.toDataURL('image/jpeg');
            
            // Set local preview
            setCheckImage(base64Image);
            setCheckFileName(`CHECK_CAPTURE_${Date.now()}.jpg`);
            
            // Stop camera
            stopCamera();

            setOcrScanStep('AI ANALYSIS BY GEMINI...');

            // Call backend
            const res = await fetch('/api/gemini/extract-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ base64Image })
            });
            const data = await res.json();
            
            if (data.success) {
                playBeep(1200, 0.2);
                setAmount(data.amount ? String(data.amount) : '15000');
                setOcrScanStep(`AI EXTRACTED: $${data.amount} on ${data.date}`);
            } else {
                throw new Error(data.error || "Extraction failed");
            }
        } catch (err: any) {
            console.error("Extraction error:", err);
            setOcrScanStep("OCR COMPLETED - MANUAL ADJUSTMENT RECOMMENDED");
            playBeep(300, 0.3);
        } finally {
            setIsExtractingCheck(false);
        }
    };

    // Gold Live price tick
    useEffect(() => {
        const t = setInterval(() => {
            setLiveGoldPrice(prev => prev + (Math.random() - 0.5) * 0.9);
        }, 1500);
        return () => clearInterval(t);
    }, []);

    const playBeep = (freq = 880, duration = 0.15) => {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.06, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (_) {}
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedSec(label);
        playBeep(1200, 0.08);
        setTimeout(() => setCopiedSec(null), 1500);
    };

    const handleExecuteDeposit = async () => {
        const amtNum = parseFloat(amount);
        if (isNaN(amtNum) || amtNum <= 0) {
            playBeep(220, 0.4);
            alert('Please enter a valid amount.');
            return;
        }

        setIsProcessing(true);
        setProcessSuccess(false);
        playBeep(650, 0.1);

        const steps = {
            ach: [
                'Establishing FedWire Channel Brokerage...',
                'Handshaking Sovereign clearing port...',
                'Synthesizing SEC compliance metadata...',
                'Vault clearance authorized successfully.'
            ],
            bullion: [
                'Scanning electronic assay of bullion registry...',
                'Calculating fractional gold spot reserve exchange...',
                'Locking high-security custody bullion vault...',
                'Bullion asset secured. Clearing local dollars...'
            ],
            crypto: [
                'Awaiting decentralized blockchain validations (1/3)...',
                'Propagating multisig hash authentication (2/3)...',
                'Verifying USD equivalent treasury backing (3/3)...',
                'Cryptographic ledger settlement established.'
            ],
            check: [
                'Watermark scan initiated over high-pixel canvas...',
                'Running MICR checksum identification check...',
                'Checking drawer security reserves against vault...',
                'Remote endorsement verified by First Pacific Clearing.'
            ]
        };

        const activeSteps = steps[depositMode];
        
        for (let i = 0; i < activeSteps.length; i++) {
            setProcessingStep(activeSteps[i]);
            await new Promise(r => setTimeout(r, 1000));
            playBeep(700 + i * 100, 0.08);
        }

        // Add funds exactly to selected account
        await onAddFunds(amtNum, selectedAccount?.id);

        // Record a transaction
        try {
            await createTransaction({
                accountId: selectedAccount.id,
                recipient: {
                    id: 'deposit_node_fps',
                    fullName: depositMode === 'ach' ? 'FedWire Clearing House' 
                             : depositMode === 'bullion' ? 'Sovereign Bullion Vault'
                             : depositMode === 'crypto' ? `DeFi Gateway (${cryptoToken})`
                             : 'Remote Check Vault',
                    accountNumber: 'FPS-MEMB-CLEAR',
                    bankName: 'Sovereign Reserves Enclave',
                    isFavorite: false,
                    country: { code: 'US', name: 'United States', currency: 'USD', symbol: '$' }
                },
                sendAmount: amtNum,
                receiveAmount: amtNum,
                fee: 0,
                exchangeRate: 1,
                description: `Sovereign Deposit: ${depositMode.toUpperCase()} Clearance`
            });
        } catch (_) {}

        playBeep(1100, 0.35);
        setTimeout(() => playBeep(1350, 0.4), 120);

        setProcessSuccess(true);
        setIsProcessing(false);
        setCheckImage(null);
    };

    const handleSimulateCheckSelect = () => {
        setOcrScanStep('IMAGE SELECT DETECTED');
        playBeep(980, 0.1);
        setCheckImage('https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=400&auto=format&fit=crop');
        setCheckFileName('CHECK_FED_RESERVE_48102.png');
    };

    return (
        <div className="space-y-8 animate-fade-in text-slate-100">
            {/* Page Title */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-[0.2em] bg-amber-400 text-slate-950 border border-amber-300">PREMIUM INBOUND</span>
                        <h1 className="text-2xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Sovereign Reserves Deposit Portal</h1>
                    </div>
                    <p className="text-xs text-[#0F172A] dark:text-white mt-1 uppercase tracking-wider">Acquire high-liquidity credit nodes into premium vaults via authorized clearing institutions</p>
                </div>

                {/* Authority Verified Ribbon */}
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-100 dark:border-white/10 shadow-xl">
                    <div className="p-1 px-2 bg-emerald-500 rounded border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider leading-none">
                        ● TRUSTED PORTAL
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest leading-none">REGULATORY CODE</p>
                        <p className="text-[9.5px] font-mono font-bold text-[#0F172A] dark:text-white mt-0.5">SEC Sovereign Escrow Cert #401A</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left controls column */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* Deposit Mode Selector */}
                    <div className="bg-slate-50 dark:bg-slate-800 p-1 rounded-2xl border border-slate-100 dark:border-white/10 shadow-inner grid grid-cols-2 md:grid-cols-4 gap-1">
                        <button 
                            onClick={() => { playBeep(); setDepositMode('ach'); setAmount('100000'); }}
                            className={`p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all text-center ${depositMode === 'ach' ? 'bg-amber-400 text-slate-950 shadow-md scale-100' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white hover:bg-white'}`}
                        >
                            <Building2 className="w-5 h-5 shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-wider">FedWire Instant</span>
                        </button>
                        
                        <button 
                            onClick={() => { playBeep(); setDepositMode('bullion'); setAmount('24650'); }}
                            className={`p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all text-center ${depositMode === 'bullion' ? 'bg-amber-400 text-slate-950 shadow-md scale-100' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white hover:bg-white'}`}
                        >
                            <Coins className="w-5 h-5 shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Bullion Vault</span>
                        </button>

                        <button 
                            onClick={() => { playBeep(); setDepositMode('crypto'); setAmount('15000'); }}
                            className={`p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all text-center ${depositMode === 'crypto' ? 'bg-amber-400 text-slate-950 shadow-md scale-100' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white hover:bg-white'}`}
                        >
                            <Cpu className="w-5 h-5 shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Crypto Inflow</span>
                        </button>

                        <button 
                            onClick={() => { playBeep(); setDepositMode('check'); setAmount('5000'); }}
                            className={`p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all text-center ${depositMode === 'check' ? 'bg-amber-400 text-slate-950 shadow-md scale-100' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white hover:bg-white'}`}
                        >
                            <Camera className="w-5 h-5 shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Check Scanner</span>
                        </button>
                    </div>

                    {/* Interactive Setup Console card */}
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-6 relative overflow-hidden">
                        
                        {/* Interactive glow backing based on mode */}
                        <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[140px] opacity-10 pointer-events-none -mr-32 -mt-32 bg-amber-400"></div>

                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/10 pb-4">
                            <div className="text-left">
                                <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest block">DEPOSIT STEP 01</span>
                                <h3 className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-tight">Configure Enclave Vault Inflow</h3>
                            </div>
                            <span className="px-3 py-1 bg-slate-100 rounded-full text-[#0F172A] dark:text-white font-mono text-[9px] font-black uppercase tracking-wider">ACTIVE PORT 3000</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                            
                            {/* Destination Checking/Savings selector */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest block">DESTINATION HARDWARE NODE</label>
                                <select 
                                    className="w-full p-4 bg-slate-100 border border-slate-200 dark:border-white/10 rounded-2xl text-xs text-[#0F172A] dark:text-white uppercase tracking-wider font-bold"
                                    value={selectedAccount.id}
                                    onChange={(e) => {
                                        playBeep();
                                        const match = accounts.find(a => a.id === e.target.value);
                                        if (match) setSelectedAccount(match);
                                    }}
                                >
                                    {accounts.map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.nickname || a.type} ({a.accountNumber}) — ${(a.balance).toLocaleString()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Amount input */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest block">CREDIT SUM INTRODUCED ($)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#0F172A] dark:text-white">$</span>
                                    <input 
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full p-4 pl-8 bg-slate-100 border border-slate-200 dark:border-white/10 rounded-2xl text-xs text-[#0F172A] dark:text-white font-mono font-bold"
                                    />
                                </div>
                            </div>

                        </div>

                        {/* Mode detailed options */}
                        <div className="border-t border-slate-100 dark:border-white/10 pt-6 text-left">
                            <AnimatePresence mode="wait">
                                {depositMode === 'ach' && (
                                    <motion.div 
                                        key="ach"
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -15 }}
                                        className="space-y-4"
                                    >
                                        <div className="flex items-start gap-4 p-4.5 rounded-2xl bg-slate-100 border border-slate-100 dark:border-white/10">
                                            <Building2 className="w-5 h-5 text-amber-500 mt-1 shrink-0" />
                                            <div className="space-y-1 flex-1">
                                                <h4 className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-wider">First Pacific FedWire / ACH Transit Ledger</h4>
                                                <p className="text-[10px] text-[#0F172A] dark:text-white max-w-xl">Use these credentials to route instant transfers directly to First Pacific Bank. Credited immediately with fully functional ledger audits.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 bg-slate-100 rounded-2xl border border-slate-100 dark:border-white/10 flex items-center justify-between">
                                                <div className="text-left">
                                                    <span className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest block">ROUTING NUMBER (ABA)</span>
                                                    <span className="text-xs font-mono font-bold text-[#0F172A] dark:text-white">021000021</span>
                                                </div>
                                                <button 
                                                    onClick={() => copyToClipboard('021000021', 'routing')}
                                                    className="p-2 bg-slate-50 dark:bg-slate-900 hover:bg-white dark:bg-slate-900 rounded-lg text-[#0F172A] dark:text-white transition"
                                                >
                                                    {copiedSec === 'routing' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>

                                            <div className="p-4 bg-slate-100 rounded-2xl border border-slate-100 dark:border-white/10 flex items-center justify-between">
                                                <div className="text-left">
                                                    <span className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest block">IBAN / VIRTUAL CLEARANCE CODE</span>
                                                    <span className="text-xs font-mono font-bold text-[#0F172A] dark:text-white">CH93 0000 1204 883A</span>
                                                </div>
                                                <button 
                                                    onClick={() => copyToClipboard('CH93 0000 1204 883A', 'iban')}
                                                    className="p-2 bg-slate-50 dark:bg-slate-900 hover:bg-white dark:bg-slate-900 rounded-lg text-[#0F172A] dark:text-white transition"
                                                >
                                                    {copiedSec === 'iban' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {depositMode === 'bullion' && (
                                    <motion.div 
                                        key="bullion"
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -15 }}
                                        className="space-y-4 text-left"
                                    >
                                        <div className="p-4 rounded-2xl bg-slate-100 border border-slate-100 dark:border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div className="flex gap-4">
                                                <Coins className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-wider">Physical Bullion Redemption Desk</h4>
                                                    <p className="text-[10px] text-[#0F172A] dark:text-white max-w-md">Synchronize physical gold bars or bullion certificates for credit nodes. We secure custodial verification within Swiss high-security vaults.</p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 p-3 rounded-xl">
                                                <span className="text-[7.5px] font-black text-[#0F172A] uppercase tracking-widest block">LIVE SPOT GOLD</span>
                                                <span className="text-xs font-mono font-black text-amber-500">${liveGoldPrice.toFixed(2)}/oz</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest">WEIGHT IN OUNCES (OZ)</label>
                                                <input 
                                                    type="number"
                                                    value={bullionOz}
                                                    onChange={(e) => {
                                                        setBullionOz(e.target.value);
                                                        const val = parseFloat(e.target.value);
                                                        if (val) setAmount((val * liveGoldPrice).toFixed(0));
                                                    }}
                                                    className="w-full p-4 bg-slate-100 border border-slate-200 dark:border-white/10 rounded-2xl text-xs text-[#0F172A] dark:text-white font-mono font-bold"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest">ASSAY REGISTRY GRADE</label>
                                                <select 
                                                    className="w-full p-4 bg-slate-100 border border-slate-200 dark:border-white/10 rounded-2xl text-xs text-[#0F172A] dark:text-white uppercase tracking-wider font-bold"
                                                    value={bullionPurity}
                                                    onChange={(e: any) => setBullionPurity(e.target.value)}
                                                >
                                                    <option value="24k Sovereign Fine">24k Sovereign Fine (.9999)</option>
                                                    <option value="99.9% fine">99.9% fine bullion bar</option>
                                                </select>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {depositMode === 'crypto' && (
                                    <motion.div 
                                        key="crypto"
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -15 }}
                                        className="space-y-4"
                                    >
                                        <div className="p-4 bg-slate-100 rounded-2xl border border-slate-100 dark:border-white/10 flex gap-4 items-center">
                                            <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/10 relative z-10 shrink-0">
                                                <QrCode className="w-8 h-8 text-amber-400" />
                                            </div>
                                            <div className="text-left space-y-1">
                                                <h4 className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-wider">Decentralized Escrow Smart On-Ramp</h4>
                                                <p className="text-[10px] text-[#0F172A] dark:text-white max-w-md">Deposit native cryptocurrencies to gain absolute USD liquidity in real-time. Automatically converts base value with 0% extra gas surcharge.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest">ASSET TOKEN TYPE</label>
                                                <select 
                                                    className="w-full p-4 bg-slate-100 border border-slate-200 dark:border-white/10 rounded-2xl text-xs text-[#0F172A] dark:text-white uppercase tracking-wider font-bold"
                                                    value={cryptoToken}
                                                    onChange={(e) => setCryptoToken(e.target.value)}
                                                >
                                                    <option value="USDC">USDC Stablecoin (ERC-20)</option>
                                                    <option value="BTC">Bitcoin Native Protocol</option>
                                                    <option value="ETH">Ethereum (Wrapped Ether)</option>
                                                </select>
                                            </div>
                                            <div className="p-4 bg-slate-100 rounded-2xl border border-slate-100 dark:border-white/10 flex items-center justify-between">
                                                <div className="text-left">
                                                    <span className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest block">FPS DEPOSIT ESCROW ADDRESS</span>
                                                    <span className="text-xs font-mono font-bold text-[#0F172A] dark:text-white">0x73A...b449Cc</span>
                                                </div>
                                                <button 
                                                    onClick={() => copyToClipboard('0x73Af21008C3b449Cc41bB12c011e74a839', 'crypto_addr')}
                                                    className="p-2 bg-slate-50 dark:bg-slate-900 hover:bg-white dark:bg-slate-900 rounded-lg text-[#0F172A] dark:text-white transition animate-pulse"
                                                >
                                                    {copiedSec === 'crypto_addr' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {depositMode === 'check' && (
                                    <motion.div 
                                        key="check"
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -15 }}
                                        className="space-y-4"
                                    >
                                        <div className="p-4.5 rounded-2xl bg-slate-100 border border-slate-100 dark:border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div className="text-left space-y-1">
                                                <h4 className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-wider">Mobile Check Deposit Verification</h4>
                                                <p className="text-[10px] text-[#0F172A] dark:text-white max-w-md">Snap photographs of checks with clear signatures and watermark visible. Automatically runs compliance OCR scans within 5 seconds.</p>
                                            </div>
                                            <div className="flex gap-2 shrink-0 flex-wrap">
                                                <button 
                                                    onClick={startCamera}
                                                    disabled={isCameraActive}
                                                    className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 text-[9px] font-black uppercase tracking-wider transition shrink-0 flex items-center gap-1.5"
                                                >
                                                    <Camera className="w-3.5 h-3.5" /> Scan Check via Camera
                                                </button>
                                                <button 
                                                    onClick={handleSimulateCheckSelect}
                                                    disabled={isCameraActive}
                                                    className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:border-black/10 text-[#0F172A] dark:text-white font-mono text-[9px] font-black uppercase tracking-wider transition shrink-0"
                                                >
                                                    Simulate Capture
                                                </button>
                                            </div>
                                        </div>

                                        {isCameraActive && (
                                            <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 space-y-4 flex flex-col items-center">
                                                <div className="relative w-full max-w-md aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                                                    <video 
                                                        ref={videoRef} 
                                                        className="w-full h-full object-cover"
                                                        playsInline
                                                        muted
                                                    />
                                                    <div className="absolute inset-0 border-2 border-dashed border-amber-400/50 m-6 pointer-events-none rounded-lg flex items-center justify-center">
                                                        <span className="text-[10px] text-amber-400/80 uppercase font-black tracking-widest bg-slate-100 px-2 py-1 rounded">ALIGN CHECK HERE</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={capturePhotoAndExtract}
                                                        disabled={isExtractingCheck}
                                                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl transition"
                                                    >
                                                        {isExtractingCheck ? "Analyzing..." : "Capture Check Frame"}
                                                    </button>
                                                    <button
                                                        onClick={stopCamera}
                                                        className="px-4 py-2 bg-rose-500 hover:bg-rose-500 text-rose-300 font-bold text-[10px] uppercase tracking-widest rounded-xl transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
 
                                        {checkImage && (
                                            <div className="p-4 bg-slate-100 rounded-2xl border border-emerald-500/20 flex gap-4 items-center">
                                                <div className="w-16 h-10 rounded bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center relative border border-slate-200 dark:border-white/10 shrink-0">
                                                    <img src={checkImage} className="w-full h-full object-cover opacity-60" alt="check" />
                                                    <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-500 animate-bounce opacity-80"></div>
                                                </div>
                                                <div className="text-left flex-1 min-w-0">
                                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{ocrScanStep || 'CHECK DETECTED'}</p>
                                                    <p className="text-[9.5px] text-[#0F172A] dark:text-white font-mono truncate">{checkFileName}</p>
                                                </div>
                                                <span className="bg-emerald-500 text-emerald-400 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-emerald-500/20">READY FOR REDEMPTION</span>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                    </div>

                    {/* Submit Bar */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-white/10">
                        <div className="flex gap-3 text-left">
                            <div className="p-2 bg-emerald-500 rounded border border-emerald-500/20 shrink-0 flex items-center justify-center">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                                <h5 className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-wider">Legitimacy Checked & Cleared</h5>
                                <p className="text-[8.5px] text-[#0F172A] dark:text-white max-w-sm uppercase tracking-wider">Member FDIC deposits. Subject to Swiss bank clearing authority guidelines.</p>
                            </div>
                        </div>

                        <button
                            onClick={handleExecuteDeposit}
                            disabled={isProcessing}
                            className={`px-8 py-4.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl leading-none w-full md:w-auto ${
                                isProcessing
                                ? 'bg-slate-50 dark:bg-slate-900 border border-amber-500 text-amber-500 cursor-wait'
                                : 'bg-amber-400 text-slate-950 hover:bg-amber-300 hover:scale-[1.01] active:scale-95'
                            }`}
                        >
                            {isProcessing ? 'CLEARING RESERVES...' : 'AUTHORIZE INBOUND CREDIT'}
                        </button>
                    </div>

                    {/* Progress tracking overlay for simulation */}
                    <AnimatePresence>
                        {isProcessing && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-slate-50 dark:bg-slate-800  z-[80] flex items-center justify-center p-6"
                            >
                                <div className="max-w-md w-full p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-center space-y-6 shadow-3xl">
                                    <div className="flex justify-center">
                                        <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin flex items-center justify-center">
                                            <Cpu className="w-6 h-6 text-amber-500 animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">FPS TRANSACT NODE 3000</p>
                                        <h4 className="text-base font-black text-[#0F172A] dark:text-white uppercase tracking-normal">Establishing Clearance Corridor</h4>
                                        <p className="text-xs text-amber-400 font-mono animate-pulse uppercase tracking-wider mt-1">{processingStep}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {processSuccess && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-slate-50 dark:bg-slate-800  z-[80] flex items-center justify-center p-6"
                            >
                                <div className="max-w-md w-full p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-center space-y-6 shadow-3xl">
                                    <div className="flex justify-center">
                                        <div className="w-16 h-16 rounded-full bg-emerald-500 border border-emerald-500/30 flex items-center justify-center">
                                            <BookmarkCheck className="w-8 h-8 text-emerald-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-tight">VAULT SETTLEMENT IMMUTABLE</h4>
                                        <p className="text-xs text-[#0F172A] dark:text-white capitalize">Dynamic bank reserves adjusted. Inbound credit successfully posted.</p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-slate-100 border border-slate-100 dark:border-white/10 space-y-1.5 text-center">
                                        <span className="text-[7.5px] font-black text-[#0F172A] uppercase tracking-widest block">DEPOSITED RESERVES</span>
                                        <span className="text-lg font-mono font-black text-[#0F172A] dark:text-white block">+${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>

                                    <button 
                                        onClick={() => setProcessSuccess(false)}
                                        className="w-full py-4 rounded-2xl bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-widest transition hover:bg-amber-300"
                                    >
                                        Acknowledge & Sync Ledger
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>

                {/* Right badges & cert column */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* Authority Stamps Panel */}
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-6 shadow-xl space-y-6 text-left relative overflow-hidden">
                        <div>
                            <span className="text-[7.5px] font-black text-[#0F172A] uppercase tracking-widest block">CREDENTIALS</span>
                            <h4 className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-tight">Authority Verification Seals</h4>
                        </div>

                        <div className="space-y-4">
                            
                            {/* Seal 1 */}
                            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-100 dark:border-white/10 space-y-2">
                                <div className="flex gap-3 items-center">
                                    <div className="p-2 rounded bg-amber-500 border border-amber-500/20 text-amber-500 text-xs">
                                        <ShieldCheck className="w-4 h-4" />
                                    </div>
                                    <span className="font-mono text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-wider">Member FDIC Protected</span>
                                </div>
                                <p className="text-[9px] text-[#0F172A] dark:text-white leading-normal uppercase tracking-wider">Deposit accounts insured up to $250,000.00 backed by the regulatory authority of the US government treasury framework.</p>
                            </div>

                            {/* Seal 2 */}
                            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-100 dark:border-white/10 space-y-2">
                                <div className="flex gap-3 items-center">
                                    <div className="p-2 rounded bg-amber-500 border border-amber-500/20 text-amber-500 text-xs">
                                        <Globe className="w-4 h-4" />
                                    </div>
                                    <span className="font-mono text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-wider">SWIFT G-20 Network Cert</span>
                                </div>
                                <p className="text-[9px] text-[#0F172A] dark:text-white leading-normal uppercase tracking-wider">Authentic global transit connectivity routed through SEC-monitored institutional channels adhering to FinCEN covenants.</p>
                            </div>

                            {/* Seal 3 */}
                            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-100 dark:border-white/10 space-y-2">
                                <div className="flex gap-3 items-center">
                                    <div className="p-2 rounded bg-amber-500 border border-amber-500/20 text-amber-500 text-xs">
                                        <Workflow className="w-4 h-4" />
                                    </div>
                                    <span className="font-mono text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-wider">Federation Clearing Protocol 5</span>
                                </div>
                                <p className="text-[9px] text-[#0F172A] dark:text-white leading-normal uppercase tracking-wider">Immutable cryptographic payload telemetry validated and certified in real-time under Sovereign Enclave parameters.</p>
                            </div>

                        </div>
                    </div>

                    {/* Interest Rate/Yield Boost Simulator */}
                    <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-6 text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <TrendingUp className="w-24 h-24 text-[#0F172A] dark:text-white" />
                        </div>

                        <span className="text-[7.5px] font-black text-[#0F172A] uppercase tracking-widest block">YIELD FORECAST</span>
                        <h4 className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-tight mt-0.5">Sovereign Yield Aggregation</h4>
                        <p className="text-[9px] text-[#0F172A] dark:text-white uppercase tracking-wider mt-1">Acquire loyalty multipliers depending on deposit magnitude:</p>

                        <div className="mt-5 space-y-3 font-mono text-[10px] font-bold">
                            <div className="flex justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10">
                                <span className="text-[#0F172A] dark:text-white">Under $10k:</span>
                                <span className="text-[#0F172A] dark:text-white">4.21% APY Benchmark</span>
                            </div>
                            <div className="flex justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10">
                                <span className="text-[#0F172A] dark:text-white">$10k - $50k:</span>
                                <span className="text-amber-400 animate-pulse font-black">5.65% Silver Tier Boosted</span>
                            </div>
                            <div className="flex justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-amber-400/20">
                                <span className="text-[#0F172A] dark:text-white">Over $50k:</span>
                                <span className="text-amber-500 font-extrabold uppercase">8.12% Sovereign Elite Locked</span>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};
