import React, { useState, useEffect, useMemo } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import { CURRENCIES_LIST, EXCHANGE_RATES } from './constants';
import { CurrencySelector } from './CurrencySelector';
import { 
    ArrowsRightLeftIcon, 
    SparklesIcon, 
    CheckCircleIcon, 
    TrendingUpIcon, 
    InfoIcon,
    TrashIcon,
    ActivityIcon,
    ChevronDownIcon
} from './Icons';
import { getFlagUrl } from '../utils/flags';

interface SavedConversion {
    id: string;
    fromCode: string;
    fromAmount: number;
    toCode: string;
    toAmount: number;
    rate: number;
    timestamp: Date;
}

export const RealtimeCurrencyConverter: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const { rates, displayCurrency, setDisplayCurrency, formatCurrency } = useCurrency();
    
    // Core Converter State
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('EUR');
    const [amount, setAmount] = useState('100');
    const [savedConversions, setSavedConversions] = useState<SavedConversion[]>([]);
    const [justSaved, setJustSaved] = useState(false);
    const [justAppliedDisplay, setJustAppliedDisplay] = useState(false);

    // Initial load: Set target currency to display currency if it is different from source
    useEffect(() => {
        if (displayCurrency && displayCurrency !== 'USD') {
            setToCurrency(displayCurrency);
        }
    }, [displayCurrency]);

    // Format display currency changes nicely
    const handleSetDisplayCurrency = () => {
        setDisplayCurrency(toCurrency);
        setJustAppliedDisplay(true);
        setTimeout(() => setJustAppliedDisplay(false), 2000);
    };

    // Calculate conversion rates
    const fromRate = useMemo(() => rates[fromCurrency] || EXCHANGE_RATES[fromCurrency] || 1, [rates, fromCurrency]);
    const toRate = useMemo(() => rates[toCurrency] || EXCHANGE_RATES[toCurrency] || 1, [rates, toCurrency]);
    
    // 1 base unit -> target rate
    const conversionRate = useMemo(() => toRate / fromRate, [fromRate, toRate]);
    const inverseRate = useMemo(() => 1 / conversionRate, [conversionRate]);
    
    const numericAmount = parseFloat(amount) || 0;
    const convertedAmount = numericAmount * conversionRate;

    // Load saved conversions on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('fpb_saved_currency_conversions');
            if (saved) {
                const parsed = JSON.parse(saved);
                setSavedConversions(parsed.map((item: any) => ({
                    ...item,
                    timestamp: new Date(item.timestamp)
                })));
            }
        } catch (e) {
            console.error("Failed to load saved conversions", e);
        }
    }, []);

    // Save calculation to history
    const handleSaveConversion = () => {
        if (numericAmount <= 0) return;
        
        const newRecord: SavedConversion = {
            id: `conv_${Date.now()}`,
            fromCode: fromCurrency,
            fromAmount: numericAmount,
            toCode: toCurrency,
            toAmount: convertedAmount,
            rate: conversionRate,
            timestamp: new Date()
        };

        const updated = [newRecord, ...savedConversions].slice(0, 10); // Keep last 10
        setSavedConversions(updated);
        localStorage.setItem('fpb_saved_currency_conversions', JSON.stringify(updated));

        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
    };

    // Delete a saved conversion
    const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = savedConversions.filter(item => item.id !== id);
        setSavedConversions(updated);
        localStorage.setItem('fpb_saved_currency_conversions', JSON.stringify(updated));
    };

    // Load a saved conversion back into converter
    const handleLoadSaved = (item: SavedConversion) => {
        setFromCurrency(item.fromCode);
        setToCurrency(item.toCode);
        setAmount(item.fromAmount.toString());
    };

    // Quick Currency Pair Quick-pads
    const popularPairs = [
        { from: 'EUR', to: 'USD' },
        { from: 'GBP', to: 'USD' },
        { from: 'USD', to: 'JPY' },
        { from: 'BTC', to: 'USD' },
        { from: 'USD', to: 'CAD' },
        { from: 'GBP', to: 'EUR' }
    ];

    // Quick Selectors
    const popularCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'BTC'];

    const handleSwapCurrencies = () => {
        const temp = fromCurrency;
        setFromCurrency(toCurrency);
        setToCurrency(temp);
        if (convertedAmount > 0) {
            setAmount(Number(convertedAmount.toFixed(4)).toString());
        }
    };

    // Quick percent/multiplier shortcuts
    const handleApplyShortcut = (value: number) => {
        setAmount(value.toString());
    };

    // Popular list values matching the numeric amount
    const otherCurrenciesList = useMemo(() => {
        return popularCurrencies
            .filter(code => code !== fromCurrency)
            .map(code => {
                const targetRate = rates[code] || EXCHANGE_RATES[code] || 1;
                const crossRate = targetRate / fromRate;
                const valueOfAmount = numericAmount * crossRate;
                const info = CURRENCIES_LIST.find(c => c.code === code);
                return {
                    code,
                    rate: crossRate,
                    totalValue: valueOfAmount,
                    symbol: info?.symbol || '$',
                    countryCode: info?.countryCode || 'US',
                    name: info?.name || ''
                };
            });
    }, [fromCurrency, fromRate, rates, numericAmount]);

    const fromCurrencyInfo = CURRENCIES_LIST.find(c => c.code === fromCurrency);
    const toCurrencyInfo = CURRENCIES_LIST.find(c => c.code === toCurrency);

    return (
        <div className="bg-[#0c121e] rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden relative font-sans flex flex-col min-h-[620px] w-full max-w-lg mx-auto">
            {/* Ambient Background FX */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
            
            {/* Header */}
            <div className="p-6 relative z-10 bg-slate-50 dark:bg-slate-900  border-b border-slate-100 dark:border-white/10 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black text-[#0F172A] dark:text-white tracking-tight flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-amber-400 animate-pulse" /> Real-Time Rate Desk
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
                        <span className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest flex items-center gap-1">
                            Live Exchange Streams Active
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-right text-[10px] font-mono text-[#0F172A] hidden sm:block">
                        Base System: USD
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="p-2 bg-slate-200 dark:bg-slate-900 rounded-full hover:bg-slate-300 dark:hover:bg-white transition-colors">
                            <ChevronDownIcon className="w-5 h-5 text-[#0F172A] dark:text-white" />
                        </button>
                    )}
                </div>
            </div>

            {/* Scrollable Converter Body */}
            <div className="p-6 flex-grow overflow-y-auto custom-scrollbar relative z-10 space-y-5 max-h-[70vh]">
                
                {/* SOURCE ELEMENT */}
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-5 space-y-4 shadow-lg">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Source Currency</span>
                        <span className="font-mono text-[10px] text-[#0F172A]">Rate: {fromRate.toFixed(4)} / USD</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <CurrencySelector 
                            selectedCurrency={fromCurrency}
                            onSelect={(c) => setFromCurrency(c)}
                            label="Source currency selection"
                            className="bg-slate-100 hover:bg-slate-100 border border-slate-200 dark:border-white/10 p-2 pl-3 group"
                        />
                        <input 
                            type="number" 
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="bg-transparent text-right text-3xl font-mono font-bold text-[#0F172A] dark:text-white outline-none w-full placeholder-slate-700 focus:ring-0"
                            min="0"
                        />
                    </div>

                    {/* Numeric Presets */}
                    <div className="flex gap-2 justify-end">
                        {[10, 50, 100, 500, 1000].map(val => (
                            <button
                                key={val}
                                onClick={() => handleApplyShortcut(val)}
                                className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${numericAmount === val ? 'bg-primary text-[#0F172A]' : 'bg-white hover:bg-neutral-800 text-[#0F172A]'}`}
                            >
                                {fromCurrencyInfo?.symbol || ''}{val}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Central Interconnection */}
                <div className="flex justify-center -my-3.5 relative z-20">
                    <button 
                        onClick={handleSwapCurrencies}
                        title="Swap Currencies"
                        className="bg-white dark:bg-slate-900 border-4 border-[#0c121e] rounded-full p-2.5 shadow-xl hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-110 transition-all text-primary"
                    >
                        <ArrowsRightLeftIcon className="w-5 h-5 rotate-90" />
                    </button>
                </div>

                {/* TARGET ELEMENT */}
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-5 space-y-4 shadow-lg">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Target Currency</span>
                        <span className="font-mono text-[10px] text-[#0F172A]">Rate: {toRate.toFixed(4)} / USD</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <CurrencySelector 
                            selectedCurrency={toCurrency}
                            onSelect={(c) => setToCurrency(c)}
                            label="Target currency selection"
                            className="bg-slate-100 hover:bg-slate-100 border border-slate-200 dark:border-white/10 p-2 pl-3 group"
                        />
                        <div className="text-right w-full">
                            <p className="text-3xl font-mono font-bold text-emerald-400 truncate select-all">
                                {toCurrencyInfo?.symbol || ''}{' '}
                                {convertedAmount.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: ['BTC', 'ETH'].includes(toCurrency) ? 6 : 4
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Meta Action Elements inside Target box */}
                    <div className="flex justify-between items-center pt-1">
                        <p className="text-[10px] text-[#0F172A] flex items-center gap-1">
                            <InfoIcon className="w-3 h-3 text-[#0F172A] shrink-0" />
                            Inverse: 1 {toCurrency} ≈ {inverseRate.toFixed(4)} {fromCurrency}
                        </p>
                        {displayCurrency !== toCurrency ? (
                            <button
                                onClick={handleSetDisplayCurrency}
                                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1 transition-all ${
                                    justAppliedDisplay 
                                    ? 'bg-emerald-500 border-emerald-500/30 text-emerald-400' 
                                    : 'bg-white border-slate-300 text-[#0F172A] hover:bg-white'
                                }`}
                            >
                                {justAppliedDisplay ? (
                                    <>
                                        <CheckCircleIcon className="w-3 h-3" />
                                        Applied!
                                    </>
                                ) : (
                                    'Set as App Display Currency'
                                )}
                            </button>
                        ) : (
                            <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20">
                                Active Display Currency
                            </span>
                        )}
                    </div>
                </div>

                {/* Exchange Rates Stream Info */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-white/10 space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-[#0F172A] font-semibold">Standard Exchange Rate</span>
                        <span className="text-[#0F172A] dark:text-white font-mono font-bold">1 {fromCurrency} = {conversionRate.toFixed(4)} {toCurrency}</span>
                    </div>
                    <div className="h-px bg-slate-200 dark:bg-slate-900"></div>
                    <div className="flex justify-between text-[11px] text-[#0F172A] font-mono">
                        <span>Fee Tier</span>
                        <span className="text-emerald-400 font-bold">0.00% FREE (Standard Calc)</span>
                    </div>
                </div>

                {/* Quick Currency Pairs Shortcut Matrix */}
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-wider">Common Exchange Anchors</p>
                    <div className="grid grid-cols-3 gap-2">
                        {popularPairs.map(pair => {
                            const active = fromCurrency === pair.from && toCurrency === pair.to;
                            return (
                                <button
                                    key={`${pair.from}-${pair.to}`}
                                    onClick={() => {
                                        setFromCurrency(pair.from);
                                        setToCurrency(pair.to);
                                    }}
                                    className={`py-2 px-3 rounded-xl border text-[11px] font-bold text-center transition-all ${
                                        active 
                                        ? 'bg-primary/20 border-primary text-primary-300' 
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-[#0F172A] hover:bg-slate-850 hover:text-white'
                                    }`}
                                >
                                    {pair.from} ➔ {pair.to}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Popular Rates Desk Multi-Cross Table */}
                {numericAmount > 0 && (
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl border border-slate-850">
                        <div className="flex justify-between items-center">
                            <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-1">
                                <TrendingUpIcon className="w-3 h-3 text-emerald-400" /> Current Value Cross-Rates
                            </p>
                            <span className="text-[9px] text-[#0F172A] font-mono">Based on {fromCurrencyInfo?.symbol || ''}{numericAmount}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {otherCurrenciesList.slice(0, 6).map(cross => (
                                <button
                                    key={cross.code}
                                    onClick={() => setToCurrency(cross.code)}
                                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 border border-slate-200 hover:border-slate-300 transition-colors text-left"
                                >
                                    <div className="flex items-center space-x-2">
                                        <img 
                                            src={getFlagUrl(cross.countryCode)} 
                                            alt={cross.name} 
                                            className="w-5 h-5 rounded-full object-cover shrink-0" 
                                        />
                                        <div>
                                            <p className="text-xs font-bold text-[#0F172A] dark:text-white">{cross.code}</p>
                                            <p className="text-[9px] text-[#0F172A] truncate max-w-[80px]">{cross.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-mono font-bold text-[#0F172A]">
                                            {cross.symbol}{' '}
                                            {cross.totalValue.toLocaleString(undefined, {
                                                maximumFractionDigits: ['BTC', 'ETH'].includes(cross.code) ? 6 : 2,
                                                minimumFractionDigits: 2
                                            })}
                                        </p>
                                        <p className="text-[8px] text-[#0F172A] font-mono">1➔{cross.rate.toFixed(3)}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Save Calculation Call to Action */}
                <button
                    onClick={handleSaveConversion}
                    disabled={numericAmount <= 0}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-wider text-xs shadow-xl transition-all flex items-center justify-center gap-2 ${
                        justSaved 
                        ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/10' 
                        : 'bg-primary hover:bg-opacity-90 text-slate-950 shadow-primary/10 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 disabled:opacity-70 disabled:pointer-events-none'
                    }`}
                >
                    {justSaved ? (
                        <>
                            <CheckCircleIcon className="w-4 h-4 text-slate-950" />
                            Conversion Bookmarked!
                        </>
                    ) : (
                        <>
                            <CheckCircleIcon className="w-4 h-4" />
                            Bookmark This Conversion
                        </>
                    )}
                </button>

                {/* Saved Conversions Register */}
                {savedConversions.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest flex items-center gap-1">
                                <ActivityIcon className="w-3.5 h-3.5 text-[#0F172A]" /> Bookmarked Conversions ({savedConversions.length})
                            </p>
                            <button
                                onClick={() => {
                                    setSavedConversions([]);
                                    localStorage.removeItem('fpb_saved_currency_conversions');
                                }}
                                className="text-[9px] text-rose-500 hover:underline font-bold"
                            >
                                Clear All
                            </button>
                        </div>
                        <ul className="space-y-1.5 h-28 overflow-y-auto scrollbar-hide pr-1">
                            {savedConversions.map(item => (
                                <li 
                                    key={item.id}
                                    onClick={() => handleLoadSaved(item)}
                                    className="flex items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-850 hover:bg-slate-100 cursor-pointer group transition-all"
                                >
                                    <div className="text-left">
                                        <p className="text-xs font-mono font-bold text-[#0F172A]">
                                            {item.fromAmount} {item.fromCode} ➔ {item.toAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {item.toCode}
                                        </p>
                                        <p className="text-[8px] text-[#0F172A] font-mono">
                                            Rate: {item.rate.toFixed(4)} • {new Date(item.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteSaved(item.id, e)}
                                        className="p-1 text-[#0F172A] hover:text-rose-500 bg-white hover:bg-rose-500 rounded transition-colors dark:bg-slate-800"
                                        title="Delete Bookmark"
                                    >
                                        <TrashIcon className="w-3 h-3" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};
