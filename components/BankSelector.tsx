
import React, { useState, useMemo, useEffect } from 'react';
import { BANKS_BY_COUNTRY } from './constants';
import { getBankIcon, SearchIcon, XIcon, BrandLogo, ChevronRightIcon, BuildingOfficeIcon } from './Icons';

interface BankSelectorProps {
    countryCode: string;
    onSelect: (bankName: string) => void;
    onClose: () => void;
}

export const BankSelector: React.FC<BankSelectorProps> = ({ countryCode, onSelect, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    const banks = useMemo(() => {
        const countryBanks = BANKS_BY_COUNTRY[countryCode] || [];
        // If no banks for country, show all banks as fallback
        let all = countryBanks;
        if (all.length === 0) {
            all = Object.values(BANKS_BY_COUNTRY).flat();
        } else {
            // Add major global banks as suggestions if search is empty
            const globalBanks = (BANKS_BY_COUNTRY['US'] || []).slice(0, 3);
            all = [...countryBanks, ...globalBanks];
        }

        const uniqueBanks = Array.from(new Map(all.map(b => [b.name, b])).values());
        
        return uniqueBanks.filter(b =>
            b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.features && b.features.some(f => f.toLowerCase().includes(searchTerm.toLowerCase())))
        );
    }, [countryCode, searchTerm]);

    const handleSelect = (bankName: string) => {
        onSelect(bankName);
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-slate-100  z-[9999] flex items-center justify-center animate-fade-in p-4"
            onClick={onClose}
        >
            <div 
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden animate-fade-in-up"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex-shrink-0 p-8 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-slate-900 ">
                    <div>
                        <h3 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase">Select Institution</h3>
                        <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mt-1">Global Banking Network Access</p>
                    </div>
                    <button onClick={onClose} className="p-3 text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white hover:bg-white rounded-2xl transition-all dark:bg-slate-800">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>

                <div className="flex-shrink-0 p-8 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-white/10">
                    <div className="relative group">
                        <SearchIcon className="w-5 h-5 text-[#0F172A] absolute top-1/2 left-5 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by bank name or feature (e.g. Swift, ACH)..."
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 text-[#0F172A] dark:text-white p-5 pl-14 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder-slate-600 font-bold"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    <div className="grid grid-cols-1 gap-3">
                        {banks.length > 0 ? (
                            banks.map(bank => {
                                const FallbackIcon = getBankIcon(bank.name);
                                return (
                                    <button
                                        key={bank.name}
                                        onClick={() => handleSelect(bank.name)}
                                        className="group w-full flex items-center gap-6 p-6 text-left bg-white hover:bg-white border border-slate-100 dark:border-white/10 rounded-3xl transition-all hover:scale-[1.01] active:scale-[0.99] dark:bg-slate-800"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-white p-2 flex-shrink-0 shadow-xl overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform dark:bg-slate-800">
                                             <BrandLogo 
                                                domain={bank.domain} 
                                                name={bank.name} 
                                                fallback={FallbackIcon} 
                                                className="w-full h-full object-contain" 
                                             />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-[#0F172A] dark:text-white text-lg tracking-tight uppercase">{bank.name}</h4>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {bank.features?.map((feature, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-primary/10 border border-primary/20 rounded-md text-[9px] font-black text-primary uppercase tracking-widest">
                                                        {feature}
                                                    </span>
                                                )) || (
                                                    <span className="text-[10px] text-[#0F172A] font-bold italic">Standard Global Settlement</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity dark:bg-slate-800">
                                            <ChevronRightIcon className="w-5 h-5 text-[#0F172A] dark:text-white" />
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center border border-slate-200 dark:border-white/10 dark:bg-slate-800">
                                    <BuildingOfficeIcon className="w-10 h-10 text-[#0F172A]" />
                                </div>
                                <div>
                                    <p className="text-[#0F172A] dark:text-white font-black uppercase tracking-widest text-sm">No Institutions Found</p>
                                    <p className="text-[#0F172A] text-xs mt-2 max-w-xs">We couldn't find any matching banks in our global network for your search criteria.</p>
                                </div>
                                <button 
                                    onClick={() => setSearchTerm('')}
                                    className="px-6 py-3 bg-primary text-[#0F172A] dark:text-white text-[10px] font-black uppercase tracking-widest rounded-xl"
                                >
                                    Clear Search
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex-shrink-0 p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-white/10 text-center">
                    <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-[0.2em]">Secure Global Settlement Network • Tier 1 Liquidity Providers</p>
                </div>
            </div>
             <style>{`
                @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
                @keyframes fade-in-up {
                  0% { opacity: 0; transform: translateY(40px) scale(0.95); }
                  100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    );
};
