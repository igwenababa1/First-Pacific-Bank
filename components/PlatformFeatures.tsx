
import React, { useState, useEffect } from 'react';
import { PlatformSettings, PlatformTheme } from '../types';
import { triggerHaptic, triggerSuccessHaptic, triggerFailureHaptic, triggerSafetyGuardHaptic } from '../utils/haptics';
import { authenticateWithBiometrics, checkBiometricHardwareAvailability, BiometricCheckResult } from '../utils/biometrics';
import { 
    SendIcon, ActivityIcon, CreditCardIcon, SpinnerIcon, 
    PremiumReservedBankLogo, EyeSlashIcon, ZapIcon, 
    LayersIcon, CodeBracketIcon, CheckCircleIcon,
    LockClosedIcon,
    ShieldCheckIcon,
    BellIcon
} from './Icons';

interface PlatformFeaturesProps {
    settings: PlatformSettings;
    onUpdateSettings: (newSettings: Partial<PlatformSettings>) => void;
    accounts?: any[];
}

const ThemeSwatch: React.FC<{ theme: PlatformTheme; color: string; currentTheme: PlatformTheme; onClick: (theme: PlatformTheme) => void }> = ({ theme, color, currentTheme, onClick }) => (
    <button
        onClick={() => onClick(theme)}
        className={`w-12 h-12 rounded-full transition-all duration-200 ${color} ${currentTheme === theme ? 'ring-2 ring-offset-2 ring-offset-slate-200 dark:ring-offset-slate-800 ring-slate-800 dark:ring-slate-200 shadow-xl scale-110' : 'hover:scale-105'}`}
        aria-label={`Set theme to ${theme}`}
    />
);

