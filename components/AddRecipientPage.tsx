
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Country } from '../types';
import { ALL_COUNTRIES, COUNTRY_CALLING_CODES } from './constants';
import { 
    UserCircleIcon, 
    BankIcon, 
    ShieldCheckIcon, 
    CheckCircleIcon, 
    ArrowLeftIcon, 
    ArrowRightIcon, 
    SpinnerIcon,
    LockClosedIcon,
    GlobeAmericasIcon,
    BuildingOfficeIcon,
    EnvelopeIcon,
    PhoneIcon,
    ScaleIcon,
    getBankIcon,
    MapPinIcon,
    BriefcaseIcon,
    ClipboardDocumentIcon
} from './Icons';
import { CountrySelector } from './CountrySelector';
import { BankSelector } from './BankSelector';
import { validatePhoneNumber } from '../utils/validation';
import { getCountryBankingTip } from '../services/geminiService';
import { Stepper, Step } from './Stepper';

interface AddRecipientPageProps {
    onAdd: (data: any) => void;
}

const FLOW_STEPS: Step[] = [
    { label: 'Identity', icon: <UserCircleIcon className="w-5 h-5" /> },
    { label: 'Institution', icon: <BuildingOfficeIcon className="w-5 h-5" /> },
    { label: 'Account', icon: <LockClosedIcon className="w-5 h-5" /> },
    { label: 'Verification', icon: <ShieldCheckIcon className="w-5 h-5" /> },
];

