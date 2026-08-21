
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Account, Recipient, Country, Transaction, AdvancedTransferLimits, NotificationType } from '../types';
import { DOMESTIC_WIRE_FEE, INTERNATIONAL_WIRE_FEE, TRANSFER_PURPOSES, USER_PIN, EXCHANGE_RATES, ALL_COUNTRIES, CRYPTO_CURRENCIES, CURRENCIES_LIST } from './constants';
import { db } from '../services/database';
import { 
    CurrencyDollarIcon, UserCircleIcon, BankIcon, CheckCircleIcon, 
    XIcon, InfoIcon, UserGroupIcon, ShieldCheckIcon, DocumentCheckIcon, ExclamationTriangleIcon, LockClosedIcon,
    ArrowPathIcon, GlobeAmericasIcon, SpinnerIcon, WalletIcon, VerifiedBadgeIcon
} from './Icons';
import { CountrySelector } from './CountrySelector';
import { CurrencySelector } from './CurrencySelector';
import { BankSelector } from './BankSelector';
import { RecipientSelector } from './RecipientSelector';
import { SmartInput } from './SmartInput';
import { ComplianceHaltModal } from './ComplianceHaltModal';
import { BiometricAuthorizationModal } from './BiometricAuthorizationModal';
import { AddRecipientModal } from './AddRecipientModal';
import { Stepper, Step } from './Stepper';
import { lookupRoutingNumber } from '../services/routingNumberService';
import { useCurrency } from '../contexts/CurrencyContext';

interface WireTransferProps {
    accounts: Account[];
    recipients: Recipient[];
    onSendWire: (data: any) => Promise<Transaction | null>;
    onClose: () => void;
    initialData?: {
        bankName?: string;
        step?: number;
        recipientCountry?: Country;
    } | null;
    advancedTransferLimits: AdvancedTransferLimits;
    addRecipient: (data: any) => void;
    onContactSupport: (txId?: string) => void;
    addNotification: (type: NotificationType, title: string, message: string) => void;
}



const FieldSet: React.FC<{ legend: string, children: React.ReactNode, action?: React.ReactNode }> = ({ legend, children, action }) => (
    <fieldset className="p-4 border border-slate-600 rounded-lg bg-white dark:bg-slate-900 relative">
        <div className="flex justify-between items-center mb-4">
            <legend className="font-bold px-2 text-[#0F172A] dark:text-white">{legend}</legend>
            {action}
        </div>
        <div className="space-y-4">
            {children}
        </div>
    </fieldset>
);

const Tooltip: React.FC<{ text: string }> = ({ text }) => {
    const [show, setShow] = useState(false);
    return (
        <div className="relative inline-block ml-2">
            <button type="button" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} className="text-[#0F172A] dark:text-white hover:text-primary">
                <InfoIcon className="w-4 h-4" />
            </button>
            {show && <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white text-xs rounded-md p-2 shadow-lg z-10 pointer-events-none border border-slate-200 dark:border-white/10">{text}</div>}
        </div>
    );
};

const LimitDisplay: React.FC<{ label: string, value: number | 'Unlimited' }> = ({ label, value }) => {
    const { formatCurrency } = useCurrency();
    return (
    <div className="flex justify-between text-sm py-1">
        <span className="text-[#0F172A] dark:text-white">{label}</span>
        <span className="font-semibold text-[#0F172A] dark:text-[#1E293B] font-mono">
            {typeof value === 'number' ? formatCurrency(value, 'USD') : value}
        </span>
    </div>
    );
};

