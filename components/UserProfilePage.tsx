import React, { useRef, useState, useEffect } from 'react';
import { SmartyAddressInput, AddressDetails } from './SmartyAddressInput';
import { UserProfile, Card, Account } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { EXTENDED_LANGUAGES, CURRENCIES_LIST } from './constants';
import { GlobeAmericasIcon } from './Icons';
import { 
    Smartphone, Apple, Play, Download, ShieldCheck, Cpu, Zap, 
    QrCode, ExternalLink, HelpCircle, CheckCircle, RefreshCw, 
    Key, Radio, Fingerprint, Waves, Wifi, Battery, Send, Info,
    Sparkles, FileCode, Check, Copy, ArrowRight, Bitcoin, CreditCard,
    Landmark, DollarSign, Eye, EyeOff, Lock, Unlock, CheckCircle2, ChevronRight, AlertTriangle,
    Camera, Link, X, User, Clock, MapPin, Edit3
} from 'lucide-react';

interface UserProfilePageProps {
    userProfile: UserProfile;
    onUpdateProfilePicture: (url: string) => void;
    cards?: Card[];
    onUpdateCard?: (id: string, updates: Partial<Card>) => void;
    accounts?: Account[];
    onUpdateAccount?: (id: string, updates: Partial<Account>) => void;
    onUpdateProfile?: (updates: Partial<UserProfile>) => void;
}

type Tab = 'identity' | 'security' | 'preferences' | 'cards' | 'crypto' | 'withdraw';

