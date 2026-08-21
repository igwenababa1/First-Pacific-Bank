import React, { useState, useMemo, useEffect } from 'react';
import { Alert, AlertType, FxConditionType, Account, Transaction, NotificationType } from '../types';
import { BellIcon, PlusCircleIcon, XIcon, SpinnerIcon, WalletIcon, TrendingUpIcon, ChatBubbleLeftRightIcon, TrashIcon, PencilIcon, SparklesIcon, ArrowPathIcon } from './Icons';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { sendCurrencyFluctuationAlert, sendNativePushNotification } from '../utils/notificationService';

interface AlertsCenterProps {
    alerts: Alert[];
    accounts: Account[];
    transactions?: Transaction[];
    addNotification?: (type: NotificationType, title: string, message: string) => void;
    onUpdateAlert: (alert: Alert) => void;
    onDeleteAlert: (alertId: string) => void;
}

interface AlertModalProps {
    alertToEdit?: Alert;
    accounts: Account[];
    onSave: (alert: Alert) => void;
    onClose: () => void;
}

const SUPPORTED_FX_PAIRS = [
    { pair: 'USD/EUR', name: 'US Dollar / Euro', baseRate: 0.9215, change24h: +1.42, flag: '🇪🇺' },
    { pair: 'USD/GBP', name: 'US Dollar / British Pound', baseRate: 0.7840, change24h: -0.85, flag: '🇬🇧' },
    { pair: 'USD/JPY', name: 'US Dollar / Japanese Yen', baseRate: 154.20, change24h: +2.15, flag: '🇯🇵' },
    { pair: 'EUR/GBP', name: 'Euro / British Pound', baseRate: 0.8510, change24h: -0.22, flag: '🇪🇺🇬🇧' },
    { pair: 'USD/CHF', name: 'US Dollar / Swiss Franc', baseRate: 0.8810, change24h: -1.10, flag: '🇨🇭' },
    { pair: 'USD/CAD', name: 'US Dollar / Canadian Dollar', baseRate: 1.3650, change24h: +0.45, flag: '🇨🇦' },
    { pair: 'USD/AUD', name: 'US Dollar / Australian Dollar', baseRate: 1.5120, change24h: +0.95, flag: '🇦🇺' },
    { pair: 'USD/CNY', name: 'US Dollar / Chinese Yuan', baseRate: 7.2450, change24h: +0.30, flag: '🇨🇳' },
    { pair: 'BTC/USD', name: 'Bitcoin / US Dollar', baseRate: 64850.00, change24h: +3.85, flag: '₿' },
];