export const WireTransfer: React.FC<WireTransferProps> = ({ accounts, onSendWire, onClose, initialData, advancedTransferLimits, addRecipient, recipients, onContactSupport, addNotification }) => {
    const navigate = useNavigate();
    const { formatCurrency, displayCurrency, setDisplayCurrency, getCurrencyInfo, rates } = useCurrency();
    const currencySymbol = getCurrencyInfo(displayCurrency)?.symbol || '$';
    const [step, setStep] = useState(0);
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
    
    const [consents, setConsents] = useState({
        accuracy: false,
        auth: false,
        aml: false,
        irrevocable: false
    });

    const [showComplianceHalt, setShowComplianceHalt] = useState(false);
    const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);

    const [formData, setFormData] = useState({
        sourceAccountId: accounts.find(a => a.balance > 0)?.id || '',
        transferType: 'domestic', // 'domestic' | 'international' | 'crypto'
        transferMethod: 'wire', // 'wire' | 'crypto'
        recipientCountry: ALL_COUNTRIES.find(c => c.code === 'US') as Country,
        recipientName: '',
        recipientNickname: '',
        recipientAddress: '',
        recipientCity: '',
        recipientState: '',
        recipientPostalCode: '',
        bankName: '',
        bankAddress: '',
        accountNumber: '', // Used for Wallet Address in Crypto mode
        swiftBic: '',
        routingNumber: '',
        intermediaryBank: '',
        amount: '',
        purpose: TRANSFER_PURPOSES[0],
        cryptoCurrency: 'BTC', // Default crypto
    });

    // Auto-save: recover progress from sessionStorage on mount
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem('prb_wire_transfer_autosave');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.formData !== undefined) {
                    setFormData(prev => ({
                        ...prev,
                        ...parsed.formData,
                        recipientCountry: parsed.formData.recipientCountry || prev.recipientCountry
                    }));
                }
                if (parsed.step !== undefined && parsed.step < 4) setStep(parsed.step);
                if (parsed.consents !== undefined) setConsents(parsed.consents);
                if (parsed.saveRecipient !== undefined) setSaveRecipient(parsed.saveRecipient);
            }
        } catch (e) {
            console.error('Failed to load wire transfer autosave', e);
        }
    }, [accounts]);

    // Auto-save: persist progress to sessionStorage on changes
    useEffect(() => {
        try {
            const dataToSave = {
                formData,
                step,
                consents,
                saveRecipient
            };
            if (step < 4) {
                sessionStorage.setItem('prb_wire_transfer_autosave', JSON.stringify(dataToSave));
            }
        } catch (e) {
            console.error('Failed to save wire transfer autosave', e);
        }
    }, [formData, step, consents, saveRecipient]);

    // Auto-save: clear progress on transaction completion
    useEffect(() => {
        if (sentTransaction) {
            try {
                sessionStorage.removeItem('prb_wire_transfer_autosave');
            } catch (e) {
                console.error(e);
            }
        }
    }, [sentTransaction]);

    const WIRE_STEPS: Step[] = [
        { label: 'Details', icon: <CurrencyDollarIcon className="w-5 h-5" /> },
        { label: 'Recipient', icon: <UserCircleIcon className="w-5 h-5" /> },
        { label: formData.transferMethod === 'crypto' ? 'Wallet Info' : 'Bank Info', icon: formData.transferMethod === 'crypto' ? <WalletIcon className="w-5 h-5" /> : <BankIcon className="w-5 h-5" /> },
        { label: 'Legal', icon: <DocumentCheckIcon className="w-5 h-5" /> },
        { label: 'Network', icon: <ShieldCheckIcon className="w-5 h-5" /> },
    ];

    useEffect(() => {
        if (initialData) {
            setFormData(prev => {
                const country = initialData.recipientCountry || prev.recipientCountry;
                const isInt = country.code !== 'US';
                return {
                    ...prev,
                    bankName: initialData.bankName || prev.bankName,
                    recipientCountry: country,
                    transferType: isInt ? 'international' : 'domestic',
                };
            });
            if (initialData.step) {
                setStep(initialData.step);
            }
        }
    }, [initialData]);

    const inputAmountInCurrency = useMemo(() => parseFloat(formData.amount) || 0, [formData.amount]);
    const numericAmount = useMemo(() => inputAmountInCurrency / (rates[displayCurrency] || 1), [inputAmountInCurrency, displayCurrency, rates]);

    const fee = useMemo(() => {
        if (formData.transferMethod === 'crypto') return 0; // 0% crypto fee
        return 0;
    }, [formData.transferType, formData.transferMethod, numericAmount]);
    
    const exchangeRate = useMemo(() => {
        if (formData.transferMethod === 'crypto') {
            // Invert rate: USD to Crypto
            const cryptoRate = rates[formData.cryptoCurrency] || 1;
            return 1 / cryptoRate; 
        }
        return rates[formData.recipientCountry.currency] || 1;
    }, [formData.recipientCountry, formData.cryptoCurrency, formData.transferMethod, rates]);

    const receiveAmount = useMemo(() => {
        if (formData.transferMethod === 'crypto') {
             return (numericAmount - fee) * exchangeRate;
        }
        return numericAmount * exchangeRate;
    }, [numericAmount, exchangeRate, fee, formData.transferMethod]);

    const totalCost = useMemo(() => numericAmount + (formData.transferMethod === 'crypto' ? 0 : fee), [numericAmount, fee, formData.transferMethod]);
    const sourceAccount = useMemo(() => accounts.find(a => a.id === formData.sourceAccountId), [accounts, formData.sourceAccountId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({...prev, [name]: null}));
    };

    const handleTransferMethodChange = (method: 'wire' | 'crypto') => {
        setFormData(prev => ({
            ...prev,
            transferMethod: method,
            transferType: method === 'crypto' ? 'crypto' : (prev.recipientCountry.code !== 'US' ? 'international' : 'domestic'),
            bankName: method === 'crypto' ? 'Crypto Network' : '',
            accountNumber: '',
            routingNumber: '',
            swiftBic: ''
        }));
    };

    const handleCryptoSelect = (currencyCode: string) => {
        setFormData(prev => ({ ...prev, cryptoCurrency: currencyCode }));
    };

    // Auto-switch Transfer Type logic
    const handleCountryChange = (country: Country) => {
        if (formData.transferMethod === 'crypto') return;
        const isInt = country.code !== 'US';
        setFormData(prev => ({
            ...prev, 
            recipientCountry: country, 
            transferType: isInt ? 'international' : 'domestic',
            // Clear invalid fields for new jurisdiction
            routingNumber: isInt ? '' : prev.routingNumber,
            swiftBic: isInt ? prev.swiftBic : '',
            bankName: ''
        }));
    };

    const handleBankSelect = (bankName: string) => {
        setFormData(prev => ({ ...prev, bankName }));
        setIsBankSelectorOpen(false);
        if (errors.bankName) setErrors(prev => ({...prev, bankName: null}));
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
                        // Routing Number Lookup
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
                            if (errors.bankName) setErrors(prev => ({...prev, bankName: null}));
                        } else {
                             setRoutingInfo(null);
                             // Keep input but maybe warn or just rely on user manual entry if it fails silently
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
        setErrors(prev => ({ ...prev, [name]: error }));
    };
    
    const validateStep = async (currentStep: number): Promise<boolean> => {
        const newErrors: Record<string, string | null> = {};
        switch (currentStep) {
            case 0:
                if (!formData.sourceAccountId) newErrors.sourceAccountId = "Source account is required.";
                if (numericAmount <= 0) newErrors.amount = "Please enter a valid amount.";
                if (sourceAccount && totalCost > sourceAccount.balance) newErrors.amount = "Total cost exceeds account balance.";
                break;
            case 1:
                if (formData.transferMethod === 'wire') {
                    if (!formData.recipientName.trim()) newErrors.recipientName = "Recipient name is required.";
                    if (!formData.recipientAddress.trim()) newErrors.recipientAddress = "Address is required.";
                    if (!formData.recipientCity.trim()) newErrors.recipientCity = "City is required.";
                    if (!formData.recipientPostalCode.trim()) newErrors.recipientPostalCode = "Postal code is required.";
                } else {
                    // Crypto validation
                    // Recipient name optional
                }
                break;
            case 2:
                if (formData.transferMethod === 'wire') {
                    if (!formData.bankName.trim()) newErrors.bankName = "Bank name is required.";
                    if (!formData.accountNumber.trim()) newErrors.accountNumber = "Account number is required.";
                    // Validate based on dynamic type
                    if (formData.transferType === 'domestic') {
                        if (!/^\d{9}$/.test(formData.routingNumber)) newErrors.routingNumber = "ABA Routing Number must be 9 digits.";
                    } else {
                        if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(formData.swiftBic)) newErrors.swiftBic = "Invalid SWIFT/BIC format.";
                    }
                } else {
                    // Crypto validation
                    if (!formData.accountNumber.trim()) newErrors.accountNumber = "Wallet address is required.";
                    if (formData.accountNumber.length < 10) newErrors.accountNumber = "Invalid wallet address length.";
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
            setStep(prev => prev + 1);
        }
    };

    const handleBack = () => setStep(prev => prev - 1);
    
    const handlePreSubmit = async () => {
        if (await validateStep(3)) {
            // Trigger biometric prompt for wire external transfers or high value submissions
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
            fullName: formData.recipientName || (formData.transferMethod === 'crypto' ? 'Unknown Wallet' : ''),
            nickname: formData.recipientNickname,
            bankName: formData.transferMethod === 'crypto' ? `${formData.cryptoCurrency} Network` : formData.bankName,
            accountNumber: formData.transferMethod === 'crypto' ? formData.accountNumber : `•••• ${formData.accountNumber.slice(-4)}`,
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
            receiveCurrency: formData.transferMethod === 'crypto' ? formData.cryptoCurrency : formData.recipientCountry.currency,
            fee: fee,
            exchangeRate: exchangeRate,
            originalInputAmount: inputAmountInCurrency,
            originalInputCurrencyCode: displayCurrency,
            purpose: formData.purpose,
            description: formData.transferMethod === 'crypto' ? `Crypto Transfer to ${formData.accountNumber.slice(0,6)}...` : `Wire Transfer to ${formData.recipientName}`,
            transferMethod: formData.transferMethod === 'crypto' ? 'crypto' : 'wire' as const,
            estimatedArrival: new Date(Date.now() + (formData.transferMethod === 'crypto' ? 3600000 : 86400000 * 3)), // 1 hour for crypto, 3 days for wire
        };
        
        const tx = await onSendWire(txDetails);

        if (tx) {
            setSentTransaction(tx);
            if (saveRecipient && formData.transferMethod === 'wire') { // Only save wire recipients for now
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
            
            // Build transfer and fee amount in formatted string
            const formattedPrincipal = numericAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            
            // Trigger beautiful iOS-style subtle toast notification
            addNotification(
                NotificationType.TRANSACTION,
                formData.transferMethod === 'crypto' ? 'Crypto Transfer Queue Finalized' : 'Wire Remittance Dispatched',
                `Successfully transmitted ${formattedPrincipal} to ${formData.recipientName || 'External Wallet'} (${formData.transferMethod === 'crypto' ? formData.cryptoCurrency : 'Wire'}). Reference ID: ${tx.id}`
            );
            
            // Exit wire flow modal immediately
            onClose();
        } else {
            setErrors({ final: 'An unknown error occurred. Please try again.' });
            setStep(3);
        }
        setIsProcessing(false);
    };

    const inputClasses = (name: string) => `mt-1 w-full bg-slate-100 dark:bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-400 focus:bg-slate-100 dark:bg-slate-700 focus:outline-none p-3 rounded-md transition-colors ${errors[name] ? 'ring-2 ring-red-500' : 'focus:ring-2 focus:ring-primary'}`;

    return (
        <>
            {showBiometricPrompt && (
                <BiometricAuthorizationModal
                    isOpen={showBiometricPrompt}
                    transferDetails={{
                        recipientName: formData.recipientName || 'External Beneficiary',
                        bankName: formData.transferMethod === 'crypto' ? `${formData.cryptoCurrency} Network` : formData.bankName || 'Partner Clearing Node',
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
            <div className="fixed inset-0 bg-slate-100 z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="w-full max-w-4xl relative max-h-[95vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10">
                    <div className="absolute inset-0 z-0">
                         <div 
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-in-out"
                            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1639755294951-54117c2a5247?q=80&w=2832&auto=format&fit=crop')` }}
                        ></div>
                        <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900 "></div>
                         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,82,255,0.1),transparent_70%)]"></div>
                    </div>
                    
                    <div className="relative z-10 p-8 flex-shrink-0">
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-[#0F172A] dark:text-white hover:text-slate-100 transition-colors"><XIcon className="w-6 h-6"/></button>
                        <h2 className="text-3xl font-bold text-slate-100 text-center mb-8">Advanced Wire Transfer</h2>
                        <Stepper steps={WIRE_STEPS} currentStep={step} className="px-8" />
                    </div>

                    <div className="relative z-10 flex-grow overflow-y-auto px-8 pb-8 custom-scrollbar">
                        {step === 0 && (
                             <div className="space-y-6 max-w-lg mx-auto animate-fade-in-up">
                                <FieldSet legend="Your Wire Limits">
                                    <LimitDisplay label="Per Transaction" value={advancedTransferLimits.wire.perTransaction || 'Unlimited'} />
                                    <LimitDisplay label="Daily Limit" value={advancedTransferLimits.wire.daily} />
                                    <LimitDisplay label="Monthly Limit" value={advancedTransferLimits.wire.monthly} />
                                </FieldSet>
                                <FieldSet legend="Transfer Details">
                                    <div className="flex gap-2 mb-4 p-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-300">
                                        <button 
                                            onClick={() => handleTransferMethodChange('wire')}
                                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${formData.transferMethod === 'wire' ? 'bg-primary text-[#0F172A] dark:text-white shadow-md' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white'}`}
                                        >
                                            Bank Wire
                                        </button>
                                        <button 
                                            onClick={() => handleTransferMethodChange('crypto')}
                                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${formData.transferMethod === 'crypto' ? 'bg-indigo-600 text-[#0F172A] dark:text-white shadow-md' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white'}`}
                                        >
                                            Crypto Transfer
                                        </button>
                                    </div>

                                    <select name="sourceAccountId" value={formData.sourceAccountId} onChange={handleChange} className={inputClasses('sourceAccountId')}>
                                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.nickname || acc.type} ({formatCurrency(acc.balance)})</option>)}
                                    </select>
                                    
                                    {/* Auto-detected Type Display */}
                                    <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-600">
                                        {formData.transferMethod === 'crypto' ? <WalletIcon className="w-5 h-5 text-indigo-400" /> : <GlobeAmericasIcon className="w-5 h-5 text-primary" />}
                                        <div className="flex-1">
                                            <p className="text-xs text-[#0F172A] dark:text-white font-bold uppercase tracking-wider">Network Type</p>
                                            <p className="text-sm text-[#0F172A] dark:text-white font-bold capitalize">{formData.transferMethod === 'crypto' ? `${formData.cryptoCurrency} Network` : formData.transferType}</p>
                                        </div>
                                        {formData.transferMethod === 'crypto' && (
                                            <div className="text-right">
                                                <p className="text-xs text-[#0F172A] dark:text-white font-bold uppercase tracking-wider">Rate</p>
                                                <p className="text-xs text-emerald-400 font-mono">1 USD ≈ {exchangeRate.toFixed(6)} {formData.cryptoCurrency}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
                                                <span className="text-[#0F172A] dark:text-white font-bold">{currencySymbol}</span>
                                                <select 
                                                    value={displayCurrency}
                                                    onChange={(e) => setDisplayCurrency(e.target.value)}
                                                    className="appearance-none bg-transparent text-[#0F172A] dark:text-white font-bold text-sm pr-4 outline-none cursor-pointer border-none"
                                                    style={{ backgroundImage: `url('data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpolyline points="6 9 12 15 18 9"%3E%3C/polyline%3E%3C/svg%3E')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0px center', backgroundSize: '12px' }}
                                                >
                                                    {CURRENCIES_LIST.map(currency => (
                                                        <option key={currency.code} value={currency.code} className="bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white">
                                                            {currency.code}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <input type="number" name="amount" value={formData.amount} onChange={handleChange} className={`${inputClasses('amount')} pl-24`} placeholder={`Amount`} />
                                        </div>
                                        {formData.transferMethod === 'crypto' && (
                                            <div className="w-1/3">
                                                 <CurrencySelector 
                                                    selectedCurrency={formData.cryptoCurrency} 
                                                    onSelect={handleCryptoSelect} 
                                                    label="Crypto Asset"
                                                    className="w-full h-full bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-md justify-between"
                                                 />
                                            </div>
                                        )}
                                    </div>
                                    {errors.amount && <p className="text-red-400 text-xs">{errors.amount}</p>}
                                </FieldSet>
                                <FieldSet legend="Purpose of Transfer">
                                    <select name="purpose" value={formData.purpose} onChange={handleChange} className={inputClasses('purpose')}>
                                        {TRANSFER_PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </FieldSet>
                            </div>
                        )}

                         {step === 1 && (
                            <div className="space-y-6 max-w-lg mx-auto animate-fade-in-up">
                                 <FieldSet legend="Recipient Information" action={
                                     <button onClick={() => setIsRecipientSelectorOpen(true)} className="text-xs font-bold text-primary-400 hover:text-[#0F172A] dark:text-white flex items-center space-x-2 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg shadow-sm border border-slate-600 hover:border-primary-500 transition-all group">
                                         <UserGroupIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                         <span>Manage Beneficiaries</span>
                                     </button>
                                 }>
                                    {formData.transferMethod === 'wire' && (
                                        <div>
                                            <label className="text-sm font-bold text-[#0F172A] dark:text-white">Recipient's Country</label>
                                            <CountrySelector selectedCountry={formData.recipientCountry} onSelect={handleCountryChange} className={`w-full flex items-center justify-between text-left mt-1 ${inputClasses('country')}`} />
                                        </div>
                                    )}

                                    <SmartInput type="text" name="recipientName" value={formData.recipientName} onChange={handleChange} placeholder={formData.transferMethod === 'crypto' ? "Wallet Owner Name (Optional)" : "Recipient Full Name"} typeType="name" />
                                    <SmartInput type="text" name="recipientNickname" value={formData.recipientNickname} onChange={handleChange} placeholder="Beneficiary Alias / Nickname (Optional)" typeType="name" />
                                    
                                    {formData.transferMethod === 'wire' && (
                                        <>
                                            <SmartInput type="text" name="recipientAddress" value={formData.recipientAddress} onChange={handleChange} placeholder="Street Address" typeType="address" />
                                            <div className="grid grid-cols-3 gap-4">
                                                 <SmartInput type="text" name="recipientCity" value={formData.recipientCity} onChange={handleChange} className="col-span-2" placeholder="City" />
                                                 <SmartInput type="text" name="recipientState" value={formData.recipientState} onChange={handleChange} placeholder="State" />
                                            </div>
                                            <SmartInput type="text" name="recipientPostalCode" value={formData.recipientPostalCode} onChange={handleChange} placeholder="Postal/ZIP Code" typeType="zip" />
                                        </>
                                    )}

                                    <div className="flex justify-between items-center mt-4 p-3 bg-white rounded-xl border border-slate-100 dark:border-white/10 dark:bg-slate-800">
                                        <label htmlFor="save-recipient-toggle" className="text-sm font-bold text-[#0F172A] dark:text-white">
                                            Save for future use
                                        </label>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" id="save-recipient-toggle" className="sr-only peer" checked={saveRecipient} onChange={(e) => setSaveRecipient(e.target.checked)} />
                                            <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner dark:bg-slate-800"></div>
                                        </label>
                                    </div>
                                </FieldSet>
                             </div>
                        )}

                        {step === 2 && (
                             <div className="space-y-6 max-w-lg mx-auto animate-fade-in-up">
                                <FieldSet legend={formData.transferMethod === 'crypto' ? "Wallet Details" : "Receiving Bank Information"}>
                                    {formData.transferMethod === 'wire' ? (
                                        <>
                                            <button type="button" onClick={() => setIsBankSelectorOpen(true)} className={`w-full text-left flex items-center justify-between ${inputClasses('bankName')}`}>
                                                <span className={formData.bankName ? 'text-[#0F172A] dark:text-white font-bold' : 'text-[#0F172A] dark:text-white'}>{formData.bankName || 'Search financial institution...'}</span>
                                                <span className="text-[#0F172A]">▼</span>
                                            </button>
                                            <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} className={inputClasses('accountNumber')} placeholder={formData.transferType === 'international' ? "IBAN / Account Number" : "Account Number"} />
                                            
                                            {formData.transferType === 'domestic' ? (
                                                <div className="space-y-2">
                                                    <div className="relative flex items-center">
                                                        <input type="text" name="routingNumber" value={formData.routingNumber} onChange={handleChange} onBlur={handleBlur} className={`${inputClasses('routingNumber')} flex-1 pr-10`} placeholder="ABA Routing Number (9 Digits)" />
                                                        
                                                        {isValidatingRouting ? (
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                                <SpinnerIcon className="w-4 h-4 text-primary animate-spin" />
                                                            </div>
                                                        ) : routingInfo ? (
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 group inline-flex items-center">
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
                                                <input type="text" name="swiftBic" value={formData.swiftBic} onChange={handleChange} onBlur={handleBlur} className={inputClasses('swiftBic')} placeholder="SWIFT/BIC Code (8-11 Chars)" />
                                            )}

                                            {errors.routingNumber && <p className="text-red-400 text-xs">{errors.routingNumber}</p>}
                                            {errors.swiftBic && <p className="text-red-400 text-xs">{errors.swiftBic}</p>}

                                            <div className="relative">
                                                <input type="text" name="intermediaryBank" value={formData.intermediaryBank} onChange={handleChange} className={`${inputClasses('intermediaryBank')} pr-10`} placeholder="Intermediary Bank (Optional)" />
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center"><Tooltip text="An intermediary bank may be required for certain international transfers to route funds correctly. Check with the recipient's bank if you are unsure." /></div>
                                            </div>
                                            <input type="text" name="bankAddress" value={formData.bankAddress} onChange={handleChange} className={inputClasses('bankAddress')} placeholder="Recipient Bank Address (Optional)" />
                                        </>
                                    ) : (
                                        <>
                                            <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-600 mb-4">
                                                <p className="text-xs text-[#0F172A] dark:text-white font-bold uppercase tracking-wider">Network</p>
                                                <p className="text-sm text-[#0F172A] dark:text-white font-bold">{formData.cryptoCurrency} Mainnet</p>
                                            </div>
                                            <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} className={inputClasses('accountNumber')} placeholder={`${formData.cryptoCurrency} Wallet Address`} />
                                            <p className="text-xs text-[#0F172A] dark:text-white mt-2 flex items-center gap-1">
                                                <InfoIcon className="w-3 h-3" />
                                                Ensure the address matches the {formData.cryptoCurrency} network.
                                            </p>
                                        </>
                                    )}
                                </FieldSet>
                            </div>
                        )}

                         {step === 3 && (
                             <div className="space-y-6 max-w-2xl mx-auto animate-fade-in-up">
                                <div className="bg-white dark:bg-slate-900 border border-slate-600 rounded-2xl p-6 shadow-xl">
                                    <h3 className="text-lg font-bold text-[#0F172A] dark:text-white border-b border-slate-100 dark:border-white/10 pb-3 mb-4 flex items-center gap-2">
                                        <CheckCircleIcon className="w-5 h-5 text-primary" />
                                        Final Transaction Audit
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-12 text-sm text-[#0F172A] dark:text-white">
                                        <div>
                                            <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-1">Principal Amount</p>
                                            <p className="text-lg font-bold text-[#0F172A] dark:text-white font-mono">{formatCurrency(numericAmount, 'USD')}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-1">Processing Fee {formData.transferType === 'international' ? '(1% dynamic)' : '(domestic)'}</p>
                                            <p className="text-lg font-bold text-[#0F172A] dark:text-white font-mono">{formatCurrency(fee, 'USD')}</p>
                                        </div>
                                        <div className="sm:col-span-2 border-t border-slate-100 dark:border-white/10 pt-3">
                                            <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-1">Recipient Credit</p>
                                            <p className="text-xl font-bold text-emerald-400 font-mono">
                                                ~ {formData.transferMethod === 'crypto' 
                                                    ? `${receiveAmount.toFixed(6)} ${formData.cryptoCurrency}`
                                                    : formatCurrency(receiveAmount, formData.recipientCountry.currency)
                                                  }
                                            </p>
                                            {formData.transferType === 'international' && formData.transferMethod === 'wire' && (
                                                <p className="text-xs text-[#0F172A] mt-1 flex items-center gap-1">
                                                    <ArrowPathIcon className="w-3 h-3"/> Market Rate Applied: 1 USD = {exchangeRate.toFixed(4)} {formData.recipientCountry.currency}
                                                </p>
                                            )}
                                            {formData.transferMethod === 'crypto' && (
                                                <p className="text-xs text-[#0F172A] mt-1 flex items-center gap-1">
                                                    <ArrowPathIcon className="w-3 h-3"/> Live Rate: 1 USD ≈ {exchangeRate.toFixed(6)} {formData.cryptoCurrency}
                                                </p>
                                            )}
                                        </div>
                                        <div className="border-t border-slate-100 dark:border-white/10 pt-3">
                                            <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mb-1">Target Account</p>
                                            <p className="font-bold text-[#0F172A] dark:text-[#1E293B]">{formData.recipientName || (formData.transferMethod === 'crypto' ? 'External Wallet' : '')}</p>
                                            <p className="text-xs text-[#0F172A] dark:text-white">
                                                {formData.transferMethod === 'crypto' 
                                                    ? `${formData.cryptoCurrency} •••• ${formData.accountNumber.slice(-4)}`
                                                    : `${formData.bankName} •••• ${formData.accountNumber.slice(-4)}`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border border-slate-200 dark:border-white/10 rounded-2xl p-6 dark:bg-slate-800">
                                    <div className="flex items-center gap-2 mb-4 text-yellow-400">
                                        <ExclamationTriangleIcon className="w-6 h-6" />
                                        <h3 className="font-bold uppercase tracking-wide text-xs">Legal Attestations Required</h3>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {[
                                            { id: 'accuracy', text: "I certify that all provided details are correct. I accept responsibility for any delays caused by data inaccuracies." },
                                            { id: 'auth', text: "I authorize a one-time debit from my specified account including all processing fees." },
                                            { id: 'aml', text: "I confirm that this wire transfer complies with international AML and OFAC sanctions policies." },
                                            { id: 'irrevocable', text: `I understand that ${formData.transferMethod === 'crypto' ? 'blockchain transactions' : 'global wire transfers'} are final and irrevocable once released to the network.` }
                                        ].map(c => (
                                            <label key={c.id} className="flex items-start gap-3 cursor-pointer group">
                                                <div className="relative flex items-center mt-0.5">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={(consents as any)[c.id]} 
                                                        onChange={e => setConsents({...consents, [c.id]: e.target.checked})} 
                                                        className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-500 bg-slate-50 dark:bg-slate-900 checked:border-primary checked:bg-primary transition-all" 
                                                    />
                                                    <CheckCircleIcon className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#0F172A] dark:text-white opacity-0 peer-checked:opacity-100" />
                                                </div>
                                                <span className="text-[11px] text-[#0F172A] dark:text-white group-hover:text-[#0F172A] dark:text-[#1E293B] transition-colors leading-relaxed">{c.text}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {errors.consents && <p className="text-red-400 text-xs mt-4 font-bold text-center bg-red-900 py-2 rounded-lg border border-red-500/20">{errors.consents}</p>}
                                </div>

                                <div className="max-w-sm mx-auto space-y-4">
                                     <div className="text-center">
                                         <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-widest mb-3">Final Authorization PIN</label>
                                         <input 
                                            type="password" 
                                            value={pin} 
                                            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} 
                                            maxLength={4} 
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-300 text-center text-4xl tracking-[1em] rounded-2xl p-4 text-[#0F172A] dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner placeholder-slate-800" 
                                            placeholder="••••" 
                                        />
                                         {errors.pin && <p className="text-red-400 text-xs mt-2 font-bold">{errors.pin}</p>}
                                     </div>
                                </div>
                             </div>
                        )}

                        {step === 4 && sentTransaction && (
                             <div className="text-center max-w-lg mx-auto animate-fade-in-up py-10">
                                 <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                                     <CheckCircleIcon className="w-12 h-12 text-green-400" />
                                 </div>
                                <h3 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tight">
                                    {formData.transferMethod === 'crypto' ? 'Blockchain Tx Initiated' : 'Wire Transmission Initiated'}
                                </h3>
                                <p className="text-[#0F172A] dark:text-white mt-4 leading-relaxed px-4">
                                    Your request has been validated and queued for the next settlement cycle. 
                                    Confirmation details have been sent to your secure inbox.
                                </p>
                                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-2xl mt-10 text-left text-sm space-y-3 shadow-inner">
                                     <div className="flex justify-between">
                                         <span className="text-[#0F172A]">Transaction ID</span>
                                         <span className="font-mono text-[#0F172A] dark:text-white font-bold">{sentTransaction.id}</span>
                                     </div>
                                     <div className="flex justify-between">
                                         <span className="text-[#0F172A]">Value Date</span>
                                         <span className="text-[#0F172A] dark:text-[#1E293B]">{sentTransaction.estimatedArrival.toLocaleDateString()}</span>
                                     </div>
                                     <div className="flex justify-between">
                                         <span className="text-[#0F172A]">Network Type</span>
                                         <span className="text-[#0F172A] dark:text-[#1E293B]">
                                            {formData.transferMethod === 'crypto' 
                                                ? `${formData.cryptoCurrency} Blockchain` 
                                                : (formData.transferType === 'international' ? 'SWIFT Global' : 'FedWire Domestic')
                                            }
                                         </span>
                                     </div>
                                </div>
                                <div className="mt-10 flex gap-4">
                                     <button onClick={onClose} className="flex-1 py-4 bg-white text-[#0F172A] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all transform active:scale-[0.98] dark:bg-slate-800">Exit Flow</button>
                                     <button onClick={() => navigate('/history')} className="flex-1 py-4 bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white font-black uppercase tracking-widest rounded-xl shadow-lg transition-all transform active:scale-[0.98] border border-slate-100 dark:border-white/10">Track Status</button>
                                </div>
                             </div>
                        )}

                    </div>
                    
                    {step < 4 && (
                        <div className="relative z-10 p-8 flex-shrink-0 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-900 ">
                           {step < 3 && (
                                <div className="max-w-lg mx-auto flex justify-between gap-4">
                                    <button onClick={handleBack} disabled={step === 0} className="flex-1 py-4 text-sm font-bold text-[#0F172A] dark:text-white bg-white hover:bg-white border border-slate-100 dark:border-white/10 rounded-xl disabled:opacity-30 transition-all dark:bg-slate-800">Back</button>
                                    <button onClick={handleNext} className="flex-1 py-4 text-sm font-bold text-[#0F172A] dark:text-white bg-primary hover:bg-primary-600 rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98]">Continue</button>
                                </div>
                            )}
                            {step === 3 && (
                                <div className="max-w-lg mx-auto flex justify-between gap-4">
                                    <button onClick={onClose} className="flex-1 py-4 text-sm font-bold text-red-400 bg-red-500 hover:bg-red-500 border border-red-900/30 rounded-xl transition-all">
                                        Abort
                                    </button>
                                    <button 
                                        onClick={handlePreSubmit} 
                                        disabled={isProcessing} 
                                        className="flex-[2] py-4 text-sm font-bold text-[#0F172A] dark:text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-green-900/30 flex items-center justify-center transition-all transform active:scale-[0.98]"
                                    >
                                        <LockClosedIcon className="w-4 h-4 mr-2" />
                                        {isProcessing ? 'Validating Handshake...' : 'Finalize & Transmit'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
