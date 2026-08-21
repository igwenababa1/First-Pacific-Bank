import React, { useState, useMemo, useEffect } from 'react';
import { Country } from '../types';
import { ALL_COUNTRIES } from './constants';
import { SearchIcon, XIcon } from './Icons';
import { getFlagUrl } from '../utils/flags';

interface CountrySelectorProps {
    selectedCountry: Country;
    onSelect: (country: Country) => void;
    className?: string;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({ selectedCountry, onSelect, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    const filteredCountries = useMemo(() => {
        return ALL_COUNTRIES.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    const handleSelect = (country: Country) => {
        onSelect(country);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={className}
            >
                <div className="flex items-center space-x-3">
                    <img src={getFlagUrl(selectedCountry.code)} alt={selectedCountry.name} className="w-6 rounded-sm shadow-sm" />
                    <span className="font-semibold">{selectedCountry.name}</span>
                </div>
                <span className="text-[#0F172A] dark:text-white">▼</span>
            </button>

            {isOpen && (
                <div 
                    className="fixed inset-0 bg-slate-100  z-50 flex items-center justify-center animate-fade-in"
                    onClick={() => setIsOpen(false)}
                >
                    <div 
                        className="bg-slate-100 dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg h-[80vh] flex flex-col m-4 animate-fade-in-up"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-300 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Select a Country</h3>
                            <button onClick={() => setIsOpen(false)} className="p-2 text-[#0F172A] dark:text-white hover:bg-slate-200 dark:hover:bg-slate-100 dark:bg-slate-700 rounded-full">
                                <XIcon className="w-5 h-5"/>
                            </button>
                        </div>
                        <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-300 relative">
                            <SearchIcon className="w-5 h-5 text-[#0F172A] dark:text-white absolute top-1/2 left-7 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search country name or code..."
                                className="w-full bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white p-3 pl-10 rounded-lg shadow-inner"
                                autoFocus
                            />
                        </div>
                        <ul className="flex-1 overflow-y-auto">
                            {filteredCountries.map(c => (
                                <li key={c.code}>
                                    <button
                                        onClick={() => handleSelect(c)}
                                        className="w-full flex items-center space-x-4 p-4 text-[#0F172A] dark:text-white hover:bg-slate-200 dark:hover:bg-slate-100 dark:bg-slate-700 text-left"
                                    >
                                        <img src={getFlagUrl(c.code)} alt={c.name} className="w-8 rounded-md shadow-sm" />
                                        <div>
                                            <p className="font-semibold">{c.name}</p>
                                            <p className="text-sm text-[#0F172A] dark:text-white">{c.code} &bull; {c.currency}</p>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
                @keyframes fade-in-up {
                  0% { opacity: 0; transform: translateY(20px) scale(0.95); }
                  100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
            `}</style>
        </>
    );
};