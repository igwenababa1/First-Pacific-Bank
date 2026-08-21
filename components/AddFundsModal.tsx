
import React, { useState } from 'react';
import { 
    SpinnerIcon, CheckCircleIcon, BankIcon, GlobeAmericasIcon, 
    CreditCardIcon, WalletIcon, ArrowsRightLeftIcon, ShieldCheckIcon,
    XIcon, ChevronRightIcon, BrandLogo, LockClosedIcon
} from './Icons';
import { fetchBinInfo } from '../services/binService';
import { useCurrency } from '../contexts/CurrencyContext';

interface AddFundsModalProps {
    onClose: () => void;
    onAddFunds: (
        amount: number, 
        source: string, 
        type: 'CARD' | 'BANK' | 'PAYPAL' | 'CASHAPP' | 'ZELLE' | 'CRYPTO',
        category?: string,
        sourceDescription?: string,
        referenceId?: string
    ) => Promise<void>;
}

type MethodType = 'CARD' | 'BANK' | 'PAYPAL' | 'CASHAPP' | 'ZELLE' | 'CRYPTO';

const FUNDING_SOURCES = [
    { id: 'card', label: 'Debit Card', type: 'CARD' as MethodType, icon: CreditCardIcon, desc: 'Instant • 1.5% Fee' },
    { id: 'bank', label: 'Bank Transfer', type: 'BANK' as MethodType, icon: BankIcon, desc: '1-3 Days • Free' },
    { id: 'paypal', label: 'PayPal', type: 'PAYPAL' as MethodType, icon: null, logoDomain: 'paypal.com', desc: 'Instant • Connect' },
    { id: 'cashapp', label: 'Cash App', type: 'CASHAPP' as MethodType, icon: null, logoDomain: 'cash.app', desc: 'Instant • Connect' },
    { id: 'zelle', label: 'Zelle', type: 'ZELLE' as MethodType, icon: null, logoDomain: 'zellepay.com', desc: 'Instant • Mobile' },
    { id: 'crypto', label: 'Crypto Deposit', type: 'CRYPTO' as MethodType, icon: WalletIcon, desc: 'Network Speed' },
];

