import React, { useState, useEffect, useMemo } from 'react';
import { 
    DollarSign as CurrencyDollarIcon, 
    CheckCircle2 as CheckCircleIcon, 
    X as XMarkIcon, 
    RefreshCw as ArrowPathIcon, 
    Filter as FunnelIcon,
    Search as MagnifyingGlassIcon,
    AlertTriangle as ShieldExclamationIcon,
    Coins as BanknotesIcon,
    Sparkles as SparklesIcon
} from 'lucide-react';
import { CURRENCIES_LIST } from './constants';
import { db, SystemOptions } from '../services/database';

interface GlobalCurrencyLiquidityControlPanelProps {
    systemOptions: SystemOptions | any;
    onSaveSystemOptions: (updated: any) => Promise<void>;
    addToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

export const GlobalCurrencyLiquidityControlPanel: React.FC<GlobalCurrencyLiquidityControlPanelProps> = ({
    systemOptions,
    onSaveSystemOptions,
    addToast
}) => {
    const [disabledCurrencies, setDisabledCurrencies] = useState<string[]>(systemOptions.disabledCurrencies || []);
    const [liquiditySettings, setLiquiditySettings] = useState<Record<string, {
        enabled?: boolean;
        tier?: 'HIGH' | 'MEDIUM' | 'LOW' | 'RESTRICTED';
        maxTxLimit?: number;
        reserveBuffer?: number;
        note?: string;
    }>>(systemOptions.currencyLiquiditySettings || {});

    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'MAJOR' | 'EMERGING' | 'CRYPTO'>('ALL');
    const [isSaving, setIsSaving] = useState(false);

    // Sync with incoming props if changed
    useEffect(() => {
        setDisabledCurrencies(systemOptions.disabledCurrencies || []);
        setLiquiditySettings(systemOptions.currencyLiquiditySettings || {});
    }, [systemOptions]);

    const majorCodes = useMemo(() => new Set(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SGD', 'HKD', 'AED']), []);
    const cryptoCodes = useMemo(() => new Set(['BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'ADA', 'DOT', 'LTC', 'XRP', 'DOGE']), []);

    const allCurrenciesList = useMemo(() => {
        return CURRENCIES_LIST.map(c => {
            const code = c.code.toUpperCase();
            const isCrypto = cryptoCodes.has(code);
            const isMajor = majorCodes.has(code);
            const category = isCrypto ? 'CRYPTO' : (isMajor ? 'MAJOR' : 'EMERGING');
            const isDisabled = disabledCurrencies.includes(code);
            const setting = liquiditySettings[code] || {};
            const tier = setting.tier || (isDisabled ? 'RESTRICTED' : (isMajor ? 'HIGH' : 'MEDIUM'));
            const maxTxLimit = setting.maxTxLimit ?? (isCrypto ? 250000 : (isMajor ? 1000000 : 250000));
            const reserveBuffer = setting.reserveBuffer ?? (isCrypto ? 500000 : (isMajor ? 5000000 : 1000000));

            return {
                ...c,
                code,
                category,
                isDisabled,
                tier,
                maxTxLimit,
                reserveBuffer,
                note: setting.note || ''
            };
        });
    }, [disabledCurrencies, liquiditySettings, majorCodes, cryptoCodes]);

    const filteredCurrencies = useMemo(() => {
        return allCurrenciesList.filter(c => {
            if (categoryFilter !== 'ALL' && c.category !== categoryFilter) {
                return false;
            }
            if (!searchTerm.trim()) return true;
            const q = searchTerm.toLowerCase().trim();
            return (
                c.code.toLowerCase().includes(q) ||
                c.name.toLowerCase().includes(q) ||
                (c.symbol && c.symbol.toLowerCase().includes(q))
            );
        });
    }, [allCurrenciesList, categoryFilter, searchTerm]);

    const handleToggleCurrency = (code: string) => {
        setDisabledCurrencies(prev => {
            const exists = prev.includes(code);
            if (exists) {
                return prev.filter(c => c !== code);
            } else {
                return [...prev, code];
            }
        });
    };

    const handleUpdateTier = (code: string, newTier: 'HIGH' | 'MEDIUM' | 'LOW' | 'RESTRICTED') => {
        setLiquiditySettings(prev => ({
            ...prev,
            [code]: {
                ...(prev[code] || {}),
                tier: newTier
            }
        }));
        if (newTier === 'RESTRICTED') {
            if (!disabledCurrencies.includes(code)) {
                setDisabledCurrencies(prev => [...prev, code]);
            }
        } else {
            if (disabledCurrencies.includes(code)) {
                setDisabledCurrencies(prev => prev.filter(c => c !== code));
            }
        }
    };

    const handleUpdateLimit = (code: string, field: 'maxTxLimit' | 'reserveBuffer', val: number) => {
        setLiquiditySettings(prev => ({
            ...prev,
            [code]: {
                ...(prev[code] || {}),
                [field]: val
            }
        }));
    };

    const handleUpdateNote = (code: string, note: string) => {
        setLiquiditySettings(prev => ({
            ...prev,
            [code]: {
                ...(prev[code] || {}),
                note
            }
        }));
    };

    // Preset Actions
    const handleApplyPreset = (preset: 'ENABLE_ALL' | 'DISABLE_CRYPTO' | 'G7_ONLY' | 'RESTORE_DEFAULT') => {
        if (preset === 'ENABLE_ALL') {
            setDisabledCurrencies([]);
            addToast('info', 'Preset Applied', 'All international currencies & crypto vaults enabled globally.');
        } else if (preset === 'DISABLE_CRYPTO') {
            const cryptoList = Array.from(cryptoCodes);
            setDisabledCurrencies(prev => Array.from(new Set([...prev, ...cryptoList])));
            addToast('warning', 'Preset Applied', 'Crypto asset vault transfers restricted globally.');
        } else if (preset === 'G7_ONLY') {
            const g7Set = new Set(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'CHF', 'AUD']);
            const nonG7 = allCurrenciesList.filter(c => !g7Set.has(c.code)).map(c => c.code);
            setDisabledCurrencies(nonG7);
            addToast('warning', 'Preset Applied', 'G7 Liquidity Enclave mode active. Non-G7 currencies paused.');
        } else if (preset === 'RESTORE_DEFAULT') {
            setDisabledCurrencies([]);
            setLiquiditySettings({});
            addToast('success', 'Preset Applied', 'Restored institutional default currency liquidity profiles.');
        }
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            const updatePayload = {
                disabledCurrencies,
                currencyLiquiditySettings: liquiditySettings
            };

            const merged = {
                ...systemOptions,
                ...updatePayload
            };

            await onSaveSystemOptions(merged);

            // Also directly persist via DB service for fallback redundancy
            await db.saveSystemOptions(merged);

            // Dispatch global event for real-time app update
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('db_system_options_updated', { detail: updatePayload }));
                window.dispatchEvent(new CustomEvent('db_currencies_updated', { detail: updatePayload }));
            }

            addToast('success', 'Global Liquidity Controls Committed', `Updated ${allCurrenciesList.length} currency liquidity rules and ${disabledCurrencies.length} restriction toggles.`);
        } catch (err: any) {
            console.error('[CurrencyLiquidityControl] Save error:', err);
            addToast('error', 'Commit Failed', `Failed to save liquidity rules: ${err.message || 'Storage error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const disabledCount = disabledCurrencies.length;
    const activeCount = allCurrenciesList.length - disabledCount;

    return (
        <div className="bg-slate-50 border border-black/5 rounded-[2.5rem] p-8 shadow-2xl text-white space-y-8 dark:bg-slate-900">
            {/* Title Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-black/5 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-amber-500 border border-amber-500/20 rounded-2xl text-amber-400">
                        <BanknotesIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-emerald-400">INSTITUTIONAL LIQUIDITY PROTOCOL</span>
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-wider text-white">
                            Global International Currency & Liquidity Controls
                        </h2>
                        <p className="text-xs text-[#0F172A] mt-1 max-w-2xl">
                            Enable or disable support for specific international fiat currencies and crypto assets based on institutional liquidity reserves, central bank settlement windows, and compliance thresholds.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleSaveChanges}
                        disabled={isSaving}
                        className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-70 flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                <span>Committing Rules...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircleIcon className="w-4 h-4 stroke-[3]" />
                                <span>Commit Liquidity Rules</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Quick Presets Bar */}
            <div className="bg-slate-100 border border-black/5 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <SparklesIcon className="w-5 h-5 text-amber-400" />
                    <span>Preset Liquidity Strategies:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        onClick={() => handleApplyPreset('ENABLE_ALL')}
                        className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-500 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
                    >
                        Enable All ({allCurrenciesList.length})
                    </button>
                    <button
                        onClick={() => handleApplyPreset('DISABLE_CRYPTO')}
                        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-500 text-amber-400 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
                    >
                        Pause Crypto Vaults
                    </button>
                    <button
                        onClick={() => handleApplyPreset('G7_ONLY')}
                        className="px-3.5 py-2 bg-sky-500 hover:bg-sky-500 text-sky-400 border border-sky-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
                    >
                        G7 Enclave Only
                    </button>
                    <button
                        onClick={() => handleApplyPreset('RESTORE_DEFAULT')}
                        className="px-3.5 py-2 bg-white hover:bg-slate-700 text-[#0F172A] border border-black/5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors dark:bg-slate-800"
                    >
                        Reset Defaults
                    </button>
                </div>
            </div>

            {/* Metrics & Filter Row */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                    <MagnifyingGlassIcon className="w-4 h-4 text-[#0F172A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search currency code, name, or symbol..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-100 border border-black/5 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors font-mono"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0F172A] hover:text-white text-xs">
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Category Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-black/5 text-xs font-mono font-bold">
                    <button
                        onClick={() => setCategoryFilter('ALL')}
                        className={`px-3 py-1.5 rounded-lg transition-colors ${categoryFilter === 'ALL' ? 'bg-amber-500 text-slate-950 font-black' : 'text-[#0F172A] hover:text-white'}`}
                    >
                        ALL ({allCurrenciesList.length})
                    </button>
                    <button
                        onClick={() => setCategoryFilter('MAJOR')}
                        className={`px-3 py-1.5 rounded-lg transition-colors ${categoryFilter === 'MAJOR' ? 'bg-amber-500 text-slate-950 font-black' : 'text-[#0F172A] hover:text-white'}`}
                    >
                        MAJOR FIAT
                    </button>
                    <button
                        onClick={() => setCategoryFilter('EMERGING')}
                        className={`px-3 py-1.5 rounded-lg transition-colors ${categoryFilter === 'EMERGING' ? 'bg-amber-500 text-slate-950 font-black' : 'text-[#0F172A] hover:text-white'}`}
                    >
                        EMERGING
                    </button>
                    <button
                        onClick={() => setCategoryFilter('CRYPTO')}
                        className={`px-3 py-1.5 rounded-lg transition-colors ${categoryFilter === 'CRYPTO' ? 'bg-amber-500 text-slate-950 font-black' : 'text-[#0F172A] hover:text-white'}`}
                    >
                        CRYPTO VAULTS
                    </button>
                </div>

                {/* Counter Badges */}
                <div className="flex items-center gap-3 text-xs font-mono">
                    <div className="bg-emerald-500 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-emerald-400 font-black">
                        Active: {activeCount}
                    </div>
                    <div className="bg-red-500 border border-red-500/20 px-3 py-1.5 rounded-xl text-red-400 font-black">
                        Restricted: {disabledCount}
                    </div>
                </div>
            </div>

            {/* Currency Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredCurrencies.map((c) => {
                    return (
                        <div
                            key={c.code}
                            className={`p-5 rounded-2xl border transition-all duration-200 space-y-4 ${
                                c.isDisabled
                                    ? 'bg-slate-100 border-red-500/30 opacity-75'
                                    : 'bg-slate-100 border-black/5 hover:border-amber-500/40'
                            }`}
                        >
                            {/* Card Header */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-black/5 flex items-center justify-center font-black text-amber-400 text-sm font-mono shrink-0 shadow-inner dark:bg-slate-900">
                                        {c.symbol || c.code.slice(0, 3)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-black text-white font-mono tracking-wider">{c.code}</h4>
                                            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white text-[#0F172A] border border-black/5 dark:bg-slate-800">
                                                {c.category}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-[#0F172A] truncate max-w-[150px]">{c.name}</p>
                                    </div>
                                </div>

                                {/* Toggle Switch */}
                                <button
                                    onClick={() => handleToggleCurrency(c.code)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        !c.isDisabled ? 'bg-emerald-500' : 'bg-slate-700'
                                    }`}
                                    title={c.isDisabled ? 'Click to Enable Currency' : 'Click to Disable Currency'}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                            !c.isDisabled ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Controls Grid */}
                            <div className="space-y-3 pt-2 border-t border-black/5 text-xs font-mono">
                                {/* Liquidity Tier Selector */}
                                <div className="flex items-center justify-between">
                                    <span className="text-[#0F172A] text-[10px] uppercase font-bold">Liquidity Level:</span>
                                    <select
                                        value={c.tier}
                                        onChange={(e) => handleUpdateTier(c.code, e.target.value as any)}
                                        className="bg-slate-50 border border-black/5 text-white rounded-lg px-2 py-1 text-[11px] font-bold focus:outline-none focus:border-amber-500 dark:bg-slate-900"
                                    >
                                        <option value="HIGH" className="text-emerald-400">HIGH (Green)</option>
                                        <option value="MEDIUM" className="text-amber-400">MEDIUM (Amber)</option>
                                        <option value="LOW" className="text-orange-400">LOW (Orange)</option>
                                        <option value="RESTRICTED" className="text-red-400">RESTRICTED (Red)</option>
                                    </select>
                                </div>

                                {/* Max Single Transaction Limit */}
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[#0F172A] text-[10px] uppercase font-bold">Single Tx Limit ($):</span>
                                    <input
                                        type="number"
                                        value={c.maxTxLimit}
                                        onChange={(e) => handleUpdateLimit(c.code, 'maxTxLimit', parseFloat(e.target.value) || 0)}
                                        className="w-28 bg-slate-50 border border-black/5 text-right text-emerald-400 font-bold px-2 py-1 rounded-lg text-xs focus:outline-none focus:border-amber-500 dark:bg-slate-900"
                                    />
                                </div>

                                {/* Reserve Buffer */}
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[#0F172A] text-[10px] uppercase font-bold">Vault Reserve ($):</span>
                                    <input
                                        type="number"
                                        value={c.reserveBuffer}
                                        onChange={(e) => handleUpdateLimit(c.code, 'reserveBuffer', parseFloat(e.target.value) || 0)}
                                        className="w-28 bg-slate-50 border border-black/5 text-right text-sky-400 font-bold px-2 py-1 rounded-lg text-xs focus:outline-none focus:border-amber-500 dark:bg-slate-900"
                                    />
                                </div>

                                {/* Settlement Note */}
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Admin note (e.g. Central bank settlement window)..."
                                        value={c.note}
                                        onChange={(e) => handleUpdateNote(c.code, e.target.value)}
                                        className="w-full bg-slate-50 border border-black/5 text-[#0F172A] text-[10px] px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 dark:bg-slate-900"
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GlobalCurrencyLiquidityControlPanel;
