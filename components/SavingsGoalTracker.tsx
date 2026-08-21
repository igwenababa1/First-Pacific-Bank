import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Account, AccountType } from '../types';
import { 
    PiggyBankIcon, 
    CheckCircleIcon, 
    PlusCircleIcon, 
    XIcon 
} from './Icons';
import { useCurrency } from '../contexts/CurrencyContext';

interface SavingsGoal {
    id: string;
    accountId: string;
    title: string;
    targetAmount: number;
    category: 'auto' | 'home' | 'travel' | 'emergency' | 'investment' | 'general';
}

interface SavingsGoalTrackerProps {
    accounts: Account[];
}

const CATEGORIES = [
    { value: 'general', label: 'General Savings', emoji: '🎯', color: '#10b981' }, // Emerald
    { value: 'investment', label: 'Wealth Investment', emoji: '📈', color: '#6366f1' }, // Indigo
    { value: 'home', label: 'Real Estate / Home', emoji: '🏡', color: '#f59e0b' }, // Amber
    { value: 'auto', label: 'Apex Supercar', emoji: '🏎️', color: '#ec4899' }, // Pink
    { value: 'travel', label: 'Private Jet & Travel', emoji: '✈️', color: '#3b82f6' }, // Blue
    { value: 'emergency', label: 'Sovereign Reserves', emoji: '🛡️', color: '#ef4444' } // Red
];

