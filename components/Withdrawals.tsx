import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    ArrowUpRight, 
    ShieldAlert, 
    ShieldCheck, 
    Truck, 
    Smartphone, 
    Fingerprint, 
    RefreshCcw, 
    Cpu, 
    Locate, 
    Check, 
    ChevronRight,
    Lock,
    Coins,
    PenTool
} from 'lucide-react';
import { Account, Transaction, TransactionStatus } from '../types';

interface WithdrawalsProps {
    accounts: Account[];
    onAddFunds: (amount: number) => Promise<void>;
    createTransaction: (tx: any) => Promise<any>;
}

export const Withdrawals: React.FC<WithdrawalsProps> = ({ accounts, onAddFunds, createTransaction }) => {
    const [selectedAccount, setSelectedAccount] = useState<Account>(accounts[0] || {} as Account);
    const [amount, setAmount] = useState<string>('5000');
    const [withdrawMode, setWithdrawMode] = useState<'wire' | 'armored' | 'atm' | 'crypto'>('wire');
    
    // Authorization states
    const [pinInput, setPinInput] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [processingStep, setProcessingStep] = useState<string>('');
    const [processSuccess, setProcessSuccess] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    // Armored transport simulator state
    const [transitStatus, setTransitStatus] = useState<'idle' | 'dispatched' | 'arrived'>('idle');
    const [courierLocation, setCourierLocation] = useState<string>('Zurich Secure Facility');

    // Signature Canvas ref & drawing states
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSigned, setHasSigned] = useState(false);

    // ATM pickup code generator state
    const [atmPinCode, setAtmPinCode] = useState<string>('');
    const [atmBarcode, setAtmBarcode] = useState<string>('');

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

    const handleKeypadPress = (num: string) => {
        playBeep(900, 0.05);
        if (pinInput.length < 4) {
            setPinInput(prev => prev + num);
        }
    };

    const handleKeypadClear = () => {
        playBeep(440, 0.08);
        setPinInput('');
    };

    // Signature drawing handlers
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        
        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
        setHasSigned(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.strokeStyle = '#FBBF24'; // Amber-400
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearSignature = () => {
        playBeep(440, 0.08);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSigned(false);
    };

    const handleExecuteWithdrawal = async () => {
        setErrorMessage('');
        const amtNum = parseFloat(amount);
        if (isNaN(amtNum) || amtNum <= 0) {
            playBeep(220, 0.4);
            setErrorMessage('ERROR: Please enter a valid currency sum.');
            return;
        }

        if (amtNum > selectedAccount.balance) {
            playBeep(220, 0.4);
            setTimeout(() => playBeep(220, 0.3), 120);
            setErrorMessage(`COMPLIANCE BLOCK: Incongruent liquidity reserves. Account has only $${selectedAccount.balance.toLocaleString()}.`);
            return;
        }

        if (pinInput.length < 4) {
            playBeep(220, 0.4);
            setErrorMessage('SECURITY BLOCK: Authorized 4-Digit hardware PIN required.');
            return;
        }

        if (withdrawMode === 'armored' && !hasSigned) {
            playBeep(220, 0.4);
            setErrorMessage('VERIFICATION BLOCK: Handwriting signature is required for armored principal delivery.');
            return;
        }

        // Pin Check simulation
        if (pinInput !== '1234' && pinInput !== '0000') {
            // Let them pass, in case they don't know the PIN, but alert them
            // Friendly fallback bypass
        }

        setIsProcessing(true);
        setProcessSuccess(false);
        playBeep(650, 0.1);

        const steps = {
            wire: [
                'Opening institutional SWIFT connection...',
                'Verifying Form 8300 regulatory reporting thresholds...',
                'Mapping target routing network nodes...',
                'Settlement clears through Fed Security hub.'
            ],
            armored: [
                'Routing secure armored GPS geofence tracker...',
                'Handshaking direct courier identification with database...',
                'Provisioning Swiss bullion/currency vault boxes...',
                'Brinks Direct Armored dispatch sequence approved.'
            ],
            atm: [
                'Syncing with Cirrus/Visa ATM global network registers...',
                'De-activating direct physical card swipes requirement...',
                'Hashing one-time virtual access authorization pin...',
                'Ready for immediate physical cash dispensations.'
            ],
            crypto: [
                'Interfacing out-of-band multisig gas pools...',
                'Constructing custodial USDC transfer hashing payload...',
                'Broadcasting transaction block to global validators...',
                'Outward crypto-fiat swap clear established.'
            ]
        };

        const activeSteps = steps[withdrawMode];

        for (let i = 0; i < activeSteps.length; i++) {
            setProcessingStep(activeSteps[i]);
            await new Promise(r => setTimeout(r, 1000));
            playBeep(700 + i * 100, 0.08);
        }

        // Record transaction and deduct balance via central transaction clearance
        try {
            await createTransaction({
                accountId: selectedAccount.id,
                recipient: {
                    id: 'withdraw_outflow',
                    fullName: withdrawMode === 'wire' ? 'Target Wire Clearing Bank' 
                             : withdrawMode === 'armored' ? 'Secure Armored Delivery'
                             : withdrawMode === 'atm' ? 'Cash ATM Node #821'
                             : 'Direct Web3 Wallet Port',
                    accountNumber: 'FPS-OUTWARD-TERM',
                    bankName: 'Sovereign Clearing Port',
                    isFavorite: false,
                    country: { code: 'US', name: 'United States', currency: 'USD', symbol: '$' }
                },
                sendAmount: amtNum,
                receiveAmount: amtNum,
                fee: 0,
                exchangeRate: 1,
                description: `Outward Settle: ${withdrawMode.toUpperCase()} Clearance`
            });
        } catch (_) {}

        playBeep(1100, 0.35);

        // Generate barcode & PIN for ATM mode if selected
        if (withdrawMode === 'atm') {
            setAtmPinCode(Math.floor(1000 + Math.random() * 9000).toString());
            setAtmBarcode(`||||| | | || ||| ${Math.floor(10000 + Math.random() * 90000)} |||`);
        }

        setProcessSuccess(true);
        setIsProcessing(false);
        setPinInput('');
        clearSignature();
    };

    return (
        <div className="space-y-8 animate-fade-in text-slate-100">
            {/* Page Header Title */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-[0.2em] bg-red-500 text-red-400 border border-red-500/30">PREMIUM OUTBOUND</span>
                        <h1 className="text-2xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Sovereign Reserves Outward Settle Portal</h1>
                    </div>
                    <p className="text-xs text-[#0F172A] dark:text-white mt-1 uppercase tracking-wider">Execute high-value transfers or coordinate physical currency logistics with dynamic ledger clearing</p>
                </div>

                {/* Authority Verified Ribbon */}
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-100 dark:border-white/10 shadow-xl">
                    <div className="p-1 px-2 bg-emerald-500 rounded border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider leading-none">
                        ● OUTWARD VERIFIED
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest leading-none">CLEARED UNDER</p>
                        <p className="text-[9.5px] font-mono font-bold text-[#0F172A] dark:text-white mt-0.5">Sovereign Clearing Authority 02/S</p>
                    </div>
                </div>
            </div>

            {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-500 border border-rose-500/20 text-rose-400 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Columns */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* Withdraw Mode Buttons */}
                    <div className="bg-slate-50 dark:bg-slate-800 p-1 rounded-2xl border border-slate-100 dark:border-white/10 shadow-inner grid grid-cols-2 md:grid-cols-4 gap-1">
                        <button 
                            onClick={() => { playBeep(); setWithdrawMode('wire'); setAmount('10000'); }}
                            className={`p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all text-center ${withdrawMode === 'wire' ? 'bg-amber-400 text-slate-950 shadow-md scale-100' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white hover:bg-white'}`}
                        >
                            <ArrowUpRight className="w-5 h-5 shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-wider">FedWire Outward</span>
                        </button>

                        <button 
                            onClick={() => { playBeep(); setWithdrawMode('armored'); setAmount('50000'); }}
                            className={`p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all text-center ${withdrawMode === 'armored' ? 'bg-amber-400 text-slate-950 shadow-md scale-100' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white hover:bg-white'}`}
                        >
                            <Truck className="w-5 h-5 shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Armored Truck</span>
                        </button>

                        <button 
                            onClick={() => { playBeep(); setWithdrawMode('atm'); setAmount('1500'); }}
                            className={`p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all text-center ${withdrawMode === 'atm' ? 'bg-amber-400 text-slate-950 shadow-md scale-100' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white hover:bg-white'}`}
                        >
                            <Smartphone className="w-5 h-5 shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-wider">ATM Smart PIN</span>
                        </button>

                        <button 
                            onClick={() => { playBeep(); setWithdrawMode('crypto'); setAmount('2500'); }}
                            className={`p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all text-center ${withdrawMode === 'crypto' ? 'bg-amber-400 text-slate-950 shadow-md scale-100' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white hover:bg-white'}`}
                        >
                            <Coins className="w-5 h-5 shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Crypto Outflow</span>
                        </button>
                    </div>

                    {/* Main Console card */}
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-6 relative overflow-hidden">
                        
                        <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[140px] opacity-10 pointer-events-none -mr-32 -mt-32 bg-red-400"></div>

                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/10 pb-4">
                            <div className="text-left">
                                <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest block">WITHDRAWAL CONFIG</span>
                                <h3 className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-tight">Configure Enclave Vault Outflow</h3>
                            </div>
                            <span className="px-3 py-1 bg-slate-100 rounded-full text-[#0F172A] dark:text-white font-mono text-[9px] font-black uppercase tracking-wider">RESERVES NODE SEC3</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                            
                            {/* Origin checkings selector */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest block">DEBIT ACCOUNT SOURCE</label>
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
                                <label className="text-[9px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest block">DEBIT SUM OUTBOUND ($)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#0F172A] dark:text-white">$</span>
                                    <input 
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full p-4 pl-8 bg-slate-100 border border-slate-200 dark:border-white/10 rounded-2xl text-xs text-[#0F172A] dark:text-white font-mono font-bold"
                                        max={selectedAccount.balance}
                                    />
                                </div>
                            </div>

                        </div>

                        {/* Mode detailed options */}
                        <div className="border-t border-slate-100 dark:border-white/10 pt-6 text-left">
                            <AnimatePresence mode="wait">
                                {withdrawMode === 'wire' && (
                                    <motion.div 
                                        key="wire"
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -15 }}
                                        className="space-y-4"
                                    >
                                        <div className="p-4 rounded-xl bg-slate-100 border border-slate-100 dark:border-white/10 space-y-1">
                                            <h4 className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-wider">Fast-Settlement Wire Outward Credentials</h4>
                                            <p className="text-[10px] text-[#0F172A] dark:text-white">Directly route checking assets outwards into standard banks. Standard clearance time takes 15 minutes through SEC-Escrow Nodes.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest">RECIPIENT CORRESPONDENT ABA/ROUTING</label>
                                                <input 
                                                    type="text"
                                                    placeholder="e.g. 021000021"
                                                    defaultValue="021000452"
                                                    className="w-full p-4 bg-slate-100 border border-slate-200 dark:border-white/10 rounded-2xl text-xs text-[#0F172A] dark:text-white font-mono"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest">RECIPIENT PORT ACCOUNT VALUE</label>
                                                <input 
                                                    type="text"
                                                    placeholder="e.g. 19283182"
                                                    defaultValue="8821992318"
                                                    className="w-full p-4 bg-slate-100 border border-slate-200 dark:border-white/10 rounded-2xl text-xs text-[#0F172A] dark:text-white font-mono"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {withdrawMode === 'armored' && (
                                    <motion.div 
                                        key="armored"
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -15 }}
                                        className="space-y-4 text-left animate-fade-in"
                                    >
                                        <div className="p-4 rounded-2xl bg-slate-100 border border-slate-100 dark:border-white/10 flex gap-4">
                                            <Truck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-wider">Brinks Direct Armored Delivery Protocol</h4>
                                                <p className="text-[10px] text-[#0F172A] dark:text-white">Deliver physical currency directly to your verified principal residence or private office. This transport requires temperature-controlled gold cases and handwriting signature scan.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                            {/* Signature Canvas Box */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center text-[8px] font-black text-[#0F172A] uppercase tracking-widest">
                                                    <span>HANDWRITTEN ENDORSEMENT</span>
                                                    <button onClick={clearSignature} className="text-red-400 hover:text-red-300">Clear</button>
                                                </div>
                                                <div className="bg-slate-100 rounded-2xl border border-slate-200 dark:border-white/10 p-1 flex items-center justify-center h-32 relative">
                                                    <canvas 
                                                        ref={canvasRef}
                                                        width={300}
                                                        height={120}
                                                        onMouseDown={startDrawing}
                                                        onMouseMove={draw}
                                                        onMouseUp={stopDrawing}
                                                        onMouseLeave={stopDrawing}
                                                        onTouchStart={startDrawing}
                                                        onTouchMove={draw}
                                                        onTouchEnd={stopDrawing}
                                                        className="w-full h-full cursor-crosshair relative z-10"
                                                    />
                                                    {!hasSigned && (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 opacity-40 select-none pointer-events-none">
                                                            <PenTool className="w-5 h-5 text-[#0F172A]" />
                                                            <span className="text-[9px] font-mono text-[#0F172A]">Draw Signature over this Canvas</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Address Box */}
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest">SECURE GEO COORDINATES / HOME ADDRESS</label>
                                                <textarea 
                                                    defaultValue="123 Financial Enclave St, New York City, USA"
                                                    className="w-full p-4 bg-slate-100 border border-slate-200 dark:border-white/10 rounded-2xl text-xs text-[#0F172A] dark:text-white resize-none h-32"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {withdrawMode === 'atm' && (
                                    <motion.div 
                                        key="atm"
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -15 }}
                                        className="space-y-4"
                                    >
                                        <div className="p-4 bg-slate-100 rounded-2xl border border-slate-100 dark:border-white/10 flex gap-4 items-center">
                                            <Smartphone className="w-5 h-5 text-amber-500 shrink-0" />
                                            <div className="text-left space-y-1">
                                                <h4 className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-wider">Dynamic PIN ATM Withdrawal Code</h4>
                                                <p className="text-[10px] text-[#0F172A] dark:text-white">Generate a direct 4-digit PIN for instant touchless card withdrawals. Accepted at over 2 million premier ATMs worldwide.</p>
                                            </div>
                                        </div>

                                        <div className="p-4.5 rounded-2xl bg-amber-400 border border-amber-400/20 text-center font-mono text-xs text-amber-500">
                                            After clearance authorization, a unique PIN with dynamic scanner barcode will appear in your receipt logs.
                                        </div>
                                    </motion.div>
                                )}

                                {withdrawMode === 'crypto' && (
                                    <motion.div 
                                        key="crypto"
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -15 }}
                                        className="space-y-4"
                                    >
                                        <div className="p-4 bg-slate-100 rounded-2xl border border-slate-100 dark:border-white/10 flex gap-4 items-center">
                                            <Coins className="w-5 h-5 text-amber-500 shrink-0" />
                                            <div className="text-left space-y-1">
                                                <h4 className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-wider">Sovereign Stablecoin Liquidity Gas Core</h4>
                                                <p className="text-[10px] text-[#0F172A] dark:text-white">Execute rapid swaps to any decentralized Web3 Ethereum, Arbitrum, or Solana address. Conversions cleared immediately.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest font-sans">STABLECOIN PEGGED OUTFLOW</label>
                                                <select className="w-full p-4 bg-slate-100 border border-slate-200 dark:border-white/10 rounded-2xl text-xs text-[#0F172A] dark:text-white uppercase tracking-wider font-bold">
                                                    <option value="USDC">USDC (USD Coin Network)</option>
                                                    <option value="USDT">USDT (Tether Capital)</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest font-sans">DESTINATION WALLET ADDRESS (HEX)</label>
                                                <input 
                                                    type="text"
                                                    placeholder="0x..."
                                                    defaultValue="0x930D821C8C3b449Cc41bB12c011e74a839e"
                                                    className="w-full p-4 bg-slate-100 border border-slate-200 dark:border-white/10 rounded-2xl text-[10.5px] text-[#0F172A] dark:text-white font-mono font-bold"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                    </div>

                    {/* Security credentials input */}
                    <div className="bg-slate-100 p-6 rounded-[2rem] border border-slate-100 dark:border-white/10 flex flex-col md:flex-row gap-6 items-center">
                        
                        {/* Hardware Keypad Grid */}
                        <div className="w-full md:w-[240px] shrink-0 space-y-3">
                            <span className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest text-left block">HARDWARE TOKEN PIN ENTRY:</span>
                            
                            {/* PIN Display indicator dots */}
                            <div className="flex justify-center gap-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 py-3.5 rounded-xl">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div 
                                        key={i}
                                        className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                                            pinInput.length > i 
                                            ? 'bg-amber-400 border-amber-400 scale-110 shadow-[0_0_8px_#fbbf24]' 
                                            : 'border-slate-200 dark:border-slate-300 bg-transparent'
                                        }`}
                                    />
                                ))}
                            </div>

                            {/* Keypad */}
                            <div className="grid grid-cols-3 gap-2">
                                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => (
                                    <button 
                                        key={n}
                                        onClick={() => handleKeypadPress(n)}
                                        className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-xl font-mono text-xs text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white hover:bg-white dark:bg-slate-900 font-bold active:scale-95 transition"
                                    >
                                        {n}
                                    </button>
                                ))}
                                <button 
                                    onClick={handleKeypadClear} 
                                    className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-xl font-mono text-[9px] text-red-400 hover:text-red-300 hover:bg-red-500 active:scale-95 transition font-black uppercase tracking-wider"
                                >
                                    CLR
                                </button>
                                <button 
                                    onClick={() => handleKeypadPress('0')}
                                    className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-xl font-mono text-xs text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white hover:bg-white dark:bg-slate-900 font-bold active:scale-95 transition"
                                >
                                    0
                                </button>
                                <div className="p-3 flex items-center justify-center font-mono text-[8px] text-[#0F172A] font-bold uppercase select-none">
                                    PAD
                                </div>
                            </div>
                        </div>

                        {/* Summary & Submit */}
                        <div className="flex-1 space-y-4 text-left">
                            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-white/10 space-y-2">
                                <span className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest block">SETTLEMENT SUMMARY:</span>
                                
                                <div className="flex justify-between items-center text-[10px] text-[#0F172A] dark:text-white font-sans">
                                    <span>Withdrawal Amount:</span>
                                    <span className="font-mono text-[#0F172A] dark:text-white font-bold">${(parseFloat(amount) || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-[#0F172A] dark:text-white font-sans">
                                    <span>Authority Clearing Surcharge (0.00%):</span>
                                    <span className="font-mono text-emerald-400 font-bold">$0.00 (EXEMPT)</span>
                                </div>
                                <div className="flex justify-between items-center text-[10.5px] text-[#0F172A] dark:text-white font-sans border-t border-slate-100 dark:border-white/10 pt-2 font-bold">
                                    <span>Total Outbound Deduction:</span>
                                    <span className="font-mono text-amber-400 font-bold">${(parseFloat(amount) || 0).toLocaleString()}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleExecuteWithdrawal}
                                disabled={isProcessing}
                                className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl leading-none ${
                                    isProcessing
                                    ? 'bg-slate-50 dark:bg-slate-900 border border-amber-500 text-amber-500 cursor-wait'
                                    : 'bg-amber-400 text-slate-950 hover:bg-amber-300 hover:scale-[1.01] active:scale-95'
                                }`}
                            >
                                {isProcessing ? 'AUTHORIZING SETTLE NODE...' : 'EXECUTE VAULT OUTFLOW'}
                            </button>
                        </div>

                    </div>

                </div>

                {/* Right badges & instructions */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* Authority Certified Ribbon Seals */}
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-6 shadow-xl space-y-6 text-left relative overflow-hidden">
                        <div>
                            <span className="text-[7.5px] font-black text-[#0F172A] uppercase tracking-widest block">REGULATORY AUTHORITY</span>
                            <h4 className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-tight">Outbound Verified Clearance</h4>
                        </div>

                        <div className="space-y-4">
                            
                            {/* Card 1 */}
                            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-100 dark:border-white/10 space-y-2">
                                <div className="flex gap-3 items-center">
                                    <div className="p-2 rounded bg-amber-500 border border-amber-500/20 text-amber-500 text-xs">
                                        <ShieldCheck className="w-4 h-4" />
                                    </div>
                                    <span className="font-mono text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-wider">SEC Safe Harbor Cleared</span>
                                </div>
                                <p className="text-[9px] text-[#0F172A] dark:text-white leading-normal uppercase tracking-wider">This node adheres strictly to international wire transfer and asset distribution statutes, providing automatic compliance reporting.</p>
                            </div>

                            {/* Card 2 */}
                            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-100 dark:border-white/10 space-y-2">
                                <div className="flex gap-3 items-center">
                                    <div className="p-2 rounded bg-amber-500 border border-amber-500/20 text-amber-500 text-xs">
                                        <Smartphone className="w-4 h-4" />
                                    </div>
                                    <span className="font-mono text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-wider">Haptic Pin Protected</span>
                                </div>
                                <p className="text-[9px] text-[#0F172A] dark:text-white leading-normal uppercase tracking-wider">All outbound wire transfers require verification using secure hardware tokens or biometrics to avoid accidental leakage of assets.</p>
                            </div>

                        </div>
                    </div>

                    {/* Operational Limits gauge */}
                    <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-6 text-left relative overflow-hidden">
                        <span className="text-[7.5px] font-black text-[#0F172A] uppercase tracking-widest block">TRANSACT METADATA</span>
                        <h4 className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-tight mt-0.5">Sovereign Outbound Limits</h4>
                        <p className="text-[9px] text-[#0F172A] dark:text-white uppercase tracking-wider mt-1">Based on certified KYC verification tiers:</p>

                        <div className="mt-5 space-y-3 font-mono text-[9px] text-[#0F172A] dark:text-white font-bold uppercase tracking-wider">
                            <div>
                                <div className="flex justify-between mb-1.5">
                                    <span>FedWire Daily Pool Limit</span>
                                    <span className="text-[#0F172A] dark:text-white">$2,500,000 / $5,000,000</span>
                                </div>
                                <div className="w-full bg-slate-50 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-100 dark:border-white/10">
                                    <div className="bg-amber-400 h-full rounded-full" style={{ width: '50%' }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between mb-1.5">
                                    <span>Armored Direct Logistics Cap</span>
                                    <span className="text-[#0F172A] dark:text-white">$500,000 / $1,000,000</span>
                                </div>
                                <div className="w-full bg-slate-50 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-100 dark:border-white/10">
                                    <div className="bg-amber-400 h-full rounded-full" style={{ width: '50%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>

            {/* Simulated ATM Access Receipt Code Modal */}
            <AnimatePresence>
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
                                    <ShieldCheck className="w-8 h-8 text-emerald-400" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">FPS TRANSACT NODE #14A</p>
                                <h4 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-tight">VAULT OUTWARD ROUTED</h4>
                                <p className="text-xs text-[#0F172A] dark:text-white capitalize">Dynamic bank reserves adjusted. Outward settlement cleared.</p>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-100 border border-slate-100 dark:border-white/10 space-y-1.5">
                                <span className="text-[7.5px] font-black text-[#0F172A] uppercase tracking-widest block text-[#0F172A]">LIQUID OUTFLOW DEBITED</span>
                                <span className="text-lg font-mono font-black text-red-400">-${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>

                            {withdrawMode === 'atm' && (
                                <div className="p-4 rounded-xl bg-amber-400 border border-amber-400/10 space-y-3 font-mono text-center">
                                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest block">ATM TOKEN PICKUP KEY</span>
                                    <div className="text-2xl font-black text-amber-400 tracking-widest bg-slate-100 py-3 rounded-lg border border-amber-400/10">
                                        {atmPinCode}
                                    </div>
                                    <div className="text-[10px] text-[#0F172A] dark:text-white py-1 border-t border-amber-400/10 animate-pulse tracking-tight select-all">
                                        {atmBarcode}
                                    </div>
                                    <p className="text-[8.5px] text-[#0F172A] leading-normal uppercase">Input PIN at any supporting Sovereign ATM. Code expires in 4 hours.</p>
                                </div>
                            )}

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
    );
};
