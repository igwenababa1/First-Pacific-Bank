
import React, { useState } from 'react';
import { SpendingLimit, SpendingCategory } from '../types';
import { SPENDING_CATEGORIES } from './constants';

interface ManageSpendingLimitsModalProps {
    currentLimits: SpendingLimit[];
    onClose: () => void;
    onSave: (newLimits: SpendingLimit[]) => void;
}

export const ManageSpendingLimitsModal: React.FC<ManageSpendingLimitsModalProps> = ({ currentLimits, onClose, onSave }) => {
    const [limits, setLimits] = useState<SpendingLimit[]>(() => {
        // Ensure all categories are present in the state
        return SPENDING_CATEGORIES.map(category => {
            const existing = currentLimits.find(l => l.category === category);
            return existing || { category, limit: 0 };
        });
    });

    const handleLimitChange = (category: SpendingCategory, value: string) => {
        const newLimit = parseInt(value, 10) || 0;
        setLimits(prevLimits => 
            prevLimits.map(l => l.category === category ? { ...l, limit: newLimit } : l)
        );
    };

    const handleSave = () => {
        // Filter out categories with a limit of 0, as they are considered "unlimited"
        onSave(limits.filter(l => l.limit > 0));
    };

    return (
        <div className="fixed inset-0 bg-slate-100 bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-slate-200 rounded-2xl shadow-digital p-8 w-full max-w-md m-4 max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold text-[#1E293B] mb-6">Manage Spending Limits</h2>
                
                <p className="text-sm text-[#0F172A] mb-4">Set monthly spending limits for different categories to help you stay on budget. Set a limit to 0 to remove it.</p>

                <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
                    {limits.map(({ category, limit }) => (
                        <div key={category}>
                            <label htmlFor={`limit-${category}`} className="block text-sm font-bold text-[#0F172A]">{category}</label>
                            <div className="mt-1 relative rounded-md shadow-digital-inset">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-[#0F172A] font-semibold">$</span>
                                </div>
                                <input
                                    type="number"
                                    id={`limit-${category}`}
                                    value={limit === 0 ? '' : limit}
                                    onChange={(e) => handleLimitChange(category, e.target.value)}
                                    className="w-full bg-transparent border-0 p-3 pl-7"
                                    placeholder="No limit"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-[#0F172A] bg-slate-200 rounded-lg shadow-digital active:shadow-digital-inset transition-shadow">
                        Cancel
                    </button>
                    <button type="button" onClick={handleSave} className="px-4 py-2 text-sm font-bold text-[#0F172A] dark:text-white bg-primary rounded-lg shadow-md hover:shadow-lg transition-shadow">
                        Save Limits
                    </button>
                </div>
            </div>
        </div>
    );
};
