
import React, { useState, useMemo, useEffect } from 'react';
import { SmartyAddressInput, AddressDetails } from './SmartyAddressInput';
import { Country, Recipient } from '../types';
import { ALL_COUNTRIES, BANK_ACCOUNT_CONFIG, COUNTRY_CALLING_CODES, USER_PROFILE } from './constants';
import { db } from '../services/database';
import { getCountryBankingTip } from '../services/geminiService';
import { checkBlzCode } from '../services/bankValidationService';
import { lookupRoutingNumber } from '../services/routingNumberService';
import { 
    UserCircleIcon, 
    HomeIcon, 
    BankIcon, 
    ShieldCheckIcon, 
    CheckCircleIcon, 
    XIcon, 
    SpinnerIcon,
    LockClosedIcon,
    GlobeAmericasIcon,
    BuildingOfficeIcon,
    EnvelopeIcon,
    PhoneIcon,
    ScaleIcon,
    getBankIcon,
    ArrowRightIcon,
    ClipboardDocumentIcon,
    CameraIcon,
    BriefcaseIcon,
    MapPinIcon
} from './Icons';
import { CountrySelector } from './CountrySelector';
import { BankSelector } from './BankSelector';
import { validatePhoneNumber } from '../utils/validation';
import { Stepper, Step } from './Stepper';

import { UserProfile } from '../types';

interface AddRecipientModalProps {
  onClose: () => void;
  onAddRecipient: (data: any) => void;
  recipientToEdit?: Recipient | null;
  onUpdateRecipient?: (recipientId: string, data: any) => void;
  userProfile?: UserProfile;
}

const FLOW_STEPS: Step[] = [
    { label: 'Payee Profile', icon: <UserCircleIcon className="w-5 h-5" /> },
    { label: 'Banking Node', icon: <BankIcon className="w-5 h-5" /> },
    { label: 'Account Data', icon: <LockClosedIcon className="w-5 h-5" /> },
    { label: 'Compliance', icon: <ShieldCheckIcon className="w-5 h-5" /> },
];

