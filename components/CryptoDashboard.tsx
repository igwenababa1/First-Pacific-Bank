
import React, { useState, useMemo, useEffect } from 'react';
import { CryptoAsset, CryptoHolding, Account } from '../types';
import { TradingView } from './TradingView';
import { TrendingUpIcon, ShieldCheckIcon, GlobeAmericasIcon, ActivityIcon, ChevronLeftIcon, VerifiedBadgeIcon, SparklesIcon, ChartBarIcon, LockClosedIcon, ClockIcon, ZapIcon, ServerIcon, PackageIcon } from './Icons';
import { useCurrency } from '../contexts/CurrencyContext';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import { D3CurrencyHeatmap } from './D3CurrencyHeatmap';
import { useSystemOptions } from '../hooks/useSystemOptions';
import { PortfolioPerformanceModal } from './PortfolioPerformanceModal';
import { AssetAllocationIntelligence } from './AssetAllocationIntelligence';

interface CryptoDashboardProps {
    cryptoAssets: CryptoAsset[];
    setCryptoAssets: React.Dispatch<React.SetStateAction<CryptoAsset[]>>;
    holdings: CryptoHolding[];
    checkingAccount?: Account;
    onBuy: (assetId: string, usdAmount: number, assetPrice: number) => boolean;
    onSell: (assetId: string, cryptoAmount: number, assetPrice: number) => boolean;
    onStake?: (assetId: string, amount: number, apr: number) => boolean;
    onUnstake?: (assetId: string, amount: number) => boolean;
    marketData?: any;
}

