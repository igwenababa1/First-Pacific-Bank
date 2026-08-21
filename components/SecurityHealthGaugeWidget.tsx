import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    ShieldCheck, 
    ShieldAlert, 
    Smartphone, 
    KeyRound, 
    CheckCircle2, 
    AlertTriangle, 
    Lock, 
    ChevronRight, 
    X, 
    Trash2, 
    Plus, 
    Sparkles, 
    RefreshCw,
    Info
} from 'lucide-react';
import { triggerSuccessHaptic, triggerHaptic } from '../utils/haptics';

interface TrustedDevice {
    id: string;
    name: string;
    type: 'mobile' | 'desktop' | 'tablet';
    location: string;
    lastActive: string;
    isCurrentDevice?: boolean;
}

const DEFAULT_DEVICES: TrustedDevice[] = [
    {
        id: 'dev_1',
        name: 'iPhone 15 Pro Max (Primary)',
        type: 'mobile',
        location: 'New York, USA',
        lastActive: 'Active Now',
        isCurrentDevice: true
    },
    {
        id: 'dev_2',
        name: 'MacBook Pro M3 Max',
        type: 'desktop',
        location: 'New York, USA',
        lastActive: '2 hours ago',
        isCurrentDevice: false
    }
];

export const SecurityHealthGaugeWidget: React.FC = () => {
    // 1. MFA State (Persisted in localStorage)
    const [mfaEnabled, setMfaEnabled] = useState<boolean>(() => {
        const saved = localStorage.getItem('mfa_enabled');
        return saved !== null ? JSON.parse(saved) : true;
    });

    // 2. Trusted Devices State
    const [devices, setDevices] = useState<TrustedDevice[]>(() => {
        const saved = localStorage.getItem('trusted_devices');
        return saved !== null ? JSON.parse(saved) : DEFAULT_DEVICES;
    });

    // 3. Account Verification Level (1, 2, or 3)
    const [verificationLevel, setVerificationLevel] = useState<number>(() => {
        const saved = localStorage.getItem('account_verification_level');
        return saved !== null ? parseInt(saved, 10) : 3;
    });

    // UI Modals
    const [isManageDevicesModalOpen, setIsManageDevicesModalOpen] = useState(false);
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Save states
    useEffect(() => {
        localStorage.setItem('mfa_enabled', JSON.stringify(mfaEnabled));
    }, [mfaEnabled]);

    useEffect(() => {
        localStorage.setItem('trusted_devices', JSON.stringify(devices));
    }, [devices]);

    useEffect(() => {
        localStorage.setItem('account_verification_level', verificationLevel.toString());
    }, [verificationLevel]);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Calculate score points dynamically
    // MFA: 35 points max
    const mfaScore = mfaEnabled ? 35 : 0;

    // Trusted Devices: 35 points max (1-2 devices = 35, 3-4 = 25, >4 = 15, 0 = 10)
    let deviceScore = 35;
    if (devices.length === 0) deviceScore = 10;
    else if (devices.length > 2 && devices.length <= 4) deviceScore = 25;
    else if (devices.length > 4) deviceScore = 15;

    // Verification Level: 30 points max (L3 = 30, L2 = 20, L1 = 10)
    let verificationScore = 30;
    if (verificationLevel === 2) verificationScore = 20;
    else if (verificationLevel === 1) verificationScore = 10;

    const totalScore = mfaScore + deviceScore + verificationScore;

    // Score status color branding
    let scoreColor = '#10b981'; // Emerald
    let statusText = 'Optimal Protection';
    let statusBg = 'bg-emerald-500 text-emerald-400 border-emerald-500/30';

    if (totalScore < 50) {
        scoreColor = '#f43f5e'; // Rose
        statusText = 'Critical Action Needed';
        statusBg = 'bg-rose-500 text-rose-400 border-rose-500/30';
    } else if (totalScore < 85) {
        scoreColor = '#f59e0b'; // Amber
        statusText = 'Moderate Protection';
        statusBg = 'bg-amber-500 text-amber-400 border-amber-500/30';
    }

    const toggleMfa = () => {
        const nextState = !mfaEnabled;
        setMfaEnabled(nextState);
        triggerSuccessHaptic();
        showToast(nextState ? '2FA Multi-Factor Authentication Activated ✓' : '2FA Multi-Factor Authentication Deactivated');
    };

    const removeDevice = (id: string) => {
        setDevices(prev => prev.filter(d => d.id !== id));
        triggerHaptic(15);
        showToast('Device removed from trusted list.');
    };

    const addDevice = () => {
        const newDev: TrustedDevice = {
            id: `dev_${Date.now()}`,
            name: 'iPad Pro 12.9" (Cellular)',
            type: 'tablet',
            location: 'New York, USA',
            lastActive: 'Just registered'
        };
        setDevices(prev => [...prev, newDev]);
        triggerSuccessHaptic();
        showToast('New trusted device registered ✓');
    };

    // Calculate arc SVG path stroke
    // Semi-circle gauge (180 degrees)
    const radius = 58;
    const strokeWidth = 10;
    const circumference = Math.PI * radius; // ~182.2
    const strokeDashoffset = circumference - (totalScore / 100) * circumference;

    return (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between text-white" id="security-health-gauge-widget">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-500 border border-emerald-500/30 rounded-xl text-emerald-400">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">Security Health</h3>
                        <p className="text-[10px] text-[#0F172A] font-bold">Real-Time Account Protection Score</p>
                    </div>
                </div>

                <div className={`px-3 py-1 rounded-full text-[9.5px] font-black uppercase tracking-wider border ${statusBg}`}>
                    {statusText}
                </div>
            </div>

            {/* Gauge Gauge Center Visual */}
            <div className="relative flex flex-col items-center justify-center my-2">
                <svg className="w-48 h-28" viewBox="0 0 140 80">
                    <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f43f5e" />
                            <stop offset="50%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                    </defs>

                    {/* Background Arc */}
                    <path
                        d="M 12 70 A 58 58 0 0 1 128 70"
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />

                    {/* Animated Score Fill Arc */}
                    <path
                        d="M 12 70 A 58 58 0 0 1 128 70"
                        fill="none"
                        stroke="url(#scoreGradient)"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                    />
                </svg>

                {/* Score Text Overlay inside Gauge */}
                <div className="absolute top-10 flex flex-col items-center text-center">
                    <span className="text-3xl font-black font-mono tracking-tight text-white">
                        {totalScore}
                    </span>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-[#0F172A] font-bold -mt-1">
                        / 100 Score
                    </span>
                </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2">
                {/* 1. MFA Metric */}
                <div 
                    onClick={toggleMfa}
                    className="p-3 bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-2xl cursor-pointer transition-all active:scale-95 group"
                >
                    <div className="flex items-center justify-between mb-1">
                        <KeyRound className="w-4 h-4 text-amber-400" />
                        <span className={`text-[9px] font-black font-mono px-1.5 py-0.5 rounded ${mfaEnabled ? 'bg-emerald-500 text-emerald-400' : 'bg-rose-500 text-rose-400'}`}>
                            {mfaEnabled ? '+35 PTS' : '0 PTS'}
                        </span>
                    </div>
                    <p className="text-[10px] font-bold text-[#0F172A]">Multi-Factor (2FA)</p>
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] font-mono text-[#0F172A]">{mfaEnabled ? 'Enabled' : 'Disabled'}</span>
                        <span className="text-[9px] font-bold text-amber-400 group-hover:underline">Toggle</span>
                    </div>
                </div>

                {/* 2. Trusted Devices Metric */}
                <div 
                    onClick={() => setIsManageDevicesModalOpen(true)}
                    className="p-3 bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-2xl cursor-pointer transition-all active:scale-95 group"
                >
                    <div className="flex items-center justify-between mb-1">
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                        <span className="text-[9px] font-black font-mono bg-emerald-500 text-emerald-400 px-1.5 py-0.5 rounded">
                            +{deviceScore} PTS
                        </span>
                    </div>
                    <p className="text-[10px] font-bold text-[#0F172A]">Trusted Devices</p>
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] font-mono text-[#0F172A]">{devices.length} Active</span>
                        <span className="text-[9px] font-bold text-emerald-400 group-hover:underline">Manage</span>
                    </div>
                </div>

                {/* 3. Account Verification Metric */}
                <div 
                    onClick={() => setIsVerificationModalOpen(true)}
                    className="p-3 bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-2xl cursor-pointer transition-all active:scale-95 group"
                >
                    <div className="flex items-center justify-between mb-1">
                        <ShieldCheck className="w-4 h-4 text-blue-400" />
                        <span className="text-[9px] font-black font-mono bg-blue-500 text-blue-400 px-1.5 py-0.5 rounded">
                            +{verificationScore} PTS
                        </span>
                    </div>
                    <p className="text-[10px] font-bold text-[#0F172A]">Verification Level</p>
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] font-mono text-[#0F172A]">Level {verificationLevel} (Tier-3)</span>
                        <span className="text-[9px] font-bold text-blue-400 group-hover:underline">View</span>
                    </div>
                </div>
            </div>

            {/* Quick Toast Notification */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-3 inset-x-6 bg-white border border-emerald-500/50 text-emerald-300 text-[10px] font-mono p-2 rounded-xl text-center shadow-xl z-20 flex items-center justify-center gap-1.5 dark:bg-slate-800"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{toastMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Manage Trusted Devices Modal */}
            <AnimatePresence>
                {isManageDevicesModalOpen && (
                    <div className="fixed inset-0 bg-slate-100  z-[200] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-50 border border-slate-200 w-full max-w-md rounded-3xl p-6 text-left shadow-2xl relative dark:bg-slate-900"
                        >
                            <button 
                                onClick={() => setIsManageDevicesModalOpen(false)}
                                className="absolute top-5 right-5 text-[#0F172A] hover:text-white p-1 rounded-full hover:bg-white dark:bg-slate-800"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-emerald-500 border border-emerald-500/30 text-emerald-400 rounded-xl">
                                    <Smartphone className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-wider text-white">Trusted Devices</h3>
                                    <p className="text-[10px] text-[#0F172A] font-bold">Manage devices authorized for biometric login</p>
                                </div>
                            </div>

                            <div className="space-y-2 mb-6">
                                {devices.map(device => (
                                    <div key={device.id} className="p-3 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-[#1E293B] flex items-center gap-1.5">
                                                <span>{device.name}</span>
                                                {device.isCurrentDevice && (
                                                    <span className="text-[8px] font-mono bg-emerald-500 text-emerald-400 px-1.5 py-0.5 rounded uppercase">Current</span>
                                                )}
                                            </p>
                                            <p className="text-[9.5px] font-mono text-[#0F172A] mt-0.5">
                                                {device.location} • {device.lastActive}
                                            </p>
                                        </div>

                                        {!device.isCurrentDevice && (
                                            <button 
                                                onClick={() => removeDevice(device.id)}
                                                className="p-2 text-rose-400 hover:bg-rose-500 rounded-xl transition-colors"
                                                title="Revoke Device"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={addDevice}
                                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase text-xs tracking-wider rounded-xl shadow transition-all active:scale-95 flex items-center justify-center gap-1.5"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add This Device</span>
                                </button>
                                <button
                                    onClick={() => setIsManageDevicesModalOpen(false)}
                                    className="px-4 py-3 bg-white text-[#0F172A] font-bold uppercase text-xs rounded-xl hover:bg-slate-700 dark:bg-slate-800"
                                >
                                    Done
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Account Verification Modal */}
            <AnimatePresence>
                {isVerificationModalOpen && (
                    <div className="fixed inset-0 bg-slate-100  z-[200] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-50 border border-slate-200 w-full max-w-md rounded-3xl p-6 text-left shadow-2xl relative dark:bg-slate-900"
                        >
                            <button 
                                onClick={() => setIsVerificationModalOpen(false)}
                                className="absolute top-5 right-5 text-[#0F172A] hover:text-white p-1 rounded-full hover:bg-white dark:bg-slate-800"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-blue-500 border border-blue-500/30 text-blue-400 rounded-xl">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-wider text-white">Account Verification Tier</h3>
                                    <p className="text-[10px] text-[#0F172A] font-bold">Sovereign Regulatory Clearance Metrics</p>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                {[
                                    { level: 3, title: 'Level 3: Sovereign Institutional', desc: 'Unlimited wires, biometric hardware keys, direct Fedwire clearance.', pts: 30 },
                                    { level: 2, title: 'Level 2: KYC & Photo ID Verified', desc: 'Standard wire limits ($250k/day), biometric login enabled.', pts: 20 },
                                    { level: 1, title: 'Level 1: Basic Account Verification', desc: 'Email & SMS verified, basic transfer limits ($25k/day).', pts: 10 },
                                ].map(item => (
                                    <div 
                                        key={item.level}
                                        onClick={() => {
                                            setVerificationLevel(item.level);
                                            triggerSuccessHaptic();
                                            showToast(`Account verification updated to Level ${item.level}`);
                                        }}
                                        className={`p-3.5 border rounded-2xl cursor-pointer transition-all ${verificationLevel === item.level ? 'bg-blue-500 border-blue-500 text-white' : 'bg-slate-100 border-slate-200 text-[#0F172A] hover:border-slate-300'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-100">{item.title}</span>
                                            <span className="text-[9px] font-mono font-bold bg-blue-500 text-blue-400 px-2 py-0.5 rounded">
                                                +{item.pts} PTS
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-[#0F172A] mt-1 leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setIsVerificationModalOpen(false)}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-wider rounded-xl shadow transition-all active:scale-95"
                            >
                                Confirm Verification Level
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
