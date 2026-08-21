import React, { useMemo, useState, useEffect } from 'react';
import { Transaction, TransactionStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useCurrency } from '../contexts/CurrencyContext';
import { PieChart as PieChartIcon, BarChart3 as BarChart3Icon, Sparkles, BrainCircuit, RefreshCw, ChevronRight, HelpCircle, ArrowUpRight, AlertTriangle, PiggyBank, TrendingUp } from 'lucide-react';
import * as d3 from 'd3';

interface SpendingAnalyticsWidgetProps {
    transactions: Transaction[];
}

interface BudgetCategory {
    category: string;
    percentage: number;
    suggestedAmount: number;
    color: string;
    justification: string;
}

// Interactive D3-powered Donut Chart Component
const D3DonutChart: React.FC<{
    data: { name: string; value: number; color: string }[];
    total: number;
    activeCategory: string | null;
    setActiveCategory: (name: string | null) => void;
}> = ({ data, total, activeCategory, setActiveCategory }) => {
    const width = 160;
    const height = 160;
    const radius = Math.min(width, height) / 2;
    const innerRadius = radius * 0.65;
    const outerRadius = radius * 0.9;
    
    // Create the pie layout
    const pie = d3.pie<{ name: string; value: number; color: string }>()
        .value(d => d.value)
        .sort(null);
        
    // Create the arc generator
    const arcGenerator = d3.arc<d3.PieArcDatum<{ name: string; value: number; color: string }>>()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .cornerRadius(4)
        .padAngle(0.03);
        
    const arcs = pie(data);
    
    return (
        <div className="relative flex items-center justify-center">
            <svg width={width} height={height} className="overflow-visible">
                <g transform={`translate(${width / 2}, ${height / 2})`}>
                    {arcs.map((arc, i) => {
                        const isHovered = activeCategory === arc.data.name;
                        const path = arcGenerator(arc);
                        return (
                            <path
                                key={i}
                                d={path || ''}
                                fill={arc.data.color}
                                opacity={activeCategory ? (isHovered ? 1.0 : 0.4) : 0.95}
                                className="transition-all duration-300 cursor-pointer hover:scale-105"
                                style={{ 
                                    transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                                    transformOrigin: '0px 0px'
                                }}
                                onMouseEnter={() => setActiveCategory(arc.data.name)}
                                onMouseLeave={() => setActiveCategory(null)}
                            >
                                <title>{`${arc.data.name}: ${arc.data.value}%`}</title>
                            </path>
                        );
                    })}
                </g>
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[9px] uppercase font-black tracking-widest text-[#0F172A] dark:text-white">Allocation</span>
                <span className="text-base font-black text-[#0F172A] dark:text-white font-mono mt-0.5">
                    {activeCategory ? `${data.find(d => d.name === activeCategory)?.value || 0}%` : `${total}%`}
                </span>
                {activeCategory && (
                    <span className="text-[8px] uppercase font-bold text-[#0F172A] tracking-wider mt-0.5 truncate max-w-[100px]">
                        {activeCategory}
                    </span>
                )}
            </div>
        </div>
    );
};

export const SpendingAnalyticsWidget: React.FC<SpendingAnalyticsWidgetProps> = ({ transactions }) => {
    const { formatCurrency } = useCurrency();
    const [chartMode, setChartMode] = useState<'bar' | 'pie' | 'ai-budget' | 'budget'>('bar');
    const [monthlyIncome, setMonthlyIncome] = useState<number>(8500);
    const [aiBudgets, setAiBudgets] = useState<BudgetCategory[]>([]);
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isLoadingBudgets, setIsLoadingBudgets] = useState<boolean>(false);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [incomeInputVal, setIncomeInputVal] = useState<string>('8500');
    const [selectedMonth, setSelectedMonth] = useState<string>('All Months');

    // Compute dynamic smart budgeting data for all tags in the current month
    const budgetData = useMemo(() => {
        const now = new Date();
        const currentMonthStr = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

        // Preset typical budgets for fallback
        const presetBudgets: Record<string, number> = {
            'Tax-Deductible': 1000,
            'Business Expense': 1500,
            'Personal': 800,
            'Medical': 500,
            'Travel': 1200,
            'Utilities': 400,
            'Entertainment': 250,
            'Shopping': 500,
            'Investments': 2000,
        };

        // Gather all debits
        const debits = transactions.filter(t => t.type === 'debit' && t.sendAmount > 0);

        // Group by Month-Year and Tags
        const spendingByMonthAndTag: Record<string, Record<string, number>> = {};
        const allTagsSet = new Set<string>();

        debits.forEach(t => {
            const date = t.statusTimestamps?.[TransactionStatus.SUBMITTED] ? new Date(t.statusTimestamps[TransactionStatus.SUBMITTED]) : null;
            if (!date) return;
            
            const mStr = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
            const tags = t.tags || [];
            if (tags.length === 0) return;

            if (!spendingByMonthAndTag[mStr]) {
                spendingByMonthAndTag[mStr] = {};
            }

            tags.forEach(tag => {
                allTagsSet.add(tag);
                spendingByMonthAndTag[mStr][tag] = (spendingByMonthAndTag[mStr][tag] || 0) + t.sendAmount;
            });
        });

        // Always include default tags so the widget looks stunning and filled
        ['Tax-Deductible', 'Business Expense', 'Personal', 'Utilities', 'Entertainment'].forEach(tag => allTagsSet.add(tag));

        // Format budget items
        return Array.from(allTagsSet).map(tag => {
            let sumOfPrevMonths = 0;
            let countOfPrevMonths = 0;

            Object.entries(spendingByMonthAndTag).forEach(([mStr, tagSpending]) => {
                if (mStr !== currentMonthStr) {
                    if (tagSpending[tag]) {
                        sumOfPrevMonths += tagSpending[tag];
                    }
                    countOfPrevMonths++;
                }
            });

            let typicalBudget = countOfPrevMonths > 0 ? (sumOfPrevMonths / countOfPrevMonths) : 0;
            if (typicalBudget <= 0) {
                typicalBudget = presetBudgets[tag] || 600;
            }

            const currentSpending = (spendingByMonthAndTag[currentMonthStr] && spendingByMonthAndTag[currentMonthStr][tag]) || 0;
            const percentUsed = Math.min(150, Math.round((currentSpending / typicalBudget) * 100));
            const isExceeded = currentSpending >= typicalBudget * 0.8;

            return {
                tag,
                currentSpending,
                typicalBudget,
                percentUsed,
                isExceeded
            };
        }).sort((a, b) => b.percentUsed - a.percentUsed);
    }, [transactions]);

    // Dynamically derive all available months from transactions
    const availableMonths = useMemo(() => {
        const monthsSet = new Set<string>();
        transactions.forEach(t => {
            const date = t.statusTimestamps?.[TransactionStatus.SUBMITTED] ? new Date(t.statusTimestamps[TransactionStatus.SUBMITTED]) : null;
            if (date) {
                const monthStr = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
                monthsSet.add(monthStr);
            }
        });
        return ['All Months', ...Array.from(monthsSet)];
    }, [transactions]);

    // Standard spending breakdown (using debits)
    const data = useMemo(() => {
        const debits = transactions.filter(t => {
            if (t.type !== 'debit' || t.sendAmount <= 0) return false;
            if (selectedMonth === 'All Months') return true;
            
            const date = t.statusTimestamps?.[TransactionStatus.SUBMITTED] ? new Date(t.statusTimestamps[TransactionStatus.SUBMITTED]) : null;
            if (!date) return false;
            const monthStr = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
            return monthStr === selectedMonth;
        });
        
        const categories: Record<string, number> = {
            'Entertainment': 0,
            'Utilities': 0,
            'Transfer': 0,
            'Shopping': 0,
            'Investments': 0,
            'Other': 0
        };

        debits.forEach(t => {
            const desc = (t.description || '').toLowerCase();
            const purpose = (t.purpose || '').toLowerCase();
            const cat = (t.category || '').toLowerCase();
            
            if (desc.includes('transfer') || purpose.includes('transfer') || t.transferMethod || cat.includes('transfer')) {
                categories['Transfer'] += t.sendAmount;
            } else if (desc.includes('utility') || desc.includes('utilities') || desc.includes('electric') || desc.includes('power') || desc.includes('bill') || cat.includes('utilities')) {
                categories['Utilities'] += t.sendAmount;
            } else if (desc.includes('entertainment') || desc.includes('netflix') || desc.includes('spotify') || desc.includes('movie') || desc.includes('game') || cat.includes('entertainment')) {
                categories['Entertainment'] += t.sendAmount;
            } else if (desc.includes('invest') || desc.includes('stock') || desc.includes('crypto') || cat.includes('investment') || cat.includes('investments')) {
                categories['Investments'] += t.sendAmount;
            } else if (desc.includes('amazon') || desc.includes('store') || desc.includes('shop') || desc.includes('apple') || cat.includes('shopping') || cat.includes('groceries')) {
                categories['Shopping'] += t.sendAmount;
            } else {
                categories['Other'] += t.sendAmount;
            }
        });

        const COLORS = ['#818cf8', '#34d399', '#f59e0b', '#ec4899', '#10b981', '#64748b'];

        return Object.entries(categories)
            .filter(([_, value]) => value > 0)
            .map(([name, value], index) => ({
                name,
                value,
                color: COLORS[index % COLORS.length]
            }))
            .sort((a, b) => b.value - a.value);
    }, [transactions, selectedMonth]);

    // Fetch AI Budget Suggestion
    const fetchAIBudget = async (incomeVal: number) => {
        setIsLoadingBudgets(true);
        try {
            const response = await fetch('/api/gemini/suggest-budget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactions, monthlyIncome: incomeVal })
            });
            const result = await response.json();
            if (result.budgets) {
                setAiBudgets(result.budgets);
                setAiAnalysis(result.analysis);
            }
        } catch (error) {
            console.error('[AIBudget] Failed to fetch suggestions:', error);
        } finally {
            setIsLoadingBudgets(false);
        }
    };

    // Trigger initial budget load if user switches to AI budget mode
    useEffect(() => {
        if (chartMode === 'ai-budget' && aiBudgets.length === 0) {
            fetchAIBudget(monthlyIncome);
        }
    }, [chartMode]);

    const handleIncomeChange = (e: React.FormEvent) => {
        e.preventDefault();
        const parsed = parseFloat(incomeInputVal);
        if (!isNaN(parsed) && parsed > 0) {
            setMonthlyIncome(parsed);
            fetchAIBudget(parsed);
        }
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-50  px-4 py-3 rounded-2xl border border-black/5 shadow-2xl dark:bg-slate-900">
                    <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                    <p className="text-white font-mono font-bold">{formatCurrency(payload[0].value)}</p>
                </div>
            );
        }
        return null;
    };

    // Calculate total D3 percent (should sum to 100)
    const totalD3Percent = useMemo(() => {
        return aiBudgets.reduce((acc, curr) => acc + curr.percentage, 0);
    }, [aiBudgets]);

    // Convert aiBudgets into d3-compatible data format
    const d3Data = useMemo(() => {
        return aiBudgets.map(b => ({
            name: b.category,
            value: b.percentage,
            color: b.color
        }));
    }, [aiBudgets]);

    return (
        <div id="spending-analytics-widget" className="flex flex-col h-full justify-between relative group p-5 bg-[#0c121e] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
            {/* Ambient gold glow in top right */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-start mb-4 relative z-20">
                <div>
                    <h2 className="text-sm font-black tracking-tight text-[#0F172A] dark:text-white flex items-center gap-1.5 uppercase">
                        {chartMode === 'ai-budget' ? (
                            <>
                                <BrainCircuit className="w-4 h-4 text-amber-500 animate-pulse" /> AI Budget Planner
                            </>
                        ) : chartMode === 'budget' ? (
                            <>
                                <PiggyBank className="w-4 h-4 text-rose-500" /> Smart Budgeting
                            </>
                        ) : (
                            <>
                                <BarChart3Icon className="w-4 h-4 text-primary" /> Spending Analytics
                            </>
                        )}
                    </h2>
                    <p className="text-[9px] uppercase tracking-widest font-bold text-[#0F172A] mt-0.5 font-mono">
                        {chartMode === 'ai-budget' ? 'Sovereign AI Strategy' : chartMode === 'budget' ? 'Category Threshold Watch' : 'Category Breakdown'}
                    </p>
                </div>
                <div className="flex bg-slate-50 border border-black/5 p-1 rounded-xl dark:bg-slate-900">
                    <button 
                        onClick={() => setChartMode('bar')}
                        className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${chartMode === 'bar' ? 'bg-primary text-slate-950 shadow-md' : 'text-[#0F172A] hover:text-white'}`}
                    >
                        Bar
                    </button>
                    <button 
                        onClick={() => setChartMode('pie')}
                        className={`ml-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${chartMode === 'pie' ? 'bg-primary text-slate-950 shadow-md' : 'text-[#0F172A] hover:text-white'}`}
                    >
                        Pie
                    </button>
                    <button 
                        onClick={() => setChartMode('budget')}
                        className={`ml-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1 ${chartMode === 'budget' ? 'bg-rose-500 text-slate-950 shadow-md font-extrabold' : 'text-rose-500 hover:text-rose-400/90'}`}
                    >
                        <AlertTriangle className="w-3 h-3 animate-pulse" /> Budget
                    </button>
                    <button 
                        onClick={() => setChartMode('ai-budget')}
                        className={`ml-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1 ${chartMode === 'ai-budget' ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-md' : 'text-amber-500/80 hover:text-amber-400'}`}
                    >
                        <Sparkles className="w-3 h-3" /> AI Budget
                    </button>
                </div>
            </div>

            {chartMode !== 'ai-budget' && chartMode !== 'budget' && availableMonths.length > 1 && (
                <div className="flex items-center gap-2 mb-3 relative z-20 animate-fade-in-up">
                    <span className="text-[9px] uppercase tracking-widest font-black text-[#0F172A] font-mono">Analysis Interval:</span>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-slate-100 border border-black/5 px-3 py-1.5 rounded-xl text-[10px] font-black text-[#0F172A] font-mono focus:outline-none focus:border-primary transition-all cursor-pointer"
                    >
                        {availableMonths.map(m => (
                            <option key={m} value={m} className="bg-slate-100 text-white">{m}</option>
                        ))}
                    </select>
                </div>
            )}

            {chartMode === 'budget' ? (
                /* SMART BUDGET WATCH MODULE */
                <div className="flex-1 w-full relative z-20 flex flex-col space-y-3 mt-2 text-left max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                    <p className="text-[8px] uppercase font-black text-rose-500 tracking-widest mb-1">Active Category Threshold Status</p>
                    <div className="space-y-2.5">
                        {budgetData.map((b, i) => (
                            <div key={i} className="p-3 bg-slate-100 rounded-xl border border-black/5 hover:border-black/5 transition-all">
                                <div className="flex justify-between items-center mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full ${b.isExceeded ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-emerald-400'}`} />
                                        <span className="text-[10px] font-black uppercase text-white tracking-wider">#{b.tag}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {b.isExceeded && (
                                            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-red-500 bg-red-500 px-2 py-0.5 rounded border border-red-500/20 animate-pulse">
                                                <AlertTriangle className="w-2.5 h-2.5" /> Exceeded 80%
                                            </span>
                                        )}
                                        <span className={`text-xs font-black font-mono ${b.isExceeded ? 'text-red-400' : 'text-[#0F172A]'}`}>
                                            {b.percentUsed}%
                                        </span>
                                    </div>
                                </div>

                                {/* Custom Progress Bar */}
                                <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-black/5 dark:bg-slate-900">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${b.isExceeded ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-indigo-500 via-primary to-emerald-400'}`}
                                        style={{ width: `${Math.min(100, b.percentUsed)}%` }}
                                    />
                                </div>

                                <div className="flex justify-between items-center mt-2 text-[9px] font-bold text-[#0F172A] font-mono">
                                    <span>Spent: <strong className="text-white">{formatCurrency(b.currentSpending)}</strong></span>
                                    <span>Typical: <strong>{formatCurrency(b.typicalBudget)}</strong></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : chartMode !== 'ai-budget' ? (
                <div className="flex-1 w-full min-h-[140px] relative z-20 mt-2">
                    {data.length === 0 ? (
                        <div className="w-full h-full min-h-[140px] flex items-center justify-center text-[#0F172A] text-[10px] font-bold uppercase tracking-widest border border-dashed border-black/5 rounded-2xl bg-slate-100">
                            No Debit Inflow Recorded
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            {chartMode === 'bar' ? (
                                <BarChart data={data} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700, fontFamily: 'monospace' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontFamily: 'monospace' }} tickFormatter={(val) => `$${val > 1000 ? (val/1000).toFixed(0) + 'k' : val}`} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={20}>
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            ) : (
                                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius="60%"
                                        outerRadius="80%"
                                        paddingAngle={3}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            )}
                        </ResponsiveContainer>
                    )}
                    {chartMode === 'pie' && data.length > 0 && (
                        <div className="mt-4 flex flex-wrap justify-center gap-3 relative z-20">
                            {data.map((entry, index) => (
                                <div key={index} className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg border border-black/5">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                                    <span className="text-[8px] uppercase font-bold tracking-widest text-[#0F172A] font-mono">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* AI BUDGET PLANNER MODULE with D3 Donut Chart */
                <div className="flex-1 w-full relative z-20 flex flex-col space-y-4">
                    {/* Monthly Income Form */}
                    <form onSubmit={handleIncomeChange} className="flex gap-2 items-center bg-slate-100 p-2 rounded-xl border border-black/5">
                        <div className="flex-1 flex items-center gap-1">
                            <span className="text-[10px] text-[#0F172A] font-black tracking-widest uppercase ml-1">Monthly Income:</span>
                            <span className="text-xs text-amber-500 font-bold font-mono">$</span>
                            <input 
                                type="number" 
                                value={incomeInputVal} 
                                onChange={(e) => setIncomeInputVal(e.target.value)}
                                className="w-20 bg-transparent text-xs font-black text-white font-mono focus:outline-none"
                                placeholder="8500"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isLoadingBudgets}
                            className="bg-amber-500 hover:bg-amber-600 disabled:bg-white text-slate-950 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 active:scale-95 cursor-pointer dark:bg-slate-800"
                        >
                            {isLoadingBudgets ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                                <>
                                    <RefreshCw className="w-3 h-3" /> Re-Sync
                                </>
                            )}
                        </button>
                    </form>

                    {isLoadingBudgets ? (
                        <div className="flex-1 min-h-[160px] flex flex-col items-center justify-center space-y-3">
                            <BrainCircuit className="w-8 h-8 text-amber-500 animate-pulse" />
                            <div className="text-center">
                                <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-[0.2em]">Querying Sovereign AI Concierge...</p>
                                <p className="text-[8px] font-bold text-[#0F172A] uppercase tracking-widest mt-1">Modeling personal spending vectors</p>
                            </div>
                        </div>
                    ) : aiBudgets.length === 0 ? (
                        <div className="flex-1 min-h-[160px] flex flex-col items-center justify-center space-y-3">
                            <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">No AI Suggested Strategy Loaded</p>
                            <button 
                                onClick={() => fetchAIBudget(monthlyIncome)}
                                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-black rounded-lg text-[9px] uppercase tracking-widest flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-lg shadow-amber-500/10"
                            >
                                <Sparkles className="w-3.5 h-3.5" /> Initialize AI Assessment
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col space-y-4">
                            {/* D3 Donut Chart & Legend */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                <div className="md:col-span-5 flex justify-center">
                                    <D3DonutChart 
                                        data={d3Data} 
                                        total={totalD3Percent}
                                        activeCategory={activeCategory}
                                        setActiveCategory={setActiveCategory}
                                    />
                                </div>
                                <div className="md:col-span-7 space-y-2">
                                    <p className="text-[8px] uppercase font-black text-amber-500 tracking-widest">Recommended Allocations</p>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {aiBudgets.map((b, i) => {
                                            const isActive = activeCategory === b.category;
                                            return (
                                                <div 
                                                    key={i} 
                                                    onMouseEnter={() => setActiveCategory(b.category)}
                                                    onMouseLeave={() => setActiveCategory(null)}
                                                    className={`flex flex-col p-1.5 rounded-lg border transition-all cursor-pointer ${isActive ? 'bg-slate-50 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.05)] scale-102' : 'bg-slate-100 border-black/5 hover:border-black/5'}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1 truncate max-w-[80px]">
                                                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                                                            <span className="text-[8px] font-black uppercase text-[#0F172A] truncate tracking-wider">{b.category}</span>
                                                        </div>
                                                        <span className="text-[9px] font-black text-amber-500 font-mono shrink-0">{b.percentage}%</span>
                                                    </div>
                                                    <p className="text-[8px] font-bold text-[#0F172A] font-mono mt-0.5">{formatCurrency(b.suggestedAmount)}/mo</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Active Category Justification Box */}
                            <div className="p-3 bg-slate-100 rounded-xl border border-black/5 min-h-[56px] flex flex-col justify-center transition-all duration-200 text-left">
                                {activeCategory ? (
                                    <>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: aiBudgets.find(b => b.category === activeCategory)?.color }} />
                                            <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">{activeCategory} Strategy</span>
                                        </div>
                                        <p className="text-[9px] font-bold text-[#0F172A] uppercase tracking-widest leading-relaxed mt-1 font-sans">
                                            {aiBudgets.find(b => b.category === activeCategory)?.justification}
                                        </p>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-[#0F172A]">
                                        <HelpCircle className="w-3.5 h-3.5" />
                                        <span className="text-[8px] uppercase font-black tracking-widest">Hover over segments or categories to inspect strategies</span>
                                    </div>
                                )}
                            </div>

                            {/* AI Analysis Insight text block */}
                            {aiAnalysis && (
                                <div className="p-4 bg-amber-500 rounded-2xl border border-amber-500/10 text-left">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <BrainCircuit className="w-4 h-4 text-amber-500" />
                                        <h4 className="text-[9px] font-black text-amber-400 uppercase tracking-widest">AI Audit Memo & Recommendations</h4>
                                    </div>
                                    <p className="text-[10px] font-bold text-[#0F172A] leading-relaxed uppercase tracking-wider font-sans">
                                        {aiAnalysis}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
