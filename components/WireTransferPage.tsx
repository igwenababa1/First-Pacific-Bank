
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Account, Recipient, Country, Transaction, AdvancedTransferLimits, NotificationType } from '../types';
import { DOMESTIC_WIRE_FEE, INTERNATIONAL_WIRE_FEE, TRANSFER_PURPOSES, USER_PIN, EXCHANGE_RATES, ALL_COUNTRIES, CURRENCIES_LIST } from './constants';
import { db } from '../services/database';
import { 
    CurrencyDollarIcon, UserCircleIcon, BankIcon, CheckCircleIcon, 
    XIcon, InfoIcon, UserGroupIcon, ShieldCheckIcon, DocumentCheckIcon, ExclamationTriangleIcon, LockClosedIcon,
    ArrowPathIcon, GlobeAmericasIcon, SpinnerIcon, ArrowLeftIcon, BuildingOfficeIcon, MapPinIcon, CreditCardIcon, VerifiedBadgeIcon
} from './Icons';
import { CountrySelector } from './CountrySelector';
import { BankSelector } from './BankSelector';
import { RecipientSelector } from './RecipientSelector';
import { ComplianceHaltModal } from './ComplianceHaltModal';
import { BiometricAuthorizationModal } from './BiometricAuthorizationModal';
import { AddRecipientModal } from './AddRecipientModal';
import { Stepper, Step } from './Stepper';
import { lookupRoutingNumber } from '../services/routingNumberService';
import { useCurrency } from '../contexts/CurrencyContext';
import { useSystemOptions } from '../hooks/useSystemOptions';

interface WireTransferPageProps {
    accounts: Account[];
    recipients: Recipient[];
    onSendWire: (data: any) => Promise<Transaction | null>;
    advancedTransferLimits: AdvancedTransferLimits;
    addRecipient: (data: any) => void;
    onContactSupport: (txId?: string) => void;
    addNotification: (type: NotificationType, title: string, message: string) => void;
}

const WIRE_STEPS: Step[] = [
    { label: 'Amount', icon: <CurrencyDollarIcon className="w-5 h-5" /> },
    { label: 'Beneficiary', icon: <UserCircleIcon className="w-5 h-5" /> },
    { label: 'Bank Details', icon: <BankIcon className="w-5 h-5" /> },
    { label: 'Review', icon: <DocumentCheckIcon className="w-5 h-5" /> },
    { label: 'Execution', icon: <ShieldCheckIcon className="w-5 h-5" /> },
];

const FieldSet: React.FC<{ legend: string, children: React.ReactNode, action?: React.ReactNode }> = ({ legend, children, action }) => (
    <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/10 pb-2 mb-4">
            <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-[0.2em]">{legend}</h3>
            {action}
        </div>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const Tooltip: React.FC<{ text: string }> = ({ text }) => {
    const [show, setShow] = useState(false);
    return (
        <div className="relative inline-block ml-2">
            <button type="button" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} className="text-[#0F172A] dark:text-white hover:text-primary transition-colors">
                <InfoIcon className="w-4 h-4" />
            </button>
            {show && <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white text-[10px] rounded-lg p-3 shadow-2xl z-50 pointer-events-none border border-slate-200 dark:border-white/10  leading-relaxed">
                {text}
            </div>}
        </div>
    );
};

