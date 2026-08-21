
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Clipboard, Check, HelpCircle, Mic, Volume2, RefreshCw, Lock, Cpu, CloudOff } from 'lucide-react';
import { AdvancedTransferLimits, LimitDetail, VerificationLevel, SecuritySettings, TrustedDevice, Transaction, TransactionStatus, PushNotificationSettings, UserProfile, Card, PrivacySettings } from '../types';
import { CheckCircleIcon, PencilIcon, DevicePhoneMobileIcon, FingerprintIcon, LockClosedIcon, UserCircleIcon, NetworkIcon, IdentificationIcon, ComputerDesktopIcon, FaceIdIcon, CertificateIcon, ChartBarIcon, ShieldCheckIcon, TrendingUpIcon, EyeIcon, ExclamationTriangleIcon, CameraIcon, SpinnerIcon, ArrowsRightLeftIcon, BankIcon, GlobeAmericasIcon, PremiumReservedBankLogo, VisaIcon, MastercardIcon, ShoppingBagIcon, SparklesIcon, XIcon, TrashIcon } from './Icons';
import { VerificationCenter } from './VerificationCenter';
import { Setup2FAModal } from './Setup2FAModal';
import { SetupBiometricsModal } from './SetupBiometricsModal';
import { generateUserAvatar, storeBiometricFace } from '../services/avatarService';
import { socket } from '../services/socket';
import { sendWhatsAppNotification } from '../utils/notificationService';
import { db } from '../services/database';
import { authenticateBiometric, registerBiometric } from '../services/biometricService';

interface SettingsProps {
  advancedTransferLimits: AdvancedTransferLimits;
  onUpdateAdvancedLimits: (newLimits: AdvancedTransferLimits) => void;
  cards: Card[];
  onUpdateCardControls: (cardId: string, updatedControls: Partial<Card['controls']>) => void;
  verificationLevel: VerificationLevel;
  onVerificationComplete: (level: VerificationLevel) => void;
  securitySettings: SecuritySettings;
  onUpdateSecuritySettings: (newSettings: Partial<SecuritySettings>) => void;
  trustedDevices: TrustedDevice[];
  onRevokeDevice: (deviceId: string) => void;
  onChangePassword: () => void;
  transactions: Transaction[];
  pushNotificationSettings: PushNotificationSettings;
  onUpdatePushNotificationSettings: (newSettings: Partial<PushNotificationSettings>) => void;
  userProfile: UserProfile;
  onUpdateProfilePicture: (url: string) => void;
  privacySettings: PrivacySettings;
  onUpdatePrivacySettings: (update: Partial<PrivacySettings>) => void;
  onDeleteAccountPermanently?: (password: string) => Promise<{ success: boolean; error?: string }>;
}

