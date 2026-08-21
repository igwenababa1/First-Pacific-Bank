
import React, { useState } from 'react';
import { Card, SpendingCategory } from '../types';
import { SPENDING_CATEGORIES } from './constants';
import { XIcon, SpinnerIcon, LockClosedIcon, GlobeAmericasIcon, ShoppingBagIcon } from './Icons';

interface AdvancedCardControlsModalProps {
    card: Card;
    onClose: () => void;
    onSave: (updatedControls: Partial<Card['controls']>) => void;
}

const ToggleSwitch: React.FC<{ 
    label: string; 
    description: string; 
    icon: React.ReactNode;
    checked: boolean; 
    onChange: (val: boolean) => void 
}> = ({ label, description, icon, checked, onChange }) => (
    <div className="flex justify-between items-center py-3">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${checked ? 'bg-primary/10 text-primary' : 'bg-slate-200 dark:bg-slate-700 text-[#0F172A]'}`}>
                {icon}
            </div>
            <div>
                <h4 className="text-sm font-semibold text-[#0F172A] dark:text-[#1E293B]">{label}</h4>
                <p className="text-xs text-[#0F172A] dark:text-white">{description}</p>
            </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 rounded-full peer shadow-inner peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md peer-checked:bg-primary"></div>
        </label>
    </div>
);

export const AdvancedCardControlsModal: React.FC<AdvancedCardControlsModalProps> = ({ card, onClose, onSave }) => {
    const [limits, setLimits] = useState({
        perTransaction: card.controls?.transactionLimits?.perTransaction ?? '',
        daily: card.controls?.transactionLimits?.daily ?? '',
    });
    const [toggles, setToggles] = useState({
        isFrozen: card.controls?.isFrozen ?? false,
        onlinePurchases: card.controls?.onlinePurchases ?? true,
        internationalTransactions: card.controls?.internationalTransactions ?? true
    });
    const [travelNotice, setTravelNotice] = useState({
        active: card.controls?.travelNotice?.active ?? false,
        countries: card.controls?.travelNotice?.countries?.join(', ') ?? '',
        fromDate: card.controls?.travelNotice?.fromDate ?? '',
        toDate: card.controls?.travelNotice?.toDate ?? ''
    });
    const [blocked, setBlocked] = useState<Set<SpendingCategory>>(new Set(card.controls?.blockedCategories ?? []));
    const [isProcessing, setIsProcessing] = useState(false);

    const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLimits(prev => ({ ...prev, [name]: value }));
    };

    const handleCategoryToggle = (category: SpendingCategory) => {
        setBlocked(prev => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            return newSet;
        });
    };

    const handleSave = () => {
        setIsProcessing(true);
        setTimeout(() => {
            const updatedControls: Partial<Card['controls']> = {
                isFrozen: toggles.isFrozen,
                onlinePurchases: toggles.onlinePurchases,
                internationalTransactions: toggles.internationalTransactions,
                transactionLimits: {
                    perTransaction: limits.perTransaction ? Number(limits.perTransaction) : null,
                    daily: limits.daily ? Number(limits.daily) : null,
                },
                blockedCategories: Array.from(blocked),
                travelNotice: {
                    active: travelNotice.active,
                    countries: travelNotice.countries.split(',').map(c => c.trim()).filter(Boolean),
                    fromDate: travelNotice.fromDate,
                    toDate: travelNotice.toDate
                }
            };
            onSave(updatedControls);
            setIsProcessing(false);
        }, 1000);
    };

    return (
        <div className="fixed inset-0 bg-slate-100  z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-lg relative border border-slate-200 dark:border-white/10 animate-fade-in-up flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Advanced Card Controls</h2>
                    <button onClick={onClose} className="p-2 text-[#0F172A] dark:text-white hover:bg-slate-200 dark:hover:bg-slate-100 dark:bg-slate-700 rounded-full">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-6">
                    
                    <div>
                        <h3 className="text-lg font-semibold text-[#0F172A] dark:text-[#1E293B] mb-3">Security & Usage</h3>
                        <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-white/10 divide-y divide-slate-200 dark:divide-white/5">
                            <ToggleSwitch 
                                label="Freeze Card" 
                                description="Temporarily disable all transactions." 
                                icon={<LockClosedIcon className="w-5 h-5" />}
                                checked={toggles.isFrozen} 
                                onChange={val => setToggles(p => ({...p, isFrozen: val}))} 
                            />
                            <ToggleSwitch 
                                label="Online Purchases" 
                                description="Allow card to be used for internet payments." 
                                icon={<ShoppingBagIcon className="w-5 h-5" />}
                                checked={toggles.onlinePurchases} 
                                onChange={val => setToggles(p => ({...p, onlinePurchases: val}))} 
                            />
                            <ToggleSwitch 
                                label="International Use" 
                                description="Allow transactions outside your home country." 
                                icon={<GlobeAmericasIcon className="w-5 h-5" />}
                                checked={toggles.internationalTransactions} 
                                onChange={val => setToggles(p => ({...p, internationalTransactions: val}))} 
                            />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-[#0F172A] dark:text-[#1E293B] mb-3">Transaction Limits</h3>
                        <div className="space-y-4 bg-slate-50 dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                            <div>
                                <label className="block text-sm font-bold text-[#0F172A] dark:text-white">Per Transaction Limit</label>
                                <input
                                    type="number"
                                    name="perTransaction"
                                    value={limits.perTransaction}
                                    onChange={handleLimitChange}
                                    placeholder="No limit"
                                    className="mt-1 w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-md shadow-inner text-[#0F172A] dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[#0F172A] dark:text-white">Daily Total Limit</label>
                                <input
                                    type="number"
                                    name="daily"
                                    value={limits.daily}
                                    onChange={handleLimitChange}
                                    placeholder="No limit"
                                    className="mt-1 w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-md shadow-inner text-[#0F172A] dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-[#0F172A] dark:text-[#1E293B] mb-3">Travel Notice</h3>
                        <div className="space-y-4 bg-slate-50 dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                            <ToggleSwitch 
                                label="Enable Travel Notice" 
                                description="Prevent card blocks while traveling." 
                                icon={<GlobeAmericasIcon className="w-5 h-5" />}
                                checked={travelNotice.active} 
                                onChange={val => setTravelNotice(p => ({...p, active: val}))} 
                            />
                            {travelNotice.active && (
                                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/10">
                                    <div>
                                        <label className="block text-sm font-bold text-[#0F172A] dark:text-white">Destinations (comma separated)</label>
                                        <input
                                            type="text"
                                            value={travelNotice.countries}
                                            onChange={e => setTravelNotice(p => ({...p, countries: e.target.value}))}
                                            placeholder="e.g., France, Italy, Japan"
                                            className="mt-1 w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-md shadow-inner text-[#0F172A] dark:text-white"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-[#0F172A] dark:text-white">From</label>
                                            <input
                                                type="date"
                                                value={travelNotice.fromDate}
                                                onChange={e => setTravelNotice(p => ({...p, fromDate: e.target.value}))}
                                                className="mt-1 w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-md shadow-inner text-[#0F172A] dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-[#0F172A] dark:text-white">To</label>
                                            <input
                                                type="date"
                                                value={travelNotice.toDate}
                                                onChange={e => setTravelNotice(p => ({...p, toDate: e.target.value}))}
                                                className="mt-1 w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-md shadow-inner text-[#0F172A] dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-[#0F172A] dark:text-[#1E293B] mb-3">Block Spending Categories</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {SPENDING_CATEGORIES.map(category => (
                                <label
                                    key={category}
                                    className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer transition-colors ${blocked.has(category) ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300' : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-100 dark:bg-slate-700'}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={blocked.has(category)}
                                        onChange={() => handleCategoryToggle(category)}
                                        className={`h-4 w-4 rounded transition-colors ${blocked.has(category) ? 'text-red-500 focus:ring-red-500' : 'text-primary focus:ring-primary'}`}
                                    />
                                    <span className="text-sm font-bold text-[#0F172A] dark:text-white">{category}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-[#0F172A] dark:text-white bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={isProcessing} className="px-4 py-2 text-sm font-bold text-[#0F172A] dark:text-white bg-primary rounded-lg flex items-center disabled:opacity-70">
                        {isProcessing && <SpinnerIcon className="w-5 h-5 mr-2" />}
                        Save Controls
                    </button>
                </div>
            </div>
        </div>
    );
};
