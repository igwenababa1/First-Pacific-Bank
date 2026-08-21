import React, { useState, useMemo } from 'react';
import { CryptoAsset, CryptoHolding } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { 
    X, 
    TrendingUp, 
    TrendingDown, 
    HelpCircle, 
    Sparkles, 
    ShieldCheck, 
    LineChart as ChartIcon, 
    DollarSign, 
    Info 
} from 'lucide-react';
import { 
    ResponsiveContainer, 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    Tooltip, 
    CartesianGrid,
    ReferenceLine
} from 'recharts';

interface PortfolioPerformanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    holdings: CryptoHolding[];
    cryptoAssets: CryptoAsset[];
}

export const PortfolioPerformanceModal: React.FC<PortfolioPerformanceModalProps> = ({
    isOpen,
    onClose,
    holdings,
    cryptoAssets
}) => {
    const { formatCurrency } = useCurrency();
    const [selectedHoldingId, setSelectedHoldingId] = useState<string>('CONSOLIDATED');

    if (!isOpen) return null;

    // Filter holdings that the user actually owns (amount > 0)
    const activeHoldings = useMemo(() => {
        return holdings.filter(h => h.amount > 0);
    }, [holdings]);

    // Format dates for past 7 days (including today)
    const dates = useMemo(() => {
        const list = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            list.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        return list;
    }, []);

    // Generate chart data based on selection
    const chartData = useMemo(() => {
        if (activeHoldings.length === 0) return [];

        // For each of the 7 data points in the price history
        const points = [];
        for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
            const dateLabel = dates[dayIdx];
            let totalValue = 0;
            let totalCost = 0;

            if (selectedHoldingId === 'CONSOLIDATED') {
                // Sum across all owned holdings
                activeHoldings.forEach(h => {
                    const asset = cryptoAssets.find(a => a.id === h.assetId);
                    if (asset && asset.priceHistory && asset.priceHistory.length >= 7) {
                        const historySlice = asset.priceHistory.slice(-7);
                        const dayPrice = historySlice[dayIdx] ?? asset.price;
                        totalValue += h.amount * dayPrice;
                        totalCost += h.amount * h.avgBuyPrice;
                    }
                });
            } else {
                // Single holding selected
                const h = activeHoldings.find(holding => holding.assetId === selectedHoldingId);
                const asset = cryptoAssets.find(a => a.id === selectedHoldingId);
                if (h && asset && asset.priceHistory && asset.priceHistory.length >= 7) {
                    const historySlice = asset.priceHistory.slice(-7);
                    const dayPrice = historySlice[dayIdx] ?? asset.price;
                    totalValue = h.amount * dayPrice;
                    totalCost = h.amount * h.avgBuyPrice;
                }
            }

            const profitLossUsd = totalValue - totalCost;
            const roiPercent = totalCost > 0 ? (profitLossUsd / totalCost) * 100 : 0;

            points.push({
                day: dateLabel,
                value: parseFloat(totalValue.toFixed(2)),
                cost: parseFloat(totalCost.toFixed(2)),
                plUsd: parseFloat(profitLossUsd.toFixed(2)),
                roi: parseFloat(roiPercent.toFixed(2))
            });
        }
        return points;
    }, [activeHoldings, cryptoAssets, selectedHoldingId, dates]);

    // Statistics based on active selection
    const stats = useMemo(() => {
        if (chartData.length === 0) return { initial: 0, current: 0, pl: 0, roi: 0 };
        const firstPoint = chartData[0];
        const lastPoint = chartData[chartData.length - 1];
        
        return {
            initial: firstPoint.value,
            current: lastPoint.value,
            pl: lastPoint.plUsd,
            roi: lastPoint.roi
        };
    }, [chartData]);

    const activeAssetDetails = useMemo(() => {
        if (selectedHoldingId === 'CONSOLIDATED') return null;
        return cryptoAssets.find(a => a.id === selectedHoldingId);
    }, [selectedHoldingId, cryptoAssets]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-100  animate-fade-in">
            <div 
                id="portfolio-performance-modal" 
                className="w-full max-w-5xl bg-[#080d16] border border-slate-200 dark:border-white/10 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative"
            >
                {/* Visual Accent Borders */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-primary to-emerald-400"></div>
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

                {/* Header */}
                <div className="flex justify-between items-center px-8 py-6 border-b border-slate-200 dark:border-white/10 relative z-10">
                    <div className="flex items-center gap-3.5">
                        <div className="p-3 bg-white rounded-2xl border border-slate-200 dark:border-white/10 dark:bg-slate-800">
                            <ChartIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-[10px] font-black text-[#0F172A] uppercase tracking-[0.4em] mb-1">Portfolio Intelligence Core</h2>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Growth & Performance Audit</h3>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2.5 rounded-full bg-slate-50 border border-black/5 hover:border-white/20 text-[#0F172A] hover:text-white transition-all cursor-pointer active:scale-95 dark:bg-slate-900"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                {activeHoldings.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-black/5 mb-6 text-[#0F172A] dark:bg-slate-800">
                            <DollarSign className="w-8 h-8" />
                        </div>
                        <h4 className="text-lg font-bold text-white uppercase tracking-wider mb-2">No Active Holdings Authenticated</h4>
                        <p className="text-xs text-[#0F172A] max-w-md leading-relaxed">
                            You must acquire digital assets from the Global Transmission Hub first. Once purchased, your 7-day profit and loss performance curve will be generated instantly.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-white/5">
                        {/* Left Sidebar - Holdings Selector */}
                        <div className="lg:col-span-3 p-6 flex flex-col space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                            <h4 className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest font-mono">Select Holding Node</h4>
                            <div className="space-y-2">
                                <button
                                    onClick={() => setSelectedHoldingId('CONSOLIDATED')}
                                    className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${selectedHoldingId === 'CONSOLIDATED' ? 'bg-primary/10 border-primary text-white shadow-lg' : 'bg-slate-100 border-black/5 hover:border-black/5 text-[#0F172A]'}`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center border border-indigo-500/20">
                                            <Sparkles className="w-4 h-4 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-wider">Consolidated</p>
                                            <p className="text-[9px] font-mono mt-0.5 text-[#0F172A]">All Holdings</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold">ALL</span>
                                </button>

                                {activeHoldings.map(h => {
                                    const asset = cryptoAssets.find(a => a.id === h.assetId);
                                    if (!asset) return null;
                                    const isSelected = selectedHoldingId === h.assetId;

                                    return (
                                        <button
                                            key={h.assetId}
                                            onClick={() => setSelectedHoldingId(h.assetId)}
                                            className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${isSelected ? 'bg-primary/10 border-primary text-white shadow-lg' : 'bg-slate-100 border-black/5 hover:border-black/5 text-[#0F172A]'}`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center border border-black/5">
                                                    {React.createElement(asset.icon, { className: 'w-4 h-4 text-white' })}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-wider">{asset.name}</p>
                                                    <p className="text-[9px] font-mono mt-0.5 text-[#0F172A]">
                                                        {h.amount.toFixed(4)} {asset.symbol}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-mono font-bold uppercase">{asset.symbol}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Area - Chart and Insights */}
                        <div className="lg:col-span-9 p-8 flex flex-col space-y-8">
                            {/* Performance Header & Highlight Statistics */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-slate-100 rounded-2xl border border-black/5 flex flex-col justify-between">
                                    <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-wider font-mono">Period Start Value</span>
                                    <p className="text-lg font-black font-mono text-white mt-1">{formatCurrency(stats.initial)}</p>
                                    <span className="text-[8px] text-[#0F172A] mt-1 uppercase">7 Days Ago</span>
                                </div>
                                <div className="p-4 bg-slate-100 rounded-2xl border border-black/5 flex flex-col justify-between">
                                    <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-wider font-mono">Aggregated Net Value</span>
                                    <p className="text-lg font-black font-mono text-white mt-1">{formatCurrency(stats.current)}</p>
                                    <span className="text-[8px] text-[#0F172A] mt-1 uppercase">Current Block Price</span>
                                </div>
                                <div className="p-4 bg-slate-100 rounded-2xl border border-black/5 flex flex-col justify-between">
                                    <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-wider font-mono">Net Profit / Loss</span>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        {stats.pl >= 0 ? (
                                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                                        ) : (
                                            <TrendingDown className="w-4 h-4 text-rose-400" />
                                        )}
                                        <p className={`text-lg font-black font-mono ${stats.pl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {stats.pl >= 0 ? '+' : ''}{formatCurrency(stats.pl)}
                                        </p>
                                    </div>
                                    <span className="text-[8px] text-[#0F172A] mt-1 uppercase">Cumulative P/L</span>
                                </div>
                                <div className="p-4 bg-slate-100 rounded-2xl border border-black/5 flex flex-col justify-between">
                                    <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-wider font-mono">Holding ROI</span>
                                    <p className={`text-lg font-black font-mono mt-1 ${stats.roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(2)}%
                                    </p>
                                    <span className="text-[8px] text-[#0F172A] mt-1 uppercase">Rate of Return</span>
                                </div>
                            </div>

                            {/* Chart Area */}
                            <div className="flex-1 min-h-[260px] bg-slate-100 border border-black/5 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute top-4 left-6 z-20">
                                    <h4 className="text-[9px] font-black text-[#0F172A] uppercase tracking-wider font-mono">Growth Index Vector</h4>
                                </div>
                                
                                <div className="w-full h-56 mt-4 relative z-10">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorPl" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={stats.pl >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.2}/>
                                                    <stop offset="95%" stopColor={stats.pl >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                            <XAxis 
                                                dataKey="day" 
                                                stroke="rgba(255,255,255,0.2)" 
                                                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 'bold', fontFamily: 'monospace' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis 
                                                stroke="rgba(255,255,255,0.2)"
                                                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 'bold', fontFamily: 'monospace' }}
                                                domain={['auto', 'auto']}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                contentStyle={{ 
                                                    backgroundColor: '#080d16', 
                                                    borderColor: 'rgba(255,255,255,0.1)', 
                                                    borderRadius: '16px',
                                                    color: '#fff',
                                                    fontSize: '11px',
                                                    fontWeight: 'bold',
                                                    fontFamily: 'monospace'
                                                }}
                                                formatter={(value: any, name: any) => {
                                                    const label = String(name);
                                                    if (label === 'value') return [formatCurrency(value), 'Holding Value'];
                                                    if (label === 'plUsd') return [formatCurrency(value), 'P/L (USD)'];
                                                    if (label === 'roi') return [`${value}%`, 'ROI'];
                                                    return [value, label];
                                                }}
                                            />
                                            <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                                            <Area 
                                                type="monotone" 
                                                dataKey="value" 
                                                stroke={stats.pl >= 0 ? '#10b981' : '#ef4444'} 
                                                strokeWidth={2.5}
                                                fillOpacity={1} 
                                                fill="url(#colorPl)" 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Intelligent Insight / Description Footer */}
                            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3.5 items-start text-left">
                                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <h5 className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">
                                        Holding Performance Audit
                                    </h5>
                                    <p className="text-[10px] text-[#0F172A] font-bold leading-relaxed">
                                        {selectedHoldingId === 'CONSOLIDATED' ? (
                                            `Your consolidated digital asset portfolio has generated a net P/L of ${formatCurrency(stats.pl)} (${stats.roi >= 0 ? '+' : ''}${stats.roi.toFixed(2)}% ROI) over the past 7 days, backed by authentic Layer-2 distributed settlement blocks.`
                                        ) : (
                                            `Your ${activeAssetDetails?.name} holding of ${activeHoldings.find(h => h.assetId === selectedHoldingId)?.amount.toFixed(4)} ${activeAssetDetails?.symbol} shows a 7-day price trajectory with a net buy cost basis of ${formatCurrency((activeHoldings.find(h => h.assetId === selectedHoldingId)?.avgBuyPrice || 0) * (activeHoldings.find(h => h.assetId === selectedHoldingId)?.amount || 0))}.`
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
