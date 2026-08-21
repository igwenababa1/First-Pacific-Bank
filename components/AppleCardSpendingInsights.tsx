

import React, { useMemo } from 'react';
import { AppleCardTransaction, SpendingCategory, SpendingLimit } from '../types';
import { SPENDING_CATEGORIES } from './constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useCurrency } from '../contexts/CurrencyContext';

interface AppleCardSpendingInsightsProps {
    transactions: AppleCardTransaction[];
    spendingLimits: SpendingLimit[];
    onManageLimits: () => void;
}

const COLORS = ['#0052FF', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#1E40AF', '#1E3A8A'];

export const AppleCardSpendingInsights: React.FC<AppleCardSpendingInsightsProps> = ({ transactions, spendingLimits, onManageLimits }) => {
    const { formatCurrency } = useCurrency();

    const spendingByCategory = useMemo(() => {
        const spending: Record<string, number> = {};
        SPENDING_CATEGORIES.forEach(cat => spending[cat] = 0);
        
        transactions.forEach(tx => {
            if (spending[tx.category] !== undefined) {
                spending[tx.category] += tx.amount;
            }
        });
        return spending;
    }, [transactions]);

    const chartData = useMemo(() => {
        return Object.entries(spendingByCategory)
            .map(([name, value]) => ({ name, value }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [spendingByCategory]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-50 dark:bg-slate-900  border border-slate-200 dark:border-white/10 p-3 rounded-xl shadow-xl">
                    <p className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider mb-1">{payload[0].name}</p>
                    <p className="text-lg font-black text-[#0F172A] dark:text-white font-mono">{formatCurrency(payload[0].value)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="w-full lg:w-1/2 h-64 relative">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="outline-none" />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[#0F172A] dark:text-white text-sm font-bold">
                            No spending data available
                        </div>
                    )}
                    {/* Center Text Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">Total</span>
                        <span className="text-xl font-black text-[#1E293B] font-mono">
                            {formatCurrency(chartData.reduce((acc, curr) => acc + curr.value, 0))}
                        </span>
                    </div>
                </div>

                <div className="w-full lg:w-1/2 space-y-3">
                    <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-widest mb-4">Top Categories</h4>
                    {chartData.slice(0, 5).map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all dark:bg-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="text-sm font-bold text-[#0F172A]">{item.name}</span>
                            </div>
                            <span className="font-mono font-bold text-[#0F172A]">{formatCurrency(item.value)}</span>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="bg-slate-100 rounded-2xl p-6 border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h4 className="font-bold text-[#1E293B]">Budget & Limits</h4>
                        <p className="text-xs text-[#0F172A] mt-1">Monitor your spending against set thresholds.</p>
                    </div>
                    <button 
                        onClick={onManageLimits} 
                        className="px-4 py-2 bg-white text-primary text-xs font-black uppercase tracking-wider rounded-lg border border-slate-200 shadow-sm hover:bg-primary hover:text-[#0F172A] dark:text-white hover:border-primary transition-all dark:bg-slate-800"
                    >
                        Manage Limits
                    </button>
                </div>

                <div className="space-y-5">
                    {SPENDING_CATEGORIES.map(category => {
                        const spent = spendingByCategory[category] || 0;
                        const limitObj = spendingLimits.find(l => l.category === category);
                        const limit = limitObj?.limit || 0;
                        
                        // Only show categories with spending OR a set limit
                        if (spent === 0 && !limit) return null;
                        
                        const percentage = limit > 0 ? (spent / limit) * 100 : 0;
                        const isOverLimit = percentage > 100;
                        const barColor = isOverLimit ? 'bg-rose-500' : percentage > 80 ? 'bg-amber-500' : 'bg-primary';

                        return (
                            <div key={category} className="group">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-bold text-[#0F172A]">{category}</span>
                                    <div className="text-right">
                                        <span className={`font-mono font-bold ${isOverLimit ? 'text-rose-600' : 'text-[#0F172A]'}`}>
                                            {formatCurrency(spent)}
                                        </span>
                                        {limit > 0 && (
                                            <span className="text-[#0F172A] dark:text-white text-xs ml-1 font-bold">
                                                / {formatCurrency(limit)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {limit > 0 ? (
                                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`} 
                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                        ></div>
                                    </div>
                                ) : (
                                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden opacity-70">
                                        <div className="h-full bg-slate-400 rounded-full w-full opacity-20"></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};