export const AddRecipientPage: React.FC<AddRecipientPageProps> = ({ onAdd }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const initialBankName = location.state?.bankName || '';
    const initialCountry = location.state?.country || ALL_COUNTRIES.find(c => c.code === 'US')!;

    const [currentStep, setCurrentStep] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isBankSelectorOpen, setIsBankSelectorOpen] = useState(false);
    const [bankingTip, setBankingTip] = useState<string | null>(null);
    const [payeeType, setPayeeType] = useState<'individual' | 'business'>('individual');

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        businessName: '',
        email: '',
        phone: '',
        country: initialCountry,
        
        // Address
        addressStreet: '',
        addressCity: '',
        addressState: '',
        addressZip: '',
        nickname: '',
        category: 'Other',
        isFavorite: false,

        // Banking
        bankName: initialBankName,
        bankAddress: '',
        intermediaryBank: '',
        accountNumber: '',
        confirmAccountNumber: '',
        swiftBic: '',
        routingNumber: '',
        accountType: 'Checking',
        
        consentAml: false,
        consentAccuracy: false
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Dynamic Bank Icon
    const SelectedBankIcon = useMemo(() => {
        if (!formData.bankName) return null;
        return getBankIcon(formData.bankName);
    }, [formData.bankName]);

    // Handle Country Switch - Resets incompatible fields
    const handleCountryChange = (country: Country) => {
        setFormData(prev => ({
            ...prev,
            country,
            // Reset banking codes when switching jurisdictions to prevent validation mismatch
            routingNumber: country.code === 'US' ? prev.routingNumber : '',
            swiftBic: country.code !== 'US' ? prev.swiftBic : ''
        }));
    };

    const handleNext = () => {
        if (validateStep()) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        if (currentStep === 0) {
            navigate('/recipients');
        } else {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handlePaste = async (field: keyof typeof formData) => {
        try {
            const text = await navigator.clipboard.readText();
            setFormData(prev => ({ ...prev, [field]: text }));
        } catch (err) {
            console.error('Failed to read clipboard', err);
        }
    };

    const validateStep = () => {
        const newErrors: Record<string, string> = {};
        if (currentStep === 0) {
            if (payeeType === 'individual') {
                if (!formData.firstName.trim()) newErrors.firstName = 'First name is required.';
                if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required.';
            } else {
                if (!formData.businessName.trim()) newErrors.businessName = 'Entity Name is required.';
            }

            if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format.';
            
            const phoneError = validatePhoneNumber(formData.phone, formData.country.code);
            if (phoneError) newErrors.phone = phoneError;

            if (!formData.addressStreet.trim()) newErrors.addressStreet = 'Address is required.';
            if (!formData.addressCity.trim()) newErrors.addressCity = 'City is required.';
            if (!formData.addressZip.trim()) newErrors.addressZip = 'Postal code is required.';
        } else if (currentStep === 1) {
            if (!formData.bankName) newErrors.bankName = 'Financial institution name is required.';
        } else if (currentStep === 2) {
            if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Account identification is required.';
            if (formData.accountNumber !== formData.confirmAccountNumber) newErrors.confirmAccountNumber = 'Account numbers do not match.';
            
            // Dynamic Validation based on Country
            if (formData.country.code === 'US') {
                if (!formData.routingNumber.trim()) newErrors.routingNumber = 'ABA Routing Number is required for US banks.';
                else if (!/^\d{9}$/.test(formData.routingNumber.trim())) newErrors.routingNumber = 'Routing Number must be 9 digits.';
            } else {
                if (!formData.swiftBic.trim()) newErrors.swiftBic = 'SWIFT/BIC Code is required for international banks.';
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
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
            onAdd(finalData);
            setIsProcessing(false);
            navigate('/recipients');
        }, 2500);
    };

    useEffect(() => {
        if (currentStep === 1 && formData.country) {
            getCountryBankingTip(formData.country.name).then(res => setBankingTip(res.tip));
        }
    }, [currentStep, formData.country]);

    const InputGroup = ({ label, name, placeholder, type = "text", error, required, icon: Icon, onBlur, enablePaste, subLabel }: any) => (
        <div className="space-y-1.5 w-full">
            <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest pl-1 flex items-center gap-1.5">
                    {Icon && <Icon className="w-3 h-3 text-[#0F172A] dark:text-white"/>}
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                {subLabel && <span className="text-[9px] text-green-500 font-bold uppercase tracking-wider">{subLabel}</span>}
            </div>
            <div className="relative group">
                <input 
                    type={type}
                    value={(formData as any)[name]}
                    onChange={e => {
                        setFormData({...formData, [name]: e.target.value});
                        if (errors[name]) setErrors(prev => ({...prev, [name]: ''}));
                    }}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    className={`w-full bg-white dark:bg-slate-900 border ${error ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-slate-200 dark:border-white/10'} text-[#0F172A] dark:text-white p-4 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-700 font-bold font-mono text-sm shadow-sm pr-10`}
                />
                {enablePaste && !(formData as any)[name] && (
                    <button 
                        onClick={() => handlePaste(name)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0F172A] dark:text-white hover:text-primary transition-colors p-1"
                        title="Paste from clipboard"
                    >
                        <ClipboardDocumentIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
            {error && <p className="text-[10px] text-red-500 font-bold ml-1 animate-pulse">{error}</p>}
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-800 text-[#0F172A] dark:text-[#1E293B] pb-20">
            {/* Immersive Modern Bank Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-[0.12] mix-blend-overlay grayscale"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2940&auto=format&fit=crop')" }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-50 dark:from-slate-950 via-transparent to-slate-50 dark:to-slate-950"></div>
            </div>

            <div className="relative z-10 max-w-3xl mx-auto pt-10 px-6">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={handleBack} className="p-3 bg-white dark:bg-slate-900 rounded-full shadow-lg border border-slate-200 dark:border-white/10 text-[#0F172A] hover:text-[#0F172A] dark:hover:text-[#0F172A] dark:text-white transition-all hover:scale-105">
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tight">New Beneficiary</h1>
                        <p className="text-[#0F172A] text-sm font-bold">Add a trusted node to your settlement network.</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900  rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-900">
                        <Stepper steps={FLOW_STEPS} currentStep={currentStep} />
                    </div>

                    <div className="p-10 min-h-[400px]">
                        {currentStep === 0 && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">Payee Type</label>
                                    <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                                        <button 
                                            onClick={() => setPayeeType('individual')}
                                            className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${payeeType === 'individual' ? 'bg-white dark:bg-slate-700 shadow-md text-primary' : 'text-[#0F172A]'}`}
                                        >
                                            Individual
                                        </button>
                                        <button 
                                            onClick={() => setPayeeType('business')}
                                            className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${payeeType === 'business' ? 'bg-white dark:bg-slate-700 shadow-md text-primary' : 'text-[#0F172A]'}`}
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
                                        <InputGroup label="Street Address" name="addressStreet" placeholder="123 Financial Ave" error={errors.addressStreet} required />
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
                            <div className="space-y-8 animate-fade-in">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">Financial Institution</label>
                                    <div className="relative">
                                        <input 
                                            type="text" readOnly onClick={() => setIsBankSelectorOpen(true)} value={formData.bankName}
                                            placeholder="Select Bank..."
                                            className={`w-full bg-white dark:bg-slate-900 border ${errors.bankName ? 'border-red-500' : 'border-slate-200 dark:border-white/10'} text-[#0F172A] dark:text-white p-4 rounded-xl cursor-pointer font-bold pl-12 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-white dark:bg-slate-900`}
                                        />
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center">
                                            {SelectedBankIcon ? <SelectedBankIcon className="w-full h-full object-contain" /> : <BuildingOfficeIcon className="w-5 h-5 text-[#0F172A] dark:text-white" />}
                                        </div>
                                    </div>
                                    {errors.bankName && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.bankName}</p>}
                                </div>

                                <InputGroup label="Bank Address (Optional)" name="bankAddress" placeholder="Street, City, Country" icon={MapPinIcon} />

                                {bankingTip && (
                                    <div className="primary- dark:bg-primary/10 border primary- dark:border-primary/20 p-6 rounded-2xl flex gap-4 items-start shadow-sm">
                                        <GlobeAmericasIcon className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <h4 className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-wider">Network Insight</h4>
                                            <p className="text-xs text-[#0F172A] dark:text-white leading-relaxed">{bankingTip}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 mb-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        {SelectedBankIcon && <div className="w-8 h-8 rounded bg-white p-1 dark:bg-slate-800"><SelectedBankIcon className="w-full h-full object-contain"/></div>}
                                        <div>
                                            <p className="font-bold text-[#0F172A] dark:text-white">{formData.bankName}</p>
                                            <p className="text-[10px] text-[#0F172A] uppercase tracking-widest">{formData.country.name} Node</p>
                                        </div>
                                    </div>
                                </div>

                                <InputGroup label="Account Number / IBAN" name="accountNumber" placeholder="Enter full account number" error={errors.accountNumber} required icon={LockClosedIcon} enablePaste />
                                <InputGroup label="Confirm Account Number" name="confirmAccountNumber" placeholder="Re-enter to verify" error={errors.confirmAccountNumber} required icon={CheckCircleIcon} enablePaste />
                                
                                <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-4">
                                    {formData.country.code === 'US' ? (
                                        <InputGroup label="ABA Routing Number" name="routingNumber" placeholder="9-digit electronic routing" error={errors.routingNumber} required icon={ArrowRightIcon} enablePaste />
                                    ) : (
                                        <>
                                            <InputGroup label="SWIFT / BIC Code" name="swiftBic" placeholder="8-11 char bank identifier" error={errors.swiftBic} required icon={GlobeAmericasIcon} enablePaste />
                                            <InputGroup label="Intermediary Bank (Optional)" name="intermediaryBank" placeholder="SWIFT/BIC or Name" icon={BuildingOfficeIcon} />
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-8 animate-fade-in text-center">
                                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-xl shadow-emerald-500/10">
                                    <ScaleIcon className="w-10 h-10 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tight">Compliance Audit</h3>
                                    <p className="text-[#0F172A] text-sm mt-2 max-w-sm mx-auto">Review regulatory attestations for this node addition.</p>
                                </div>

                                <div className="space-y-4 text-left bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/10">
                                    <label className="flex items-start gap-4 cursor-pointer hover:opacity-80 transition-opacity">
                                        <input type="checkbox" checked={formData.consentAccuracy} onChange={e => setFormData({...formData, consentAccuracy: e.target.checked})} className="mt-1 w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary" />
                                        <div className="text-xs">
                                            <p className="font-bold text-[#1E293B] dark:text-slate-100 uppercase tracking-tighter">Data Integrity Protocol</p>
                                            <p className="text-[#0F172A] mt-1 leading-relaxed">I certify that all provided details are accurate for ledger settlement and accept liability for misrouted funds due to errors.</p>
                                        </div>
                                    </label>
                                    <div className="h-px bg-slate-200 dark:bg-slate-900 w-full"></div>
                                    <label className="flex items-start gap-4 cursor-pointer hover:opacity-80 transition-opacity">
                                        <input type="checkbox" checked={formData.consentAml} onChange={e => setFormData({...formData, consentAml: e.target.checked})} className="mt-1 w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary" />
                                        <div className="text-xs">
                                            <p className="font-bold text-[#1E293B] dark:text-slate-100 uppercase tracking-tighter">FinCEN Global Accord</p>
                                            <p className="text-[#0F172A] mt-1 leading-relaxed">I confirm this relationship complies with international AML standards and the beneficiary is not a sanctioned entity.</p>
                                        </div>
                                    </label>
                                </div>
                                {errors.consent && <p className="text-xs text-red-500 font-bold animate-pulse">{errors.consent}</p>}
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-8 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                        <button onClick={handleBack} className="px-6 py-3 text-sm font-bold text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:hover:text-[#0F172A] dark:text-white transition-colors bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 hover:border-slate-300">
                            {currentStep === 0 ? 'Cancel' : 'Return'}
                        </button>
                        {currentStep < 3 ? (
                            <button onClick={handleNext} className="px-8 py-3 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2 transform active:scale-[0.98]">
                                <span>Continue</span>
                                <ArrowRightIcon className="w-4 h-4" />
                            </button>
                        ) : (
                            <button onClick={handleSubmit} disabled={isProcessing} className="px-10 py-4 bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 text-[#0F172A] dark:text-white dark:text-white font-black uppercase tracking-widest rounded-xl shadow-xl transition-all flex items-center gap-3 transform active:scale-[0.98]">
                                {isProcessing ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <ShieldCheckIcon className="w-4 h-4" />}
                                <span>{isProcessing ? 'Verifying...' : 'Initialize Node'}</span>
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