export const SavingsGoalTracker: React.FC<SavingsGoalTrackerProps> = ({ accounts }) => {
    const { formatCurrency } = useCurrency();
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form states
    const [formTitle, setFormTitle] = useState('');
    const [formAccountId, setFormAccountId] = useState('');
    const [formTarget, setFormTarget] = useState('');
    const [formCategory, setFormCategory] = useState<SavingsGoal['category']>('general');

    // Filter accounts to find Savings accounts
    const savingsAccounts = accounts.filter(acc => acc.type === AccountType.SAVINGS || acc.nickname?.toLowerCase().includes('savings'));

    // Load goals from local storage
    useEffect(() => {
        const saved = localStorage.getItem('fpb_savings_goals');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setGoals(parsed);
                if (parsed.length > 0) {
                    setSelectedGoalId(parsed[0].id);
                }
            } catch (e) {
                console.error("Failed to parse savings goals", e);
            }
        } else {
            // Seed defaults if there are savings accounts
            if (savingsAccounts.length > 0) {
                const defaultGoals: SavingsGoal[] = [
                    {
                        id: 'goal_seed_1',
                        accountId: savingsAccounts[0].id,
                        title: '🏡 Private Offshore Estate Trust',
                        targetAmount: 500000,
                        category: 'home'
                    },
                    {
                        id: 'goal_seed_2',
                        accountId: savingsAccounts[0].id,
                        title: '🏎️ Sovereign Apex Supercar Fund',
                        targetAmount: 150000,
                        category: 'auto'
                    }
                ];
                setGoals(defaultGoals);
                localStorage.setItem('fpb_savings_goals', JSON.stringify(defaultGoals));
                setSelectedGoalId(defaultGoals[0].id);
            }
        }
    }, [savingsAccounts.length]);

    // Save goals to localStorage
    const saveGoals = (updated: SavingsGoal[]) => {
        setGoals(updated);
        localStorage.setItem('fpb_savings_goals', JSON.stringify(updated));
    };

    const handleCreateGoal = (e: React.FormEvent) => {
        e.preventDefault();
        const targetVal = parseFloat(formTarget);
        if (!formTitle || !formAccountId || isNaN(targetVal) || targetVal <= 0) {
            alert("Please provide valid goal entries.");
            return;
        }

        const newGoal: SavingsGoal = {
            id: `goal_${Date.now()}`,
            accountId: formAccountId,
            title: formTitle,
            targetAmount: targetVal,
            category: formCategory
        };

        const updated = [...goals, newGoal];
        saveGoals(updated);
        setSelectedGoalId(newGoal.id);
        setIsCreateOpen(false);

        // Reset form
        setFormTitle('');
        setFormTarget('');
    };

    const handleDeleteGoal = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = goals.filter(g => g.id !== id);
        saveGoals(updated);
        if (selectedGoalId === id) {
            setSelectedGoalId(updated.length > 0 ? updated[0].id : null);
        }
    };

    // Calculate details for active goal
    const activeGoal = goals.find(g => g.id === selectedGoalId);
    const activeAccount = activeGoal ? accounts.find(a => a.id === activeGoal.accountId) : null;
    
    // Dynamic values
    const currentBalance = activeAccount ? (activeAccount?.balance || 0) : 0;
    const targetAmount = activeGoal ? activeGoal.targetAmount : 1;
    const percentage = Math.min(100, Math.max(0, (currentBalance / targetAmount) * 100));
    const remainingAmount = Math.max(0, targetAmount - currentBalance);
    const activeCatInfo = CATEGORIES.find(c => c.value === (activeGoal?.category || 'general'));
    const themeColor = activeCatInfo?.color || '#10b981';

    // SVG Circular Progress Constants
    const radius = 70;
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-xl transition-all relative overflow-hidden" id="savings-goal-tracker-container">
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 rounded-full filter blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-stretch justify-between gap-8">
                
                {/* Left Panel: Goal list and selector */}
                <div className="flex-1 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                                Private Wealth Ledger
                            </span>
                            <h3 className="text-xl font-black text-[#0F172A] dark:text-white mt-2 uppercase tracking-tight">Savings Goals Tracker</h3>
                        </div>
                        <button 
                            onClick={() => {
                                if (savingsAccounts.length === 0) {
                                    alert("Please create or link a Savings Account before creating savings targets.");
                                    return;
                                }
                                setFormAccountId(savingsAccounts[0].id);
                                setIsCreateOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold text-slate-950 bg-primary hover:bg-primary/95 uppercase tracking-wider rounded-xl transition-all shadow-md shadow-primary/10"
                        >
                            <PlusCircleIcon className="w-4 h-4" />
                            <span>Add Goal</span>
                        </button>
                    </div>

                    {/* Goals horizontal / grid list */}
                    {goals.length === 0 ? (
                        <div className="py-8 text-center bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/10">
                            <PiggyBankIcon className="w-12 h-12 text-[#0F172A] mx-auto mb-3" />
                            <p className="text-xs text-[#0F172A] font-bold uppercase tracking-wider">No savings goals defined</p>
                            <p className="text-[10px] text-[#0F172A] mt-1">Establish dedicated sweeps to visualize target milestones.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[180px] overflow-y-auto pr-1">
                            {goals.map(goal => {
                                const acc = accounts.find(a => a.id === goal.accountId);
                                const bal = acc ? (acc?.balance || 0) : 0;
                                const pct = Math.min(100, (bal / goal.targetAmount) * 100);
                                const cat = CATEGORIES.find(c => c.value === goal.category) || CATEGORIES[0];
                                const isActive = goal.id === selectedGoalId;

                                return (
                                    <div 
                                        key={goal.id}
                                        onClick={() => setSelectedGoalId(goal.id)}
                                        style={{ borderColor: isActive ? cat.color : 'transparent' }}
                                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                            isActive 
                                                ? 'bg-slate-50 dark:bg-slate-800 shadow-md shadow-black/10' 
                                                : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-100 border-slate-100 dark:border-white/10'
                                        } flex items-center justify-between gap-3 group`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="text-2xl">{cat.emoji}</span>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-[#1E293B] dark:text-slate-100 truncate pr-2">{goal.title}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="text-[9px] text-[#0F172A] font-bold uppercase tracking-wider">{acc?.nickname || 'Savings'}</span>
                                                    <span className="text-[9px] text-[#0F172A] font-bold">•</span>
                                                    <span className="text-[9px] font-mono font-extrabold" style={{ color: cat.color }}>{pct.toFixed(0)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={(e) => handleDeleteGoal(goal.id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-[#0F172A] hover:text-red-500 rounded-lg hover:bg-red-500 transition-all shrink-0"
                                            title="Delete Goal"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Panel: Active Goal ring & breakdown */}
                {activeGoal && (
                    <div className="flex flex-col sm:flex-row items-center gap-6 lg:border-l border-slate-100 dark:border-white/10 lg:pl-8 shrink-0 w-full lg:w-auto relative">
                        
                        {/* Celebration confetti particles when goal is reached */}
                        <AnimatePresence>
                            {percentage >= 100 && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="absolute -top-6 -right-2 pointer-events-none z-20 flex items-center gap-1"
                                >
                                    {[...Array(6)].map((_, i) => (
                                        <motion.span
                                            key={i}
                                            animate={{ 
                                                y: [0, -12, 0], 
                                                scale: [1, 1.25, 1], 
                                                rotate: [0, i % 2 === 0 ? 15 : -15, 0] 
                                            }}
                                            transition={{ 
                                                duration: 1.8, 
                                                repeat: Infinity, 
                                                delay: i * 0.2, 
                                                ease: "easeInOut" 
                                            }}
                                            className="text-lg filter drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]"
                                        >
                                            {['🎉', '✨', '🏆', '🌟', '🎊', '💫'][i]}
                                        </motion.span>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Interactive Progress Ring */}
                        <div className="relative flex items-center justify-center shrink-0">
                            {percentage >= 100 && (
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                                    className="absolute -inset-3 rounded-full border-2 border-dashed border-amber-400/50 pointer-events-none"
                                />
                            )}
                            <svg className="w-44 h-44 transform -rotate-90">
                                {/* Track Ring */}
                                <circle 
                                    cx="88" 
                                    cy="88" 
                                    r={radius} 
                                    fill="transparent" 
                                    stroke="currentColor" 
                                    className="text-slate-100 dark:text-[#1E293B]" 
                                    strokeWidth={strokeWidth} 
                                />
                                {/* Progress Ring */}
                                <motion.circle 
                                    cx="88" 
                                    cy="88" 
                                    r={radius} 
                                    fill="transparent" 
                                    stroke={percentage >= 100 ? '#f59e0b' : themeColor} 
                                    strokeWidth={strokeWidth} 
                                    strokeDasharray={circumference}
                                    initial={{ strokeDashoffset: circumference }}
                                    animate={{ strokeDashoffset: strokeDashoffset }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    strokeLinecap="round"
                                />
                            </svg>
                            
                            {/* Inner Circle Info */}
                            <div className="absolute flex flex-col items-center justify-center text-center">
                                <span className={`text-3xl font-black font-mono tracking-tighter ${percentage >= 100 ? 'text-amber-500 dark:text-amber-400 animate-pulse' : 'text-[#0F172A] dark:text-white'}`}>
                                    {percentage.toFixed(0)}%
                                </span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-[#0F172A] dark:text-white mt-1">
                                    {percentage >= 100 ? 'Milestone Hit!' : 'Reached'}
                                </span>
                            </div>
                        </div>

                        {/* Breakdown Data */}
                        <div className="flex-1 space-y-4 text-center sm:text-left">
                            <div>
                                <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                                    <span className="text-xl">{activeCatInfo?.emoji}</span>
                                    <span className="text-[10px] font-black uppercase tracking-wider font-mono" style={{ color: percentage >= 100 ? '#f59e0b' : themeColor }}>
                                        {activeCatInfo?.label}
                                    </span>
                                </div>
                                <h4 className="text-md font-bold text-[#0F172A] dark:text-white mt-1">{activeGoal.title}</h4>
                            </div>

                            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto sm:mx-0">
                                <div>
                                    <span className="text-[8.5px] font-black text-[#0F172A] uppercase tracking-wider block">Current Vaulted</span>
                                    <span className="text-sm font-black text-[#0F172A] dark:text-white font-mono mt-0.5 block">{formatCurrency(currentBalance)}</span>
                                </div>
                                <div>
                                    <span className="text-[8.5px] font-black text-[#0F172A] uppercase tracking-wider block">Target Goal</span>
                                    <span className="text-sm font-black text-[#0F172A] dark:text-white font-mono mt-0.5 block">{formatCurrency(targetAmount)}</span>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 dark:border-white/10 pt-3 max-w-xs mx-auto sm:mx-0">
                                {remainingAmount > 0 ? (
                                    <p className="text-[10px] font-bold text-[#0F172A] dark:text-white leading-normal">
                                        📈 Sweep <strong className="text-[#0F172A] dark:text-[#1E293B] font-black font-mono">{formatCurrency(remainingAmount)}</strong> additional liquidity to hit target cap.
                                    </p>
                                ) : (
                                    <div className="flex items-center justify-center sm:justify-start gap-1.5 text-amber-500 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider bg-amber-500 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                                        <CheckCircleIcon className="w-4 h-4 animate-bounce text-amber-400" />
                                        <span>Target Milestone Achieved! 🏆</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Creation Modal (Overlay) */}
            <AnimatePresence>
                {isCreateOpen && (
                    <div className="fixed inset-0 z-[100] bg-slate-100  flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 w-full max-w-md shadow-2xl relative text-[#0F172A] dark:text-white"
                        >
                            <button 
                                onClick={() => setIsCreateOpen(false)}
                                className="absolute top-4 right-4 p-2 text-[#0F172A] hover:text-[#0F172A] dark:hover:text-white transition-colors"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>

                            <h3 className="text-lg font-black uppercase tracking-tight mb-6">Create Savings Goal</h3>

                            <form onSubmit={handleCreateGoal} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2">Goal Name / Milestone</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. Dream Retreat, Emergency Cushion"
                                        value={formTitle}
                                        onChange={e => setFormTitle(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm outline-none focus:border-primary/50"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2">Target Account</label>
                                        <select 
                                            value={formAccountId}
                                            onChange={e => setFormAccountId(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm outline-none focus:border-primary/50"
                                        >
                                            {savingsAccounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.nickname || 'Savings'}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2">Milestone Category</label>
                                        <select 
                                            value={formCategory}
                                            onChange={e => setFormCategory(e.target.value as SavingsGoal['category'])}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm outline-none focus:border-primary/50"
                                        >
                                            {CATEGORIES.map(c => (
                                                <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2">Target Amount (USD)</label>
                                    <input 
                                        type="number"
                                        placeholder="e.g. 10000"
                                        value={formTarget}
                                        onChange={e => setFormTarget(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm font-mono outline-none focus:border-primary/50"
                                        required
                                        min="1"
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    className="w-full py-3.5 bg-primary hover:bg-primary/90 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-primary/15 mt-4"
                                >
                                    Confirm Goal Allocation
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
