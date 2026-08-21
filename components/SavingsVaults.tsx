import React, { useState, useEffect } from 'react';
import { PlusCircleIcon, LockClosedIcon, TrendingUpIcon, PiggyBankIcon, ArrowRightIcon, XIcon, SpinnerIcon, CheckCircleIcon, CurrencyDollarIcon, ShieldCheckIcon, ChartBarIcon, CreditCardIcon, ArrowsRightLeftIcon, ArrowDownTrayIcon, Cog8ToothIcon, EyeIcon, EyeSlashIcon, DocumentCheckIcon, BankIcon, WifiIcon } from './Icons';

interface VaultRule {
    type: 'auto_sweep' | 'salary_split' | 'round_up';
    amount?: number;
    percentage?: number;
    active: boolean;
}

interface VirtualCard {
    lastFour: string;
    status: 'active' | 'frozen';
    dailyLimit: number;
}

interface Vault { 
    id: string; 
    name: string; 
    target: number; 
    saved: number; 
    currency: string; 
    icon: string; 
    apy: number; 
    autoLock: boolean;
    accountNumber: string;
    routingNumber: string;
    virtualCard?: VirtualCard;
    rules: VaultRule[];
}

const INITIAL_VAULTS: Vault[] = [
    { 
        id: 'v1', name: 'Zurich Estate', target: 5000000, saved: 2150000, currency: 'CHF', icon: '🏠', apy: 4.5, autoLock: true,
        accountNumber: '9920394021', routingNumber: '021000021',
        virtualCard: { lastFour: '4922', status: 'active', dailyLimit: 10000 },
        rules: [{ type: 'auto_sweep', active: true, amount: 5000 }]
    },
    { 
        id: 'v2', name: 'Tax Reserve (Q4)', target: 350000, saved: 125000, currency: 'USD', icon: '🏛️', apy: 3.8, autoLock: false,
        accountNumber: '9920394022', routingNumber: '021000021',
        rules: [{ type: 'salary_split', active: true, percentage: 30 }]
    },
    { 
        id: 'v3', name: 'Yield Multiplier', target: 1000000, saved: 850000, currency: 'EUR', icon: '📈', apy: 5.2, autoLock: true,
        accountNumber: '9920394023', routingNumber: '021000021',
        rules: []
    },
];

const EMOJI_OPTIONS = ['🏠', '🏎️', '📈', '✈️', '🎓', '💍', '🎨', '🏛️', '🚁', '💎'];

