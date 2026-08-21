
import React, { useState } from 'react';
import { SubscriptionService, AppleCardDetails, AppleCardTransaction, SpendingLimit, SpendingCategory, Transaction } from '../types.ts';
import { SubscriptionManager } from './SubscriptionManager.tsx';
import { AppleCardManager } from './AppleCardManager.tsx';
import { ConciergeShopping } from './ConciergeShopping.tsx';
import { SubscriptionCalendar } from './SubscriptionCalendar.tsx';
import { BillRemindersTab } from './BillRemindersTab.tsx';

interface ServicesDashboardProps {
    subscriptions: SubscriptionService[];
    appleCardDetails: AppleCardDetails;
    appleCardTransactions: AppleCardTransaction[];
    transactions?: Transaction[];
    onPaySubscription: (subscriptionId: string) => boolean;
    onUpdateSpendingLimits: (limits: SpendingLimit[]) => void;
    onUpdateTransactionCategory: (transactionId: string, category: SpendingCategory) => void;
    onContactSupport: () => void;
}

export const ServicesDashboard: React.FC<ServicesDashboardProps> = ({ 
    subscriptions, 
    appleCardDetails, 
    appleCardTransactions, 
    transactions,
    onPaySubscription,
    onUpdateSpendingLimits,
    onUpdateTransactionCategory,
    onContactSupport
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'reminders'>('overview');

    return (
        <div className="space-y-8 pb-20 max-w-[1600px] mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
                <div>
                    <h2 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tight">Lifestyle & Services</h2>
                    <p className="text-[#0F172A] dark:text-white mt-2 font-bold">Manage subscriptions, access the digital mall, and control vendor cards.</p>
                </div>
            </div>

            {/* Elegant Tab Headers */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-white/10 pb-4">
                <button
                    id="services-tab-overview"
                    onClick={() => setActiveTab('overview')}
                    className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                        activeTab === 'overview'
                        ? 'bg-primary text-[#0F172A] shadow-lg shadow-primary/10 scale-[1.02]'
                        : 'bg-white text-[#0F172A] hover:text-white hover:bg-white'
                    }`}
                >
                    Overview & Cards
                </button>
                <button
                    id="services-tab-reminders"
                    onClick={() => setActiveTab('reminders')}
                    className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
                        activeTab === 'reminders'
                        ? 'bg-primary text-[#0F172A] shadow-lg shadow-primary/10 scale-[1.02]'
                        : 'bg-white text-[#0F172A] hover:text-white hover:bg-white'
                    }`}
                >
                    Bill Reminders
                </button>
            </div>

            {activeTab === 'overview' ? (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start animate-fade-in">
                    {/* Left: Subscriptions */}
                    <div className="xl:col-span-3 space-y-8">
                        <SubscriptionManager subscriptions={subscriptions} onPay={onPaySubscription} onContactSupport={onContactSupport} />
                        <SubscriptionCalendar subscriptions={subscriptions} />
                    </div>

                    {/* Center: The New Lifestyle Mall */}
                    <div className="xl:col-span-6">
                         <ConciergeShopping onContactSupport={onContactSupport} />
                    </div>

                    {/* Right: Apple Card */}
                    <div className="xl:col-span-3">
                        <AppleCardManager 
                            card={appleCardDetails} 
                            transactions={appleCardTransactions}
                            onUpdateLimits={onUpdateSpendingLimits}
                            onUpdateCategory={onUpdateTransactionCategory}
                        />
                    </div>
                </div>
            ) : (
                <BillRemindersTab transactions={transactions || []} />
            )}
        </div>
    );
};

