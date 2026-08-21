
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WalletDetails, WalletTransaction, Card } from '../types';
import { INITIAL_WALLET_TRANSACTIONS } from './constants';
import { 
    PremiumReservedBankLogo,
    CreditCardIcon, 
    ArrowUpCircleIcon, 
    ArrowDownCircleIcon, 
    QrCodeIcon, 
    PlusCircleIcon, 
    ArrowsRightLeftIcon,
    WifiIcon,
    ShieldCheckIcon,
    GlobeAmericasIcon,
    CheckCircleIcon,
    EyeIcon,
    EyeSlashIcon,
    VisaIcon,
    MastercardIcon,
    LockClosedIcon,
    ChartBarIcon,
    ClockIcon,
    ServerIcon,
    TrendingUpIcon,
    ChevronRightIcon,
    // Fix: Added missing icon imports
    WalletIcon,
    ActivityIcon,
    UserCircleIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon
} from './Icons';
import { timeSince } from '../utils/time';

interface DigitalWalletProps {
    wallet: WalletDetails;
    cards: Card[];
    onOpenSendMoneyFlow: () => void;
    onOpenAddFunds: () => void;
}

const SecurityPulse: React.FC = () => (
    <div className="bg-slate-50 dark:bg-slate-800 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="relative">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
                <div className="absolute inset-0 m-auto w-2 h-2 bg-emerald-500 rounded-full"></div>
            </div>
            <div>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Protocol Active</p>
                <p className="text-[9px] text-[#0F172A] font-mono">TLS 1.3 | AES-256</p>
            </div>
        </div>
        <div className="flex -space-x-1">
            <div className="w-5 h-5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center"><ShieldCheckIcon className="w-3 h-3 text-primary" /></div>
            <div className="w-5 h-5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center"><LockClosedIcon className="w-3 h-3 text-primary" /></div>
        </div>
    </div>
);

const MiniSparkline: React.FC<{ color: string }> = ({ color }) => (
    <svg viewBox="0 0 100 30" className="w-16 h-6 overflow-visible opacity-70">
        <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            points="0,25 15,20 30,28 45,15 60,22 75,5 90,12 100,8"
        />
    </svg>
);

