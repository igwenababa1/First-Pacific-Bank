
import React, { useState, useMemo, useEffect } from 'react';
import { CryptoAsset, CryptoHolding, Account, Order, Trade } from '../types';
import { SpinnerIcon, TrendingUpIcon, ClockIcon, ShieldCheckIcon, ActivityIcon, GlobeAmericasIcon, LockClosedIcon, ServerIcon, SparklesIcon, ChevronRightIcon, ArrowDownTrayIcon, PackageIcon } from './Icons';
import { TradeConfirmationModal } from './TradeConfirmationModal';
import { generateRealisticTradeHistory } from './constants';

interface TradingViewProps {
    asset: CryptoAsset;
    holdings: CryptoHolding[];
    checkingAccount?: Account;
    onBuy: (assetId: string, usdAmount: number, assetPrice: number) => boolean;
    onSell: (assetId: string, cryptoAmount: number, assetPrice: number) => boolean;
}

const CandlestickChart: React.FC<{ data: number[] }> = ({ data }) => {
    const { candles, volumes, maShort, maLong } = useMemo(() => {
        const c = data.map((close, i) => {
            if (i === 0) return null;
            const prevClose = data[i-1];
            const open = prevClose;
            const high = Math.max(open, close) + (Math.random() * (close * 0.003));
            const low = Math.min(open, close) - (Math.random() * (close * 0.003));
            return { open, high, low, close, x: i };
        }).filter(c => c !== null) as { open: number, high: number, low: number, close: number, x: number }[];

        const v = c.map(() => Math.random() * 100);
        const calcMA = (period: number) => {
            return data.map((_, i) => {
                if (i < period) return null;
                const slice = data.slice(i - period, i);
                return slice.reduce((a, b) => a + b, 0) / period;
            }).slice(1);
        };
        return { candles: c, volumes: v, maShort: calcMA(14), maLong: calcMA(50) };
    }, [data]);

    const minPrice = Math.min(...candles.map(c => c.low));
    const maxPrice = Math.max(...candles.map(c => c.high));
    const maxVol = Math.max(...volumes);
    const priceRange = maxPrice - minPrice;
    const height = 300;
    const volHeight = 80;

    const maPoints = (ma: (number|null)[]) => ma.map((p, i) => {
        if (p === null) return '';
        const x = (i / (data.length - 2)) * 100;
        const y = height - ((p - minPrice) / priceRange) * height;
        return `${x},${y}`;
    }).filter(p => p !== '').join(' ');

    return (
        <div className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 rounded-[2.5rem] relative overflow-hidden shadow-inner p-8">
            <div className="absolute top-6 left-8 flex gap-6 z-20">
                <div className="flex flex-col"><span className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest">Protocol</span><span className="text-sm font-black text-[#0F172A] dark:text-white font-mono tracking-tighter">O: {candles[candles.length-1].open.toFixed(2)}</span></div>
                <div className="flex flex-col"><span className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest">Volatility</span><span className="text-sm font-black text-[#0F172A] dark:text-white font-mono tracking-tighter">H: {candles[candles.length-1].high.toFixed(2)}</span></div>
                <div className="flex flex-col"><span className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest">Floor</span><span className="text-sm font-black text-[#0F172A] dark:text-white font-mono tracking-tighter">L: {candles[candles.length-1].low.toFixed(2)}</span></div>
            </div>
            <svg className="w-full h-[400px]" preserveAspectRatio="none">
                {[0, 0.25, 0.5, 0.75, 1].map(v => ( <line key={v} x1="0" y1={height * v} x2="100%" y2={height * v} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" /> ))}
                {candles.map((candle, i) => {
                    const x = (i / (candles.length)) * 100;
                    const candleWidth = (100 / candles.length) * 0.75;
                    const yHigh = height - ((candle.high - minPrice) / priceRange) * height;
                    const yLow = height - ((candle.low - minPrice) / priceRange) * height;
                    const yOpen = height - ((candle.open - minPrice) / priceRange) * height;
                    const yClose = height - ((candle.close - minPrice) / priceRange) * height;
                    const isGreen = candle.close >= candle.open;
                    const color = isGreen ? '#10b981' : '#ef4444';
                    const bodyTop = Math.min(yOpen, yClose);
                    const bodyHeight = Math.max(Math.abs(yOpen - yClose), 1.5);
                    return (
                        <g key={i} className="transition-all duration-300">
                            <line x1={`${x}%`} y1={yHigh} x2={`${x}%`} y2={yLow} stroke={color} strokeWidth="1.2" />
                            <rect x={`${x - (candleWidth/2)}%`} y={bodyTop} width={`${candleWidth}%`} height={bodyHeight} fill={color} rx="1.5" className="shadow-2xl" />
                            <rect x={`${x - (candleWidth/2)}%`} y={height + volHeight - (volumes[i] / maxVol) * volHeight} width={`${candleWidth}%`} height={(volumes[i] / maxVol) * volHeight} fill={color} opacity="0.15" />
                        </g>
                    )
                })}
                <polyline points={maPoints(maShort)} fill="none" stroke="#38cffb" strokeWidth="2" opacity="0.8" strokeLinecap="round" />
                <polyline points={maPoints(maLong)} fill="none" stroke="#8b5cf6" strokeWidth="2" opacity="0.8" strokeLinecap="round" />
            </svg>
            <div className="absolute right-8 top-6 flex flex-col gap-2 text-[9px] font-mono p-3 bg-slate-100  rounded-xl border border-slate-200 dark:border-white/10">
                <span className="text-primary flex items-center gap-2"><div className="w-2 h-2 bg-current rounded-full shadow-[0_0_8px_currentColor]"></div> MA(14)</span>
                <span className="text-purple-400 flex items-center gap-2"><div className="w-2 h-2 bg-current rounded-full shadow-[0_0_8px_currentColor]"></div> MA(50)</span>
            </div>
            <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-[#0F172A] p-4 font-mono border-l border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800 ">
                <span>{maxPrice.toLocaleString()}</span>
                <span className="opacity-40">{((maxPrice + minPrice) / 2).toLocaleString()}</span>
                <span>{minPrice.toLocaleString()}</span>
            </div>
        </div>
    );
};

const NodeActivityLedger: React.FC<{ asset: CryptoAsset }> = ({ asset }) => {
    const [trades, setTrades] = useState<Trade[]>([]);
    useEffect(() => {
        setTrades(generateRealisticTradeHistory(asset.price));
        const interval = setInterval(() => {
            setTrades(prev => {
                const newTrade: Trade = {
                    id: `tr_${Date.now()}`,
                    price: asset.price * (1 + (Math.random() - 0.5) * 0.002),
                    size: Math.random() * 5,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    type: Math.random() > 0.5 ? 'buy' : 'sell'
                };
                return [newTrade, ...prev.slice(0, 14)];
            });
        }, 3000);
        return () => clearInterval(interval);
    }, [asset.price]);

    return (
        <div className="bg-[#0c121e] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl h-full flex flex-col overflow-hidden">
            <h4 className="text-[10px] font-black text-[#0F172A] uppercase tracking-[0.4em] flex items-center gap-3 mb-6">
                <ServerIcon className="w-4 h-4 text-primary" /> Public Network Tape
            </h4>
            <div className="space-y-1.5 flex-grow overflow-y-auto custom-scrollbar pr-2">
                {trades.map(t => (
                    <div key={t.id} className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white transition-colors group dark:bg-slate-800">
                        <div className="flex items-center gap-4">
                            <span className="text-[9px] font-mono text-[#0F172A] font-bold">{t.time}</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${t.type === 'buy' ? 'text-emerald-500' : 'text-rose-500'}`}>{t.type}</span>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-mono font-bold text-[#0F172A] dark:text-[#1E293B]">${t.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            <p className="text-[9px] text-[#0F172A] font-mono">{t.size.toFixed(4)} {asset.symbol}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 flex justify-between items-center text-[9px] font-black text-[#0F172A] uppercase tracking-widest">
                <span>Network: Global Layer-1</span>
                <span className="flex items-center gap-1"><ShieldCheckIcon className="w-3 h-3 text-emerald-500" /> SECURE_TAPE</span>
            </div>
        </div>
    );
};

export const TradingView: React.FC<TradingViewProps> = ({ asset, holdings, checkingAccount, onBuy, onSell }) => {
    const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
    const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
    const [amount, setAmount] = useState('');
    const [isConfirming, setIsConfirming] = useState(false);
    const [timeframe, setTimeframe] = useState('1H');

    const holding = holdings.find(h => h.assetId === asset.id);
    const assetBalance = holding?.amount || 0;
    const usdBalance = checkingAccount?.balance || 0;
    const numericAmount = parseFloat(amount) || 0;
    const cryptoAmount = numericAmount / asset.price;
    const isTradeInvalid = tradeType === 'buy' ? numericAmount <= 0 || numericAmount > usdBalance : cryptoAmount <= 0 || cryptoAmount > assetBalance;

    const handleExecuteTrade = (): boolean => {
        const success = tradeType === 'buy' ? onBuy(asset.id, numericAmount, asset.price) : onSell(asset.id, cryptoAmount, asset.price);
        if (success) setAmount('');
        setIsConfirming(false);
        return success;
    };

    return (
        <div className="bg-[#0c121e] rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] border border-slate-200 dark:border-white/10 overflow-hidden relative">
            <div className="p-10 border-b border-slate-100 dark:border-white/10 flex flex-col lg:flex-row justify-between items-center gap-10 bg-white  relative z-20 dark:bg-slate-800">
                <div className="flex items-center gap-8">
                    <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center shadow-2xl border border-slate-200 dark:border-white/10 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <asset.icon className="w-12 h-12 transition-transform duration-500 group-hover:scale-110 relative z-10" />
                    </div>
                    <div>
                        <div className="flex items-center gap-4">
                            <h2 className="text-4xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase leading-none">{asset.name}</h2>
                            <span className="text-xs font-mono font-bold text-primary-400 bg-primary-500/10 px-4 py-1.5 rounded-xl tracking-[0.3em] border border-primary-500/20">{asset.symbol}/USD</span>
                        </div>
                        <div className={`flex items-center gap-4 mt-3 font-mono ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            <span className="text-[#0F172A] dark:text-white text-3xl font-black tracking-tighter">{asset.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                            <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-slate-100 dark:border-white/10 dark:bg-slate-800">
                                <span className="font-bold text-lg">{asset.change24h >= 0 ? '▲' : '▼'} {Math.abs(asset.change24h).toFixed(2)}%</span>
                                <span className="text-[10px] text-[#0F172A] uppercase font-black tracking-widest">24H Flow</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 p-1.5 bg-slate-100 rounded-[1.5rem] border border-slate-200 dark:border-white/10 shadow-inner">
                    {['1H', '4H', '1D', '1W', '1M'].map(tf => ( <button key={tf} onClick={() => setTimeframe(tf)} className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${timeframe === tf ? 'bg-primary text-[#0F172A] dark:text-white shadow-lg' : 'text-[#0F172A] hover:text-[#0F172A] dark:text-white hover:bg-white'}`}>{tf}</button> ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12">
                <div className="lg:col-span-8 p-10 border-r border-slate-100 dark:border-white/10 space-y-12">
                    <CandlestickChart data={asset.priceHistory} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <NodeActivityLedger asset={asset} />
                        <div className="space-y-8">
                             <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-[2.5rem] p-8 shadow-xl">
                                <h4 className="text-[10px] font-black text-[#0F172A] uppercase tracking-[0.3em] mb-6 flex items-center gap-3"><ClockIcon className="w-4 h-4 text-primary" /> Transmission History</h4>
                                <div className="space-y-4">
                                    {[
                                        { title: "Node Synchronized", desc: "Global ledger verified with L1 cluster.", icon: ServerIcon },
                                        { title: "Whale Alert", desc: "Transmission of 5,000+ units detected.", icon: ActivityIcon },
                                        { title: "Protocol Upgrade", desc: "Smart contract core transitioned to v4.2.1.", icon: PackageIcon }
                                    ].map((ev, i) => (
                                        <div key={i} className="flex gap-4 group">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-[#0F172A] group-hover:text-primary transition-colors shrink-0"><ev.icon className="w-5 h-5" /></div>
                                            <div>
                                                <p className="text-sm font-bold text-[#0F172A] dark:text-[#1E293B] group-hover:text-[#0F172A] dark:text-white transition-colors">{ev.title}</p>
                                                <p className="text-xs text-[#0F172A] leading-tight">{ev.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             </div>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Market Cap', val: `$${(asset.marketCap / 1e9).toFixed(2)}B`, sub: 'Institutional Rank: 1', icon: GlobeAmericasIcon },
                                    { label: 'Volatility', val: '0.12%', sub: 'Risk Factor: Low', icon: ActivityIcon },
                                    { label: 'Support', val: `$${(asset.price * 0.94).toLocaleString()}`, sub: 'Institutional Floor', icon: LockClosedIcon },
                                    { label: 'Uptime', val: '99.999%', sub: 'Node Continuity', icon: ShieldCheckIcon }
                                ].map(stat => (
                                    <div key={stat.label} className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-white/10 shadow-inner group hover:border-primary/40 transition-all flex flex-col justify-between h-32">
                                        <div className="flex justify-between items-start">
                                            <p className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest leading-none">{stat.label}</p>
                                            <stat.icon className="w-3.5 h-3.5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div><p className="text-[#0F172A] dark:text-white font-mono font-black tracking-tighter text-lg">{stat.val}</p><p className="text-[9px] text-[#0F172A] font-bold uppercase mt-1 tracking-wider">{stat.sub}</p></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 p-10 bg-slate-100 flex flex-col h-full relative">
                    <div className="bg-[#0c121e] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-10 shadow-2xl flex-grow flex flex-col relative z-10">
                        <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-8 border border-slate-100 dark:border-white/10">
                            <button onClick={() => setTradeType('buy')} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-[0.3em] transition-all duration-500 ${tradeType === 'buy' ? 'bg-emerald-600 text-[#0F172A] dark:text-white shadow-2xl' : 'text-[#0F172A]'}`}>Buy</button>
                            <button onClick={() => setTradeType('sell')} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-[0.3em] transition-all duration-500 ${tradeType === 'sell' ? 'bg-rose-600 text-[#0F172A] dark:text-white shadow-2xl' : 'text-[#0F172A]'}`}>Sell</button>
                        </div>
                        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-10 border border-slate-100 dark:border-white/10">
                            {['market', 'limit', 'stop'].map(t => ( <button key={t} onClick={() => setOrderType(t as any)} className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${orderType === t ? 'bg-slate-100 dark:bg-slate-700 text-[#0F172A] dark:text-white shadow-md' : 'text-[#0F172A]'}`}>{t}</button> ))}
                        </div>
                        <div className="space-y-8 flex-grow">
                            <div>
                                <div className="flex justify-between text-[10px] font-black text-[#0F172A] uppercase tracking-[0.2em] mb-4 px-1"><span>Available Nodes</span><span className="text-[#0F172A] dark:text-white font-mono">{tradeType === 'buy' ? usdBalance.toLocaleString('en-US', {style:'currency', currency:'USD'}) : `${assetBalance.toFixed(6)} ${asset.symbol}`}</span></div>
                                <div className="relative"><input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-slate-100 border-2 border-slate-200 dark:border-slate-700 rounded-3xl p-6 text-[#0F172A] dark:text-white font-mono text-2xl focus:border-primary outline-none shadow-inner transition-all placeholder-slate-900" placeholder="0.00" /><span className="absolute right-6 top-1/2 -translate-y-1/2 text-[#0F172A] font-black text-sm tracking-[0.2em] uppercase">USD</span></div>
                            </div>
                            <div className="p-8 bg-slate-100 rounded-[2rem] border border-slate-100 dark:border-white/10 space-y-5 shadow-inner relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-30"></div>
                                <div className="flex justify-between text-xs font-bold"><span className="text-[#0F172A] uppercase tracking-widest">Protocol Fee (0.5%)</span><span className="text-[#0F172A] dark:text-white font-mono">${(numericAmount * 0.005).toFixed(2)}</span></div>
                                <div className="flex justify-between text-xs font-bold"><span className="text-[#0F172A] uppercase tracking-widest">Execution Layer</span><span className="text-emerald-400 font-black uppercase">DIRECT_L2</span></div>
                                <div className="h-px bg-white dark:bg-slate-800"></div>
                                <div className="flex justify-between items-end"><span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Estimated Output</span><div className="text-right"><p className="text-3xl font-black text-[#0F172A] dark:text-white font-mono tracking-tighter">{tradeType === 'buy' ? `~${cryptoAmount.toFixed(6)}` : `~${(cryptoAmount * asset.price).toLocaleString('en-US', {style:'currency', currency:'USD'})}`}</p>{tradeType === 'buy' && <p className="text-[10px] text-[#0F172A] font-black uppercase tracking-widest mt-1">{asset.symbol} Units</p>}</div></div>
                            </div>
                        </div>
                        <button onClick={() => setIsConfirming(true)} disabled={isTradeInvalid} className={`w-full py-6 mt-10 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] text-[#0F172A] dark:text-white shadow-2xl transition-all transform active:scale-[0.98] hover:-translate-y-1 disabled:opacity-20 disabled:cursor-not-allowed ${tradeType === 'buy' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/40'}`}>Confirm {tradeType === 'buy' ? 'Liquidity Inflow' : 'Asset Liquidation'}</button>
                    </div>
                </div>
            </div>
            {isConfirming && ( <TradeConfirmationModal asset={asset} tradeType={tradeType} usdAmount={numericAmount} cryptoAmount={cryptoAmount} onClose={() => setIsConfirming(false)} onConfirm={handleExecuteTrade} /> )}
        </div>
    );
};
