
import React, { useState } from 'react';
import { AppleCardDetails, AppleCardTransaction, SpendingLimit, SpendingCategory } from '../types';
import { SPENDING_CATEGORIES } from './constants';
import { AppleIcon, UberIcon, StarbucksIcon, ShoppingBagIcon, PencilIcon } from './Icons';
import { AppleCardSpendingInsights } from './AppleCardSpendingInsights';
import { ManageSpendingLimitsModal } from './ManageSpendingLimitsModal';

interface AppleCardManagerProps {
    card: AppleCardDetails;
    transactions: AppleCardTransaction[];
    onUpdateLimits: (limits: SpendingLimit[]) => void;
    onUpdateCategory: (transactionId: string, category: SpendingCategory) => void;
}

const VendorIcon: React.FC<{ vendor: string, className?: string }> = ({ vendor, className }) => {
    const lowerVendor = vendor.toLowerCase();
    if (lowerVendor.includes('apple')) return <AppleIcon className={className} />;
    if (lowerVendor.includes('uber')) return <UberIcon className={className} />;
    if (lowerVendor.includes('starbucks')) return <StarbucksIcon className={className} />;
    return <ShoppingBagIcon className={className} />;
};

const TransactionRow: React.FC<{ tx: AppleCardTransaction; onUpdateCategory: (id: string, category: SpendingCategory) => void }> = ({ tx, onUpdateCategory }) => {
    const [isEditingCategory, setIsEditingCategory] = useState(false);

    return (
        <div className="flex items-center justify-between p-3 bg-slate-200 rounded-lg shadow-digital-inset">
            <div className="flex items-center space-x-3">
                <div className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-200 shadow-digital text-[#0F172A]">
                    <VendorIcon vendor={tx.vendor} className="w-5 h-5"/>
                </div>
                <div>
                    <p className="font-semibold text-sm text-[#1E293B]">{tx.vendor}</p>
                    {isEditingCategory ? (
                        <select
                            value={tx.category}
                            onChange={(e) => {
                                onUpdateCategory(tx.id, e.target.value as SpendingCategory);
                                setIsEditingCategory(false);
                            }}
                            onBlur={() => setIsEditingCategory(false)}
                            className="text-xs bg-slate-200 p-1 rounded-md shadow-inner"
                            autoFocus
                        >
                            {SPENDING_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    ) : (
                         <button onClick={() => setIsEditingCategory(true)} className="flex items-center space-x-1 text-xs text-[#0F172A] hover:text-primary">
                            <span>{tx.category}</span>
                            <PencilIcon className="w-3 h-3"/>
                        </button>
                    )}
                </div>
            </div>
            <p className="font-mono text-sm font-semibold text-[#1E293B]">
                -{tx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </p>
        </div>
    );
};

export const AppleCardManager: React.FC<AppleCardManagerProps> = ({ card, transactions, onUpdateLimits, onUpdateCategory }) => {
    const balancePercentage = (card.balance / card.creditLimit) * 100;
    const [view, setView] = useState<'insights' | 'transactions'>('insights');
    const [isManageLimitsModalOpen, setIsManageLimitsModalOpen] = useState(false);

    return (
        <>
            <div className="bg-slate-200 rounded-2xl shadow-digital p-6 space-y-6">
                <h3 className="text-xl font-bold text-[#1E293B]">Apple Card Spending Insights</h3>

                {/* Card Visual */}
                <div className="relative w-full p-6 rounded-2xl text-black shadow-lg bg-gradient-to-br from-gray-200 to-white overflow-hidden transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(255,255,255,0.45),0_20px_35px_rgba(0,0,0,0.25)] cursor-pointer">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-xl dark:bg-slate-800"></div>
                    <div className="flex justify-between items-start mb-12">
                        <AppleIcon className="w-8 h-8"/>
                        <p className="font-semibold text-lg">Titanium Card</p>
                    </div>
                    <p className="font-mono text-2xl tracking-widest">•••• •••• •••• {card.lastFour}</p>
                    <p className="mt-2 text-sm font-bold">Eleanor Vance</p>
                </div>

                {/* Financial Summary */}
                <div>
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-sm font-bold text-[#0F172A]">Current Balance</span>
                        <span className="text-2xl font-bold text-[#1E293B] font-mono">
                            {card.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 shadow-digital-inset">
                        <div className="primary- h-2.5 rounded-full" style={{ width: `${balancePercentage}%` }}></div>
                    </div>
                     <div className="flex justify-between items-end text-xs text-[#0F172A] mt-1">
                        <span>Available: {card.availableCredit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                        <span>Limit: {card.creditLimit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                    </div>
                </div>
                
                 {/* Tabs */}
                <div className="flex border-b border-slate-300">
                    <button onClick={() => setView('insights')} className={`px-4 py-2 text-sm font-semibold transition-colors ${view === 'insights' ? 'text-primary border-b-2 border-primary' : 'text-[#0F172A]'}`}>
                        Spending Insights
                    </button>
                    <button onClick={() => setView('transactions')} className={`px-4 py-2 text-sm font-semibold transition-colors ${view === 'transactions' ? 'text-primary border-b-2 border-primary' : 'text-[#0F172A]'}`}>
                        Recent Transactions
                    </button>
                </div>

                {/* Tab Content */}
                {view === 'insights' && (
                    <AppleCardSpendingInsights 
                        transactions={transactions} 
                        spendingLimits={card.spendingLimits}
                        onManageLimits={() => setIsManageLimitsModalOpen(true)} 
                    />
                )}
                {view === 'transactions' && (
                    <div className="space-y-2">
                        {transactions.map(tx => (
                            <TransactionRow key={tx.id} tx={tx} onUpdateCategory={onUpdateCategory} />
                        ))}
                    </div>
                )}
            </div>
            {isManageLimitsModalOpen && (
                <ManageSpendingLimitsModal 
                    currentLimits={card.spendingLimits}
                    onClose={() => setIsManageLimitsModalOpen(false)}
                    onSave={(newLims) => {
                        onUpdateLimits(newLims);
                        setIsManageLimitsModalOpen(false);
                    }}
                />
            )}
        </>
    );
};
