import React, { useState, useEffect, useMemo } from 'react';
import { 
    TrendingUpIcon, 
    ArrowsRightLeftIcon, 
    SpinnerIcon, 
    PiggyBankIcon, 
    LockClosedIcon, 
    CheckCircleIcon,
    CurrencyDollarIcon,
    ShieldCheckIcon,
    ChartBarIcon,
    ArrowLongRightIcon,
    PlusCircleIcon,
    XIcon
} from './Icons';
import { EXCHANGE_RATES } from './constants';
import { CurrencyConverter } from './CurrencyConverter';
import { getFlagUrl } from '../utils/flags';
import { fetchMarketData } from '../services/financeService';
import { Account, UserProfile, Transaction, TransactionStatus } from '../types';
import { db } from '../services/database';
import { AssetAllocationIntelligence } from './AssetAllocationIntelligence';

interface InvestmentsProps {
    accounts: Account[];
    setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
    userProfile: UserProfile;
    addNotification: (type: any, title: string, message: string) => void;
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const initialMarketIndices = [
    { name: 'S&P 500', value: 'Loading...', change: '...', percentChange: '...', positive: true, history: [] as number[] },
    { name: 'NASDAQ', value: 'Loading...', change: '...', percentChange: '...', positive: true, history: [] as number[] },
    { name: 'Dow Jones', value: 'Loading...', change: '...', percentChange: '...', positive: true, history: [] as number[] },
    { name: 'FTSE 100', value: 'Loading...', change: '...', percentChange: '...', positive: true, history: [] as number[] },
];

const INDEX_MAPPING = [
    { name: 'S&P 500', symbol: '^GSPC' },
    { name: 'NASDAQ', symbol: '^IXIC' },
    { name: 'Dow Jones', symbol: '^DJI' },
    { name: 'FTSE 100', symbol: '^FTSE' }
];

interface InvestmentAsset {
    symbol: string;
    name: string;
    category: string;
    expectedYield: number;
    description: string;
    icon: string;
}

const SUPPORTED_ASSETS: InvestmentAsset[] = [
    { symbol: '$FPB.IY', name: 'Sovereign Core High-Yield Index', category: 'High-Yield Liquid Bonds', expectedYield: 5.50, description: 'Direct high-priority sovereign-grade debt allocation protecting liquid reserve assets.', icon: '🏦' },
    { symbol: '$SPY.EQ', name: 'Corporate Titans Equity Basket', category: 'Global Public Equities', expectedYield: 8.25, description: 'Direct fractional exposure across peak technical leaders and multinational conglomerates.', icon: '📈' },
    { symbol: '$GLD.AU', name: 'Sovereign Precious Vault Bullion', category: 'Tangible Precious Gold', expectedYield: 4.10, description: 'Direct physical bullion allocations secured inside first-class vault networks.', icon: '💎' },
    { symbol: '$FPB.ALP', name: 'Sovereign Alpha Growth ETF', category: 'Strategic Growth Reserve', expectedYield: 12.00, description: 'Active growth engine selecting venture-class technology and liquid commodity options.', icon: '⚡' },
];

interface Holding {
    symbol: string;
    shares: number;
    purchasePrice: number;
    currentValuation: number;
}

const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    // Create SVG points
    const points = data.map((p, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((p - min) / range) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="h-12 mt-3 opacity-60">
             <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <polyline 
                    fill="none" 
                    stroke={color} 
                    strokeWidth="3" 
                    points={points} 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    vectorEffect="non-scaling-stroke" 
                />
            </svg>
        </div>
    );
};

const IndexCard: React.FC<{ name: string; value: string; change: string; percentChange: string; positive: boolean; history: number[] }> = ({ name, value, change, percentChange, positive, history }) => {
    const colorClass = positive ? 'text-green-400' : 'text-rose-400';
    const strokeColor = positive ? '#4ade80' : '#f43f5e';

    return (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 p-6 rounded-2xl shadow-digital transition-all hover:border-slate-200 dark:border-white/15 hover:bg-slate-850 group overflow-hidden relative">
             <div className="relative z-10">
                <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">{name}</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-2xl font-black text-slate-100 font-mono tracking-tight">{value}</p>
                </div>
                <p className={`text-xs font-bold mt-1 ${colorClass}`}>{change} ({percentChange})</p>
            </div>
            {history && history.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-2">
                    <Sparkline data={history} color={strokeColor} />
                </div>
            )}
        </div>
    );
};