const WealthVelocity: React.FC = () => (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-2xl p-5 group hover:border-primary/30 transition-all">
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-[9px] font-black text-[#0F172A] uppercase tracking-[0.2em]">Wealth Velocity</p>
                <p className="text-lg font-black text-[#0F172A] dark:text-white mt-0.5">+4.2% <span className="text-[10px] font-bold text-[#0F172A] ml-1">AVG. APR</span></p>
            </div>
            <MiniSparkline color="#0ec5f2" />
        </div>
        <div className="flex gap-2">
            <div className="h-1 flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-2/3 shadow-[0_0_10px_#0ec5f2]"></div>
            </div>
            <span className="text-[8px] font-black text-[#0F172A] uppercase">Growth Node</span>
        </div>
    </div>
);

const WalletAction: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }> = ({ icon, label, onClick, active }) => (
    <button 
        onClick={onClick}
        className={`group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${active ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'bg-white border-slate-100 dark:border-white/10 hover:bg-white hover:border-slate-200 dark:border-white/10'}`}
    >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${active ? 'bg-white text-primary' : 'bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white'}`}>
            {icon}
        </div>
        <div className="text-left">
            <p className={`text-xs font-black uppercase tracking-widest ${active ? 'text-[#0F172A] dark:text-white' : 'text-[#0F172A] dark:text-[#1E293B]'}`}>{label}</p>
            <p className={`text-[9px] font-bold ${active ? 'text-[#0F172A] dark:text-white/70' : 'text-[#0F172A]'}`}>Execute instantly</p>
        </div>
        <ChevronRightIcon className={`w-4 h-4 ml-auto transition-transform group-hover:translate-x-1 ${active ? 'text-[#0F172A] dark:text-white/50' : 'text-[#0F172A]'}`} />
    </button>
);

const SpendingInsight: React.FC<{ label: string; amount: number; percent: number; color: string }> = ({ label, amount, percent, color }) => (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full shadow-[0_0_5px_currentColor]" style={{ color }}></div>
            <span className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-tight">{label}</span>
        </div>
        <div className="text-right">
            <p className="text-xs font-mono font-bold text-[#0F172A] dark:text-white">${amount.toLocaleString()}</p>
            <p className="text-sm font-black text-[#0F172A] uppercase tracking-widest">{percent}% Weight</p>
        </div>
    </div>
);

export const DigitalWallet: React.FC<DigitalWalletProps> = ({ wallet, cards, onOpenSendMoneyFlow, onOpenAddFunds }) => {
    const navigate = useNavigate();
    const [showBalance, setShowBalance] = useState(true);
    const [activeTab, setActiveTab] = useState<'activity' | 'insights' | 'security'>('activity');
    const [cardDetailsVisible, setCardDetailsVisible] = useState(false);

    const transactions = INITIAL_WALLET_TRANSACTIONS;

    return (
        <div className="relative min-h-screen pb-20 animate-fade-in">
            {/* Background Architecture */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-slate-100"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(14,197,242,0.1),transparent_50%)]"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-slate-900 to-transparent"></div>
            </div>

            <div className="relative z-10 max-w-[1400px] mx-auto pt-8 px-6 lg:px-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12 border-b border-slate-100 dark:border-white/10 pb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-primary/20 rounded-xl border border-primary/30 shadow-lg shadow-primary/10">
                                <WalletIcon className="w-7 h-7 text-primary" />
                            </div>
                            <h1 className="text-4xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase">Digital Hub</h1>
                        </div>
                        <p className="text-[#0F172A] dark:text-white text-lg font-bold max-w-lg leading-relaxed">
                            Orchestrate your global liquidity, hardware nodes, and secure transmission protocols from a unified private banking core.
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-4 w-full md:w-auto">
                        <SecurityPulse />
                        <div className="flex gap-2">
                             <div className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl flex items-center gap-3 shadow-xl">
                                <ServerIcon className="w-4 h-4 primary-" />
                                <span className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest">Node ID: PRB-DXL-009</span>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Left Column: Card & Primary Controls */}
                    <div className="lg:col-span-5 space-y-8">
                        
                        {/* Elite Wallet Card */}
                        <div className="group perspective-1000">
                            <div 
                                className="relative w-full aspect-[1.586/1] rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-500 transform hover:scale-[1.02] hover:shadow-[0_45px_85px_-20px_rgba(0,0,0,0.8),0_0_35px_rgba(59,130,246,0.25)] hover:rotate-y-3 hover:rotate-x-2 hover:translate-y-[-4px] bg-cover bg-center"
                                style={{ backgroundImage: "url('https://www.diloro.com/cdn/shop/files/diloro-mens-leather-wallet-gemini-brown-double-billfold-black-1712_1250x1250.png?v=1720008151')" }}
                            >
                                {/* Dark Overlay for text readability */}
                                <div className="absolute inset-0 bg-slate-100"></div>

                                {/* Holographic Element */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                <div className="absolute inset-0 bg-[linear-gradient(105deg,transparent_40%,rgba(255,255,255,0.05)_45%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.05)_55%,transparent_60%)] bg-[length:200%_100%] animate-[shimmer_5s_infinite_linear]"></div>
                                
                                <div className="relative z-10 p-10 flex flex-col h-full justify-between">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white rounded-2xl border border-slate-200 dark:border-white/10  dark:bg-slate-800">
                                                <PremiumReservedBankLogo className="w-10 h-10" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-[0.3em] leading-none mb-1">Private Client</p>
                                                <p className="text-sm font-bold text-[#0F172A] dark:text-white tracking-widest uppercase">Samuel Z. Russo</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center justify-end gap-2 mb-1">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Master Node</span>
                                            </div>
                                            <p className="font-mono text-xs text-[#0F172A] dark:text-white">REF: 8829-XQ</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[11px] font-black text-[#0F172A] dark:text-white uppercase tracking-[0.2em] mb-2">Authenticated Liquidity</p>
                                        <div className="flex items-center gap-4">
                                            <h3 className={`text-5xl lg:text-6xl font-black text-[#0F172A] dark:text-white tracking-tighter transition-all duration-700 ${showBalance ? '' : 'blur-2xl opacity-40'}`}>
                                                {showBalance ? wallet.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '$ •••••••'}
                                            </h3>
                                            <button onClick={() => setShowBalance(!showBalance)} className="p-2 bg-white hover:bg-white rounded-xl transition-all dark:bg-slate-800">
                                                {showBalance ? <EyeSlashIcon className="w-6 h-6 text-[#0F172A] dark:text-white" /> : <EyeIcon className="w-6 h-6 text-primary" />}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-3 mt-4">
                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 border border-emerald-500/20 rounded-lg text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                                <TrendingUpIcon className="w-3 h-3" /> Live Rate Active
                                            </span>
                                            <span className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest">FDIC Insured Nodes</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end border-t border-slate-200 dark:border-white/10 pt-6 mt-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-8 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-md relative overflow-hidden shadow-inner border border-slate-300 dark:border-black/10">
                                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                                                <div className="w-full h-px bg-slate-100 absolute top-1/2"></div>
                                                <div className="h-full w-px bg-slate-100 absolute left-1/2"></div>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-mono text-[#0F172A] dark:text-[#1E293B] tracking-widest">•••• •••• •••• {wallet.cardLastFour}</p>
                                                <p className="text-[8px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest mt-0.5">Hardware Encrypted</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setCardDetailsVisible(!cardDetailsVisible)}
                                            className="px-4 py-2 bg-white hover:bg-white text-[#0F172A] dark:text-white hover:text-[#0F172A] rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-slate-200 dark:border-white/10 dark:bg-slate-800"
                                        >
                                            {cardDetailsVisible ? 'Hide Node' : 'Show Details'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Orchestration */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <WalletAction icon={<PlusCircleIcon className="w-6 h-6" />} label="Inject Funds" onClick={onOpenAddFunds} active />
                            <WalletAction icon={<ShieldCheckIcon className="w-6 h-6" />} label="Multi-Sig Vault" onClick={() => navigate('/multisig')} />
                            <WalletAction icon={<ArrowsRightLeftIcon className="w-6 h-6" />} label="Push Transfer" onClick={onOpenSendMoneyFlow} />
                            <WalletAction icon={<QrCodeIcon className="w-6 h-6" />} label="NFC Node" onClick={() => navigate('/qrScanner')} />
                            <WalletAction icon={<GlobeAmericasIcon className="w-6 h-6" />} label="FX Conversion" onClick={() => navigate('/invest')} />
                        </div>

                        {/* Stats Summary */}
                        <div className="grid grid-cols-2 gap-6">
                            <WealthVelocity />
                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-2xl p-5">
                                <p className="text-[9px] font-black text-[#0F172A] uppercase tracking-[0.2em] mb-3">Spending Cap</p>
                                <div className="flex items-center gap-3">
                                    <div className="relative w-12 h-12">
                                        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                            <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="4" className="text-[#0F172A]" />
                                            <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="4" className="text-primary" strokeDasharray="100" strokeDashoffset="45" strokeLinecap="round" />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-[9px] font-black text-[#0F172A] dark:text-white tracking-tighter">55%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-[#0F172A] dark:text-white">$12,450.00</p>
                                        <p className="text-[9px] font-bold text-[#0F172A] uppercase tracking-widest">Monthly Utlz</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Ledger & Multi-layered Insights */}
                    <div className="lg:col-span-7 space-y-8">
                        
                        {/* Interactive Navigation */}
                        <div className="flex p-1 bg-white dark:bg-slate-900  rounded-2xl border border-slate-100 dark:border-white/10 w-fit">
                            {[
                                { id: 'activity', label: 'Activity Ledger', icon: ActivityIcon },
                                { id: 'insights', label: 'Flow Analytics', icon: ChartBarIcon },
                                { id: 'security', label: 'Node Security', icon: ShieldCheckIcon },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-slate-100 dark:bg-slate-700 text-[#0F172A] dark:text-white shadow-lg border border-slate-200 dark:border-white/10' : 'text-[#0F172A] hover:text-[#0F172A] dark:text-white'}`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {activeTab === 'activity' && (
                            <div className="bg-slate-50 dark:bg-slate-900  rounded-[2.5rem] border border-slate-100 dark:border-white/10 p-8 shadow-2xl animate-fade-in-up">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h3 className="text-xl font-black text-[#0F172A] dark:text-white tracking-tight uppercase">Recent Transmission Ledger</h3>
                                        <p className="text-[10px] text-[#0F172A] font-bold uppercase tracking-widest mt-1">Cross-Node Settlements Only</p>
                                    </div>
                                    <button onClick={() => navigate('/history')} className="px-5 py-2 bg-white hover:bg-white text-[#0F172A] hover:text-[#0F172A] border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all dark:bg-slate-800">Audit Trail</button>
                                </div>
                                <div className="space-y-2">
                                    {transactions.length > 0 ? (
                                        transactions.map(tx => (
                                            <div key={tx.id} className="flex items-center justify-between p-5 bg-slate-100 border border-slate-100 dark:border-white/10 rounded-2xl hover:border-primary/40 transition-all cursor-default group">
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${tx.type === 'credit' ? 'bg-emerald-500 text-emerald-500' : 'bg-white dark:bg-slate-900 text-[#0F172A]'}`}>
                                                        {tx.type === 'credit' ? <ArrowDownCircleIcon className="w-6 h-6" /> : <ArrowUpCircleIcon className="w-6 h-6" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[#0F172A] dark:text-[#1E293B] group-hover:text-[#0F172A] dark:text-white transition-colors">{tx.description}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${tx.type === 'credit' ? 'bg-emerald-500' : 'primary-'}`}></div>
                                                            <p className="text-[10px] text-[#0F172A] font-black uppercase tracking-widest">{timeSince(tx.date)}</p>
                                                            <span className="text-[9px] text-[#0F172A]">|</span>
                                                            <span className="text-[10px] font-mono text-[#0F172A] uppercase">TX_{tx.id.slice(-8)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-lg font-mono font-bold ${tx.type === 'credit' ? 'text-emerald-400' : 'text-[#0F172A] dark:text-white'}`}>
                                                        {tx.type === 'credit' ? '+' : '-'}{tx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                                    </p>
                                                    <div className="flex items-center justify-end gap-1.5 mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <CheckCircleIcon className="w-3 h-3 text-emerald-500" />
                                                        <span className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest">Settled</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-20 text-center space-y-4">
                                            <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto text-[#0F172A] shadow-inner">
                                                <ActivityIcon className="w-10 h-10" />
                                            </div>
                                            <p className="text-[#0F172A] font-bold uppercase text-xs tracking-[0.2em]">Zero Activity detected on this node</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'insights' && (
                            <div className="bg-slate-50 dark:bg-slate-900  rounded-[2.5rem] border border-slate-100 dark:border-white/10 p-10 shadow-2xl animate-fade-in-up">
                                <div className="flex justify-between items-end mb-10">
                                    <div>
                                        <h3 className="text-xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Spending Weight Analytics</h3>
                                        <p className="text-[10px] text-[#0F172A] font-bold uppercase tracking-widest mt-1">Institutional Category breakdown</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-[#0F172A] uppercase font-black tracking-widest">Global Ranking</p>
                                        <p className="text-xl font-black text-primary">TOP 1%</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <SpendingInsight label="Strategic Investments" amount={24500} percent={45} color="#0ec5f2" />
                                        <SpendingInsight label="Lifestyle Concierge" amount={12000} percent={22} color="#8b5cf6" />
                                        <SpendingInsight label="Logistics & Ops" amount={8400} percent={15} color="#10b981" />
                                        <SpendingInsight label="Global Mobility" amount={5000} percent={9} color="#f59e0b" />
                                        <SpendingInsight label="Other Outflow" amount={4200} percent={9} color="#64748b" />
                                    </div>
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="relative w-48 h-48 group">
                                             <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                                <circle cx="18" cy="18" r="16" fill="none" stroke="#1e293b" strokeWidth="4" />
                                                <circle cx="18" cy="18" r="16" fill="none" stroke="#0ec5f2" strokeWidth="4" strokeDasharray="100" strokeDashoffset="55" strokeLinecap="round" />
                                                <circle cx="18" cy="18" r="16" fill="none" stroke="#8b5cf6" strokeWidth="4" strokeDasharray="100" strokeDashoffset="77" strokeLinecap="round" transform="rotate(45 18 18)" />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <p className="text-[9px] font-black text-[#0F172A] uppercase leading-none">Total Flow</p>
                                                <p className="text-2xl font-black text-[#0F172A] dark:text-white">$54.1K</p>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-[#0F172A] font-bold uppercase tracking-widest mt-8 text-center italic">"Your liquidity management score is higher than 99% of global private nodes."</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                             <div className="bg-slate-50 dark:bg-slate-900  rounded-[2.5rem] border border-slate-100 dark:border-white/10 p-10 shadow-2xl animate-fade-in-up">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                        <ShieldCheckIcon className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Node Security Cluster</h3>
                                        <p className="text-[10px] text-[#0F172A] font-bold uppercase tracking-widest mt-1">Institutional Guardian Protocol: ON</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { label: "Hardware Key Verification", status: "Enabled", icon: LockClosedIcon, color: "text-emerald-500" },
                                        { label: "Biometric Handshake", status: "Verified", icon: UserCircleIcon, color: "text-emerald-500" },
                                        { label: "Geofencing Barrier", status: "NYC Hub Only", icon: GlobeAmericasIcon, color: "primary-" },
                                        { label: "Digital Signature Rotation", status: "Daily", icon: ArrowPathIcon, color: "text-primary" },
                                    ].map(item => (
                                        <div key={item.label} className="p-5 rounded-2xl bg-slate-100 border border-slate-100 dark:border-white/10 flex items-center gap-4 group hover:border-primary/40 transition-colors">
                                            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl text-[#0F172A] group-hover:text-primary transition-colors">
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">{item.label}</p>
                                                <p className={`text-xs font-bold ${item.color}`}>{item.status}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full mt-8 py-5 bg-white hover:bg-red-500 border border-slate-100 dark:border-white/10 hover:border-red-500/30 text-[#0F172A] hover:text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 dark:bg-slate-800">
                                    <ExclamationTriangleIcon className="w-4 h-4" /> EMERGENCY NODE LOCKDOWN
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <style>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .perspective-1000 { perspective: 1000px; }
            `}</style>
        </div>
    );
};
