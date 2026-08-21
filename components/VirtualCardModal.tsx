
import React, { useState, useEffect } from 'react';
import { VirtualCard, SpendingCategory } from '../types';
import { SPENDING_CATEGORIES } from './constants';
import { XIcon, ShieldCheckIcon, GlobeAmericasIcon, WifiIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon } from './Icons';

interface VirtualCardModalProps {
    card: VirtualCard;
    onClose: () => void;
    onUpdateControls: (cardId: string, updates: Partial<VirtualCard>) => void;
}

const ToggleSwitch: React.FC<{ label: string; description: string; checked: boolean; onChange: (val: boolean) => void }> = ({ label, description, checked, onChange }) => (
    <div className="flex justify-between items-center py-3">
        <div>
            <h4 className="text-sm font-semibold text-[#0F172A] dark:text-[#1E293B]">{label}</h4>
            <p className="text-xs text-[#0F172A] dark:text-white">{description}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 rounded-full peer shadow-inner peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md peer-checked:bg-primary"></div>
        </label>
    </div>
);

export const VirtualCardModal: React.FC<VirtualCardModalProps> = ({ card, onClose, onUpdateControls }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [controls, setControls] = useState(card.controls);

    useEffect(() => {
        setControls(card.controls);
    }, [card]);

    const handleSave = () => {
        onUpdateControls(card.id, { controls });
        onClose();
    };
    
    const handleCategoryToggle = (category: SpendingCategory) => {
        setControls(prev => {
            const currentBlocked = new Set(prev.blockedCategories || []);
            if (currentBlocked.has(category)) {
                currentBlocked.delete(category);
            } else {
                currentBlocked.add(category);
            }
            return { ...prev, blockedCategories: Array.from(currentBlocked) };
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-100  z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden border border-slate-200 dark:border-white/10 animate-fade-in-up flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-900 flex-shrink-0">
                    <h3 className="font-bold text-lg text-[#0F172A] dark:text-white">{card.nickname}</h3>
                    <button onClick={onClose} className="p-2 text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:hover:text-[#0F172A] dark:text-[#1E293B] rounded-full hover:bg-slate-200 dark:hover:bg-white transition-colors dark:bg-slate-800">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 flex-grow overflow-y-auto">
                    <div className="mb-8 relative group perspective-1000">
                        <div className={`w-full h-48 rounded-xl p-6 shadow-xl relative overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(99,102,241,0.35)] ${controls.isFrozen ? 'grayscale opacity-80' : ''} bg-gradient-to-br from-indigo-600 primary-`}>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                            <div className="relative z-10 flex flex-col h-full justify-between text-[#0F172A] dark:text-white">
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-80">Virtual</span>
                                    <WifiIcon className="w-6 h-6 rotate-90 opacity-80" />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-mono text-xl tracking-widest drop-shadow-md">
                                            {showDetails ? card.fullNumber : `•••• •••• •••• ${card.lastFour}`}
                                        </p>
                                        <button onClick={() => setShowDetails(!showDetails)} className="text-[#0F172A] dark:text-white/70 hover:text-[#0F172A] dark:text-white">
                                            {showDetails ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <div className="flex justify-between text-xs font-mono opacity-90 items-center">
                                        <span>EXP: {card.expiryDate}</span>
                                        <div className="flex items-center gap-2">
                                            <span>CVC: {showDetails ? card.cvc : '•••'}</span>
                                            {showDetails && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const newCvc = Math.floor(100 + Math.random() * 900).toString();
                                                        onUpdateControls(card.id, { cvc: newCvc });
                                                    }}
                                                    className="px-2 py-0.5 bg-white hover:bg-white rounded text-[10px] font-sans uppercase tracking-wider transition-colors dark:bg-slate-800"
                                                >
                                                    Regenerate
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {controls.isFrozen && (
                                <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900 [2px] flex items-center justify-center">
                                    <div className="bg-white px-4 py-1 rounded-full border border-slate-300 dark:border-black/10  flex items-center gap-2 dark:bg-slate-800">
                                        <LockClosedIcon className="w-4 h-4 text-[#0F172A] dark:text-white" />
                                        <span className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider">Card Frozen</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h4 className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider mb-3">Security Controls</h4>
                            <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 border border-slate-100 dark:border-white/10">
                                <ToggleSwitch label="Freeze Card" description="Temporarily disable all transactions." checked={controls.isFrozen} onChange={(val) => setControls(p => ({...p, isFrozen: val}))} />
                                <div className="h-px bg-slate-200 dark:bg-slate-900 my-1"></div>
                                <ToggleSwitch label="Online Purchases" description="Allow card for online payments." checked={controls.onlinePurchases} onChange={(val) => setControls(p => ({...p, onlinePurchases: val}))} />
                                <div className="h-px bg-slate-200 dark:bg-slate-900 my-1"></div>
                                <ToggleSwitch label="International Use" description="Allow transactions outside your country." checked={controls.internationalTransactions} onChange={(val) => setControls(p => ({...p, internationalTransactions: val}))} />
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider mb-3">Blocked Categories</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {SPENDING_CATEGORIES.map(category => {
                                    const isBlocked = controls.blockedCategories?.includes(category);
                                    return (
                                        <label key={category} className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors ${isBlocked ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-100 dark:bg-slate-700'}`}>
                                            <input type="checkbox" checked={isBlocked} onChange={() => handleCategoryToggle(category)} className={`h-4 w-4 rounded transition-colors ${isBlocked ? 'text-red-500 focus:ring-red-500' : 'text-primary focus:ring-primary'}`} />
                                            <span className="text-sm font-bold text-[#0F172A] dark:text-white">{category}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-900 flex-shrink-0 flex justify-end">
                    <button onClick={handleSave} className="px-6 py-2 bg-primary text-[#0F172A] dark:text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg transition-all">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
