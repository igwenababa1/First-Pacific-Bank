import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { EXTENDED_LANGUAGES } from './constants';
import { GlobeAmericasIcon, CheckCircleIcon, SearchIcon, XIcon } from './Icons';

export const FloatingTranslator: React.FC = () => {
    const { language, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);

    // Get current language details
    const currentLang = EXTENDED_LANGUAGES.find(l => l.code === language) || EXTENDED_LANGUAGES[0];

    const filteredLanguages = EXTENDED_LANGUAGES.filter(l => 
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        l.nativeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleSelect = (code: string) => {
        setLanguage(code);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className="fixed bottom-6 left-6 z-[100] flex flex-col items-start">
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        ref={modalRef}
                        className="mb-4 bg-white dark:bg-slate-900  border border-slate-200 dark:border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-[320px] sm:w-[380px] overflow-hidden flex flex-col max-h-[60vh]"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-slate-800">
                            <div>
                                <h3 className="font-black text-[#0F172A] dark:text-white text-lg tracking-tight">Translation Engine</h3>
                                <p className="text-xs text-[#0F172A] font-mono mt-1">Real-Time Neural Translation</p>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-2 bg-slate-200 dark:bg-slate-900 hover:bg-slate-300 dark:hover:bg-slate-700 text-[#0F172A] dark:text-white rounded-full transition-colors"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-4 border-b border-slate-200 dark:border-white/10">
                            <div className="relative">
                                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0F172A]" />
                                <input 
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search languages..."
                                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-[#0F172A] dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {filteredLanguages.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleSelect(lang.code)}
                                    className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all group ${
                                        language === lang.code 
                                        ? 'bg-primary/10 border border-primary/30 shadow-inner' 
                                        : 'hover:bg-slate-100 dark:hover:bg-white border border-transparent'
                                    }`}
                                >
                                    <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm flex-shrink-0 bg-slate-200 dark:bg-slate-900 flex items-center justify-center">
                                        <img 
                                            src={`https://flagsapi.com/${lang.countryCode}/shiny/64.png`}
                                            alt={lang.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className={`font-bold text-sm ${language === lang.code ? 'text-primary' : 'text-[#0F172A] dark:text-white group-hover:text-primary transition-colors'}`}>
                                            {lang.nativeName}
                                        </p>
                                        <p className="text-xs text-[#0F172A]">
                                            {lang.name} ({lang.code.toUpperCase()})
                                        </p>
                                    </div>
                                    {language === lang.code && (
                                        <CheckCircleIcon className="w-5 h-5 text-primary flex-shrink-0" />
                                    )}
                                </button>
                            ))}
                            {filteredLanguages.length === 0 && (
                                <div className="p-8 text-center text-[#0F172A] text-sm">
                                    No languages found matching "{searchTerm}"
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Action Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 px-5 py-3.5 rounded-full shadow-2xl  border transition-all ${
                    isOpen 
                    ? 'bg-primary text-white border-primary/50 shadow-[0_0_30px_rgba(14,197,242,0.4)]' 
                    : 'bg-slate-50 dark:bg-slate-900 text-white border-white/20 hover:bg-white dark:hover:bg-white'
                }`}
            >
                <GlobeAmericasIcon className="w-6 h-6" />
                <div className="flex flex-col items-start leading-none">
                    <span className="text-[10px] font-mono text-[#0F172A] dark:text-white uppercase tracking-widest">Language</span>
                    <span className="text-sm font-bold">{currentLang.nativeName}</span>
                </div>
            </motion.button>
        </div>
    );
};