const Sparkline: React.FC<{ data: number[], color: string }> = ({ data, color }) => {
    const chartData = data.map((val, i) => ({ i, val }));
    return (
        <div className="w-24 h-10">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <Line type="monotone" dataKey="val" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const MarketSentimentGauge: React.FC = () => (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 flex flex-col items-center shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500"></div>
        <h4 className="text-[10px] font-black text-[#0F172A] uppercase tracking-[0.3em] mb-4">Sentiment Algorithm v4.2</h4>
        <div className="relative w-full h-1.5 bg-white dark:bg-slate-900 rounded-full mt-1">
            <div 
                className="absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-[0_0_15px_rgba(14,197,242,0.6)] transition-all duration-1000 ease-in-out dark:bg-slate-800"
                style={{ left: '72%' }}
            ></div>
        </div>
        <div className="flex justify-between w-full text-[8px] font-black text-[#0F172A] mt-3 uppercase tracking-widest">
            <span>Critical Fear</span>
            <span>Excessive Greed</span>
        </div>
        <div className="mt-6 text-center">
            <p className="text-emerald-400 font-black text-2xl tracking-tighter uppercase leading-none">Greed Active (72)</p>
            <p className="text-[9px] text-[#0F172A] uppercase font-bold tracking-widest mt-2">Institutional Bias: Strongly Bullish</p>
        </div>
    </div>
);

const MarketStatusCard: React.FC = () => (
    <div className="bg-slate-100 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-xl border border-emerald-500/20">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
                </div>
                <h4 className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest">Exchange Network</h4>
            </div>
            <span className="text-[9px] font-mono text-[#0F172A]">Uptime: 99.998%</span>
        </div>
        <p className="text-sm font-bold text-[#0F172A] dark:text-white leading-relaxed">
            Market liquidity is currently <span className="text-[#0F172A] dark:text-white">Optimal</span>. PRB Layer-2 settlement is active across all global nodes. 
        </p>
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 flex justify-between items-center">
            <div className="flex gap-2">
                <ShieldCheckIcon className="w-4 h-4 text-primary" />
                <LockClosedIcon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Verified Feed</span>
        </div>
    </div>
);

const NetworkFeeTicker: React.FC = () => {
    const [gas, setGas] = useState(15);
    useEffect(() => {
        const interval = setInterval(() => setGas(prev => Math.max(10, prev + Math.floor(Math.random() * 5) - 2)), 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 flex flex-col justify-between h-full relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
                <ZapIcon className="w-5 h-5 text-yellow-400" />
                <h4 className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest">Network Gas (Gwei)</h4>
            </div>
            <div className="flex items-end gap-2">
                <p className="text-3xl font-black text-[#0F172A] dark:text-white font-mono tracking-tighter">{gas}</p>
                <span className="text-[10px] font-bold text-emerald-400 mb-1">Low Congestion</span>
            </div>
             <div className="mt-4 w-full h-1 bg-white dark:bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 transition-all duration-1000" style={{ width: `${(gas / 100) * 100}%` }}></div>
            </div>
        </div>
    );
};

const STAKING_APRS: Record<string, number> = {
    btc: 3.5,
    eth: 5.2,
    sol: 7.8,
    ada: 4.2,
    dot: 11.4
};

const StakingOverview: React.FC<{
    holdings: CryptoHolding[];
    cryptoAssets: CryptoAsset[];
    onStake?: (assetId: string, amount: number, apr: number) => boolean;
    onUnstake?: (assetId: string, amount: number) => boolean;
}> = ({ holdings, cryptoAssets, onStake, onUnstake }) => {
    const [selectedAssetId, setSelectedAssetId] = useState<string>('eth');
    const [stakeAmount, setStakeAmount] = useState<string>('');
    const [isStaking, setIsStaking] = useState(false);
    const [actionTab, setActionTab] = useState<'stake' | 'positions'>('stake');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const activeAsset = cryptoAssets.find(a => a.id === selectedAssetId) || cryptoAssets[0];
    const holding = holdings.find(h => h.assetId === selectedAssetId);
    
    const liquidBalance = holding ? Math.max(0, holding.amount - (holding.stakedAmount || 0)) : 0;
    const apr = STAKING_APRS[selectedAssetId] || 4.5;

    // Filter holdings that have staked amount > 0
    const stakedPositions = holdings.filter(h => h.stakedAmount && h.stakedAmount > 0);

    const handleStake = () => {
        setError(null);
        setSuccess(null);
        const amount = parseFloat(stakeAmount);
        if (isNaN(amount) || amount <= 0) {
            setError('Enter a valid amount to stake.');
            return;
        }
        if (amount > liquidBalance) {
            setError(`Insufficient liquid balance. Maximum stakeable is ${liquidBalance.toFixed(4)} ${activeAsset.symbol}.`);
            return;
        }

        setIsStaking(true);
        setTimeout(() => {
            if (onStake && onStake(selectedAssetId, amount, apr)) {
                setSuccess(`Successfully staked ${amount.toFixed(4)} ${activeAsset.symbol}!`);
                setStakeAmount('');
            } else {
                setError('Staking transaction failed. Please try again.');
            }
            setIsStaking(false);
        }, 1200);
    };

    const handleUnstake = (assetId: string, amount: number) => {
        setError(null);
        setSuccess(null);
        if (onUnstake && onUnstake(assetId, amount)) {
            const assetSymbol = cryptoAssets.find(a => a.id === assetId)?.symbol || assetId.toUpperCase();
            setSuccess(`Successfully unstaked ${amount.toFixed(4)} ${assetSymbol}!`);
        } else {
            setError('Unstaking transaction failed.');
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/20 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group">
            {/* Background glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em] mb-1">Sovereign Protocol</h4>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Yield Staking Terminal</h3>
                    </div>
                    <span className="bg-indigo-500 border border-indigo-500/30 text-indigo-300 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl animate-pulse">
                        Auto-Compounding
                    </span>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-black/5 mb-6">
                    <button 
                        onClick={() => { setActionTab('stake'); setError(null); setSuccess(null); }}
                        className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${actionTab === 'stake' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-[#0F172A] hover:text-[#0F172A]'}`}
                    >
                        Stake Assets
                    </button>
                    <button 
                        onClick={() => { setActionTab('positions'); setError(null); setSuccess(null); }}
                        className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 relative ${actionTab === 'positions' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-[#0F172A] hover:text-[#0F172A]'}`}
                    >
                        Active Positions ({stakedPositions.length})
                        {stakedPositions.length > 0 && (
                            <span className="absolute -top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                        )}
                    </button>
                </div>

                {/* Tab content */}
                {actionTab === 'stake' ? (
                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                        {/* Asset Select */}
                        <div className="space-y-2">
                            <label className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest">Select Asset to Lock</label>
                            <div className="grid grid-cols-5 gap-2">
                                {cryptoAssets.map(asset => {
                                    const assetApr = STAKING_APRS[asset.id] || 4.5;
                                    const isSelected = selectedAssetId === asset.id;
                                    return (
                                        <button
                                            key={asset.id}
                                            onClick={() => { setSelectedAssetId(asset.id); setError(null); setSuccess(null); }}
                                            className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all duration-300 ${isSelected ? 'bg-indigo-500 border-indigo-500/50 shadow-lg shadow-indigo-500/10' : 'bg-slate-100 border-black/5 hover:border-black/5'}`}
                                        >
                                            <asset.icon className="w-5 h-5 text-white" />
                                            <span className="text-[9px] font-black text-white uppercase">{asset.symbol}</span>
                                            <span className="text-[8px] font-bold text-emerald-400">+{assetApr}%</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Staking Details Card */}
                        <div className="bg-slate-100 border border-black/5 rounded-2xl p-4 space-y-3">
                            <div className="flex justify-between items-center text-xs font-bold text-[#0F172A]">
                                <span>Liquid Balance:</span>
                                <span className="font-mono text-white">{liquidBalance.toFixed(4)} {activeAsset.symbol}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold text-[#0F172A]">
                                <span>Yield Rate (APR):</span>
                                <span className="text-emerald-400 font-mono font-black">{apr}% APR</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold text-[#0F172A]">
                                <span>Compound Interval:</span>
                                <span className="text-indigo-300 font-bold uppercase tracking-wider text-[9px]">Hourly Block</span>
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest">Staking Amount</label>
                                <button 
                                    onClick={() => setStakeAmount(liquidBalance.toString())}
                                    className="text-[8px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest bg-indigo-500 px-2 py-0.5 rounded-md border border-indigo-500/20"
                                >
                                    Stake Max
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={stakeAmount}
                                    onChange={(e) => { setStakeAmount(e.target.value); setError(null); }}
                                    placeholder="0.0000"
                                    className="w-full bg-slate-100 border border-black/5 focus:border-indigo-500/50 text-white font-mono font-bold px-4 py-3 rounded-2xl outline-none transition-all pr-12 text-sm"
                                    disabled={isStaking}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono font-black text-[10px] text-[#0F172A] uppercase">{activeAsset.symbol}</span>
                            </div>
                        </div>

                        {/* Errors & Success */}
                        {error && (
                            <p className="text-[10px] font-bold text-red-400 bg-red-950 border border-red-500/30 px-3 py-2 rounded-xl">{error}</p>
                        )}
                        {success && (
                            <p className="text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-500/30 px-3 py-2 rounded-xl animate-fade-in">{success}</p>
                        )}

                        {/* Stake Button */}
                        <button
                            onClick={handleStake}
                            disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0}
                            className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${isStaking ? 'bg-white text-[#0F172A] cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 active:scale-[0.98]'}`}
                        >
                            {isStaking ? 'Broadcasting to Ledger...' : `Lock Assets for ${apr}% APR`}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                        {stakedPositions.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-black/5 mb-3 dark:bg-slate-800">
                                    <LockClosedIcon className="w-6 h-6 text-indigo-400" />
                                </div>
                                <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">No Active Stakes</h4>
                                <p className="text-[9px] text-[#0F172A] font-bold uppercase tracking-widest mt-1 max-w-[200px]">Lock your digital assets in the stake panel to earn interest.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] custom-scrollbar">
                                {stakedPositions.map((pos) => {
                                    const asset = cryptoAssets.find(a => a.id === pos.assetId);
                                    if (!asset) return null;
                                    const rewardAccrued = (pos.stakedAmount || 0) * ((pos.stakingApr || 0) / 100) * 0.00015;
                                    return (
                                        <div key={pos.assetId} className="bg-slate-100 border border-black/5 rounded-2xl p-4 flex justify-between items-center hover:border-indigo-500/30 transition-all duration-300 group/item">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-black/5 flex items-center justify-center">
                                                    <asset.icon className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs font-black text-white uppercase">{asset.name}</p>
                                                        <span className="text-[8px] font-black text-emerald-400 bg-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20">+{pos.stakingApr}% APR</span>
                                                    </div>
                                                    <p className="text-[10px] font-mono text-[#0F172A] mt-1">Staked: <span className="font-bold text-indigo-300">{(pos.stakedAmount || 0).toFixed(4)} {asset.symbol}</span></p>
                                                    <p className="text-[8px] font-mono text-emerald-400 mt-0.5 font-bold">Yield Accrued: +{rewardAccrued.toFixed(6)} {asset.symbol}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleUnstake(pos.assetId, pos.stakedAmount || 0)}
                                                className="px-3 py-1.5 bg-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-400 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 cursor-pointer opacity-0 group-hover/item:opacity-100 transition-opacity"
                                            >
                                                Unstake
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        
                        {success && (
                            <p className="text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-500/30 px-3 py-2 rounded-xl animate-fade-in">{success}</p>
                        )}

                        <div className="pt-4 border-t border-black/5 text-center">
                            <span className="text-[8px] text-[#0F172A] font-bold uppercase tracking-[0.2em]">Stakes secured by First Pacific Clearing trust</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const WalletDistribution: React.FC = () => {
    const data = [
        { name: 'Cold Storage', value: 80, color: '#3b82f6' },
        { name: 'Hot Wallet', value: 20, color: '#ef4444' },
    ];

    return (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden h-full">
            <h4 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-6 w-full text-left">Storage Architecture</h4>
            <div className="relative w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={75}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                            formatter={(value: any) => [`${value}%`, '']}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-[#0F172A] dark:text-white">80%</span>
                    <span className="text-[8px] font-bold primary- uppercase tracking-wider">Cold Storage</span>
                </div>
            </div>
            <div className="flex justify-between w-full mt-6 px-4">
                 <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full primary-"></div>
                     <span className="text-[9px] font-bold text-[#0F172A] dark:text-white uppercase">Vault (Offline)</span>
                 </div>
                 <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-red-500"></div>
                     <span className="text-[9px] font-bold text-[#0F172A] dark:text-white uppercase">Hot (Active)</span>
                 </div>
            </div>
        </div>
    );
};

const PriceDisplay: React.FC<{ price: number; change: number }> = ({ price, change }) => {
    const { formatCurrency } = useCurrency();
    const [flash, setFlash] = useState<'green' | 'red' | null>(null);
    const prevPrice = React.useRef(price);

    useEffect(() => {
        if (price > prevPrice.current) setFlash('green');
        else if (price < prevPrice.current) setFlash('red');
        prevPrice.current = price;
        const timer = setTimeout(() => setFlash(null), 800);
        return () => clearTimeout(timer);
    }, [price]);

    return (
        <div className={`transition-all duration-500 px-2 py-1 rounded ${flash === 'green' ? 'bg-emerald-500 text-emerald-400' : flash === 'red' ? 'bg-rose-500 text-rose-400' : ''}`}>
             <p className="font-mono font-black text-lg tracking-tighter">
                {formatCurrency(price)}
            </p>
        </div>
    );
};

export const CryptoDashboard: React.FC<CryptoDashboardProps> = ({ 
    cryptoAssets, 
    setCryptoAssets, 
    holdings, 
    checkingAccount, 
    onBuy, 
    onSell, 
    onStake, 
    onUnstake, 
    marketData 
}) => {
    const { formatCurrency } = useCurrency();
    const systemOptions = useSystemOptions();
    const [selectedAsset, setSelectedAsset] = useState<CryptoAsset | null>(null);
    const [filter, setFilter] = useState<'ALL' | 'MAJOR' | 'DEFI' | 'LAYER1'>('ALL');
    const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState<boolean>(false);

    if (systemOptions?.globalDisabledPaymentMethods?.includes('crypto')) {
        return (
            <div className="max-w-2xl mx-auto py-20 text-center animate-fade-in-up">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <LockClosedIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-3xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight mb-2">Digital Assets Vault Locked</h2>
                <p className="text-[#0F172A] dark:text-white mb-8 max-w-lg mx-auto leading-relaxed">
                    Cryptocurrency bridging and trading are currently disabled globally due to regulatory holds or network-wide audits.
                </p>
            </div>
        );
    }

    useEffect(() => {
        if (!marketData) return;
        setCryptoAssets(prevAssets =>
            prevAssets.map(asset => {
                const rtPrice = marketData.crypto && marketData.crypto[asset.symbol.toUpperCase()];
                if (rtPrice) {
                    const newHistory = [...asset.priceHistory.slice(1), rtPrice];
                    return { ...asset, price: rtPrice, priceHistory: newHistory };
                } else {
                    const volatility = ['btc', 'eth'].includes(asset.id) ? 0.003 : 0.006;
                    const change = (Math.random() - 0.5) * volatility; 
                    const newPrice = asset.price * (1 + change);
                    const newHistory = [...asset.priceHistory.slice(1), newPrice];
                    return { ...asset, price: newPrice, change24h: asset.change24h + (change * 15), priceHistory: newHistory };
                }
            })
        );
    }, [marketData, setCryptoAssets]);

    const portfolioSummary = useMemo(() => {
        let value = 0;
        let cost = 0;
        holdings.forEach(h => {
            const asset = cryptoAssets.find(a => a.id === h.assetId);
            if (asset) {
                value += h.amount * asset.price;
                cost += h.amount * h.avgBuyPrice;
            }
        });
        return { value, pl: value - cost, plPercent: cost > 0 ? ((value - cost) / cost) * 100 : 0 };
    }, [holdings, cryptoAssets]);

    const filteredAssets = useMemo(() => {
        if (filter === 'ALL') return cryptoAssets;
        if (filter === 'MAJOR') return cryptoAssets.slice(0, 3);
        if (filter === 'LAYER1') return cryptoAssets.filter(a => ['ETH', 'SOL', 'BNB', 'ADA', 'DOT', 'TRX'].includes(a.symbol));
        if (filter === 'DEFI') return cryptoAssets.filter(a => ['LINK', 'UNI', 'AAVE'].includes(a.symbol));
        return cryptoAssets;
    }, [cryptoAssets, filter]);

    if (selectedAsset) {
        return (
            <div className="animate-fade-in-up space-y-4">
                <button onClick={() => setSelectedAsset(null)} className="flex items-center gap-3 px-5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-700 text-[#0F172A] dark:text-white rounded-xl border border-slate-100 dark:border-white/10 transition-all text-xs font-black uppercase tracking-[0.2em]">
                    <ChevronLeftIcon className="w-4 h-4 text-primary" /> Multi-Asset Transmission Hub
                </button>
                <TradingView
                    asset={selectedAsset}
                    holdings={holdings}
                    checkingAccount={checkingAccount}
                    onBuy={onBuy}
                    onSell={onSell}
                />
            </div>
        );
    }
    
    return (
        <div className="space-y-10 animate-fade-in pb-16">
            <AssetAllocationIntelligence cryptoHoldings={holdings} cryptoAssets={cryptoAssets} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 bg-[#0c121e] border border-slate-200 dark:border-white/10 rounded-[3rem] p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden group flex flex-col justify-between">
                    {/* Background Visual Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]"></div>
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none group-hover:bg-primary/15 transition-all duration-1000"></div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-2xl border border-slate-200 dark:border-white/10  dark:bg-slate-800">
                                    <ActivityIcon className="w-8 h-8 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-[11px] font-black text-[#0F172A] uppercase tracking-[0.5em] leading-none mb-2">Authenticated Digital Assets</h2>
                                    <h3 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase">Portfolio Core</h3>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2.5">
                                <span className="text-[9px] font-black text-emerald-400 bg-emerald-500 px-3 py-1 rounded-lg border border-emerald-500/20 uppercase tracking-widest shadow-lg">Network: Layer 2 Mainnet</span>
                                <button
                                    onClick={() => setIsPerformanceModalOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-[#0F172A] border border-primary/20 hover:border-primary rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-300 shadow-[0_0_12px_rgba(14,197,242,0.1)] hover:shadow-[0_0_20px_rgba(14,197,242,0.3)] cursor-pointer"
                                >
                                    <TrendingUpIcon className="w-3.5 h-3.5" />
                                    Portfolio Performance
                                </button>
                                <span className="text-[8px] font-mono text-[#0F172A] mt-0.5 font-bold uppercase">TIMESTAMP: {new Date().toISOString()}</span>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                            <div>
                                <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-[0.3em] mb-2">Aggregated Net Valuation</p>
                                <h3 className="text-7xl font-black text-[#0F172A] dark:text-white tracking-tighter font-mono leading-none">
                                    {formatCurrency(portfolioSummary.value)}
                                </h3>
                                <div className={`flex items-center gap-3 mt-6 px-4 py-2 rounded-2xl w-fit font-black text-xs uppercase tracking-widest ${portfolioSummary.pl >= 0 ? 'bg-emerald-500 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500 text-rose-500 border-rose-500/20'}`}>
                                    {portfolioSummary.pl >= 0 ? <TrendingUpIcon className="w-5 h-5" /> : <TrendingUpIcon className="w-5 h-5 transform -scale-y-100" />}
                                    <span>P/L: {portfolioSummary.pl >= 0 ? '+' : ''}{formatCurrency(portfolioSummary.pl)} ({portfolioSummary.plPercent.toFixed(2)}%)</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3 text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 px-5 py-3 rounded-2xl shadow-xl  hover:border-primary/40 transition-all cursor-default">
                                     <ShieldCheckIcon className="w-5 h-5 text-emerald-400" />
                                     Authenticated Hardware Node
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 px-5 py-3 rounded-2xl shadow-xl  hover:border-primary/40 transition-all cursor-default">
                                     <VerifiedBadgeIcon className="w-5 h-5 primary-" />
                                     Tier-1 Liquidity Access
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                    <MarketStatusCard />
                    <div className="grid grid-cols-2 gap-4 h-full">
                         <NetworkFeeTicker />
                         <MarketSentimentGauge />
                    </div>
                </div>
            </div>
            
            {/* Ultra Premium D3 Heatmap */}
            <div className="bg-[#0c121e] rounded-[3rem] shadow-2xl border border-slate-200 dark:border-white/10 p-8">
                 <D3CurrencyHeatmap assets={cryptoAssets} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 bg-[#0c121e] rounded-[3rem] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-white/10 flex flex-col sm:flex-row justify-between items-center gap-8 bg-white  dark:bg-slate-800">
                        <div>
                            <h3 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight uppercase">Global Transmission Hub</h3>
                            <p className="text-[10px] text-[#0F172A] font-bold uppercase tracking-[0.3em] mt-2">Real-time Node Status & Spot Execution</p>
                        </div>
                        <div className="flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200 dark:border-white/10 shadow-inner">
                            {(['ALL', 'MAJOR', 'LAYER1', 'DEFI'] as const).map(f => (
                                <button 
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-all duration-300 ${filter === f ? 'bg-primary text-[#0F172A] dark:text-white shadow-[0_0_20px_rgba(14,197,242,0.4)]' : 'text-[#0F172A] hover:text-[#0F172A] dark:text-white hover:bg-white'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-sm text-left">
                             <thead className="text-[9px] text-[#0F172A] uppercase bg-slate-100 font-black tracking-[0.3em] border-b border-slate-100 dark:border-white/10">
                                 <tr>
                                    <th className="px-8 py-5">Asset Node</th>
                                    <th className="px-8 py-5 text-right">Authenticated Price</th>
                                    <th className="px-8 py-5 text-right">Your Holdings</th>
                                    <th className="px-8 py-5 text-right">Staked Balance</th>
                                    <th className="px-8 py-5 text-right">24H Velocity</th>
                                    <th className="px-8 py-5 text-center">Staked Status</th>
                                    <th className="px-8 py-5 text-center">Protocol Trend</th>
                                    <th className="px-8 py-5 text-right">Node Stability</th>
                                    <th className="px-8 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                 {filteredAssets.map(asset => {
                                     const holding = holdings.find(h => h.assetId === asset.id);
                                     const totalAmount = holding ? holding.amount : 0;
                                     const stakedAmount = holding ? (holding.stakedAmount || 0) : 0;
                                     const hasStaked = stakedAmount > 0;

                                     return (
                                         <tr key={asset.id} className="hover:bg-primary/5 transition-all group cursor-pointer" onClick={() => setSelectedAsset(asset)}>
                                             <td className="px-8 py-6">
                                                 <div className="flex items-center gap-4">
                                                     <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] group-hover:border-primary/50 group-hover:shadow-[0_0_20px_rgba(14,197,242,0.2)] transition-all duration-500">
                                                         <asset.icon className="w-7 h-7 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                                                     </div>
                                                     <div>
                                                         <p className="font-black text-[#0F172A] dark:text-white text-lg tracking-tighter uppercase leading-none mb-1">{asset.name}</p>
                                                         <div className="flex items-center gap-2">
                                                             <span className="text-[9px] font-mono font-bold text-[#0F172A] bg-slate-100 px-2 py-0.5 rounded tracking-[0.2em]">{asset.symbol}</span>
                                                         </div>
                                                     </div>
                                                 </div>
                                             </td>
                                             <td className="px-8 py-6 text-right">
                                                 <PriceDisplay price={asset.price} change={asset.change24h} />
                                             </td>
                                             <td className="px-8 py-6 text-right font-mono font-bold text-[#0F172A] dark:text-white">
                                                 {totalAmount > 0 ? (
                                                     <div>
                                                         <p className="text-sm font-black">{totalAmount.toFixed(4)}</p>
                                                         <p className="text-[8px] text-[#0F172A] uppercase font-bold tracking-widest mt-0.5">{(totalAmount * asset.price).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                                                     </div>
                                                 ) : (
                                                     <span className="text-[#0F172A]">—</span>
                                                 )}
                                             </td>
                                             <td className="px-8 py-6 text-right font-mono font-bold text-[#0F172A] dark:text-white">
                                                 {stakedAmount > 0 ? (
                                                     <div>
                                                         <p className="text-sm font-black text-indigo-400">{stakedAmount.toFixed(4)}</p>
                                                         <p className="text-[8px] text-emerald-400 font-bold tracking-widest mt-0.5">+{holding?.stakingApr || 0}% APR</p>
                                                     </div>
                                                 ) : (
                                                     <span className="text-[#0F172A] text-xs">—</span>
                                                 )}
                                             </td>
                                             <td className="px-8 py-6 text-right">
                                                 <div className={`inline-flex items-center gap-1.5 font-black text-sm tracking-tighter ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                     {asset.change24h >= 0 ? <TrendingUpIcon className="w-3.5 h-3.5" /> : <TrendingUpIcon className="w-3.5 h-3.5 transform -scale-y-100" />}
                                                     {Math.abs(asset.change24h).toFixed(2)}%
                                                 </div>
                                             </td>
                                             <td className="px-8 py-6 text-center">
                                                 {hasStaked ? (
                                                     <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[8px] font-black tracking-widest uppercase bg-indigo-500 text-indigo-300 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)] animate-pulse">
                                                         <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                                                         Staked
                                                     </span>
                                                 ) : totalAmount > 0 ? (
                                                     <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[8px] font-black tracking-widest uppercase bg-emerald-500 text-emerald-400 border border-emerald-500/20">
                                                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                                         Liquid
                                                     </span>
                                                 ) : (
                                                     <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[8px] font-black tracking-widest uppercase bg-slate-50 text-[#0F172A] border border-black/5 dark:bg-slate-900">
                                                         <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                                                         Unowned
                                                     </span>
                                                 )}
                                             </td>
                                             <td className="px-8 py-6">
                                                 <div className="flex justify-center group-hover:scale-110 transition-transform duration-700">
                                                     <Sparkline data={asset.priceHistory} color={asset.change24h >= 0 ? '#10b981' : '#ef4444'} />
                                                 </div>
                                             </td>
                                             <td className="px-8 py-6 text-right">
                                                 <p className="font-mono font-bold text-emerald-400 tracking-widest text-xs">99.9%</p>
                                                 <p className="text-[8px] text-[#0F172A] font-bold uppercase tracking-widest mt-1">SECURE</p>
                                             </td>
                                             <td className="px-8 py-6 text-right">
                                                 <button className="px-6 py-2.5 text-[9px] font-black uppercase tracking-[0.25em] text-[#0F172A] bg-white hover:bg-primary hover:text-[#0F172A] dark:text-white rounded-xl shadow-xl transition-all opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 active:scale-95 dark:bg-slate-800">
                                                     Trade
                                                 </button>
                                             </td>
                                         </tr>
                                     );
                                 })}
                             </tbody>
                        </table>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                     <StakingOverview 
                         holdings={holdings}
                         cryptoAssets={cryptoAssets}
                         onStake={onStake}
                         onUnstake={onUnstake}
                     />
                     <WalletDistribution />
                </div>
            </div>

            <PortfolioPerformanceModal
                isOpen={isPerformanceModalOpen}
                onClose={() => setIsPerformanceModalOpen(false)}
                holdings={holdings}
                cryptoAssets={cryptoAssets}
            />
        </div>
    );
};