export const AddRecipientModal: React.FC<AddRecipientModalProps> = ({ onClose, onAddRecipient, recipientToEdit, onUpdateRecipient, userProfile }) => {
    const isEditMode = !!recipientToEdit;
    const [currentStep, setCurrentStep] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isBankSelectorOpen, setIsBankSelectorOpen] = useState(false);
    const [bankingTip, setBankingTip] = useState<string | null>(null);
    const [payeeType, setPayeeType] = useState<'individual' | 'business'>(recipientToEdit?.payeeType || 'individual');
    
    // System P2P Members Directory Directory Setup
    const [systemUsers, setSystemUsers] = useState<any[]>([]);
    const [selectedDirectoryEmail, setSelectedDirectoryEmail] = useState('');

    useEffect(() => {
        const loadDirectory = async () => {
            try {
                const list = await db.getAllUsers();
                setSystemUsers(list);
            } catch (err) {
                console.error('[AddRecipientModal] Directory Load Error:', err);
            }
        };
        loadDirectory();
    }, []);

    // Validation states
    const [isValidatingBank, setIsValidatingBank] = useState(false);
    const [bankVerified, setBankVerified] = useState(false);

    // Form State initialization
    const [formData, setFormData] = useState({
        firstName: recipientToEdit?.fullName?.split(' ')[0] || '',
        lastName: recipientToEdit?.fullName?.split(' ').slice(1).join(' ') || '',
        businessName: recipientToEdit?.fullName || '',
        nickname: recipientToEdit?.nickname || '',
        email: recipientToEdit?.email || '',
        phone: recipientToEdit?.phone || '',
        country: recipientToEdit?.country || ALL_COUNTRIES.find(c => c.code === 'US')!,
        
        // Address Details
        addressStreet: recipientToEdit?.streetAddress || '',
        addressCity: recipientToEdit?.city || '',
        addressState: recipientToEdit?.stateProvince || '',
        addressZip: recipientToEdit?.postalCode || '',

        // Banking Details
        bankName: recipientToEdit?.bankName || '',
        accountNumber: recipientToEdit?.realDetails?.accountNumber || '',
        confirmAccountNumber: recipientToEdit?.realDetails?.accountNumber || '',
        swiftBic: recipientToEdit?.realDetails?.swiftBic || '',
        routingNumber: recipientToEdit?.country?.code === 'US' ? recipientToEdit?.realDetails?.swiftBic : '',
        accountType: 'Checking',
        category: recipientToEdit?.category || 'Other',
        isFavorite: recipientToEdit?.isFavorite || false,
        intermediaryBank: recipientToEdit?.realDetails?.intermediaryBank || '',
        bankAddress: recipientToEdit?.realDetails?.bankAddress || '',
        
        consentAml: isEditMode,
        consentAccuracy: isEditMode
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const SelectedBankIcon = useMemo(() => {
        if (!formData.bankName) return null;
        return getBankIcon(formData.bankName);
    }, [formData.bankName]);

    const handleSelectDirectoryUser = async (email: string) => {
        setSelectedDirectoryEmail(email);
        if (!email) return;
        const targetUser = systemUsers.find(u => u.email === email);
        if (targetUser) {
            const userAccts = await db.getAccounts(email);
            const checkingAcct = userAccts && userAccts.length > 0 ? userAccts[0] : null;
            const fullAcctNumber = checkingAcct ? (checkingAcct.fullAccountNumber || checkingAcct.accountNumber) : '882938449102';
            
            const origName = targetUser.profile?.name || '';
            const spaceIdx = origName.indexOf(' ');
            let fName = origName;
            let lName = '';
            if (spaceIdx !== -1) {
                fName = origName.substring(0, spaceIdx);
                lName = origName.substring(spaceIdx + 1);
            }
            
            setFormData(prev => ({
                ...prev,
                firstName: fName,
                lastName: lName,
                businessName: origName,
                email: targetUser.email,
                phone: targetUser.profile?.phone || '',
                bankName: 'First Pacific Premium Reserved Bank',
                accountNumber: fullAcctNumber,
                confirmAccountNumber: fullAcctNumber,
                routingNumber: '021000021',
                swiftBic: 'FPBUS33',
                country: ALL_COUNTRIES.find(c => c.code === 'US') || prev.country,
                addressStreet: targetUser.profile?.addressStreet || '123 Wall Street',
                addressCity: targetUser.profile?.addressCity || 'New York',
                addressState: targetUser.profile?.addressState || 'NY',
                addressZip: targetUser.profile?.addressZip || '10005',
                nickname: targetUser.profile?.name ? `${targetUser.profile.name}'s Checking` : ''
            }));
            
            setPayeeType('individual');
        }
    };

    const handleCountryChange = (country: Country) => {
        setFormData(prev => ({
            ...prev,
            country,
            // Reset banking codes when switching jurisdictions to prevent validation mismatch
            routingNumber: country.code === 'US' ? prev.routingNumber : '',
            swiftBic: country.code !== 'US' ? prev.swiftBic : ''
        }));
    };

    const validateStep = () => {
        const newErrors: Record<string, string> = {};
        if (currentStep === 0) {
            if (payeeType === 'individual') {
                if (!formData.firstName.trim()) newErrors.firstName = 'First name is required.';
                if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required.';
            } else {
                if (!formData.businessName.trim()) newErrors.businessName = 'Legal Entity Name is required.';
            }

            if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format.';
            const phoneError = validatePhoneNumber(formData.phone, formData.country.code);
            if (phoneError) newErrors.phone = phoneError;

            if (!formData.addressStreet.trim()) newErrors.addressStreet = 'Street address is required.';
            if (!formData.addressCity.trim()) newErrors.addressCity = 'City is required.';
            if (!formData.addressZip.trim()) newErrors.addressZip = 'Postal code is required.';
        } else if (currentStep === 1) {
             if (!formData.bankName) newErrors.bankName = 'Financial institution name is required.';
             // Relaxing strict requirement here if user will provide code in step 2 to auto-fill
        } else if (currentStep === 2) {
             if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Account identification is required.';
             if (formData.accountNumber !== formData.confirmAccountNumber) newErrors.confirmAccountNumber = 'Account numbers do not match.';
             if (formData.country.code === 'US' && !formData.routingNumber.trim()) newErrors.routingNumber = 'ABA Routing Number is required.';
             if (formData.country.code !== 'US' && !formData.swiftBic.trim()) newErrors.swiftBic = 'SWIFT/BIC or Bank Code is required.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep()) setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
        else onClose();
    };

    const handlePaste = async (field: keyof typeof formData) => {
        try {
            const text = await navigator.clipboard.readText();
            setFormData(prev => ({ ...prev, [field]: text }));
        } catch (err) {
            console.error('Failed to read clipboard', err);
        }
    };

    const handlePhoneBlur = () => {
        if (!formData.phone.trim()) return;
        let val = formData.phone.trim();
        const callingCode = COUNTRY_CALLING_CODES[formData.country.code];
        if (!val.startsWith('+') && callingCode) {
            const digits = val.replace(/\D/g, '');
            val = digits.startsWith(callingCode) ? `+${digits}` : `+${callingCode}${digits}`;
            setFormData(prev => ({ ...prev, phone: val }));
        }
    };
    
    // New handler for BLZ and Routing Number check
    const handleCodeBlur = async () => {
        const code = formData.country.code === 'US' ? formData.routingNumber : formData.swiftBic;
        const countryCode = formData.country.code;
        
        // Only check for DE/AT/CH using the BLZ endpoint if code looks numeric
        if (['DE', 'AT', 'CH'].includes(countryCode) && /^\d+$/.test(code) && code.length >= 5) {
            setIsValidatingBank(true);
            const result = await checkBlzCode(code, countryCode);
            setIsValidatingBank(false);
            
            if (result && result.valid) {
                setBankVerified(true);
                setFormData(prev => ({
                    ...prev,
                    bankName: result.bankName || prev.bankName,
                    addressCity: result.city || prev.addressCity, // Auto-fill city if available
                    swiftBic: result.bic || prev.swiftBic // Auto-fill BIC if returned
                }));
            }
        } else if (countryCode === 'US' && /^\d{9}$/.test(code)) {
            // US Routing Number Lookup
            setIsValidatingBank(true);
            const result = await lookupRoutingNumber(code);
            setIsValidatingBank(false);

            if (result) {
                setBankVerified(true);
                setFormData(prev => ({
                    ...prev,
                    bankName: result.bankName,
                    addressCity: prev.addressCity || result.city || '',
                    addressState: prev.addressState || result.state || '',
                    addressZip: prev.addressZip || result.zip || ''
                }));
            }
        }
    };

    const handleSubmit = async () => {
        if (!formData.consentAccuracy || !formData.consentAml) {
            setErrors({ consent: 'All attestations must be acknowledged.' });
            return;
        }

        setIsProcessing(true);
        setTimeout(() => {
            const fullName = payeeType === 'individual' 
                ? `${formData.firstName} ${formData.lastName}`.trim() 
                : formData.businessName.trim();

            const finalData = {
                ...formData,
                fullName,
                payeeType,
                category: formData.category,
                isFavorite: formData.isFavorite,
                cashPickupEnabled: false,
                streetAddress: formData.addressStreet,
                city: formData.addressCity,
                stateProvince: formData.addressState,
                postalCode: formData.addressZip,
                realDetails: {
                    accountNumber: formData.accountNumber,
                    swiftBic: formData.country.code === 'US' ? formData.routingNumber : formData.swiftBic,
                    intermediaryBank: formData.intermediaryBank,
                    bankAddress: formData.bankAddress
                }
            };
            if (isEditMode && onUpdateRecipient && recipientToEdit) {
                onUpdateRecipient(recipientToEdit.id, finalData);
            } else {
                onAddRecipient(finalData);
            }
            setIsProcessing(false);
            onClose();
        }, 2000);
    };

    useEffect(() => {
        if (currentStep === 1 && formData.country) {
            getCountryBankingTip(formData.country.name).then(res => setBankingTip(res.tip));
        }
    }, [currentStep, formData.country]);

    const InputGroup = ({ label, name, placeholder, type = "text", error, required, icon: Icon, onBlur, enablePaste, subLabel, inputMode, autoComplete }: any) => {
        const resolvedInputMode = inputMode || (
            name === 'email' ? 'email' :
            name === 'phone' ? 'tel' :
            ['accountNumber', 'confirmAccountNumber', 'routingNumber', 'bsb', 'sortCode', 'transitNumber', 'institutionNumber', 'clearingCode', 'clabe', 'blz', 'postalCode', 'addressZip'].includes(name) ? 'numeric' :
            type === 'number' ? 'decimal' :
            'text'
        );
        const resolvedAutoComplete = autoComplete || (
            name === 'email' ? 'email' :
            name === 'phone' ? 'tel' :
            name === 'firstName' ? 'given-name' :
            name === 'lastName' ? 'family-name' :
            name === 'businessName' ? 'organization' :
            name === 'addressStreet' ? 'street-address' :
            name === 'addressCity' ? 'address-level2' :
            name === 'addressState' ? 'address-level1' :
            name === 'addressZip' ? 'postal-code' :
            'off'
        );

        return (
            <div className="space-y-1.5 w-full">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1 flex items-center gap-1.5">
                        {Icon && <Icon className="w-3 h-3 text-[#0F172A] dark:text-white"/>}
                        {label} {required && <span className="text-red-500">*</span>}
                    </label>
                    {subLabel && <span className="text-[9px] text-green-500 font-bold uppercase tracking-wider">{subLabel}</span>}
                </div>
                <div className="relative group">
                    <input 
                        type={type}
                        inputMode={resolvedInputMode}
                        autoComplete={resolvedAutoComplete}
                        value={(formData as any)[name]}
                        onChange={e => {
                            setFormData({...formData, [name]: e.target.value});
                            if (errors[name]) setErrors(prev => ({...prev, [name]: ''}));
                        }}
                        onBlur={onBlur}
                        placeholder={placeholder}
                        className={`w-full bg-white dark:bg-slate-900 border ${error ? 'border-red-500' : 'border-slate-200 dark:border-white/10'} text-[#0F172A] dark:text-white p-4 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-mono text-sm shadow-sm pr-10`}
                    />
                    {enablePaste && !(formData as any)[name] && (
                        <button 
                            type="button"
                            onClick={() => handlePaste(name)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0F172A] dark:text-white hover:text-primary transition-colors p-1"
                            title="Paste from clipboard"
                        >
                            <ClipboardDocumentIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
                {error && <p className="text-[10px] text-red-500 font-bold ml-1">{error}</p>}
            </div>
        );
    };

    const isBlzRegion = ['DE', 'AT', 'CH'].includes(formData.country.code);
    const isUsRegion = formData.country.code === 'US';

    return (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-800  flex items-center justify-center p-4 animate-fade-in z-[100]">
            <div className="bg-slate-50 dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[95vh] animate-fade-in-up">
                
                <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <ShieldCheckIcon className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-black text-[#0F172A] dark:text-white tracking-tight">
                            {isEditMode ? 'Update Payee Node' : 'Register New Payee'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:hover:text-[#0F172A] dark:text-white transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 bg-slate-100 dark:bg-slate-800">
                    <Stepper steps={FLOW_STEPS} currentStep={currentStep} />
                </div>

                <div className="flex-grow overflow-y-auto p-8 custom-scrollbar text-[#1E293B] dark:text-slate-100">
                    {currentStep === 0 && (
                        <div className="space-y-8 animate-fade-in">
                            {systemUsers.length > 0 && !isEditMode && (
                                <div className="space-y-2 p-4 primary- dark:primary- rounded-2xl border primary-">
                                    <label className="text-[10px] font-black primary- dark:primary- uppercase tracking-widest pl-1 block">
                                        🔗 Link to Premium Reserved Bank Representative or Partner
                                    </label>
                                    <select
                                        value={selectedDirectoryEmail}
                                        onChange={e => handleSelectDirectoryUser(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-3.5 rounded-xl font-bold text-sm shadow-sm outline-none focus:ring-2 focus:primary-"
                                    >
                                        <option value="">-- Choose target account holder to auto-fill --</option>
                                        {systemUsers.map(u => (
                                            u.email.toLowerCase().trim() !== (userProfile?.email || USER_PROFILE?.email)?.toLowerCase()?.trim() && (
                                                <option key={u.id} value={u.email}>
                                                    {u.profile?.name || 'Authorized Lead Member'} ({u.email})
                                                </option>
                                            )
                                        ))}
                                    </select>
                                    <p className="text-[9px] text-[#0F172A] dark:text-white font-bold uppercase tracking-wider pl-1">
                                        Selecting an active bank user automatically establishes a direct ledger-to-ledger path.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">Payee Type</label>
                                <div className="flex p-1 bg-slate-200 dark:bg-slate-900 rounded-xl">
                                    <button 
                                        onClick={() => setPayeeType('individual')}
                                        className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${payeeType === 'individual' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-[#0F172A]'}`}
                                    >
                                        Individual
                                    </button>
                                    <button 
                                        onClick={() => setPayeeType('business')}
                                        className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${payeeType === 'business' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-[#0F172A]'}`}
                                    >
                                        Business Entity
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">Jurisdiction</label>
                                <CountrySelector 
                                    selectedCountry={formData.country} 
                                    onSelect={handleCountryChange} 
                                    className="w-full flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-4 rounded-xl font-bold shadow-sm" 
                                />
                            </div>

                            {payeeType === 'individual' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputGroup label="First Name" name="firstName" placeholder="Given Name" error={errors.firstName} required icon={UserCircleIcon} />
                                    <InputGroup label="Last Name" name="lastName" placeholder="Family Name" error={errors.lastName} required icon={UserCircleIcon} />
                                </div>
                            ) : (
                                <InputGroup label="Registered Business Name" name="businessName" placeholder="Legal Entity Name" error={errors.businessName} required icon={BriefcaseIcon} />
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputGroup label="Email Address" name="email" type="email" placeholder="payee@example.com" error={errors.email} icon={EnvelopeIcon} />
                                <InputGroup label="Mobile Number" name="phone" type="tel" placeholder="+1..." error={errors.phone} icon={PhoneIcon} onBlur={handlePhoneBlur} />
                            </div>

                            <div className="pt-6 border-t border-slate-200 dark:border-white/10">
                                <h4 className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <MapPinIcon className="w-4 h-4"/> Physical Address
                                </h4>
                                <div className="space-y-4">
                                    <SmartyAddressInput
         label="Street Address"
         name="addressStreet"
         placeholder="123 Financial Ave"
         error={errors.addressStreet}
         required
         countryIso3={formData.country as unknown as string}
         value={formData.addressStreet}
         onChange={(e) => {
             setFormData({...formData, addressStreet: e.target.value});
             if (errors.addressStreet) setErrors(prev => ({...prev, addressStreet: ''}));
         }}
         onAddressSelect={(details: AddressDetails) => {
             setFormData(prev => ({
                 ...prev,
                 addressStreet: details.street,
                 addressCity: details.city,
                 addressState: details.state,
                 addressZip: details.zip
             }));
             setErrors(prev => ({...prev, addressStreet: '', addressCity: '', addressState: '', addressZip: ''}));
         }}
     />
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputGroup label="City" name="addressCity" placeholder="City" error={errors.addressCity} required />
                                        <InputGroup label="State / Region" name="addressState" placeholder="Region" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputGroup label="Postal / ZIP" name="addressZip" placeholder="Code" error={errors.addressZip} required />
                                        <InputGroup label="Alias (Optional)" name="nickname" placeholder="e.g. Consultant" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">Category</label>
                                            <select 
                                                value={formData.category}
                                                onChange={e => setFormData({...formData, category: e.target.value})}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-4 rounded-xl font-bold shadow-sm outline-none focus:ring-2 focus:ring-primary"
                                            >
                                                <option value="Family">Family</option>
                                                <option value="Friends">Friends</option>
                                                <option value="Business">Business</option>
                                                <option value="International">International</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-3 pt-6">
                                            <button 
                                                type="button"
                                                onClick={() => setFormData({...formData, isFavorite: !formData.isFavorite})}
                                                className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${formData.isFavorite ? 'bg-amber-500 border-amber-500/30 text-amber-600' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-white/10 text-[#0F172A]'}`}
                                            >
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${formData.isFavorite ? 'bg-amber-500 border-amber-500' : 'border-slate-400'}`}>
                                                    {formData.isFavorite && <CheckCircleIcon className="w-3 h-3 text-[#0F172A] dark:text-white" />}
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest">Mark as Favorite</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">Financial Institution</label>
                                <div className="relative">
                                    <input 
                                        type="text" readOnly onClick={() => setIsBankSelectorOpen(true)} value={formData.bankName}
                                        placeholder="Select Bank..."
                                        className={`w-full bg-white dark:bg-slate-900 border ${errors.bankName ? 'border-red-500' : 'border-slate-200 dark:border-white/10'} text-[#0F172A] dark:text-white p-4 rounded-xl cursor-pointer font-bold pl-12 shadow-sm`}
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center">
                                        {SelectedBankIcon ? <SelectedBankIcon className="w-full h-full object-contain" /> : <BuildingOfficeIcon className="w-5 h-5 text-[#0F172A] dark:text-white" />}
                                    </div>
                                </div>
                                {errors.bankName && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.bankName}</p>}
                            </div>

                            <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                                {formData.country.code === 'US' ? (
                                    <InputGroup label="ABA Routing Number" name="routingNumber" placeholder="9-digit electronic routing" error={errors.routingNumber} required icon={ArrowRightIcon} enablePaste onBlur={handleCodeBlur} subLabel={bankVerified ? "Verified" : ""}/>
                                ) : (
                                    <InputGroup label="SWIFT / BIC Code" name="swiftBic" placeholder="8-11 char bank identifier" error={errors.swiftBic} required icon={GlobeAmericasIcon} enablePaste onBlur={handleCodeBlur} subLabel={bankVerified ? "Verified" : ""}/>
                                )}
                            </div>
                             
                             {isValidatingBank && (
                                <div className="flex items-center gap-2 text-primary text-xs font-bold animate-pulse mt-2">
                                    <SpinnerIcon className="w-4 h-4 animate-spin" /> Verifying Bank Identifier...
                                </div>
                            )}

                            {bankingTip && (
                                <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex gap-3 items-start shadow-sm">
                                    <GlobeAmericasIcon className="w-5 h-5 text-primary flex-shrink-0" />
                                    <p className="text-xs text-[#0F172A] dark:text-white leading-relaxed"><span className="text-primary font-black uppercase mr-1">Network Insight:</span> {bankingTip}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <InputGroup label="Account Number / IBAN" name="accountNumber" placeholder="Enter full account number" error={errors.accountNumber} required icon={LockClosedIcon} enablePaste />
                            <InputGroup label="Confirm Account Number" name="confirmAccountNumber" placeholder="Re-enter to verify" error={errors.confirmAccountNumber} required icon={CheckCircleIcon} enablePaste />
                            
                            <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-4">
                                <h4 className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-2">International Routing (Optional)</h4>
                                <InputGroup label="Intermediary Bank" name="intermediaryBank" placeholder="e.g. JPMorgan Chase" icon={BuildingOfficeIcon} />
                                <InputGroup label="Bank Address" name="bankAddress" placeholder="e.g. 270 Park Ave, New York" icon={MapPinIcon} />
                            </div>

                             {(isBlzRegion || isUsRegion) && (
                                <div className="relative">
                                    <div className="flex justify-between">
                                        <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">Bank Identifier Check</p>
                                        {bankVerified && <span className="text-[9px] text-green-500 font-bold uppercase tracking-wider">Verified</span>}
                                    </div>
                                    <div className="bg-slate-200 dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-white/10 mt-1">
                                        <div className="flex items-center gap-3">
                                             <BankIcon className="w-5 h-5 text-[#0F172A] dark:text-white" />
                                             <div className="flex-1">
                                                 <p className="text-xs font-bold text-[#0F172A] dark:text-white">{formData.bankName || 'Pending Identification...'}</p>
                                                 <p className="text-[10px] text-[#0F172A]">{formData.country.code === 'US' ? `Routing: ${formData.routingNumber}` : `Code: ${formData.swiftBic}`}</p>
                                             </div>
                                             {isValidatingBank && <SpinnerIcon className="w-4 h-4 text-primary animate-spin" />}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button className="flex-1 py-3 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10 hover:border-primary/50 transition-all text-sm font-bold text-[#0F172A] dark:text-white">
                                    <CameraIcon className="w-4 h-4" /> Scan Card
                                </button>
                                <div className="flex-1 space-y-1.5">
                                    <select 
                                        value={formData.accountType}
                                        onChange={e => setFormData({...formData, accountType: e.target.value})}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-sm h-full"
                                    >
                                        <option>Checking</option>
                                        <option>Savings</option>
                                        <option>Business</option>
                                    </select>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10 space-y-2">
                                <div className="flex items-center gap-2">
                                    <ShieldCheckIcon className="w-4 h-4 text-primary" />
                                    <h4 className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest">Network Integrity Audit</h4>
                                </div>
                                <p className="text-[10px] text-[#0F172A] leading-relaxed">System will perform an asynchronous handshake with the receiving node to verify compliance.</p>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-8 animate-fade-in text-center">
                            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                                <ScaleIcon className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#0F172A] dark:text-white">Compliance Audit</h3>
                                <p className="text-[#0F172A] text-sm mt-1">Review regulatory attestations.</p>
                            </div>

                            <div className="space-y-3 text-left">
                                <label className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl cursor-pointer hover:border-primary/30 transition-all">
                                    <input type="checkbox" checked={formData.consentAccuracy} onChange={e => setFormData({...formData, consentAccuracy: e.target.checked})} className="mt-1 w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary" />
                                    <div className="text-xs">
                                        <p className="font-bold text-[#1E293B] dark:text-slate-100 uppercase tracking-tighter">Data Integrity Protocol</p>
                                        <p className="text-[#0F172A] mt-0.5">I certify that all provided details are accurate for ledger settlement.</p>
                                    </div>
                                </label>
                                <label className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl cursor-pointer hover:border-primary/30 transition-all">
                                    <input type="checkbox" checked={formData.consentAml} onChange={e => setFormData({...formData, consentAml: e.target.checked})} className="mt-1 w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary" />
                                    <div className="text-xs">
                                        <p className="font-bold text-[#1E293B] dark:text-slate-100 uppercase tracking-tighter">FinCEN Global Accord</p>
                                        <p className="text-[#0F172A] mt-0.5">I confirm this relationship complies with international AML standards.</p>
                                    </div>
                                </label>
                            </div>
                            {errors.consent && <p className="text-xs text-red-500 font-bold animate-pulse">{errors.consent}</p>}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 flex justify-between items-center flex-shrink-0">
                    <button onClick={handleBack} className="px-6 py-3 text-sm font-bold text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:hover:text-[#0F172A] dark:text-white transition-colors">
                        {currentStep === 0 ? 'Cancel' : 'Back'}
                    </button>
                    <div className="flex gap-3">
                        {currentStep < 3 ? (
                            <button onClick={handleNext} className="px-8 py-3 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white rounded-xl font-bold shadow-lg transition-all flex items-center gap-2">
                                <span>Continue</span>
                                <ArrowRightIcon className="w-4 h-4" />
                            </button>
                        ) : (
                            <button onClick={handleSubmit} disabled={isProcessing} className="px-8 py-3 bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 text-[#0F172A] dark:text-white dark:text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2">
                                {isProcessing ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <ShieldCheckIcon className="w-4 h-4" />}
                                <span>{isEditMode ? 'Update' : 'Register'} Node</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isBankSelectorOpen && (
                <BankSelector 
                    countryCode={formData.country.code} 
                    onSelect={name => setFormData({...formData, bankName: name})} 
                    onClose={() => setIsBankSelectorOpen(false)} 
                />
            )}
        </div>
    );
};