export const AddFundsModal: React.FC<AddFundsModalProps> = ({ onClose, onAddFunds }) => {
    const { displayCurrency, getCurrencyInfo } = useCurrency();
    const currencySymbol = getCurrencyInfo(displayCurrency)?.symbol || '$';

    const [step, setStep] = useState<'method' | 'amount' | 'connecting' | 'processing' | 'success'>('method');
    const [selectedMethod, setSelectedMethod] = useState<typeof FUNDING_SOURCES[0] | null>(null);
    const [amount, setAmount] = useState('');
    const [accountRef, setAccountRef] = useState(''); 

    // Advanced compliance category, description & reference states
    const [depositCategory, setDepositCategory] = useState<'Inheritance Funds' | 'Real Estate Proceeds' | 'Pension Allowance' | 'Corporate Salary' | 'Default Deposit'>('Default Deposit');
    const [sourceDescription, setSourceDescription] = useState('');
    const [referenceId, setReferenceId] = useState('');
    const [validationError, setValidationError] = useState('');

    const handleMethodSelect = (method: typeof FUNDING_SOURCES[0]) => {
        setSelectedMethod(method);
        if (method.type === 'CARD') {
            setStep('amount');
        } else {
            setStep('connecting');
        }
    };

    const handleConnectionSim = () => {
        setTimeout(() => {
            setStep('amount');
        }, 2000);
    };

    const handleSubmit = () => {
        const val = parseFloat(amount);
        if (!val || val <= 0) {
            setValidationError('Please enter a valid deposit amount.');
            return;
        }

        if (depositCategory !== 'Default Deposit') {
            if (!sourceDescription.trim()) {
                setValidationError('A source description / issuing entity is required.');
                return;
            }
            if (!referenceId.trim()) {
                setValidationError('A documentation reference ID is required.');
                return;
            }
        }

        setValidationError('');
        setStep('processing');
        setTimeout(() => {
            const identifier = accountRef || (selectedMethod?.type === 'CARD' ? 'Card Ending 4242' : 'Linked Account');
            onAddFunds(
                val, 
                identifier, 
                selectedMethod!.type, 
                depositCategory === 'Default Deposit' ? undefined : depositCategory,
                sourceDescription,
                referenceId
            );
            
            // Dispatch real-time global event
            try {
                window.dispatchEvent(new CustomEvent('APP_REALTIME_ACTIVITY', {
                    detail: {
                        type: 'deposit',
                        message: depositCategory === 'Default Deposit' 
                            ? `Deposited ${currencySymbol}${val.toLocaleString()} via ${selectedMethod?.label || 'Direct Transfer'}`
                            : `Submitted ${currencySymbol}${val.toLocaleString()} for ${depositCategory} Clearance`,
                        amount: val,
                        name: 'Sovereign Holder',
                        country: 'Local Sec Node',
                        flag: '⚡'
                    }
                }));
            } catch (err) {}

            setStep('success');
        }, 2500);
    };

    React.useEffect(() => {
        if (step === 'connecting') handleConnectionSim();
    }, [step]);

    return (
        <div className="fixed inset-0 bg-slate-100  flex items-center justify-center z-[80] p-4 animate-fade-in">
            <div className="bg-[#0c121e] border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
                
                <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-white[0.02] dark:bg-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500 rounded-xl border border-emerald-500/20">
                            <ArrowsRightLeftIcon className="w-6 h-6 text-emerald-400 rotate-90" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-[#0F172A] dark:text-white tracking-tight">Liquidity Injection</h3>
                            <p className="text-[10px] text-[#0F172A] dark:text-white font-bold uppercase tracking-widest mt-0.5">Secure Inbound Gateway</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-[#0F172A] hover:text-[#0F172A] dark:text-white transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex-grow">
                    
                    {step === 'method' && (
                        <div className="space-y-6">
                            <p className="text-sm text-[#0F172A] dark:text-white font-bold">Select a funding source to bridge assets into your Premium Reserved portfolio.</p>
                            <div className="grid grid-cols-1 gap-3">
                                {FUNDING_SOURCES.map(source => (
                                    <button 
                                        key={source.id}
                                        onClick={() => handleMethodSelect(source)}
                                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 hover:bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 hover:border-primary/40 rounded-2xl transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-lg">
                                                {source.logoDomain ? (
                                                    <BrandLogo domain={source.logoDomain} name={source.label} fallback={GlobeAmericasIcon} className="w-8 h-8 object-contain" />
                                                ) : (
                                                    source.icon && <source.icon className="w-6 h-6 text-[#0F172A] dark:text-white" />
                                                )}
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-[#0F172A] dark:text-white group-hover:text-primary transition-colors">{source.label}</p>
                                                <p className="text-[10px] text-[#0F172A] uppercase tracking-wider font-bold">{source.desc}</p>
                                            </div>
                                        </div>
                                        <ChevronRightIcon className="w-5 h-5 text-[#0F172A] group-hover:text-primary transition-transform group-hover:translate-x-1" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'connecting' && (
                        <div className="text-center py-12 space-y-6">
                            <div className="relative w-24 h-24 mx-auto">
                                <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <ShieldCheckIcon className="w-10 h-10 text-[#0F172A] dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Establishing Secure Link</h3>
                                <p className="text-[#0F172A] dark:text-white text-sm mt-2">Connecting to {selectedMethod?.label} Gateway...</p>
                            </div>
                        </div>
                    )}

                    {step === 'amount' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-slate-100 p-6 rounded-[2rem] border border-slate-100 dark:border-white/10 text-center">
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-4 block">Injection Amount</label>
                                <div className="relative inline-block">
                                    <span className="absolute left-[-20px] top-1 text-2xl text-[#0F172A] font-bold">{currencySymbol}</span>
                                    <input 
                                        type="number" 
                                        value={amount} 
                                        onChange={e => { setAmount(e.target.value); setValidationError(''); }} 
                                        className="bg-transparent text-5xl font-black text-[#0F172A] dark:text-white text-center outline-none w-48 placeholder-slate-800 animate-pulse"
                                        placeholder="0.00"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Dropdown for specific deposit categories */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1 block">Deposit Category / Classification</label>
                                <select 
                                    value={depositCategory} 
                                    onChange={e => {
                                        setDepositCategory(e.target.value as any);
                                        setValidationError('');
                                        if (e.target.value === 'Default Deposit') {
                                            setSourceDescription('');
                                            setReferenceId('');
                                        }
                                    }}
                                    className="w-full bg-[#111726] border border-slate-200 dark:border-white/10 text-slate-100 p-4 rounded-xl font-bold text-sm outline-none focus:border-indigo-500 transition-all shadow-inner"
                                >
                                    <option value="Default Deposit">💳 Standard Personal Liquid Deposit</option>
                                    <option value="Inheritance Funds">🏛️ Inheritance Funds (Probate Clearance)</option>
                                    <option value="Real Estate Proceeds">🏡 Real Estate Proceeds (Title Escrow Release)</option>
                                    <option value="Pension Allowance">👴 Pension Allowance (Federally Clearing Annuitant)</option>
                                    <option value="Corporate Salary">💼 Corporate Salary (ADP Executive Direct Deposit)</option>
                                </select>
                            </div>

                            {depositCategory !== 'Default Deposit' && (
                                <div className="space-y-4 p-5 bg-indigo-500 rounded-3xl border border-indigo-500/15 animate-fade-in">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Compliance Registry Details</p>
                                    
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1 block">Source Description / Issuing Entity *</label>
                                        <input 
                                            type="text" 
                                            value={sourceDescription} 
                                            onChange={e => { setSourceDescription(e.target.value); setValidationError(''); }} 
                                            placeholder="e.g. Allied Heritage & Estate Distribution Trust" 
                                            className="w-full bg-[#111726] border border-slate-200 dark:border-white/10 text-white p-3.5 rounded-xl font-semibold text-xs outline-none focus:border-indigo-500 transition-all font-sans"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1 block">Documentation Reference Tracking ID *</label>
                                        <input 
                                            type="text" 
                                            value={referenceId} 
                                            onChange={e => { setReferenceId(e.target.value); setValidationError(''); }} 
                                            placeholder="e.g. TAX-ESTATE-991A-DE" 
                                            className="w-full bg-[#111726] border border-slate-200 dark:border-white/10 text-white p-3.5 rounded-xl font-semibold text-xs outline-none focus:border-indigo-500 font-mono transition-all"
                                        />
                                    </div>
                                    <p className="text-[9px] text-[#0F172A] dark:text-white tracking-wide leading-relaxed italic">
                                        * Declaring these fields creates a compliance clearing record. Funds will enter 'Flagged for Review' status during validation.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-4">
                                {selectedMethod?.type === 'CARD' ? (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">Card Number</label>
                                            <input type="text" value={accountRef} onChange={e => setAccountRef(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-4 rounded-xl font-mono text-sm outline-none focus:border-primary transition-all" placeholder="0000 0000 0000 0000" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input type="text" className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-4 rounded-xl font-mono text-sm outline-none" placeholder="MM/YY" />
                                            <input type="text" className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-4 rounded-xl font-mono text-sm outline-none" placeholder="CVC" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-[#111726] p-4 rounded-xl border border-slate-100 dark:border-white/10 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center border border-green-500/20">
                                            <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#0F172A]">Account Verified</p>
                                            <p className="text-xs text-[#0F172A]">Authenticated via {selectedMethod?.label} Gateway</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {validationError && (
                                <p className="text-rose-400 text-xs font-semibold bg-rose-500 p-3 rounded-xl border border-rose-500/15 text-center animate-pulse">
                                    ⚠️ {validationError}
                                </p>
                            )}

                            <button onClick={handleSubmit} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95">
                                Confirm Deposit
                            </button>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="text-center py-12 animate-fade-in">
                            <SpinnerIcon className="w-12 h-12 text-primary animate-spin mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Processing Transaction</h3>
                            <p className="text-[#0F172A] dark:text-white text-sm mt-2">Clearing funds via Settlement Layer...</p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center py-8 animate-fade-in-up">
                            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                                <CheckCircleIcon className="w-10 h-10 text-[#0F172A] dark:text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-[#0F172A] dark:text-white">Funds Available</h3>
                            <p className="text-[#0F172A] dark:text-white mt-2 mb-8">Your account has been successfully funded.</p>
                            <button onClick={onClose} className="w-full py-4 bg-white text-[#0F172A] font-bold rounded-2xl dark:bg-slate-800">Return to Dashboard</button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
