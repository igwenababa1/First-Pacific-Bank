
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Recipient } from '../types';
import { SearchIcon, XIcon, getBankIcon, PlusCircleIcon } from './Icons';
import { getFlagUrl } from '../utils/flags';

interface RecipientSelectorProps {
    recipients: Recipient[];
    onSelect: (recipient: Recipient) => void;
    onClose: () => void;
    onAddNew?: () => void;
}

export const RecipientSelector: React.FC<RecipientSelectorProps> = ({ recipients, onSelect, onClose, onAddNew }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    const filteredRecipients = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return recipients.filter(r =>
            r.fullName.toLowerCase().includes(term) ||
            (r.nickname && r.nickname.toLowerCase().includes(term)) ||
            r.bankName.toLowerCase().includes(term)
        );
    }, [searchTerm, recipients]);

    return (
        <div className="fixed inset-0 bg-slate-100  z-[110] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-fade-in-up" onClick={e => e.stopPropagation()}>
                
                <div className="p-8 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-white dark:bg-slate-800">
                    <h3 className="text-xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase">Select Recipient</h3>
                    <button onClick={onClose} className="p-2 text-[#0F172A] hover:text-[#0F172A] dark:text-white rounded-full transition-colors"><XIcon className="w-6 h-6" /></button>
                </div>
                
                <div className="p-6 border-b border-slate-100 dark:border-white/10 relative">
                    <SearchIcon className="w-5 h-5 text-[#0F172A] absolute top-1/2 left-10 -translate-y-1/2" />
                    <input
                        type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search global index..."
                        className="w-full bg-slate-100 border border-slate-200 dark:border-slate-700 text-[#0F172A] dark:text-white p-4 pl-12 rounded-2xl outline-none focus:ring-2 focus:ring-primary shadow-inner"
                        autoFocus
                    />
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-2">
                    <button
                        onClick={() => onAddNew ? onAddNew() : navigate('/recipients/add')}
                        className="w-full flex items-center gap-4 p-5 rounded-3xl bg-primary/5 hover:bg-primary/10 border border-dashed border-primary/30 transition-all text-left group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-[#0F172A] dark:text-white shadow-xl transition-transform group-hover:scale-110">
                            <PlusCircleIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-black text-primary uppercase text-xs tracking-widest">Register New Beneficiary</p>
                            <p className="text-[10px] text-[#0F172A] font-bold uppercase mt-1">Add to global settlement index</p>
                        </div>
                    </button>

                    {filteredRecipients.map(recipient => {
                        const BankLogo = getBankIcon(recipient.bankName);
                        return (
                            <button
                                key={recipient.id}
                                onClick={() => onSelect(recipient)}
                                className="w-full flex items-center gap-4 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-transparent hover:bg-white dark:bg-slate-900 hover:border-slate-200 dark:border-white/10 transition-all text-left group"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center p-1.5 shadow-lg group-hover:scale-110 transition-transform dark:bg-slate-800">
                                    <BankLogo className="w-full h-full object-contain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <p className="font-black text-[#0F172A] dark:text-white text-sm uppercase tracking-tighter truncate">{recipient.nickname || recipient.fullName}</p>
                                        <img src={getFlagUrl(recipient.country.code)} alt="" className="w-4 h-3 rounded-sm opacity-80" />
                                    </div>
                                    <p className="text-[10px] text-[#0F172A] font-bold uppercase tracking-widest mt-0.5 truncate">
                                        {recipient.bankName} • {recipient.accountNumber}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