const TrustedDeviceRow: React.FC<{ device: TrustedDevice; onRevoke: (id: string) => void }> = ({ device, onRevoke }) => {
    const DeviceIcon = device.deviceType === 'desktop' ? ComputerDesktopIcon : DevicePhoneMobileIcon;
    return (
        <div className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center first:pt-0 last:pb-0 group">
            <div className="flex items-start space-x-4">
                <div className={`p-2.5 rounded-full ${device.isCurrent ? 'bg-green-100 dark:bg-green-500 text-green-600 dark:text-green-400' : 'bg-slate-300 dark:bg-slate-900 text-[#0F172A] dark:text-white'}`}>
                    <DeviceIcon className="w-6 h-6"/>
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-[#0F172A] dark:text-white">{device.browser}</p>
                        {device.isCurrent && (
                            <span className="text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-500 border border-green-200 dark:border-green-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Current
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-[#0F172A] dark:text-white flex items-center gap-1 mt-0.5">
                        <span className="font-bold text-[#0F172A] dark:text-white">{device.location}</span>
                        <span>•</span>
                        <span>Last active: {new Date(device.lastLogin).toLocaleDateString()}</span>
                    </p>
                </div>
            </div>
            {!device.isCurrent && (
                <button 
                    onClick={() => onRevoke(device.id)} 
                    className="mt-3 sm:mt-0 px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500 hover:bg-red-100 dark:hover:bg-red-500 border border-red-100 dark:border-red-500/20 rounded-lg transition-colors"
                >
                    Revoke Access
                </button>
            )}
        </div>
    );
};

const RevokeDeviceModal: React.FC<{ device: TrustedDevice; onClose: () => void; onConfirm: () => void }> = ({ device, onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-slate-100  z-[80] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-200 dark:bg-slate-900 rounded-2xl shadow-digital p-8 w-full max-w-sm m-4 relative animate-fade-in-up border border-slate-100 dark:border-white/10 text-[#0F172A] dark:text-white">
                <button onClick={onClose} className="absolute top-4 right-4 text-[#0F172A] dark:text-white hover:text-[#0F172A]">
                    <XIcon className="w-5 h-5" />
                </button>
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-500 rounded-full mb-4 shadow-digital-inset">
                        <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Revoke Device Access?</h2>
                    <p className="text-[#0F172A] dark:text-white text-sm mt-2">
                        Are you sure you want to remove this device from your trusted list? It will require re-authentication to access your account.
                    </p>
                    
                    <div className="bg-slate-300 dark:bg-slate-800 p-4 rounded-xl mt-6 text-left border border-slate-300 dark:border-white/10">
                        <div className="flex items-center gap-3 mb-2">
                            <ComputerDesktopIcon className="w-5 h-5 text-[#0F172A] dark:text-white" />
                            <span className="font-bold text-[#0F172A] dark:text-white text-sm">{device.browser}</span>
                        </div>
                        <div className="space-y-1 pl-8">
                            <p className="text-xs text-[#0F172A] dark:text-white">Location: <span className="font-bold text-[#0F172A] dark:text-white">{device.location}</span></p>
                            <p className="text-xs text-[#0F172A] dark:text-white">Last Login: <span className="font-bold text-[#0F172A] dark:text-white">{new Date(device.lastLogin).toLocaleDateString()} {new Date(device.lastLogin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></p>
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-lg text-sm font-bold text-[#0F172A] dark:text-white bg-slate-300 dark:bg-slate-900 hover:bg-slate-400 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="flex-1 py-3 px-4 rounded-lg text-sm font-bold text-[#0F172A] dark:text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20 transition-colors"
                    >
                        Revoke Access
                    </button>
                </div>
            </div>
        </div>
    );
};

const EmergencyLockdownModal: React.FC<{ onClose: () => void; onConfirm: () => void }> = ({ onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-red-950  z-[90] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-shake border-4 border-red-600">
                <button onClick={onClose} className="absolute top-4 right-4 text-[#0F172A] dark:text-white hover:text-[#0F172A]">
                    <XIcon className="w-6 h-6" />
                </button>
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-500 rounded-full mb-6 shadow-inner animate-pulse">
                        <ExclamationTriangleIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-3xl font-black text-red-700 dark:text-red-500 uppercase tracking-tight mb-2">Emergency Lockdown</h2>
                    <p className="text-[#0F172A] dark:text-white font-bold mb-6">
                        You are about to freeze all assets and block all access. This action is immediate and requires manual verification to reverse.
                    </p>
                    
                    <div className="bg-red-50 dark:bg-red-950 p-4 rounded-xl text-left border border-red-100 dark:border-red-900/30 mb-8">
                        <ul className="space-y-2 text-sm text-red-800 dark:text-red-300 font-semibold">
                            <li className="flex items-center gap-2"><LockClosedIcon className="w-4 h-4"/> All Cards Frozen</li>
                            <li className="flex items-center gap-2"><DevicePhoneMobileIcon className="w-4 h-4"/> Trusted Devices Revoked</li>
                            <li className="flex items-center gap-2"><ArrowsRightLeftIcon className="w-4 h-4"/> Transfers Disabled</li>
                        </ul>
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-4 px-4 rounded-xl text-sm font-bold text-[#0F172A] dark:text-white bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={onConfirm}
                            className="flex-1 py-4 px-4 rounded-xl text-sm font-bold text-[#0F172A] dark:text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30 transition-all transform hover:scale-105"
                        >
                            CONFIRM LOCKDOWN
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const KycFeatureCard: React.FC<{
  icon: React.ReactElement<any>;
  title: string;
  description: string;
  unlocked: boolean;
  requiredLevel: string;
  imageUrl?: string;
}> = ({ icon, title, description, unlocked, requiredLevel, imageUrl }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { rootMargin: '0px 0px -100px 0px' }
        );

        const currentCardRef = cardRef.current;

        if (currentCardRef) {
            observer.observe(currentCardRef);
        }

        return () => {
            if (currentCardRef) {
                observer.unobserve(currentCardRef);
            }
        };
    }, []);

    return (
        <div ref={cardRef} className={`group relative p-4 rounded-lg shadow-digital-inset transition-all duration-300 overflow-hidden ${unlocked ? 'bg-slate-200 dark:bg-slate-900 border dark:border-white/10' : 'bg-slate-300 dark:bg-slate-800 border border-transparent'}`}>
            {unlocked && imageUrl && (
                <>
                    <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                        style={{ backgroundImage: isVisible ? `url(${imageUrl})` : 'none' }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-200 dark:from-slate-900 via-slate-200/80 dark:via-slate-900/80 to-slate-200/50 dark:to-slate-900/50"></div>
                </>
            )}
            <div className="relative flex items-start space-x-4">
                <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full shadow-digital ${unlocked ? 'bg-slate-200 dark:bg-slate-900' : 'bg-slate-300 dark:bg-slate-900'}`}>
                    {unlocked ? React.cloneElement(icon, { className: "w-6 h-6 text-primary" }) : React.cloneElement(icon, { className: "w-6 h-6 text-[#0F172A] dark:text-white" })}
                </div>
                <div className="flex-grow">
                    <h4 className={`font-bold ${unlocked ? 'text-[#0F172A] dark:text-white' : 'text-[#0F172A] dark:text-white'}`}>{title}</h4>
                    <p className={`text-sm ${unlocked ? 'text-[#0F172A] dark:text-white' : 'text-[#0F172A] dark:text-slate-450'}`}>{description}</p>
                </div>
                {unlocked ? (
                    <div className="flex-shrink-0 flex items-center space-x-1 text-green-600 dark:text-green-400 text-xs font-bold bg-green-100 dark:bg-green-500  px-2 py-1 rounded-full">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>Unlocked</span>
                    </div>
                ) : (
                    <div className="flex-shrink-0 text-[#0F172A] dark:text-slate-440 text-xs font-semibold bg-slate-200 dark:bg-slate-900  px-2 py-1 rounded-full border dark:border-white/10">
                        Requires {requiredLevel}
                    </div>
                )}
            </div>
        </div>
    );
};


import { SecurityDispatchLog } from './SecurityDispatchLog';

const SecurityScore: React.FC<{ score: number }> = ({ score }) => {
    const circumference = 2 * Math.PI * 54;
    const strokeDashoffset = circumference * (1 - score / 100);
    const scoreColor = score > 80 ? 'text-green-500' : score > 60 ? 'text-yellow-500' : 'text-red-500';

    return (
        <div className="relative w-40 h-40 mx-auto">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" strokeWidth="12" className="text-[#0F172A] dark:text-white/60" />
                <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className={`transition-all duration-1000 ease-out ${scoreColor}`}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${scoreColor}`}>{score}</span>
                <span className="text-xs font-bold uppercase tracking-wide text-[#0F172A] dark:text-white mt-1">Security</span>
            </div>
        </div>
    );
};

const CreditScore: React.FC<{ score: number }> = ({ score }) => {
    // FICO Range: 300 - 850
    const minScore = 300;
    const maxScore = 850;
    const percentage = Math.max(0, Math.min(100, ((score - minScore) / (maxScore - minScore)) * 100));
    
    const circumference = 2 * Math.PI * 54;
    const strokeDashoffset = circumference * (1 - percentage / 100);
    
    let color = 'text-red-500';
    let label = 'Poor';
    if (score >= 580) { color = 'text-yellow-500'; label = 'Fair'; }
    if (score >= 670) { color = 'primary-'; label = 'Good'; }
    if (score >= 740) { color = 'text-indigo-500'; label = 'Very Good'; }
    if (score >= 800) { color = 'text-purple-500'; label = 'Exceptional'; }

    return (
        <div className="relative w-40 h-40 mx-auto">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" strokeWidth="12" className="text-[#0F172A] dark:text-white/60" />
                <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className={`transition-all duration-1000 ease-out ${color}`}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${color}`}>{score}</span>
                <span className={`text-xs font-bold uppercase tracking-wide ${color} mt-1`}>{label}</span>
            </div>
        </div>
    );
};

const CardSecurityControls: React.FC<{ cards: Card[], onUpdateCardControls: (cardId: string, updatedControls: Partial<Card['controls']>) => void }> = ({ cards, onUpdateCardControls }) => {
    
    const ControlToggle: React.FC<{ label: string; enabled: boolean; onChange: (val: boolean) => void }> = ({ label, enabled, onChange }) => (
        <div className="flex justify-between items-center py-2">
            <span className="font-bold text-[#0F172A] dark:text-[#1E293B] text-sm">{label}</span>
            <label className="relative inline-flex items-center cursor-pointer font-bold text-[#0F172A] dark:text-white">
                <input type="checkbox" className="sr-only peer" checked={enabled} onChange={(e) => onChange(e.target.checked)} />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-900 rounded-full peer shadow-inner peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md peer-checked:bg-primary"></div>
            </label>
        </div>
    );

    return (
        <div className="bg-slate-200 dark:bg-slate-900 border border-transparent dark:border-white/10 rounded-2xl shadow-digital">
            <div className="p-6 border-b border-slate-300 dark:border-white/10"><h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Card Security Controls</h2></div>
            <div className="p-6 space-y-4">
                {cards.map(card => (
                    <div key={card.id} className="bg-slate-200 dark:bg-slate-800 p-4 rounded-lg shadow-digital-inset border dark:border-white/10">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center space-x-3">
                                {card.network === 'Visa' ? <VisaIcon className="w-10 h-auto"/> : <MastercardIcon className="w-10 h-auto"/>}
                                <div>
                                    <p className="font-bold text-[#0F172A] dark:text-white">{card.cardType === 'DEBIT' ? 'Debit Card' : 'Credit Card'}</p>
                                    <p className="text-sm text-[#0F172A] dark:text-white font-mono">•••• {card.lastFour}</p>
                                </div>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-300 dark:divide-white/10">
                            <ControlToggle label="Lock Card" enabled={card.controls?.isFrozen ?? false} onChange={val => onUpdateCardControls(card.id, { isFrozen: val })} />
                            <ControlToggle label="Online Purchases" enabled={card.controls?.onlinePurchases ?? true} onChange={val => onUpdateCardControls(card.id, { onlinePurchases: val })} />
                            <ControlToggle label="International Transactions" enabled={card.controls?.internationalTransactions ?? true} onChange={val => onUpdateCardControls(card.id, { internationalTransactions: val })} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LimitIncreaseRequestModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
    const [reason, setReason] = useState('');
    const [amount, setAmount] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep('processing');
        setTimeout(() => {
            setStep('success');
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-slate-100  z-[80] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-200 dark:bg-slate-900 rounded-2xl shadow-digital p-8 w-full max-w-md relative animate-fade-in-up border border-slate-100 dark:border-white/10 text-[#0F172A] dark:text-white">
                <button onClick={onClose} className="absolute top-4 right-4 text-[#0F172A] dark:text-white hover:text-[#0F172A]">
                    <XIcon className="w-5 h-5" />
                </button>
                
                {step === 'form' && (
                    <>
                        <h2 className="text-xl font-bold text-[#0F172A] dark:text-white mb-2">Request Limit Increase</h2>
                        <p className="text-sm text-[#0F172A] dark:text-white mb-6">Higher limits are subject to manual review. Processing time is typically 24-48 hours.</p>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-widest mb-2">Requested Daily Limit</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F172A] dark:text-white font-bold">$</span>
                                    <input 
                                        type="number" 
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-xl py-3 pl-8 pr-4 text-[#0F172A] dark:text-white font-bold outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="50,000"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-widest mb-2">Reason for Increase</label>
                                <textarea 
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-xl p-4 text-[#0F172A] dark:text-white font-bold outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
                                    placeholder="e.g. Real estate transaction, Business expenses..."
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full py-3 bg-primary text-[#0F172A] dark:text-white font-bold rounded-xl shadow-lg hover:bg-primary-600 transition-colors">
                                Submit Request
                            </button>
                        </form>
                    </>
                )}

                {step === 'processing' && (
                    <div className="text-center py-8">
                        <SpinnerIcon className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Submitting Request...</h3>
                    </div>
                )}

                {step === 'success' && (
                    <div className="text-center py-4">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-[#0F172A] dark:text-white mb-2">Request Received</h3>
                        <p className="text-sm text-[#0F172A] dark:text-white mb-6">Reference ID: #REQ-{Math.floor(Math.random() * 100000)}<br/>We will notify you once the review is complete.</p>
                        <button onClick={onClose} className="w-full py-3 bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border dark:border-white/10">
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const AdvancedTransferLimitsDisplay: React.FC<{ limits: AdvancedTransferLimits; transactions: Transaction[] }> = ({ limits, transactions }) => {
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    
    const LimitDetailDisplay: React.FC<{ label: string; value: number | 'Unlimited' }> = ({ label, value }) => (
        <div className="flex justify-between text-sm py-1">
            <span className="text-[#0F172A]">{label}</span>
            <span className="font-semibold text-[#1E293B] font-mono">
                {typeof value === 'number' ? value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : value}
            </span>
        </div>
    );
    
    const LimitCategory: React.FC<{ title: string; icon: React.ReactNode; limit: LimitDetail; used: { daily: number; monthly: number } }> = ({ title, icon, limit, used }) => {
        const dailyProgress = limit.daily !== 'Unlimited' ? (used.daily / limit.daily) * 100 : 0;
        const monthlyProgress = limit.monthly !== 'Unlimited' ? (used.monthly / limit.monthly) * 100 : 0;
        
        return (
            <div className="bg-slate-200 p-4 rounded-lg shadow-digital-inset">
                <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-200 shadow-digital text-primary">{icon}</div>
                    <h4 className="font-bold text-[#1E293B]">{title}</h4>
                </div>
                <div className="space-y-3">
                    {limit.perTransaction && <LimitDetailDisplay label="Per Transaction" value={limit.perTransaction} />}
                    <LimitDetailDisplay label="Daily Limit" value={limit.daily} />
                    {limit.daily !== 'Unlimited' && (
                        <div className="w-full bg-slate-300 rounded-full h-1.5 shadow-inner"><div className="bg-primary h-1.5 rounded-full" style={{ width: `${dailyProgress}%`}}></div></div>
                    )}
                    <LimitDetailDisplay label="Monthly Limit" value={limit.monthly} />
                     {limit.monthly !== 'Unlimited' && (
                        <div className="w-full bg-slate-300 rounded-full h-1.5 shadow-inner"><div className="bg-primary h-1.5 rounded-full" style={{ width: `${monthlyProgress}%`}}></div></div>
                    )}
                </div>
            </div>
        );
    };
    
    // Mock usage data for display purposes
    const p2pUsage = { daily: 350, monthly: 1200 };
    const achUsage = { daily: 5500, monthly: 27000 };
    const wireUsage = { daily: 0, monthly: 50000 };

    return (
        <>
            {isRequestModalOpen && <LimitIncreaseRequestModal onClose={() => setIsRequestModalOpen(false)} />}
            <div className="bg-slate-200 rounded-2xl shadow-digital">
                <div className="p-6 border-b border-slate-300 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[#1E293B]">Advanced Transfer Limits</h2>
                    <button onClick={() => setIsRequestModalOpen(true)} className="text-sm font-semibold text-primary hover:underline">Request Increase</button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <LimitCategory title="Peer-to-Peer (P2P)" icon={<ArrowsRightLeftIcon className="w-6 h-6"/>} limit={limits.p2p} used={p2pUsage} />
                    <LimitCategory title="ACH Bank Transfers" icon={<BankIcon className="w-6 h-6"/>} limit={limits.ach} used={achUsage} />
                    <LimitCategory title="Wire Transfers" icon={<GlobeAmericasIcon className="w-6 h-6"/>} limit={limits.wire} used={wireUsage} />
                    <LimitCategory title="Internal Transfers" icon={<PremiumReservedBankLogo className="w-6 h-6"/>} limit={limits.internal} used={{daily: 0, monthly: 0}} />
                </div>
            </div>
        </>
    );
};

const LoginHistory: React.FC = () => {
    const [timeframe, setTimeframe] = useState<'7D' | '15D' | '30D'>('15D');
    const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
    const [auditLog, setAuditLog] = useState([
        { id: 1, type: 'Login', device: 'iPhone 15 Pro', location: 'New York, NY', ip: '198.162.2.89', authMethod: 'FaceID + Passcode', time: 'Today, 10:42 AM', status: 'Success', statusText: 'Session Active', hash: 'SHA-256: 9e32a4...' },
        { id: 2, type: 'Login', device: 'MacBook Pro', location: 'New York, NY', ip: '198.162.2.89', authMethod: 'Biometric Voice Token', time: 'Yesterday, 8:15 PM', status: 'Success', statusText: 'Cleared', hash: 'SHA-256: 7d11b2...' },
        { id: 3, type: 'Transfer Auth', device: 'Chrome (Windows)', location: 'Unknown/VPN', ip: '45.155.205.12', authMethod: 'SSN + 2FA Challenge', time: 'Feb 20, 2:30 PM', status: 'Blocked', statusText: 'Failed 2FA', hash: 'SHA-256: 3c88e1...' },
        { id: 4, type: 'Password Reset', device: 'MacBook Pro', location: 'New York, NY', ip: '198.162.2.89', authMethod: 'E-mail + SMS OTP', time: 'Feb 18, 11:05 AM', status: 'Success', statusText: 'Password Updated', hash: 'SHA-256: a28fb9...' },
        { id: 5, type: 'Voice Biometric Enrollment', device: 'iPhone 15 Pro', location: 'New York, NY', ip: '198.162.2.89', authMethod: 'Voice Matching Sync', time: 'Feb 15, 04:20 PM', status: 'Success', statusText: 'Enrollment Enforced', hash: 'SHA-256: f19da2...' },
        { id: 6, type: 'Login', device: 'Unknown Device', location: 'Paris, France', ip: '82.120.44.11', authMethod: 'Attempt (Root Exploit Check)', time: 'Feb 12, 01:15 AM', status: 'Failed', statusText: 'Blocked IP', hash: 'SHA-256: d82cb0...' }
    ]);

    const handleRevokeSession = (id: number) => {
        setAuditLog(prev => prev.filter(item => item.id !== id));
        alert("Session terminated successfully. Token revoked from the First Pacific Enclave Vault.");
    };

    const handleReportIncident = (id: number) => {
        alert("Incident reported to the First Pacific Cyber-Security Division. Forensics and telemetry logs are locked.");
    };

    // Full 30 Days Audit Data points
    const AUDIT_DATA = [
        { day: 1, dateStr: 'Feb 1', success: 2, failed: 0, blocked: 0 },
        { day: 2, dateStr: 'Feb 2', success: 3, failed: 0, blocked: 0 },
        { day: 3, dateStr: 'Feb 3', success: 1, failed: 1, blocked: 0 },
        { day: 4, dateStr: 'Feb 4', success: 4, failed: 0, blocked: 0 },
        { day: 5, dateStr: 'Feb 5', success: 2, failed: 0, blocked: 1 },
        { day: 6, dateStr: 'Feb 6', success: 5, failed: 0, blocked: 0 },
        { day: 7, dateStr: 'Feb 7', success: 3, failed: 0, blocked: 0 },
        { day: 8, dateStr: 'Feb 8', success: 6, failed: 0, blocked: 0 },
        { day: 9, dateStr: 'Feb 9', success: 2, failed: 0, blocked: 0 },
        { day: 10, dateStr: 'Feb 10', success: 1, failed: 1, blocked: 0 },
        { day: 11, dateStr: 'Feb 11', success: 4, failed: 0, blocked: 1 },
        { day: 12, dateStr: 'Feb 12', success: 3, failed: 0, blocked: 0 },
        { day: 13, dateStr: 'Feb 13', success: 7, failed: 0, blocked: 0 },
        { day: 14, dateStr: 'Feb 14', success: 5, failed: 0, blocked: 0 },
        { day: 15, dateStr: 'Feb 15', success: 4, failed: 1, blocked: 0 },
        { day: 16, dateStr: 'Feb 16', success: 6, failed: 0, blocked: 0 },
        { day: 17, dateStr: 'Feb 17', success: 3, failed: 0, blocked: 0 },
        { day: 18, dateStr: 'Feb 18', success: 8, failed: 0, blocked: 2 },
        { day: 19, dateStr: 'Feb 19', success: 5, failed: 0, blocked: 0 },
        { day: 20, dateStr: 'Feb 20', success: 4, failed: 1, blocked: 0 },
        { day: 21, dateStr: 'Feb 21', success: 9, failed: 0, blocked: 0 },
        { day: 22, dateStr: 'Feb 22', success: 6, failed: 0, blocked: 0 },
        { day: 23, dateStr: 'Feb 23', success: 5, failed: 0, blocked: 0 },
        { day: 24, dateStr: 'Feb 24', success: 11, failed: 0, blocked: 1 },
        { day: 25, dateStr: 'Feb 25', success: 7, failed: 0, blocked: 0 },
        { day: 26, dateStr: 'Feb 26', success: 4, failed: 0, blocked: 0 },
        { day: 27, dateStr: 'Feb 27', success: 8, failed: 2, blocked: 0 },
        { day: 28, dateStr: 'Feb 28', success: 12, failed: 0, blocked: 0 },
        { day: 29, dateStr: 'Mar 1', success: 6, failed: 0, blocked: 0 },
        { day: 30, dateStr: 'Mar 2', success: 10, failed: 1, blocked: 1 }
    ];

    // Filter points based on timeframe
    const pointsToRender = useMemo(() => {
        const count = timeframe === '7D' ? 7 : timeframe === '15D' ? 15 : 30;
        return AUDIT_DATA.slice(-count);
    }, [timeframe]);

    // Calculate chart dimensions
    const width = 600;
    const height = 220;
    const paddingX = 40;
    const paddingY = 30;
    const chartWidth = width - paddingX * 2;
    const chartHeight = height - paddingY * 2;

    const maxY = useMemo(() => {
        const maxVal = Math.max(...pointsToRender.map(p => p.success + p.failed + p.blocked));
        return Math.max(12, maxVal + 2); // default min height or dynamic max
    }, [pointsToRender]);

    // Calculate line coordinates for Success and Incidents
    const successPoints = useMemo(() => {
        return pointsToRender.map((p, i) => {
            const x = paddingX + (i / (pointsToRender.length - 1)) * chartWidth;
            const y = paddingY + chartHeight - (p.success / maxY) * chartHeight;
            return { x, y, val: p.success, date: p.dateStr, data: p };
        });
    }, [pointsToRender, maxY]);

    const incidentPoints = useMemo(() => {
        return pointsToRender.map((p, i) => {
            const x = paddingX + (i / (pointsToRender.length - 1)) * chartWidth;
            const y = paddingY + chartHeight - ((p.failed + p.blocked) / maxY) * chartHeight;
            return { x, y, val: p.failed + p.blocked, date: p.dateStr, data: p };
        });
    }, [pointsToRender, maxY]);

    // Build SVG paths
    const buildPath = (points: { x: number; y: number }[]) => {
        if (points.length === 0) return '';
        return points.reduce((path, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`, '');
    };

    const buildAreaPath = (points: { x: number; y: number }[]) => {
        if (points.length === 0) return '';
        const linePath = buildPath(points);
        return `${linePath} L ${points[points.length - 1].x} ${paddingY + chartHeight} L ${points[0].x} ${paddingY + chartHeight} Z`;
    };

    const successPath = buildPath(successPoints);
    const successAreaPath = buildAreaPath(successPoints);
    const incidentPath = buildPath(incidentPoints);
    const incidentAreaPath = buildAreaPath(incidentPoints);

    // Dynamic stats
    const totalLogins = pointsToRender.reduce((acc, p) => acc + p.success, 0);
    const totalBlocked = pointsToRender.reduce((acc, p) => acc + p.blocked + p.failed, 0);
    const successPercentage = totalLogins + totalBlocked > 0 
        ? ((totalLogins / (totalLogins + totalBlocked)) * 100).toFixed(1) 
        : '100';

    return (
        <div className="bg-slate-200 rounded-[2.5rem] p-6 sm:p-8 border border-slate-300 shadow-digital" id="interactive-security-audit-dashboard">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-slate-300">
                <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-slate-300 border border-slate-400 px-2.5 py-1 rounded-full">
                        Audit Intelligence Console
                    </span>
                    <h2 className="text-xl font-black text-[#1E293B] uppercase tracking-tight mt-2.5">Interactive Security Audit</h2>
                    <p className="text-xs text-[#0F172A] mt-1">Real-time verification of credential telemetry, device fingerprints, and access patterns.</p>
                </div>

                {/* Timeframe selector */}
                <div className="flex items-center bg-slate-300 p-1.5 rounded-xl border border-slate-400/50">
                    {(['7D', '15D', '30D'] as const).map(tf => (
                        <button
                            key={tf}
                            onClick={() => {
                                setTimeframe(tf);
                                setHoveredIndex(null);
                                setHoveredPoint(null);
                            }}
                            className={`px-3 py-1.5 text-[10px] font-black tracking-wider uppercase rounded-lg transition-all ${
                                timeframe === tf 
                                    ? 'bg-primary text-slate-950 shadow-sm' 
                                    : 'text-[#0F172A] hover:text-[#0F172A]'
                            }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* Top Stat widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-300 border border-slate-300 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                        <span className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest">Sovereign Access Rate</span>
                        <p className="text-xl font-black text-[#1E293B] font-mono mt-1">{successPercentage}%</p>
                    </div>
                    <span className="text-xl">🛡️</span>
                </div>
                <div className="bg-slate-300 border border-slate-300 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                        <span className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest">Total Cleared Logins</span>
                        <p className="text-xl font-black text-[#1E293B] font-mono mt-1">{totalLogins}</p>
                    </div>
                    <span className="text-xl">🟢</span>
                </div>
                <div className="bg-slate-300 border border-slate-300 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                        <span className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest">Challenges & Blocks</span>
                        <p className="text-xl font-black text-[#1E293B] font-mono mt-1">{totalBlocked}</p>
                    </div>
                    <span className="text-xl">⚠️</span>
                </div>
            </div>

            {/* Line Chart Workspace */}
            <div className="relative bg-slate-300 rounded-3xl p-4 sm:p-6 border border-slate-300 overflow-hidden mb-8">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#0F172A]">Access Telemetry Chart ({timeframe})</span>
                    <div className="flex items-center gap-3 text-[8.5px] font-extrabold uppercase tracking-widest">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span> Cleared Logins</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 block"></span> Security Challenges</span>
                    </div>
                </div>

                <div className="relative w-full aspect-[600/220]">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                        <defs>
                            <linearGradient id="successGlow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                            </linearGradient>
                            <linearGradient id="incidentGlow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
                                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                            </linearGradient>
                        </defs>

                        {/* Y-Axis Grid Lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
                            const y = paddingY + chartHeight * p;
                            const gridVal = Math.round(maxY - maxY * p);
                            return (
                                <g key={i} className="opacity-40">
                                    <line 
                                        x1={paddingX} 
                                        y1={y} 
                                        x2={width - paddingX} 
                                        y2={y} 
                                        stroke="#94a3b8" 
                                        strokeWidth="1" 
                                        strokeDasharray="4 4" 
                                    />
                                    <text 
                                        x={paddingX - 10} 
                                        y={y + 4} 
                                        textAnchor="end" 
                                        className="fill-slate-500 font-mono text-[9px] font-bold"
                                    >
                                        {gridVal}
                                    </text>
                                </g>
                            );
                        })}

                        {/* X-Axis Labels (Date Labels) */}
                        {pointsToRender.map((p, i) => {
                            // Show labels on subsets to prevent text overlapping
                            const divisor = pointsToRender.length > 15 ? 5 : pointsToRender.length > 7 ? 3 : 1;
                            if (i % divisor !== 0 && i !== pointsToRender.length - 1) return null;
                            const x = paddingX + (i / (pointsToRender.length - 1)) * chartWidth;
                            return (
                                <text 
                                    key={i} 
                                    x={x} 
                                    y={height - 8} 
                                    textAnchor="middle" 
                                    className="fill-slate-500 font-mono text-[9px] font-bold"
                                >
                                    {p.dateStr}
                                </text>
                            );
                        })}

                        {/* Chart Area Fills */}
                        {successAreaPath && (
                            <path d={successAreaPath} fill="url(#successGlow)" className="pointer-events-none" />
                        )}
                        {incidentAreaPath && (
                            <path d={incidentAreaPath} fill="url(#incidentGlow)" className="pointer-events-none" />
                        )}

                        {/* Chart Lines */}
                        {successPath && (
                            <path 
                                d={successPath} 
                                fill="none" 
                                stroke="#10b981" 
                                strokeWidth="2.5" 
                                strokeLinecap="round"
                                className="pointer-events-none" 
                            />
                        )}
                        {incidentPath && (
                            <path 
                                d={incidentPath} 
                                fill="none" 
                                stroke="#f59e0b" 
                                strokeWidth="2" 
                                strokeLinecap="round"
                                className="pointer-events-none" 
                            />
                        )}

                        {/* Horizontal Hover Indicator Line */}
                        {hoveredIndex !== null && (
                            <line 
                                x1={paddingX + (hoveredIndex / (pointsToRender.length - 1)) * chartWidth}
                                y1={paddingY}
                                x2={paddingX + (hoveredIndex / (pointsToRender.length - 1)) * chartWidth}
                                y2={paddingY + chartHeight}
                                stroke="#1e293b"
                                strokeWidth="1.5"
                                strokeDasharray="2 2"
                                className="pointer-events-none opacity-60"
                            />
                        )}

                        {/* Success / Incident Data Dots */}
                        {successPoints.map((p, i) => {
                            const isHovered = hoveredIndex === i;
                            return (
                                <g key={i} className="cursor-pointer">
                                    <circle 
                                        cx={p.x} 
                                        cy={p.y} 
                                        r={isHovered ? 6 : 3.5} 
                                        fill="#10b981" 
                                        stroke="#ffffff" 
                                        strokeWidth={isHovered ? 2 : 1}
                                        className="transition-all duration-150"
                                    />
                                    {/* Invisible large hover triggers */}
                                    <rect 
                                        x={p.x - chartWidth / (pointsToRender.length * 2)} 
                                        y={paddingY} 
                                        width={chartWidth / pointsToRender.length} 
                                        height={chartHeight} 
                                        fill="transparent"
                                        onMouseEnter={() => {
                                            setHoveredIndex(i);
                                            setHoveredPoint(p);
                                        }}
                                        onMouseLeave={() => {
                                            setHoveredIndex(null);
                                            setHoveredPoint(null);
                                        }}
                                    />
                                </g>
                            );
                        })}

                        {incidentPoints.map((p, i) => {
                            const isHovered = hoveredIndex === i;
                            return (
                                <circle 
                                    key={i}
                                    cx={p.x} 
                                    cy={p.y} 
                                    r={isHovered ? 5.5 : 3} 
                                    fill="#f59e0b" 
                                    stroke="#ffffff" 
                                    strokeWidth={isHovered ? 1.5 : 1}
                                    className="transition-all duration-150 pointer-events-none"
                                />
                            );
                        })}
                    </svg>

                    {/* Interactive Chart Tooltip Portal overlay */}
                    {hoveredPoint && hoveredPoint.data && (
                        <div 
                            style={{ 
                                left: `${(hoveredIndex! / (pointsToRender.length - 1)) * 100}%`,
                                transform: 'translateX(-50%)' 
                            }}
                            className="absolute top-1/4 bg-slate-50 border border-slate-300 text-white rounded-xl p-3 shadow-xl pointer-events-none z-30 min-w-[150px] transition-all dark:bg-slate-900"
                        >
                            <p className="text-[10px] font-black tracking-widest text-primary uppercase border-b border-black/5 pb-1">{hoveredPoint.data.dateStr}</p>
                            <div className="mt-2 space-y-1 font-mono text-[9px] font-bold">
                                <div className="flex justify-between gap-4">
                                    <span className="text-emerald-400">🟢 Cleared:</span>
                                    <span>{hoveredPoint.data.success}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-amber-400">⚠️ Blocked:</span>
                                    <span>{hoveredPoint.data.blocked}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-red-400">🔴 Failed:</span>
                                    <span>{hoveredPoint.data.failed}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Interactive Events Ledger */}
            <div className="bg-slate-300 border border-slate-300 rounded-[2rem] overflow-hidden">
                <div className="p-5 border-b border-slate-300 flex justify-between items-center bg-slate-300">
                    <span className="text-xs font-black uppercase tracking-wider text-[#0F172A]">Security Events Log (Interactive)</span>
                    <span className="text-[10px] font-black text-[#0F172A] font-mono">{auditLog.length} Registered Nodes</span>
                </div>
                
                <div className="p-4 divide-y divide-slate-300">
                    {auditLog.map(event => {
                        const isExpanded = expandedEventId === event.id;
                        const isSuccess = event.status === 'Success';
                        const isBlocked = event.status === 'Blocked';

                        return (
                            <div key={event.id} className="py-3.5 first:pt-0 last:pb-0 transition-all">
                                <div 
                                    onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                                    className="flex justify-between items-center cursor-pointer hover:bg-slate-300 p-1.5 rounded-xl transition-all"
                                >
                                    <div className="min-w-0 pr-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">
                                                {event.type.includes('Login') ? '🖥️' : event.type.includes('Auth') ? '🔑' : '⚙️'}
                                            </span>
                                            <p className="font-bold text-[#1E293B] text-sm truncate">{event.type}</p>
                                        </div>
                                        <p className="text-[10.5px] text-[#0F172A] font-bold mt-1 truncate">
                                            {event.device} • {event.location} • <strong className="font-mono text-[9px]">{event.ip}</strong>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className={`text-[9.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                            isSuccess 
                                                ? 'bg-green-100 text-green-700' 
                                                : isBlocked 
                                                    ? 'bg-amber-100 text-amber-700' 
                                                    : 'bg-red-100 text-red-700'
                                        }`}>
                                            {event.status}
                                        </span>
                                        <svg className={`w-4 h-4 text-[#0F172A] transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Expanded Security Parameters */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden mt-3 bg-slate-300 border border-slate-300 rounded-2xl p-4 space-y-4"
                                        >
                                            <div className="grid grid-cols-2 gap-4 text-xs">
                                                <div>
                                                    <span className="text-[8.5px] font-black text-[#0F172A] uppercase tracking-widest block">Authentication Method</span>
                                                    <span className="text-[#0F172A] font-bold mt-0.5 block">{event.authMethod}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[8.5px] font-black text-[#0F172A] uppercase tracking-widest block">Timestamp</span>
                                                    <span className="text-[#0F172A] font-semibold mt-0.5 block">{event.time}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[8.5px] font-black text-[#0F172A] uppercase tracking-widest block">Security Status</span>
                                                    <span className="text-[#0F172A] font-bold mt-0.5 block">{event.statusText}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[8.5px] font-black text-[#0F172A] uppercase tracking-widest block">Ledger Cryptographic Hash</span>
                                                    <span className="text-indigo-600 font-mono font-bold mt-0.5 block select-all">{event.hash}</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 pt-2 border-t border-slate-300/60 justify-end">
                                                <button 
                                                    onClick={() => handleReportIncident(event.id)}
                                                    className="px-3.5 py-1.5 bg-slate-300 hover:bg-slate-400 text-[10px] text-[#0F172A] font-black uppercase tracking-wider rounded-lg transition-all"
                                                >
                                                    Report Node
                                                </button>
                                                {isSuccess && (
                                                    <button 
                                                        onClick={() => handleRevokeSession(event.id)}
                                                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all shadow-sm shadow-rose-600/15"
                                                    >
                                                        Revoke Session
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

interface SecurityPostureSummaryProps {
  securitySettings: SecuritySettings;
  trustedDevices: TrustedDevice[];
  pushNotificationSettings: PushNotificationSettings;
}

const SecurityPostureSummary: React.FC<SecurityPostureSummaryProps> = ({ securitySettings, trustedDevices, pushNotificationSettings }) => {
    const score = useMemo(() => {
        let pct = 40; // Base score
        if (securitySettings.mfa.enabled) pct += 30;
        
        // Device factor
        if (trustedDevices.length === 1) pct += 20;
        else if (trustedDevices.length === 2) pct += 15;
        else if (trustedDevices.length >= 3) pct += 10;
        
        // Monitoring/Alerts factor
        if (securitySettings.darkWebMonitoringEnabled) pct += 5;
        if (securitySettings.transactionMonitoringEnabled) pct += 5;
        
        return Math.min(100, pct);
    }, [securitySettings, trustedDevices]);

    const circumference = 2 * Math.PI * 40;
    const strokeDashoffset = circumference * (1 - score / 100);
    const scoreColor = score >= 85 ? 'text-green-500' : score >= 65 ? 'text-yellow-500' : 'text-red-500';
    const scoreStrokeColor = score >= 85 ? 'stroke-green-500' : score >= 65 ? 'stroke-yellow-500' : 'stroke-red-500';
    const scoreBgColor = score >= 85 ? 'bg-green-100 dark:bg-green-500 text-green-700 dark:text-green-400' : score >= 65 ? 'bg-yellow-100 dark:bg-yellow-500 text-yellow-700 dark:text-yellow-400' : 'bg-red-100 dark:bg-red-500 text-red-700 dark:text-red-400';

    return (
        <div className="bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-2xl shadow-digital p-6 text-[#0F172A] dark:text-white">
            <div className="border-b border-slate-300 dark:border-white/10 pb-4 mb-4 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Security Posture Summary</h3>
                    <p className="text-xs text-[#0F172A] dark:text-white">Analysis of your direct identity defense and active alerts.</p>
                </div>
                <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider ${scoreBgColor}`}>
                    {score >= 85 ? 'STABLE' : score >= 65 ? 'WARNING' : 'CRITICAL'}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Visual Circle Meter */}
                <div className="flex flex-col items-center justify-center p-6 bg-slate-300 dark:bg-slate-800 rounded-xl border border-slate-300/50 dark:border-white/10">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="none" strokeWidth="8" className="stroke-slate-300 dark:stroke-slate-800" />
                            <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                className={`transition-all duration-1000 ease-out ${scoreStrokeColor}`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-2xl font-black font-mono tracking-tighter ${scoreColor}`}>{score}%</span>
                            <span className="text-[9px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest mt-0.5">POSTURE</span>
                        </div>
                    </div>
                </div>

                {/* Posture Calculations & Indicators */}
                <div className="md:col-span-2 space-y-3.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${securitySettings.mfa.enabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            <span className="text-xs font-bold text-[#0F172A] dark:text-white">Two-Factor Authentication (2FA)</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${securitySettings.mfa.enabled ? 'bg-green-100 dark:bg-green-500 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-500 text-red-700 dark:text-red-400'}`}>
                            {securitySettings.mfa.enabled ? 'SECURE (+30%)' : 'MISSING (0%)'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-xs font-bold text-[#0F172A] dark:text-white">Verified Device Control</span>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-[#0F172A] dark:text-white">
                            {trustedDevices.length} Sessions ({trustedDevices.length === 1 ? '+20%' : trustedDevices.length === 2 ? '+15%' : '+10%'})
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${(pushNotificationSettings.alertOnFlaggedEnabled !== false) ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            <span className="text-xs font-bold text-[#0F172A] dark:text-white">Active Transaction Alerts</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${(pushNotificationSettings.alertOnFlaggedEnabled !== false) ? 'bg-green-100 dark:bg-green-500 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-500 text-yellow-700 dark:text-yellow-405'}`}>
                            {(pushNotificationSettings.alertOnFlaggedEnabled !== false) ? 'OPTIMIZED (+10%)' : 'PARTIAL (+5%)'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Alert / Activity Logs History feed */}
            <div className="mt-6 pt-5 border-t border-slate-300 dark:border-white/10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-white mb-3 flex items-center gap-1.5 font-mono">
                    <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
                    Security Posture Verification Logs
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {securitySettings.mfa.enabled ? (
                        <div className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-950 border border-green-500/10 text-xs text-green-800 dark:text-green-400 font-mono">
                            <span>🛡️ MFA SHIELD ACTIVE - DUAL-TOKEN AUTHENTICATED</span>
                            <span className="text-[10px] opacity-75">SECURE</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-500/10 text-xs text-yellow-800 dark:text-yellow-400 font-mono animate-pulse">
                            <span>⚠️ ATTENTION - 2FA OFFLINE: ENHANCED PERIMETER DEFENSE ADVISED</span>
                            <span className="text-[10px] opacity-75">PENDING</span>
                        </div>
                    )}
                    {trustedDevices.map((dev, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-400/10 text-xs text-[#0F172A] dark:text-white font-mono">
                            <span>💻 TRUSTED ENDPOINT: {dev.browser} ({dev.location})</span>
                            <span className="text-[10px] opacity-75">{new Date(dev.lastLogin).toLocaleDateString()}</span>
                        </div>
                    ))}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-400/10 text-xs text-[#0F172A] dark:text-white font-mono">
                        <span>🛰️ RECENT ENCLAVE COPROCESSOR HEALTH CHECK HANDSHAKE</span>
                        <span className="text-[10px] opacity-75">HEALTHY</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const REGION_DISTANCES: Record<string, Record<string, number>> = {
  'Guntersville, AL (North America)': {
    'Guntersville, AL (North America)': 0,
    'New York, NY (USA)': 1350,
    'London, UK (Europe)': 6820,
    'Tokyo, Japan (Asia)': 10850,
    'Frankfurt, Germany (Europe)': 7450,
    'Paris, France (Europe)': 7100,
    'Dubai, UAE (Middle East)': 12200,
    'Sydney, Australia (Oceania)': 14600,
  },
  'New York, NY (USA)': {
    'Guntersville, AL (North America)': 1350,
    'New York, NY (USA)': 0,
    'London, UK (Europe)': 5570,
    'Tokyo, Japan (Asia)': 10850,
    'Frankfurt, Germany (Europe)': 6200,
    'Paris, France (Europe)': 5840,
    'Dubai, UAE (Middle East)': 11000,
    'Sydney, Australia (Oceania)': 15900,
  },
  'London, UK (Europe)': {
    'Guntersville, AL (North America)': 6820,
    'New York, NY (USA)': 5570,
    'London, UK (Europe)': 0,
    'Tokyo, Japan (Asia)': 9560,
    'Frankfurt, Germany (Europe)': 640,
    'Paris, France (Europe)': 340,
    'Dubai, UAE (Middle East)': 5470,
    'Sydney, Australia (Oceania)': 16900,
  }
};

const calculateGeofenceDistance = (home?: string, detected?: string): number => {
  const h = home || 'Guntersville, AL (North America)';
  const d = detected || 'Guntersville, AL (North America)';
  if (h === d) return 0;
  if (REGION_DISTANCES[h] && REGION_DISTANCES[h][d] !== undefined) return REGION_DISTANCES[h][d];
  if (REGION_DISTANCES[d] && REGION_DISTANCES[d][h] !== undefined) return REGION_DISTANCES[d][h];
  return 4850;
};

interface RegionMapNode {
  name: string;
  x: number;
  y: number;
  lat: string;
  lon: string;
  flag: string;
  shortName: string;
}

const REGION_MAP_NODES: Record<string, RegionMapNode> = {
  'Guntersville, AL (North America)': { name: 'Guntersville, AL (North America)', x: 250, y: 165, lat: '34.358° N', lon: '-86.294° W', flag: '🇺🇸', shortName: 'Guntersville (Home)' },
  'New York, NY (USA)': { name: 'New York, NY (USA)', x: 290, y: 145, lat: '40.712° N', lon: '-74.006° W', flag: '🇺🇸', shortName: 'New York' },
  'London, UK (Europe)': { name: 'London, UK (Europe)', x: 475, y: 115, lat: '51.507° N', lon: '-0.127° E', flag: '🇬🇧', shortName: 'London' },
  'Frankfurt, Germany (Europe)': { name: 'Frankfurt, Germany (Europe)', x: 510, y: 120, lat: '50.110° N', lon: '8.682° E', flag: '🇩🇪', shortName: 'Frankfurt' },
  'Paris, France (Europe)': { name: 'Paris, France (Europe)', x: 490, y: 125, lat: '48.856° N', lon: '2.352° E', flag: '🇫🇷', shortName: 'Paris' },
  'Tokyo, Japan (Asia)': { name: 'Tokyo, Japan (Asia)', x: 790, y: 155, lat: '35.676° N', lon: '139.650° E', flag: '🇯🇵', shortName: 'Tokyo' },
  'Dubai, UAE (Middle East)': { name: 'Dubai, UAE (Middle East)', x: 615, y: 185, lat: '25.204° N', lon: '55.270° E', flag: '🇦🇪', shortName: 'Dubai' },
  'Sydney, Australia (Oceania)': { name: 'Sydney, Australia (Oceania)', x: 830, y: 315, lat: '-33.868° S', lon: '151.209° E', flag: '🇦🇺', shortName: 'Sydney' }
};

interface GeofenceMapOverlayProps {
  homeRegion: string;
  currentRegion: string;
  travelModeEnabled: boolean;
  geofenceSensitivityKm: number;
  geofenceAlertsEnabled: boolean;
  onSelectRegion: (regionName: string) => void;
  onResetHome: () => void;
  shiftAlert: {
    detectedRegion: string;
    homeRegion: string;
    distanceKm: number;
    timestamp: string;
    status: 'ACTIVE_WARNING' | 'AUTHORIZED' | 'FLAGGED';
  } | null;
}

const GeofenceMapOverlay: React.FC<GeofenceMapOverlayProps> = ({
  homeRegion,
  currentRegion,
  travelModeEnabled,
  geofenceSensitivityKm,
  geofenceAlertsEnabled,
  onSelectRegion,
  onResetHome,
  shiftAlert
}) => {
  const [mapMode, setMapMode] = useState<'tactical' | 'satellite' | 'vector'>('tactical');
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const homeNode = REGION_MAP_NODES[homeRegion] || REGION_MAP_NODES['Guntersville, AL (North America)'];
  const currNode = REGION_MAP_NODES[currentRegion] || homeNode;

  const distanceKm = calculateGeofenceDistance(homeRegion, currentRegion);
  const isShiftDetected = distanceKm > geofenceSensitivityKm;

  // Calculate radius in SVG px coordinates relative to sensitivity limit
  const geofenceRadiusPx = Math.min(110, Math.max(32, Math.round(geofenceSensitivityKm * 0.18 + 22)));

  // Curve midpoints for flight arc
  const midX = (homeNode.x + currNode.x) / 2;
  const midY = Math.min(homeNode.y, currNode.y) - 55;

  return (
    <div className="bg-slate-100 rounded-2xl p-5 border border-cyan-500/30 text-white shadow-2xl overflow-hidden relative font-sans space-y-4">
      {/* Dynamic Header HUD */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500 border border-cyan-500/30 text-cyan-400 rounded-xl animate-pulse">
            <GlobeAmericasIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100 tracking-wide uppercase">
                Satellite Geofence Telemetry Radar
              </h3>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 uppercase tracking-widest">
                Real-Time Node Tracking
              </span>
            </div>
            <p className="text-[11px] text-[#0F172A]">
              Live orbital projection comparing registered home geofence boundary against telemetry node.
            </p>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {travelModeEnabled ? (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-cyan-500 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              Travel Mode Enforced
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white text-[#0F172A] border border-slate-300 dark:bg-slate-800">
              Home Monitoring Standby
            </span>
          )}

          {isShiftDetected ? (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-500 text-red-400 border border-red-500/40 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              ⚠️ Drift Shift: {distanceKm.toLocaleString()} km
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Verified Baseline (0 km)
            </span>
          )}

          {/* Mode Toggles */}
          <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-0.5 text-[10px] font-mono font-bold dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setMapMode('tactical')}
              className={`px-2 py-1 rounded ${mapMode === 'tactical' ? 'bg-cyan-500 text-cyan-300 font-black' : 'text-[#0F172A] hover:text-white'}`}
            >
              Tactical
            </button>
            <button
              type="button"
              onClick={() => setMapMode('satellite')}
              className={`px-2 py-1 rounded ${mapMode === 'satellite' ? 'bg-cyan-500 text-cyan-300 font-black' : 'text-[#0F172A] hover:text-white'}`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setMapMode('vector')}
              className={`px-2 py-1 rounded ${mapMode === 'vector' ? 'bg-cyan-500 text-cyan-300 font-black' : 'text-[#0F172A] hover:text-white'}`}
            >
              Vector
            </button>
          </div>
        </div>
      </div>

      {/* Main SVG Radar Projection Canvas */}
      <div className="relative w-full rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shadow-inner">
        {/* Decorative Grid Lines Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none"></div>

        <svg
          viewBox="0 0 900 420"
          className="w-full h-auto select-none"
          style={{ minHeight: '320px' }}
        >
          <defs>
            {/* Geofence Radial Gradient Glow */}
            <radialGradient id="geofenceGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>

            {/* Alert Geofence Gradient Glow */}
            <radialGradient id="alertGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>

            {/* Linear Arc Gradient */}
            <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          {/* Latitude & Longitude Reference Grid Lines */}
          <g stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4">
            <line x1="0" y1="70" x2="900" y2="70" />
            <line x1="0" y1="140" x2="900" y2="140" />
            <line x1="0" y1="210" x2="900" y2="210" />
            <line x1="0" y1="280" x2="900" y2="280" />
            <line x1="0" y1="350" x2="900" y2="350" />

            <line x1="150" y1="0" x2="150" y2="420" />
            <line x1="300" y1="0" x2="300" y2="420" />
            <line x1="450" y1="0" x2="450" y2="420" />
            <line x1="600" y1="0" x2="600" y2="420" />
            <line x1="750" y1="0" x2="750" y2="420" />
          </g>

          {/* Meridian Labels */}
          <g className="text-[9px] font-mono fill-slate-600 font-bold">
            <text x="10" y="20">LAT 60°N</text>
            <text x="10" y="215">LAT 0° EQUATOR</text>
            <text x="10" y="380">LAT 60°S</text>
            <text x="155" y="410">120°W</text>
            <text x="305" y="410">60°W</text>
            <text x="455" y="410">0° GMT</text>
            <text x="605" y="410">60°E</text>
            <text x="755" y="410">120°E</text>
          </g>

          {/* Stylized Continent Outlines */}
          <g fill="#1e293b" stroke="#334155" strokeWidth="1" opacity="0.6">
            {/* North America */}
            <path d="M 140,80 Q 220,60 310,90 T 280,190 L 180,180 Z" />
            {/* South America */}
            <path d="M 270,220 Q 320,230 300,340 T 260,270 Z" />
            {/* Europe */}
            <path d="M 440,75 Q 520,65 540,125 T 460,135 Z" />
            {/* Africa */}
            <path d="M 440,155 Q 530,165 510,310 T 430,215 Z" />
            {/* Asia */}
            <path d="M 545,65 Q 760,55 850,145 T 615,195 Z" />
            {/* Australia */}
            <path d="M 760,265 Q 860,255 840,365 T 745,315 Z" />
          </g>

          {/* GEOFENCE HIGHLIGHTED CIRCLE OVERLAY (Centered on Home Base) */}
          <g>
            {/* Expanding Ping Pulse Outer Ring */}
            <circle
              cx={homeNode.x}
              cy={homeNode.y}
              r={geofenceRadiusPx + 18}
              fill="rgba(6, 182, 212, 0.05)"
              stroke="#06b6d4"
              strokeWidth="1"
              strokeDasharray="4 4"
              className="animate-ping"
              style={{ transformOrigin: `${homeNode.x}px ${homeNode.y}px` }}
            />

            {/* Radial Glow Highlight Circle */}
            <circle
              cx={homeNode.x}
              cy={homeNode.y}
              r={geofenceRadiusPx}
              fill="url(#geofenceGlow)"
              stroke="#06b6d4"
              strokeWidth="2"
              strokeDasharray="6 3"
            />

            {/* Perimeter Text Indicator */}
            <text
              x={homeNode.x}
              y={homeNode.y + geofenceRadiusPx + 14}
              textAnchor="middle"
              className="text-[9px] font-mono font-black fill-cyan-400 tracking-wider"
            >
              GEOFENCE ZONE ({geofenceSensitivityKm} KM RADIUS)
            </text>
          </g>

          {/* FLIGHT VECTOR TRAJECTORY ARC (When Current !== Home) */}
          {homeRegion !== currentRegion && (
            <g>
              {/* Outer Arc Glow */}
              <path
                d={`M ${homeNode.x} ${homeNode.y} Q ${midX} ${midY} ${currNode.x} ${currNode.y}`}
                fill="none"
                stroke="url(#arcGradient)"
                strokeWidth="3.5"
                strokeOpacity="0.4"
              />

              {/* Animated Dashed Trajectory Line */}
              <path
                d={`M ${homeNode.x} ${homeNode.y} Q ${midX} ${midY} ${currNode.x} ${currNode.y}`}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="6 6"
                className="animate-pulse"
              />

              {/* Trajectory Distance Telemetry HUD Pill */}
              <g transform={`translate(${midX}, ${midY})`}>
                <rect
                  x="-75"
                  y="-14"
                  width="150"
                  height="26"
                  rx="6"
                  fill="#0f172a"
                  stroke={isShiftDetected ? '#ef4444' : '#06b6d4'}
                  strokeWidth="1.5"
                  className="shadow-lg"
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  className={`text-[9.5px] font-mono font-black ${isShiftDetected ? 'fill-red-400' : 'fill-cyan-300'} tracking-wider`}
                >
                  ⚡ DRIFT: {distanceKm.toLocaleString()} KM
                </text>
              </g>
            </g>
          )}

          {/* REGIONAL TELEMETRY NODES (Clickable Pins) */}
          {Object.values(REGION_MAP_NODES).map((node) => {
            const isHome = node.name === homeRegion;
            const isCurrent = node.name === currentRegion;
            const isHovered = hoveredRegion === node.name;

            return (
              <g
                key={node.name}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer group"
                onClick={() => onSelectRegion(node.name)}
                onMouseEnter={() => setHoveredRegion(node.name)}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                {/* Node Target Ping Circle */}
                <circle
                  r={isHome || isCurrent ? '12' : '6'}
                  fill={isHome ? '#06b6d4' : isCurrent && isShiftDetected ? '#ef4444' : isCurrent ? '#10b981' : '#334155'}
                  fillOpacity={isHome || isCurrent ? '0.25' : '0.6'}
                  stroke={isHome ? '#06b6d4' : isCurrent && isShiftDetected ? '#ef4444' : isCurrent ? '#10b981' : '#64748b'}
                  strokeWidth={isHome || isCurrent ? '2' : '1'}
                  className={isHome || isCurrent ? 'animate-pulse' : ''}
                />

                {/* Inner Node Dot */}
                <circle
                  r={isHome || isCurrent ? '5' : '3'}
                  fill={isHome ? '#22d3ee' : isCurrent && isShiftDetected ? '#f87171' : isCurrent ? '#34d399' : '#94a3b8'}
                />

                {/* Node Text Badge Label */}
                <g transform="translate(0, -16)">
                  {isHome ? (
                    <g transform="translate(-50, -10)">
                      <rect x="0" y="0" width="100" height="18" rx="4" fill="#082f49" stroke="#06b6d4" strokeWidth="1" />
                      <text x="50" y="12" textAnchor="middle" className="text-[9px] font-mono font-black fill-cyan-300">
                        🏠 HOME BASE
                      </text>
                    </g>
                  ) : isCurrent ? (
                    <g transform="translate(-55, -10)">
                      <rect
                        x="0"
                        y="0"
                        width="110"
                        height="18"
                        rx="4"
                        fill={isShiftDetected ? '#450a0a' : '#064e3b'}
                        stroke={isShiftDetected ? '#ef4444' : '#10b981'}
                        strokeWidth="1"
                      />
                      <text
                        x="55"
                        y="12"
                        textAnchor="middle"
                        className={`text-[9px] font-mono font-black ${isShiftDetected ? 'fill-red-400' : 'fill-emerald-300'}`}
                      >
                        {isShiftDetected ? '🚨 SHIFT DETECTED' : '✓ VERIFIED LOC'}
                      </text>
                    </g>
                  ) : (
                    <text
                      x="0"
                      y="0"
                      textAnchor="middle"
                      className={`text-[9px] font-mono font-bold ${isHovered ? 'fill-cyan-300 scale-110' : 'fill-slate-400'} transition-all`}
                    >
                      {node.flag} {node.shortName}
                    </text>
                  )}
                </g>
              </g>
            );
          })}
        </svg>

        {/* Real-Time Telemetry Terminal Ticker overlayed at bottom */}
        <div className="bg-slate-50  border-t border-slate-200 px-4 py-2.5 flex flex-wrap justify-between items-center text-[10px] font-mono text-[#0F172A] gap-2 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              RADAR LOCK: ACTIVE
            </span>
            <span className="hidden sm:inline text-[#0F172A]">|</span>
            <span className="hidden sm:inline">HOME REGION: <strong className="text-[#1E293B]">{homeNode.shortName}</strong> ({homeNode.lat})</span>
          </div>

          <div className="flex items-center gap-3">
            <span>DETECTED NODE: <strong className={isShiftDetected ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>{currNode.shortName}</strong> ({currNode.lat})</span>
            <span className="text-[#0F172A]">|</span>
            <span className="text-[#0F172A]">ENCLAVE SYNC: 100%</span>
          </div>
        </div>
      </div>

      {/* Quick Location Shift Selector Chips (Directly on Map Card) */}
      <div className="space-y-2 pt-1">
        <div className="flex justify-between items-center text-[11px] font-mono font-bold text-[#0F172A]">
          <span>INTERACTIVE NODE SELECTION:</span>
          <span className="text-cyan-400 text-[10px]">Click any node or button to test real-time location shift</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.values(REGION_MAP_NODES).map((node) => {
            const isHome = node.name === homeRegion;
            const isCurrent = node.name === currentRegion;
            const dist = calculateGeofenceDistance(homeRegion, node.name);

            return (
              <button
                key={node.name}
                type="button"
                onClick={() => onSelectRegion(node.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 border ${
                  isCurrent
                    ? dist > geofenceSensitivityKm
                      ? 'bg-red-500 border-red-500/50 text-red-300 font-black shadow-lg shadow-red-500/10'
                      : 'bg-emerald-500 border-emerald-500/50 text-emerald-300 font-black shadow-lg shadow-emerald-500/10'
                    : isHome
                    ? 'bg-cyan-500 border-cyan-500/40 text-cyan-300'
                    : 'bg-slate-50 border-slate-200 text-[#0F172A] hover:bg-white hover:text-[#1E293B]'
                }`}
              >
                <span>{node.flag}</span>
                <span>{node.shortName}</span>
                <span className="text-[10px] opacity-75">
                  ({dist === 0 ? 'Home' : `${dist}km`})
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={onResetHome}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-600 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1"
          >
            🏠 Reset to Home Base
          </button>
        </div>
      </div>
    </div>
  );
};

export const Security: React.FC<SettingsProps> = ({ 
    advancedTransferLimits,
    onUpdateAdvancedLimits,
    cards,
    onUpdateCardControls,
    verificationLevel, 
    onVerificationComplete,
    securitySettings,
    onUpdateSecuritySettings,
    trustedDevices,
    onRevokeDevice,
    onChangePassword,
    transactions,
    pushNotificationSettings,
    onUpdatePushNotificationSettings,
    userProfile,
    onUpdateProfilePicture,
    privacySettings,
    onUpdatePrivacySettings,
    onDeleteAccountPermanently,
}) => {
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [isBiometricsModalOpen, setIsBiometricsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [deviceToRevoke, setDeviceToRevoke] = useState<TrustedDevice | null>(null);
  const [isLockdownModalOpen, setIsLockdownModalOpen] = useState(false);

  // Biological Security Settings Interactive Simulation
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [diagnosticProgress, setDiagnosticProgress] = useState(0);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);
  const [biometricMethod, setBiometricMethod] = useState<'FaceID' | 'Fingerprint' | 'WindowsHello'>('FaceID');
  const [testBiometricStatus, setTestBiometricStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testBiometricMessage, setTestBiometricMessage] = useState<string>('');

  const handleTestBiometricUnlock = async () => {
    setTestBiometricStatus('testing');
    setTestBiometricMessage('Triggering device biometric verification prompt...');
    try {
      const verified = await authenticateBiometric();
      if (verified) {
        setTestBiometricStatus('success');
        setTestBiometricMessage('Device biometric authenticated successfully!');
      } else {
        setTestBiometricStatus('failed');
        setTestBiometricMessage('Biometric verification failed or was cancelled.');
      }
    } catch (err: any) {
      setTestBiometricStatus('failed');
      setTestBiometricMessage('Biometric verification error: ' + (err?.message || 'Unknown error'));
    }
  };

  // First Pacific Voice & Force Root Sandbox State
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceActiveListening, setVoiceActiveListening] = useState(false);
  const [voiceWaveBars, setVoiceWaveBars] = useState<number[]>([15, 30, 10, 45, 20, 15, 30, 10]);
  const [selectedVoiceCommand, setSelectedVoiceCommand] = useState<string>('');
  const [voiceOutputMessage, setVoiceOutputMessage] = useState<string>('Voice Engine Standby. Toggle on to engage First Pacific acoustic neural nets.');
  
  const [rootPrivilegeEnabled, setRootPrivilegeEnabled] = useState(false);
  const [rootCheckStatus, setRootCheckStatus] = useState<'idle' | 'escalating' | 'rooted' | 'failed'>('idle');
  const [rootConsoleLogs, setRootConsoleLogs] = useState<string[]>([]);

  // Real-time Device Integrity Enclave Telemetry State
  const [enclaveLatency, setEnclaveLatency] = useState(0.18);
  const [enclaveSyncCount, setEnclaveSyncCount] = useState(144);
  const [enclaveHash, setEnclaveHash] = useState('0x9F4C0D2EA7B1');
  const [enclaveActiveSignal, setEnclaveActiveSignal] = useState(true);

  // Terminal Account Deletion States
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'dispatch_log'>('overview');

  // Travel Mode & Location Geofencing State
  const [geofenceShiftAlert, setGeofenceShiftAlert] = useState<{
    detectedRegion: string;
    homeRegion: string;
    distanceKm: number;
    timestamp: string;
    status: 'ACTIVE_WARNING' | 'AUTHORIZED' | 'FLAGGED';
  } | null>(null);

  const [geofenceLogHistory, setGeofenceLogHistory] = useState<Array<{
    id: string;
    timestamp: string;
    location: string;
    distanceKm: number;
    status: 'HOME_MATCH' | 'AUTHORIZED_TRAVEL' | 'ALERT_TRIGGERED';
  }>>([
    {
      id: 'geo-init',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: securitySettings.registeredHomeRegion || 'Guntersville, AL (North America)',
      distanceKm: 0,
      status: 'HOME_MATCH'
    }
  ]);

  const [customHomeInput, setCustomHomeInput] = useState(
    securitySettings.registeredHomeRegion || 'Guntersville, AL (North America)'
  );

  const handleToggleTravelMode = (enabled: boolean) => {
    onUpdateSecuritySettings({ travelModeEnabled: enabled });
    const home = securitySettings.registeredHomeRegion || 'Guntersville, AL (North America)';
    const current = securitySettings.currentDetectedRegion || home;
    const dist = calculateGeofenceDistance(home, current);
    const sensitivity = securitySettings.geofenceSensitivityKm || 100;

    if (enabled && dist > sensitivity && (securitySettings.geofenceAlertsEnabled ?? true)) {
      setGeofenceShiftAlert({
        detectedRegion: current,
        homeRegion: home,
        distanceKm: dist,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'ACTIVE_WARNING'
      });
    } else if (!enabled) {
      setGeofenceShiftAlert(null);
    }
  };

  const handleSimulateGeofenceShift = (newRegion: string) => {
    const home = securitySettings.registeredHomeRegion || 'Guntersville, AL (North America)';
    const dist = calculateGeofenceDistance(home, newRegion);
    const sensitivity = securitySettings.geofenceSensitivityKm || 100;

    onUpdateSecuritySettings({
      currentDetectedRegion: newRegion,
      lastLocationCheckTimestamp: new Date().toISOString()
    });

    const isTravelMode = securitySettings.travelModeEnabled ?? false;
    const isAlertsOn = securitySettings.geofenceAlertsEnabled ?? true;

    if ((isTravelMode || isAlertsOn) && dist > sensitivity) {
      const alertObj = {
        detectedRegion: newRegion,
        homeRegion: home,
        distanceKm: dist,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: 'ACTIVE_WARNING' as const
      };
      setGeofenceShiftAlert(alertObj);

      setGeofenceLogHistory(prev => [
        {
          id: `geo-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: newRegion,
          distanceKm: dist,
          status: 'ALERT_TRIGGERED'
        },
        ...prev
      ]);

      if (pushNotificationSettings.security) {
        sendWhatsAppNotification(
          `🚨 GEOFENCE ALERT: Location shift detected! Registered Home: ${home}. Current Location: ${newRegion} (${dist} km shift). Travel Mode Active.`,
          userProfile?.phone || '+12565550199'
        );
      }
    } else {
      setGeofenceShiftAlert(null);
      setGeofenceLogHistory(prev => [
        {
          id: `geo-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: newRegion,
          distanceKm: dist,
          status: dist === 0 ? 'HOME_MATCH' : 'AUTHORIZED_TRAVEL'
        },
        ...prev
      ]);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!deletePassword) {
          setDeleteError('Please enter your password to authorize deletion.');
          return;
      }
      setIsDeleting(true);
      setDeleteError('');
      
      try {
          if (onDeleteAccountPermanently) {
              const res = await onDeleteAccountPermanently(deletePassword);
              if (res.success) {
                  setDeleteSuccess(true);
              } else {
                  setDeleteError(res.error || 'Authentication failed. Please verify your password.');
              }
          } else {
              setDeleteError('Deletion server endpoint not configured.');
          }
      } catch (err: any) {
          setDeleteError(err.message || 'An unexpected clearance error occurred.');
      } finally {
          setIsDeleting(false);
      }
  };

  const handleRunDiagnostic = () => {
    if (isDiagnosticRunning) return;
    setIsDiagnosticRunning(true);
    setDiagnosticProgress(0);
    setDiagnosticLogs(["[SYSTEM] Initiating biological sensor diagnostic handshake..."]);

    const steps = [
      { p: 15, log: "Binding interface with local cryptographic device enclave..." },
      { p: 35, log: "Activating physical template scanner array (High Integrity)..." },
      { p: 55, log: `Retrieving local keystore indexes matching user identifier (${userProfile.email})...` },
      { p: 75, log: `Running verification pattern analysis against active template...` },
      { p: 90, log: "Signing enclave diagnostic challenge with 256-bit RSA token..." },
      { p: 100, log: "Diagnostic successful. Biological envelope matched with 100% security trust." }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setDiagnosticProgress(steps[currentStep].p);
        setDiagnosticLogs(prev => [...prev, `[SECURE] ${steps[currentStep].log}`]);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsDiagnosticRunning(false);
      }
    }, 450);
  };

  // Real-time Enclave Telemetry Handshake Sync
  useEffect(() => {
    const timer = setInterval(() => {
      setEnclaveLatency(Number((0.15 + Math.random() * 0.13).toFixed(2)));
      setEnclaveSyncCount(prev => prev + 1);
      
      const hexChars = '0123456789ABCDEF';
      let randomPart = '';
      for (let i = 0; i < 4; i++) {
        randomPart += hexChars[Math.floor(Math.random() * 16)];
      }
      setEnclaveHash(`0x9F4C0D${randomPart}`);
      setEnclaveActiveSignal(prev => !prev);
    }, 2000);
    
    return () => clearInterval(timer);
  }, []);

  // First Pacific Voice & Force Root Sandbox Behavior
  useEffect(() => {
    if (!voiceActiveListening) return;
    const interval = setInterval(() => {
      setVoiceWaveBars(prev => prev.map(() => Math.floor(Math.random() * 32) + 5));
    }, 100);
    return () => clearInterval(interval);
  }, [voiceActiveListening]);

  const handleToggleRootPrivilege = (checked: boolean) => {
    setRootPrivilegeEnabled(checked);
    if (checked) {
      setRootCheckStatus('escalating');
      setRootConsoleLogs(['[SYSTEM] Initializing kernel-level sandbox escalation...']);
      
      const rootSteps = [
        'Mapping hardware enclave security registers at address space 0x7FFA2B1C...',
        'Injected secure device-binding handshake into ARM TrustZone / Intel SGX...',
        'Escating host thread execution block permission level to ROOT domain...',
        'Physical registers mapped. Full root-level OS sandbox protection asserted successfully!'
      ];
      
      let stepIndex = 0;
      const rootInterval = setInterval(() => {
        if (stepIndex < rootSteps.length) {
          setRootConsoleLogs(prev => [...prev, `[KERNEL] ${rootSteps[stepIndex]}`]);
          stepIndex++;
        } else {
          clearInterval(rootInterval);
          setRootCheckStatus('rooted');
        }
      }, 500);
    } else {
      setRootCheckStatus('idle');
      setRootConsoleLogs([]);
    }
  };

  const handleSimulateVoiceCommand = (command: string) => {
    if (!voiceEnabled) return;
    setSelectedVoiceCommand(command);
    setVoiceActiveListening(true);
    setVoiceOutputMessage(`Voice Command Engine listening... Please vocalize: "${command}"`);
    
    setTimeout(() => {
      setVoiceActiveListening(false);
      setVoiceOutputMessage(`Command recognized: "${command}". 99.9% biometric frequency match. Security bypass directive successfully executed!`);
    }, 2000);
  };

  // Premium WhatsApp Integration States
  const [isSendingTestWhatsApp, setIsSendingTestWhatsApp] = useState(false);
  const [testWhatsAppNumber, setTestWhatsAppNumber] = useState(userProfile.phone || '3159150854');
  const [whatsAppAlertsEnabled, setWhatsAppAlertsEnabled] = useState(true);
  const [whatsAppMfaEnabled, setWhatsAppMfaEnabled] = useState(securitySettings.mfa.method === 'whatsapp');
  const [copiedSandboxInsideSettings, setCopiedSandboxInsideSettings] = useState(false);
  const [testNotificationResult, setTestNotificationResult] = useState<{success?: boolean, error?: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Offline Mode States
  const [offlineModeActive, setOfflineModeActive] = useState(() => {
      if (typeof window !== 'undefined') {
          return localStorage.getItem('fpb_offline_mode_override') === 'true';
      }
      return false;
  });
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStepText, setSyncStepText] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState(() => {
      if (typeof window !== 'undefined') {
          return localStorage.getItem('fpb_offline_last_sync') || '';
      }
      return '';
  });

  const handleToggleOfflineMode = async (enabled: boolean) => {
      if (enabled) {
          setIsSyncingOffline(true);
          setSyncProgress(0);
          setSyncStepText("Connecting to secure Swiss vault enclave...");
          
          const steps = [
              { progress: 15, text: "Connecting to secure Switzerland servers..." },
              { progress: 40, text: "Pre-fetching checking & savings accounts ledger entries..." },
              { progress: 70, text: "Downloading recent transaction history logs (50+ records)..." },
              { progress: 90, text: "Encrypting offline blueprints into AES-256 local sandbox..." },
              { progress: 100, text: "Offline Enclave Synchronized! 1.4 MB cached." }
          ];

          for (const step of steps) {
              await new Promise(resolve => setTimeout(resolve, 600));
              setSyncProgress(step.progress);
              setSyncStepText(step.text);
          }

          try {
              // Pre-fetch actual accounts and serialize them to localStorage
              const fetchedAccounts = await db.getAccounts(userProfile.email);
              localStorage.setItem('fpb_cached_accounts', JSON.stringify(fetchedAccounts));
              localStorage.setItem('fpb_cached_transactions', JSON.stringify(transactions));
              
              const nowString = new Date().toLocaleString();
              localStorage.setItem('fpb_offline_last_sync', nowString);
              setLastSyncTime(nowString);
              
              localStorage.setItem('fpb_offline_mode_override', 'true');
              setOfflineModeActive(true);
              
              // Dispatch custom window event
              window.dispatchEvent(new CustomEvent('offline-mode-change', { detail: { enabled: true } }));
          } catch (err) {
              console.error("Offline sync failed:", err);
          } finally {
              setIsSyncingOffline(false);
          }
      } else {
          localStorage.setItem('fpb_offline_mode_override', 'false');
          setOfflineModeActive(false);
          window.dispatchEvent(new CustomEvent('offline-mode-change', { detail: { enabled: false } }));
      }
  };

  const securityScore = useMemo(() => {
    let score = 25; // Base score
    if (securitySettings.mfa.enabled) score += 25;
    if (securitySettings.biometricsEnabled) score += 25;
    
    if (verificationLevel === VerificationLevel.LEVEL_3) {
        score += 25;
    } else if (verificationLevel === VerificationLevel.LEVEL_2) {
        score += 15;
    } else if (verificationLevel === VerificationLevel.LEVEL_1) {
        score += 10;
    }

    return Math.round(score);
  }, [securitySettings, verificationLevel]);

  // Simulated Credit Score for Demo
  const creditScore = 785;

  const handleSendTestWhatsApp = async () => {
    if (!testWhatsAppNumber || isSendingTestWhatsApp) return;
    setIsSendingTestWhatsApp(true);
    setTestNotificationResult(null);

    const testBody = `*First Pacific Security Check* 🔔\n\nYour premium banking alerting pipeline is *Online* and fully synchronized with this phone number.\n\n*Service Health:* 100% Operational\n*Active Node:* Zurich-Gate-2\n\nIf you receive this, you are ready to complete real-time security handshakes and receive transaction notifications instantly on WhatsApp!`;
    
    try {
        const success = await sendWhatsAppNotification(testWhatsAppNumber, testBody);
        if (success) {
            setTestNotificationResult({ success: true });
        } else {
            setTestNotificationResult({ success: false, error: 'Sandbox authorization required. Pair your device first!' });
        }
    } catch (e: any) {
        setTestNotificationResult({ success: false, error: e.message || 'Handoff exception occurred' });
    } finally {
        setIsSendingTestWhatsApp(false);
    }
  };

  const handleVerificationModalClose = (level: VerificationLevel) => {
    onVerificationComplete(level);
    setIsVerificationModalOpen(false);
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
          alert("Please select an image smaller than 5MB.");
          return;
      }
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Image = reader.result as string;
        
        // Simulate uploading to a secure vault for biometrics
        try {
           const faceId = await storeBiometricFace(base64Image);
           if (faceId) {
               console.log("Biometric Face ID Enrolled:", faceId);
           }
        } catch (err) {
            console.warn("Biometric enrollment unavailable.");
        }

        // Simulate network delay
        setTimeout(() => {
          onUpdateProfilePicture(base64Image);
          setIsUploading(false);
        }, 1500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAvatar = async () => {
    setIsGeneratingAvatar(true);
    const newAvatar = await generateUserAvatar(userProfile.name);
    if (newAvatar) {
        onUpdateProfilePicture(newAvatar);
    } else {
        alert("Failed to generate avatar. Please try again.");
    }
    setIsGeneratingAvatar(false);
  };

  const confirmRevocation = () => {
    if (deviceToRevoke) {
        onRevokeDevice(deviceToRevoke.id);
        setDeviceToRevoke(null);
    }
  };

  const verificationLevelValue = useMemo(() => Object.values(VerificationLevel).indexOf(verificationLevel), [verificationLevel]);

  const kycFeatures = [
      { 
          icon: <ChartBarIcon />, 
          title: "Access to Crypto Trading", 
          description: "Buy, sell, and hold top cryptocurrencies directly within your Premium Reserved Bank account.", 
          requiredLevel: VerificationLevel.LEVEL_2, 
          requiredLevelValue: 2,
          imageUrl: 'https://images.unsplash.com/photo-1621452773453-c82736159b3a?q=80&w=2940&auto=format&fit=crop'
      },
      { 
          icon: <ShieldCheckIcon />, 
          title: "Enhanced Fraud Protection Insurance", 
          description: "Advanced insurance coverage for unauthorized transactions on your verified account.", 
          requiredLevel: VerificationLevel.LEVEL_3, 
          requiredLevelValue: 3,
          imageUrl: 'https://images.unsplash.com/photo-1585224320412-36c11756a04f?q=80&w=2874&auto=format&fit=crop'
      },
      { 
          icon: <TrendingUpIcon />, 
          title: "Access to High-Value Transactions", 
          description: "Eligibility for increased transfer limits and access to specialized investment products.", 
          requiredLevel: VerificationLevel.LEVEL_3, 
          requiredLevelValue: 3,
          imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2940&auto=format&fit=crop'
      },
      { 
          icon: <EyeIcon />, 
          title: "Dedicated Account Monitoring", 
          description: "Proactive, specialized monitoring of your account activity by our senior security team.", 
          requiredLevel: VerificationLevel.LEVEL_3, 
          requiredLevelValue: 3,
          imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2940&auto=format&fit=crop'
      },
  ];

  const securityCheckupItems = [
    {
        icon: LockClosedIcon,
        title: 'Strong Password',
        description: 'A strong, unique password is your first line of defense.',
        isComplete: true, // Assuming password is always set
        statusText: 'Active',
        actionText: 'Change',
        action: onChangePassword
    },
    {
        icon: DevicePhoneMobileIcon,
        title: 'Two-Factor Authentication',
        description: 'Dynamic OTP settings are securely managed by your institutional administrator.',
        isComplete: securitySettings.mfa.enabled,
        statusText: securitySettings.mfa.enabled ? `Enabled (${securitySettings.mfa.method?.toUpperCase()})` : 'Disabled',
        actionText: 'Managed',
        action: () => alert('Dynamic OTP capabilities are securely managed by your institutional administrator. Please contact support for assistance.')
    },
    {
        icon: FingerprintIcon,
        title: 'Biometric Login',
        description: 'Enable Face ID or fingerprint for faster, secure access on this device.',
        isComplete: securitySettings.biometricsEnabled,
        statusText: securitySettings.biometricsEnabled ? 'Enabled' : 'Not Set Up',
        actionText: 'Setup',
        action: () => setIsBiometricsModalOpen(true)
    },
    {
        icon: IdentificationIcon,
        title: 'Identity Verification',
        description: 'Complete verification to unlock higher limits and more features.',
        isComplete: verificationLevel !== VerificationLevel.UNVERIFIED,
        statusText: verificationLevel,
        actionText: 'Verify',
        action: () => setIsVerificationModalOpen(true)
    },
    {
        icon: EyeIcon,
        title: 'Real-Time Transaction Monitoring',
        description: 'Proactive, specialized monitoring of your account activity by our senior security team.',
        isComplete: securitySettings.transactionMonitoringEnabled,
        statusText: securitySettings.transactionMonitoringEnabled ? 'Enabled' : 'Not Enabled',
        actionText: securitySettings.transactionMonitoringEnabled ? 'Disable' : 'Enable',
        action: () => onUpdateSecuritySettings({ transactionMonitoringEnabled: !securitySettings.transactionMonitoringEnabled })
    },
    {
        icon: ShieldCheckIcon,
        title: 'Dark Web Monitoring',
        description: 'Continuous scanning of the dark web for your compromised credentials and personal information.',
        isComplete: securitySettings.darkWebMonitoringEnabled,
        statusText: securitySettings.darkWebMonitoringEnabled ? 'Active' : 'Inactive',
        actionText: securitySettings.darkWebMonitoringEnabled ? 'Disable' : 'Enable',
        action: () => onUpdateSecuritySettings({ darkWebMonitoringEnabled: !securitySettings.darkWebMonitoringEnabled })
    },
    {
        icon: GlobeAmericasIcon,
        title: 'Travel Mode & Location Geofencing',
        description: 'Instant geofence drift alerts when logging in away from registered home region.',
        isComplete: securitySettings.travelModeEnabled || false,
        statusText: securitySettings.travelModeEnabled ? 'Active' : 'Standby',
        actionText: securitySettings.travelModeEnabled ? 'Disable' : 'Enable',
        action: () => handleToggleTravelMode(!securitySettings.travelModeEnabled)
    }
  ];
  
  const kycLevels = Object.values(VerificationLevel).slice(1);

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
            <div className="flex items-center space-x-3">
                <CertificateIcon className="w-8 h-8 text-primary"/>
                <h2 className="text-2xl font-bold text-[#1E293B]">Security Center</h2>
            </div>
            <p className="text-sm text-[#0F172A] mt-1">Manage your account security settings and connected services.</p>
            
            <div className="flex space-x-4 mt-6 border-b border-slate-300 dark:border-slate-300">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`pb-2 px-1 font-semibold transition-colors ${activeTab === 'overview' ? 'border-b-2 border-primary text-primary' : 'text-[#0F172A] hover:text-[#0F172A] dark:hover:text-[#0F172A]'}`}
                >
                    Overview
                </button>
                <button 
                    onClick={() => setActiveTab('dispatch_log')}
                    className={`pb-2 px-1 font-semibold transition-colors ${activeTab === 'dispatch_log' ? 'border-b-2 border-primary text-primary' : 'text-[#0F172A] hover:text-[#0F172A] dark:hover:text-[#0F172A]'}`}
                >
                    Security Dispatch Log
                </button>
            </div>
        </div>

        {activeTab === 'dispatch_log' && (
            <SecurityDispatchLog userEmail={userProfile.email} />
        )}

        {activeTab === 'overview' && (
            <>
        <div className="bg-slate-200 rounded-2xl shadow-digital">
            <div className="p-6 border-b border-slate-300"><h2 className="text-xl font-bold text-[#1E293B]">Profile Information</h2></div>
            <div className="p-6 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="relative group flex-shrink-0">
                    <img src={userProfile.profilePictureUrl} alt="Profile" className="w-24 h-24 rounded-full shadow-digital object-cover" />
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={isUploading || isGeneratingAvatar}
                    />
                    <div className="absolute -bottom-2 -right-2 flex gap-1">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading || isGeneratingAvatar}
                            className="bg-white p-2 rounded-full shadow-md hover:bg-slate-100 transition-colors border border-slate-200 dark:bg-slate-800"
                            title="Upload Photo"
                        >
                            {isUploading ? <SpinnerIcon className="w-4 h-4 text-[#0F172A]"/> : <CameraIcon className="w-4 h-4 text-[#0F172A]"/>}
                        </button>
                        <button
                            onClick={handleGenerateAvatar}
                            disabled={isUploading || isGeneratingAvatar}
                            className="bg-primary text-[#0F172A] dark:text-white p-2 rounded-full shadow-md hover:bg-primary-600 transition-colors border border-primary"
                            title="Generate AI Avatar"
                        >
                            {isGeneratingAvatar ? <SpinnerIcon className="w-4 h-4 text-[#0F172A] dark:text-white animate-spin"/> : <SparklesIcon className="w-4 h-4 text-[#0F172A] dark:text-white"/>}
                        </button>
                    </div>
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-[#1E293B]">{userProfile.name}</h3>
                    <p className="text-[#0F172A]">{userProfile.email}</p>
                </div>
            </div>
        </div>

        {/* Health Scores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-2xl shadow-digital p-6 flex flex-col items-center">
                <div className="w-full pb-4 mb-4">
                    <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-1">Security Health Scorecard</h3>
                    <p className="text-xs text-[#0F172A] dark:text-white">Real-time audit of your active settings and sessions.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center w-full gap-8">
                    <div className="flex-shrink-0">
                        <SecurityScore score={securityScore} />
                    </div>
                    <div className="flex-grow w-full space-y-3">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-300 dark:bg-slate-900">
                            <span className="text-sm font-bold text-[#0F172A] dark:text-white">Authentication</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${securitySettings.mfa.enabled ? 'bg-green-100 dark:bg-green-500 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-500 text-red-700 dark:text-red-400'}`}>
                                {securitySettings.mfa.enabled ? 'Strong' : 'Weak'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-300 dark:bg-slate-900">
                            <span className="text-sm font-bold text-[#0F172A] dark:text-white">Biometrics</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${securitySettings.biometricsEnabled ? 'bg-green-100 dark:bg-green-500 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-500 text-yellow-700 dark:text-yellow-400'}`}>
                                {securitySettings.biometricsEnabled ? 'Active' : 'Unset'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-300 dark:bg-slate-900">
                            <span className="text-sm font-bold text-[#0F172A] dark:text-white">Active Devices</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trustedDevices.length <= 2 ? 'bg-green-100 dark:bg-green-500 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-500 text-yellow-700 dark:text-yellow-400'}`}>
                                {trustedDevices.length} Sessions
                            </span>
                        </div>
                    </div>
                </div>

                <div className="w-full mt-6 flex flex-col items-center border-t border-slate-300 dark:border-white/10 pt-4">
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white">
                        {securityScore > 80 ? 'Your identity perimeter is secured.' : 'Action required to secure account.'}
                    </p>
                    {securityScore <= 80 && (
                        <p className="text-xs text-[#0F172A] dark:text-white text-center mt-1">Enable biometrics and 2FA below to reach 100.</p>
                    )}
                </div>
            </div>

            <div className="bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-2xl shadow-digital p-6 flex flex-col items-center text-center">
                 <div className="w-full border-b border-slate-300 pb-4 mb-4">
                    <h3 className="text-lg font-bold text-[#1E293B]">FICO® Score 8</h3>
                </div>
                <CreditScore score={creditScore} />
                <div className="mt-4 flex flex-col items-center">
                    <p className="text-sm font-bold text-green-600 flex items-center gap-1 bg-green-100 px-3 py-1 rounded-full">
                        <TrendingUpIcon className="w-4 h-4"/> +4 points this month
                    </p>
                    <p className="text-xs text-[#0F172A] dark:text-white mt-2">Updated: Today</p>
                </div>
            </div>
        </div>

        {/* Security Posture Summary Section */}
        <SecurityPostureSummary 
            securitySettings={securitySettings} 
            trustedDevices={trustedDevices} 
            pushNotificationSettings={pushNotificationSettings} 
        />

        {/* Secure Enclave Biometric Status Control Card */}
        <div className="bg-slate-200 rounded-2xl shadow-digital overflow-hidden border border-slate-300 dark:border-white/10">
            <div className="p-6 border-b border-slate-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-300">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl ring-1 ring-primary/20">
                        {biometricMethod === 'FaceID' ? <FaceIdIcon className="w-6 h-6 animate-pulse" /> : <FingerprintIcon className="w-6 h-6" />}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                            Biometric Authentication & Enclave
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Hardware-Locked
                            </span>
                        </h2>
                        <p className="text-xs text-[#0F172A] dark:text-white">Unlock the application using your device's fingerprint sensor or Face ID instead of PIN.</p>
                    </div>
                </div>
                
                {/* Main Biometric Toggle Switch */}
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2.5 px-4 rounded-xl border border-slate-300 dark:border-white/10 shadow-sm">
                    <span className="text-xs font-extrabold text-[#0F172A] dark:text-[#1E293B]">Biometric Unlock</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={securitySettings.biometricsEnabled || false} 
                            onChange={(e) => {
                                const enabled = e.target.checked;
                                onUpdateSecuritySettings({ biometricsEnabled: enabled });
                                if (enabled && !securitySettings.biometricsEnabled) {
                                    setIsBiometricsModalOpen(true);
                                }
                            }} 
                            className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 dark:bg-slate-800"></div>
                    </label>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Visual Status Indicator Circle */}
                <div className="flex flex-col items-center justify-center text-center p-6 bg-slate-300 dark:bg-slate-800 rounded-xl border border-slate-300/60 dark:border-white/10">
                    <div className="relative w-28 h-28 flex items-center justify-center mb-4">
                        <div className={`absolute inset-0 rounded-full border-4 ${securitySettings.biometricsEnabled ? 'border-emerald-500/25 border-t-emerald-500 animate-spin' : 'border-slate-300/40 border-dashed'}`}></div>
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${securitySettings.biometricsEnabled ? 'bg-emerald-50 dark:bg-emerald-500 text-emerald-600' : 'bg-slate-300 dark:bg-slate-900 text-[#0F172A]'}`}>
                            {biometricMethod === 'FaceID' ? <FaceIdIcon className="w-10 h-10" /> : <FingerprintIcon className="w-10 h-10" />}
                        </div>
                        {securitySettings.biometricsEnabled && (
                            <span className="absolute bottom-1 right-1 bg-emerald-500 text-white rounded-full p-1 border border-white dark:border-slate-900">
                                <CheckCircleIcon className="w-4 h-4 fill-white text-emerald-500" />
                            </span>
                        )}
                    </div>

                    <h3 className="font-bold text-[#0F172A] dark:text-white">
                        {securitySettings.biometricsEnabled ? 'Biometrics Active' : 'Biometrics Disabled'}
                    </h3>
                    <p className="text-xs text-[#0F172A] dark:text-white mt-1 max-w-[200px]">
                        {securitySettings.biometricsEnabled 
                            ? 'App unlock set to device Fingerprint / Face ID. Standard PIN remains as fallback.' 
                            : 'Enable biometrics above to use device-level Face ID or Fingerprint recognition.'}
                    </p>

                    <div className="mt-4 flex flex-col gap-2 w-full">
                        <button
                            onClick={handleTestBiometricUnlock}
                            disabled={testBiometricStatus === 'testing'}
                            className="w-full py-2 px-3 bg-white hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-slate-300 transition-colors flex items-center justify-center gap-1.5 dark:bg-slate-800"
                        >
                            {testBiometricStatus === 'testing' ? (
                                <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                                    <span>Scanning Device...</span>
                                </>
                            ) : (
                                <>
                                    <FingerprintIcon className="w-3.5 h-3.5 text-primary" />
                                    <span>Test Biometric Hardware Unlock</span>
                                </>
                            )}
                        </button>
                        {testBiometricMessage && (
                            <p className={`text-[10px] font-mono text-center font-semibold mt-1 ${
                                testBiometricStatus === 'success' ? 'text-emerald-500' : testBiometricStatus === 'failed' ? 'text-rose-500' : 'text-[#0F172A]'
                            }`}>
                                {testBiometricMessage}
                            </p>
                        )}
                    </div>
                </div>

                {/* Configuration Parameters / Trust indicators */}
                <div className="space-y-4 flex flex-col justify-between">
                    <div>
                        <h4 className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-widest mb-3">Enclave Environment</h4>
                        <div className="space-y-2.5">
                            <div className="flex justify-between items-center text-sm border-b border-slate-300/60 dark:border-white/10 pb-2">
                                <span className="text-[#0F172A] dark:text-white">Method Preference</span>
                                <select 
                                    value={biometricMethod} 
                                    onChange={(e) => setBiometricMethod(e.target.value as any)}
                                    className="bg-transparent font-bold text-[#0F172A] dark:text-white border-none py-0 focus:ring-0 cursor-pointer outline-none text-right"
                                    disabled={isDiagnosticRunning}
                                >
                                    <option value="FaceID">Face ID (Biometric)</option>
                                    <option value="Fingerprint">Fingerprint Sensor</option>
                                    <option value="WindowsHello">Windows Hello / Passkey</option>
                                </select>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-slate-300/60 dark:border-white/10 pb-2">
                                <span className="text-[#0F172A] dark:text-white">Secure Cryptopatch</span>
                                <span className="font-mono text-xs font-bold text-[#0F172A] dark:text-white">SHA_256_CORESYNC4</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-slate-300/60 dark:border-white/10 pb-2">
                                <span className="text-[#0F172A] dark:text-white">Hardware Level</span>
                                <span className="font-bold text-[#0F172A] dark:text-white">Intel SGX / ARM TrustZone</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-[#0F172A] dark:text-white">Enclave Handshake Key</span>
                                <span className="font-mono text-[10px] text-primary truncate max-w-[110px]" title="ENCLAVE_PUB_KEY_8F389A">FPB_ENC_7F8A3...</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-300 dark:bg-slate-900 rounded-xl p-3 text-xs text-[#0F172A] dark:text-slate-450 border border-slate-300/50 dark:border-white/10">
                        🔒 Biological blueprints are encrypted at rest locally inside your device’s hardware-level sandbox and are never uploaded to any remote networks or databases.
                    </div>
                </div>

                {/* Interactive Diagnostic Console Terminal */}
                <div className="bg-slate-350 dark:bg-slate-800 rounded-xl p-4 flex flex-col justify-between border border-slate-300 dark:border-white/10 font-mono">
                    <div>
                        <div className="flex justify-between items-center mb-2.5 border-b border-slate-300 dark:border-white/10 pb-2">
                            <span className="text-[10px] text-[#0F172A] dark:text-white font-bold uppercase tracking-wider">SANDBOX HARDWARE DIAGNOSTICS</span>
                            <span className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isDiagnosticRunning ? 'bg-orange-400' : 'bg-emerald-400'}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${isDiagnosticRunning ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
                            </span>
                        </div>

                        {/* Console display log scrollbox */}
                        <div className="h-32 overflow-y-auto space-y-1 text-[#1E293B] dark:text-slate-100 text-[10px] select-all leading-relaxed">
                            {diagnosticLogs.length === 0 ? (
                                <p className="text-[#0F172A] italic">No diagnostic logs recorded yet. Press "Run Handshake Diagnostic" to scan hardware.</p>
                            ) : (
                                diagnosticLogs.map((log, index) => (
                                    <p key={index} className={log.includes('[SYSTEM]') ? 'primary- dark:primary- font-bold' : log.includes('successful') ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-[#0F172A] dark:text-white'}>
                                        {log}
                                    </p>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-slate-300 dark:border-white/10">
                        {isDiagnosticRunning ? (
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] text-[#0F172A] dark:text-white">
                                    <span>Scanning Handshake...</span>
                                    <span>{diagnosticProgress}%</span>
                                </div>
                                <div className="w-full bg-slate-300 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-primary h-full transition-all duration-300" style={{ width: `${diagnosticProgress}%` }}></div>
                                </div>
                            </div>
                        ) : (
                            <button 
                                onClick={handleRunDiagnostic}
                                className="w-full py-2 bg-white dark:bg-slate-900 text-white dark:text-[#1E293B] text-xs font-bold rounded-lg border border-slate-300/50 hover:bg-slate-700 active:bg-slate-50 transition-colors"
                            >
                                Run Handshake Diagnostic
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>

        {/* First Pacific Voice and Force Root Privilege Integration Card */}
        <div className="bg-slate-200 rounded-2xl shadow-digital">
            <div className="p-6 border-b border-slate-300">
                <h2 className="text-xl font-bold text-[#1E293B] flex items-center gap-2">
                    <PremiumReservedBankLogo className="w-5 h-5 text-primary" />
                    First Pacific Voice & Kernel Sandboxing
                </h2>
                <p className="text-xs text-[#0F172A] mt-1">Configure advanced biophysical security signals and assertive root-level sandbox isolation.</p>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Voice integration subsection */}
                <div className="bg-slate-250 p-5 rounded-xl shadow-digital-inset space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h4 className="font-bold text-[#1E293B] flex items-center gap-2">
                                <Mic className="w-4 h-4 text-primary animate-pulse" />
                                Voice Authentication Engine
                            </h4>
                            <p className="text-xs text-[#0F172A]">Real-time tone verification & vocal command matching.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={voiceEnabled} 
                                onChange={(e) => {
                                    setVoiceEnabled(e.target.checked);
                                    if(!e.target.checked) {
                                        setVoiceActiveListening(false);
                                        setVoiceOutputMessage('Voice Engine Standby. Toggle on to engage First Pacific acoustic neural nets.');
                                        setSelectedVoiceCommand('');
                                    } else {
                                        setVoiceOutputMessage('Acoustic Voice Engine initialized. Ready to calibrate command profiles.');
                                    }
                                }} 
                                className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 dark:bg-slate-800"></div>
                        </label>
                    </div>

                    {voiceEnabled && (
                        <div className="space-y-4 animate-fade-in">
                            {/* Listening Equalizer */}
                            <div className="bg-slate-300 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-300/60 relative overflow-hidden min-h-[90px]">
                                {voiceActiveListening ? (
                                    <div className="flex items-end justify-center gap-1 h-8 mb-2">
                                        {voiceWaveBars.map((bar, i) => (
                                            <div 
                                                key={i} 
                                                className="w-1.5 bg-primary rounded-full transition-all duration-100" 
                                                style={{ height: `${bar}px` }}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <Volume2 className="w-8 h-8 text-[#0F172A] mb-2 animate-pulse" />
                                )}
                                <span className="text-[10px] font-mono font-bold text-center text-[#0F172A] max-w-full truncate px-2">{voiceOutputMessage}</span>
                            </div>

                            {/* Preset Buttons */}
                            <div className="space-y-2">
                                <span className="text-[10px] uppercase font-black tracking-widest text-[#0F172A]">Voice Command Training Profiles</span>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        disabled={voiceActiveListening}
                                        onClick={() => handleSimulateVoiceCommand("Authorize Sovereign Account Release")}
                                        className="py-2.5 px-3 text-[10px] font-bold text-left bg-slate-200 border border-slate-350 shadow-digital rounded-lg hover:border-primary hover:bg-slate-300 text-[#1E293B] truncate"
                                    >
                                        🎙️ "Authorize Sovereign..."
                                    </button>
                                    <button 
                                        disabled={voiceActiveListening}
                                        onClick={() => handleSimulateVoiceCommand("Unlock Enclave Clearance")}
                                        className="py-2.5 px-3 text-[10px] font-bold text-left bg-slate-200 border border-slate-350 shadow-digital rounded-lg hover:border-primary hover:bg-slate-300 text-[#1E293B] truncate"
                                    >
                                        🎙️ "Unlock Enclave..."
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Root privilege sandbox subsection */}
                <div className="bg-slate-250 p-5 rounded-xl shadow-digital-inset space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h4 className="font-bold text-[#1E293B] flex items-center gap-2">
                                <ShieldCheckIcon className="w-4 h-4 text-amber-500" />
                                Force OS Root Sandbox
                            </h4>
                            <p className="text-xs text-[#0F172A]">Bypass standard OS namespaces for kernel hardware trust.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={rootPrivilegeEnabled} 
                                onChange={(e) => handleToggleRootPrivilege(e.target.checked)} 
                                className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 dark:bg-slate-800"></div>
                        </label>
                    </div>

                    <div className="bg-slate-300 dark:bg-slate-800 rounded-xl p-4 flex flex-col justify-between border border-slate-305 dark:border-white/10 font-mono text-left min-h-[140px]">
                        <div>
                            <div className="flex justify-between items-center mb-2 border-b border-slate-400 dark:border-white/10 pb-1.5">
                                <span className="text-[9px] text-[#0F172A] font-bold uppercase tracking-wider">ROOT OVERRIDE LOGS</span>
                                <span className="relative flex h-2 w-2">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${rootCheckStatus === 'escalating' ? 'bg-amber-400' : rootCheckStatus === 'rooted' ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${rootCheckStatus === 'escalating' ? 'bg-amber-500' : rootCheckStatus === 'rooted' ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                                </span>
                            </div>

                            <div className="h-20 overflow-y-auto space-y-1 text-[#1E293B] dark:text-slate-100 text-[9px] leading-relaxed scrollbar-thin">
                                {rootConsoleLogs.length === 0 ? (
                                    <p className="text-[#0F172A] italic">Toggle "Force OS Root Sandbox" to escalate device register privileges.</p>
                                ) : (
                                    rootConsoleLogs.map((log, index) => (
                                        <p key={index} className={log.includes('[SYSTEM]') ? 'text-amber-600 dark:text-amber-400 font-bold' : log.includes('successful') ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-705 dark:text-white'}>
                                            {log}
                                        </p>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        {/* Device Integrity & Advanced Force-Lock Configuration Card */}
        <div id="device-integrity-configuration-card" className="bg-slate-200 rounded-2xl shadow-digital">
            <div className="p-6 border-b border-slate-300">
                <h2 className="text-xl font-bold text-[#1E293B] flex items-center gap-2">
                    <ShieldCheckIcon className="w-5 h-5 text-primary" />
                    Device Integrity & Advanced Triggers
                </h2>
                <p className="text-xs text-[#0F172A] mt-1">Audit local platform health, monitor active secure enclave channels, and configure instant biometric force-lock triggers.</p>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Security Force-Lock Subsection */}
                <div className="bg-slate-250 p-5 rounded-xl shadow-digital-inset space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h4 className="font-bold text-[#1E293B] flex items-center gap-2">
                                <Lock className="w-4 h-4 text-rose-500 animate-pulse" />
                                Security Force-Lock
                            </h4>
                            <p className="text-xs text-[#0F172A]">Enable specialized hyper-short inactivity lockout timers.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={securitySettings.forceLockEnabled || false} 
                                onChange={(e) => {
                                    onUpdateSecuritySettings({ 
                                        forceLockEnabled: e.target.checked,
                                        forceLockTimeout: securitySettings.forceLockTimeout || 10000 
                                    });
                                }} 
                                className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500 dark:bg-slate-800"></div>
                        </label>
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs text-[#0F172A] leading-relaxed">
                            Once triggered, standard session credentials are brand-isolated and held. To resume, you must pass an <strong>immediate biometric re-verification requirement</strong> verified by the secure enclave.
                        </p>

                        {securitySettings.forceLockEnabled && (
                            <div className="space-y-2 pt-2 animate-fade-in">
                                <label className="text-[10px] uppercase font-black tracking-widest text-[#0F172A] block">Custom Inactivity Threshold</label>
                                <div className="relative">
                                    <select 
                                        value={securitySettings.forceLockTimeout || 30000} 
                                        onChange={(e) => {
                                            onUpdateSecuritySettings({ forceLockTimeout: Number(e.target.value) });
                                        }}
                                        className="w-full py-2.5 px-3 bg-slate-200 border border-slate-300 rounded-lg text-[#1E293B] font-bold text-xs font-mono shadow-digital hover:border-primary focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                                    >
                                        <option value={10000}>⏱️ 10 Seconds (Instant Demonstration)</option>
                                        <option value={30000}>⏱️ 30 Seconds</option>
                                        <option value={60000}>⏱️ 1 Minute</option>
                                        <option value={300000}>⏱️ 5 Minutes</option>
                                        <option value={900000}>⏱️ 15 Minutes</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#0F172A] font-bold text-[10px]">▼</div>
                                </div>
                                <p className="text-[10px] text-emerald-600 font-semibold italic">
                                    Active: App will freeze in {((securitySettings.forceLockTimeout || 30000) / 1000)}s of total input silence.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Device Integrity Widget Subsection */}
                <div className="bg-slate-250 p-5 rounded-xl shadow-digital-inset space-y-4">
                    <div className="space-y-1 border-b border-slate-300 pb-2">
                        <h4 className="font-bold text-[#1E293B] flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-emerald-500" />
                            Device Integrity Monitor
                        </h4>
                        <p className="text-xs text-[#0F172A]">Real-time biosecurity hardware attestation.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Root Status Indicator Block */}
                        <div className="bg-slate-200 p-3 rounded-lg border border-slate-300/40 text-left flex flex-col justify-between">
                            <span className="text-[9px] uppercase font-black text-[#0F172A] tracking-wider">Root Status</span>
                            {rootPrivilegeEnabled ? (
                                <div className="space-y-1 mt-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                                        <span className="text-[11px] font-black font-mono text-amber-600 uppercase tracking-tight">Root Escalated</span>
                                    </div>
                                    <p className="text-[8px] text-slate-505 dark:text-white font-bold leading-none">Sandbox namespaces bypassed.</p>
                                </div>
                            ) : (
                                <div className="space-y-1 mt-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        <span className="text-[11px] font-black font-mono text-emerald-600 uppercase tracking-tight">Secured Enclave</span>
                                    </div>
                                    <p className="text-[8px] text-slate-550 dark:text-slate-550 font-bold leading-none">Kernel compliant sandbox.</p>
                                </div>
                            )}
                        </div>

                        {/* Scan Module status */}
                        <div className="bg-slate-200 p-3 rounded-lg border border-slate-300/40 text-left flex flex-col justify-between">
                            <span className="text-[9px] uppercase font-black text-[#0F172A] tracking-wider">Simulation Link</span>
                            <div className="space-y-1 mt-1.5">
                                <div className="flex items-center gap-1.5">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-[11px] font-black font-mono text-emerald-600 uppercase tracking-tight">Active Pulse</span>
                                </div>
                                <p className="text-[8px] text-slate-505 dark:text-slate-550 font-bold leading-none">Enclave handshake active.</p>
                            </div>
                        </div>
                    </div>

                    {/* Live Telemetry Data Feed */}
                    <div className="bg-slate-300 dark:bg-slate-800 rounded-xl p-3 border border-slate-305 dark:border-white/10 font-mono text-left">
                        <div className="flex justify-between items-center pb-1 border-b border-slate-400 dark:border-white/10 mb-1.5">
                            <span className="text-[8px] text-slate-550 font-bold uppercase">Enclave Live Telemetry</span>
                            <span className="text-[8px] text-emerald-600 dark:text-emerald-400 uppercase font-black tracking-widest animate-pulse">● Communicating</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8.5px] leading-tight text-[#0F172A] dark:text-white font-mono">
                            <div>Latency: <span className="text-emerald-600 font-bold">{enclaveLatency}ms</span></div>
                            <div className="truncate">Active Syncs: <span className="text-primary font-bold">{enclaveSyncCount}</span></div>
                            <div className="col-span-2 truncate">Attestation Hash: <span className="text-[#0F172A] font-bold">{enclaveHash}</span></div>
                            <div className="col-span-2">Verification Loop: <span className={securitySettings.forceLockEnabled ? 'text-rose-500 font-bold uppercase' : 'text-[#0F172A] uppercase font-bold'}>{securitySettings.forceLockEnabled ? 'ENGAGED' : 'STANDBY'}</span></div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        {/* Travel Mode & Location Geofencing Security Card */}
        <div id="travel-mode-geofencing-card" className="bg-slate-200 rounded-2xl shadow-digital border border-slate-300/80 overflow-hidden">
            <div className="p-6 border-b border-slate-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-cyan-500 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 rounded-xl">
                        <GlobeAmericasIcon className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Travel Mode & Location Geofencing</h2>
                            {securitySettings.travelModeEnabled ? (
                                <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-500 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                                    Travel Mode Active
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-300 text-[#0F172A] px-2.5 py-0.5 rounded-full">
                                    Home Monitoring Standby
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-[#0F172A] mt-1">
                            Dispatches immediate geofencing security alerts if your device telemetry shifts significantly from your registered home region.
                        </p>
                    </div>
                </div>

                <label htmlFor="travel-mode-master-toggle" className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        id="travel-mode-master-toggle" 
                        className="sr-only peer" 
                        checked={securitySettings.travelModeEnabled || false} 
                        onChange={(e) => handleToggleTravelMode(e.target.checked)} 
                    />
                    <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 dark:bg-slate-800"></div>
                </label>
            </div>

            <div className="p-6 space-y-6">
                {/* Active Travel Banner when toggled ON */}
                {securitySettings.travelModeEnabled && (
                    <div className="bg-cyan-500 border border-cyan-500/30 rounded-xl p-4 flex items-start gap-3 text-left animate-fade-in">
                        <span className="text-xl">✈️</span>
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                                Travel Safeguard Protocol Active
                            </h4>
                            <p className="text-xs text-[#0F172A] dark:text-white mt-0.5 leading-relaxed">
                                Continuous IP geolocation & cell node validation enabled. If your physical access point shifts more than{' '}
                                <strong className="font-mono text-cyan-700 dark:text-cyan-300">{securitySettings.geofenceSensitivityKm || 100} km</strong>{' '}
                                from your registered home region (<strong className="font-mono">{securitySettings.registeredHomeRegion || 'Guntersville, AL (North America)'}</strong>), an immediate security alert will be dispatched.
                            </p>
                        </div>
                    </div>
                )}

                {/* Active Geofence Shift Warning Alert Banner (If triggered) */}
                {geofenceShiftAlert && geofenceShiftAlert.status === 'ACTIVE_WARNING' && (
                    <div className="bg-red-500 border-2 border-red-500 rounded-2xl p-5 space-y-4 animate-shake text-left">
                        <div className="flex justify-between items-start gap-3">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-black text-sm uppercase tracking-wider">
                                <ExclamationTriangleIcon className="w-5 h-5 animate-pulse" />
                                Immediate Geofencing Alert: Significant Location Shift Detected
                            </div>
                            <span className="text-[10px] font-mono font-bold text-red-500 bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded">
                                {geofenceShiftAlert.timestamp}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-red-200 dark:border-red-900/40 text-xs">
                            <div>
                                <span className="text-[9px] uppercase font-black text-[#0F172A] tracking-wider block">Registered Home Region</span>
                                <span className="font-bold text-[#0F172A] dark:text-white">{geofenceShiftAlert.homeRegion}</span>
                            </div>
                            <div>
                                <span className="text-[9px] uppercase font-black text-[#0F172A] tracking-wider block">Detected Login Location</span>
                                <span className="font-bold text-red-600 dark:text-red-400">{geofenceShiftAlert.detectedRegion}</span>
                            </div>
                            <div>
                                <span className="text-[9px] uppercase font-black text-[#0F172A] tracking-wider block">Location Shift Distance</span>
                                <span className="font-mono font-black text-red-600 dark:text-red-400 text-sm">
                                    {geofenceShiftAlert.distanceKm.toLocaleString()} km
                                </span>
                                <span className="text-[9px] text-[#0F172A] block">Exceeds {securitySettings.geofenceSensitivityKm || 100} km limit</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => {
                                    onUpdateSecuritySettings({
                                        currentDetectedRegion: geofenceShiftAlert.detectedRegion
                                    });
                                    setGeofenceShiftAlert(prev => prev ? { ...prev, status: 'AUTHORIZED' } : null);
                                    setGeofenceLogHistory(prev => [
                                        {
                                            id: `geo-${Date.now()}`,
                                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                            location: geofenceShiftAlert.detectedRegion,
                                            distanceKm: geofenceShiftAlert.distanceKm,
                                            status: 'AUTHORIZED_TRAVEL'
                                        },
                                        ...prev
                                    ]);
                                }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-[#0F172A] dark:text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                            >
                                <CheckCircleIcon className="w-4 h-4" />
                                Authorize Current Location ("{geofenceShiftAlert.detectedRegion}")
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setGeofenceShiftAlert(prev => prev ? { ...prev, status: 'FLAGGED' } : null);
                                    setIsLockdownModalOpen(true);
                                }}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-[#0F172A] dark:text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                            >
                                <LockClosedIcon className="w-4 h-4" />
                                Flag Unrecognized Shift & Lock Account
                            </button>

                            <button
                                type="button"
                                onClick={() => setGeofenceShiftAlert(null)}
                                className="px-3 py-2 bg-slate-300 dark:bg-slate-900 text-[#0F172A] dark:text-white font-bold text-xs rounded-lg hover:bg-slate-400 transition-colors"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}

                {/* Visual Satellite Map Radar Overlay */}
                <GeofenceMapOverlay
                  homeRegion={securitySettings.registeredHomeRegion || 'Guntersville, AL (North America)'}
                  currentRegion={securitySettings.currentDetectedRegion || securitySettings.registeredHomeRegion || 'Guntersville, AL (North America)'}
                  travelModeEnabled={securitySettings.travelModeEnabled || false}
                  geofenceSensitivityKm={securitySettings.geofenceSensitivityKm || 100}
                  geofenceAlertsEnabled={securitySettings.geofenceAlertsEnabled ?? true}
                  onSelectRegion={(regionName) => handleSimulateGeofenceShift(regionName)}
                  onResetHome={() => handleSimulateGeofenceShift(securitySettings.registeredHomeRegion || 'Guntersville, AL (North America)')}
                  shiftAlert={geofenceShiftAlert}
                />

                {/* Configuration Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Registered Home Region Box */}
                    <div className="bg-slate-250 p-5 rounded-xl shadow-digital-inset space-y-4 text-left">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-300">
                            <h4 className="font-bold text-[#1E293B] flex items-center gap-2">
                                <BankIcon className="w-4 h-4 text-cyan-600" />
                                Registered Home Region
                            </h4>
                            <span className="text-[10px] font-mono text-[#0F172A] font-bold uppercase">Primary Base</span>
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs text-[#0F172A] leading-relaxed">
                                Geofence monitoring measures location drift relative to this baseline region.
                            </p>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-[#0F172A] block">Select Primary Home Region</label>
                                <select 
                                    value={securitySettings.registeredHomeRegion || 'Guntersville, AL (North America)'}
                                    onChange={(e) => {
                                        onUpdateSecuritySettings({ registeredHomeRegion: e.target.value });
                                        setCustomHomeInput(e.target.value);
                                    }}
                                    className="w-full py-2.5 px-3 bg-slate-200 border border-slate-300 rounded-lg text-[#1E293B] font-bold text-xs font-mono shadow-digital hover:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                                >
                                    <option value="Guntersville, AL (North America)">🏡 Guntersville, AL (North America)</option>
                                    <option value="New York, NY (USA)">🗽 New York, NY (USA)</option>
                                    <option value="London, UK (Europe)">🏰 London, UK (Europe)</option>
                                    <option value="Tokyo, Japan (Asia)">🗼 Tokyo, Japan (Asia)</option>
                                    <option value="Frankfurt, Germany (Europe)">🏦 Frankfurt, Germany (Europe)</option>
                                    <option value="Paris, France (Europe)">🥐 Paris, France (Europe)</option>
                                    <option value="Dubai, UAE (Middle East)">🏙️ Dubai, UAE (Middle East)</option>
                                    <option value="Sydney, Australia (Oceania)">🦘 Sydney, Australia (Oceania)</option>
                                </select>
                            </div>

                            <div className="pt-1 flex items-center justify-between text-[11px] font-mono font-bold text-[#0F172A]">
                                <span>Active Baseline:</span>
                                <span className="text-cyan-700 font-black">{securitySettings.registeredHomeRegion || 'Guntersville, AL (North America)'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Geofencing Alert Sensitivity & Alert Dispatch Box */}
                    <div className="bg-slate-250 p-5 rounded-xl shadow-digital-inset space-y-4 text-left">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-300">
                            <h4 className="font-bold text-[#1E293B] flex items-center gap-2">
                                <ShieldCheckIcon className="w-4 h-4 text-cyan-600" />
                                Geofence Alert Threshold & Dispatch
                            </h4>
                            <label htmlFor="geofence-alert-toggle" className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    id="geofence-alert-toggle" 
                                    className="sr-only peer" 
                                    checked={securitySettings.geofenceAlertsEnabled ?? true} 
                                    onChange={(e) => onUpdateSecuritySettings({ geofenceAlertsEnabled: e.target.checked })} 
                                />
                                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 dark:bg-slate-800"></div>
                            </label>
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs text-[#0F172A] leading-relaxed">
                                Immediate alert notifications (SMS & Push) trigger whenever physical distance shift exceeds your specified threshold.
                            </p>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-[#0F172A] block">Distance Sensitivity Limit</label>
                                <select 
                                    value={securitySettings.geofenceSensitivityKm || 100}
                                    onChange={(e) => onUpdateSecuritySettings({ geofenceSensitivityKm: Number(e.target.value) })}
                                    className="w-full py-2.5 px-3 bg-slate-200 border border-slate-300 rounded-lg text-[#1E293B] font-bold text-xs font-mono shadow-digital hover:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                                >
                                    <option value={50}>📍 50 km (Tight Local Radius)</option>
                                    <option value={100}>📍 100 km (Standard Regional Radius)</option>
                                    <option value={250}>📍 250 km (Interstate / Provincial Radius)</option>
                                    <option value={500}>📍 500 km (Cross-Country / High Tolerance)</option>
                                </select>
                            </div>

                            <div className="text-[10px] text-emerald-600 font-semibold italic flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Alerts trigger when shift &gt; {securitySettings.geofenceSensitivityKm || 100} km from home.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Interactive Location Shift Simulator & Real-Time Tester */}
                <div className="bg-slate-300 rounded-xl p-5 border border-slate-300 space-y-4 text-left">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-300 pb-3">
                        <div>
                            <span className="text-[9px] uppercase font-black tracking-widest text-cyan-600 block">Real-Time Simulation Sandbox</span>
                            <h4 className="font-bold text-[#1E293B] text-sm">Location Shift Telemetry Simulator</h4>
                        </div>
                        <div className="text-[10px] font-mono text-[#0F172A] bg-slate-200 px-3 py-1 rounded-lg border border-slate-300 font-bold">
                            Current: <span className="text-cyan-700">{securitySettings.currentDetectedRegion || 'Guntersville, AL (North America)'}</span>
                        </div>
                    </div>

                    <p className="text-xs text-[#0F172A]">
                        Test your Travel Mode geofence alert system by simulating an immediate device location shift:
                    </p>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => handleSimulateGeofenceShift('London, UK (Europe)')}
                            className="px-3.5 py-2 bg-slate-200 hover:bg-cyan-500 hover:text-white border border-slate-300 rounded-lg font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5"
                        >
                            📍 Shift to London, UK (6,820 km)
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSimulateGeofenceShift('Tokyo, Japan (Asia)')}
                            className="px-3.5 py-2 bg-slate-200 hover:bg-cyan-500 hover:text-white border border-slate-300 rounded-lg font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5"
                        >
                            📍 Shift to Tokyo, Japan (10,850 km)
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSimulateGeofenceShift('Frankfurt, Germany (Europe)')}
                            className="px-3.5 py-2 bg-slate-200 hover:bg-cyan-500 hover:text-white border border-slate-300 rounded-lg font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5"
                        >
                            📍 Shift to Frankfurt, Germany (7,450 km)
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSimulateGeofenceShift(securitySettings.registeredHomeRegion || 'Guntersville, AL (North America)')}
                            className="px-3.5 py-2 bg-emerald-500 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500 hover:text-white rounded-lg font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5"
                        >
                            🏠 Reset to Home Region (0 km)
                        </button>
                    </div>

                    {/* Geofence Log History */}
                    {geofenceLogHistory.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-300 space-y-2">
                            <span className="text-[9px] uppercase font-black text-[#0F172A] tracking-wider block">Geofence Telemetry Audit Logs</span>
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                {geofenceLogHistory.map((log) => (
                                    <div key={log.id} className="flex justify-between items-center text-[10px] font-mono bg-slate-200 p-2 rounded border border-slate-300">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#0F172A]">{log.timestamp}</span>
                                            <span className="font-bold text-[#1E293B] dark:text-slate-100">{log.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#0F172A]">{log.distanceKm} km shift</span>
                                            {log.status === 'ALERT_TRIGGERED' && (
                                                <span className="bg-red-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded">GEOFENCE ALERT</span>
                                            )}
                                            {log.status === 'AUTHORIZED_TRAVEL' && (
                                                <span className="bg-cyan-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded">TRAVEL AUTHORIZED</span>
                                            )}
                                            {log.status === 'HOME_MATCH' && (
                                                <span className="bg-emerald-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded">HOME MATCH</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="bg-slate-200 rounded-2xl shadow-digital">
            <div className="p-6 border-b border-slate-300"><h2 className="text-xl font-bold text-[#1E293B]">Security Checkup</h2></div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {securityCheckupItems.map(item => {
                    const statusColor = item.isComplete ? 'text-green-600' : 'text-yellow-600';
                    const Icon = item.icon;
                    return (
                        <div key={item.title} className="bg-slate-200 p-4 rounded-lg shadow-digital-inset space-y-3 flex flex-col">
                            <div className="flex items-start space-x-3">
                                <Icon className={`w-8 h-8 ${statusColor}`} />
                                <div className="flex-grow">
                                    <h4 className="font-bold text-[#1E293B]">{item.title}</h4>
                                    <p className="text-xs text-[#0F172A]">{item.description}</p>
                                </div>
                            </div>
                            <div className="flex-grow"></div>
                            <div className="flex justify-between items-center pt-3 border-t border-slate-300">
                                <div className={`flex items-center text-sm font-semibold ${statusColor}`}>
                                    {item.isComplete ? <CheckCircleIcon className="w-4 h-4 mr-1"/> : <ExclamationTriangleIcon className="w-4 h-4 mr-1"/>}
                                    <span>{item.statusText}</span>
                                </div>
                                 <button onClick={item.action} className="px-3 py-1.5 text-xs font-bold text-primary bg-slate-200 rounded-lg shadow-digital active:shadow-digital-inset transition-shadow">
                                     {item.actionText}
                                 </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>

        <LoginHistory />

        {/* Trusted Devices Section */}
        <div className="bg-slate-200 rounded-2xl shadow-digital">
            <div className="p-6 border-b border-slate-300 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-300 rounded-lg">
                        <ComputerDesktopIcon className="w-6 h-6 text-[#0F172A]"/>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#1E293B]">Trusted Devices</h2>
                        <p className="text-sm text-[#0F172A]">Manage devices authorized to access your account.</p>
                    </div>
                </div>
            </div>
            <div className="p-6 divide-y divide-slate-300">
                {trustedDevices.map(device => (
                    <TrustedDeviceRow 
                        key={device.id} 
                        device={device} 
                        onRevoke={(id) => {
                            const dev = trustedDevices.find(d => d.id === id);
                            if (dev) setDeviceToRevoke(dev);
                        }} 
                    />
                ))}
            </div>
        </div>

        {/* Emergency Lockdown Section */}
        <div className="bg-red-50 border border-red-200 rounded-2xl shadow-digital p-6">
            <div className="flex items-start space-x-4">
                <div className="p-3 bg-red-100 rounded-full text-red-600 shadow-sm">
                    <ExclamationTriangleIcon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-red-700">Global Account Freeze</h3>
                    <p className="text-sm text-red-600/80 mt-1">
                        Instantly secure your account if you suspect unauthorized access. This will freeze all cards, revoke trusted devices, and disable outgoing transfers.
                    </p>
                    
                    <button 
                        onClick={() => setIsLockdownModalOpen(true)}
                        className="mt-4 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-[#0F172A] dark:text-white font-bold rounded-lg shadow-lg shadow-red-500/30 transition-all flex items-center gap-2"
                    >
                        <LockClosedIcon className="w-5 h-5" />
                        Account Freeze
                    </button>
                </div>
            </div>
        </div>

        <CardSecurityControls cards={cards} onUpdateCardControls={onUpdateCardControls} />
        <AdvancedTransferLimitsDisplay limits={advancedTransferLimits} transactions={transactions} />
        
        <div className="bg-slate-200 rounded-2xl shadow-digital">
          <div className="p-6 border-b border-slate-300"><h2 className="text-xl font-bold text-[#1E293B]">Advanced KYC Features</h2></div>
            <div className="p-6 space-y-4">
                <div className="mb-6">
                    <div className="flex justify-between text-sm font-bold text-[#0F172A] mb-2">
                        <span>Verification Progress</span>
                        <span className="font-bold text-primary">{verificationLevel}</span>
                    </div>
                    <div className="w-full bg-slate-300 rounded-full h-2.5 shadow-digital-inset">
                        <div 
                            className="bg-primary h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${(verificationLevelValue / (Object.values(VerificationLevel).length -1)) * 100}%` }}
                        ></div>
                    </div>
                </div>
                {kycFeatures.map(feature => (
                    <KycFeatureCard 
                        key={feature.title}
                        icon={feature.icon}
                        title={feature.title}
                        description={feature.description}
                        unlocked={verificationLevelValue >= feature.requiredLevelValue}
                        requiredLevel={feature.requiredLevel.split(':')[0]}
                        imageUrl={feature.imageUrl}
                    />
                ))}
            </div>
        </div>
        
        <div className="bg-slate-200 rounded-2xl shadow-digital">
          <div className="p-6 border-b border-slate-300"><h2 className="text-xl font-bold text-[#1E293B]">Push Notification Preferences</h2></div>
            <div className="p-6 divide-y divide-slate-300">
                <div className="py-4 flex justify-between items-center">
                    <div>
                        <h4 className="font-semibold text-[#0F172A]">Transactions</h4>
                        <p className="text-sm text-[#0F172A]">Receive alerts for sent, received, and failed transactions.</p>
                    </div>
                    <label htmlFor="transactions-toggle" className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="transactions-toggle" className="sr-only peer" checked={pushNotificationSettings.transactions} onChange={(e) => onUpdatePushNotificationSettings({ transactions: e.target.checked })} />
                        <div className="w-11 h-6 bg-slate-200 rounded-full peer shadow-digital-inset peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-digital peer-checked:bg-primary dark:bg-slate-800"></div>
                    </label>
                </div>
                <div className="py-4 flex justify-between items-center">
                    <div>
                        <h4 className="font-semibold text-[#0F172A]">Security Alerts</h4>
                        <p className="text-sm text-[#0F172A]">Get notified about new logins, password changes, and new devices.</p>
                    </div>
                    <label htmlFor="security-toggle" className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="security-toggle" className="sr-only peer" checked={pushNotificationSettings.security} onChange={(e) => onUpdatePushNotificationSettings({ security: e.target.checked })} />
                        <div className="w-11 h-6 bg-slate-200 rounded-full peer shadow-digital-inset peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-digital peer-checked:bg-primary dark:bg-slate-800"></div>
                    </label>
                </div>
                <div className="py-4 flex justify-between items-center">
                    <div>
                        <h4 className="font-semibold text-[#0F172A]">Promotions & Offers</h4>
                        <p className="text-sm text-[#0F172A]">Receive updates on new products, features, and special offers.</p>
                    </div>
                    <label htmlFor="promotions-toggle" className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="promotions-toggle" className="sr-only peer" checked={pushNotificationSettings.promotions} onChange={(e) => onUpdatePushNotificationSettings({ promotions: e.target.checked })} />
                        <div className="w-11 h-6 bg-slate-200 rounded-full peer shadow-digital-inset peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-digital peer-checked:bg-primary dark:bg-slate-800"></div>
                    </label>
                </div>
                
                {/* ADVANCED TRANSACTION ALERT CHANNELS */}
                <div className="py-5 bg-primary/5 -mx-6 px-6 border-y border-slate-300 space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-black text-xs text-primary uppercase tracking-widest">Sovereign Asset Threshold Warnings</h4>
                            <p className="text-xs text-[#0F172A] mt-0.5">Automated SMS & push dispatch systems when asset volume exceeds your defined parameters.</p>
                        </div>
                        <label htmlFor="alert-amount-toggle" className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                id="alert-amount-toggle" 
                                className="sr-only peer" 
                                checked={pushNotificationSettings.alertOnAmountEnabled ?? true} 
                                onChange={(e) => onUpdatePushNotificationSettings({ alertOnAmountEnabled: e.target.checked })} 
                            />
                            <div className="w-11 h-6 bg-slate-300 rounded-full peer shadow-digital-inset peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-digital peer-checked:bg-primary dark:bg-slate-800"></div>
                        </label>
                    </div>

                    {(pushNotificationSettings.alertOnAmountEnabled ?? true) && (
                        <div className="animate-fade-in p-4 bg-white rounded-xl border border-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-4 dark:bg-slate-800">
                            <div>
                                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">Warning Threshold Limit (USD)</label>
                                <span className="text-[10px] text-[#0F172A]">Immediate SMS alerts trigger if any single transfer meets or exceeds this amount.</span>
                            </div>
                            <div className="relative rounded-lg shadow-sm w-full md:w-48">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-[#0F172A] font-bold">$</span>
                                </div>
                                <input
                                    type="number"
                                    name="alertAmountThreshold"
                                    id="alertAmountThreshold"
                                    min="1"
                                    className="block w-full pl-7 pr-12 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-[#1E293B] font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-900"
                                    value={pushNotificationSettings.alertAmountThreshold ?? 1000}
                                    onChange={(e) => onUpdatePushNotificationSettings({ alertAmountThreshold: Number(e.target.value) })}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-[#0F172A] dark:text-white font-bold text-[10px]">USD</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-semibold text-[#0F172A]">Regulated Clearance Review Warnings</h4>
                            <p className="text-sm text-[#0F172A]">Immediate SMS alerts dispatched if any transfer is held or flagged by Senior Compliance Desk.</p>
                        </div>
                        <label htmlFor="alert-flagged-toggle" className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                id="alert-flagged-toggle" 
                                className="sr-only peer" 
                                checked={pushNotificationSettings.alertOnFlaggedEnabled ?? true} 
                                onChange={(e) => onUpdatePushNotificationSettings({ alertOnFlaggedEnabled: e.target.checked })} 
                            />
                            <div className="w-11 h-6 bg-slate-300 rounded-full peer shadow-digital-inset peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-digital peer-checked:bg-primary dark:bg-slate-800"></div>
                        </label>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                        <div>
                            <h4 className="font-semibold text-[#0F172A]">Institutional Compliance Fee Alerts</h4>
                            <p className="text-sm text-[#0F172A]">Dispatches an instant high-priority push warning if a transfer's compliance halt fee meets or exceeds your threshold.</p>
                        </div>
                        <label htmlFor="alert-compliance-fee-toggle" className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                id="alert-compliance-fee-toggle" 
                                className="sr-only peer" 
                                checked={pushNotificationSettings.alertOnComplianceFeeEnabled ?? true} 
                                onChange={(e) => onUpdatePushNotificationSettings({ alertOnComplianceFeeEnabled: e.target.checked })} 
                            />
                            <div className="w-11 h-6 bg-slate-300 rounded-full peer shadow-digital-inset peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-digital peer-checked:bg-primary dark:bg-slate-800"></div>
                        </label>
                    </div>

                    {(pushNotificationSettings.alertOnComplianceFeeEnabled ?? true) && (
                        <div className="animate-fade-in p-4 bg-white rounded-xl border border-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-4 dark:bg-slate-800">
                            <div>
                                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">Compliance Fee Percentage Threshold</label>
                                <span className="text-[10px] text-[#0F172A] font-bold">Triggers an alert if the compliance halt fee is equal to or greater than this percentage of the transfer amount.</span>
                            </div>
                            <div className="relative rounded-lg shadow-sm w-full md:w-32">
                                <input
                                    type="number"
                                    name="complianceFeeThresholdPercentage"
                                    id="complianceFeeThresholdPercentage"
                                    min="1"
                                    max="100"
                                    className="block w-full pr-8 pl-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-[#1E293B] font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-right dark:bg-slate-900"
                                    value={pushNotificationSettings.complianceFeeThresholdPercentage ?? 15}
                                    onChange={(e) => onUpdatePushNotificationSettings({ complianceFeeThresholdPercentage: Number(e.target.value) })}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-[#0F172A] dark:text-white font-bold text-[10px]">%</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        <div className="bg-slate-200 rounded-2xl shadow-digital">
            <div className="p-6 border-b border-slate-300 flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-bold text-[#1E293B]">Sovereign WhatsApp Node Integration</h2>
                <span className="text-[9px] bg-emerald-500 border border-emerald-500/35 text-emerald-600 font-black py-0.5 px-2 rounded-full uppercase tracking-widest animate-pulse">PREMIUM</span>
            </div>
            <div className="p-6 space-y-6">
                <div className="text-sm font-semibold text-[#0F172A] leading-relaxed">
                    Synchronize high-security OTP clearances, instant transaction receipts, ledger updates, and security notifications directly to your private WhatsApp workspace.
                </div>

                {/* Configuration Checklist */}
                <div className="p-4 bg-slate-50 text-white rounded-2xl space-y-4 shadow-digital text-left dark:bg-slate-900">
                    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2.5">
                        <HelpCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Sandbox Coordination Protocol</span>
                    </div>
                    <p className="text-[11px] text-[#0F172A] leading-relaxed font-semibold">
                        To receive authentic real-time WhatsApp alerts and login OTP tokens on your physical device, register with Twilio's open gateway:
                    </p>
                    <div className="space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-100 p-3 rounded-xl border border-slate-200 dark:border-white/10">
                            <div>
                                <span className="text-[9px] text-[#0F172A] uppercase tracking-widest font-black">1. Add Gateway Contact</span>
                                <p className="text-xs font-mono font-bold text-white mt-0.5">+1 415 523 8886</p>
                            </div>
                            <div>
                                <span className="text-[9px] text-[#0F172A] uppercase tracking-widest font-black">2. Send Code</span>
                                <div className="flex items-center gap-2.5 mt-0.5">
                                    <code className="text-xs font-mono font-bold text-emerald-400">join direction-balloon</code>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText('join direction-balloon');
                                            setCopiedSandboxInsideSettings(true);
                                            setTimeout(() => setCopiedSandboxInsideSettings(false), 2000);
                                        }}
                                        className="p-1.5 bg-white hover:bg-white rounded-md transition-colors dark:bg-slate-800"
                                        title="Copy sandbox coordinate"
                                    >
                                        {copiedSandboxInsideSettings ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5 text-[#0F172A]" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[#0F172A] font-semibold italic">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            Status: Connected to Virtual Ingress Node Switzerland. Ready for dispatch.
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-slate-300">
                    {/* Toggle 1: WhatsApp MFA OTP */}
                    <div className="py-4 flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-[#1E293B]">WhatsApp OTP Routing</h4>
                            <p className="text-xs text-[#0F172A] mt-0.5">Prefer WhatsApp for secure 2FA and multi-channel clearance handshakes during logins.</p>
                        </div>
                        <label htmlFor="whatsapp-mfa-toggle" className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                id="whatsapp-mfa-toggle" 
                                className="sr-only peer" 
                                checked={whatsAppMfaEnabled} 
                                onChange={(e) => {
                                    setWhatsAppMfaEnabled(e.target.checked);
                                    onUpdateSecuritySettings({ mfa: { ...securitySettings.mfa, method: e.target.checked ? 'whatsapp' : 'sms' } });
                                }} 
                            />
                            <div className="w-11 h-6 bg-slate-300 peer peer-focus:outline-none rounded-full peer shadow-digital-inset peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-digital peer-checked:bg-emerald-500 dark:bg-slate-800"></div>
                        </label>
                    </div>

                    {/* Toggle 2: WhatsApp Transaction alerts */}
                    <div className="py-4 flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-[#1E293B]">Real-time Node Alerts</h4>
                            <p className="text-xs text-[#0F172A] mt-0.5">Receive immediate WhatsApp announcements for transfers, card charges, block validations and key rotations.</p>
                        </div>
                        <label htmlFor="whatsapp-alerts-toggle" className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                id="whatsapp-alerts-toggle" 
                                className="sr-only peer" 
                                checked={whatsAppAlertsEnabled} 
                                onChange={(e) => setWhatsAppAlertsEnabled(e.target.checked)} 
                            />
                            <div className="w-11 h-6 bg-slate-300 peer peer-focus:outline-none rounded-full peer shadow-digital-inset peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-digital peer-checked:bg-emerald-500 dark:bg-slate-800"></div>
                        </label>
                    </div>
                </div>

                {/* Interactive Verification Test Sandbox */}
                <div className="bg-slate-50 border border-slate-300 rounded-2xl p-4.5 space-y-4 text-left dark:bg-slate-900">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#0F172A]">Instant Alert Pipeline Validator</span>
                    
                    <div className="flex flex-col md:flex-row gap-3">
                         <div className="flex-1">
                            <input 
                                type="text" 
                                value={testWhatsAppNumber}
                                onChange={(e) => setTestWhatsAppNumber(e.target.value)}
                                className="w-full bg-white border border-slate-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs font-bold text-[#1E293B] dark:bg-slate-800"
                                placeholder="+13159000000"
                            />
                            <label className="text-[9px] text-[#0F172A] font-semibold mt-1 block">Specify target international mobile number with country code.</label>
                        </div>
                        <button
                            type="button"
                            onClick={handleSendTestWhatsApp}
                            disabled={isSendingTestWhatsApp || !testWhatsAppNumber}
                            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-70 font-bold text-xs text-[#0F172A] rounded-xl shadow-lg shadow-emerald-500/10 transition-colors flex items-center justify-center gap-2 self-start"
                        >
                            {isSendingTestWhatsApp ? (
                                <>
                                    <SpinnerIcon className="w-4 h-4 animate-spin text-[#0F172A]" />
                                    Routing...
                                </>
                            ) : (
                                <>
                                    <MessageSquare className="w-4 h-4" />
                                    Send Private Test Alert
                                </>
                            )}
                        </button>
                    </div>

                    {testNotificationResult && (
                        <div className={`p-3.5 rounded-xl border text-xs font-bold animate-fade-in ${testNotificationResult.success ? 'bg-emerald-50 border-emerald-500/25 text-emerald-800' : 'bg-red-50 border-red-500/25 text-red-800'}`}>
                            {testNotificationResult.success ? (
                                <div className="flex items-start gap-2">
                                    <span className="text-base">🔐</span>
                                    <p>HANDOFF COMPLETED: High-security check notification transmitted successfully. Intercepted preview banner on target workspace.</p>
                                </div>
                            ) : (
                                <div className="flex items-start gap-2">
                                     <span className="text-base font-bold">⚠️</span>
                                    <p>TRANSMISSION DENIED: {testNotificationResult.error || 'Check Sandbox status.'}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="bg-slate-200 rounded-2xl shadow-digital">
            <div className="p-6 border-b border-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <CloudOff className="w-5 h-5 text-amber-500" />
                    <div>
                        <h2 className="text-xl font-bold text-[#1E293B]">Secure Offline Enclave</h2>
                        <p className="text-xs text-[#0F172A] mt-0.5">Pre-fetch and cryptographically store ledger assets for offline resiliency.</p>
                    </div>
                </div>
                <span className={`text-[9px] font-black py-0.5 px-2 rounded-full uppercase tracking-widest ${offlineModeActive ? 'bg-amber-500 border border-amber-500/35 text-amber-600 animate-pulse' : 'bg-green-500 border border-green-500/35 text-green-600'}`}>
                    {offlineModeActive ? 'Offline Active' : 'Online Sync'}
                </span>
            </div>
            <div className="p-6 space-y-6">
                <p className="text-sm font-semibold text-[#0F172A] leading-relaxed">
                    Configure a read-only local sandbox enclave containing cached checking accounts, savings profiles, and historic transaction ledgers. This guarantees uninterrupted asset verification even under total network blackouts.
                </p>

                <div className="divide-y divide-slate-300">
                    <div className="py-4 flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-[#1E293B]">Local Enclave Storage Tunnelling</h4>
                            <p className="text-xs text-[#0F172A] mt-0.5">Toggle to simulate real-time network severing and lock this terminal to local secure cache databases only.</p>
                        </div>
                        <label htmlFor="offline-mode-toggle" className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                id="offline-mode-toggle" 
                                className="sr-only peer" 
                                checked={offlineModeActive} 
                                disabled={isSyncingOffline}
                                onChange={(e) => handleToggleOfflineMode(e.target.checked)} 
                            />
                            <div className="w-11 h-6 bg-slate-300 peer peer-focus:outline-none rounded-full peer shadow-digital-inset peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-digital peer-checked:bg-amber-500 dark:bg-slate-800"></div>
                        </label>
                    </div>
                </div>

                {isSyncingOffline && (
                    <div className="p-4 bg-slate-50 text-white rounded-2xl space-y-3 shadow-digital text-left animate-fade-in dark:bg-slate-900">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-amber-400">
                            <span>Securing Offline Cryptopatch...</span>
                            <span>{syncProgress}%</span>
                        </div>
                        <div className="w-full bg-white h-2 rounded-full overflow-hidden dark:bg-slate-800">
                            <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${syncProgress}%` }} />
                        </div>
                        <p className="text-xs font-mono font-bold text-[#0F172A] italic">
                            &gt; {syncStepText}
                        </p>
                    </div>
                )}

                <div className="p-4 bg-slate-250 rounded-xl flex flex-col sm:flex-row gap-4 justify-between border border-slate-300 text-xs font-semibold text-[#0F172A]">
                    <div>
                        <span className="text-[#0F172A] block uppercase text-[9px] font-black tracking-wider">Sync State</span>
                        <span className="text-[#1E293B] font-bold">{lastSyncTime ? `Vault Loaded (${lastSyncTime})` : 'No Sync Loaded'}</span>
                    </div>
                    <div>
                        <span className="text-[#0F172A] block uppercase text-[9px] font-black tracking-wider">Storage Cryptography</span>
                        <span className="text-[#1E293B] font-bold">AES_256_GCM Sandboxed Enclave</span>
                    </div>
                    <div>
                        <span className="text-[#0F172A] block uppercase text-[9px] font-black tracking-wider">Audit Version</span>
                        <span className="text-[#1E293B] font-bold">v2.1_OFFLINE</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="bg-slate-200 rounded-2xl shadow-digital">
          <div className="p-6 border-b border-slate-300"><h2 className="text-xl font-bold text-[#1E293B]">Email Notification Preferences</h2></div>
            <div className="p-6 divide-y divide-slate-300">
                <div className="py-4 flex justify-between items-center">
                    <div>
                        <h4 className="font-semibold text-[#0F172A]">Transactions</h4>
                        <p className="text-sm text-[#0F172A]">Receive receipts and transfer updates via email.</p>
                    </div>
                    <label htmlFor="email-transactions-toggle" className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="email-transactions-toggle" className="sr-only peer" checked={privacySettings.email.transactions} onChange={(e) => onUpdatePrivacySettings({ email: { ...privacySettings.email, transactions: e.target.checked } })} />
                        <div className="w-11 h-6 bg-slate-200 rounded-full peer shadow-digital-inset peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-digital peer-checked:bg-primary dark:bg-slate-800"></div>
                    </label>
                </div>
                <div className="py-4 flex justify-between items-center">
                    <div>
                        <h4 className="font-semibold text-[#0F172A]">Security Alerts</h4>
                        <p className="text-sm text-[#0F172A]">Get emailed about new logins, password changes, and new devices.</p>
                    </div>
                    <label htmlFor="email-security-toggle" className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="email-security-toggle" className="sr-only peer" checked={privacySettings.email.security} onChange={(e) => onUpdatePrivacySettings({ email: { ...privacySettings.email, security: e.target.checked } })} />
                        <div className="w-11 h-6 bg-slate-200 rounded-full peer shadow-digital-inset peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-digital peer-checked:bg-primary dark:bg-slate-800"></div>
                    </label>
                </div>
                <div className="py-4 flex justify-between items-center">
                    <div>
                        <h4 className="font-semibold text-[#0F172A]">Promotions & Offers</h4>
                        <p className="text-sm text-[#0F172A]">Receive email updates on new products, features, and special offers.</p>
                    </div>
                    <label htmlFor="email-promotions-toggle" className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="email-promotions-toggle" className="sr-only peer" checked={privacySettings.email.promotions} onChange={(e) => onUpdatePrivacySettings({ email: { ...privacySettings.email, promotions: e.target.checked } })} />
                        <div className="w-11 h-6 bg-slate-200 rounded-full peer shadow-digital-inset peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-digital peer-checked:bg-primary dark:bg-slate-800"></div>
                    </label>
                </div>
            </div>
        </div>
        
        <div className="bg-slate-200 rounded-2xl shadow-digital">
          <div className="p-6 border-b border-slate-300"><h2 className="text-xl font-bold text-[#1E293B]">SMS Notification Preferences</h2></div>
            <div className="p-6 divide-y divide-slate-300">
                <div className="py-4 flex justify-between items-center">
                    <div>
                        <h4 className="font-semibold text-[#0F172A]">Critical Transaction Alerts</h4>
                        <p className="text-sm text-[#0F172A]">Receive an SMS for debits and credits on your account.</p>
                    </div>
                    <label htmlFor="sms-transactions-toggle" className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="sms-transactions-toggle" className="sr-only peer" checked={privacySettings.sms.transactions} onChange={(e) => onUpdatePrivacySettings({ sms: { ...privacySettings.sms, transactions: e.target.checked } })} />
                        <div className="w-11 h-6 bg-slate-200 rounded-full peer shadow-digital-inset peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-digital peer-checked:bg-primary dark:bg-slate-800"></div>
                    </label>
                </div>
                <div className="py-4 flex justify-between items-center">
                    <div>
                        <h4 className="font-semibold text-[#0F172A]">Security Alerts</h4>
                        <p className="text-sm text-[#0F172A]">Get urgent security notifications like new logins via SMS.</p>
                    </div>
                    <label htmlFor="sms-security-toggle" className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="sms-security-toggle" className="sr-only peer" checked={privacySettings.sms.security} onChange={(e) => onUpdatePrivacySettings({ sms: { ...privacySettings.sms, security: e.target.checked } })} />
                        <div className="w-11 h-6 bg-slate-200 rounded-full peer shadow-digital-inset peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-digital peer-checked:bg-primary dark:bg-slate-800"></div>
                    </label>
                </div>
                <div className="py-4 flex justify-between items-center">
                    <div>
                        <h4 className="font-semibold text-[#0F172A]">Promotions & Offers</h4>
                        <p className="text-sm text-[#0F172A]">Receive occasional offers and new feature updates via SMS.</p>
                    </div>
                    <label htmlFor="sms-promotions-toggle" className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="sms-promotions-toggle" className="sr-only peer" checked={privacySettings.sms.promotions} onChange={(e) => onUpdatePrivacySettings({ sms: { ...privacySettings.sms, promotions: e.target.checked } })} />
                        <div className="w-11 h-6 bg-slate-200 rounded-full peer shadow-digital-inset peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-digital peer-checked:bg-primary dark:bg-slate-800"></div>
                    </label>
                </div>
            </div>
        </div>

        {/* Terminal Account Deletion Card */}
        <div className="bg-red-50 border border-red-200 dark:bg-red-950 dark:border-red-900/40 rounded-2xl shadow-digital overflow-hidden">
            <div className="p-6 border-b border-red-200 dark:border-red-900/30 bg-red-100 dark:bg-red-950 flex items-center justify-between">
                <div>
                     <h2 className="text-xl font-extrabold text-red-700 dark:text-red-400 uppercase tracking-widest flex items-center gap-2">
                         <TrashIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                         Terminal Account Deletion
                     </h2>
                </div>
                <span className="px-3 py-1 bg-red-600 border border-red-500/20 text-red-700 dark:text-red-400 rounded-full font-bold text-[9px] uppercase tracking-widest leading-none">
                     Irreversible Action
                </span>
            </div>
            
            <div className="p-6 space-y-5">
                <p className="text-xs text-red-800 dark:text-red-300/80 leading-relaxed font-semibold font-sans">
                    By permanently purging your account, you authorize First Pacific Bank, N.A. to immediately close all active deposit accounts, revoke master cards, delete secure keychains, and purge all compliance ledger nodes. This process takes effect in real-time and is <strong className="text-red-600 dark:text-red-400 uppercase font-sans font-bold">100% permanent</strong>.
                </p>
                
                <form onSubmit={handleDeleteAccount} className="max-w-md space-y-4">
                     <div>
                         <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#0F172A] dark:text-white mb-2">
                              Enter Secure Enclave Account Password
                         </label>
                         <input 
                             type="password"
                             value={deletePassword}
                             onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(''); }}
                             className="w-full bg-slate-50 border border-slate-300 dark:bg-slate-800 dark:border-white/10 text-[#0F172A] dark:text-white p-4 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all font-mono text-base tracking-[0.2em]"
                             placeholder="••••••••••••"
                             disabled={isDeleting || deleteSuccess}
                         />
                     </div>
                     
                     {deleteError && (
                         <div className="p-3 bg-red-50 border border-red-100 dark:bg-red-950 dark:border-red-900/10 rounded-lg text-xs text-red-600 dark:text-red-400 font-bold animate-pulse">
                             {deleteError}
                         </div>
                     )}
                     
                     {deleteSuccess && (
                         <div className="p-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900/30 rounded-lg text-xs text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-2">
                             <Check className="w-4 h-4 text-emerald-500" />
                             ACCOUNT DELETED PERMANENTLY. Redirecting to Terminal...
                         </div>
                     )}
                     
                     <button
                         type="submit"
                         disabled={isDeleting || deleteSuccess || !deletePassword}
                         className="w-full sm:w-auto px-6 py-4 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg shadow-red-900/10"
                     >
                         {isDeleting ? (
                             <>
                                 <SpinnerIcon className="w-4 h-4 animate-spin text-white" />
                                 <span>DELETING PROFILE LEDGER...</span>
                             </>
                         ) : (
                             <>
                                 <TrashIcon className="w-4 h-4 text-white" />
                                 <span>DELETE MY ACCOUNT IMMEDIATELY</span>
                             </>
                         )}
                     </button>
                </form>
            </div>
        </div>

        </>
        )}
      </div>
      {isVerificationModalOpen && (
        <VerificationCenter 
            currentLevel={verificationLevel}
            onClose={handleVerificationModalClose}
            userEmail={userProfile.email}
        />
      )}
       {is2FAModalOpen && (
          <Setup2FAModal
            onClose={() => setIs2FAModalOpen(false)}
            settings={securitySettings.mfa}
            onUpdate={(mfaUpdate) => onUpdateSecuritySettings({ mfa: { ...securitySettings.mfa, ...mfaUpdate } })}
            userProfile={userProfile}
          />
      )}
      {isBiometricsModalOpen && (
          <SetupBiometricsModal 
            onClose={() => setIsBiometricsModalOpen(false)}
            onEnable={() => onUpdateSecuritySettings({ biometricsEnabled: true })}
            userProfile={userProfile}
          />
      )}
      {deviceToRevoke && (
          <RevokeDeviceModal 
            device={deviceToRevoke}
            onClose={() => setDeviceToRevoke(null)}
            onConfirm={confirmRevocation}
          />
      )}
      {isLockdownModalOpen && (
          <EmergencyLockdownModal 
            onClose={() => setIsLockdownModalOpen(false)}
            onConfirm={() => {
                // 1. Freeze all cards
                cards.forEach(card => onUpdateCardControls(card.id, { isFrozen: true }));
                
                // 2. Revoke all devices except current
                trustedDevices.forEach(device => {
                    if (!device.isCurrent) onRevokeDevice(device.id);
                });

                // 3. Set limits to 0
                onUpdateAdvancedLimits({
                    p2p: { ...advancedTransferLimits.p2p, daily: 0 },
                    ach: { ...advancedTransferLimits.ach, daily: 0 },
                    wire: { ...advancedTransferLimits.wire, daily: 0 },
                    internal: { ...advancedTransferLimits.internal, daily: 0 }
                });
                
                // 4. Trigger global account freeze via socket
                socket.emit('admin:freeze_user', { email: userProfile.email });

                setIsLockdownModalOpen(false);
                alert("Emergency Lockdown Activated. All cards frozen and transfers disabled.");
            }}
          />
      )}
    </>
  );
};
