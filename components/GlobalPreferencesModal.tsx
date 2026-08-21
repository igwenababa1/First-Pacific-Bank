
import React, { useState, useMemo } from 'react';
import { EXTENDED_LANGUAGES, CURRENCIES_LIST } from './constants';
import { XIcon, SearchIcon, GlobeAmericasIcon, CurrencyDollarIcon, CheckCircleIcon, SunIcon } from './Icons';
import { Moon, Monitor, Check, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import { PlatformSettings } from '../types';

interface GlobalPreferencesModalProps {
    onClose: () => void;
    platformSettings?: PlatformSettings;
    onUpdatePlatformSettings?: (settings: Partial<PlatformSettings>) => void;
}

type Tab = 'theme' | 'language' | 'currency' | 'region';
type ThemeMode = 'light' | 'dark' | 'system';

export const GlobalPreferencesModal: React.FC<GlobalPreferencesModalProps> = ({ 
    onClose,
    platformSettings,
    onUpdatePlatformSettings
}) => {
    const { language, setLanguage } = useLanguage();
    const { displayCurrency, setDisplayCurrency } = useCurrency();
    const { theme, setTheme } = useTheme();
    
    const [activeTab, setActiveTab] = useState<Tab>('theme');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('US');

    // Determine currently active theme mode
    const currentThemeMode: ThemeMode = (platformSettings?.themeMode || theme || 'dark') as ThemeMode;

    const handleThemeChange = (newTheme: ThemeMode) => {
        // 1. Update React ThemeContext state (which toggles html.dark and saves fpb_theme in localStorage)
        setTheme(newTheme);

        // 2. Persist in platform settings storage
        try {
            const saved = localStorage.getItem('platform_settings');
            const parsed = saved ? JSON.parse(saved) : {};
            const updated = { ...parsed, themeMode: newTheme };
            localStorage.setItem('platform_settings', JSON.stringify(updated));
        } catch (err) {
            console.warn('[GlobalPreferencesModal] Failed to persist platform_settings:', err);
        }

        // 3. Inform parent component if callback provided
        if (onUpdatePlatformSettings) {
            onUpdatePlatformSettings({ themeMode: newTheme });
        }
    };

    const filteredLanguages = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return EXTENDED_LANGUAGES.filter(l => 
            l.name.toLowerCase().includes(term) || 
            l.nativeName.toLowerCase().includes(term) ||
            l.code.toLowerCase().includes(term)
        );
    }, [searchTerm]);

    const filteredCurrencies = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return CURRENCIES_LIST.filter(c => 
            c.code.toLowerCase().includes(term) || 
            c.name.toLowerCase().includes(term)
        );
    }, [searchTerm]);

    const handleLanguageSelect = (code: string) => {
        setLanguage(code);
    };

    const handleCurrencySelect = (code: string) => {
        setDisplayCurrency(code);
    };

    return (
        <div className="fixed inset-0 bg-black  z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                
                {/* Header */}
                <div className="flex-shrink-0 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                    <div>
                        <h2 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight flex items-center gap-2">
                            Global Preferences
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                Settings
                            </span>
                        </h2>
                        <p className="text-[#0F172A] dark:text-white text-sm mt-0.5">
                            Customize visual theme mode, language, currency, and regional formatting.
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-[#0F172A] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        aria-label="Close modal"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs & Search */}
                <div className="flex-shrink-0 bg-slate-50 dark:bg-slate-900">
                    <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar px-4 pt-2 gap-2">
                        <button 
                            onClick={() => { setActiveTab('theme'); setSearchTerm(''); }}
                            className={`py-3 px-5 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 rounded-t-xl ${
                                activeTab === 'theme' 
                                    ? 'text-primary bg-white dark:bg-slate-800 border-t-2 border-primary shadow-sm' 
                                    : 'text-[#0F172A] dark:text-white hover:text-[#1E293B] dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            <SunIcon className="w-4 h-4" /> Visual Theme
                        </button>
                        <button 
                            onClick={() => { setActiveTab('language'); setSearchTerm(''); }}
                            className={`py-3 px-5 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 rounded-t-xl ${
                                activeTab === 'language' 
                                    ? 'text-primary bg-white dark:bg-slate-800 border-t-2 border-primary shadow-sm' 
                                    : 'text-[#0F172A] dark:text-white hover:text-[#1E293B] dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            <GlobeAmericasIcon className="w-4 h-4" /> Language
                        </button>
                        <button 
                            onClick={() => { setActiveTab('currency'); setSearchTerm(''); }}
                            className={`py-3 px-5 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 rounded-t-xl ${
                                activeTab === 'currency' 
                                    ? 'text-primary bg-white dark:bg-slate-800 border-t-2 border-primary shadow-sm' 
                                    : 'text-[#0F172A] dark:text-white hover:text-[#1E293B] dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            <CurrencyDollarIcon className="w-4 h-4" /> Currency
                        </button>
                    </div>
                    
                    {(activeTab === 'language' || activeTab === 'currency') && (
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 relative bg-white dark:bg-slate-900">
                            <SearchIcon className="w-5 h-5 text-[#0F172A] absolute top-1/2 left-7 -translate-y-1/2" />
                            <input 
                                type="text" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={`Search ${activeTab}...`}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0F172A] dark:text-white p-3 pl-12 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm transition-all"
                                autoFocus
                            />
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-grow overflow-y-auto custom-scrollbar p-6 bg-slate-100 dark:bg-slate-950">
                    
                    {activeTab === 'theme' && (
                        <div className="space-y-6">
                            {/* Theme Toggle Section */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-base text-[#0F172A] dark:text-white flex items-center gap-2">
                                            Interface Appearance
                                        </h3>
                                        <p className="text-xs text-[#0F172A] dark:text-white mt-1">
                                            Select your visual appearance mode. Preference is automatically saved to your platform settings.
                                        </p>
                                    </div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        Saved Locally & In Settings
                                    </span>
                                </div>
                                
                                {/* 3-Way Theme Grid Toggle */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                                    
                                    {/* Light Mode */}
                                    <button 
                                        type="button"
                                        onClick={() => handleThemeChange('light')}
                                        className={`group relative flex flex-col items-center justify-between p-5 rounded-2xl border-2 transition-all text-left ${
                                            currentThemeMode === 'light' 
                                                ? 'bg-amber-500 border-amber-500 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/20' 
                                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700/80 hover:border-amber-400/50 hover:bg-amber-50 dark:hover:bg-slate-900'
                                        }`}
                                    >
                                        {currentThemeMode === 'light' && (
                                            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md">
                                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                            </div>
                                        )}
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-100 to-amber-50 border border-amber-200/80 flex items-center justify-center shadow-sm mb-4 group-hover:scale-105 transition-transform">
                                            <SunIcon className="w-7 h-7 text-amber-500" />
                                        </div>
                                        <div className="w-full text-center">
                                            <p className={`font-black text-sm ${currentThemeMode === 'light' ? 'text-amber-600 dark:text-amber-400' : 'text-[#1E293B] dark:text-slate-200'}`}>
                                                Light Mode
                                            </p>
                                            <p className="text-[11px] text-[#0F172A] dark:text-white mt-1">
                                                Crisp, high-contrast daylight palette
                                            </p>
                                            <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${currentThemeMode === 'light' ? 'text-amber-600 dark:text-amber-400 font-extrabold' : 'text-[#0F172A]'}`}>
                                                    {currentThemeMode === 'light' ? '● Active' : 'Select'}
                                                </span>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Dark Mode */}
                                    <button 
                                        type="button"
                                        onClick={() => handleThemeChange('dark')}
                                        className={`group relative flex flex-col items-center justify-between p-5 rounded-2xl border-2 transition-all text-left ${
                                            currentThemeMode === 'dark' 
                                                ? 'bg-indigo-500 border-indigo-500 shadow-lg shadow-indigo-500/15 ring-2 ring-indigo-500/20' 
                                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700/80 hover:border-indigo-400/50 hover:bg-indigo-50 dark:hover:bg-slate-900'
                                        }`}
                                    >
                                        {currentThemeMode === 'dark' && (
                                            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-md">
                                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                            </div>
                                        )}
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-950 border border-indigo-500/30 flex items-center justify-center shadow-sm mb-4 group-hover:scale-105 transition-transform">
                                            <Moon className="w-7 h-7 text-indigo-400" />
                                        </div>
                                        <div className="w-full text-center">
                                            <p className={`font-black text-sm ${currentThemeMode === 'dark' ? 'text-indigo-400' : 'text-[#1E293B] dark:text-slate-200'}`}>
                                                Dark Mode
                                            </p>
                                            <p className="text-[11px] text-[#0F172A] dark:text-white mt-1">
                                                Cosmic slate, eye-comfort OLED theme
                                            </p>
                                            <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${currentThemeMode === 'dark' ? 'text-indigo-400 font-extrabold' : 'text-[#0F172A]'}`}>
                                                    {currentThemeMode === 'dark' ? '● Active' : 'Select'}
                                                </span>
                                            </div>
                                        </div>
                                    </button>

                                    {/* System Mode */}
                                    <button 
                                        type="button"
                                        onClick={() => handleThemeChange('system')}
                                        className={`group relative flex flex-col items-center justify-between p-5 rounded-2xl border-2 transition-all text-left ${
                                            currentThemeMode === 'system' 
                                                ? 'bg-primary/10 border-primary shadow-lg shadow-primary/15 ring-2 ring-primary/20' 
                                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700/80 hover:border-primary/50 hover:bg-slate-100 dark:hover:bg-slate-900'
                                        }`}
                                    >
                                        {currentThemeMode === 'system' && (
                                            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                            </div>
                                        )}
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center shadow-sm mb-4 group-hover:scale-105 transition-transform">
                                            <Monitor className="w-7 h-7 text-primary" />
                                        </div>
                                        <div className="w-full text-center">
                                            <p className={`font-black text-sm ${currentThemeMode === 'system' ? 'text-primary' : 'text-[#1E293B] dark:text-slate-200'}`}>
                                                System Default
                                            </p>
                                            <p className="text-[11px] text-[#0F172A] dark:text-white mt-1">
                                                Syncs automatically with OS settings
                                            </p>
                                            <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${currentThemeMode === 'system' ? 'text-primary font-extrabold' : 'text-[#0F172A]'}`}>
                                                    {currentThemeMode === 'system' ? '● Active' : 'Select'}
                                                </span>
                                            </div>
                                        </div>
                                    </button>

                                </div>

                                {/* Active Summary Info Bar */}
                                <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Sparkles className="w-4 h-4 text-primary shrink-0" />
                                        <p className="text-xs text-[#0F172A] dark:text-[#334155]">
                                            Current Active Mode: <span className="font-bold text-[#0F172A] dark:text-white capitalize">{currentThemeMode} Theme</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[10px] font-mono text-[#0F172A] uppercase">Live Synced</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'language' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {filteredLanguages.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleLanguageSelect(lang.code)}
                                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                                        language === lang.code 
                                            ? 'bg-primary/10 border-primary shadow-sm ring-1 ring-primary/20' 
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    <img 
                                        src={`https://flagsapi.com/${lang.countryCode}/shiny/64.png`} 
                                        alt={lang.name} 
                                        className="w-10 h-10 object-contain drop-shadow-sm transition-transform group-hover:scale-105"
                                        onError={(e) => {
                                            (e.target as HTMLElement).style.display = 'none';
                                        }}
                                    />
                                    <div className="flex-1">
                                        <p className={`font-bold text-sm ${language === lang.code ? 'text-primary' : 'text-[#0F172A] dark:text-white'}`}>
                                            {lang.nativeName}
                                        </p>
                                        <p className="text-xs text-[#0F172A] dark:text-white">{lang.name}</p>
                                    </div>
                                    {language === lang.code && <CheckCircleIcon className="w-5 h-5 text-primary ml-auto shrink-0" />}
                                </button>
                            ))}
                        </div>
                    )}

                    {activeTab === 'currency' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {filteredCurrencies.map(curr => (
                                <button
                                    key={curr.countryCode}
                                    onClick={() => handleCurrencySelect(curr.code)}
                                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                                        displayCurrency === curr.code 
                                            ? 'bg-emerald-500 border-emerald-500 shadow-sm ring-1 ring-emerald-500/20' 
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    <img 
                                        src={`https://flagsapi.com/${curr.countryCode}/shiny/64.png`} 
                                        alt={curr.name} 
                                        className="w-10 h-10 object-contain drop-shadow-sm transition-transform group-hover:scale-105"
                                        onError={(e) => {
                                            (e.target as HTMLElement).style.display = 'none';
                                        }}
                                    />
                                    <div className="flex-1">
                                        <p className={`font-bold font-mono text-sm ${displayCurrency === curr.code ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#0F172A] dark:text-white'}`}>
                                            {curr.code}
                                        </p>
                                        <p className="text-xs text-[#0F172A] dark:text-white">{curr.name}</p>
                                    </div>
                                    {displayCurrency === curr.code && <CheckCircleIcon className="w-5 h-5 text-emerald-500 ml-auto shrink-0" />}
                                </button>
                            ))}
                        </div>
                    )}

                </div>
                
                {/* Footer */}
                <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                    <p className="text-xs text-[#0F172A] dark:text-white hidden sm:block">
                        Changes take effect immediately across all sessions.
                    </p>
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-xl transition-colors shadow-md ml-auto"
                    >
                        Save & Close
                    </button>
                </div>
            </div>
        </div>
    );
};