const AppIconOption: React.FC<{ 
    id: string; 
    name: string; 
    bgClass: string; 
    iconClass: string; 
    selected: boolean; 
    onSelect: (id: string) => void;
}> = ({ id, name, bgClass, iconClass, selected, onSelect }) => (
    <button 
        onClick={() => onSelect(id)}
        className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${selected ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10' : 'bg-slate-100 dark:bg-slate-900 border-transparent hover:bg-white dark:hover:bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-200 dark:border-white/10'}`}
    >
        <div className={`w-16 h-16 rounded-2xl shadow-2xl flex items-center justify-center ${bgClass}`}>
            <PremiumReservedBankLogo className={`w-10 h-10 ${iconClass}`} />
        </div>
        <div className="text-center">
            <p className={`text-xs font-bold uppercase tracking-wider ${selected ? 'text-primary' : 'text-[#0F172A]'}`}>{name}</p>
            {selected && <div className="w-1.5 h-1.5 bg-primary rounded-full mx-auto mt-2"></div>}
        </div>
    </button>
);

const WidgetPreview: React.FC = () => (
    <div className="bg-gradient-to-br from-slate-900 to-black p-5 rounded-[2rem] w-40 shadow-2xl border border-slate-200 dark:border-white/10 relative overflow-hidden group hover:scale-105 transition-transform duration-500 cursor-default">
        <div className="absolute top-0 right-0 p-3 opacity-20"><PremiumReservedBankLogo className="w-12 h-12 text-[#0F172A] dark:text-white"/></div>
        <p className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest mb-2">Total Wealth</p>
        <p className="text-xl font-black text-[#0F172A] dark:text-white font-mono tracking-tighter mb-1">$1.2M</p>
        <div className="flex items-center gap-1 text-[8px] font-bold text-emerald-400 bg-emerald-500 w-fit px-2 py-0.5 rounded-full">
            <span>▲ +2.4%</span>
        </div>
        <div className="mt-4 flex gap-2">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-100 dark:border-white/10 dark:bg-slate-800"><SendIcon className="w-4 h-4 text-[#0F172A] dark:text-white"/></div>
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-100 dark:border-white/10 dark:bg-slate-800"><ActivityIcon className="w-4 h-4 text-[#0F172A] dark:text-white"/></div>
        </div>
    </div>
);

const ThemeCustomizationPreviewPane: React.FC<{
    settings: PlatformSettings;
    onUpdateSettings: (newSettings: Partial<PlatformSettings>) => void;
}> = ({ settings, onUpdateSettings }) => {
    const activeColor = settings.customPrimaryColor || '#546d8e';
    const isDark = settings.themeMode === 'dark';

    return (
        <div className="bg-slate-50 border border-black/5 rounded-[2.5rem] p-6 shadow-2xl space-y-6 dark:bg-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-4">
                <div className="flex items-center gap-3">
                    <div 
                        className="w-5 h-5 rounded-full shadow-lg border border-white/20 animate-pulse shrink-0" 
                        style={{ backgroundColor: activeColor }}
                    />
                    <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">
                            Interactive Workspace Theme Live Preview
                        </h4>
                        <p className="text-[11px] text-[#0F172A]">
                            Real-time preview of your active hex primary color (<span className="font-mono text-emerald-400 font-bold">{activeColor}</span>) and theme mode (<span className="font-mono text-amber-400 font-bold">{isDark ? 'Dark Mode' : 'Light Mode'}</span>) before committing.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-black/5 shrink-0">
                    <button
                        onClick={() => {
                            triggerHaptic(20, 30);
                            onUpdateSettings({ themeMode: 'light' });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                            !isDark ? 'bg-white text-slate-950 shadow-md scale-105' : 'text-[#0F172A] hover:text-white'
                        }`}
                    >
                        Light Mode
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic(20, 30);
                            onUpdateSettings({ themeMode: 'dark' });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                            isDark ? 'bg-emerald-500 text-slate-950 shadow-md scale-105' : 'text-[#0F172A] hover:text-white'
                        }`}
                    >
                        Dark Mode
                    </button>
                </div>
            </div>

            {/* Simulated Workspace Interface Canvas */}
            <div 
                className={`rounded-2xl p-5 border transition-all duration-300 shadow-2xl ${
                    isDark ? 'bg-slate-100 text-white border-black/5' : 'bg-slate-50 text-[#0F172A] border-slate-300'
                }`}
            >
                {/* Mini Top Bar */}
                <div className="flex items-center justify-between border-b pb-3 mb-4 border-current/10">
                    <div className="flex items-center gap-2">
                        <div 
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-md"
                            style={{ backgroundColor: activeColor }}
                        >
                            FP
                        </div>
                        <span className="text-xs font-black uppercase tracking-tight">First Pacific Banking Enclave</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span 
                            className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider text-white shadow-sm"
                            style={{ backgroundColor: activeColor }}
                        >
                            Primary Accent
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                            isDark ? 'bg-white text-[#0F172A]' : 'bg-slate-200 text-[#0F172A]'
                        }`}>
                            {isDark ? 'Dark Theme' : 'Light Theme'}
                        </span>
                    </div>
                </div>

                {/* Simulated Balance & Action Buttons Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    {/* Account Balance Widget */}
                    <div 
                        className={`sm:col-span-2 p-4 rounded-xl border relative overflow-hidden transition-all ${
                            isDark ? 'bg-slate-50 border-black/5' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                    >
                        <div 
                            className="absolute top-0 right-0 w-28 h-28 rounded-full blur-2xl opacity-25 pointer-events-none"
                            style={{ backgroundColor: activeColor }}
                        />
                        <span className={`text-[9px] font-black uppercase tracking-widest block mb-1 ${
                            isDark ? 'text-[#0F172A]' : 'text-[#0F172A]'
                        }`}>
                            Institutional Liquidity Reserve
                        </span>
                        <div className="text-2xl font-black font-mono tracking-tight mb-2">
                            $1,482,920.50 <span className="text-xs font-sans font-bold text-emerald-500">USD</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                            <span 
                                className="px-2 py-0.5 rounded-md font-bold text-white shadow-sm"
                                style={{ backgroundColor: activeColor }}
                            >
                                Active Account #9821-FPB
                            </span>
                            <span className="text-emerald-500 font-bold">▲ +4.8% APY Yield</span>
                        </div>
                    </div>

                    {/* Quick Action Preview Card */}
                    <div 
                        className={`p-4 rounded-xl border flex flex-col justify-between ${
                            isDark ? 'bg-slate-50 border-black/5' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                    >
                        <span className={`text-[9px] font-black uppercase tracking-widest ${
                            isDark ? 'text-[#0F172A]' : 'text-[#0F172A]'
                        }`}>
                            Quick Actions
                        </span>
                        <button 
                            className="w-full py-2 px-3 rounded-lg text-white font-black text-xs uppercase tracking-wider shadow-md transition-transform active:scale-95 text-center mt-2"
                            style={{ backgroundColor: activeColor }}
                        >
                            Send Wire Transfer
                        </button>
                        <button 
                            className={`w-full py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider border mt-1.5 transition-all ${
                                isDark ? 'border-black/5 hover:bg-white text-[#0F172A]' : 'border-slate-300 hover:bg-slate-100 text-[#0F172A]'
                            }`}
                        >
                            Request Clearance
                        </button>
                    </div>
                </div>

                {/* Simulated Transaction Activity Row */}
                <div 
                    className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
                        isDark ? 'bg-slate-50 border-black/5' : 'bg-white border-slate-200 shadow-xs'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div 
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: activeColor }}
                        />
                        <div>
                            <div className="font-sans font-bold text-xs">SWIFT Treasury Transfer</div>
                            <div className={`text-[10px] ${isDark ? 'text-[#0F172A]' : 'text-[#0F172A]'}`}>Ref: TXN-FPB-2026-8819</div>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="font-bold text-emerald-500">+$250,000.00 USD</div>
                        <span 
                            className="inline-block px-2 py-0.5 rounded text-[9px] font-sans font-black uppercase text-white shadow-xs"
                            style={{ backgroundColor: activeColor }}
                        >
                            VERIFIED & CLEARED
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const PlatformFeatures: React.FC<PlatformFeaturesProps> = ({ settings, onUpdateSettings, accounts }) => {
    const [selectedIcon, setSelectedIcon] = useState('obsidian');
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [isGeneratingKey, setIsGeneratingKey] = useState(false);

    // Biometrics State
    const [biometricInfo, setBiometricInfo] = useState<BiometricCheckResult | null>(null);
    const [isAuthenticatingBiometric, setIsAuthenticatingBiometric] = useState(false);
    const [biometricFeedback, setBiometricFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

    useEffect(() => {
        checkBiometricHardwareAvailability().then(res => {
            setBiometricInfo(res);
            if (!settings.biometricType) {
                onUpdateSettings({ 
                    biometricType: res.biometricType, 
                    biometricHardwareAvailable: res.isAvailable 
                });
            }
        });
    }, []);

    const handleToggleBiometrics = async (enabled: boolean) => {
        if (enabled) {
            setIsAuthenticatingBiometric(true);
            setBiometricFeedback({ type: 'info', message: 'Initiating Capacitor Biometric plugin sensor...' });
            const result = await authenticateWithBiometrics(
                'Enroll device fingerprint / Face ID for First Pacific Sovereign Vault',
                settings.hapticsIntensity ?? 80
            );
            setIsAuthenticatingBiometric(false);

            if (result.success) {
                onUpdateSettings({ biometricsEnabled: true });
                setBiometricFeedback({
                    type: 'success',
                    message: `Biometric Lock Enrolled! Authenticated via ${result.methodUsed}`
                });
            } else {
                setBiometricFeedback({
                    type: 'error',
                    message: result.error || 'Biometric enrollment failed or cancelled.'
                });
            }
        } else {
            onUpdateSettings({ biometricsEnabled: false });
            setBiometricFeedback({
                type: 'info',
                message: 'Biometric security disabled. Master password lock active.'
            });
            triggerHaptic(20, settings.hapticsIntensity ?? 80);
        }
    };

    const handleTestBiometricScan = async () => {
        setIsAuthenticatingBiometric(true);
        setBiometricFeedback({ type: 'info', message: 'Scanning device biometrics...' });
        const result = await authenticateWithBiometrics(
            'Test real-time biometric clearance with Capacitor hardware plugin',
            settings.hapticsIntensity ?? 80
        );
        setIsAuthenticatingBiometric(false);

        if (result.success) {
            setBiometricFeedback({
                type: 'success',
                message: `Hardware Verification Verified! Method: ${result.methodUsed}`
            });
        } else {
            setBiometricFeedback({
                type: 'error',
                message: result.error || 'Biometric scan declined.'
            });
        }
    };

    const handleThemeModeChange = (enabled: boolean) => {
        onUpdateSettings({ themeMode: enabled ? 'dark' : 'light' });
    };

    const generateApiKey = () => {
        setIsGeneratingKey(true);
        setTimeout(() => {
            setApiKey(`prb_live_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`);
            setIsGeneratingKey(false);
        }, 1500);
    };

    // Dynamically update Favicon
    const handleIconSelect = (id: string) => {
        setSelectedIcon(id);
        const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) return;

        // Data URIs for icons (Simplified SVG representations for demo)
        const svgs: Record<string, string> = {
            obsidian: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="20" fill="#0f172a"/><path d="M50 10L90 30V70L50 90L10 70V30L50 10Z" stroke="white" stroke-width="4" fill="none"/></svg>`,
            gold: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fcd34d"/><stop offset="1" stop-color="#d97706"/></linearGradient></defs><rect width="100" height="100" rx="20" fill="url(#g)"/><path d="M50 10L90 30V70L50 90L10 70V30L50 10Z" stroke="white" stroke-width="4" fill="none" opacity="0.8"/></svg>`,
            stealth: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="20" fill="#e2e8f0"/><path d="M50 10L90 30V70L50 90L10 70V30L50 10Z" stroke="#94a3b8" stroke-width="4" fill="none"/></svg>`,
            neon: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="20" fill="black"/><path d="M50 10L90 30V70L50 90L10 70V30L50 10Z" stroke="#0ec5f2" stroke-width="4" fill="none"/></svg>`
        };

        const svg = svgs[id] || svgs.obsidian;
        link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    };

    return (
        <div className="space-y-10 max-w-5xl mx-auto pb-20 animate-fade-in-up">
            <div>
                <h2 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tight">Workstation Configuration</h2>
                <p className="text-sm text-[#0F172A] dark:text-white mt-2 font-bold">Customize your institutional interface and device integration protocols.</p>
            </div>

            {/* Visual Identity & Icons */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                <div className="p-8 border-b border-slate-100 dark:border-white/10">
                    <h3 className="text-xl font-bold text-[#0F172A] dark:text-white flex items-center gap-3">
                        <LayersIcon className="w-6 h-6 text-primary" />
                        App Icon Studio
                    </h3>
                </div>
                <div className="p-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <AppIconOption id="obsidian" name="Obsidian" bgClass="bg-slate-100" iconClass="text-[#0F172A] dark:text-white" selected={selectedIcon === 'obsidian'} onSelect={handleIconSelect} />
                        <AppIconOption id="gold" name="Bullion" bgClass="bg-gradient-to-br from-yellow-300 to-yellow-600" iconClass="text-[#0F172A] dark:text-white mix-blend-overlay" selected={selectedIcon === 'gold'} onSelect={handleIconSelect} />
                        <AppIconOption id="stealth" name="Stealth" bgClass="bg-slate-200" iconClass="text-[#0F172A] dark:text-white" selected={selectedIcon === 'stealth'} onSelect={handleIconSelect} />
                        <AppIconOption id="neon" name="Cyber" bgClass="bg-slate-100 border border-primary/50 shadow-[0_0_20px_rgba(14,197,242,0.4)]" iconClass="text-primary" selected={selectedIcon === 'neon'} onSelect={handleIconSelect} />
                    </div>
                </div>
            </div>

            {/* Theme Color Picker / Core Brand Color Studio */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                <div className="p-8 border-b border-slate-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-[#0F172A] dark:text-white flex items-center gap-3">
                            <LayersIcon className="w-6 h-6 text-primary" />
                            Core Brand Color Studio
                        </h3>
                        <p className="text-xs text-[#0F172A] mt-1 uppercase tracking-wider font-mono">Calibrate the dashboard primary color palette in real-time</p>
                    </div>
                    {settings.customPrimaryColor && (
                        <button
                            onClick={() => {
                                triggerHaptic(20, 40);
                                onUpdateSettings({ customPrimaryColor: undefined });
                            }}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-700 text-[#0F172A] dark:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                        >
                            Reset to Default
                        </button>
                    )}
                </div>
                <div className="p-8 space-y-8">
                    <div>
                        <h4 className="font-bold text-[#0F172A] dark:text-[#1E293B] text-sm mb-4">Institutional Preset Accents</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                            {[
                                { name: 'Classic Slate', value: '#546d8e', bg: 'bg-[#546d8e]' },
                                { name: 'Royal Trust', value: '#2563eb', bg: 'bg-[#2563eb]' },
                                { name: 'Swiss Emerald', value: '#059669', bg: 'bg-[#059669]' },
                                { name: 'Sovereign Gold', value: '#d97706', bg: 'bg-[#d97706]' },
                                { name: 'Majestic Purple', value: '#7c3aed', bg: 'bg-[#7c3aed]' },
                                { name: 'Crimson Asset', value: '#dc2626', bg: 'bg-[#dc2626]' },
                                { name: 'Stealth Gray', value: '#334155', bg: 'bg-[#334155]' },
                            ].map((preset) => {
                                const isSelected = settings.customPrimaryColor === preset.value || (!settings.customPrimaryColor && preset.value === '#546d8e');
                                return (
                                    <button
                                        key={preset.value}
                                        onClick={() => {
                                            triggerHaptic(20, 60);
                                            onUpdateSettings({ customPrimaryColor: preset.value === '#546d8e' ? undefined : preset.value });
                                        }}
                                        className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all duration-300 ${isSelected ? 'bg-primary/5 border-primary shadow-md' : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:bg-white dark:hover:bg-white hover:border-slate-300 dark:hover:border-black/5'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-full shadow-inner ${preset.bg} relative flex items-center justify-center`}>
                                            {isSelected && (
                                                <div className="w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-md animate-scale-in dark:bg-slate-800">
                                                    <div className="w-2 h-2 bg-primary rounded-full" />
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-bold text-center text-[#0F172A] dark:text-white">{preset.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h4 className="font-bold text-[#0F172A] dark:text-[#1E293B] text-sm">Custom Accent Calibration</h4>
                            <p className="text-xs text-[#0F172A] mt-1">Calibrate your own signature institutional hex shade using the interactive palette.</p>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl">
                            <input
                                type="color"
                                value={settings.customPrimaryColor || '#546d8e'}
                                onChange={(e) => {
                                    onUpdateSettings({ customPrimaryColor: e.target.value });
                                }}
                                className="w-8 h-8 rounded-lg border-0 cursor-pointer overflow-hidden p-0 bg-transparent shrink-0"
                            />
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase font-black text-[#0F172A] font-mono tracking-wider">HEX Accent Code</span>
                                <input
                                    type="text"
                                    value={settings.customPrimaryColor || '#546d8e'}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                                            onUpdateSettings({ customPrimaryColor: val });
                                        }
                                    }}
                                    className="bg-transparent border-0 font-mono text-xs font-bold text-[#0F172A] dark:text-white p-0 focus:ring-0 outline-none w-20"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Theme Customization Preview Pane */}
            <ThemeCustomizationPreviewPane settings={settings} onUpdateSettings={onUpdateSettings} />

            {/* Interface & Performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-white/10">
                        <h3 className="text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                            <EyeSlashIcon className="w-5 h-5 text-purple-500" /> Privacy & Focus
                        </h3>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-[#0F172A] dark:text-[#1E293B] text-sm">Privacy Curtain</h4>
                                <p className="text-xs text-[#0F172A] mt-1">Blur interface when window loses focus.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={settings.privacyMode} 
                                    onChange={(e) => onUpdateSettings({ privacyMode: e.target.checked })} 
                                />
                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer shadow-inner peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                            </label>
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-[#0F172A] dark:text-[#1E293B] text-sm">Dark Mode</h4>
                                <p className="text-xs text-[#0F172A] mt-1">System-wide dark theme.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={settings.themeMode === 'dark'} onChange={(e) => handleThemeModeChange(e.target.checked)} />
                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer shadow-inner peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-50 dark:bg-slate-900"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-white/10">
                        <h3 className="text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                            <ZapIcon className="w-5 h-5 text-amber-500" /> Performance
                        </h3>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-[#0F172A] dark:text-[#1E293B] text-sm">HFT Mode</h4>
                                <p className="text-xs text-[#0F172A] mt-1">Disable animations for instant execution.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={settings.hftMode} 
                                    onChange={(e) => onUpdateSettings({ hftMode: e.target.checked })} 
                                />
                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer shadow-inner peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                            </label>
                        </div>
                         <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-[#0F172A] dark:text-[#1E293B] text-sm">Haptic Feedback</h4>
                                    <p className="text-xs text-[#0F172A] mt-1">Tactile response on key actions.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={settings.hapticsEnabled} onChange={(e) => onUpdateSettings({ hapticsEnabled: e.target.checked })} />
                                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer shadow-inner peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>

                             {settings.hapticsEnabled && (
                                 <div className="pt-3 border-t border-slate-100 dark:border-white/10 animate-fade-in space-y-4">
                                     <div className="flex justify-between items-center">
                                         <div className="flex items-center gap-2">
                                             <span className="text-xs font-bold text-[#0F172A] dark:text-white">Capacitor Haptic Intensity</span>
                                             <span className="text-[9px] bg-emerald-500 text-emerald-500 font-mono px-2 py-0.5 rounded border border-emerald-500/20 uppercase font-black">Active</span>
                                         </div>
                                         <span className="text-xs font-black font-mono text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/20">
                                             {settings.hapticsIntensity ?? 80}%
                                         </span>
                                     </div>

                                     <div className="flex items-center gap-3">
                                         <span className="text-[9px] uppercase font-black tracking-wider text-[#0F172A]">1%</span>
                                         <input 
                                             type="range" 
                                             min="1" 
                                             max="100" 
                                             step="1"
                                             value={settings.hapticsIntensity ?? 80} 
                                             onChange={(e) => {
                                                 const val = parseInt(e.target.value);
                                                 onUpdateSettings({ hapticsIntensity: val });
                                                 triggerHaptic(15, val);
                                             }}
                                             className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-900 rounded-lg appearance-none cursor-pointer accent-primary" 
                                         />
                                         <span className="text-[9px] uppercase font-black tracking-wider text-[#0F172A]">100%</span>
                                     </div>

                                     {/* Quick Presets */}
                                     <div className="flex items-center justify-between gap-2 pt-1">
                                         {[
                                             { label: 'Soft 25%', value: 25 },
                                             { label: 'Balanced 50%', value: 50 },
                                             { label: 'High 75%', value: 75 },
                                             { label: 'Max 100%', value: 100 }
                                         ].map(p => (
                                             <button
                                                 key={p.value}
                                                 type="button"
                                                 onClick={() => {
                                                     onUpdateSettings({ hapticsIntensity: p.value });
                                                     triggerHaptic(20, p.value);
                                                 }}
                                                 className={`flex-1 py-1 px-1.5 rounded-md text-[10px] font-bold font-mono transition-all border ${
                                                     (settings.hapticsIntensity ?? 80) === p.value
                                                         ? 'bg-primary text-slate-950 border-primary font-black shadow-sm'
                                                         : 'bg-slate-100 dark:bg-slate-900 text-[#0F172A] dark:text-white border-slate-200 dark:border-white/10 hover:border-primary/40'
                                                 }`}
                                             >
                                                 {p.label}
                                             </button>
                                         ))}
                                     </div>

                                     {/* Capacitor Action Test Buttons */}
                                     <div className="pt-2 border-t border-slate-100 dark:border-white/10 space-y-2">
                                         <span className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] block">Test Vibration Patterns</span>
                                         <div className="grid grid-cols-2 gap-2">
                                             <button
                                                 type="button"
                                                 onClick={() => triggerSuccessHaptic(settings.hapticsIntensity ?? 80)}
                                                 className="py-2.5 px-3 bg-emerald-500 hover:bg-emerald-500 text-emerald-400 border border-emerald-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                                             >
                                                 <span>✓ Test Success Vibration</span>
                                             </button>
                                             <button
                                                 type="button"
                                                 onClick={() => triggerFailureHaptic(settings.hapticsIntensity ?? 80)}
                                                 className="py-2.5 px-3 bg-rose-500 hover:bg-rose-500 text-rose-400 border border-rose-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                                             >
                                                 <span>⚠ Test Error Vibration</span>
                                             </button>
                                         </div>
                                     </div>
                                 </div>
                             )}
                        </div>
                    </div>
                </div>
            </div>

                         {/* Biometric Security Setup Card */}
                         <div className="pt-6 border-t border-slate-100 dark:border-white/10 space-y-4">
                             <div className="flex justify-between items-start">
                                 <div>
                                     <div className="flex items-center gap-2">
                                         <h4 className="font-bold text-[#0F172A] dark:text-[#1E293B] text-sm flex items-center gap-1.5">
                                             <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
                                             Biometric Security Lock
                                         </h4>
                                         <span className="text-[9px] bg-emerald-500 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/20 uppercase font-black">
                                             Capacitor Plugin
                                         </span>
                                     </div>
                                     <p className="text-xs text-[#0F172A] dark:text-white mt-1">
                                         Use Fingerprint or Face ID authentication as a secure alternative to the standard password lock.
                                     </p>
                                 </div>
                                 <label className="relative inline-flex items-center cursor-pointer">
                                     <input 
                                         type="checkbox" 
                                         className="sr-only peer" 
                                         checked={!!settings.biometricsEnabled} 
                                         onChange={(e) => handleToggleBiometrics(e.target.checked)} 
                                         disabled={isAuthenticatingBiometric}
                                     />
                                     <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer shadow-inner peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                 </label>
                             </div>

                             {/* Biometric Hardware Status & Advanced Options */}
                             {settings.biometricsEnabled && (
                                 <div className="p-4 bg-slate-50 rounded-2xl border border-emerald-500/30 space-y-4 animate-fade-in dark:bg-slate-900">
                                     <div className="flex items-center justify-between border-b border-black/5 pb-3">
                                         <div className="flex items-center gap-2">
                                             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
                                             <span className="text-xs font-black text-white uppercase tracking-wider">
                                                 Hardware Sensor Active
                                             </span>
                                         </div>
                                         <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                             {biometricInfo?.biometricType || 'FaceID / Fingerprint'}
                                         </span>
                                     </div>

                                     {/* Modern Bank Advanced Security Settings */}
                                     <div className="space-y-3 pt-1">
                                         <div className="flex items-center justify-between">
                                             <div>
                                                 <span className="text-xs font-bold text-[#1E293B] block">Password Fallback Protection</span>
                                                 <span className="text-[10px] text-[#0F172A]">Allow master password fallback if sensor misreads</span>
                                             </div>
                                             <input 
                                                 type="checkbox" 
                                                 checked={settings.biometricFallbackToPassword !== false}
                                                 onChange={e => onUpdateSettings({ biometricFallbackToPassword: e.target.checked })}
                                                 className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                                             />
                                         </div>

                                         <div className="flex items-center justify-between">
                                             <div>
                                                 <span className="text-xs font-bold text-[#1E293B] block">High-Value Wire Interlock</span>
                                                 <span className="text-[10px] text-[#0F172A]">Require biometric signature for transfers over $10,000</span>
                                             </div>
                                             <input 
                                                 type="checkbox" 
                                                 checked={settings.biometricRequireForTransactions !== false}
                                                 onChange={e => onUpdateSettings({ biometricRequireForTransactions: e.target.checked })}
                                                 className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                                             />
                                         </div>
                                     </div>

                                     {/* Real-Time Hardware Test Button */}
                                     <div className="pt-2 border-t border-black/5 flex flex-col gap-2">
                                         <button
                                             type="button"
                                             onClick={handleTestBiometricScan}
                                             disabled={isAuthenticatingBiometric}
                                             className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                                         >
                                             {isAuthenticatingBiometric ? (
                                                 <SpinnerIcon className="w-4 h-4 animate-spin text-slate-950" />
                                             ) : (
                                                 <LockClosedIcon className="w-4 h-4 text-slate-950" />
                                             )}
                                             <span>Test Real-Time Biometric Scan</span>
                                         </button>
                                     </div>
                                 </div>
                             )}

                             {/* Feedback Banner */}
                             {biometricFeedback && (
                                 <div className={`p-3 rounded-xl text-xs font-bold border flex items-center justify-between animate-fade-in ${
                                     biometricFeedback.type === 'success' 
                                         ? 'bg-emerald-500 text-emerald-400 border-emerald-500/30' 
                                         : biometricFeedback.type === 'error'
                                         ? 'bg-rose-500 text-rose-400 border-rose-500/30'
                                         : 'bg-white text-[#0F172A] border-black/5'
                                 }`}>
                                     <span>{biometricFeedback.message}</span>
                                     <button 
                                         onClick={() => setBiometricFeedback(null)}
                                         className="text-[#0F172A] hover:text-white ml-2 text-xs font-bold"
                                     >
                                         ✕
                                     </button>
                                 </div>
                             )}
                         </div>

             {/* Widget & API Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-white/10 p-8 flex flex-col items-center text-center">
                    <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-6">Home Screen Widget</h3>
                    <WidgetPreview />
                    <p className="text-xs text-[#0F172A] mt-6 max-w-[200px]">
                        Add the PRB Wealth Monitor to your home screen for instant portfolio tracking.
                    </p>
                    <button className="mt-4 px-6 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-100 dark:bg-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors">
                        Configure
                    </button>
                </div>

                <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-700 p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <CodeBracketIcon className="w-48 h-48 text-[#0F172A] dark:text-white" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-500 rounded-lg border border-emerald-500/20">
                                <CodeBracketIcon className="w-6 h-6 text-emerald-500" />
                            </div>
                            <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Developer API Access</h3>
                        </div>
                        
                        <p className="text-[#0F172A] dark:text-white text-sm mb-6 max-w-lg">
                            Generate read-only API keys for integration with external accounting software (QuickBooks, Xero) or custom algorithmic trading bots.
                        </p>

                        {apiKey ? (
                            <div className="bg-slate-100 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between font-mono text-xs mb-4">
                                <span className="text-emerald-400 truncate mr-4">{apiKey}</span>
                                <button onClick={() => {navigator.clipboard.writeText(apiKey); setApiKey(null);}} className="text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white uppercase font-bold text-[10px]">Copy & Close</button>
                            </div>
                        ) : (
                            <div className="flex gap-4">
                                <button onClick={generateApiKey} disabled={isGeneratingKey} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-[#0F172A] dark:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2">
                                    {isGeneratingKey && <SpinnerIcon className="w-4 h-4 animate-spin"/>}
                                    {isGeneratingKey ? "Provisioning..." : "Generate Read-Only Key"}
                                </button>
                                <a href="#" className="px-6 py-3 border border-slate-200 dark:border-white/10 hover:bg-white text-[#0F172A] dark:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all dark:bg-slate-800">
                                    View Documentation
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Real-time Automated Low Balance Guard */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden my-8">
                <div className="p-8 border-b border-slate-100 dark:border-white/10 flex items-center gap-3">
                    <div className="p-2 bg-rose-500 rounded-xl border border-rose-500/20 text-rose-500">
                        <BellIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Low Balance Alert Guard</h3>
                        <p className="text-xs text-[#0F172A] mt-0.5 uppercase tracking-wider font-mono">Real-time Automated Push & SMS/WhatsApp Alerts</p>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10">
                        <div className="flex-1">
                            <h4 className="font-bold text-[#0F172A] dark:text-[#1E293B] text-sm">Automated Surveillance Guard</h4>
                            <p className="text-xs text-[#0F172A] mt-1">Actively monitor checking and savings balances and dispatch instant push, SMS, and WhatsApp notifications if any falling thresholds are breached.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={settings.lowBalanceAlertEnabled || false} 
                                onChange={(e) => onUpdateSettings({ lowBalanceAlertEnabled: e.target.checked })} 
                            />
                            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer shadow-inner peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                        </label>
                    </div>

                    {settings.lowBalanceAlertEnabled && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider mb-2">Monitored Account Selection</label>
                                    <select 
                                        value={settings.lowBalanceAccountId || 'all'} 
                                        onChange={(e) => onUpdateSettings({ lowBalanceAccountId: e.target.value })} 
                                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1E293B] dark:text-slate-100 focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-bold"
                                    >
                                        <option value="all">All Linked Portfolio Accounts</option>
                                        {accounts && accounts.map((acc: any) => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.nickname || acc.type} (••••{acc.accountNumber.slice(-4)}) — ${(acc.balance || 0).toLocaleString()}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider mb-2">Safety Guard Threshold Amount ($)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#0F172A]">$</span>
                                        <input 
                                            type="number" 
                                            value={settings.lowBalanceThreshold !== undefined ? settings.lowBalanceThreshold : 1000} 
                                            onChange={(e) => {
                                                const val = e.target.value === '' ? '' : Number(e.target.value);
                                                onUpdateSettings({ lowBalanceThreshold: val as number });
                                            }} 
                                            className="w-full pl-8 pr-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1E293B] dark:text-slate-100 focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-mono font-bold"
                                            placeholder="1,000.00"
                                            min="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Safety Guard Haptic Sensory Pattern */}
                            <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <ZapIcon className="w-4 h-4 text-amber-500" />
                                        <span className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider">Tactile Safety Guard Haptics</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">Capacitor Active</span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Multi-stage sensory pulse triggers via Capacitor Haptics whenever account balances dip below your ${Number(settings.lowBalanceThreshold || 1000).toLocaleString()} threshold.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        triggerSafetyGuardHaptic(settings.hapticsIntensity || 80);
                                    }}
                                    className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <span>Test Safety Guard Haptic</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Document Statement Styling & Theme Customizer */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden my-8">
                <div className="p-8 border-b border-slate-100 dark:border-white/10 flex items-center gap-3">
                    <div className="p-2 bg-amber-500 rounded-xl border border-amber-500/20 text-amber-500">
                        <LayersIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Document Statement Styling</h3>
                        <p className="text-xs text-[#0F172A] mt-0.5 uppercase tracking-wider font-mono">Customize official PDF ledger formats & signatures</p>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Theme selector */}
                    <div>
                        <h4 className="font-bold text-[#0F172A] dark:text-[#1E293B] text-sm mb-3">Statement Visual Theme</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { id: 'Classic', desc: 'Serif fonts, traditional warm ivory layout with prestigious gold seals' },
                                { id: 'Modern', desc: 'Vanguard slate dark theme with cyberpunk matrix aesthetic and glowing accents' },
                                { id: 'Minimal', desc: 'Ultra lean B&W light theme, minimalist hair-thin borders with crisp sans-serif format' }
                            ].map((tm) => (
                                <button
                                    key={tm.id}
                                    type="button"
                                    onClick={() => onUpdateSettings({ documentStatementTheme: tm.id as any })}
                                    className={`p-5 rounded-2xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                                        settings.documentStatementTheme === tm.id
                                            ? 'bg-primary/5 border-primary shadow-md'
                                            : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:bg-slate-100 dark:hover:bg-slate-50 border-slate-200 dark:border-white/10'
                                    }`}
                                >
                                    <span className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-wider">{tm.id} Layout</span>
                                    <span className="text-[10px] text-[#0F172A] dark:text-white leading-snug">{tm.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Seal Color Accent */}
                    <div>
                        <h4 className="font-bold text-[#0F172A] dark:text-[#1E293B] text-sm mb-3">Bank Seal Color Accent</h4>
                        <div className="flex flex-wrap gap-4 items-center">
                            {[
                                { name: 'Gold', value: '#D4AF37' },
                                { name: 'Emerald', value: '#10B981' },
                                { name: 'Classic Blue', value: '#0EA5E9' },
                                { name: 'Crimson', value: '#EF4444' },
                                { name: 'Sovereign Purple', value: '#8B5CF6' },
                                { name: 'Midnight Black', value: '#0F172A' }
                            ].map((sc) => (
                                <button
                                    key={sc.value}
                                    type="button"
                                    onClick={() => onUpdateSettings({ documentSealColor: sc.value })}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                        (settings.documentSealColor === sc.value || (!settings.documentSealColor && sc.value === '#D4AF37'))
                                            ? 'bg-primary/10 border-primary text-primary scale-105 shadow-md'
                                            : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-white/10 text-[#0F172A] dark:text-white hover:scale-102 hover:border-slate-350'
                                    }`}
                                >
                                    <span className="w-3.5 h-3.5 rounded-full shadow-inner border border-slate-200 dark:border-black/10" style={{ backgroundColor: sc.value }} />
                                    <span>{sc.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Beneficiary Email Personalization Tone */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden my-8">
                <div className="p-8 border-b border-slate-100 dark:border-white/10 flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl border border-primary/20 text-primary">
                        <SendIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Beneficiary Notification Protocol</h3>
                        <p className="text-xs text-[#0F172A] mt-0.5 uppercase tracking-wider font-mono">Tailor stylistic linguistic style for receiving partners</p>
                    </div>
                </div>
                <div className="p-8 space-y-6">
                    <p className="text-[#0F172A] dark:text-white text-sm max-w-2xl leading-relaxed">
                        Toggle the rhetorical tone and styling when dispatching automated settlement notifications to your payment recipients. 
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { 
                                id: 'Professional', 
                                title: 'Professional / Brief', 
                                subtitle: 'Instant & Direct',
                                desc: 'Condensed alerts containing only essential transaction metadata, ideal for high-velocity clearing and institutional partner accounts.'
                            },
                            { 
                                id: 'Detailed', 
                                title: 'Detailed / Formal', 
                                subtitle: 'Concierge Grade',
                                desc: 'Full narrative reports featuring detailed settlement progress timelines, active clearing tracking, and compliance support links.'
                            }
                        ].map((toneOpt) => {
                            const isSelected = (settings.beneficiaryEmailTone || 'Detailed') === toneOpt.id;
                            return (
                                <button
                                    key={toneOpt.id}
                                    type="button"
                                    onClick={() => onUpdateSettings({ beneficiaryEmailTone: toneOpt.id as any })}
                                    className={`p-5 rounded-2xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                                        isSelected
                                            ? 'bg-primary/5 border-primary shadow-md'
                                            : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:bg-slate-100 dark:hover:bg-slate-50 border-slate-200 dark:border-white/10'
                                    }`}
                                >
                                    <div className="flex justify-between items-center w-full">
                                        <span className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-wider">{toneOpt.title}</span>
                                        <span className="text-[9px] font-mono font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10">{toneOpt.subtitle}</span>
                                    </div>
                                    <span className="text-[10px] text-[#0F172A] dark:text-white leading-snug">{toneOpt.desc}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-white/10 p-8 space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h4 className="font-bold text-[#0F172A] dark:text-white">Interface Accent Preset</h4>
                        <p className="text-sm text-[#0F172A] dark:text-white">Choose an institutional preset accent.</p>
                    </div>
                    <div className="flex gap-4">
                        <ThemeSwatch theme="blue" color="bg-[#0ec5f2]" currentTheme={settings.theme} onClick={(t) => onUpdateSettings({ theme: t, customPrimaryColor: undefined })} />
                        <ThemeSwatch theme="green" color="bg-[#10b981]" currentTheme={settings.theme} onClick={(t) => onUpdateSettings({ theme: t, customPrimaryColor: undefined })} />
                        <ThemeSwatch theme="purple" color="bg-[#8b5cf6]" currentTheme={settings.theme} onClick={(t) => onUpdateSettings({ theme: t, customPrimaryColor: undefined })} />
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h4 className="font-bold text-[#0F172A] dark:text-white">Theme Color Picker</h4>
                        <p className="text-sm text-[#0F172A] dark:text-white">Select any custom color as your primary brand accent using CSS variables.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-850">
                            <input 
                                type="color" 
                                value={settings.customPrimaryColor || '#546d8e'} 
                                onChange={(e) => onUpdateSettings({ customPrimaryColor: e.target.value })}
                                className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent outline-none"
                            />
                            <span className="font-mono text-xs font-bold text-[#0F172A] dark:text-white uppercase">
                                {settings.customPrimaryColor || '#546D8E'}
                            </span>
                        </div>

                        {settings.customPrimaryColor && (
                            <button
                                onClick={() => onUpdateSettings({ customPrimaryColor: undefined })}
                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-750 text-[#0F172A] dark:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                            >
                                Reset to Default
                            </button>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};
