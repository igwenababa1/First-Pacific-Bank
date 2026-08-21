import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    PiggyBank, Plus, Target, Trash2, CheckCircle2, ChevronRight, 
    Sparkles, Key, Landmark, HelpCircle, X, DollarSign 
} from 'lucide-react';
import { Account } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';

interface BudgetingGoalsWidgetProps {
    accounts: Account[];
}

interface SavingGoal {
    id: string;
    title: string;
    accountId: string; // Linked account
    targetAmount: number;
    category: string;
}

export const BudgetingGoalsWidget: React.FC<BudgetingGoalsWidgetProps> = ({ accounts }) => {
    const { formatCurrency } = useCurrency();
    const [goals, setGoals] = useState<SavingGoal[]>([]);
    const [isAdding, setIsAdding] = useState(false);

    // Goal creation form state
    const [title, setTitle] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [category, setCategory] = useState('Sovereign Vault');

    // Load presets and storage records
    useEffect(() => {
        const stored = localStorage.getItem('fpb_budgeting_goals_v1');
        if (stored) {
            try {
                setGoals(JSON.parse(stored));
            } catch (err) {
                console.error("Local Storage goals parse failure, resetting: ", err);
            }
        } else if (accounts.length > 0) {
            // Find appropriate accounts to bind to
            const savingsAcc = accounts.find(a => a.type.toLowerCase().includes('savings')) || accounts[0];
            const checkingAcc = accounts.find(a => a.type.toLowerCase().includes('checking')) || accounts[0];
            const investAcc = accounts.find(a => a.type.toLowerCase().includes('investment') || a.type.toLowerCase().includes('capital')) || accounts[0];

            const presets: SavingGoal[] = [
                {
                    id: 'goal_savings_estate',
                    title: 'Strategic Estate Acquisition',
                    accountId: savingsAcc?.id || '',
                    targetAmount: 180000,
                    category: 'Sovereign Estate'
                },
                {
                    id: 'goal_checking_reserve',
                    title: 'Corporate Working Capital',
                    accountId: checkingAcc?.id || '',
                    targetAmount: 40000,
                    category: 'Reserve'
                }
            ];
            setGoals(presets);
            localStorage.setItem('fpb_budgeting_goals_v1', JSON.stringify(presets));
        }
    }, [accounts]);

    const saveAndSetGoals = (newGoals: SavingGoal[]) => {
        setGoals(newGoals);
        localStorage.setItem('fpb_budgeting_goals_v1', JSON.stringify(newGoals));
    };

    // Link live balance values from outer state
    const goalListWithLiveStats = useMemo(() => {
        return goals.map(goal => {
            const acc = accounts.find(a => a.id === goal.accountId);
            const liveBalance = acc ? (acc?.balance || 0) : 0;
            const accountName = acc ? (acc.nickname || acc.type) : "Primary Balance";
            const percent = Math.min(100, Math.max(0, (liveBalance / goal.targetAmount) * 100));
            return {
                ...goal,
                liveBalance,
                accountName,
                percent,
                isCompleted: percent >= 100
            };
        });
    }, [goals, accounts]);

    const handleCreateGoal = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !targetAmount || !selectedAccountId) return;

        const newGoal: SavingGoal = {
            id: `goal_${Date.now()}`,
            title: title.trim(),
            accountId: selectedAccountId,
            targetAmount: parseFloat(targetAmount),
            category: category
        };

        const updated = [...goals, newGoal];
        saveAndSetGoals(updated);
        
        // Reset state
        setTitle('');
        setTargetAmount('');
        setIsAdding(false);
    };

    const handleDeleteGoal = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = goals.filter(g => g.id !== id);
        saveAndSetGoals(updated);
    };

    return (
        <div className="bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-xl dark:shadow-black/40 hover:shadow-2xl hover:border-slate-300 dark:hover:border-slate-200 dark:border-black/10 flex flex-col h-full justify-between overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 dark:bg-amber-500 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <PiggyBank className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                        <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#64748b] dark:text-[#94a3b8]">PORTFOLIO GOALS</span>
                    </div>
                    <h3 className="text-xl font-bold tracking-tight text-[#0F172A] dark:text-white">
                        Sovereign Budget Buckets
                    </h3>
                </div>

                {!isAdding && (
                    <button
                        onClick={() => {
                            setIsAdding(true);
                            if (accounts.length > 0 && !selectedAccountId) {
                                setSelectedAccountId(accounts[0].id);
                            }
                        }}
                        className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Set Goal</span>
                    </button>
                )}
            </div>

            {/* Content Display Layer */}
            <div className="relative z-10 flex-1 overflow-y-auto max-h-[290px] pr-1 scrollbar-hide">
                <AnimatePresence mode="wait">
                    {isAdding ? (
                        <motion.form
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            onSubmit={handleCreateGoal}
                            className="space-y-4"
                        >
                            <div className="flex justify-between items-center bg-[#070b13]/5 p-3 rounded-2xl border border-slate-100 dark:border-white/10">
                                <span className="text-xs font-bold text-[#0F172A] dark:text-white flex items-center gap-1.5">
                                    <Target className="w-4 h-4 text-emerald-400" /> Configure Saving Target
                                </span>
                                <button 
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="p-1 hover:bg-[#070b13]/10 dark:hover:bg-white rounded-full text-[#0F172A] dark:bg-slate-800"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-3.5">
                                {/* Title */}
                                <div>
                                    <label className="block text-[10px] font-bold text-[#0F172A] uppercase mb-1">Bucket Target Label</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Aspen Chalet Purchase, Sovereign Assets"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs font-bold text-[#0F172A] dark:text-white outline-none focus:border-emerald-500"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3.5">
                                    {/* Size Target */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-[#0F172A] uppercase mb-1">Target Capital ($)</label>
                                        <input 
                                            type="number" 
                                            placeholder="e.g. 50000"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs font-bold text-[#0F172A] dark:text-white outline-none focus:border-emerald-500 font-mono"
                                            value={targetAmount}
                                            onChange={(e) => setTargetAmount(e.target.value)}
                                            required
                                            min="1"
                                        />
                                    </div>

                                    {/* Division category */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-[#0F172A] uppercase mb-1">Vessel / Category</label>
                                        <select 
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-2 text-xs font-semibold text-[#0F172A] dark:text-white outline-none focus:border-emerald-500"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                        >
                                            <option value="Sovereign Vault">Sovereign Vault</option>
                                            <option value="Real Estate">Real Estate</option>
                                            <option value="Accumulation">Accumulation</option>
                                            <option value="Crypto Reserve">Crypto Reserve</option>
                                            <option value="Lending Allocation">Lending Allocation</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Destination matching accounts */}
                                <div>
                                    <label className="block text-[10px] font-bold text-[#0F172A] uppercase mb-1">Settling Target Account</label>
                                    <select 
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-2 text-xs font-semibold text-[#0F172A] dark:text-white outline-none focus:border-emerald-500"
                                        value={selectedAccountId}
                                        onChange={(e) => setSelectedAccountId(e.target.value)}
                                    >
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.nickname || acc.type} (${(acc?.balance || 0).toLocaleString()})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-slate-50 text-white dark:bg-emerald-500 dark:text-slate-950 font-bold rounded-xl text-xs hover:opacity-90 transition-all cursor-pointer shadow-md"
                            >
                                Activate Sovereign Bucket
                            </button>
                        </motion.form>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            {goalListWithLiveStats.length === 0 ? (
                                <div className="text-center py-10">
                                    <Target className="w-10 h-10 text-[#0F172A] mx-auto mb-2 opacity-70" />
                                    <p className="text-xs text-[#0F172A]">No active budgeting goals created.</p>
                                    <p className="text-[10px] text-[#0F172A] mt-1">Sovereign account bucket balances will display targets here.</p>
                                </div>
                            ) : (
                                goalListWithLiveStats.map((item) => (
                                    <div 
                                        key={item.id} 
                                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-2xl p-4 hover:border-slate-300/80 hover:dark:border-white/10 transition-all relative group"
                                    >
                                        <div className="flex justify-between items-start gap-4 mb-2">
                                            <div>
                                                <span className="text-[9px] uppercase font-mono tracking-widest text-[#94a3b8] font-bold">
                                                    {item.category} // {item.accountName}
                                                </span>
                                                <h4 className="text-xs font-bold text-[#0F172A] dark:text-white tracking-tight mt-0.5">
                                                    {item.title}
                                                </h4>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {item.isCompleted ? (
                                                    <span className="flex items-center gap-1 text-[9px] font-black text-emerald-400 uppercase bg-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                        <CheckCircle2 className="w-3 h-3" /> Complete
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-black font-mono text-[#0F172A] dark:text-[#1E293B]">
                                                        {item.percent.toFixed(0)}%
                                                    </span>
                                                )}
                                                <button
                                                    onClick={(e) => handleDeleteGoal(item.id, e)}
                                                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-rose-500 text-rose-500 transition-all cursor-pointer"
                                                    title="Decommission Target"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Dynamic Interactive Progress Bar */}
                                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden mb-2 shadow-inner">
                                            <motion.div 
                                                className={`h-full rounded-full bg-gradient-to-r ${
                                                    item.isCompleted 
                                                        ? 'from-emerald-400 to-teal-400' 
                                                        : 'from-emerald-500 via-teal-500 to-amber-400'
                                                }`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${item.percent}%` }}
                                                transition={{ duration: 1.2, ease: 'easeOut' }}
                                            />
                                        </div>

                                        {/* Status metrics footer */}
                                        <div className="flex justify-between text-[10px] text-[#0F172A] font-mono mt-1">
                                            <span>Active: {formatCurrency(item.liveBalance)}</span>
                                            <span>Cap: {formatCurrency(item.targetAmount)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