export const UserProfilePage: React.FC<UserProfilePageProps> = ({ 
    userProfile, 
    onUpdateProfilePicture,
    cards = [],
    onUpdateCard,
    accounts = [],
    onUpdateAccount,
    onUpdateProfile
}) => {
    const { language, setLanguage } = useLanguage();
    const { displayCurrency, setDisplayCurrency } = useCurrency();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    
    // Premium Profile Editing States
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editedName, setEditedName] = useState(userProfile.name || '');
    const [editedPhone, setEditedPhone] = useState(userProfile.phone || '');
    const [editedAddress, setEditedAddress] = useState(userProfile.address || '');
    const [editedPosition, setEditedPosition] = useState(userProfile.position || '');

    // Reset fields when profile changes
    useEffect(() => {
        setEditedName(userProfile.name || '');
        setEditedPhone(userProfile.phone || '');
        setEditedAddress(userProfile.address || '');
        setEditedPosition(userProfile.position || '');
    }, [userProfile]);
    
    // Premium Interactive Module States
    const [activeTab, setActiveTab] = useState<Tab>('identity');
    
    // 1. Selector for current active card
    const defaultFallbackCard: Card = {
        id: 'fallback_sovereign_1',
        lastFour: '8829',
        cardholderName: userProfile.name,
        expiryDate: '12/28',
        fullNumber: '4000 1234 5678 8829',
        cvc: '123',
        network: 'Visa',
        cardType: 'DEBIT',
        controls: {
            isFrozen: false,
            onlinePurchases: true,
            internationalTransactions: true
        }
    };
    const activeCards = cards && cards.length > 0 ? cards : [defaultFallbackCard];
    const [selectedCardId, setSelectedCardId] = useState<string>(activeCards[0].id);
    const currentCard = activeCards.find(c => c.id === selectedCardId) || activeCards[0];
    
    // Apple Pay & Google Pay states (Local/Session state synchronized with Card models)
    const [provisionState, setProvisionState] = useState<{
        [key: string]: { applePay: boolean; googlePay: boolean }
    }>({});
    const [walletModal, setWalletModal] = useState<{
        isOpen: boolean;
        type: 'apple' | 'google' | null;
        step: 'init' | 'biometric' | 'success' | null;
    }>({ isOpen: false, type: null, step: null });

    // 2. PIN Enforcer state
    const [pinState, setPinState] = useState({
        currentPin: '',
        newPin: '',
        confirmPin: '',
        message: '',
        isError: false,
    });
    const [pinKeysInput, setPinKeysInput] = useState<'current' | 'new' | 'confirm'>('current');

    // 3. Bitcoin Enclave state
    const [btcAddress, setBtcAddress] = useState('bc1q8829px7fbncs9273k928f09d8aa39fsh8829xx');
    const [isEditingBtc, setIsEditingBtc] = useState(false);
    const [btcAddressInput, setBtcAddressInput] = useState(btcAddress);
    const [btcError, setBtcError] = useState('');
    const [btcReserveRatio, setBtcReserveRatio] = useState(15); // Percentage auto-swept to BTC
    const [btcExchangeRate, setBtcExchangeRate] = useState(64821.50);
    const [virtualBtcBalance, setVirtualBtcBalance] = useState(0.42893);

    // 4. Withdrawal state
    const [withdrawTab, setWithdrawTab] = useState<'atm' | 'swift' | 'btc'>('atm');
    const [atmToken, setAtmToken] = useState<string | null>(null);
    const [atmTimeLeft, setAtmTimeLeft] = useState(0);
    
    // Wire withdrawal form
    const [wireForm, setWireForm] = useState({
        iban: '',
        bankName: '',
        routingNumber: '',
        amount: '',
        country: 'United States',
        successMsg: '',
        errorMsg: ''
    });

    // Bitcoin withdrawal form
    const [btcWithdrawForm, setBtcWithdrawForm] = useState({
        amountUSD: '',
        destAddress: btcAddress,
        successMsg: '',
        errorMsg: ''
    });

    // Custom ticker logic for BTC
    useEffect(() => {
        const interval = setInterval(() => {
            setBtcExchangeRate(prev => {
                const change = (Math.random() - 0.5) * 55;
                return Math.max(50000, Number((prev + change).toFixed(2)));
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // ATM Token Countdown
    useEffect(() => {
        if (atmTimeLeft > 0) {
            const timer = setTimeout(() => setAtmTimeLeft(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setAtmToken(null);
        }
    }, [atmTimeLeft]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("File size must be less than 5MB");
                return;
            }
            setIsUploading(true);
            const reader = new FileReader();
            reader.onload = () => {
                setTimeout(() => {
                    onUpdateProfilePicture(reader.result as string);
                    setIsUploading(false);
                }, 1500);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (imageUrl.trim()) {
            setIsUploading(true);
            setTimeout(() => {
                onUpdateProfilePicture(imageUrl.trim());
                setIsUploading(false);
                setShowUrlInput(false);
                setImageUrl('');
            }, 800);
        }
    };

    // Card PIN keypad clicks
    const handleKeypadPress = (val: string) => {
        if (val === 'CLEAR') {
            setPinState(prev => {
                if (pinKeysInput === 'current') return { ...prev, currentPin: '' };
                if (pinKeysInput === 'new') return { ...prev, newPin: '' };
                return { ...prev, confirmPin: '' };
            });
            return;
        }

        setPinState(prev => {
            const currentStr = pinKeysInput === 'current' 
                ? prev.currentPin 
                : pinKeysInput === 'new' 
                ? prev.newPin 
                : prev.confirmPin;
                
            if (currentStr.length >= 4) return prev; // Limit to 4 digits
            const newStr = currentStr + val;

            if (pinKeysInput === 'current') return { ...prev, currentPin: newStr, message: '' };
            if (pinKeysInput === 'new') return { ...prev, newPin: newStr, message: '' };
            return { ...prev, confirmPin: newStr, message: '' };
        });

        // Synthetic subtle sound trigger
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = 880; // A5
            gain.gain.setValueAtTime(0.01, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        } catch (_) {}
    };

    const submitPinChange = () => {
        const { currentPin, newPin, confirmPin } = pinState;
        if (currentPin.length !== 4 || newPin.length !== 4 || confirmPin.length !== 4) {
            setPinState(prev => ({ ...prev, isError: true, message: 'All PIN entries must be exactly 4 digits.' }));
            return;
        }
        if (newPin !== confirmPin) {
            setPinState(prev => ({ ...prev, isError: true, message: 'Confirm PIN does not match New PIN.' }));
            return;
        }
        if (currentPin === newPin) {
            setPinState(prev => ({ ...prev, isError: true, message: 'New PIN must be different from current PIN.' }));
            return;
        }

        // Successfully updated PIN
        setPinState(prev => ({
            ...prev,
            isError: false,
            message: '✓ SECURE ENCLAVE WRITTEN: Card PIN written into security element chip memory.',
            currentPin: '',
            newPin: '',
            confirmPin: ''
        }));
        setPinKeysInput('current');

        // Play positive sound cue
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
            osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
            gain.gain.setValueAtTime(0.015, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
        } catch (_) {}

        // Global activity log Dispatch
        try {
            window.dispatchEvent(new CustomEvent('APP_REALTIME_ACTIVITY', {
                detail: {
                    type: 'upgrade',
                    message: `Re-encrypted sovereign PIN passcode for card ending ${currentCard.lastFour}`,
                    name: 'Trust Enclave',
                    country: 'Local Sec Code',
                    flag: '🔑',
                    amount: 0
                }
            }));
        } catch (_) {}
    };

    // Bitcoin Save address
    const handleSaveBtcAddress = () => {
        if (!btcAddressInput.trim() || btcAddressInput.length < 26) {
            setBtcError('Invalid address structure. Must be a valid mainnet Bitcoin P2SH/Bech32 address.');
            return;
        }
        setBtcAddress(btcAddressInput.trim());
        setIsEditingBtc(false);
        setBtcError('');
        
        // Dispatch event
        try {
            window.dispatchEvent(new CustomEvent('APP_REALTIME_ACTIVITY', {
                detail: {
                    type: 'crypto',
                    message: `Sovereign cold-wallet routing address updated: ${btcAddressInput.trim().slice(0, 10)}...`,
                    name: 'Sovereign Enclave',
                    country: 'Bitcoin Net',
                    flag: '🪙',
                    amount: 0
                }
            }));
        } catch (_) {}
    };

    // Google/Apple wallet provisioning simulation
    const launchWalletProvisioning = (type: 'apple' | 'google') => {
        setWalletModal({ isOpen: true, type, step: 'init' });
        
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            gain.gain.setValueAtTime(0.01, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        } catch (_) {}

        setTimeout(() => {
            setWalletModal(prev => ({ ...prev, step: 'biometric' }));
            // Simulate FaceID scanner buzzes
            setTimeout(() => {
                setWalletModal(prev => ({ ...prev, step: 'success' }));
                
                // Track dynamic wallet local state
                setProvisionState(prev => ({
                    ...prev,
                    [selectedCardId]: {
                        ...prev[selectedCardId],
                        applePay: type === 'apple' ? true : !!prev[selectedCardId]?.applePay,
                        googlePay: type === 'google' ? true : !!prev[selectedCardId]?.googlePay,
                    }
                }));

                // Call onUpdateCard callback to synchronize with state
                if (onUpdateCard) {
                    onUpdateCard(selectedCardId, {
                        ...currentCard,
                        linkedAccountId: currentCard.linkedAccountId || 'provisioned'
                    });
                }

                // Dispath notification / sound
                try {
                    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.frequency.setValueAtTime(880, ctx.currentTime);
                    osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.1);
                    gain.gain.setValueAtTime(0.02, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.3);
                } catch (_) {}

                try {
                    window.dispatchEvent(new CustomEvent('APP_REALTIME_ACTIVITY', {
                        detail: {
                            type: 'upgrade',
                            message: `Provisioned Card *${currentCard.lastFour} to ${type === 'apple' ? 'Apple Wallet keychain' : 'Google Pay sandbox'}`,
                            name: 'Secure Vault',
                            country: 'Handshake Node',
                            flag: '📲',
                            amount: 0
                        }
                    }));
                } catch (_) {}

            }, 2500);
        }, 1500);
    };

    // Cardless ATM Passcode Setup
    const generateAtmToken = () => {
        const randomToken = Math.floor(100000 + Math.random() * 900000).toString();
        setAtmToken(randomToken.slice(0, 3) + ' ' + randomToken.slice(3, 6));
        setAtmTimeLeft(95);

        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
            gain.gain.setValueAtTime(0.02, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.25);
        } catch (_) {}

        try {
            window.dispatchEvent(new CustomEvent('APP_REALTIME_ACTIVITY', {
                detail: {
                    type: 'upgrade',
                    message: `Dispensed Cardless ATM 6-Digit authorization bypass token online`,
                    name: 'Trust Token Node',
                    country: 'Sec Network',
                    flag: '🏧',
                    amount: 0
                }
            }));
        } catch (_) {}
    };

    // SWIFT outflow withdrawal submission
    const handleWireWithdraw = (e: React.FormEvent) => {
        e.preventDefault();
        const amt = parseFloat(wireForm.amount);
        
        // Find main account (usually checking) to debit
        const sourceAcc = accounts.length > 0 ? accounts[0] : null;
        if (!sourceAcc) {
            setWireForm(prev => ({ ...prev, errorMsg: 'No source checking accounts found.', successMsg: '' }));
            return;
        }

        if (isNaN(amt) || amt <= 0) {
            setWireForm(prev => ({ ...prev, errorMsg: 'Please input a valid positive amount.', successMsg: '' }));
            return;
        }

        if (sourceAcc.balance < amt) {
            setWireForm(prev => ({ ...prev, errorMsg: `Insufficient account liquidity. Your checking balance is $${sourceAcc.balance.toLocaleString()}.`, successMsg: '' }));
            return;
        }

        // Deduct balance and update state
        if (onUpdateAccount) {
            onUpdateAccount(sourceAcc.id, { balance: sourceAcc.balance - amt });
        } else {
            sourceAcc.balance -= amt;
        }

        setWireForm({
            iban: '',
            bankName: '',
            routingNumber: '',
            amount: '',
            country: 'United States',
            successMsg: `✓ SWIFT Outbound Dispatched: $${amt.toLocaleString()} has been safely debited from your account and wired to ${wireForm.bankName}.`,
            errorMsg: ''
        });

        // Dispatch Realtime activity
        try {
            window.dispatchEvent(new CustomEvent('APP_REALTIME_ACTIVITY', {
                detail: {
                    type: 'loan',
                    message: `Authorized direct profile wire withdrawal of $${amt.toLocaleString()} to swift nodes`,
                    name: 'Profile Secure Out',
                    country: wireForm.country,
                    flag: '🏦',
                    amount: amt
                }
            }));
        } catch (_) {}
    };

    // Bitcoin direct network withdrawal
    const handleBtcWithdraw = (e: React.FormEvent) => {
        e.preventDefault();
        const amtUSD = parseFloat(btcWithdrawForm.amountUSD);
        
        const sourceAcc = accounts.length > 0 ? accounts[0] : null;
        if (!sourceAcc) {
            setBtcWithdrawForm(prev => ({ ...prev, errorMsg: 'No source account found.', successMsg: '' }));
            return;
        }

        if (isNaN(amtUSD) || amtUSD <= 0) {
            setBtcWithdrawForm(prev => ({ ...prev, errorMsg: 'Invalid amount entered.', successMsg: '' }));
            return;
        }

        if (sourceAcc.balance < amtUSD) {
            setBtcWithdrawForm(prev => ({ ...prev, errorMsg: `Insufficient bank funds to trade.`, successMsg: '' }));
            return;
        }

        const calculatedBtc = Number((amtUSD / btcExchangeRate).toFixed(6));

        // Deduct checking balance
        if (onUpdateAccount) {
            onUpdateAccount(sourceAcc.id, { balance: sourceAcc.balance - amtUSD });
        } else {
            sourceAcc.balance -= amtUSD;
        }

        setVirtualBtcBalance(prev => prev - calculatedBtc);

        setBtcWithdrawForm({
            amountUSD: '',
            destAddress: btcAddress,
            successMsg: `✓ Bitcoin outbound conversion successful! Sent ${calculatedBtc} BTC to destination wallet: ${btcWithdrawForm.destAddress.slice(0, 15)}...`,
            errorMsg: ''
        });

        try {
            window.dispatchEvent(new CustomEvent('APP_REALTIME_ACTIVITY', {
                detail: {
                    type: 'crypto',
                    message: `Dispatched converted outbound stream of ${calculatedBtc} BTC ($${amtUSD.toLocaleString()})`,
                    name: 'Sovereign BTC Port',
                    country: 'Block Node',
                    flag: '🪙',
                    amount: amtUSD
                }
            }));
        } catch (_) {}
    };

    const activeCardState = provisionState[currentCard.id] || { applePay: false, googlePay: false };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up pb-24 font-sans text-slate-100">
            
            {/* Upper Banner Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-6">
                <div>
                    <div className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-2 animate-pulse">
                        <Sparkles className="w-3.5 h-3.5" />
                        Sovereign Centurion Terminal
                    </div>
                    <h2 className="text-3xl font-black text-[#0F172A] dark:text-white uppercase tracking-tighter">Sovereign Profile Hub</h2>
                    <p className="text-[#0F172A] dark:text-white mt-1 text-xs">Configure cold wallets, manage PIN codes, setup hardware wallets, and process secure ATM cash transfers.</p>
                </div>

                {/* Tab select indicators */}
                <div className="flex flex-wrap gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-white/10 self-start md:self-center">
                    <button 
                        onClick={() => setActiveTab('identity')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'identity' ? 'bg-white text-slate-950 shadow-md' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white'}`}
                    >
                        Identity
                    </button>
                    <button 
                        onClick={() => setActiveTab('security')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'security' ? 'bg-primary/20 text-primary border border-primary/20' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white'}`}
                    >
                        Security
                    </button>
                    <button 
                        onClick={() => setActiveTab('preferences')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'preferences' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white'}`}
                    >
                        Preferences
                    </button>
                    <button 
                        onClick={() => setActiveTab('cards')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'cards' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white'}`}
                    >
                        Cards & Wallets
                    </button>
                    <button 
                        onClick={() => setActiveTab('crypto')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'crypto' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white'}`}
                    >
                        Crypto Enclave
                    </button>
                    <button 
                        onClick={() => setActiveTab('withdraw')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'withdraw' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white'}`}
                    >
                        Withdraw
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* 1. Left side: Majestic 3D Sovereign Card & Identity Badge */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* The Visual Card */}
                    <div className="bg-[#0e1322] border border-slate-200 dark:border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl flex flex-col justify-between group">
                        
                        {/* Elite background accents */}
                        <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-primary/10 to-indigo-500/10 blur-2xl pointer-events-none rounded-full" />
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-100 border border-slate-100 dark:border-white/10 py-0.5 px-2 rounded-full z-10">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-mono text-[7px] text-[#0F172A] dark:text-white font-bold uppercase tracking-widest">ENCLAVE SECURE</span>
                        </div>

                        {/* Card Front face design */}
                        <div className="relative z-10 mb-4 pt-1 flex justify-between items-start">
                            <div>
                                <h3 className="text-sm font-black tracking-widest uppercase text-[#0F172A] dark:text-white leading-none">First Pacific</h3>
                                <p className="text-[7.5px] font-bold uppercase tracking-[0.25em] text-[#0F172A] dark:text-white mt-1">Sovereign Reserve System</p>
                            </div>
                            <Cpu className="w-9 h-7 text-amber-400/80 stroke-[1.25]" />
                        </div>

                        <div className="my-8 relative z-10">
                            <p className="font-mono text-base tracking-widest text-[#cbd5e1] font-bold">•••• •••• •••• {currentCard.lastFour || '8829'}</p>
                            <div className="flex gap-4 items-center mt-2.5">
                                <span className="font-mono text-[9px] text-[#0F172A] uppercase tracking-wider">EXP: {currentCard.expiryDate || '12/28'}</span>
                                <span className="font-mono text-[9px] text-[#0F172A] uppercase tracking-wider">CVC: •••</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-end border-t border-slate-100 dark:border-white/10 pt-4">
                            <div>
                                <p className="text-[7px] text-[#0F172A] uppercase font-black tracking-widest">Cardholder Owner</p>
                                <p className="text-[10px] font-bold text-[#0F172A] dark:text-[#1E293B] mt-0.5">{userProfile.name}</p>
                            </div>
                            <div className="flex gap-2 items-center">
                                {/* Google/Apple Wallet connection badge status */}
                                {activeCardState.applePay && (
                                    <div className="bg-white px-1.5 py-0.5 border border-slate-200 dark:border-white/10 rounded-md flex items-center gap-1 shrink-0 dark:bg-slate-800" title="Apple Pay Active">
                                        <Apple className="w-3 h-3 text-[#0F172A] dark:text-white fill-current" />
                                        <span className="text-[6.5px] font-bold text-[#0F172A] dark:text-white uppercase font-mono tracking-wider">PAY</span>
                                    </div>
                                )}
                                {activeCardState.googlePay && (
                                    <div className="bg-white px-1.5 py-0.5 border border-slate-200 dark:border-white/10 rounded-md flex items-center gap-1 shrink-0 dark:bg-slate-800" title="Google Pay Active">
                                        <Play className="w-3 h-3 text-emerald-400 fill-current" />
                                        <span className="text-[6.5px] font-bold text-emerald-400 uppercase font-mono tracking-wider">PAY</span>
                                    </div>
                                )}
                                <span className="font-extrabold text-[12px] text-primary italic font-serif">Sovereign</span>
                            </div>
                        </div>
                    </div>

                    {/* Card switcher if multiple cards exist */}
                    {activeCards.length > 1 && (
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-2xl">
                            <label className="text-[8.5px] font-black text-[#0F172A] uppercase tracking-widest mb-1.5 block">Select Card Workspace</label>
                            <div className="space-y-1.5">
                                {activeCards.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => setSelectedCardId(c.id)}
                                        className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all text-xs font-mono font-bold ${
                                            c.id === selectedCardId 
                                                ? 'bg-slate-50 dark:bg-slate-900 border-primary/30 text-[#0F172A] dark:text-white' 
                                                : 'bg-transparent border-transparent text-[#0F172A] dark:text-white hover:bg-white[0.02]'
                                        }`}
                                    >
                                        <span>{c.cardType} Card (*{c.lastFour})</span>
                                        <span className="text-[8px] uppercase tracking-widest text-[#0ec5f2]">Active</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quick Profile Overview Box */}
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-2xl p-5 text-center flex flex-col items-center">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full p-0.5 bg-gradient-to-br from-primary to-indigo-600 shadow-md relative">
                                <img 
                                    src={userProfile.profilePictureUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'} 
                                    alt={userProfile.name} 
                                    className="w-full h-full rounded-full object-cover border-4 border-slate-900"
                                />
                                <div className="absolute inset-0 bg-slate-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white rounded-full hover:bg-white dark:bg-slate-900 transition-colors"
                                        title="Upload local photo"
                                    >
                                        <Camera className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => setShowUrlInput(!showUrlInput)}
                                        disabled={isUploading}
                                        className="p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white rounded-full hover:bg-white dark:bg-slate-900 transition-colors"
                                        title="URL submit"
                                    >
                                        <Link className="w-4 h-4/5 text-primary" />
                                    </button>
                                </div>
                            </div>
                            {isUploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-full">
                                    <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            )}
                            
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                        {showUrlInput && (
                            <form onSubmit={handleUrlSubmit} className="mt-3 flex gap-2 w-full animate-fade-in">
                                <input
                                    type="url"
                                    value={imageUrl}
                                    onChange={(e: any) => setImageUrl(e.target.value)}
                                    placeholder="Paste image URL..."
                                    className="flex-1 px-3 py-1.5 bg-slate-100 border border-slate-100 dark:border-white/10 rounded-lg text-xs text-[#0F172A] dark:text-white focus:outline-none focus:border-primary"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="px-3 py-1.5 bg-primary text-[#0F172A] font-bold text-xs rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    Save
                                </button>
                            </form>
                        )}
                        <h3 className="text-lg font-black text-[#0F172A] dark:text-white mt-4">{userProfile.name}</h3>
                        <p className="text-xs text-primary font-bold uppercase tracking-wider">{userProfile.position || 'Standard Account'}</p>
                        <p className="text-[10px] text-[#0F172A] font-mono tracking-widest mt-1">{userProfile.email}</p>
                        
                        <div className="w-full mt-5 pt-5 border-t border-slate-100 dark:border-white/10 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">KYC Status</span>
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Verified</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">Member Since</span>
                                <span className="text-[10px] font-mono text-[#0F172A] dark:text-white">Oct 2023</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">Risk Profile</span>
                                <span className="text-[10px] font-mono text-[#0F172A] dark:text-white">Tier 3 (Institutional)</span>
                            </div>
                        </div>
                    </div>

                                    </div>

                <div className="w-full flex-1 min-w-0">
                    {/* TAB A: IDENTITY CONFIGURATION */}
                    {activeTab === 'identity' && (
                        <div className="flex flex-col xl:flex-row gap-6">
                            {/* Profile Information Block */}
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-2xl p-5 md:p-6 lg:p-8 flex-1 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-widest flex items-center gap-2">
                                    <User className="w-4 h-4 text-primary" />
                                    Identity Profile
                                </h3>
                                {!isEditingProfile ? (
                                    <button 
                                        onClick={() => setIsEditingProfile(true)}
                                        className="text-[10px] font-bold text-primary hover:text-primary/80 uppercase tracking-widest flex items-center gap-1 transition-colors"
                                    >
                                        <Edit3 className="w-3 h-3" /> Edit Profile
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => setIsEditingProfile(false)}
                                        className="text-[10px] font-bold text-[#0F172A] hover:text-[#0F172A] uppercase tracking-widest flex items-center gap-1 transition-colors"
                                    >
                                        <X className="w-3 h-3" /> Cancel
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Full Legal Name</label>
                                        {isEditingProfile ? (
                                            <input
                                                type="text"
                                                value={editedName}
                                                onChange={(e: any) => setEditedName(e.target.value)}
                                                className="w-full p-3 bg-slate-100 border border-emerald-500/30 rounded-xl text-xs text-[#0F172A] dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                            />
                                        ) : (
                                            <div className="p-3 bg-slate-100 border border-slate-100 dark:border-white/10 rounded-xl text-xs text-[#0F172A] dark:text-white font-bold">
                                                {userProfile.name}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Primary Contact</label>
                                        {isEditingProfile ? (
                                            <input
                                                type="tel"
                                                value={editedPhone}
                                                onChange={(e: any) => setEditedPhone(e.target.value)}
                                                className="w-full p-3 bg-slate-100 border border-emerald-500/30 rounded-xl text-xs text-[#0F172A] dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                            />
                                        ) : (
                                            <div className="p-3 bg-slate-100 border border-slate-100 dark:border-white/10 rounded-xl text-xs text-[#0F172A] dark:text-white font-mono">
                                                {userProfile.phone || '+1 (555) 000-0000'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        {isEditingProfile ? (
<SmartyAddressInput
         value={editedAddress}
         onChange={(e: any) => setEditedAddress(e.target.value)}
         placeholder="Enter your address"
         name="editedAddress"
         label="Residential Address"
         onAddressSelect={(details: AddressDetails) => {
             setEditedAddress(`${details.street}, ${details.city}, ${details.state} ${details.zip}, ${details.countryIso3}`);
         }}
     />
                                        ) : (
                                            <div className="p-3 bg-slate-100 border border-slate-100 dark:border-white/10 rounded-xl text-xs text-[#0F172A] dark:text-white">
                                                {userProfile.address || '742 Sovereign Ridge Boulevard, Aspen, CO'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Steward Position / Status</label>
                                        {isEditingProfile ? (
                                            <input
                                                type="text"
                                                value={editedPosition}
                                                onChange={(e: any) => setEditedPosition(e.target.value)}
                                                className="w-full p-3 bg-slate-100 border border-emerald-500/30 rounded-xl text-xs text-[#0F172A] dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                            />
                                        ) : (
                                            <div className="p-3 bg-slate-100 border border-slate-100 dark:border-white/10 rounded-xl text-xs text-[#0F172A] dark:text-white">
                                                {userProfile.position || 'Private Office Director'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Secure Ledger ID</label>
                                        <div className="p-3 bg-slate-100 border border-slate-100 dark:border-white/10 rounded-xl text-xs font-mono text-amber-500 font-extrabold tracking-widest">
                                            FPB-9920-CENT-X1
                                        </div>
                                    </div>
                                </div>

                                {isEditingProfile && (
                                    <div className="pt-4 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (onUpdateProfile) {
                                                    onUpdateProfile({
                                                        name: editedName,
                                                        phone: editedPhone,
                                                        address: editedAddress,
                                                        position: editedPosition
                                                    });
                                                }
                                                setIsEditingProfile(false);
                                                
                                                // Sound and Dispatch notification
                                                try {
                                                    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                                                    const osc = ctx.createOscillator();
                                                    const gain = ctx.createGain();
                                                    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
                                                    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
                                                    gain.gain.setValueAtTime(0.015, ctx.currentTime);
                                                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                                                    osc.connect(gain);
                                                    gain.connect(ctx.destination);
                                                    osc.start();
                                                    osc.stop(ctx.currentTime + 0.2);
                                                } catch (_) {}

                                                try {
                                                    window.dispatchEvent(new CustomEvent('APP_REALTIME_ACTIVITY', {
                                                        detail: {
                                                            type: 'upgrade',
                                                            message: 'Updated Accountholder sovereign identification registry details',
                                                            name: 'Security Vault',
                                                            country: 'Local Host',
                                                            flag: '👤',
                                                            amount: 0
                                                        }
                                                    }));
                                                } catch (_) {}
                                            }}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md transition-all duration-200"
                                        >
                                            Save Profile Changes
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* DEVELOPER CLEARANCE OVERRIDES CONTROL CARD */}
                            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-md">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
                                    <div className="flex items-center gap-3">
                                        <Lock className="w-5 h-5 text-emerald-400" />
                                        <div>
                                            <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#0F172A] dark:text-white">Developer Clearance Overrides</h3>
                                            <p className="text-[10px] text-[#0F172A] dark:text-white">Toggle transaction security verification holds and limits.</p>
                                        </div>
                                    </div>
                                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono px-2 py-0.5 rounded font-bold uppercase">
                                        DEBUG OVERRIDE ACTIVE
                                    </span>
                                </div>

                                <div className="space-y-4 text-left">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-100 border border-slate-100 dark:border-white/10 rounded-2xl gap-4">
                                        <div className="space-y-1 pr-4 text-left">
                                            <p className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider">Awaiting Payment Verification Overlay</p>
                                            <p className="text-[10px] text-[#0F172A] dark:text-white leading-relaxed">
                                                When enabled, transfers will be placed in compliance reviews requiring receipt generation. Toggle off to allow instant transaction completions.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (onUpdateProfile) {
                                                    onUpdateProfile({
                                                        awaitingPaymentVerificationEnabled: !userProfile.awaitingPaymentVerificationEnabled
                                                    });
                                                }
                                            }}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 ${
                                                userProfile.awaitingPaymentVerificationEnabled
                                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-lg'
                                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            }`}
                                        >
                                            {userProfile.awaitingPaymentVerificationEnabled ? 'ACTIVE (Held)' : 'BYPASSED (Instant)'}
                                        </button>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-100 border border-slate-100 dark:border-white/10 rounded-2xl gap-4">
                                        <div className="space-y-1 pr-4 text-left">
                                            <p className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider">Mandatory Admin Approval Control</p>
                                            <p className="text-[10px] text-[#0F172A] dark:text-white leading-relaxed">
                                                When enabled, all outgoing payments will require senior administration authorization prior to settlement.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (onUpdateProfile) {
                                                    onUpdateProfile({
                                                        requireAdminApprovalForPayments: !userProfile.requireAdminApprovalForPayments
                                                    });
                                                }
                                            }}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 ${
                                                userProfile.requireAdminApprovalForPayments
                                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-lg'
                                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            }`}
                                        >
                                            {userProfile.requireAdminApprovalForPayments ? 'ACTIVE (Hold)' : 'BYPASSED (Instant)'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-md">
                                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/10 pb-4">
                                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                    <div>
                                        <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#0F172A] dark:text-white">Enclave Connectivity & Handshakes</h3>
                                        <p className="text-[10px] text-[#0F172A] dark:text-white">Your sovereign transaction telemetry nodes.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-100 border border-slate-100 dark:border-white/10 rounded-2xl flex items-center gap-4">
                                        <div className="p-2 primary- rounded-xl primary- shrink-0">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11.5px] font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Last Trust Authorization</p>
                                            <p className="text-[10.5px] font-mono text-[#0F172A] dark:text-white mt-0.5">
                                                {userProfile.lastLogin?.date ? new Date(userProfile.lastLogin.date).toLocaleString() : 'Just now'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-100 border border-slate-100 dark:border-white/10 rounded-2xl flex items-center gap-4">
                                        <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500 shrink-0">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11.5px] font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Geographical Ingress Point</p>
                                            <p className="text-[10.5px] text-[#0F172A] dark:text-white mt-0.5">{userProfile.lastLogin?.from || 'Aspen, Colorado Private Hub'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                    )}

                    {/* TAB B: CRYPTO ENCLAVE CONFIGURATION */}
                    {activeTab === 'crypto' && (
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-md">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                                        <Bitcoin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#0F172A] dark:text-white">Bitcoin Reserve Enclave</h3>
                                        <p className="text-[10px] text-[#0F172A] dark:text-white">Synchronize cold storage targets and set automagic hedging indices.</p>
                                    </div>
                                </div>

                                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-mono font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 shrink-0">
                                    <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                    <span>BTC Rate: ${btcExchangeRate.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Core Address Area */}
                            <div className="p-4.5 bg-slate-100 border border-slate-100 dark:border-white/10 rounded-2xl space-y-3">
                                <div className="flex justify-between items-center">
                                    <p className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">Sovereign Bitcoin Address (Cold Storage Destination)</p>
                                    {!isEditingBtc && (
                                        <button 
                                            onClick={() => { setIsEditingBtc(true); setBtcAddressInput(btcAddress); }}
                                            className="text-[9.5px] font-bold text-amber-500 hover:text-[#0F172A] dark:text-white transition-colors uppercase font-mono"
                                        >
                                            [ Edit Destination ]
                                        </button>
                                    )}
                                </div>

                                {isEditingBtc ? (
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <input 
                                                type="text"
                                                value={btcAddressInput}
                                                onChange={(e: any) => setBtcAddressInput(e.target.value)}
                                                className="flex-1 bg-slate-100 border border-amber-500/30 rounded-xl px-3.5 py-2.5 font-mono text-xs text-[#0F172A] dark:text-white focus:outline-none focus:border-amber-400 transition-all shadow-inner"
                                            />
                                            <button
                                                onClick={handleSaveBtcAddress}
                                                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => { setIsEditingBtc(false); setBtcError(''); }}
                                                className="px-4 py-2 bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white font-bold text-[10px] uppercase tracking-wider rounded-xl hover:bg-slate-100 dark:bg-slate-700 transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                        {btcError && <p className="text-[9px] font-mono text-rose-500">{btcError}</p>}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between gap-4 font-mono text-xs text-[#0F172A] dark:text-white">
                                        <span className="truncate break-all select-all font-bold tracking-tight">{btcAddress}</span>
                                        <span className="text-[9px] uppercase px-1.5 border border-amber-500/25 bg-amber-500/5 text-amber-400 font-bold shrink-0 rounded">VERIFIED SECURE</span>
                                    </div>
                                )}
                            </div>

                            {/* Automation hedge config slider */}
                            <div className="p-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-2xl space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-wider">Automagic Bitcoin Reserves Integration</h4>
                                        <p className="text-[10px] text-[#0F172A] dark:text-white mt-0.5">Percentage of every incoming USD settlement dynamically converted into physical gold-grade Bitcoin cold storage.</p>
                                    </div>
                                    <span className="font-mono font-black text-base text-amber-400">{btcReserveRatio}%</span>
                                </div>

                                <div className="space-y-1.5">
                                    <input 
                                        type="range" 
                                        min="0"
                                        max="50"
                                        step="1"
                                        value={btcReserveRatio}
                                        onChange={(e: any) => setBtcReserveRatio(Number(e.target.value))}
                                        className="w-full accent-amber-500 h-1 bg-white dark:bg-slate-900 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between font-mono text-[8.5px] text-[#0F172A]">
                                        <span>0% Standard Cash</span>
                                        <span>25% Balanced Hold</span>
                                        <span>50% Absolute Hard Hedging</span>
                                    </div>
                                </div>
                            </div>

                            {/* Crypto Balance overview visual */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-[#111827]/30 border border-slate-100 dark:border-white/10 rounded-2xl flex items-center gap-4">
                                    <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl shrink-0">
                                        <Bitcoin className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest leading-none">Your Sovereign BTC Holdings</p>
                                        <p className="font-mono text-lg font-black text-[#0F172A] dark:text-white mt-1 leading-none">{virtualBtcBalance.toFixed(5)} BTC</p>
                                        <p className="text-[10px] text-[#0F172A] dark:text-white font-mono mt-1 mt-0.5">≈ ${(virtualBtcBalance * btcExchangeRate).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-[#111827]/30 border border-slate-100 dark:border-white/10 rounded-2xl flex items-center gap-4">
                                    <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest leading-none">Reserve Security Hashrate</p>
                                        <p className="font-mono text-base font-black text-emerald-400 mt-1 leading-none">99.98% / P2P SYNCED</p>
                                        <p className="text-[10px] text-[#0F172A] dark:text-white mt-0.5">Direct Enclave Cold Vaults Connected</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* TAB C: SECURITY & PIN ENFORCER PAD */}
                    {activeTab === 'security' && (
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-md">
                            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/10 pb-4">
                                <Key className="w-5 h-5 text-primary" />
                                <div>
                                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#0F172A] dark:text-white">Chip Passcode & PIN Vault</h3>
                                    <p className="text-[10px] text-[#0F172A] dark:text-white">Configure your physical first-class titanium card security PIN passcode instantly.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                {/* Visual Entry field slots */}
                                <div className="space-y-5">
                                    
                                    {/* Slot 1: Current pin */}
                                    <button
                                        onClick={() => setPinKeysInput('current')}
                                        className={`w-full block p-3.5 rounded-2xl border text-left transition-all ${
                                            pinKeysInput === 'current' ? 'bg-slate-50 dark:bg-slate-900 border-primary/40 shadow-md ring-1 ring-primary/20' : 'bg-slate-100 border-slate-100 dark:border-white/10'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">1. Input Current PIN</span>
                                            {pinState.currentPin.length === 4 && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                                        </div>
                                        <div className="flex gap-2.5 mt-2 justify-center">
                                            {[0, 1, 2, 3].map(i => (
                                                <div 
                                                    key={i} 
                                                    className={`w-3.5 h-3.5 rounded-full border ${
                                                        pinState.currentPin.length > i 
                                                            ? 'bg-primary border-primary shadow-sm shadow-primary/40' 
                                                            : 'border-slate-200 dark:border-white/15 bg-white'
                                                    }`} 
                                                />
                                            ))}
                                        </div>
                                    </button>

                                    {/* Slot 2: New pin */}
                                    <button
                                        onClick={() => setPinKeysInput('new')}
                                        className={`w-full block p-3.5 rounded-2xl border text-left transition-all ${
                                            pinKeysInput === 'new' ? 'bg-slate-50 dark:bg-slate-900 border-amber-500/40 shadow-md ring-1 ring-amber-500/20' : 'bg-slate-100 border-slate-100 dark:border-white/10'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">2. Input New 4-Digit PIN</span>
                                            {pinState.newPin.length === 4 && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                                        </div>
                                        <div className="flex gap-2.5 mt-2 justify-center">
                                            {[0, 1, 2, 3].map(i => (
                                                <div 
                                                    key={i} 
                                                    className={`w-3.5 h-3.5 rounded-full border ${
                                                        pinState.newPin.length > i 
                                                            ? 'bg-amber-400 border-amber-400 shadow-sm shadow-amber-400/40' 
                                                            : 'border-slate-200 dark:border-white/15 bg-white'
                                                    }`} 
                                                />
                                            ))}
                                        </div>
                                    </button>

                                    {/* Slot 3: Confirm new pin */}
                                    <button
                                        onClick={() => setPinKeysInput('confirm')}
                                        className={`w-full block p-3.5 rounded-2xl border text-left transition-all ${
                                            pinKeysInput === 'confirm' ? 'bg-slate-50 dark:bg-slate-900 border-indigo-500/40 shadow-md ring-1 ring-indigo-500/20' : 'bg-slate-100 border-slate-100 dark:border-white/10'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">3. Confirm New PIN</span>
                                            {pinState.confirmPin.length === 4 && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                                        </div>
                                        <div className="flex gap-2.5 mt-2 justify-center">
                                            {[0, 1, 2, 3].map(i => (
                                                <div 
                                                    key={i} 
                                                    className={`w-3.5 h-3.5 rounded-full border ${
                                                        pinState.confirmPin.length > i 
                                                            ? 'bg-indigo-400 border-indigo-400 shadow-sm shadow-indigo-400/40' 
                                                            : 'border-slate-200 dark:border-white/15 bg-white'
                                                    }`} 
                                                />
                                            ))}
                                        </div>
                                    </button>

                                    {/* Info/Warning status layout messages */}
                                    {pinState.message && (
                                        <div className={`p-3 rounded-xl border text-[9.5px] font-bold leading-relaxed font-mono ${
                                            pinState.isError ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                                        }`}>
                                            {pinState.message}
                                        </div>
                                    )}

                                    <button
                                        onClick={submitPinChange}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary to-primary-600 hover:from-primary-400 hover:to-primary text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg transition active:scale-95 duration-200"
                                    >
                                        <Lock className="w-3.5 h-3.5" />
                                        Commit Encrypted Code To Card Memory
                                    </button>
                                </div>

                                {/* Virtual tactile keypad frame */}
                                <div className="p-5 bg-slate-100 border border-slate-100 dark:border-white/10 rounded-2.5xl max-w-[280px] mx-auto w-full">
                                    <div className="grid grid-cols-3 gap-2.5">
                                        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                                            <button
                                                key={num}
                                                onClick={() => handleKeypadPress(num)}
                                                className="h-12 w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 hover:border-slate-200 dark:border-white/15 hover:bg-white dark:bg-slate-900 text-sm font-black text-[#0F172A] dark:text-white hover:scale-105 active:scale-95 transition flex items-center justify-center font-mono shadow-md"
                                            >
                                                {num}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => handleKeypadPress('CLEAR')}
                                            className="h-12 w-full rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-extrabold uppercase tracking-wider hover:bg-rose-500/20 transition flex items-center justify-center"
                                        >
                                            Clear
                                        </button>
                                        <button
                                            onClick={() => handleKeypadPress('0')}
                                            className="h-12 w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 hover:border-slate-200 dark:border-white/15 hover:bg-white dark:bg-slate-900 text-sm font-black text-[#0F172A] dark:text-white hover:scale-105 active:scale-95 transition flex items-center justify-center font-mono"
                                        >
                                            0
                                        </button>
                                        <div className="h-12 w-full flex items-center justify-center text-[9px] text-[#0F172A] font-mono select-none">
                                            * SEC
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Security Modules */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-white/10">
                                {/* 2FA / Biometrics */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                                            <Fingerprint className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-[#0F172A] dark:text-white">Hardware 2FA / Biometrics</h4>
                                            <p className="text-[10px] text-[#0F172A] font-mono">Yubikey & FaceID Secure Enclave</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-100 p-4 rounded-xl border border-black/5 flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400">Status: Active</span>
                                            <p className="text-[10px] text-[#0F172A] mt-1">Requires biometric on large transfers</p>
                                        </div>
                                        <button className="px-4 py-2 bg-white hover:bg-white rounded-lg text-xs font-bold transition-colors dark:bg-slate-800">Configure</button>
                                    </div>
                                </div>

                                {/* Active Sessions */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                                            <Radio className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-[#0F172A] dark:text-white">Active Node Sessions</h4>
                                            <p className="text-[10px] text-[#0F172A] font-mono">Current authorized connections</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-100 p-4 rounded-xl border border-black/5 space-y-3">
                                        <div className="flex justify-between items-center pb-2 border-b border-black/5">
                                            <div className="flex items-center gap-2">
                                                <Apple className="w-3.5 h-3.5 text-[#0F172A]" />
                                                <span className="text-[10px] text-[#0F172A]">iPhone 16 Pro Max</span>
                                            </div>
                                            <span className="text-[9px] text-emerald-500 font-mono">Current Session</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <Smartphone className="w-3.5 h-3.5 text-[#0F172A]" />
                                                <span className="text-[10px] text-[#0F172A]">MacBook Pro M3</span>
                                            </div>
                                            <button className="text-[9px] text-rose-400 font-mono hover:text-rose-300">Revoke</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* TAB: PREFERENCES & SETTINGS */}
                    {activeTab === 'preferences' && (
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 space-y-8 shadow-md animate-fade-in">
                            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/10 pb-4">
                                <Zap className="w-5 h-5 text-rose-400" />
                                <div>
                                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#0F172A] dark:text-white">Profile Preferences</h3>
                                    <p className="text-[10px] text-[#0F172A] dark:text-white">Configure global notifications, data privacy, and operational limits.</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Notifications */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#0F172A] dark:text-white border-b border-slate-100 dark:border-white/10 pb-2">Communication Hub</h4>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Large Transfer Alerts', desc: 'Notify on outgoing > $10,000', on: true },
                                            { label: 'Login Notifications', desc: 'New device & IP login alerts', on: true },
                                            { label: 'Marketing Insights', desc: 'Exclusive partner offers', on: false },
                                            { label: 'Paperless Statements', desc: 'Digital PDF statements only', on: true }
                                        ].map((setting, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-slate-100 rounded-xl border border-black/5">
                                                <div>
                                                    <span className="text-xs font-bold text-[#0F172A] dark:text-white">{setting.label}</span>
                                                    <p className="text-[10px] text-[#0F172A] mt-0.5">{setting.desc}</p>
                                                </div>
                                                <button className={`w-10 h-5 rounded-full relative transition-colors ${setting.on ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${setting.on ? 'left-5.5' : 'left-0.5'}`} style={{ transform: setting.on ? 'translateX(20px)' : 'translateX(0)' }}></span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Privacy & Data */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#0F172A] dark:text-white border-b border-slate-100 dark:border-white/10 pb-2">Data & Localization</h4>
                                    <div className="space-y-4">
                                        <div className="p-3 bg-slate-100 rounded-xl border border-black/5">
                                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest block mb-2">Base Currency</label>
                                            <select 
                                                value={displayCurrency} 
                                                onChange={(e) => setDisplayCurrency(e.target.value)}
                                                className="w-full bg-transparent text-xs font-bold text-[#0F172A] dark:text-white focus:outline-none cursor-pointer"
                                            >
                                                {CURRENCIES_LIST.slice(0, 30).map((curr) => (
                                                    <option key={curr.code} value={curr.code} className="bg-slate-50 text-white dark:bg-slate-900">
                                                        {curr.code} - {curr.name} ({curr.symbol})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="p-3 bg-slate-100 rounded-xl border border-black/5">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest flex items-center gap-1.5">
                                                    <GlobeAmericasIcon className="w-3.5 h-3.5 text-primary" />
                                                    Global Interface Language
                                                </label>
                                                <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">
                                                    Google Neural Translate
                                                </span>
                                            </div>
                                            <select 
                                                value={language}
                                                onChange={(e) => setLanguage(e.target.value)}
                                                className="w-full bg-transparent text-xs font-bold text-[#0F172A] dark:text-white focus:outline-none cursor-pointer"
                                            >
                                                {EXTENDED_LANGUAGES.map((lang) => (
                                                    <option key={lang.code} value={lang.code} className="bg-slate-50 text-white dark:bg-slate-900">
                                                        {lang.nativeName} ({lang.name} - {lang.countryCode})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                            <h5 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1">Open Banking Sync</h5>
                                            <p className="text-[10px] text-[#0F172A] mb-3">Plaid & MX external account aggregation is currently active.</p>
                                            <button className="text-[9px] font-bold text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded-lg transition-colors">Manage Connections</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB D: OUTFLOW MULTI-DESTINATION WITHDRAW MODULES */}
                    {activeTab === 'withdraw' && (
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-md">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                                        <Landmark className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#0F172A] dark:text-white">Sovereign Outbound Gateway</h3>
                                        <p className="text-[10px] text-[#0F172A] dark:text-white">Withdraw liquid reserve balance directly through physical or digital pipelines.</p>
                                    </div>
                                </div>

                                {/* Custom sub-tab choices */}
                                <div className="flex gap-1 p-0.5 bg-slate-100 border border-slate-100 dark:border-white/10 rounded-xl self-start sm:self-auto uppercase tracking-wider text-[8.5px] font-black">
                                    <button 
                                        onClick={() => setWithdrawTab('atm')}
                                        className={`px-3 py-1.5 rounded-lg transition-colors ${withdrawTab === 'atm' ? 'bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white'}`}
                                    >
                                        Cardless ATM Code
                                    </button>
                                    <button 
                                        onClick={() => setWithdrawTab('swift')}
                                        className={`px-3 py-1.5 rounded-lg transition-colors ${withdrawTab === 'swift' ? 'bg-white dark:bg-slate-900 text-[#0ec5f2]' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white'}`}
                                    >
                                        SWIFT Wire
                                    </button>
                                    <button 
                                        onClick={() => setWithdrawTab('btc')}
                                        className={`px-3 py-1.5 rounded-lg transition-colors ${withdrawTab === 'btc' ? 'bg-white dark:bg-slate-900 text-amber-500' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white'}`}
                                    >
                                        Bitcoin Network
                                    </button>
                                </div>
                            </div>

                            {/* Option 1: Cardless ATM Bypass Token */}
                            {withdrawTab === 'atm' && (
                                <div className="space-y-4 animate-fade-in">
                                    <p className="text-xs text-[#0F172A] dark:text-white leading-relaxed font-sans">
                                        Generate a protected 6-digit cardless withdrawal token. Walk up to any partner ATM, type in the temporary passcode on-screen, and instantly withdraw physical dollar reserves from checking without inserting a card.
                                    </p>

                                    <div className="flex flex-col md:flex-row gap-6 items-center">
                                        <div className="flex-1 space-y-3 w-full">
                                            {atmToken ? (
                                                <div className="p-6 bg-slate-50 dark:bg-slate-800 border border-primary/20 text-center rounded-2xl relative overflow-hidden space-y-3 shadow-inner">
                                                    <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none rounded-bl-3xl bg-primary/10 blur-md" />
                                                    <p className="text-[8.5px] font-black text-[#0F172A] uppercase tracking-widest leading-none">Your Cardless ATM Access Code</p>
                                                    <p className="font-mono text-3xl font-black text-primary tracking-[0.2em] leading-none py-1.5">{atmToken}</p>
                                                    
                                                    <div className="w-full h-1 bg-slate-50 dark:bg-slate-900 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-primary transition-all duration-1000" 
                                                            style={{ width: `${(atmTimeLeft / 95) * 100}%` }} 
                                                        />
                                                    </div>
                                                    <p className="text-[8.5px] font-mono text-[#0F172A]">Expiring in {atmTimeLeft} seconds for security shield</p>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={generateAtmToken}
                                                    className="w-full py-4 bg-[#111827]/60 border border-dashed border-slate-200 dark:border-white/10 hover:border-primary/40 hover:bg-[#111827] text-[#0F172A] dark:text-white rounded-2.5xl transition-all flex flex-col items-center justify-center p-6 text-center group"
                                                >
                                                    <QrCode className="w-8 h-8 text-primary mb-2 group-hover:scale-110 duration-200" />
                                                    <p className="text-xs font-black uppercase tracking-wider text-[#0F172A] dark:text-white">Generate Code Token</p>
                                                    <p className="text-[9px] text-[#0F172A] mt-1 max-w-[200px]">Secure 6-digit dynamic ATM verification sweep code</p>
                                                </button>
                                            )}
                                        </div>

                                        <div className="w-full md:w-[260px] p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/10 self-stretch flex flex-col justify-between space-y-3 font-mono text-[9px] text-[#0F172A] dark:text-white">
                                            <div>
                                                <p className="font-sans text-[10px] font-black uppercase text-[#0ec5f2] mb-1.5 tracking-wider">ATM Terminal Details</p>
                                                <p className="leading-relaxed">Your Sovereign Cash sweep limit is set to cardless standard maximum limits:</p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between">
                                                    <span>Single Use limit:</span>
                                                    <span className="text-[#0F172A] dark:text-white">$3,000 USD</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Network Fee:</span>
                                                    <span className="text-emerald-400 font-bold">$0.00 VIP Free</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Auth Type:</span>
                                                    <span className="text-[#0F172A] dark:text-white">Secure OTP Bypass</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Option 2: Swift Wire Outflow form */}
                            {withdrawTab === 'swift' && (
                                <form onSubmit={handleWireWithdraw} className="space-y-4 animate-fade-in">
                                    <p className="text-xs text-[#0F172A] dark:text-white leading-relaxed font-sans">
                                        Transfer checking capital balance directly out to external IBAN or SWIFT accounts globally. High volume routing is monitored and processed within standard premium times.
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Beneficiary Bank Name / Brokerage</label>
                                            <input 
                                                required
                                                type="text" 
                                                value={wireForm.bankName}
                                                onChange={(e: any) => setWireForm(prev => ({ ...prev, bankName: e.target.value }))}
                                                placeholder="e.g. JPMorgan Chase Bank"
                                                className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 font-sans text-xs text-[#0F172A] dark:text-white focus:outline-none focus:border-primary/50"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Routing Number / Swift Code</label>
                                            <input 
                                                required
                                                type="text" 
                                                value={wireForm.routingNumber}
                                                onChange={(e: any) => setWireForm(prev => ({ ...prev, routingNumber: e.target.value }))}
                                                placeholder="e.g. JPMCPNYN1"
                                                className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 font-mono text-xs text-[#0F172A] dark:text-white focus:outline-none focus:border-primary/50"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">IBAN / Account Number</label>
                                            <input 
                                                required
                                                type="text" 
                                                value={wireForm.iban}
                                                onChange={(e: any) => setWireForm(prev => ({ ...prev, iban: e.target.value }))}
                                                placeholder="e.g. US65 6780 2939 ..."
                                                className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 font-mono text-xs text-[#0F172A] dark:text-white focus:outline-none focus:border-primary/50"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Amount to Withdraw (USD)</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3.5 top-2.5 w-4 h-4 text-[#0F172A]" />
                                                <input 
                                                    required
                                                    type="number" 
                                                    value={wireForm.amount}
                                                    onChange={(e: any) => setWireForm(prev => ({ ...prev, amount: e.target.value }))}
                                                    placeholder="0.00"
                                                    className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 pl-10 font-mono text-xs text-[#0F172A] dark:text-white focus:outline-none focus:border-primary/50"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {wireForm.errorMsg && <p className="text-[10px] font-mono text-rose-500">{wireForm.errorMsg}</p>}
                                    {wireForm.successMsg && <p className="text-[10px] font-mono text-emerald-400">{wireForm.successMsg}</p>}

                                    <button
                                        type="submit"
                                        className="py-2.5 px-6 bg-gradient-to-r from-[#0ec5f2] primary- hover:from-cyan-400 hover:to-primary text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl shadow transition duration-200"
                                    >
                                        Authorize Outbound SWIFT Wire
                                    </button>
                                </form>
                            )}

                            {/* Option 3: Bitcoin Network Conversion Withdrawal */}
                            {withdrawTab === 'btc' && (
                                <form onSubmit={handleBtcWithdraw} className="space-y-4 animate-fade-in">
                                    <p className="text-xs text-[#0F172A] dark:text-white leading-relaxed font-sans">
                                        Convert and withdraw USD cash reserves directly into native Bitcoin sent straight to your configured cold storage network. Handled automatically via physical transaction routers instantly.
                                    </p>

                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-2xl space-y-3.5">
                                        <div className="flex justify-between items-center text-[9.5px] font-mono text-[#0F172A]">
                                            <span>DESTINATION BLOCKCHAIN ADDR:</span>
                                            <span className="text-[#0F172A] dark:text-white font-bold truncate max-w-[200px]">{btcAddress}</span>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Amount to Liquidate (USD)</label>
                                            <div className="flex gap-3">
                                                <div className="relative flex-1">
                                                    <DollarSign className="absolute left-3.5 top-2.5 w-4 h-4 text-[#0F172A] dark:text-white" />
                                                    <input 
                                                        required
                                                        type="number"
                                                        value={btcWithdrawForm.amountUSD}
                                                        onChange={(e: any) => setBtcWithdrawForm(prev => ({ ...prev, amountUSD: e.target.value }))}
                                                        placeholder="0.00"
                                                        className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 pl-10 font-mono text-xs text-[#0F172A] dark:text-white focus:outline-none focus:border-amber-500/50"
                                                    />
                                                </div>

                                                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-xl font-mono text-[10px] text-[#0F172A] dark:text-white flex flex-col justify-center">
                                                    <span>BTC Output:</span>
                                                    <span className="text-amber-500 font-extrabold">
                                                        {btcWithdrawForm.amountUSD ? (parseFloat(btcWithdrawForm.amountUSD) / btcExchangeRate).toFixed(6) : '0.000000'} BTC
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {btcWithdrawForm.errorMsg && <p className="text-[10px] font-mono text-rose-500">{btcWithdrawForm.errorMsg}</p>}
                                    {btcWithdrawForm.successMsg && <p className="text-[10px] font-mono text-emerald-400">{btcWithdrawForm.successMsg}</p>}

                                    <button
                                        type="submit"
                                        className="py-2.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl shadow transition duration-200"
                                    >
                                        Transmit Converted Bitcoin Outbound
                                    </button>
                                </form>
                            )}

                        </div>
                    )}

                    {/* TAB E: GOOGLE PAY, APPLE PAY, & CARD SETTINGS */}
                    {activeTab === 'cards' && (
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-md">
                            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/10 pb-4">
                                <CreditCard className="w-5 h-5 text-indigo-400" />
                                <div>
                                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#0F172A] dark:text-white">Card Management & Digital Wallets</h3>
                                    <p className="text-[10px] text-[#0F172A] dark:text-white">Control physical card features and provision to mobile OS keychains.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
                                {/* Left Side: Digital Wallets */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#0F172A] dark:text-white border-b border-slate-100 dark:border-white/10 pb-2">Digital Wallets</h4>
                                    <p className="text-[10px] text-[#0F172A] font-mono">Bypass web limitations and use premium NFC POS terminals globally.</p>
                                    <div className="grid grid-cols-1 gap-4">
                                        {/* Option A: Apple Wallet */}
                                        <div className="p-5 bg-slate-100 border border-slate-100 dark:border-white/10 rounded-2xl flex flex-col justify-between space-y-6 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none rounded-bl-3xl bg-white blur-sm dark:bg-slate-800" />
                                            <div>
                                                <div className="flex items-center gap-2 text-[#0F172A] dark:text-white">
                                                    <Apple className="w-5 h-5 fill-current" />
                                                    <h4 className="text-sm font-black uppercase tracking-tight">Apple Wallet integration</h4>
                                                </div>
                                                <p className="text-[10px] text-[#0F172A] dark:text-white mt-2">Provision directly to your iPhone's Secure Enclave.</p>
                                            </div>
                                            {activeCardState.applePay ? (
                                                <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 self-start">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Active & Provisioned</span>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => launchWalletProvisioning('apple')}
                                                    className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-white dark:bg-slate-900 dark:hover:bg-slate-200 dark:text-slate-950 rounded-xl text-xs font-bold transition-all shadow-lg self-start flex items-center gap-2 group-hover:scale-105"
                                                >
                                                    <Apple className="w-4 h-4" /> Add to Apple Wallet
                                                </button>
                                            )}
                                        </div>

                                        {/* Option B: Google Pay */}
                                        <div className="p-5 bg-slate-100 border border-slate-100 dark:border-white/10 rounded-2xl flex flex-col justify-between space-y-6 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none rounded-bl-3xl bg-white blur-sm dark:bg-slate-800" />
                                            <div>
                                                <div className="flex items-center gap-2 text-emerald-400">
                                                    <Play className="w-5 h-5 fill-current" />
                                                    <h4 className="text-sm font-black uppercase tracking-tight text-[#0F172A] dark:text-white">Google Pay Sandbox</h4>
                                                </div>
                                                <p className="text-[10px] text-[#0F172A] dark:text-white mt-2">Activate tokenized payments for Android ecosystem devices.</p>
                                            </div>
                                            {activeCardState.googlePay ? (
                                                <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 self-start">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Active & Provisioned</span>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => launchWalletProvisioning('google')}
                                                    className="px-5 py-2.5 bg-slate-100 hover:bg-white text-slate-950 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-white rounded-xl text-xs font-bold transition-all shadow-lg self-start flex items-center gap-2 group-hover:scale-105"
                                                >
                                                    <Play className="w-4 h-4" /> Save to Google Pay
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Card Controls */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#0F172A] dark:text-white border-b border-slate-100 dark:border-white/10 pb-2">Physical Controls</h4>
                                    
                                    <div className="bg-slate-100 p-4 rounded-xl border border-black/5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h5 className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-primary" /> Freeze Card</h5>
                                                <p className="text-[9px] text-[#0F172A] mt-0.5">Instantly block all new authorizations</p>
                                            </div>
                                            <button className="w-10 h-5 bg-slate-700 rounded-full relative transition-colors"><span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform dark:bg-slate-800"></span></button>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-black/5 pt-4">
                                            <div>
                                                <h5 className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest">Online Purchases</h5>
                                                <p className="text-[9px] text-[#0F172A] mt-0.5">Allow web and in-app transactions</p>
                                            </div>
                                            <button className="w-10 h-5 bg-emerald-500 rounded-full relative transition-colors"><span className="absolute top-0.5 left-5.5 w-4 h-4 rounded-full bg-white transition-transform transform translate-x-[20px] dark:bg-slate-800"></span></button>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-black/5 pt-4">
                                            <div>
                                                <h5 className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest">International Usage</h5>
                                                <p className="text-[9px] text-[#0F172A] mt-0.5">Permit non-US merchant authorizations</p>
                                            </div>
                                            <button className="w-10 h-5 bg-emerald-500 rounded-full relative transition-colors"><span className="absolute top-0.5 left-5.5 w-4 h-4 rounded-full bg-white transition-transform transform translate-x-[20px] dark:bg-slate-800"></span></button>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl mt-4">
                                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-1 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Report Lost or Stolen</h5>
                                        <p className="text-[10px] text-[#0F172A] mb-3">Permanently deactivate this card and issue a titanium replacement.</p>
                                        <button className="text-[9px] font-bold text-white bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-lg transition-colors">Deactivate & Reissue</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};