const KeyRates: React.FC = () => {
    const [rates, setRates] = useState<{ EUR: number, GBP: number, JPY: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(60);

    const fetchRates = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            
            const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('Gateway connectivity issue.');
            
            const data = await response.json();
            if (data && data.rates) {
                setRates({
                    EUR: data.rates.EUR || EXCHANGE_RATES.EUR,
                    GBP: data.rates.GBP || EXCHANGE_RATES.GBP,
                    JPY: data.rates.JPY || EXCHANGE_RATES.JPY,
                });
            } else {
                throw new Error('Malformed node data.');
            }
            setCountdown(60);
        } catch (error) {
            setRates({
                EUR: EXCHANGE_RATES.EUR,
                GBP: EXCHANGE_RATES.GBP,
                JPY: EXCHANGE_RATES.JPY,
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRates();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    fetchRates();
                    return 60;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const keyRateData = [
        { currency: 'EUR', name: 'Euro', flag: 'eu' },
        { currency: 'GBP', name: 'Pound Sterling', flag: 'gb' },
        { currency: 'JPY', name: 'Japanese Yen', flag: 'jp' },
    ];

    return (
         <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-3xl shadow-digital p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
            <div className="flex justify-between items-center mb-6 relative z-10">
                 <h3 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <ArrowsRightLeftIcon className="w-5 h-5 text-primary" />
                    Key Exchange Feed
                 </h3>
                 <div className="flex items-center space-x-2 text-[10px] text-[#0F172A] font-bold uppercase tracking-widest">
                    <SpinnerIcon className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>{isLoading ? 'Updating...' : `Refresh in ${countdown}s`}</span>
                </div>
            </div>
            {error && <p className="text-rose-400 text-xs mb-4 font-bold uppercase tracking-widest">{error}</p>}
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
                {keyRateData.map(({ currency, name, flag }) => (
                    <div key={currency} className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-white/10 hover:border-primary/20 transition-all">
                        <div className="flex items-center space-x-3 mb-3">
                            <img src={getFlagUrl(flag)} alt={name} className="w-6 h-auto rounded shadow-lg" />
                            <div>
                                <p className="font-extrabold text-[#0F172A] dark:text-[#1E293B] font-mono text-sm leading-none">{currency}/USD</p>
                                <p className="text-[9px] text-[#0F172A] font-bold uppercase tracking-widest mt-0.5">{name}</p>
                            </div>
                        </div>
                        {isLoading && !rates ? (
                            <div className="h-6 w-20 bg-white dark:bg-slate-900 rounded animate-pulse"></div>
                        ) : rates && (
                            <p className="text-2xl font-mono font-black text-[#0F172A] dark:text-white tracking-widest">
                                {rates[currency as keyof typeof rates]?.toFixed(4) || '---'}
                            </p>
                        )}
                    </div>
                ))}
             </div>
         </div>
    );
};

export const Investments: React.FC<InvestmentsProps> = ({ 
    accounts = [], 
    setAccounts, 
    userProfile, 
    addNotification, 
    transactions, 
    setTransactions 
}) => {
    const baseCurrency = 'USD';
    const rates = Object.entries(EXCHANGE_RATES).filter(([currency]) => currency !== baseCurrency);
    const [marketIndices, setMarketIndices] = useState(initialMarketIndices);

    // Dynamic calculator state
    const [initialAmount, setInitialAmount] = useState<number>(10000);
    const [monthlyContribution, setMonthlyContribution] = useState<number>(500);
    const [selectedYears, setSelectedYears] = useState<number>(10);
    const [selectedStrategyType, setSelectedStrategyType] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');

    // Portfolio trading engine state
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
    const [selectedAsset, setSelectedAsset] = useState<InvestmentAsset>(SUPPORTED_ASSETS[0]);
    const [selectedPaymentAccount, setSelectedPaymentAccount] = useState<string>('');
    const [tradeCapital, setTradeCapital] = useState<string>('1000');
    const [tradeStep, setTradeStep] = useState<'form' | 'pin' | 'processing' | 'success'>('form');
    const [pin, setPin] = useState<string>('');
    const [tradeError, setTradeError] = useState<string>('');
    const [lastReceipt, setLastReceipt] = useState<any>(null);

    // Initial load of custom assets/holdings
    useEffect(() => {
        // Fetch from database in reality, but for now just start empty if no DB hook available here.
        setHoldings([]);

        if (accounts.length > 0) {
            setSelectedPaymentAccount(accounts[0].id);
        }
    }, [accounts]);

    useEffect(() => {
        const updateMarketData = async () => {
            const promises = INDEX_MAPPING.map(async (idx, i) => {
                const data = await fetchMarketData(idx.symbol);
                if (data) {
                    return {
                        name: idx.name,
                        value: data.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                        change: (data.change >= 0 ? '+' : '') + data.change.toFixed(2),
                        percentChange: (data.changePercent >= 0 ? '+' : '') + data.changePercent.toFixed(2) + '%',
                        positive: data.change >= 0,
                        history: data.history
                    };
                }
                return {
                    name: idx.name,
                    value: ['5,487.03', '17,857.02', '38,778.10', '8,281.55'][i],
                    change: ['+21.43', '+167.64', '-62.30', '+4.57'][i],
                    percentChange: ['+0.39%', '+0.95%', '-0.16%', '+0.06%'][i],
                    positive: [true, true, false, true][i],
                    history: []
                };
            });

            const results = await Promise.all(promises);
            setMarketIndices(results);
        };

        updateMarketData();
    }, []);

    // 1. Math Projections
    const selectedApy = useMemo(() => {
        switch (selectedStrategyType) {
            case 'conservative': return 4.50;
            case 'balanced': return 8.25;
            case 'aggressive': return 12.00;
        }
    }, [selectedStrategyType]);

    // Comparison traditional bank rate (often ~1.01% APY on common accounts)
    const traditionalBankApy = 1.05;

    const projectionsData = useMemo(() => {
        let fpbBalance = initialAmount;
        let traditionalBalance = initialAmount;
        const yearsArray = [];

        const monthlyRateFpb = (selectedApy / 100) / 12;
        const monthlyRateTrad = (traditionalBankApy / 100) / 12;

        for (let year = 1; year <= selectedYears; year++) {
            for (let month = 0; month < 12; month++) {
                fpbBalance = (fpbBalance + monthlyContribution) * (1 + monthlyRateFpb);
                traditionalBalance = (traditionalBalance + monthlyContribution) * (1 + monthlyRateTrad);
            }
            yearsArray.push({
                year,
                fpb: Math.round(fpbBalance),
                traditional: Math.round(traditionalBalance),
                gap: Math.round(fpbBalance - traditionalBalance)
            });
        }
        return yearsArray;
    }, [initialAmount, monthlyContribution, selectedYears, selectedApy]);

    const latestProjection = useMemo(() => {
        if (projectionsData.length === 0) return { fpb: 0, traditional: 0, gap: 0 };
        return projectionsData[projectionsData.length - 1];
    }, [projectionsData]);

    // 2. Custom Trade Execution
    const selectedAccountRecord = useMemo(() => {
        return accounts.find(a => a.id === selectedPaymentAccount);
    }, [selectedPaymentAccount, accounts]);

    const handleOpenTradeConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        setTradeError('');

        const numericVol = parseFloat(tradeCapital);
        if (isNaN(numericVol) || numericVol <= 0) {
            setTradeError('Input valid operational volume.');
            return;
        }

        if (tradeType === 'buy') {
            if (!selectedAccountRecord || selectedAccountRecord.balance < numericVol) {
                setTradeError('Insufficient checking/savings resource.');
                return;
            }
        } else {
            // Check holds
            const holding = holdings.find(h => h.symbol === selectedAsset.symbol);
            const holdingValuation = holding ? (holding.shares * selectedAsset.expectedYield) : 0; // Simplified
            const availableValuation = holding ? holding.currentValuation : 0;
            if (!holding || availableValuation < numericVol) {
                setTradeError(`Insufficient holding position. (Available: $${availableValuation.toLocaleString()})`);
                return;
            }
        }

        setTradeStep('pin');
    };

    const handleExecuteTrade = async () => {
        setTradeError('');
        const email = db.getCurrentUserEmail();
        const isValid = await db.verifyPin(email, pin);
        if (!isValid) {
            setTradeError('Invalid Security PIN.');
            return;
        }

        setTradeStep('processing');
        const numericVol = parseFloat(tradeCapital);

        setTimeout(() => {
            // Deduct or Credit Account
            setAccounts(prev => prev.map(acc => {
                if (acc.id === selectedPaymentAccount) {
                    const newBal = tradeType === 'buy' ? (acc.balance - numericVol) : (acc.balance + numericVol);
                    // Also persist back to fake local storage or database provider
                    db.updateAccountBalance(email, acc.id, newBal);
                    return { ...acc, balance: newBal };
                }
                return acc;
            }));

            // Sync holdings state and localstorage
            let updatedHoldings = [...holdings];
            const searchIndex = updatedHoldings.findIndex(h => h.symbol === selectedAsset.symbol);

            if (tradeType === 'buy') {
                if (searchIndex >= 0) {
                    updatedHoldings[searchIndex].shares += numericVol / 1.00; // Share price of $1.00 for clean ledger scaling
                    updatedHoldings[searchIndex].currentValuation += numericVol;
                } else {
                    updatedHoldings.push({
                        symbol: selectedAsset.symbol,
                        shares: numericVol,
                        purchasePrice: 1.00,
                        currentValuation: numericVol
                    });
                }
            } else {
                if (searchIndex >= 0) {
                    updatedHoldings[searchIndex].shares -= numericVol / 1.00;
                    updatedHoldings[searchIndex].currentValuation -= numericVol;
                    if (updatedHoldings[searchIndex].shares <= 0) {
                        updatedHoldings.splice(searchIndex, 1);
                    }
                }
            }
            setHoldings(updatedHoldings);

            // Log official transactional logging
            const references = `TX-${Date.now().toString().slice(-6).toUpperCase()}`;
            const newTx: Transaction = {
                id: references,
                accountId: selectedPaymentAccount,
                recipient: { 
                    id: 'rec_wealth_ex', 
                    fullName: 'First Pacific Wealth Exchange', 
                    bankName: 'First Pacific Reserve Bank', 
                    accountNumber: 'RESERVE-EX-8588', 
                    country: 'Switzerland' as any,
                    realDetails: { 
                        accountNumber: 'RESERVE-EX-8588',
                        swiftBic: 'FPBCHZH1XXX'
                    } 
                },
                sendAmount: numericVol,
                receiveAmount: numericVol,
                fee: 0,
                exchangeRate: 1,
                status: TransactionStatus.COMPLETED,
                statusTimestamps: { 
                    [TransactionStatus.SUBMITTED]: new Date(), 
                    [TransactionStatus.COMPLETED]: new Date() 
                },
                description: `${tradeType === 'buy' ? 'Positions Acquired' : 'Liquidated Allocation'}: ${selectedAsset.name} (${selectedAsset.symbol})`,
                type: tradeType === 'buy' ? 'debit' : 'credit',
                estimatedArrival: new Date()
            };

            setTransactions(prev => [newTx, ...prev]);
            db.saveTransaction(newTx);
            db.logUserAction(tradeType === 'buy' ? 'INVESTMENT_PURCHASE' : 'INVESTMENT_LIQUIDATION', { asset: selectedAsset.symbol, amount: numericVol });

            // Trigger notification
            addNotification(
                'ALERT', 
                tradeType === 'buy' ? 'Asset Allocation Fully Locked' : 'Liquified Position Verified', 
                `Successfully routed $${numericVol.toLocaleString()} into ${selectedAsset.symbol}.`
            );

            setLastReceipt({
                id: references,
                timestamp: new Date().toLocaleString(),
                asset: selectedAsset.name,
                symbol: selectedAsset.symbol,
                vol: numericVol,
                type: tradeType === 'buy' ? 'ALLOCATE' : 'LIQUIDATE',
                targetNode: selectedAccountRecord?.nickname || 'Strategic Asset checking'
            });

            setTradeStep('success');
            setPin('');
            setTradeCapital('1000');
        }, 2200);
    };

    // Calculate overall simulated yield
    const totalInvestingBalance = holdings.reduce((sum, h) => sum + h.currentValuation, 0);

    return (
        <div className="space-y-10 animate-fade-in-up pb-16 text-slate-100">
            {/* Header Slogan */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-950 primary- border border-slate-100 dark:border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 primary- rounded-full blur-[100px]"></div>
                <div className="relative z-10 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 primary- border primary- rounded-full mb-4">
                        <ShieldCheckIcon className="w-4 h-4 primary-" />
                        <span className="text-[10px] font-black primary- uppercase tracking-widest">Premium Wealth Desk</span>
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-black text-[#0F172A] dark:text-white tracking-tight uppercase leading-none">
                        Sovereign Wealth Accelerator
                    </h2>
                    <p className="text-[#0F172A] dark:text-white text-sm sm:text-md mt-4 font-semibold leading-relaxed">
                        Keeping your legacy capital locked in traditional commercial bank accounts is costing you fortunes. 
                        With First Pacific’s premium sovereign asset optimization, your deposits yield up to <span className="text-emerald-400 font-extrabold text-lg">5.50% APY</span> with active institutional-grade market hedging. Clear, stable wealth acceleration built exclusively for high-net-worth sovereign partners. 
                    </p>
                </div>
            </div>

            {/* Simulated Live Portfolio Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 p-6 rounded-2xl relative overflow-hidden shadow-digital">
                    <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Active Reserve Valuation</p>
                    <p className="text-3xl font-black text-[#0F172A] dark:text-white font-mono mt-2 tracking-tight">
                        ${totalInvestingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-extrabold mt-2 leading-none">
                        <TrendingUpIcon className="w-4 h-4" />
                        <span>Real-time Active Feed</span>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 p-6 rounded-2xl relative overflow-hidden shadow-digital">
                    <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Compounding Average APY</p>
                    <p className="text-3xl font-black text-emerald-400 font-mono mt-2 tracking-tight">
                        {holdings.length > 0 ? '6.85%' : '5.50%'}
                    </p>
                    <p className="text-[#0F172A] text-[10px] font-bold uppercase tracking-wider mt-2.5">Institutional Benchmark</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 p-6 rounded-2xl relative overflow-hidden shadow-digital">
                    <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Asset Safeguard Nodes</p>
                    <p className="text-3xl font-black text-[#0F172A] dark:text-white font-mono mt-2 tracking-tight">
                        {holdings.length}
                    </p>
                    <p className="text-[#0F172A] text-[10px] font-bold uppercase tracking-wider mt-2.5">Fully Audited Allocations</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 p-6 rounded-2xl relative overflow-hidden shadow-digital">
                    <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Yield Gained (24h)</p>
                    <p className="text-3xl font-black text-emerald-400 font-mono mt-2 tracking-tight">
                        +${(totalInvestingBalance * 0.000188).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[#0F172A] text-[10px] font-bold uppercase tracking-wider mt-2.5">Compounded Hourly</p>
                </div>
            </div>

            {/* Asset Allocation Intelligence Section */}
            <AssetAllocationIntelligence accounts={accounts} />

            {/* Interactive Calculator Block - Clarifying Why It Is Critical to Save and Invest Here */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                <div className="lg:col-span-8 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-[2rem] p-8 flex flex-col justify-between shadow-digital gap-6">
                    <div>
                        <div className="flex justify-between items-start gap-4 flex-col sm:flex-row mb-6">
                            <div>
                                <h3 className="text-xl font-bold uppercase tracking-tight text-[#0F172A] dark:text-white flex items-center gap-2.5">
                                    <PieChartIcon className="w-5.5 h-5.5 text-primary" />
                                    The Sovereign Velocity Simulator
                                </h3>
                                <p className="text-xs font-bold text-[#0F172A] uppercase tracking-widest mt-1">Comparing 5.5% Premium Sovereign Rates vs traditional commercial bank structures</p>
                            </div>
                            <div className="bg-rose-500 border border-rose-500/20 text-rose-400 px-4 py-2 rounded-xl text-center flex-shrink-0">
                                <p className="text-[9px] font-black uppercase tracking-wider">Estimated Lost Opportunity Cost</p>
                                <p className="text-lg font-black font-mono leading-none mt-1">
                                    -${(latestProjection.fpb - latestProjection.traditional).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Interactive Sliders */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-white/10">
                            <div>
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2 block">Initial Principal Capital</label>
                                <div className="text-lg font-black font-mono text-[#0F172A] dark:text-white mb-2">${initialAmount.toLocaleString()}</div>
                                <input 
                                    type="range" 
                                    min="1000" 
                                    max="500000" 
                                    step="5000"
                                    value={initialAmount} 
                                    onChange={(e) => setInitialAmount(parseInt(e.target.value))} 
                                    className="w-full accent-primary h-1.5 bg-white dark:bg-slate-900 rounded-lg cursor-pointer" 
                                />
                                <div className="flex justify-between text-[9px] font-extrabold text-[#0F172A] uppercase mt-1">
                                    <span>$1k</span>
                                    <span>$500k</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2 block">Monthly Injection Contribution</label>
                                <div className="text-lg font-black font-mono text-[#0F172A] dark:text-white mb-2">${monthlyContribution.toLocaleString()} /mo</div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="20000" 
                                    step="100"
                                    value={monthlyContribution} 
                                    onChange={(e) => setMonthlyContribution(parseInt(e.target.value))} 
                                    className="w-full accent-primary h-1.5 bg-white dark:bg-slate-900 rounded-lg cursor-pointer" 
                                />
                                <div className="flex justify-between text-[9px] font-extrabold text-[#0F172A] uppercase mt-1">
                                    <span>$0</span>
                                    <span>$20k</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2 block">Investment Term Horizon</label>
                                <div className="text-lg font-black font-mono text-[#0F172A] dark:text-white mb-2">{selectedYears} Years</div>
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="30" 
                                    step="1"
                                    value={selectedYears} 
                                    onChange={(e) => setSelectedYears(parseInt(e.target.value))} 
                                    className="w-full accent-primary h-1.5 bg-white dark:bg-slate-900 rounded-lg cursor-pointer" 
                                />
                                <div className="flex justify-between text-[9px] font-extrabold text-[#0F172A] uppercase mt-1">
                                    <span>1 Yr</span>
                                    <span>30 Yrs</span>
                                </div>
                            </div>
                        </div>

                        {/* Custom Dynamic Vector Chart Illustrating the gap over time */}
                        <div className="h-64 relative bg-slate-100 p-4 border border-slate-100 dark:border-white/10 rounded-2xl flex flex-col justify-between overflow-hidden shadow-inner">
                            <div className="absolute inset-0 grid grid-cols-5 divide-x divide-white/5 pointer-events-none">
                                <div></div><div></div><div></div><div></div><div></div>
                            </div>
                            <div className="absolute inset-0 grid grid-rows-4 divide-y divide-white/5 pointer-events-none">
                                <div></div><div></div><div></div><div></div>
                            </div>

                            {/* SVG Chart paths */}
                            {projectionsData.length > 0 && (
                                <svg className="w-full h-full absolute inset-0 overflow-visible p-4 z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    {/* High Yield Curve */}
                                    <defs>
                                        <linearGradient id="g-fpb" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25"/>
                                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                                        </linearGradient>
                                        <linearGradient id="g-trad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#64748b" stopOpacity="0.1"/>
                                            <stop offset="100%" stopColor="#64748b" stopOpacity="0"/>
                                        </linearGradient>
                                    </defs>

                                    {/* Traditional Curve shaded */}
                                    <path 
                                        d={`M 0,100 ${projectionsData.map((d, i) => {
                                            const x = (i / (projectionsData.length - 1)) * 100;
                                            const y = 100 - (d.traditional / latestProjection.fpb) * 90;
                                            return `L ${x},${y}`;
                                        }).join(' ')} L 100,100 Z`}
                                        fill="url(#g-trad)"
                                        className="transition-all duration-300"
                                    />
                                    {/* Real Core Curve shaded */}
                                    <path 
                                        d={`M 0,100 ${projectionsData.map((d, i) => {
                                            const x = (i / (projectionsData.length - 1)) * 100;
                                            const y = 100 - (d.fpb / latestProjection.fpb) * 90;
                                            return `L ${x},${y}`;
                                        }).join(' ')} L 100,100 Z`}
                                        fill="url(#g-fpb)"
                                        className="transition-all duration-300"
                                    />

                                    {/* Core curve lines */}
                                    <polyline 
                                        fill="none" 
                                        stroke="#1e293b" 
                                        strokeWidth="2" 
                                        strokeDasharray="4"
                                        points={projectionsData.map((d, i) => {
                                            const x = (i / (projectionsData.length - 1)) * 100;
                                            const y = 100 - (d.traditional / latestProjection.fpb) * 90;
                                            return `${x},${y}`;
                                        }).join(' ')}
                                        className="transition-all duration-300"
                                    />
                                    <polyline 
                                        fill="none" 
                                        stroke="#3b82f6" 
                                        strokeWidth="4" 
                                        points={projectionsData.map((d, i) => {
                                            const x = (i / (projectionsData.length - 1)) * 100;
                                            const y = 100 - (d.fpb / latestProjection.fpb) * 90;
                                            return `${x},${y}`;
                                        }).join(' ')}
                                        className="transition-all duration-300"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            )}

                            {/* Legend labels layered */}
                            <div className="relative z-10 flex justify-between items-start w-full pointer-events-none">
                                <span className="text-[10px] font-mono text-[#0F172A] font-bold">Projected Valuation</span>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-3 h-1 primary- rounded-full inline-block"></span>
                                        <span className="text-[10px] font-extrabold text-[#0F172A] dark:text-white uppercase tracking-wider">FPB sovereign Yield</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-3 h-1 bg-slate-100 dark:bg-slate-700 rounded-full inline-block"></span>
                                        <span className="text-[10px] font-extrabold text-[#0F172A] uppercase tracking-wider">Traditional Retail APY</span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 flex justify-between w-full font-mono text-[9px] text-[#0F172A] pt-1 pointer-events-none">
                                <span>Start</span>
                                <span>Year {Math.round(selectedYears / 2)}</span>
                                <span>Year {selectedYears}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="bg-slate-100 p-4 rounded-xl border border-slate-100 dark:border-white/10">
                            <span className="text-[10px] font-extrabold text-[#0F172A] dark:text-white uppercase tracking-widest">Sovereign Wealth Yield</span>
                            <p className="text-xl font-black text-[#0F172A] dark:text-white font-mono mt-1">${latestProjection.fpb.toLocaleString()}</p>
                            <span className="text-[10.5px] font-bold primary-">At {selectedApy}% Compounded</span>
                        </div>
                        <div className="bg-slate-100 p-4 rounded-xl border border-slate-100 dark:border-white/10">
                            <span className="text-[10px] font-extrabold text-[#0F172A] dark:text-white uppercase tracking-widest">Standard Checking Balance</span>
                            <p className="text-xl font-black text-[#0F172A] font-mono mt-1">${latestProjection.traditional.toLocaleString()}</p>
                            <span className="text-[10.5px] font-bold text-[#0F172A]">At {traditionalBankApy}% Retail Market</span>
                        </div>
                    </div>
                </div>

                {/* Risk Strategy Customizer */}
                <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-[2rem] p-8 flex flex-col justify-between shadow-digital gap-6">
                    <div>
                        <h3 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                            <ChartBarIcon className="w-5 h-5 text-indigo-400" />
                            Optimized Core Strategy
                        </h3>

                        <div className="space-y-4">
                            <button 
                                onClick={() => setSelectedStrategyType('conservative')}
                                className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedStrategyType === 'conservative' ? 'primary- primary-' : 'border-slate-100 dark:border-white/10 bg-slate-100 hover:bg-slate-850'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-wider">Capital Shield Safeguard</span>
                                    <span className="text-xs font-mono font-bold primary-">4.50% Yield</span>
                                </div>
                                <p className="text-[#0F172A] text-[11px] mt-1 font-semibold">Priority structured treasury assets focusing on absolute risk containment.</p>
                            </button>

                            <button 
                                onClick={() => setSelectedStrategyType('balanced')}
                                className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedStrategyType === 'balanced' ? 'border-primary bg-primary/10' : 'border-slate-100 dark:border-white/10 bg-slate-100 hover:bg-slate-850'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-wider">Balanced Core Reserve</span>
                                    <span className="text-xs font-mono font-bold text-primary">8.25% Yield</span>
                                </div>
                                <p className="text-[#0F172A] text-[11px] mt-1 font-semibold">Optimized risk-adjusted returns blending active liquid reserves and major markets.</p>
                            </button>

                            <button 
                                onClick={() => setSelectedStrategyType('aggressive')}
                                className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedStrategyType === 'aggressive' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-100 dark:border-white/10 bg-slate-100 hover:bg-slate-850'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-wider">Hypergrowth Alpha Hub</span>
                                    <span className="text-xs font-mono font-bold text-emerald-400">12.00% Yield</span>
                                </div>
                                <p className="text-[#0F172A] text-[11px] mt-1 font-semibold">Venture-allocated option pools targeting high-growth technological trends.</p>
                            </button>
                        </div>
                    </div>

                    {/* Stacked allocate visual bar */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest">Asset Allocation Weighting</span>
                            <span className="text-xs font-bold text-primary uppercase">Estimated Strategy Target</span>
                        </div>
                        
                        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner border border-slate-100 dark:border-white/10 mb-4">
                            {selectedStrategyType === 'conservative' && (
                                <>
                                    <div className="primary- h-full" style={{ width: '60%' }} title="Treasury: 60%"></div>
                                    <div className="bg-indigo-500 h-full" style={{ width: '20%' }} title="Defensive: 20%"></div>
                                    <div className="bg-amber-500 h-full" style={{ width: '20%' }} title="Gold: 20%"></div>
                                </>
                            )}
                            {selectedStrategyType === 'balanced' && (
                                <>
                                    <div className="primary- h-full" style={{ width: '45%' }} title="Tech Leader: 45%"></div>
                                    <div className="bg-indigo-500 h-full" style={{ width: '35%' }} title="Blue-Chip Index: 35%"></div>
                                    <div className="bg-emerald-500 h-full" style={{ width: '20%' }} title="Yield Reserves: 20%"></div>
                                </>
                            )}
                            {selectedStrategyType === 'aggressive' && (
                                <>
                                    <div className="bg-emerald-500 h-full" style={{ width: '55%' }} title="Growth Equities: 55%"></div>
                                    <div className="bg-indigo-500 h-full" style={{ width: '30%' }} title="Active Tech: 30%"></div>
                                    <div className="bg-amber-500 h-full" style={{ width: '15%' }} title="Commodities: 15%"></div>
                                </>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold uppercase tracking-wider text-[#0F172A]">
                            {selectedStrategyType === 'conservative' && (
                                <>
                                    <div><span className="inline-block w-2 h-2 primary- rounded-full mr-1.5"></span>60% Bonds</div>
                                    <div><span className="inline-block w-2 h-2 bg-indigo-500 rounded-full mr-1.5"></span>20% Equities</div>
                                    <div><span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-1.5"></span>20% Gold</div>
                                </>
                            )}
                            {selectedStrategyType === 'balanced' && (
                                <>
                                    <div><span className="inline-block w-2 h-2 primary- rounded-full mr-1.5"></span>45% Tech</div>
                                    <div><span className="inline-block w-2 h-2 bg-indigo-500 rounded-full mr-1.5"></span>35% Index</div>
                                    <div><span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-1.5"></span>20% Cash</div>
                                </>
                            )}
                            {selectedStrategyType === 'aggressive' && (
                                <>
                                    <div><span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-1.5"></span>55% Alpha</div>
                                    <div><span className="inline-block w-2 h-2 bg-indigo-500 rounded-full mr-1.5"></span>30% Growth</div>
                                    <div><span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-1.5"></span>15% Gold</div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Simulated Desktop Trading Terminal & Holdings Monitor */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Simulated Investment Desk */}
                <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-[2rem] p-8 shadow-digital relative flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Direct Placement Desk
                        </h3>

                        {tradeStep === 'form' && (
                            <form onSubmit={handleOpenTradeConfirm} className="space-y-5">
                                {/* Buy / Sell Switch */}
                                <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl border border-slate-100 dark:border-white/10">
                                    <button 
                                        type="button"
                                        onClick={() => setTradeType('buy')}
                                        className={`py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${tradeType === 'buy' ? 'bg-primary text-[#0F172A] dark:text-white shadow-md' : 'text-[#0F172A] hover:text-[#0F172A] dark:text-white'}`}
                                    >
                                        Allocate / Acquire
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setTradeType('sell')}
                                        className={`py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${tradeType === 'sell' ? 'bg-rose-600 text-[#0F172A] dark:text-white shadow-md' : 'text-[#0F172A] hover:text-[#0F172A] dark:text-white'}`}
                                    >
                                        Liquidate / Cash
                                    </button>
                                </div>

                                {/* Asset Select */}
                                <div>
                                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2 block">Premium Placement Pool</label>
                                    <select 
                                        value={selectedAsset.symbol} 
                                        onChange={(e) => {
                                            const asset = SUPPORTED_ASSETS.find(a => a.symbol === e.target.value);
                                            if (asset) setSelectedAsset(asset);
                                        }}
                                        className="w-full bg-slate-100 border border-slate-100 dark:border-white/10 rounded-xl p-4 text-[#0F172A] dark:text-white font-bold outline-none focus:border-primary appearance-none text-sm"
                                    >
                                        {SUPPORTED_ASSETS.map(asset => (
                                            <option key={asset.symbol} value={asset.symbol}>
                                                {asset.icon} {asset.symbol} ({asset.name})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Capital Amount to transact */}
                                <div>
                                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2 block">Transacting Allocation Volume (USD)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F172A] dark:text-white font-mono font-bold">$</span>
                                        <input 
                                            type="number" 
                                            value={tradeCapital} 
                                            onChange={(e) => setTradeCapital(e.target.value)}
                                            className="w-full bg-slate-100 border border-slate-100 dark:border-white/10 rounded-xl py-4 pl-8 pr-16 text-[#0F172A] dark:text-white font-mono font-black placeholder-slate-600 focus:border-primary outline-none"
                                            placeholder="1000"
                                            required
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0F172A] text-[10px] font-extrabold font-mono uppercase">USD Core</span>
                                    </div>
                                </div>

                                {/* Sourced Funding Account */}
                                <div>
                                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2 block">
                                        {tradeType === 'buy' ? 'Sourced Liquidity Root' : 'Sourced Settlement Destination'}
                                    </label>
                                    <select 
                                        value={selectedPaymentAccount} 
                                        onChange={(e) => setSelectedPaymentAccount(e.target.value)}
                                        className="w-full bg-slate-100 border border-slate-100 dark:border-white/10 rounded-xl p-4 text-[#0F172A] dark:text-white font-bold outline-none focus:border-primary text-sm appearance-none"
                                    >
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.nickname || acc.type} ending *{acc.id.slice(-4)} (${acc.balance.toLocaleString()})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {tradeError && (
                                    <p className="text-xs text-rose-400 font-extrabold uppercase tracking-wider">{tradeError}</p>
                                )}

                                <button 
                                    type="submit"
                                    className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg ${tradeType === 'buy' ? 'bg-primary hover:bg-primary-600 shadow-primary/10' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/10'} cursor-pointer`}
                                >
                                    {tradeType === 'buy' ? 'Initiate Allocation Position' : 'Deauthorize Position Liquidity'}
                                </button>
                            </form>
                        )}

                        {tradeStep === 'pin' && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <LockClosedIcon className="w-10 h-10 text-primary mx-auto mb-3" />
                                    <h4 className="text-md font-bold uppercase tracking-widest text-[#0F172A] dark:text-[#1E293B]">Secure Placement Auths</h4>
                                    <p className="text-[#0F172A] text-xs font-semibold mt-1">Please enter your 4-digit Secure Allocation PIN to finalize placement.</p>
                                </div>

                                <div className="space-y-4">
                                    <input 
                                        type="password" 
                                        maxLength={4}
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                        className="w-32 bg-slate-100 border border-slate-200 dark:border-white/10 rounded-xl py-4 text-center text-[#0F172A] dark:text-white tracking-[1em] font-mono font-black text-2xl mx-auto block focus:border-primary outline-none"
                                        autoFocus
                                    />

                                    {tradeError && (
                                        <p className="text-xs text-rose-400 text-center font-extrabold uppercase tracking-wider">{tradeError}</p>
                                    )}

                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => setTradeStep('form')}
                                            className="flex-1 py-3 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white cursor-pointer dark:bg-slate-800"
                                        >
                                            Abort
                                        </button>
                                        <button 
                                            onClick={handleExecuteTrade}
                                            disabled={pin.length !== 4}
                                            className="flex-1 py-3 bg-primary text-[#0F172A] dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 disabled:opacity-40 cursor-pointer"
                                        >
                                            Verify Auths
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {tradeStep === 'processing' && (
                            <div className="py-12 text-center">
                                <SpinnerIcon className="w-12 h-12 text-primary animate-spin mx-auto mb-6" />
                                <h4 className="text-md font-black uppercase tracking-widest text-[#0F172A] dark:text-[#1E293B] animate-pulse">Reconciling Ledger...</h4>
                                <p className="text-[#0F172A] text-xs font-semibold mt-2">Opening secure investment pipeline, segregating asset bounds in database...</p>
                            </div>
                        )}

                        {tradeStep === 'success' && lastReceipt && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <CheckCircleIcon className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                                    <h4 className="text-md font-black uppercase tracking-widest text-[#0F172A] dark:text-white">Execution Cleared</h4>
                                    <p className="text-[10px] text-[#0F172A] font-bold uppercase tracking-widest mt-1">Transaction Ref: {lastReceipt.id}</p>
                                </div>

                                <div className="bg-slate-100 p-4 rounded-xl border border-slate-100 dark:border-white/10 space-y-2.5 text-xs font-mono">
                                    <div className="flex justify-between">
                                        <span className="text-[#0F172A] uppercase font-black text-[9px]">PLACEMENT TYPE</span>
                                        <span className="text-emerald-400 font-mono font-bold">{lastReceipt.type}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#0F172A] uppercase font-black text-[9px]">POOL TARGET</span>
                                        <span className="text-[#0F172A] dark:text-[#1E293B]">{lastReceipt.asset}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#0F172A] uppercase font-black text-[9px]">TOTAL OUTLAY</span>
                                        <span className="text-[#0F172A] dark:text-[#1E293B] font-bold">${lastReceipt.vol.toLocaleString()} USD</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#0F172A] uppercase font-black text-[9px]">FUNDING ROOT</span>
                                        <span className="text-[#0F172A] dark:text-white">{lastReceipt.targetNode}</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setTradeStep('form')}
                                    className="w-full py-3.5 bg-slate-100 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-850 cursor-pointer"
                                >
                                    Dismiss Receipt
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Simulated Holdings Page */}
                <div className="lg:col-span-8 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-[2rem] p-8 shadow-digital relative flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-widest flex items-center gap-2">
                                    <TrendingUpIcon className="w-5 h-5 text-emerald-400" />
                                    Secured Holding Positions
                                </h3>
                                <p className="text-[10.5px] text-[#0F172A] font-bold uppercase tracking-wider mt-1">Fully collateralized asset certificates under custody</p>
                            </div>
                            <span className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400 border border-emerald-400/20 rounded-full animate-pulse shadow-inner">
                                Ledger Secured
                            </span>
                        </div>

                        {holdings.length === 0 ? (
                            <div className="py-16 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-slate-100">
                                <PiggyBankIcon className="w-12 h-12 text-[#0F172A] mx-auto mb-4" />
                                <h4 className="text-sm font-bold uppercase tracking-widest text-[#0F172A] dark:text-white">Vault Cache Depleted</h4>
                                <p className="text-[#0F172A] text-xs font-semibold mt-1 max-w-xs mx-auto">No current custom placements configured. Use the placement desk on the left to allocate capital.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 text-[9px] text-[#0F172A] uppercase font-black tracking-widest border-b border-slate-100 dark:border-white/10">
                                        <tr>
                                            <th className="px-6 py-4">Placement Symbol</th>
                                            <th className="px-6 py-4">Nominal Shares</th>
                                            <th className="px-6 py-4 text-right">Avg cost basis</th>
                                            <th className="px-6 py-4 text-right">Cumulative Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {holdings.map((h) => {
                                            const metadata = SUPPORTED_ASSETS.find(a => a.symbol === h.symbol) || { name: 'Sovereign Core Investment Asset', icon: '💼', expectedYield: 5.5 };
                                            return (
                                                <tr key={h.symbol} className="hover:bg-white transition-all dark:bg-slate-800">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-100 dark:border-white/10 flex items-center justify-center text-md shadow-inner">
                                                                {metadata.icon}
                                                            </div>
                                                            <div>
                                                                <p className="font-extrabold text-[#0F172A] dark:text-[#1E293B]">{h.symbol}</p>
                                                                <p className="text-[10px] text-[#0F172A] uppercase font-bold leading-none mt-0.5">{metadata.name}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-[#0F172A] dark:text-white font-bold">
                                                        {h.shares.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono text-[#0F172A] dark:text-white">
                                                        ${h.purchasePrice.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <p className="font-mono font-black text-[#0F172A] dark:text-white">${h.currentValuation.toLocaleString()}</p>
                                                        <p className="text-[9px] font-bold text-emerald-400 leading-none mt-0.5">+{metadata.expectedYield}% Yield Target</p>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/10 flex justify-between items-center flex-col sm:flex-row gap-4">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Active interest accruing in real-time</span>
                        </div>
                        <p className="text-[#0F172A] text-[10px] font-semibold leading-none text-right">Custodian Root: Premium Secured Union Vaults, FDIC Equivalent sovereign protection</p>
                    </div>
                </div>
            </div>

            {/* Live Benchmarks & Key Exchange rates section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                    <KeyRates />
                    <div>
                        <h3 className="text-sm font-black text-[#0F172A] dark:text-white mb-6 flex items-center gap-2.5 uppercase tracking-widest">
                            <TrendingUpIcon className="w-5 h-5 text-emerald-400" />
                            Benchmark Indices tracker
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {marketIndices.map(index => <IndexCard key={index.name} {...index} />)}
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <CurrencyConverter />
                </div>
            </div>

            {/* Base settlement tabular exchange ratios */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-3xl shadow-digital overflow-hidden">
                <div className="p-8 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-sm font-black text-[#0F172A] dark:text-[#1E293B] flex items-center space-x-2.5 uppercase tracking-widest">
                            <ArrowsRightLeftIcon className="w-5 h-5 text-primary" />
                            <span>Indicative Liquidation Feed</span>
                        </h3>
                        <p className="text-[#0F172A] text-[10px] mt-1 pr-1 font-black uppercase tracking-widest">Unified Sovereign Base Asset: {baseCurrency}</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500 border border-green-500/20 rounded-full shadow-inner">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-[9px] font-black text-green-400 uppercase tracking-widest tracking-widest">Verified Multi-Chain Feed</span>
                    </div>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-[9px] text-[#0F172A] uppercase font-black tracking-widest border-b border-slate-100 dark:border-white/10">
                            <tr>
                                <th scope="col" className="px-8 py-4">Asset Pair</th>
                                <th scope="col" className="px-8 py-4 text-right">Units per {baseCurrency}</th>
                                <th scope="col" className="px-8 py-4 text-right">{baseCurrency} per Unit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {rates.map(([currency, rate]) => (
                                <tr key={currency} className="hover:bg-primary/5 transition-all group">
                                    <td className="px-8 py-5 font-black text-[#0F172A] dark:text-white group-hover:text-primary transition-colors font-mono leading-none">{currency}</td>
                                    <td className="px-8 py-5 text-right font-mono text-[#0F172A] dark:text-white font-bold font-mono">{(rate as number).toFixed(4)}</td>
                                    <td className="px-8 py-5 text-right font-mono text-[#0F172A] font-mono">{(1 / (rate as number)).toFixed(4)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Simple visual asset icons
const PieChartIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
    </svg>
);
