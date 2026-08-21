
import React, { useState, useEffect, useMemo } from 'react';
import { USER_PIN } from './constants';
import { db } from '../services/database';
import { useCurrency } from '../contexts/CurrencyContext';
import { 
    ArrowsRightLeftIcon, 
    SpinnerIcon, 
    TrendingUpIcon, 
    BtcIcon, 
    EthIcon, 
    LockClosedIcon, 
    ActivityIcon,
    ServerIcon,
    CheckCircleIcon,
    WalletIcon,
    BrandLogo,
    ChevronDownIcon,
    BankIcon,
    ShieldCheckIcon,
    CreditCardIcon
} from './Icons';
import { ComplianceHaltModal } from './ComplianceHaltModal';

// --- Types & Constants ---
export type SwapAssetType = 'CRYPTO' | 'FIAT_APP' | 'BANK';

interface SwapAsset {
    id: string;
    name: string;
    symbol: string;
    type: SwapAssetType;
    balance: number;
    icon?: React.ComponentType<{ className?: string }>;
    domain?: string; // For BrandLogo
    color: string;
}

interface CurrencyConverterProps {
    balances?: { usd: number; btc: number };
    accounts?: any[];
    setAccounts?: React.Dispatch<React.SetStateAction<any[]>>;
    cryptoHoldings?: any[];
    setCryptoHoldings?: React.Dispatch<React.SetStateAction<any[]>>;
    onSwap?: (fromId: string, toId: string, fromAmount: number, toAmount: number, rate: number, symbol: string) => void;
    onClose?: () => void;
}

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({ 
    balances, 
    accounts, 
    setAccounts, 
    cryptoHoldings, 
    setCryptoHoldings, 
    onSwap, 
    onClose 
}) => {
    const { rates } = useCurrency();

    // Simulated External Balances for non-bank/non-crypto options
    const [externalBalances, setExternalBalances] = useState({
        paypal: 2450.50,
        cashapp: 850.00,
        zelle: 0.00
    });

    const availableAssets = useMemo(() => {
        const list: SwapAsset[] = [];
        
        // Add real bank accounts
        if (accounts && accounts.length > 0) {
            accounts.forEach(acc => {
                list.push({
                    id: acc.id,
                    name: acc.nickname || acc.name || 'Account',
                    symbol: 'USD',
                    type: 'BANK',
                    balance: acc.balance || 0,
                    icon: BankIcon,
                    color: 'text-[#0F172A] dark:text-white'
                });
            });
        } else {
            // Fallback checking account
            list.push({
                id: 'usd_main',
                name: 'Checking Account',
                symbol: 'USD',
                type: 'BANK',
                balance: balances?.usd || 0,
                icon: BankIcon,
                color: 'text-[#0F172A] dark:text-white'
            });
        }

        // Add real crypto holdings
        const btcAmount = cryptoHoldings?.find(h => h.assetId === 'btc')?.amount ?? (balances?.btc || 0);
        list.push({
            id: 'btc',
            name: 'Bitcoin',
            symbol: 'BTC',
            type: 'CRYPTO',
            balance: btcAmount,
            icon: BtcIcon,
            color: 'text-[#F7931A]'
        });

        const ethAmount = cryptoHoldings?.find(h => h.assetId === 'eth')?.amount ?? 12.50;
        list.push({
            id: 'eth',
            name: 'Ethereum',
            symbol: 'ETH',
            type: 'CRYPTO',
            balance: ethAmount,
            icon: EthIcon,
            color: 'text-[#627EEA]'
        });

        // Add standard simulated external apps
        list.push(
            { id: 'paypal', name: 'PayPal', symbol: 'USD', type: 'FIAT_APP', balance: externalBalances.paypal, domain: 'paypal.com', color: 'text-[#003087]' },
            { id: 'cashapp', name: 'Cash App', symbol: 'USD', type: 'FIAT_APP', balance: externalBalances.cashapp, domain: 'cash.app', color: 'text-[#00D632]' },
            { id: 'zelle', name: 'Zelle', symbol: 'USD', type: 'FIAT_APP', balance: externalBalances.zelle, domain: 'zellepay.com', color: 'text-[#6D1ED4]' }
        );

        return list;
    }, [accounts, cryptoHoldings, balances, externalBalances]);

    // State
    const [fromAsset, setFromAsset] = useState<SwapAsset | null>(null);
    const [toAsset, setToAsset] = useState<SwapAsset | null>(null);
    const [amount, setAmount] = useState('');
    const [isSelectorOpen, setIsSelectorOpen] = useState<'from' | 'to' | null>(null);
    
    // Execution State
    const [step, setStep] = useState<'input' | 'pin' | 'compliance' | 'processing' | 'success'>('input');
    const [pin, setPin] = useState('');
    const [progress, setProgress] = useState(0);
    const [processingLog, setProcessingLog] = useState('');

    // Initialize asset selection on load once availableAssets are computed
    useEffect(() => {
        if (availableAssets.length >= 2 && (!fromAsset || !toAsset)) {
            const defaultChecking = availableAssets.find(a => a.type === 'BANK') || availableAssets[0];
            const defaultCrypto = availableAssets.find(a => a.type === 'CRYPTO') || availableAssets[1];
            setFromAsset(defaultChecking);
            setToAsset(defaultCrypto);
        }
    }, [availableAssets]);

    // Keep active selections synchronized when the balances update
    useEffect(() => {
        if (fromAsset) {
            const updated = availableAssets.find(a => a.id === fromAsset.id);
            if (updated && updated.balance !== fromAsset.balance) {
                setFromAsset(updated);
            }
        }
        if (toAsset) {
            const updated = availableAssets.find(a => a.id === toAsset.id);
            if (updated && updated.balance !== toAsset.balance) {
                setToAsset(updated);
            }
        }
    }, [availableAssets, fromAsset, toAsset]);

    // --- Calculations ---
    const getPrice = (asset: SwapAsset) => {
        if (asset.symbol === 'BTC') {
            const rate = rates['BTC'];
            return rate && rate > 0 ? 1 / rate : 64230.50;
        }
        if (asset.symbol === 'ETH') {
            const rate = rates['ETH'];
            return rate && rate > 0 ? 1 / rate : 3450.25;
        }
        if (asset.symbol === 'SOL') {
            const rate = rates['SOL'];
            return rate && rate > 0 ? 1 / rate : 145.80;
        }
        // For other currencies, look up in real-time rates (per USD)
        const rate = rates[asset.symbol];
        if (rate && rate > 0) {
            return 1 / rate; // Price of 1 unit in USD
        }
        return 1; // Default to 1 USD
    };

    const fromPrice = fromAsset ? getPrice(fromAsset) : 1;
    const toPrice = toAsset ? getPrice(toAsset) : 1;
    
    // Exchange Rate: How many TO units for 1 FROM unit
    const exchangeRate = fromPrice / toPrice;
    
    const numericAmount = parseFloat(amount) || 0;
    const grossReceive = numericAmount * exchangeRate;
    
    // Fee Logic: Crypto<->Fiat is expensive (1.5%), Fiat<->Fiat is cheap (0.5%)
    const isCryptoSwap = fromAsset ? (fromAsset.type === 'CRYPTO' || toAsset?.type === 'CRYPTO') : false;
    const feePercent = 0;
    const feeAmount = numericAmount * feePercent; // Fee in FROM currency
    const netReceive = (numericAmount - feeAmount) * exchangeRate;

    // --- Handlers ---
    const handleSwapAssets = () => {
        if (!fromAsset || !toAsset) return;
        const temp = fromAsset;
        setFromAsset(toAsset);
        setToAsset(temp);
        setAmount(''); // Reset amount on swap to avoid confusion
    };

    const handlePercentage = (pct: number) => {
        if (!fromAsset) return;
        const max = fromAsset.balance;
        setAmount((max * pct).toFixed(fromAsset.type === 'CRYPTO' ? 6 : 2));
    };

    const handleInitiate = () => {
        if (!fromAsset) return;
        if (numericAmount <= 0) return;
        if (numericAmount > fromAsset.balance) {
            alert('Insufficient balance');
            return;
        }
        setStep('pin');
    };

    const handlePinSubmit = async () => {
        const email = db.getCurrentUserEmail();
        const isValid = await db.verifyPin(email, pin);
        if (!isValid) {
            alert('Invalid PIN');
            return;
        }
        // If High Value or Crypto, trigger compliance
        if (numericAmount * fromPrice > 5000 || isCryptoSwap) {
            setStep('compliance');
        } else {
            startProcessing();
        }
    };

    const startProcessing = () => {
        if (!fromAsset || !toAsset) return;
        setStep('processing');
        
        // Simulation Sequence
        const sequence = [
            { pct: 10, msg: `Authenticating with ${fromAsset.name}...` },
            { pct: 30, msg: "Verifying liquidity pool..." },
            { pct: 50, msg: `Converting ${fromAsset.symbol} to ${toAsset.symbol}...` },
            { pct: 70, msg: "Broadcasting settlement..." },
            { pct: 90, msg: `Depositing to ${toAsset.name}...` },
            { pct: 100, msg: "Complete" }
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i >= sequence.length) {
                clearInterval(interval);
                
                // Update local simulated external balances if from or to are external
                if (['paypal', 'cashapp', 'zelle'].includes(fromAsset.id)) {
                    setExternalBalances(prev => ({
                        ...prev,
                        [fromAsset.id]: Math.max(0, prev[fromAsset.id as keyof typeof prev] - numericAmount)
                    }));
                }
                if (['paypal', 'cashapp', 'zelle'].includes(toAsset.id)) {
                    setExternalBalances(prev => ({
                        ...prev,
                        [toAsset.id]: prev[toAsset.id as keyof typeof prev] + netReceive
                    }));
                }

                if (onSwap) {
                    onSwap(fromAsset.id, toAsset.id, numericAmount, netReceive, exchangeRate, toAsset.symbol);
                }
                setStep('success');
                return;
            }
            setProgress(sequence[i].pct);
            setProcessingLog(sequence[i].msg);
            i++;
        }, 800);
    };

    // --- Render Components ---

    const AssetSelector = ({ type }: { type: 'from' | 'to' }) => (
        <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900 z-50 flex flex-col animate-fade-in">
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                <h3 className="font-bold text-[#0F172A] dark:text-white">Select {type === 'from' ? 'Source' : 'Destination'}</h3>
                <button onClick={() => setIsSelectorOpen(null)} className="p-2 bg-white rounded-full text-[#0F172A] dark:text-white dark:bg-slate-800"><ChevronDownIcon className="w-5 h-5 rotate-180" /></button>
            </div>
            <div className="p-4 space-y-2 overflow-y-auto">
                {availableAssets.map(asset => {
                    const isDisabled = type === 'to' && fromAsset && asset.id === fromAsset.id; // Can't swap to same
                    if (isDisabled) return null;
                    
                    return (
                        <button 
                            key={asset.id}
                            onClick={() => {
                                if (type === 'from') setFromAsset(asset);
                                else setToAsset(asset);
                                setIsSelectorOpen(null);
                            }}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900 hover:bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-lg">
                                    {asset.domain ? (
                                        <BrandLogo domain={asset.domain} name={asset.name} fallback={WalletIcon} className="w-6 h-6 object-contain" />
                                    ) : (
                                        asset.icon && <asset.icon className={`w-6 h-6 ${asset.color}`} />
                                    )}
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-[#0F172A] dark:text-white group-hover:text-primary transition-colors">{asset.name}</p>
                                    <p className="text-[10px] text-[#0F172A] uppercase tracking-wider">{asset.type}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-mono font-bold text-[#0F172A] dark:text-white">
                                    {asset.balance.toLocaleString(undefined, { maximumFractionDigits: asset.type === 'CRYPTO' ? 4 : 2 })}
                                </p>
                                <p className="text-[10px] text-[#0F172A]">{asset.symbol}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    if (!fromAsset || !toAsset) {
        return (
            <div className="bg-[#0c121e] rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden relative font-sans h-full flex flex-col min-h-[600px] w-full max-w-lg mx-auto items-center justify-center p-6 text-[#0F172A]">
                <SpinnerIcon className="w-8 h-8 text-primary animate-spin mb-4" />
                <p className="text-sm font-bold">Securing Liquidity Bridge...</p>
            </div>
        );
    }

    return (
        <>
            {/* Compliance Modal Hook */}
            {step === 'compliance' && (
                <ComplianceHaltModal 
                    isOpen={true} 
                    amount={numericAmount * fromPrice} 
                    onVerified={startProcessing} 
                    onCancel={() => setStep('input')} 
                    isCrypto={isCryptoSwap}
                />
            )}

            <div className="bg-[#0c121e] rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden relative font-sans h-full flex flex-col min-h-[600px] w-full max-w-lg mx-auto">
                {/* Background FX */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
                
                {/* Header */}
                <div className="p-6 flex justify-between items-center relative z-10 bg-slate-50 dark:bg-slate-900  border-b border-slate-100 dark:border-white/10">
                    <div>
                        <h2 className="text-xl font-black text-[#0F172A] dark:text-white tracking-tight">Liquidity Bridge</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest">Network Active</span>
                        </div>
                    </div>
                    {onClose && (
                         <button onClick={onClose} className="p-2 bg-white rounded-full hover:bg-white transition-colors dark:bg-slate-800">
                             <ChevronDownIcon className="w-6 h-6 text-[#0F172A] dark:text-white" />
                         </button>
                    )}
                </div>

                {/* Selectors Overlay */}
                {isSelectorOpen && <AssetSelector type={isSelectorOpen} />}

                {/* Main Body */}
                <div className="p-6 flex-grow flex flex-col relative z-10">
                    
                    {step === 'input' && (
                        <div className="space-y-4">
                            {/* FROM CARD */}
                            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-5 space-y-4 shadow-lg">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Selling / Withdraw From</span>
                                    <span className="text-[10px] font-mono text-[#0F172A] dark:text-white">Balance: {fromAsset.balance.toFixed(4)}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setIsSelectorOpen('from')}
                                        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 transition-all min-w-[140px]"
                                    >
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center">
                                             {fromAsset.domain ? (
                                                <BrandLogo domain={fromAsset.domain} name={fromAsset.name} fallback={WalletIcon} className="w-5 h-5 object-contain" />
                                            ) : (
                                                fromAsset.icon && <fromAsset.icon className={`w-5 h-5 ${fromAsset.color}`} />
                                            )}
                                        </div>
                                        <span className="text-sm font-bold text-[#0F172A] dark:text-white">{fromAsset.symbol}</span>
                                        <ChevronDownIcon className="w-4 h-4 text-[#0F172A] ml-auto" />
                                    </button>
                                    <input 
                                        type="number" 
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="bg-transparent text-right text-3xl font-mono font-bold text-[#0F172A] dark:text-white outline-none w-full placeholder-slate-700"
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    {[0.25, 0.5, 1].map(pct => (
                                        <button key={pct} onClick={() => handlePercentage(pct)} className="text-[9px] font-bold bg-white hover:bg-primary/20 hover:text-primary px-2 py-1 rounded text-[#0F172A] transition-colors dark:bg-slate-800">
                                            {pct * 100}%
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Swap Switcher */}
                            <div className="flex justify-center -my-3 relative z-20">
                                <button onClick={handleSwapAssets} className="bg-white dark:bg-slate-900 border-4 border-[#0c121e] rounded-full p-2.5 shadow-xl hover:bg-slate-100 dark:bg-slate-700 hover:scale-110 transition-all text-primary">
                                    <ArrowsRightLeftIcon className="w-5 h-5 rotate-90" />
                                </button>
                            </div>

                            {/* TO CARD */}
                            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-5 space-y-4 shadow-lg">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Buying / Deposit To</span>
                                    <span className="text-[10px] font-mono text-[#0F172A] dark:text-white">Balance: {toAsset.balance.toFixed(4)}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setIsSelectorOpen('to')}
                                        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 transition-all min-w-[140px]"
                                    >
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center">
                                             {toAsset.domain ? (
                                                <BrandLogo domain={toAsset.domain} name={toAsset.name} fallback={WalletIcon} className="w-5 h-5 object-contain" />
                                            ) : (
                                                toAsset.icon && <toAsset.icon className={`w-5 h-5 ${toAsset.color}`} />
                                            )}
                                        </div>
                                        <span className="text-sm font-bold text-[#0F172A] dark:text-white">{toAsset.symbol}</span>
                                        <ChevronDownIcon className="w-4 h-4 text-[#0F172A] ml-auto" />
                                    </button>
                                    <div className="text-right w-full">
                                        <p className="text-3xl font-mono font-bold text-emerald-400">
                                            {numericAmount > 0 ? `~${netReceive.toLocaleString(undefined, { maximumFractionDigits: toAsset.type === 'CRYPTO' ? 6 : 2 })}` : '0.00'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Rate Info */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-white/10 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-[#0F172A]">Bridge Rate</span>
                                    <span className="text-[#0F172A] dark:text-white font-mono">1 {fromAsset.symbol} ≈ {exchangeRate.toLocaleString(undefined, { maximumFractionDigits: 6 })} {toAsset.symbol}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-[#0F172A]">Network Fee ({isCryptoSwap ? '1.5%' : '0.5%'})</span>
                                    <span className="text-[#0F172A] dark:text-white font-mono">-{feeAmount.toFixed(4)} {fromAsset.symbol}</span>
                                </div>
                                <div className="h-px bg-white my-1 dark:bg-slate-800"></div>
                                <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-wide">
                                    <ShieldCheckIcon className="w-3 h-3" /> Best Execution Route Found
                                </div>
                            </div>

                            <button 
                                onClick={handleInitiate}
                                disabled={numericAmount <= 0}
                                className="w-full py-5 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                            >
                                Preview & Authenticate
                            </button>
                        </div>
                    )}

                    {step === 'pin' && (
                        <div className="flex flex-col items-center justify-center flex-grow space-y-8 animate-fade-in">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center shadow-lg border border-slate-200 dark:border-white/10">
                                <LockClosedIcon className="w-8 h-8 text-primary" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Authorize Swap</h3>
                                <p className="text-[#0F172A] dark:text-white text-sm mt-2">Enter your secure PIN to bridge assets.</p>
                            </div>
                            <input 
                                type="password" 
                                value={pin}
                                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                className="bg-slate-100 border border-slate-300 dark:border-black/10 rounded-2xl text-center text-4xl text-[#0F172A] dark:text-white tracking-[1em] p-5 w-64 focus:border-primary outline-none transition-all shadow-inner font-mono"
                                placeholder="••••"
                                autoFocus
                                maxLength={4}
                            />
                            <div className="flex gap-4 w-full">
                                <button onClick={() => setStep('input')} className="flex-1 py-4 text-[#0F172A] font-bold hover:text-[#0F172A] dark:text-white transition-colors">Cancel</button>
                                <button onClick={handlePinSubmit} disabled={pin.length !== 4} className="flex-1 py-4 bg-primary text-[#0F172A] dark:text-white rounded-xl font-bold shadow-lg disabled:opacity-70">Confirm</button>
                            </div>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="flex flex-col items-center justify-center flex-grow space-y-8 animate-fade-in">
                            <div className="relative w-32 h-32">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="none" className="text-[#1E293B]" />
                                    <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="none" className="text-primary transition-all duration-300" strokeDasharray={377} strokeDashoffset={377 - (377 * progress) / 100} />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <ServerIcon className="w-8 h-8 text-[#0F172A] dark:text-white mb-1 animate-pulse" />
                                    <span className="text-xs font-bold text-[#0F172A] dark:text-white">{progress}%</span>
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Bridging Assets...</h3>
                                <p className="text-primary font-mono text-xs mt-2">{processingLog}</p>
                            </div>
                            <div className="w-full bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-white/10 font-mono text-[10px] text-[#0F172A] h-24 overflow-hidden">
                                <p>{'>'} Init_Handshake_Protocol</p>
                                <p>{'>'} Validating_Liquidity_Pool</p>
                                <p>{'>'} Locking_Rate: {exchangeRate.toFixed(6)}</p>
                                <p>{'>'} Signing_Contract_0x8f2...</p>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center flex-grow space-y-8 animate-fade-in-up">
                            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                                <CheckCircleIcon className="w-12 h-12 text-emerald-500" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-2xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Swap Complete</h3>
                                <p className="text-[#0F172A] dark:text-white text-sm mt-2">Assets successfully bridged to destination.</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10 w-full">
                                <div className="flex justify-between items-center text-sm mb-2">
                                    <span className="text-[#0F172A]">Sent</span>
                                    <span className="text-[#0F172A] dark:text-white font-mono">{numericAmount} {fromAsset.symbol}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm mb-4">
                                    <span className="text-[#0F172A]">Received</span>
                                    <span className="text-emerald-400 font-mono font-bold">+{netReceive.toLocaleString(undefined, {maximumFractionDigits: 4})} {toAsset.symbol}</span>
                                </div>
                                <div className="h-px bg-white mb-4 dark:bg-slate-800"></div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-[#0F172A]">Transaction ID</span>
                                    <span className="text-[#0F172A] dark:text-white font-mono">0x{Math.random().toString(16).substr(2, 10).toUpperCase()}</span>
                                </div>
                            </div>
                            <button onClick={() => { setStep('input'); setAmount(''); }} className="w-full py-4 bg-white text-[#0F172A] font-bold rounded-xl shadow-lg hover:bg-slate-200 transition-all dark:bg-slate-800">
                                New Swap
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