const AlertModal: React.FC<AlertModalProps> = ({ alertToEdit, accounts, onSave, onClose }) => {
    const [type, setType] = useState<AlertType>(alertToEdit?.type || 'CURRENCY_FLUCTUATION');
    const [accountId, setAccountId] = useState(alertToEdit?.accountId || accounts[0]?.id || 'ALL');
    const [threshold, setThreshold] = useState<string | number>(alertToEdit?.threshold ?? '1.5');
    const [currencyPair, setCurrencyPair] = useState<string>(alertToEdit?.currencyPair || 'USD/EUR');
    const [fxCondition, setFxCondition] = useState<FxConditionType>(alertToEdit?.fxCondition || 'PERCENT_CHANGE');
    const [fxTimeframe, setFxTimeframe] = useState<'1h' | '24h' | '7d'>(alertToEdit?.fxTimeframe || '24h');
    const [methods, setMethods] = useState<{ push: boolean; email: boolean; sms: boolean }>({
        push: alertToEdit?.notificationMethods.includes('push') ?? true,
        email: alertToEdit?.notificationMethods.includes('email') ?? true,
        sms: alertToEdit?.notificationMethods.includes('sms') ?? false,
    });
    const [isProcessing, setIsProcessing] = useState(false);

    const activeFxInfo = useMemo(() => {
        return SUPPORTED_FX_PAIRS.find(p => p.pair === currencyPair) || SUPPORTED_FX_PAIRS[0];
    }, [currencyPair]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        
        const selectedMethods: ('push' | 'email' | 'sms')[] = [];
        if (methods.push) selectedMethods.push('push');
        if (methods.email) selectedMethods.push('email');
        if (methods.sms) selectedMethods.push('sms');

        setTimeout(() => {
            const newAlert: Alert = {
                id: alertToEdit?.id || `alert_${Date.now()}`,
                type,
                accountId,
                threshold: type === 'KEYWORD_MATCH' ? String(threshold) : Number(threshold) || 0,
                notificationMethods: selectedMethods,
                isActive: alertToEdit?.isActive ?? true,
                ...(type === 'CURRENCY_FLUCTUATION' ? {
                    currencyPair,
                    fxCondition,
                    fxTimeframe,
                    currentRate: activeFxInfo.baseRate,
                    lastChangedPercent: activeFxInfo.change24h,
                    createdAt: new Date().toISOString()
                } : {})
            };
            onSave(newAlert);
        }, 600);
    };

    return (
        <div className="fixed inset-0 bg-slate-100  z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-lg border border-slate-200 dark:border-white/10 animate-fade-in-up max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-start mb-6 border-b border-slate-100 dark:border-white/10 pb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="p-1.5 bg-emerald-500 text-emerald-500 rounded-lg text-xs font-mono font-bold">
                                {type === 'CURRENCY_FLUCTUATION' ? '💱 FX FX_MONITOR' : '🔔 BANK_ALERT'}
                            </span>
                            <h3 className="text-xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">
                                {alertToEdit ? 'Modify Alert Rule' : 'Configure New Alert'}
                            </h3>
                        </div>
                        <p className="text-xs text-[#0F172A] dark:text-white">
                            Set up automated triggers for exchange fluctuations, thresholds & activity.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-[#0F172A] hover:text-[#0F172A] dark:hover:text-white transition-colors">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold uppercase text-[#0F172A] dark:text-white mb-2 tracking-wider">
                            Alert Trigger Category
                        </label>
                        <select 
                            value={type} 
                            onChange={e => {
                                const newType = e.target.value as AlertType;
                                setType(newType);
                                if (newType === 'CURRENCY_FLUCTUATION' && !threshold) {
                                    setThreshold('1.5');
                                }
                            }} 
                            className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        >
                            <option value="CURRENCY_FLUCTUATION">📈 Major Currency Fluctuation (FX Pair)</option>
                            <option value="BALANCE_BELOW">📉 Balance Drops Below Threshold</option>
                            <option value="TRANSACTION_ABOVE">💸 Single Transaction Exceeds Amount</option>
                            <option value="KEYWORD_MATCH">🔍 Keyword / Merchant Match in Description</option>
                        </select>
                    </div>

                    {type === 'CURRENCY_FLUCTUATION' ? (
                        <div className="space-y-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-white/10">
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-emerald-400 font-mono">
                                        Select Currency Pair
                                    </label>
                                    <select 
                                        value={currencyPair}
                                        onChange={e => setCurrencyPair(e.target.value)}
                                        className="w-full mt-1.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white font-black text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                    >
                                        {SUPPORTED_FX_PAIRS.map(fx => (
                                            <option key={fx.pair} value={fx.pair}>
                                                {fx.flag} {fx.pair} - {fx.name} (Live: {fx.baseRate})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Live FX Benchmark Card */}
                            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-black/5 flex items-center justify-between">
                                <div>
                                    <span className="text-[9px] font-mono text-[#0F172A] uppercase block">Current Benchmark</span>
                                    <span className="text-base font-black text-white font-mono">{currencyPair} = {activeFxInfo.baseRate}</span>
                                </div>
                                <div className={`text-right ${activeFxInfo.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    <span className="text-[9px] font-mono text-[#0F172A] uppercase block">24h Shift</span>
                                    <span className="text-xs font-black font-mono">
                                        {activeFxInfo.change24h >= 0 ? '▲ +' : '▼ '}{activeFxInfo.change24h}%
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-[#0F172A] mb-1 tracking-wider">
                                        Condition Type
                                    </label>
                                    <select
                                        value={fxCondition}
                                        onChange={e => setFxCondition(e.target.value as FxConditionType)}
                                        className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white text-xs font-bold outline-none"
                                    >
                                        <option value="PERCENT_CHANGE">± % Swing Fluctuation</option>
                                        <option value="RATE_ABOVE">Rate Rises Above (Bullish)</option>
                                        <option value="RATE_BELOW">Rate Drops Below (Bearish)</option>
                                        <option value="VOLATILITY_SPIKE">Volatility Anomaly Spike</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-[#0F172A] mb-1 tracking-wider">
                                        Evaluation Window
                                    </label>
                                    <select
                                        value={fxTimeframe}
                                        onChange={e => setFxTimeframe(e.target.value as any)}
                                        className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white text-xs font-bold outline-none"
                                    >
                                        <option value="1h">1 Hour Window</option>
                                        <option value="24h">24 Hour Window (Default)</option>
                                        <option value="7d">7 Day Window</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase text-[#0F172A] mb-1 tracking-wider">
                                    {fxCondition === 'PERCENT_CHANGE' ? 'Fluctuation Trigger threshold (% Shift)' : fxCondition === 'VOLATILITY_SPIKE' ? 'Volatility Index Sensitivity (% Change)' : 'Target Exchange Rate Value'}
                                </label>
                                <input 
                                    type="number"
                                    step="any"
                                    value={threshold} 
                                    onChange={e => setThreshold(e.target.value)} 
                                    className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white font-mono font-bold text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder={fxCondition === 'PERCENT_CHANGE' ? '1.5' : String(activeFxInfo.baseRate)}
                                    required 
                                />
                                <span className="text-[10px] text-[#0F172A] mt-1 block font-mono">
                                    {fxCondition === 'PERCENT_CHANGE' ? 'Alerts when rate swings by ±' + threshold + '% within ' + fxTimeframe : 'Triggers when rate hits ' + threshold}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-xs font-bold uppercase text-[#0F172A] dark:text-white mb-2 tracking-wider">Monitored Account</label>
                                <select 
                                    value={accountId} 
                                    onChange={e => setAccountId(e.target.value)} 
                                    className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                >
                                    <option value="ALL">All Linked Accounts</option>
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.nickname || acc.type} (••••{acc.accountNumber.slice(-4)})</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-[#0F172A] dark:text-white mb-2 tracking-wider">
                                    {type === 'BALANCE_BELOW' ? 'Balance Threshold ($)' : type === 'TRANSACTION_ABOVE' ? 'Transaction Amount ($)' : 'Keyword / Merchant Name'}
                                </label>
                                <input 
                                    type={type === 'KEYWORD_MATCH' ? 'text' : 'number'} 
                                    value={threshold} 
                                    onChange={e => setThreshold(e.target.value)} 
                                    className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white font-mono font-bold text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    placeholder={type === 'KEYWORD_MATCH' ? 'e.g. Starbucks' : '500.00'}
                                    required 
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-xs font-bold uppercase text-[#0F172A] dark:text-white mb-2 tracking-wider">Notification Delivery Channels</label>
                        <div className="grid grid-cols-3 gap-3">
                            {(['push', 'email', 'sms'] as const).map(method => (
                                <label key={method} className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${methods[method] ? 'bg-emerald-500 border-emerald-500/40 text-emerald-400 font-bold' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-[#0F172A]'}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={methods[method]} 
                                        onChange={e => setMethods(prev => ({ ...prev, [method]: e.target.checked }))}
                                        className="hidden"
                                    />
                                    <span className="text-xs uppercase tracking-wider">{method}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} disabled={isProcessing} className="flex-1 py-3.5 text-xs font-black uppercase tracking-wider text-[#0F172A] dark:text-white bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={isProcessing} className="flex-1 py-3.5 text-xs font-black uppercase tracking-widest text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer">
                            {isProcessing && <SpinnerIcon className="w-4 h-4 animate-spin"/>}
                            {alertToEdit ? 'Save Changes' : 'Activate Alert'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const AlertsCenter: React.FC<AlertsCenterProps> = ({ alerts, accounts, transactions = [], addNotification, onUpdateAlert, onDeleteAlert }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [alertToEdit, setAlertToEdit] = useState<Alert | undefined>(undefined);
    const [alertToDelete, setAlertToDelete] = useState<Alert | null>(null);
    const [simulatingPair, setSimulatingPair] = useState<string | null>(null);

    const handleOpenModal = (alert?: Alert) => {
        setAlertToEdit(alert);
        setIsModalOpen(true);
    };

    const handleSaveAlert = (alert: Alert) => {
        onUpdateAlert(alert);
        setIsModalOpen(false);
        setAlertToEdit(undefined);

        // Request native push permission if push is selected
        if (alert.notificationMethods.includes('push') && typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }

        if (addNotification) {
            const isFx = alert.type === 'CURRENCY_FLUCTUATION';
            addNotification(
                NotificationType.ALERT,
                isFx ? `FX Monitor Activated: ${alert.currencyPair}` : 'Alert Rule Saved',
                isFx ? `Subscribed to real-time fluctuation alerts for ${alert.currencyPair} (${alert.fxCondition === 'PERCENT_CHANGE' ? '±' + alert.threshold + '%' : 'Target Rate ' + alert.threshold}).` : 'Your custom account monitor is active.'
            );
        }
    };

    const handleToggleAlert = (alert: Alert) => {
        onUpdateAlert({ ...alert, isActive: !alert.isActive });
    };

    const handleQuickSubscribeFx = (pair: string, thresholdPercent: number) => {
        const fxInfo = SUPPORTED_FX_PAIRS.find(p => p.pair === pair) || SUPPORTED_FX_PAIRS[0];
        
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }

        const newAlert: Alert = {
            id: `fx_alert_${pair.replace('/', '_')}_${Date.now()}`,
            type: 'CURRENCY_FLUCTUATION',
            accountId: 'ALL',
            threshold: thresholdPercent,
            notificationMethods: ['push', 'email'],
            isActive: true,
            currencyPair: pair,
            fxCondition: 'PERCENT_CHANGE',
            fxTimeframe: '24h',
            currentRate: fxInfo.baseRate,
            lastChangedPercent: fxInfo.change24h,
            createdAt: new Date().toISOString()
        };

        onUpdateAlert(newAlert);
        if (addNotification) {
            addNotification(
                NotificationType.ALERT,
                `FX Alert Subscribed: ${pair}`,
                `You will be notified immediately whenever ${pair} fluctuates by ±${thresholdPercent}% within a 24-hour window.`
            );
        }
    };

    const handleSimulateFxAlert = (pair: string) => {
        setSimulatingPair(pair);
        const fxInfo = SUPPORTED_FX_PAIRS.find(p => p.pair === pair) || SUPPORTED_FX_PAIRS[0];
        const existingAlert = alerts.find(a => a.type === 'CURRENCY_FLUCTUATION' && a.currencyPair === pair && a.isActive);
        const optedMethods = existingAlert?.notificationMethods || ['push', 'email'];
        
        setTimeout(() => {
            const isSurge = Math.random() > 0.4;
            const shiftVal = Number((Math.random() * 1.8 + 1.2).toFixed(2));
            const changePercent = isSurge ? shiftVal : -shiftVal;
            const newRate = isSurge ? Number((fxInfo.baseRate * (1 + shiftVal/100)).toFixed(4)) : Number((fxInfo.baseRate * (1 - shiftVal/100)).toFixed(4));

            // Trigger notificationService (which dispatches Native Push, Email, SMS & HUD)
            sendCurrencyFluctuationAlert({
                currencyPair: pair,
                conditionType: existingAlert?.fxCondition || 'PERCENT_CHANGE',
                changePercent,
                newRate,
                optedMethods
            });

            if (addNotification) {
                addNotification(
                    NotificationType.ALERT,
                    `🚨 FX Fluctuation Alert: ${pair}`,
                    `${pair} ${isSurge ? 'surged' : 'dropped'} by ${isSurge ? '+' : '-'}${shiftVal}% to ${newRate} in the past 24h. Trigger threshold breached for your subscribed position.`
                );
            }
            setSimulatingPair(null);
        }, 1000);
    };

    const getIconForType = (alert: Alert) => {
        if (alert.type === 'CURRENCY_FLUCTUATION') {
            return <span className="text-xl">💱</span>;
        }
        switch (alert.type) {
            case 'BALANCE_BELOW': return <WalletIcon className="w-6 h-6" />;
            case 'TRANSACTION_ABOVE': return <TrendingUpIcon className="w-6 h-6" />;
            case 'KEYWORD_MATCH': return <ChatBubbleLeftRightIcon className="w-6 h-6" />;
            default: return <BellIcon className="w-6 h-6" />;
        }
    };

    const getDescription = (alert: Alert) => {
        if (alert.type === 'CURRENCY_FLUCTUATION') {
            const pair = alert.currencyPair || 'USD/EUR';
            if (alert.fxCondition === 'PERCENT_CHANGE') {
                return `FX Fluctuation Monitor: ${pair} swings by ±${alert.threshold}% in ${alert.fxTimeframe || '24h'}`;
            }
            if (alert.fxCondition === 'RATE_ABOVE') {
                return `FX Rate Monitor: ${pair} rises above ${alert.threshold}`;
            }
            if (alert.fxCondition === 'RATE_BELOW') {
                return `FX Rate Monitor: ${pair} drops below ${alert.threshold}`;
            }
            return `FX Volatility Anomaly Monitor: ${pair} market spike`;
        }
        if (alert.type === 'BALANCE_BELOW') return `Notify when account balance drops below $${alert.threshold}`;
        if (alert.type === 'TRANSACTION_ABOVE') return `Notify for single transactions over $${alert.threshold}`;
        return `Notify if transaction description contains "${alert.threshold}"`;
    };

    // Analyze transactions for recurring utilities
    const suggestedUtilities = useMemo(() => {
        if (!transactions || transactions.length === 0) return [];
        const utilityKeywords = ['Electric', 'Water', 'Gas', 'Internet', 'Telecom', 'Energy', 'Power', 'Utility'];
        const found = new Set<string>();
        
        transactions.forEach(tx => {
            const desc = (tx.description || '').toLowerCase();
            utilityKeywords.forEach(kw => {
                if (desc.includes(kw.toLowerCase())) {
                    found.add(kw);
                }
            });
        });
        
        return Array.from(found).filter(kw => !alerts.some(a => a.type === 'KEYWORD_MATCH' && String(a.threshold).toLowerCase() === kw.toLowerCase()));
    }, [transactions, alerts]);

    const handleCreateUtilitySuggestion = (keyword: string) => {
        const newAlert: Alert = {
            id: `alert_${Date.now()}_${keyword}`,
            type: 'KEYWORD_MATCH',
            accountId: accounts[0]?.id || 'ALL',
            threshold: keyword,
            notificationMethods: ['push', 'email'],
            isActive: true,
        };
        onUpdateAlert(newAlert);
        if (addNotification) {
            addNotification(NotificationType.ALERT, 'Utility Monitor Created', `Created keyword tracker for "${keyword}".`);
        }
    };

    return (
        <>
            {isModalOpen && <AlertModal alertToEdit={alertToEdit} accounts={accounts} onSave={handleSaveAlert} onClose={() => setIsModalOpen(false)} />}
            
            <div className="space-y-8 max-w-6xl mx-auto pb-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 font-mono">
                                INSTITUTIONAL NOTIFICATION DESK
                            </span>
                        </div>
                        <h2 className="text-3xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">
                            Alerts & FX Fluctuation Center
                        </h2>
                        <p className="text-sm text-[#0F172A] dark:text-white mt-1">
                            Subscribe to major currency price shifts, liquidity thresholds, and transaction events in real time.
                        </p>
                    </div>
                    <button 
                        onClick={() => handleOpenModal()} 
                        className="flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-wider text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                    >
                        <PlusCircleIcon className="w-5 h-5" />
                        <span>Configure New Alert</span>
                    </button>
                </div>

                {/* Major Currency Fluctuation Subscriptions & Live Ticker */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-3xl p-6 border border-emerald-500/20 shadow-2xl space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/5 pb-4 relative z-10">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl">💱</span>
                                <h3 className="text-lg font-black text-white uppercase tracking-wider font-serif">
                                    Major Currency Fluctuation Radar
                                </h3>
                                <span className="text-[9px] font-mono bg-emerald-500 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold uppercase">
                                    Live Market Feeds
                                </span>
                            </div>
                            <p className="text-xs text-[#0F172A] mt-0.5">
                                Automated price fluctuation monitors for cross-border banking, global wire clearing, and FX hedging.
                            </p>
                        </div>
                    </div>

                    {/* Currency Pair Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                        {SUPPORTED_FX_PAIRS.slice(0, 6).map((fx) => {
                            const isSubscribed = alerts.some(a => a.type === 'CURRENCY_FLUCTUATION' && a.currencyPair === fx.pair && a.isActive);
                            return (
                                <div 
                                    key={fx.pair} 
                                    className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                                        isSubscribed 
                                            ? 'bg-slate-50 border-emerald-500/50 shadow-lg shadow-emerald-500/10' 
                                            : 'bg-slate-100 border-black/5 hover:border-white/20'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{fx.flag}</span>
                                            <div>
                                                <h4 className="text-sm font-black text-white font-mono">{fx.pair}</h4>
                                                <span className="text-[9px] text-[#0F172A] block">{fx.name}</span>
                                            </div>
                                        </div>
                                        <div className={`text-right font-mono text-xs font-bold ${fx.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            <span className="block text-sm font-black">{fx.baseRate}</span>
                                            <span className="text-[10px]">
                                                {fx.change24h >= 0 ? '▲ +' : '▼ '}{fx.change24h}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-black/5 flex items-center justify-between gap-2">
                                        {isSubscribed ? (
                                            <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500 px-2 py-1 rounded-lg border border-emerald-500/20">
                                                ✓ Subscribed Alert Active
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleQuickSubscribeFx(fx.pair, 1.5)}
                                                className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500 hover:bg-emerald-500 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                                            >
                                                + Monitor ±1.5% Swing
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            disabled={simulatingPair === fx.pair}
                                            onClick={() => handleSimulateFxAlert(fx.pair)}
                                            className="text-[10px] font-bold text-[#0F172A] hover:text-white bg-white hover:bg-white border border-black/5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 dark:bg-slate-800"
                                            title="Simulate Market Fluctuation Signal"
                                        >
                                            {simulatingPair === fx.pair ? (
                                                <SpinnerIcon className="w-3 h-3 animate-spin text-emerald-400" />
                                            ) : (
                                                <ArrowPathIcon className="w-3 h-3 text-amber-400" />
                                            )}
                                            <span>Test Signal</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Active Monitors List */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <BellIcon className="w-5 h-5 text-emerald-500" />
                            <h3 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-tight">
                                Active Notification Rules & Subscriptions
                            </h3>
                        </div>
                        <span className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-widest bg-slate-200 dark:bg-slate-900 px-3 py-1 rounded-full font-mono">
                            {alerts.length} {alerts.length === 1 ? 'Rule' : 'Rules'}
                        </span>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        {alerts.length > 0 ? alerts.map(alert => {
                            const account = accounts.find(a => a.id === alert.accountId);
                            const description = getDescription(alert);
                            const isFx = alert.type === 'CURRENCY_FLUCTUATION';
                            
                            return (
                                <div 
                                    key={alert.id} 
                                    className={`group flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                                        alert.isActive 
                                            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 shadow-sm hover:border-emerald-500/40' 
                                            : 'bg-slate-50 dark:bg-slate-800 border-transparent opacity-60 grayscale'
                                    }`}
                                >
                                    <div className="flex items-center space-x-4 w-full sm:w-auto mb-4 sm:mb-0">
                                        <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-2xl shadow-md transition-colors ${
                                            alert.isActive 
                                                ? isFx ? 'bg-emerald-500 text-emerald-400 border border-emerald-500/30' : 'bg-primary/10 text-primary' 
                                                : 'bg-slate-200 dark:bg-slate-900 text-[#0F172A] dark:text-white'
                                        }`}>
                                            {getIconForType(alert)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                {isFx && (
                                                    <span className="text-[9px] font-mono font-black uppercase bg-emerald-500 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                                                        FX Pair: {alert.currencyPair || 'USD/EUR'}
                                                    </span>
                                                )}
                                                <h4 className="font-bold text-[#0F172A] dark:text-white text-sm sm:text-base">
                                                    {description}
                                                </h4>
                                            </div>
                                            <p className="text-xs text-[#0F172A] dark:text-white flex flex-wrap items-center gap-2 font-mono">
                                                <span className="font-bold text-[#0F172A] dark:text-white">
                                                    {isFx ? 'Global FX Engine' : account?.nickname || 'All Linked Accounts'}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-slate-400" />
                                                <span className="uppercase text-[10px]">{alert.notificationMethods.join(', ')}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleOpenModal(alert)} 
                                                className="p-2 text-[#0F172A] hover:text-emerald-400 hover:bg-emerald-500 rounded-xl transition-colors cursor-pointer"
                                                title="Edit Alert Rule"
                                            >
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => setAlertToDelete(alert)} 
                                                className="p-2 text-[#0F172A] hover:text-rose-400 hover:bg-rose-500 rounded-xl transition-colors cursor-pointer"
                                                title="Delete Alert Rule"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                        
                                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-900 mx-2 hidden sm:block" />

                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={alert.isActive} 
                                                onChange={() => handleToggleAlert(alert)} 
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-focus:ring-4 peer-focus:ring-emerald-500/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                                        </label>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="text-center py-16 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-2xl">
                                    💱
                                </div>
                                <h4 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-tight">
                                    No Custom Alert Rules Configured
                                </h4>
                                <p className="text-[#0F172A] dark:text-white max-w-sm mx-auto mt-2 text-xs">
                                    Set up currency fluctuation alerts or account monitors to receive instant push & email advisories.
                                </p>
                                <button 
                                    onClick={() => handleOpenModal()}
                                    className="mt-6 px-6 py-3 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer"
                                >
                                    + Add Your First Alert Rule
                                </button>
                            </div>
                        )}
                        
                        {suggestedUtilities.length > 0 && (
                            <div className="mt-8 border-t border-slate-200 dark:border-white/10 pt-6">
                                <h3 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                                    <SparklesIcon className="w-5 h-5 text-amber-500" />
                                    Smart Utility & Bill Tracking Recommendations
                                </h3>
                                <p className="text-xs text-[#0F172A] dark:text-white mb-4">
                                    We detected recurring bill providers in your ledger history. Subscribe to price shift alerts.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {suggestedUtilities.map(utility => (
                                        <div key={utility} className="flex items-center justify-between p-4 rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                                                    ⚡
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-wider">{utility} Provider</div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleCreateUtilitySuggestion(utility)}
                                                className="px-4 py-2 text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500 hover:bg-amber-200 dark:hover:bg-amber-500 rounded-xl transition-colors cursor-pointer"
                                            >
                                                Track
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {alertToDelete && (
                <DeleteConfirmationModal
                    title="Delete Alert Monitor Rule"
                    message="Are you sure you want to permanently remove this notification monitor?"
                    itemTypeLabel="Monitored Rule:"
                    itemText={getDescription(alertToDelete)}
                    confirmButtonText="Delete Rule"
                    onClose={() => setAlertToDelete(null)}
                    onConfirm={() => {
                        onDeleteAlert(alertToDelete.id);
                        setAlertToDelete(null);
                    }}
                />
            )}
        </>
    );
};