export const WireTransferPage: React.FC<WireTransferPageProps> = ({ accounts, onSendWire, advancedTransferLimits, addRecipient, recipients, onContactSupport, addNotification }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const initialData = location.state || {};
    
    // Check if the rail is disabled globally
    const systemOptions = useSystemOptions();
    const isWireDisabledGlobally = systemOptions?.globalDisabledPaymentMethods?.includes('wire') || false;
    
    const { formatCurrency, displayCurrency, setDisplayCurrency, getCurrencyInfo, rates } = useCurrency();
    const currencySymbol = getCurrencyInfo(displayCurrency)?.symbol || '$';
    
    if (isWireDisabledGlobally) {
        return (
            <div className="max-w-2xl mx-auto py-20 text-center animate-fade-in-up">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <ExclamationTriangleIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-3xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight mb-2">Wire Network Offline</h2>
                <p className="text-[#0F172A] dark:text-white mb-8 max-w-lg mx-auto leading-relaxed">
                    The international and domestic wire transfer network is currently offline for system maintenance or administrative compliance review. Please check back later or contact your sovereign portfolio manager.
                </p>
                <button onClick={() => navigate(-1)} className="px-8 py-4 bg-slate-50 dark:bg-slate-900 text-white font-bold rounded-xl shadow-digital hover:bg-white dark:hover:bg-slate-700 transition-colors uppercase tracking-widest text-xs">
                    Return to Dashboard
                </button>
            </div>
        );
    }
    
    const [step, setStep] = useState<number>(initialData.step || 0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string | null>>({});
    const [isBankSelectorOpen, setIsBankSelectorOpen] = useState(false);
    const [isRecipientSelectorOpen, setIsRecipientSelectorOpen] = useState(false);
    const [isAddRecipientModalOpen, setIsAddRecipientModalOpen] = useState(false);
    const [sentTransaction, setSentTransaction] = useState<Transaction | null>(null);
    const [pin, setPin] = useState('');
    const [saveRecipient, setSaveRecipient] = useState(true);
    const [isValidatingRouting, setIsValidatingRouting] = useState(false);
    const [routingInfo, setRoutingInfo] = useState<any>(null);
    
    const [recentInstructions, setRecentInstructions] = useState<any[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('fpb_recent_payment_instructions');
            if (stored) {
                setRecentInstructions(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to parse recent payment instructions', e);
        }
    }, []);
    
    const [consents, setConsents] = useState({
        accuracy: false,
        auth: false,
        aml: false,
        irrevocable: false
    });

    const [showComplianceHalt, setShowComplianceHalt] = useState(false);
    const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);

    const [formData, setFormData] = useState({
        sourceAccountId: accounts.find(a => (a?.balance || 0) > 0)?.id || '',
        transferType: initialData.recipientCountry?.code === 'US' ? 'domestic' : 'international', 
        recipientCountry: initialData.recipientCountry || ALL_COUNTRIES.find(c => c.code === 'US') as Country,
        recipientName: '',
        recipientNickname: '',
        recipientAddress: '',
        recipientCity: '',
        recipientState: '',
        recipientPostalCode: '',
        bankName: initialData.bankName || '',
        bankAddress: '',
        accountNumber: '',
        swiftBic: '',
        routingNumber: '',
        intermediaryBank: '',
        amount: '',
        purpose: TRANSFER_PURPOSES[0],
    });

    const inputAmountInCurrency = useMemo(() => parseFloat(formData.amount) || 0, [formData.amount]);
    const numericAmount = useMemo(() => inputAmountInCurrency / (rates[displayCurrency] || 1), [inputAmountInCurrency, displayCurrency, rates]);
    const fee = useMemo(() => 0, [formData.transferType, numericAmount]);
    const exchangeRate = useMemo(() => EXCHANGE_RATES[formData.recipientCountry.currency] || 1, [formData.recipientCountry]);
    const receiveAmount = useMemo(() => numericAmount * exchangeRate, [numericAmount, exchangeRate]);
    const totalCost = useMemo(() => numericAmount + fee, [numericAmount, fee]);
    const sourceAccount = useMemo(() => accounts.find(a => a.id === formData.sourceAccountId), [accounts, formData.sourceAccountId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev: Record<string, string | null>) => ({...prev, [name]: null}));
    };
    
    const handleCountryChange = (country: Country) => {
        const isInt = country.code !== 'US';
        setFormData(prev => ({
            ...prev, 
            recipientCountry: country, 
            transferType: isInt ? 'international' : 'domestic',
            routingNumber: isInt ? '' : prev.routingNumber,
            swiftBic: isInt ? prev.swiftBic : '',
            bankName: ''
        }));
    };

    const handleBankSelect = (bankName: string) => {
        setFormData(prev => ({ ...prev, bankName }));
        setIsBankSelectorOpen(false);
        if (errors.bankName) setErrors((prev: Record<string, string | null>) => ({...prev, bankName: null}));
    };

    const handleRecipientSelect = (recipient: Recipient) => {
        const isInternational = recipient.country.code !== 'US';
        setFormData(prev => ({
            ...prev,
            recipientName: recipient.fullName,
            recipientNickname: recipient.nickname || '',
            recipientAddress: recipient.streetAddress || '',
            recipientCity: recipient.city || '',
            recipientState: recipient.stateProvince || '',
            recipientPostalCode: recipient.postalCode || '',
            recipientCountry: recipient.country,
            bankName: recipient.bankName,
            accountNumber: recipient.realDetails?.accountNumber || recipient.accountNumber || '',
            swiftBic: recipient.realDetails?.swiftBic || '',
            routingNumber: isInternational ? '' : (recipient.realDetails?.swiftBic || recipient.routingNumber || ''),
            intermediaryBank: recipient.realDetails?.intermediaryBank || '',
            bankAddress: recipient.realDetails?.bankAddress || '',
            transferType: isInternational ? 'international' : 'domestic',
        }));
        setIsRecipientSelectorOpen(false);
        setSaveRecipient(false); 
    };

    const handleAddNewRecipient = (data: any) => {
        addRecipient(data);
        const isInt = data.country.code !== 'US';
        setFormData(prev => ({
            ...prev,
            recipientName: data.fullName,
            recipientNickname: data.nickname || '',
            recipientAddress: data.streetAddress || '',
            recipientCity: data.city || '',
            recipientState: data.stateProvince || '',
            recipientPostalCode: data.postalCode || '',
            recipientCountry: data.country,
            bankName: data.bankName,
            accountNumber: data.accountNumber,
            swiftBic: data.swiftBic,
            routingNumber: isInt ? '' : data.swiftBic,
            intermediaryBank: data.realDetails?.intermediaryBank || '',
            bankAddress: data.realDetails?.bankAddress || '',
            transferType: isInt ? 'international' : 'domestic',
        }));
        setIsAddRecipientModalOpen(false);
        setSaveRecipient(false);
    };

    const handleBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let error: string | null = null;
        switch(name) {
            case 'routingNumber':
                if (formData.transferType === 'domestic') {
                    if (!/^\d{9}$/.test(value)) {
                        error = "ABA Routing Number must be 9 digits.";
                    } else {
                        setIsValidatingRouting(true);
                        const result = await lookupRoutingNumber(value);
                        setIsValidatingRouting(false);
                        if (result) {
                            setRoutingInfo(result);
                            setFormData(prev => ({ 
                                ...prev, 
                                bankName: result.bankName,
                                bankAddress: [result.address, result.city, result.state, result.zip].filter(Boolean).join(', ')
                            }));
                            if (errors.bankName) setErrors((prev: Record<string, string | null>) => ({...prev, bankName: null}));
                        } else {
                            setRoutingInfo(null);
                        }
                    }
                }
                break;
            case 'swiftBic':
                if (formData.transferType === 'international' && !/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(value)) {
                    error = "Invalid SWIFT/BIC format.";
                }
                break;
        }
        setErrors((prev: Record<string, string | null>) => ({ ...prev, [name]: error }));
    };
    
    const validateStep = async (currentStep: number): Promise<boolean> => {
        const newErrors: Record<string, string | null> = {};
        switch (currentStep) {
            case 0:
                if (!formData.sourceAccountId) newErrors.sourceAccountId = "Source account is required.";
                if (numericAmount <= 0) newErrors.amount = "Please enter a valid amount.";
                if (sourceAccount && totalCost > (sourceAccount?.balance || 0)) newErrors.amount = "Total cost exceeds account balance.";
                break;
            case 1:
                if (!formData.recipientName.trim()) newErrors.recipientName = "Recipient name is required.";
                if (!formData.recipientAddress.trim()) newErrors.recipientAddress = "Address is required.";
                if (!formData.recipientCity.trim()) newErrors.recipientCity = "City is required.";
                if (!formData.recipientPostalCode.trim()) newErrors.recipientPostalCode = "Postal code is required.";
                break;
            case 2:
                if (!formData.bankName.trim()) newErrors.bankName = "Bank name is required.";
                if (!formData.accountNumber.trim()) newErrors.accountNumber = "Account number is required.";
                if (formData.transferType === 'domestic') {
                    if (!/^\d{9}$/.test(formData.routingNumber)) newErrors.routingNumber = "ABA Routing Number must be 9 digits.";
                } else {
                    if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(formData.swiftBic)) newErrors.swiftBic = "Invalid SWIFT/BIC format.";
                }
                break;
            case 3:
                 const email = db.getCurrentUserEmail();
                 const isValid = await db.verifyPin(email, pin);
                 if (!isValid) newErrors.pin = "Incorrect PIN.";
                 if (!consents.accuracy || !consents.auth || !consents.aml || !consents.irrevocable) {
                     newErrors.consents = "You must acknowledge all legal consents.";
                 }
                 break;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleNext = async () => {
        if (await validateStep(step)) {
            setStep((prev: number): number => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        setStep((prev: number): number => prev - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    const handlePreSubmit = async () => {
        if (await validateStep(3)) {
            if (numericAmount >= 500 || formData.transferType === 'international' || formData.transferType === 'domestic') {
                setShowBiometricPrompt(true);
            } else {
                setShowComplianceHalt(true);
            }
        }
    };

    const executeTransaction = async () => {
        setIsProcessing(true);
        setShowComplianceHalt(false); 

        const recipientForTx: Recipient = {
            id: `temp_${Date.now()}`,
            fullName: formData.recipientName,
            nickname: formData.recipientNickname,
            bankName: formData.bankName,
            accountNumber: `•••• ${formData.accountNumber.slice(-4)}`,
            country: formData.recipientCountry,
            deliveryOptions: { bankDeposit: true, cardDeposit: false, cashPickup: false },
            realDetails: {
                accountNumber: formData.accountNumber,
                swiftBic: formData.transferType === 'international' ? formData.swiftBic : formData.routingNumber,
                intermediaryBank: formData.intermediaryBank,
                bankAddress: formData.bankAddress,
            },
            streetAddress: formData.recipientAddress,
            city: formData.recipientCity,
            stateProvince: formData.recipientState,
            postalCode: formData.recipientPostalCode,
        };

        const txDetails = {
            accountId: formData.sourceAccountId,
            recipient: recipientForTx,
            sendAmount: numericAmount,
            receiveAmount: receiveAmount,
            receiveCurrency: formData.recipientCountry.currency,
            fee: fee,
            exchangeRate: exchangeRate,
            originalInputAmount: inputAmountInCurrency,
            originalInputCurrencyCode: displayCurrency,
            purpose: formData.purpose,
            description: `Wire Transfer to ${formData.recipientName}`,
            transferMethod: 'wire' as const,
            transferType: formData.transferType,
            estimatedArrival: new Date(Date.now() + 86400000 * 3), 
        };
        
        const tx = await onSendWire(txDetails);

        if (tx) {
            setSentTransaction(tx);
            if (saveRecipient) {
                const recipientDataToSave = {
                    fullName: formData.recipientName,
                    nickname: formData.recipientNickname,
                    bankName: formData.bankName,
                    accountNumber: formData.accountNumber,
                    swiftBic: formData.transferType === 'international' ? formData.swiftBic : formData.routingNumber,
                    country: formData.recipientCountry,
                    streetAddress: formData.recipientAddress,
                    city: formData.recipientCity,
                    stateProvince: formData.recipientState,
                    postalCode: formData.recipientPostalCode,
                    cashPickupEnabled: false,
                    realDetails: {
                        accountNumber: formData.accountNumber,
                        swiftBic: formData.transferType === 'international' ? formData.swiftBic : formData.routingNumber,
                        intermediaryBank: formData.intermediaryBank,
                        bankAddress: formData.bankAddress,
                    }
                };
                addRecipient(recipientDataToSave);
            }
            
            // Save to recent payment instructions cache
            let hist: any[] = [];
            try {
                const stored = localStorage.getItem('fpb_recent_payment_instructions');
                if (stored) hist = JSON.parse(stored);
            } catch (e) {}
            hist = hist.filter(h => h.accountNumber !== formData.accountNumber);
            hist.unshift({
                ...formData,
                timestamp: Date.now()
            });
            hist = hist.slice(0, 5);
            localStorage.setItem('fpb_recent_payment_instructions', JSON.stringify(hist));
            setRecentInstructions(hist);
            
            // Format transfer amount
            const formattedPrincipal = numericAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            
            // Push subtle toast notification
            addNotification(
                NotificationType.TRANSACTION,
                'Wire Remittance Dispatched',
                `Institutional wire in amount of ${formattedPrincipal} to ${formData.recipientName} has been routed for dispatch. Reference ID: ${tx.id}`
            );
            
            // Navigate back to core dashboard
            navigate('/');
        } else {
            setErrors({ final: 'An unknown error occurred. Please try again.' });
            setStep(3);
        }
        setIsProcessing(false);
    };

    const inputClasses = (name: string) => `mt-1 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-100 placeholder-slate-500 focus:bg-slate-50 dark:bg-slate-900 focus:outline-none p-4 rounded-2xl transition-all ${errors[name] ? 'ring-2 ring-red-500/50 border-red-500/50' : 'focus:ring-2 focus:ring-primary/50 focus:border-primary/50'}`;

    return (
        <div className="max-w-5xl mx-auto pb-20">
            {showBiometricPrompt && (
                <BiometricAuthorizationModal
                    isOpen={showBiometricPrompt}
                    transferDetails={{
                        recipientName: formData.recipientName || 'External Beneficiary',
                        bankName: formData.bankName || 'Partner Clearing Node',
                        amount: numericAmount,
                        currency: displayCurrency,
                        accountNumber: formData.accountNumber
                    }}
                    onApproved={() => {
                        setShowBiometricPrompt(false);
                        executeTransaction();
                    }}
                    onCancel={() => setShowBiometricPrompt(false)}
                />
            )}

            {showComplianceHalt && (
                <ComplianceHaltModal 
                    isOpen={showComplianceHalt}
                    amount={numericAmount}
                    onVerified={executeTransaction}
                    onCancel={() => setShowComplianceHalt(false)}
                    onContactSupport={onContactSupport}
                />
            )}

            {isAddRecipientModalOpen && (
                <AddRecipientModal
                    onClose={() => setIsAddRecipientModalOpen(false)}
                    onAddRecipient={handleAddNewRecipient}
                />
            )}

            {isRecipientSelectorOpen && (
                <RecipientSelector 
                    recipients={recipients} 
                    onSelect={handleRecipientSelect} 
                    onClose={() => setIsRecipientSelectorOpen(false)} 
                    onAddNew={() => { setIsRecipientSelectorOpen(false); setIsAddRecipientModalOpen(true); }}
                />
            )}
            {isBankSelectorOpen && (
                <BankSelector 
                    countryCode={formData.recipientCountry.code}
                    onSelect={handleBankSelect}
                    onClose={() => setIsBankSelectorOpen(false)} 
                />
            )}

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="space-y-2">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#0F172A] hover:text-[#0F172A] dark:text-white transition-colors text-xs font-black uppercase tracking-widest mb-4">
                        <ArrowLeftIcon className="w-4 h-4" />
                        <span>Back</span>
                    </button>
                    <h1 className="text-5xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase leading-none">Global Wire</h1>
                    <p className="text-[#0F172A] dark:text-white font-bold max-w-md">Institutional-grade SWIFT and FedWire settlement for high-value cross-border transfers.</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 p-6 rounded-[2rem]  flex items-center gap-6">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Daily Limit</p>
                        <p className="text-xl font-black text-[#0F172A] dark:text-white font-mono">
                            {advancedTransferLimits.wire.daily === 'Unlimited' ? 'Unlimited' : formatCurrency(advancedTransferLimits.wire.daily as number)}
                        </p>
                    </div>
                    <div className="w-px h-10 bg-white dark:bg-slate-800"></div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Monthly Limit</p>
                        <p className="text-xl font-black text-[#0F172A] dark:text-white font-mono">
                            {advancedTransferLimits.wire.monthly === 'Unlimited' ? 'Unlimited' : formatCurrency(advancedTransferLimits.wire.monthly as number)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main Flow */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-[2.5rem] p-10 ">
                        <Stepper steps={WIRE_STEPS} currentStep={step} className="mb-12" />

                        {step === 0 && (
                            <div className="space-y-8 animate-fade-in">
                                <FieldSet legend="Source & Network">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-2 mb-1 block">Debit Account</label>
                                            <select name="sourceAccountId" value={formData.sourceAccountId} onChange={handleChange} className={inputClasses('sourceAccountId')}>
                                                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.nickname || acc.type} ({formatCurrency((acc?.balance || 0))})</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-2 mb-1 block">Network Protocol</label>
                                            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/10">
                                                <GlobeAmericasIcon className="w-5 h-5 text-primary" />
                                                <p className="text-sm text-[#0F172A] dark:text-white font-bold capitalize">{formData.transferType === 'international' ? 'SWIFT Global' : 'FedWire Domestic'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </FieldSet>

                                <FieldSet legend="Transaction Value">
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl text-[#0F172A] font-bold">{currencySymbol}</span>
                                        <input type="number" name="amount" value={formData.amount} onChange={handleChange} className={`${inputClasses('amount')} pl-12 pr-28 text-2xl font-black`} placeholder={`0.00`} />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                           <select 
                                               value={displayCurrency}
                                               onChange={(e) => setDisplayCurrency(e.target.value)}
                                               className="appearance-none bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white font-bold text-sm px-3 py-1 pr-6 rounded-md outline-none cursor-pointer border border-slate-100 dark:border-white/10"
                                               style={{ backgroundImage: `url('data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpolyline points="6 9 12 15 18 9"%3E%3C/polyline%3E%3C/svg%3E')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center', backgroundSize: '12px' }}
                                           >
                                               {CURRENCIES_LIST.map(currency => (
                                                   <option key={currency.code} value={currency.code} className="bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white">
                                                       {currency.code}
                                                   </option>
                                               ))}
                                           </select>
                                        </div>
                                    </div>
                                    {errors.amount && <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest mt-2 ml-2">{errors.amount}</p>}
                                </FieldSet>

                                <FieldSet legend="Purpose of Remittance">
                                    <select name="purpose" value={formData.purpose} onChange={handleChange} className={inputClasses('purpose')}>
                                        {TRANSFER_PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                    <p className="text-[10px] text-[#0F172A] font-bold leading-relaxed ml-2">Required for regulatory compliance and AML reporting. Ensure the selected purpose accurately reflects the nature of this transaction.</p>
                                </FieldSet>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="space-y-8 animate-fade-in">
                                <FieldSet legend="Beneficiary Selection" action={
                                    <button onClick={() => setIsRecipientSelectorOpen(true)} className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-[#0F172A] dark:text-white transition-colors flex items-center gap-2">
                                        <UserGroupIcon className="w-4 h-4" />
                                        <span>Directory</span>
                                    </button>
                                }>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest ml-2 mb-1 block">Destination Jurisdiction</label>
                                            <CountrySelector selectedCountry={formData.recipientCountry} onSelect={handleCountryChange} className={`w-full flex items-center justify-between text-left ${inputClasses('country')}`} />
                                        </div>
                                        <input type="text" name="recipientName" value={formData.recipientName} onChange={handleChange} className={inputClasses('recipientName')} placeholder="Full Legal Name" />
                                        <input type="text" name="recipientNickname" value={formData.recipientNickname} onChange={handleChange} className={inputClasses('recipientNickname')} placeholder="Alias (Optional)" />
                                    </div>
                                </FieldSet>

                                <FieldSet legend="Physical Address">
                                    <input type="text" name="recipientAddress" value={formData.recipientAddress} onChange={handleChange} className={inputClasses('recipientAddress')} placeholder="Street Address" />
                                    <div className="grid grid-cols-3 gap-6">
                                        <input type="text" name="recipientCity" value={formData.recipientCity} onChange={handleChange} className={`${inputClasses('recipientCity')} col-span-2`} placeholder="City" />
                                        <input type="text" name="recipientState" value={formData.recipientState} onChange={handleChange} className={inputClasses('recipientState')} placeholder="State/Prov" />
                                    </div>
                                    <input type="text" name="recipientPostalCode" value={formData.recipientPostalCode} onChange={handleChange} className={inputClasses('recipientPostalCode')} placeholder="Postal/ZIP Code" />
                                </FieldSet>

                                <div className="flex justify-between items-center p-6 bg-white rounded-3xl border border-slate-100 dark:border-white/10 dark:bg-slate-800">
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-[#0F172A] dark:text-white">Save to Beneficiaries</p>
                                        <p className="text-[10px] text-[#0F172A] font-bold uppercase tracking-widest">Add to your secure node directory</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={saveRecipient} onChange={(e) => setSaveRecipient(e.target.checked)} />
                                        <div className="w-12 h-6 bg-white dark:bg-slate-900 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-8 animate-fade-in">
                                <FieldSet legend="Financial Institution" action={
                                    <button type="button" onClick={() => setIsBankSelectorOpen(true)} className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-[#0F172A] dark:text-white transition-colors">
                                        Search Global Nodes
                                    </button>
                                }>
                                    <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className={inputClasses('bankName')} placeholder="Bank Name" />
                                    <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} className={inputClasses('accountNumber')} placeholder={formData.transferType === 'international' ? "IBAN / Global Account Number" : "Account Number"} />
                                    
                                    {formData.transferType === 'domestic' ? (
                                        <div className="space-y-2">
                                            <div className="relative flex items-center">
                                                <input type="text" name="routingNumber" value={formData.routingNumber} onChange={handleChange} onBlur={handleBlur} className={`${inputClasses('routingNumber')} flex-1 pr-10`} placeholder="ABA Routing Number (9 Digits)" />
                                                
                                                {isValidatingRouting ? (
                                                    <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                                        <SpinnerIcon className="w-4 h-4 text-primary animate-spin" />
                                                    </div>
                                                ) : routingInfo ? (
                                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 group inline-flex items-center">
                                                        <div className="p-1 cursor-help text-emerald-500">
                                                            <InfoIcon className="w-4 h-4" />
                                                        </div>
                                                        {/* Tooltip */}
                                                        <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-48 bg-slate-50 border border-slate-300 text-white text-[10px] p-2 rounded shadow-2xl z-50 break-words pointer-events-none text-left dark:bg-slate-900">
                                                            <p className="font-bold text-emerald-400 mb-1 flex items-center gap-1"><VerifiedBadgeIcon className="w-3 h-3" /> Verifiable Routing Node</p>
                                                            <p className="font-bold">{routingInfo.bankName}</p>
                                                            <p>{routingInfo.city}, {routingInfo.state}</p>
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>

                                            {routingInfo && (
                                                <div className="text-[11px] bg-emerald-500 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl font-mono flex flex-col gap-1 shadow-sm mt-1 animate-fade-in">
                                                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                                                        <VerifiedBadgeIcon className="w-4 h-4 text-emerald-500" />
                                                        <span>Verifiable Routing Node Detected</span>
                                                    </div>
                                                    <p className="font-bold text-[#0F172A] dark:text-white">{routingInfo.bankName}</p>
                                                    <p className="text-[#0F172A] dark:text-white">{routingInfo.city}, {routingInfo.state} {routingInfo.zip || ''}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <input type="text" name="swiftBic" value={formData.swiftBic} onChange={handleChange} onBlur={handleBlur} className={inputClasses('swiftBic')} placeholder="SWIFT/BIC Code (8-11 Characters)" />
                                    )}

                                    {errors.routingNumber && <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest mt-2 ml-2">{errors.routingNumber}</p>}
                                    {errors.swiftBic && <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest mt-2 ml-2">{errors.swiftBic}</p>}
                                </FieldSet>

                                <FieldSet legend="Routing & Intermediary">
                                    <div className="relative">
                                        <input type="text" name="intermediaryBank" value={formData.intermediaryBank} onChange={handleChange} className={`${inputClasses('intermediaryBank')} pr-12`} placeholder="Intermediary Bank (Optional)" />
                                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                            <Tooltip text="An intermediary bank is a third-party bank used to facilitate international transfers between the sending and receiving banks. Required for certain jurisdictions." />
                                        </div>
                                    </div>
                                    <input type="text" name="bankAddress" value={formData.bankAddress} onChange={handleChange} className={inputClasses('bankAddress')} placeholder="Recipient Bank Physical Address (Optional)" />
                                </FieldSet>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-[2rem] p-8 space-y-8">
                                    <div className="flex items-center gap-4 border-b border-slate-100 dark:border-white/10 pb-6">
                                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                                            <DocumentCheckIcon className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Pre-Execution Audit</h3>
                                            <p className="text-[10px] text-[#0F172A] font-black uppercase tracking-widest">Review all cryptographic details before transmission</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="space-y-6">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Principal Amount</p>
                                                <p className="text-3xl font-black text-[#0F172A] dark:text-white font-mono">{formatCurrency(numericAmount, 'USD')}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">
                                                    Network Fee {formData.transferType === 'international' ? '(1.00% dynamic)' : '(domestic)'}
                                                </p>
                                                <p className="text-xl font-black text-[#0F172A] dark:text-white font-mono">{formatCurrency(fee, 'USD')}</p>
                                            </div>
                                            <div className="pt-4 border-t border-slate-100 dark:border-white/10">
                                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Estimated Settlement</p>
                                                <p className="text-4xl font-black text-emerald-400 font-mono">~ {formatCurrency(receiveAmount, formData.recipientCountry.currency)}</p>
                                                {formData.transferType === 'international' && (
                                                    <p className="text-[10px] text-[#0F172A] mt-2 font-bold uppercase tracking-widest flex items-center gap-2">
                                                        <ArrowPathIcon className="w-3 h-3"/> 1 USD = {exchangeRate.toFixed(4)} {formData.recipientCountry.currency}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-100 dark:border-white/10 dark:bg-slate-800">
                                            <div className="space-y-4">
                                                <div className="flex items-start gap-3">
                                                    <UserCircleIcon className="w-4 h-4 text-[#0F172A] mt-1" />
                                                    <div>
                                                        <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Beneficiary</p>
                                                        <p className="text-sm font-bold text-[#0F172A] dark:text-white">{formData.recipientName}</p>
                                                        <p className="text-[10px] text-[#0F172A] dark:text-white font-bold">{formData.recipientAddress}, {formData.recipientCity}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <BuildingOfficeIcon className="w-4 h-4 text-[#0F172A] mt-1" />
                                                    <div>
                                                        <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Target Node</p>
                                                        <p className="text-sm font-bold text-[#0F172A] dark:text-white">{formData.bankName}</p>
                                                        <p className="text-[10px] text-[#0F172A] dark:text-white font-mono uppercase tracking-widest">IBAN: •••• {formData.accountNumber.slice(-4)}</p>
                                                        <p className="text-[10px] text-[#0F172A] dark:text-white font-mono uppercase tracking-widest">{formData.transferType === 'international' ? 'SWIFT' : 'ABA'}: {formData.transferType === 'international' ? formData.swiftBic : formData.routingNumber}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <MapPinIcon className="w-4 h-4 text-[#0F172A] mt-1" />
                                                    <div>
                                                        <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Jurisdiction</p>
                                                        <p className="text-sm font-bold text-[#0F172A] dark:text-white">{formData.recipientCountry.name}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
                                        <h3 className="text-[10px] font-black text-[#0F172A] uppercase tracking-[0.2em]">Legal Attestations</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { id: 'accuracy', text: "I certify that all provided details are correct. I accept responsibility for any delays caused by data inaccuracies." },
                                            { id: 'auth', text: "I authorize a one-time debit from my specified account including all processing fees." },
                                            { id: 'aml', text: "I confirm that this wire transfer complies with international AML and OFAC sanctions policies." },
                                            { id: 'irrevocable', text: "I understand that global wire transfers are final and irrevocable once released to the network." }
                                        ].map(c => (
                                            <label key={c.id} className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-2xl cursor-pointer group hover:bg-white transition-colors">
                                                <div className="relative flex items-center mt-0.5">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={(consents as any)[c.id]} 
                                                        onChange={e => setConsents({...consents, [c.id]: e.target.checked})} 
                                                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-lg border border-slate-200 dark:border-slate-300 bg-slate-100 checked:border-primary checked:bg-primary transition-all" 
                                                    />
                                                    <CheckCircleIcon className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#0F172A] dark:text-white opacity-0 peer-checked:opacity-100" />
                                                </div>
                                                <span className="text-[10px] text-[#0F172A] dark:text-white group-hover:text-[#0F172A] dark:text-[#1E293B] transition-colors leading-relaxed font-bold">{c.text}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {errors.consents && <p className="text-red-400 text-[10px] font-black uppercase tracking-widest text-center bg-red-500 py-3 rounded-2xl border border-red-500/20">{errors.consents}</p>}
                                </div>

                                <div className="max-w-xs mx-auto space-y-4 pt-8">
                                     <div className="text-center">
                                         <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-[0.3em] mb-4">Authorization PIN</label>
                                         <input 
                                            type="password" 
                                            value={pin} 
                                            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} 
                                            maxLength={4} 
                                            className="w-full bg-slate-100 border border-slate-200 dark:border-slate-700 text-center text-4xl tracking-[1em] rounded-3xl p-6 text-[#0F172A] dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-2xl placeholder-slate-900" 
                                            placeholder="••••" 
                                        />
                                         {errors.pin && <p className="text-red-400 text-[10px] font-black uppercase tracking-widest mt-4">{errors.pin}</p>}
                                     </div>
                                </div>
                            </div>
                        )}

                        {step === 4 && sentTransaction && (
                             <div className="text-center max-w-lg mx-auto animate-fade-in py-10">
                                 <div className="w-32 h-32 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-[0_0_50px_rgba(16,185,129,0.1)] border border-emerald-500/20">
                                     <CheckCircleIcon className="w-16 h-16 text-emerald-400" />
                                 </div>
                                <h3 className="text-4xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase leading-none">Transmission Finalized</h3>
                                <p className="text-[#0F172A] dark:text-white mt-6 leading-relaxed font-bold">
                                    Your wire transfer has been successfully released to the global settlement network. 
                                    Funds are expected to settle within 24-72 hours depending on target jurisdiction.
                                </p>
                                <div className="p-8 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-[2rem] mt-12 text-left space-y-4 shadow-inner">
                                     <div className="flex justify-between items-center">
                                         <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Reference ID</span>
                                         <span className="font-mono text-[#0F172A] dark:text-white font-bold text-sm">{sentTransaction.id}</span>
                                     </div>
                                     <div className="flex justify-between items-center">
                                         <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Value Date</span>
                                         <span className="text-[#0F172A] dark:text-[#1E293B] font-bold text-sm">{sentTransaction.estimatedArrival.toLocaleDateString()}</span>
                                     </div>
                                     <div className="flex justify-between items-center">
                                         <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Settlement Network</span>
                                         <span className="text-[#0F172A] dark:text-[#1E293B] font-bold text-sm">{formData.transferType === 'international' ? 'SWIFT Global' : 'FedWire Domestic'}</span>
                                     </div>
                                </div>
                                <div className="mt-12 flex flex-col sm:flex-row gap-4">
                                     <button onClick={() => navigate('/dashboard')} className="flex-1 py-5 bg-white text-[#0F172A] font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl transition-all transform active:scale-[0.98] dark:bg-slate-800">Dashboard</button>
                                     <button onClick={() => navigate('/history')} className="flex-1 py-5 bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl transition-all transform active:scale-[0.98] border border-slate-100 dark:border-white/10">Audit Ledger</button>
                                </div>
                             </div>
                        )}

                        {step < 4 && (
                            <div className="mt-16 flex justify-between gap-6 pt-10 border-t border-slate-100 dark:border-white/10">
                                <button onClick={handleBack} disabled={step === 0} className="flex-1 py-5 text-xs font-black uppercase tracking-widest text-[#0F172A] bg-white hover:bg-white border border-slate-100 dark:border-white/10 rounded-2xl disabled:opacity-30 transition-all dark:bg-slate-800">Previous</button>
                                {step < 3 ? (
                                    <button onClick={handleNext} className="flex-[2] py-5 text-xs font-black uppercase tracking-widest text-[#0F172A] dark:text-white bg-primary hover:bg-primary-600 rounded-2xl shadow-2xl shadow-primary/20 transition-all transform active:scale-[0.98]">Continue Flow</button>
                                ) : (
                                    <button 
                                        onClick={handlePreSubmit} 
                                        disabled={isProcessing} 
                                        className="flex-[2] py-5 text-xs font-black uppercase tracking-widest text-[#0F172A] dark:text-white bg-emerald-600 hover:bg-emerald-500 rounded-2xl shadow-2xl shadow-emerald-900/20 flex items-center justify-center transition-all transform active:scale-[0.98]"
                                    >
                                        <LockClosedIcon className="w-4 h-4 mr-3" />
                                        {isProcessing ? 'Transmitting...' : 'Finalize & Transmit'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-[2.5rem] p-8 space-y-8 ">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                                <ShieldCheckIcon className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-widest">Security Protocol</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Encryption</p>
                                <p className="text-xs text-[#0F172A] dark:text-white leading-relaxed">All wire instructions are signed with AES-256-GCM hardware-level encryption before being broadcast to the network.</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Compliance</p>
                                <p className="text-xs text-[#0F172A] dark:text-white leading-relaxed">Real-time screening against global OFAC, UN, and EU sanction lists is performed prior to execution.</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Settlement</p>
                                <p className="text-xs text-[#0F172A] dark:text-white leading-relaxed">Domestic wires settle same-day via FedWire. International wires settle via SWIFT gpi for end-to-end tracking.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-8 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
                                <InfoIcon className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-widest">Network Fees</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Domestic (FedWire)</span>
                                <span className="text-sm font-bold text-[#0F172A] dark:text-white font-mono">{formatCurrency(DOMESTIC_WIRE_FEE)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">International (SWIFT)</span>
                                <span className="text-sm font-bold text-[#0F172A] dark:text-white font-mono">1.00% dynamic</span>
                            </div>
                        </div>
                    </div>

                    {recentInstructions.length > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-[2.5rem] p-8 space-y-6  transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                                    <ArrowPathIcon className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-widest">Recent Templates</h3>
                            </div>
                            <p className="text-[10px] text-[#0F172A] dark:text-white font-bold uppercase tracking-widest">Click to auto-fill the transfer fields immediately:</p>
                            <div className="space-y-3">
                                {recentInstructions.map((inst, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                ...inst
                                            }));
                                            addNotification(NotificationType.ALERT, 'Template Restored', `Restored external payment coordinates for ${inst.recipientName}.`);
                                        }}
                                        className="w-full text-left p-4 bg-white hover:bg-white dark:hover:bg-white border border-slate-200 dark:border-white/10 rounded-2xl transition-all flex flex-col gap-1 hover:border-primary/50 group dark:bg-slate-800"
                                    >
                                        <div className="flex justify-between items-center w-full">
                                            <span className="font-bold text-xs text-[#0F172A] dark:text-white group-hover:text-primary transition-colors">{inst.recipientName}</span>
                                            <span className="text-[9px] font-mono text-[#0F172A] bg-slate-200 dark:bg-slate-900 px-1.5 py-0.5 rounded uppercase">{inst.transferType}</span>
                                        </div>
                                        <span className="text-[10px] text-[#0F172A] dark:text-white font-bold truncate w-full">{inst.bankName}</span>
                                        <span className="text-[9px] text-[#0F172A] dark:text-white font-mono">Acct: ••••{inst.accountNumber?.slice(-4)} &bull; BIC/ABA: {inst.transferType === 'domestic' ? inst.routingNumber : inst.swiftBic}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