const SubAccountDetailModal: React.FC<{ vault: Vault; onClose: () => void; onUpdate: (v: Vault) => void }> = ({ vault, onClose, onUpdate }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'card' | 'rules'>('overview');
    const [amt, setAmt] = useState('');
    const [actionMsg, setActionMsg] = useState<string | null>(null);

    const handleTransaction = (type: 'deposit' | 'withdraw') => {
        if (!amt) return;
        const val = parseFloat(amt);
        const newSaved = type === 'deposit' ? vault.saved + val : Math.max(0, vault.saved - val);
        onUpdate({ ...vault, saved: newSaved });
        setActionMsg(`${type === 'deposit' ? 'Deposited' : 'Withdrew'} ${vault.currency} ${val.toLocaleString()}`);
        setAmt('');
        setTimeout(() => setActionMsg(null), 3000);
    };

    const toggleRule = (index: number) => {
        const newRules = [...vault.rules];
        newRules[index].active = !newRules[index].active;
        onUpdate({ ...vault, rules: newRules });
    };

    const issueCard = () => {
        onUpdate({
            ...vault,
            virtualCard: { lastFour: Math.floor(1000 + Math.random() * 9000).toString(), status: 'active', dailyLimit: 5000 }
        });
        setActionMsg("Virtual Debit Card Issued");
        setTimeout(() => setActionMsg(null), 3000);
    };

    const toggleCardLock = () => {
        if (!vault.virtualCard) return;
        onUpdate({
            ...vault,
            virtualCard: { ...vault.virtualCard, status: vault.virtualCard.status === 'active' ? 'frozen' : 'active' }
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-800  animate-fade-in">
            <div className="bg-[#0c121e] border border-slate-200 dark:border-white/10 w-full max-w-4xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row h-[85vh] animate-fade-in-up">
                
                {/* Left Sidebar */}
                <div className="w-full md:w-1/3 bg-slate-50 dark:bg-slate-900 border-r border-slate-100 dark:border-white/10 p-8 flex flex-col">
                    <button onClick={onClose} className="md:hidden absolute top-6 right-6 text-[#0F172A] hover:text-white"><XIcon className="w-6 h-6"/></button>
                    
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-3xl shadow-inner relative border border-slate-200 dark:border-white/10">{vault.icon}</div>
                        <div>
                            <h3 className="font-black text-xl text-[#0F172A] dark:text-white truncate">{vault.name}</h3>
                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">{vault.currency} Sub-Account</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-white/10 mb-8 shadow-sm">
                        <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-1">Available Liquidity</p>
                        <p className="text-3xl font-black text-[#0F172A] dark:text-white font-mono tracking-tight">{vault.currency} {vault.saved.toLocaleString()}</p>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10">
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${Math.min((vault.saved / vault.target) * 100, 100)}%` }}></div>
                            </div>
                            <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider text-right">{Math.round((vault.saved / vault.target) * 100)}% to Goal</p>
                        </div>
                    </div>

                    <nav className="space-y-2 flex-grow">
                        {[
                            { id: 'overview', icon: ChartBarIcon, label: 'Overview & Transfers' },
                            { id: 'card', icon: CreditCardIcon, label: 'Virtual Debit Card' },
                            { id: 'rules', icon: Cog8ToothIcon, label: 'Smart Rules & Automation' }
                        ].map(t => (
                            <button 
                                key={t.id} 
                                onClick={() => setActiveTab(t.id as any)}
                                className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-left ${activeTab === t.id ? 'bg-primary/10 text-primary border border-primary/20' : 'text-[#0F172A] hover:bg-slate-100 dark:hover:bg-white border border-transparent'}`}
                            >
                                <t.icon className="w-5 h-5" />
                                <span className="text-xs font-bold uppercase tracking-widest">{t.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 p-8 md:p-10 overflow-y-auto relative bg-[#0c121e]">
                    <button onClick={onClose} className="hidden md:block absolute top-8 right-8 text-[#0F172A] hover:text-white p-2 hover:bg-white rounded-full transition-colors dark:bg-slate-800"><XIcon className="w-6 h-6"/></button>
                    
                    {actionMsg && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-fade-in-up">
                            <CheckCircleIcon className="w-4 h-4" /> {actionMsg}
                        </div>
                    )}

                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-fade-in max-w-2xl mt-4">
                            <div>
                                <h4 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2"><ArrowsRightLeftIcon className="w-4 h-4" /> Manual Transfers</h4>
                                <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/10 space-y-4">
                                    <div className="relative">
                                        <input type="number" value={amt} onChange={e=>setAmt(e.target.value)} placeholder="0.00" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-4 pl-12 text-[#0F172A] dark:text-white font-mono outline-none focus:border-primary text-xl" />
                                        <CurrencyDollarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0F172A]" />
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={() => handleTransaction('deposit')} className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-emerald-500/20">Deposit In</button>
                                        <button onClick={() => handleTransaction('withdraw')} className="flex-1 py-4 bg-slate-200 dark:bg-slate-900 hover:bg-slate-300 dark:hover:bg-slate-700 text-[#0F172A] dark:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors">Withdraw Out</button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2"><BankIcon className="w-4 h-4" /> Direct Routing Details</h4>
                                <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/10 p-6 space-y-4">
                                    <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-white/10">
                                        <span className="text-xs font-bold text-[#0F172A] uppercase tracking-widest">Routing Number</span>
                                        <span className="font-mono text-sm text-[#0F172A] dark:text-white tracking-widest">{vault.routingNumber}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-white/10">
                                        <span className="text-xs font-bold text-[#0F172A] uppercase tracking-widest">Account Number</span>
                                        <span className="font-mono text-sm text-[#0F172A] dark:text-white tracking-widest">{vault.accountNumber}</span>
                                    </div>
                                    <p className="text-[10px] text-[#0F172A] uppercase tracking-wider leading-relaxed">Use these details to deposit directly into this sub-account from external employers or institutions.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'card' && (
                        <div className="space-y-8 animate-fade-in max-w-2xl mt-4">
                            <div className="text-center mb-8">
                                <h4 className="text-xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Dedicated SPV Debit Card</h4>
                                <p className="text-xs text-[#0F172A] mt-2 font-bold uppercase tracking-widest">Spend directly from {vault.name}</p>
                            </div>

                            {vault.virtualCard ? (
                                <div className="space-y-8">
                                    <div className="w-full max-w-sm mx-auto h-56 rounded-3xl bg-gradient-to-tr from-slate-900 to-slate-800 p-8 shadow-2xl relative overflow-hidden border border-slate-300 hover:scale-105 transition-transform duration-500">
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                                        <div className="relative z-10 h-full flex flex-col justify-between">
                                            <div className="flex justify-between items-start">
                                                <div className="text-white font-black uppercase text-xs tracking-[0.2em]">{vault.name}</div>
                                                <WifiIcon className="w-6 h-6 text-white/50 rotate-90" />
                                            </div>
                                            <div className="text-2xl font-mono tracking-[0.3em] text-white my-4 shadow-black drop-shadow-md">
                                                •••• •••• •••• {vault.virtualCard.lastFour}
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div className="font-mono text-xs text-white/80">09/29</div>
                                                <div className="font-bold italic text-white/90 font-serif text-lg">VISA</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={toggleCardLock} className={`p-5 rounded-2xl border text-left transition-all ${vault.virtualCard.status === 'active' ? 'bg-red-500 border-red-500/20 hover:bg-red-500 text-red-500' : 'bg-emerald-500 border-emerald-500/20 hover:bg-emerald-500 text-emerald-400'}`}>
                                            <LockClosedIcon className="w-5 h-5 mb-2" />
                                            <h5 className="font-bold text-sm uppercase tracking-widest">{vault.virtualCard.status === 'active' ? 'Freeze Card' : 'Unfreeze Card'}</h5>
                                        </button>
                                        <button className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 hover:border-primary/50 transition-all text-left group">
                                            <Cog8ToothIcon className="w-5 h-5 mb-2 text-[#0F172A] group-hover:text-primary transition-colors" />
                                            <h5 className="font-bold text-sm text-[#0F172A] dark:text-white uppercase tracking-widest">Adjust Limits</h5>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center p-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl">
                                    <CreditCardIcon className="w-12 h-12 text-[#0F172A] mx-auto mb-4" />
                                    <p className="text-sm font-bold text-[#0F172A] dark:text-white mb-6">No Virtual Card Issued</p>
                                    <button onClick={issueCard} className="px-8 py-4 bg-primary text-[#0F172A] dark:text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">Generate Instant Virtual Card</button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'rules' && (
                        <div className="space-y-6 animate-fade-in max-w-2xl mt-4">
                            <h4 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2"><Cog8ToothIcon className="w-4 h-4" /> Automation Rules</h4>
                            
                            {[
                                { type: 'auto_sweep', label: 'Max Balance Auto-Sweep', desc: 'Sweep excess funds from checking when balance exceeds limit.', icon: ArrowsRightLeftIcon },
                                { type: 'salary_split', label: 'Direct Deposit Split', desc: 'Automatically route a percentage of incoming payroll here.', icon: ArrowDownTrayIcon },
                                { type: 'round_up', label: 'Expense Round-ups', desc: 'Round up spare change from card purchases into this vault.', icon: PlusCircleIcon },
                            ].map((def, idx) => {
                                const rule = vault.rules.find(r => r.type === def.type);
                                const isActive = !!rule?.active;

                                return (
                                    <div key={def.type} className={`p-6 rounded-3xl border transition-all ${isActive ? 'bg-primary/5 border-primary/30' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-white/10'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-start gap-4">
                                                <div className={`p-3 rounded-xl ${isActive ? 'bg-primary text-[#0F172A]' : 'bg-white dark:bg-slate-900 text-[#0F172A]'}`}>
                                                    <def.icon className="w-5 h-5" />
                                                </div>
                                                <div className="mt-1">
                                                    <h5 className="font-bold text-sm text-[#0F172A] dark:text-white">{def.label}</h5>
                                                    <p className="text-[10px] text-[#0F172A] font-bold uppercase tracking-wider mt-1 leading-relaxed">{def.desc}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const newRules = [...vault.rules];
                                                    const existingIdx = newRules.findIndex(r => r.type === def.type);
                                                    if (existingIdx >= 0) newRules[existingIdx].active = !newRules[existingIdx].active;
                                                    else newRules.push({ type: def.type as any, active: true });
                                                    onUpdate({ ...vault, rules: newRules });
                                                }}
                                                className={`w-12 h-6 rounded-full relative transition-colors ${isActive ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${isActive ? 'left-7' : 'left-1'}`}></div>
                                            </button>
                                        </div>
                                        {isActive && def.type === 'auto_sweep' && (
                                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                                                <span className="text-xs font-bold text-[#0F172A] uppercase tracking-widest">Trigger Balance</span>
                                                <span className="font-mono text-sm text-[#0F172A] dark:text-white">$5,000.00</span>
                                            </div>
                                        )}
                                        {isActive && def.type === 'salary_split' && (
                                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                                                <span className="text-xs font-bold text-[#0F172A] uppercase tracking-widest">Allocation Split</span>
                                                <span className="font-mono text-sm text-[#0F172A] dark:text-white">30%</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const AddVaultModal: React.FC<{ onClose: () => void; onAdd: (vault: Vault) => void }> = ({ onClose, onAdd }) => {
    const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
    const [name, setName] = useState('');
    const [target, setTarget] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [icon, setIcon] = useState('💎');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setStep('processing');
        setTimeout(() => {
            onAdd({ 
                id: `v_${Date.now()}`, name, target: parseFloat(target), saved: 0, currency, icon, apy: 4.25, autoLock: false,
                accountNumber: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                routingNumber: '021000021',
                rules: []
            });
            setStep('success');
            setTimeout(onClose, 1500);
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-slate-100  flex items-center justify-center z-[70] p-4 animate-fade-in">
            <div className="bg-[#0c121e] border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative animate-fade-in-up">
                {step === 'form' && (
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Create Sub-Account</h3>
                            <button onClick={onClose} className="text-[#0F172A] hover:text-white"><XIcon className="w-6 h-6"/></button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                                {EMOJI_OPTIONS.map(e => (
                                    <button key={e} type="button" onClick={() => setIcon(e)} className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl transition-all ${icon === e ? 'bg-primary border-2 border-primary text-white scale-110 shadow-[0_0_15px_rgba(0,82,255,0.4)]' : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white'}`}>{e}</button>
                                ))}
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-2 block">Partition Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-[#0F172A] dark:text-white font-bold outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. Tax Estimates" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-2 block">Target Goal</label>
                                    <input type="number" value={target} onChange={e => setTarget(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-[#0F172A] dark:text-white font-bold outline-none focus:ring-2 focus:ring-primary" placeholder="0.00" required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-2 block">Denomination</label>
                                    <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-[#0F172A] dark:text-white font-bold outline-none focus:ring-2 focus:ring-primary appearance-none">
                                        <option>USD</option><option>EUR</option><option>GBP</option><option>CHF</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-4 rounded-xl bg-primary text-[#0F172A] dark:text-white text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30">Initialize Partition</button>
                        </form>
                    </div>
                )}
                {step === 'processing' && (
                    <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                        <SpinnerIcon className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest">Provisioning Sub-Account Ledger</p>
                    </div>
                )}
                {step === 'success' && (
                    <div className="p-12 flex flex-col items-center justify-center text-center space-y-4 bg-emerald-500">
                        <CheckCircleIcon className="w-16 h-16 text-emerald-400" />
                        <h3 className="text-xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Ledger Ready</h3>
                        <p className="text-[10px] text-[#0F172A] dark:text-white uppercase tracking-widest font-bold">Partition initialized with smart routing</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const SavingsVaults: React.FC = () => {
    const [vaults, setVaults] = useState<Vault[]>([]); 
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedVault, setSelectedVault] = useState<Vault | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('fpb_smart_vaults');
        if (stored) {
            // Migration logic if old vaults miss new properties
            const parsed = JSON.parse(stored);
            const upgraded = parsed.map((v: any) => ({
                ...v,
                accountNumber: v.accountNumber || `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                routingNumber: v.routingNumber || '021000021',
                rules: v.rules || []
            }));
            setVaults(upgraded);
        } else {
            setVaults(INITIAL_VAULTS);
            localStorage.setItem('fpb_smart_vaults', JSON.stringify(INITIAL_VAULTS));
        }
    }, []);

    const saveVaults = (newVaults: Vault[]) => {
        setVaults(newVaults);
        localStorage.setItem('fpb_smart_vaults', JSON.stringify(newVaults));
    };

    const handleAddVault = (vault: Vault) => {
        saveVaults([...vaults, vault]);
    };

    const handleUpdateVault = (updated: Vault) => {
        const newVaults = vaults.map(v => v.id === updated.id ? updated : v);
        saveVaults(newVaults);
        setSelectedVault(updated);
    };

    const totalSaved = vaults.reduce((sum, v) => sum + v.saved, 0);

    return (
        <div className="bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-xl dark:shadow-black/40 hover:shadow-2xl hover:border-slate-300 dark:hover:border-slate-200 dark:border-black/10 relative overflow-hidden h-full flex flex-col group transition-all duration-500">
             <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                <ShieldCheckIcon className="w-32 h-32 text-primary" />
            </div>

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <BankIcon className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-tight text-glow group-hover:text-primary transition-colors">Premium Sub-Accounts & Partitions</h3>
                        </div>
                        <div className="flex items-end gap-2">
                            <h2 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tighter">${totalSaved.toLocaleString(undefined, { minimumFractionDigits: 0 })}</h2>
                            <span className="text-[10px] font-bold text-[#0F172A] mb-1.5 tracking-widest uppercase">Total Segmented Liquidity</span>
                        </div>
                    </div>
                    <button onClick={() => setIsAddOpen(true)} className="p-3 bg-white hover:bg-white text-[#0F172A] dark:text-white rounded-xl transition-colors border border-slate-200 dark:border-white/10 shadow-sm dark:bg-slate-800">
                        <PlusCircleIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4 flex-grow overflow-y-auto custom-scrollbar pr-2">
                    {vaults.map(vault => {
                        const progress = Math.min((vault.saved / vault.target) * 100, 100);
                        return (
                            <div 
                                key={vault.id} 
                                onClick={() => setSelectedVault(vault)}
                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-5 hover:border-primary/50 transition-all cursor-pointer group/item hover:bg-white dark:hover:bg-white"
                            >
                                <div className="flex justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-2xl shadow-inner relative border border-slate-100 dark:border-white/10 group-hover/item:scale-110 transition-transform">
                                            {vault.icon}
                                            {vault.virtualCard && (
                                                <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-primary border-2 border-slate-900 rounded-full flex items-center justify-center shadow-lg">
                                                    <CreditCardIcon className="w-2.5 h-2.5 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-[#0F172A] dark:text-white group-hover/item:text-primary transition-colors">{vault.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-mono text-[#0F172A] tracking-wider">*{vault.accountNumber.slice(-4)}</span>
                                                <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500 px-1.5 py-0.5 rounded flex items-center gap-0.5"><TrendingUpIcon className="w-3 h-3"/> {vault.apy}% APY</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 text-[#0F172A] flex items-center justify-center group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                                        <ArrowRightIcon className="w-4 h-4 -rotate-45" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black tracking-widest uppercase">
                                        <span className="text-[#0F172A] dark:text-white">{vault.currency} {vault.saved.toLocaleString()}</span>
                                        <span className="text-[#0F172A]">Goal: {vault.target.toLocaleString()}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full relative" style={{ width: `${progress}%` }}>
                                            <div className="absolute top-0 right-0 bottom-0 w-8 bg-white animate-[ping_2s_infinite] dark:bg-slate-800"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {isAddOpen && <AddVaultModal onClose={() => setIsAddOpen(false)} onAdd={handleAddVault} />}
            {selectedVault && <SubAccountDetailModal vault={selectedVault} onClose={() => setSelectedVault(null)} onUpdate={handleUpdateVault} />}
        </div>
    );
};

