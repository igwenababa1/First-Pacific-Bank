import React, { useState, useMemo, useEffect } from 'react';
import { SearchIcon, XIcon, CheckCircleIcon } from './Icons';
import { getFlagUrl } from '../utils/flags';
import { useLanguage } from '../contexts/LanguageContext';

export const LANGUAGES_LIST = [
    { code: 'en', name: 'English', countryCode: 'US' },
    { code: 'es', name: 'Español', countryCode: 'ES' },
    { code: 'fr', name: 'Français', countryCode: 'FR' },
    { code: 'de', name: 'Deutsch', countryCode: 'DE' },
    { code: 'it', name: 'Italiano', countryCode: 'IT' },
    { code: 'pt', name: 'Português', countryCode: 'PT' },
    { code: 'ru', name: 'Русский', countryCode: 'RU' },
    { code: 'zh-CN', name: '简体中文', countryCode: 'CN' },
    { code: 'ja', name: '日本語', countryCode: 'JP' },
    { code: 'ar', name: 'العربية', countryCode: 'SA' },
    { code: 'hi', name: 'हिन्दी', countryCode: 'IN' }
];

interface LanguageSelectorProps {
    className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { language, setLanguage } = useLanguage();

    const selectedLanguageInfo = useMemo(() => {
        return LANGUAGES_LIST.find(l => l.code === language) || LANGUAGES_LIST[0];
    }, [language]);

    // Lock body scroll when modal is open
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

    const filteredLanguages = useMemo(() => {
        return LANGUAGES_LIST.filter(l =>
            l.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    const handleSelect = (langCode: string) => {
        setLanguage(langCode);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <>
            <button
                id="language-selector-btn"
                type="button"
                onClick={() => setIsOpen(true)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-full transition-all duration-200 hover:bg-white ${className}`}
                aria-label="Change Language"
                title="Change Language"
            >
                {selectedLanguageInfo ? (
                    <>
                        <img
                            src={getFlagUrl(selectedLanguageInfo.countryCode)}
                            alt={`${selectedLanguageInfo.name} flag`}
                            className="w-5 h-5 rounded-full object-cover shadow-sm border border-black/5"
                        />
                        <span className="font-bold text-xs tracking-wider text-[#0F172A] dark:text-[#1E293B] uppercase">{selectedLanguageInfo.code}</span>
                        <span className="text-[10px] text-[#0F172A] dark:text-white opacity-70">▼</span>
                    </>
                ) : (
                    <span className="text-xs font-bold uppercase">{language}</span>
                )}
            </button>

            {isOpen && (
                 <div 
                    id="language-selector-modal"
                    className="fixed inset-0 bg-slate-100  z-[100] flex items-center justify-center animate-fade-in p-4"
                    onClick={() => setIsOpen(false)}
                >
                    <div 
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md h-[80vh] flex flex-col animate-fade-in-up overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
                            <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Select Language</h3>
                            <button onClick={() => setIsOpen(false)} className="p-2 text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white hover:bg-white rounded-full transition-colors dark:bg-slate-800">
                                <XIcon className="w-5 h-5"/>
                            </button>
                        </div>
                         <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-white/10 relative bg-white dark:bg-slate-900">
                            <SearchIcon className="w-5 h-5 text-[#0F172A] absolute top-1/2 left-7 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search language (e.g. Spanish, French)..."
                                className="w-full bg-slate-100 text-[#0F172A] dark:text-white p-3 pl-10 rounded-xl shadow-inner border border-slate-100 dark:border-white/10 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                autoFocus
                            />
                        </div>
                        <ul className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {filteredLanguages.map(l => {
                                const isSelected = language === l.code;
                                return (
                                    <li key={l.code}>
                                        <button
                                            onClick={() => handleSelect(l.code)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${isSelected ? 'bg-primary/20 border border-primary/50' : 'hover:bg-white border border-transparent'}`}
                                        >
                                            <div className="flex items-center space-x-4">
                                                <img src={getFlagUrl(l.countryCode)} alt={l.name} className="w-8 h-8 rounded-full shadow-md object-cover group-hover:scale-110 transition-transform" />
                                                <div className="text-left">
                                                    <p className={`font-bold ${isSelected ? 'text-primary-300' : 'text-[#0F172A] dark:text-[#1E293B]'}`}>{l.name}</p>
                                                    <p className="text-xs text-[#0F172A] dark:text-white font-mono uppercase">{l.code}</p>
                                                </div>
                                            </div>
                                            {isSelected && <CheckCircleIcon className="w-5 h-5 text-primary" />}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            )}
        </>
    );
};
