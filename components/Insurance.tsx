
import React, { useState, useEffect } from 'react';
import { InsuranceProduct, NotificationType } from '../types';
import { 
    ShieldCheckIcon, 
    GlobeAltIcon, 
    DevicePhoneMobileIcon, 
    SpinnerIcon, 
    InfoIcon, 
    CheckCircleIcon, 
    LockClosedIcon, 
    ArrowRightIcon, 
    ExclamationTriangleIcon, 
    DocumentCheckIcon,
    PhoneIcon,
    PremiumReservedBankLogo,
    XIcon,
    MapPinIcon,
    CameraIcon,
    CalendarDaysIcon,
    CurrencyDollarIcon,
    ClockIcon
} from './Icons';

// --- Types for the Enhanced UI ---
interface EnrichedPolicy {
    id: string;
    title: string;
    subtitle: string;
    coverageAmount: string;
    deductible: string;
    monthlyPremium: number;
    status: 'Active' | 'Pending' | 'Eligible';
    image: string;
    icon: React.ReactNode;
    features: string[];
    partner: string;
}

const INITIAL_POLICIES: EnrichedPolicy[] = [
    {
        id: 'pol_travel',
        title: 'Sovereign Travel Shield',
        subtitle: 'Global Medical & Evacuation',
        coverageAmount: '$5,000,000 USD',
        deductible: '$0.00',
        monthlyPremium: 85.00,
        status: 'Active',
        image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2948&auto=format&fit=crop',
        icon: <GlobeAltIcon className="w-6 h-6 text-[#0F172A] dark:text-white" />,
        features: ['Private Jet Evacuation', 'Trip Cancellation (Any Reason)', 'Lost Luggage Concierge'],
        partner: 'AXA Global'
    },
    {
        id: 'pol_cyber',
        title: 'Cyber-Vault Assurance',
        subtitle: 'Wire Fraud & Identity Theft',
        coverageAmount: '$1,000,000 USD',
        deductible: '$500.00',
        monthlyPremium: 120.00,
        status: 'Active',
        image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=2940&auto=format&fit=crop',
        icon: <LockClosedIcon className="w-6 h-6 text-[#0F172A] dark:text-white" />,
        features: ['Unauthorized Wire Reversal', 'Legal Defense Costs', 'Dark Web Monitoring'],
        partner: 'Chubb Cyber'
    },
    {
        id: 'pol_device',
        title: 'Purchase Protection Elite',
        subtitle: 'Luxury Goods & Electronics',
        coverageAmount: '$50,000 / Claim',
        deductible: '$100.00',
        monthlyPremium: 45.00,
        status: 'Eligible',
        image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=3002&auto=format&fit=crop',
        icon: <DevicePhoneMobileIcon className="w-6 h-6 text-[#0F172A] dark:text-white" />,
        features: ['120-Day Accident Protection', 'Extended Warranty (+2 Years)', 'Porch Piracy Cover'],
        partner: 'Asurion Black'
    }
];

// --- MODALS ---

const EmergencySOSModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [status, setStatus] = useState<'connecting' | 'connected'>('connecting');

    useEffect(() => {
        const timer = setTimeout(() => setStatus('connected'), 3500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-red-950  animate-pulse-slow"></div>
            <div className="relative bg-slate-100 border border-red-500/50 w-full max-w-md rounded-[3rem] p-8 text-center shadow-[0_0_100px_rgba(220,38,38,0.5)] overflow-hidden">
                
                {status === 'connecting' ? (
                    <>
                        <div className="w-32 h-32 mx-auto mb-8 relative">
                            <div className="absolute inset-0 border-4 border-red-600 rounded-full animate-ping"></div>
                            <div className="absolute inset-0 border-4 border-red-600 rounded-full animate-ping delay-300"></div>
                            <div className="absolute inset-0 flex items-center justify-center bg-red-600 rounded-full">
                                <PhoneIcon className="w-12 h-12 text-[#0F172A] dark:text-white animate-bounce" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-black text-[#0F172A] dark:text-white uppercase tracking-tighter mb-2">Priority Distress Signal</h2>
                        <p className="text-red-400 font-mono text-sm tracking-widest">LOCATING NEAREST RESPONSE NODE...</p>
                    </>
                ) : (
                    <div className="animate-fade-in-up">
                        <div className="w-24 h-24 mx-auto mb-6 bg-white rounded-full flex items-center justify-center dark:bg-slate-800">
                            <CheckCircleIcon className="w-12 h-12 text-red-600" />
                        </div>
                        <h2 className="text-3xl font-black text-[#0F172A] dark:text-white uppercase tracking-tighter mb-2">Agent Connected</h2>
                        <div className="bg-red-900 border border-red-500/30 p-6 rounded-2xl mb-6">
                            <p className="text-[#0F172A] dark:text-white font-bold text-lg">Agent: Michael S.</p>
                            <p className="text-red-300 text-sm">Clearance Level: Alpha-1</p>
                            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-mono text-[#0F172A] dark:text-white/70">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                VOICE_CHANNEL_SECURE
                            </div>
                        </div>
                        <button onClick={onClose} className="w-full py-4 bg-red-600 hover:bg-red-700 text-[#0F172A] dark:text-white font-black uppercase tracking-widest rounded-2xl">End Secure Call</button>
                    </div>
                )}
                
                <button onClick={onClose} className="absolute top-6 right-6 text-red-500 hover:text-[#0F172A] dark:text-white"><XIcon className="w-6 h-6"/></button>
            </div>
        </div>
    );
};

const FileClaimModal: React.FC<{ onClose: () => void; onAddClaim: (claim: any) => void }> = ({ onClose, onAddClaim }) => {
    const [step, setStep] = useState<'form' | 'upload' | 'success'>('form');
    const [type, setType] = useState('Medical');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [claimId, setClaimId] = useState('');

    const handleSubmit = () => {
        const newId = `CLM-${Math.floor(Math.random()*100000)}`;
        setClaimId(newId);
        
        onAddClaim({
            id: newId,
            type: type,
            date: date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            status: 'Pending',
            amount: amount ? `$${parseFloat(amount).toFixed(2)}` : '$0.00'
        });
        
        setStep('success');
    };
    
    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-100  animate-fade-in">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white dark:bg-slate-800">
                    <h3 className="text-xl font-black text-[#0F172A] dark:text-white tracking-tight uppercase">New Claim Dossier</h3>
                    <button onClick={onClose}><XIcon className="w-6 h-6 text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white"/></button>
                </div>
                
                <div className="p-8 overflow-y-auto">
                    {step === 'form' && (
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-[#0F172A] uppercase tracking-widest mb-2 block">Incident Category</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Medical', 'Travel Delay', 'Theft', 'Damage'].map(t => (
                                        <button 
                                            key={t}
                                            onClick={() => setType(t)}
                                            className={`py-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${type === t ? 'bg-primary text-[#0F172A] dark:text-white border-primary' : 'bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white border-transparent hover:bg-slate-100 dark:bg-slate-700'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-[#0F172A] uppercase tracking-widest mb-2 block">Date</label>
                                    <div className="relative">
                                        <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0F172A]" />
                                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-10 text-[#0F172A] dark:text-white text-sm focus:border-primary outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#0F172A] uppercase tracking-widest mb-2 block">Est. Amount</label>
                                    <div className="relative">
                                        <CurrencyDollarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0F172A]" />
                                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-10 text-[#0F172A] dark:text-white text-sm focus:border-primary outline-none" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[#0F172A] uppercase tracking-widest mb-2 block">Description</label>
                                <textarea rows={4} className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-[#0F172A] dark:text-white text-sm focus:border-primary outline-none" placeholder="Describe the incident..."></textarea>
                            </div>
                            <button onClick={() => setStep('upload')} className="w-full py-4 bg-white text-[#0F172A] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all dark:bg-slate-800">Continue to Evidence</button>
                        </div>
                    )}

                    {step === 'upload' && (
                        <div className="space-y-8 text-center py-8">
                             <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-600 hover:border-primary hover:bg-white dark:bg-slate-900 transition-all cursor-pointer group">
                                <CameraIcon className="w-8 h-8 text-[#0F172A] group-hover:text-primary transition-colors" />
                             </div>
                             <p className="text-[#0F172A] dark:text-white text-sm">Upload receipts, police reports, or photos.</p>
                             <div className="flex gap-4">
                                 <button onClick={() => setStep('form')} className="flex-1 py-4 text-[#0F172A] dark:text-white font-bold uppercase text-xs hover:text-[#0F172A] dark:text-white">Back</button>
                                 <button onClick={handleSubmit} className="flex-[2] py-4 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white font-black uppercase tracking-widest rounded-2xl shadow-lg">Submit Claim</button>
                             </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center py-10 animate-fade-in-up">
                            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                                <CheckCircleIcon className="w-10 h-10 text-[#0F172A] dark:text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-[#0F172A] dark:text-white">Claim Initiated</h3>
                            <p className="text-[#0F172A] dark:text-white mt-2 mb-6">Reference ID: <span className="font-mono text-[#0F172A] dark:text-white">{claimId}</span></p>
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl text-left border border-slate-100 dark:border-white/10">
                                <p className="text-xs text-[#0F172A] dark:text-white leading-relaxed">
                                    Your dedicated concierge agent <span className="text-[#0F172A] dark:text-white font-bold">Sarah Jenkins</span> has been assigned to this case. Expect contact within 15 minutes.
                                </p>
                            </div>
                            <button onClick={onClose} className="mt-8 px-8 py-3 border border-slate-300 dark:border-black/10 rounded-xl text-[#0F172A] dark:text-white font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-[#0F172A] transition-all dark:bg-slate-800">Close Dossier</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
};

const PolicyDetailsModal: React.FC<{ policy: EnrichedPolicy; onClose: () => void; addNotification: (type: NotificationType, title: string, message: string) => void }> = ({ policy, onClose, addNotification }) => {
    const [autoRenew, setAutoRenew] = useState(true);
    const [coverageMultiplier, setCoverageMultiplier] = useState(1);

    const handleDownloadCert = () => {
        addNotification(NotificationType.INSURANCE, 'Certificate Downloaded', `Your certificate for ${policy.title} has been saved securely.`);
    };

    const handleUpdateCoverage = () => {
        addNotification(NotificationType.INSURANCE, 'Coverage Updated', `Your coverage limit has been adjusted.`);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-100  animate-fade-in">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="relative h-48 bg-cover bg-center" style={{ backgroundImage: `url('${policy.image}')` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-100 text-[#0F172A] dark:text-white rounded-full  transition-colors"><XIcon className="w-5 h-5"/></button>
                    <div className="absolute bottom-6 left-8 flex items-end gap-4">
                        <div className="p-4 bg-white  border border-slate-300 dark:border-black/10 rounded-2xl shadow-lg dark:bg-slate-800">
                            {policy.icon}
                        </div>
                        <div>
                            <p className="text-[10px] font-black primary- uppercase tracking-[0.2em] mb-1">{policy.subtitle}</p>
                            <h3 className="text-3xl font-black text-[#0F172A] dark:text-white leading-tight tracking-tight">{policy.title}</h3>
                        </div>
                    </div>
                </div>

                <div className="p-8 overflow-y-auto space-y-8">
                    {/* Key Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/10">
                            <p className="text-[9px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-1">Status</p>
                            <p className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                Active
                            </p>
                        </div>
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/10">
                            <p className="text-[9px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-1">Premium</p>
                            <p className="text-sm font-bold text-[#0F172A] dark:text-white">${policy.monthlyPremium}/mo</p>
                        </div>
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/10">
                            <p className="text-[9px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-1">Deductible</p>
                            <p className="text-sm font-bold text-[#0F172A] dark:text-white">{policy.deductible}</p>
                        </div>
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/10">
                            <p className="text-[9px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-1">Underwriter</p>
                            <p className="text-sm font-bold text-[#0F172A] dark:text-white">{policy.partner}</p>
                        </div>
                    </div>

                    {/* Coverage Adjustment */}
                    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h4 className="text-[#0F172A] dark:text-white font-bold mb-1">Adjust Coverage Limit</h4>
                                <p className="text-xs text-[#0F172A] dark:text-white">Modify your aggregate limit dynamically.</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight">
                                    ${(parseInt(policy.coverageAmount.replace(/[^0-9]/g, '')) * coverageMultiplier).toLocaleString()}
                                </p>
                                <p className="text-[10px] text-[#0F172A] uppercase tracking-widest font-bold">New Limit</p>
                            </div>
                        </div>
                        <input 
                            type="range" 
                            min="0.5" max="2" step="0.5" 
                            value={coverageMultiplier} 
                            onChange={(e) => setCoverageMultiplier(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-[10px] text-[#0F172A] font-bold uppercase tracking-widest mt-2">
                            <span>-50%</span>
                            <span>Current</span>
                            <span>+100%</span>
                        </div>
                        {coverageMultiplier !== 1 && (
                            <button onClick={handleUpdateCoverage} className="w-full mt-6 py-3 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg transition-all">
                                Apply New Limit (${(policy.monthlyPremium * coverageMultiplier).toFixed(2)}/mo)
                            </button>
                        )}
                    </div>

                    {/* Settings & Actions */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/10">
                            <div>
                                <p className="text-sm font-bold text-[#0F172A] dark:text-white mb-1">Auto-Renew Policy</p>
                                <p className="text-xs text-[#0F172A] dark:text-white">Automatically renew at the end of the term.</p>
                            </div>
                            <button 
                                onClick={() => setAutoRenew(!autoRenew)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${autoRenew ? 'bg-emerald-500' : 'bg-slate-600'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${autoRenew ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={handleDownloadCert} className="py-4 bg-white hover:bg-white border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white font-bold uppercase tracking-widest text-xs rounded-2xl transition-all flex items-center justify-center gap-2 dark:bg-slate-800">
                                <DocumentCheckIcon className="w-4 h-4" />
                                Download Certificate
                            </button>
                            <button onClick={() => addNotification(NotificationType.INSURANCE, 'Beneficiaries', 'Beneficiary management portal opened.')} className="py-4 bg-white hover:bg-white border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white font-bold uppercase tracking-widest text-xs rounded-2xl transition-all flex items-center justify-center gap-2 dark:bg-slate-800">
                                <ShieldCheckIcon className="w-4 h-4" />
                                Manage Beneficiaries
                            </button>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="mt-8">
                        <h4 className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-4">Recent Activity</h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-emerald-400 flex items-center justify-center">
                                        <CheckCircleIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[#0F172A] dark:text-white">Premium Paid</p>
                                        <p className="text-[10px] text-[#0F172A] uppercase tracking-widest">Oct 01, 2024</p>
                                    </div>
                                </div>
                                <p className="text-sm font-mono font-bold text-[#0F172A] dark:text-white">${policy.monthlyPremium.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg primary- primary- flex items-center justify-center">
                                        <DocumentCheckIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[#0F172A] dark:text-white">Policy Renewed</p>
                                        <p className="text-[10px] text-[#0F172A] uppercase tracking-widest">Jan 15, 2024</p>
                                    </div>
                                </div>
                                <p className="text-[10px] text-[#0F172A] uppercase tracking-widest font-bold">Auto</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PolicyActivationModal: React.FC<{ policy: EnrichedPolicy; onClose: () => void; onConfirm: () => void }> = ({ policy, onClose, onConfirm }) => {
    const [step, setStep] = useState<'review' | 'underwriting' | 'success'>('review');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (step === 'underwriting') {
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setStep('success');
                        return 100;
                    }
                    return prev + Math.random() * 15;
                });
            }, 300);
            return () => clearInterval(interval);
        }
    }, [step]);

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-100  animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative">
                
                {/* Header */}
                <div className="h-32 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                     <div className="absolute inset-0 opacity-40 bg-cover bg-center" style={{ backgroundImage: `url('${policy.image}')` }}></div>
                     <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                     <div className="relative z-10 flex flex-col items-center">
                         <div className="p-3 bg-white  rounded-2xl border border-slate-300 dark:border-black/10 shadow-xl mb-2 dark:bg-slate-800">{policy.icon}</div>
                         <h3 className="text-[#0F172A] dark:text-white font-black text-xl tracking-tight">{policy.title}</h3>
                     </div>
                     <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-100 text-[#0F172A] dark:text-white rounded-full  transition-colors"><XIcon className="w-5 h-5"/></button>
                </div>

                <div className="p-8">
                    {step === 'review' && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10">
                                    <p className="text-[9px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-1">Premium</p>
                                    <p className="text-xl font-bold text-[#0F172A] dark:text-white">${policy.monthlyPremium}/mo</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10">
                                    <p className="text-[9px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-1">Coverage</p>
                                    <p className="text-xl font-bold text-[#0F172A] dark:text-white">{policy.coverageAmount}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-widest">Included Protections</h4>
                                {policy.features.map((f, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm text-[#0F172A] dark:text-white">
                                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                        {f}
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                                <p className="text-[10px] text-[#0F172A] dark:text-white leading-relaxed text-center mb-4">
                                    By activating, you agree to the Universal Policy Terms and authorize the monthly debit from your primary account. Underwritten by {policy.partner}.
                                </p>
                                <button onClick={() => setStep('underwriting')} className="w-full py-4 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl transition-all hover:shadow-primary/20">
                                    Confirm & Activate
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'underwriting' && (
                        <div className="py-12 text-center space-y-8 animate-fade-in">
                            <div className="relative w-32 h-32 mx-auto">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-100 dark:text-[#1E293B]" />
                                    <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="none" className="text-primary transition-all duration-300" strokeDasharray={377} strokeDashoffset={377 - (377 * progress) / 100} />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-black text-[#0F172A] dark:text-white">{Math.round(progress)}%</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Underwriting Analysis</h3>
                                <p className="text-[#0F172A] text-sm mt-2">Connecting to {policy.partner} risk engine...</p>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="py-8 text-center animate-fade-in-up">
                             <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/20">
                                <ShieldCheckIcon className="w-10 h-10 text-[#0F172A] dark:text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-[#0F172A] dark:text-white">Coverage Active</h3>
                            <p className="text-[#0F172A] dark:text-white mt-2 mb-8">Your assets are now protected under Policy #{Math.floor(Math.random() * 1000000)}.</p>
                            <button onClick={() => { onConfirm(); onClose(); }} className="w-full py-4 bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 text-[#0F172A] dark:text-white dark:text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg transition-all">
                                View Certificate
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

const PolicyCard: React.FC<{ policy: EnrichedPolicy; onClick: () => void; onViewDetails: () => void; isProcessing: boolean }> = ({ policy, onClick, onViewDetails, isProcessing }) => {
    return (
        <div className="group relative h-[420px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)]">
            {/* Background Image */}
            <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                style={{ backgroundImage: `url('${policy.image}')` }}
            ></div>
            
            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent opacity-90"></div>
            <div className="absolute inset-0 primary- mix-blend-overlay"></div>

            {/* Content */}
            <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                <div className="flex justify-between items-start">
                    <div className="p-3 bg-white  border border-slate-300 dark:border-black/10 rounded-2xl shadow-lg dark:bg-slate-800">
                        {policy.icon}
                    </div>
                    {policy.status === 'Active' ? (
                        <span className="px-3 py-1 bg-emerald-500  border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                            Active Policy
                        </span>
                    ) : (
                        <span className="px-3 py-1 bg-white  border border-slate-300 dark:border-black/10 text-[#0F172A] dark:text-white text-[10px] font-black uppercase tracking-widest rounded-full dark:bg-slate-800">
                            Available Upgrade
                        </span>
                    )}
                </div>

                <div className="space-y-6">
                    <div>
                        <p className="text-[10px] font-black primary- uppercase tracking-[0.2em] mb-2">{policy.subtitle}</p>
                        <h3 className="text-3xl font-black text-[#0F172A] dark:text-white leading-tight tracking-tight">{policy.title}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-white/10 pt-4">
                        <div>
                            <p className="text-[9px] text-[#0F172A] dark:text-white uppercase tracking-widest font-bold">Aggregate Limit</p>
                            <p className="text-sm font-mono font-bold text-[#0F172A] dark:text-white">{policy.coverageAmount}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] text-[#0F172A] dark:text-white uppercase tracking-widest font-bold">Deductible</p>
                            <p className="text-sm font-mono font-bold text-[#0F172A] dark:text-white">{policy.deductible}</p>
                        </div>
                    </div>

                    {policy.status === 'Active' ? (
                        <div className="space-y-3">
                            {policy.features.slice(0,2).map((feat, i) => (
                                <div key={i} className="flex items-center gap-3 text-xs font-bold text-[#0F172A] dark:text-white">
                                    <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                                    {feat}
                                </div>
                            ))}
                            <button onClick={onViewDetails} className="w-full mt-2 py-3 bg-white hover:bg-white border border-slate-200 dark:border-white/10 rounded-xl text-[#0F172A] dark:text-white font-bold text-xs uppercase tracking-widest transition-all dark:bg-slate-800">
                                Manage Policy
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={onClick}
                            disabled={isProcessing}
                            className="w-full py-4 bg-white text-[#0F172A] font-black uppercase tracking-widest text-xs rounded-xl shadow-lg hover:primary- transition-all flex items-center justify-center gap-2 dark:bg-slate-800"
                        >
                            {isProcessing ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : <ShieldCheckIcon className="w-4 h-4" />}
                            <span>Activate Coverage</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const ClaimsHistory: React.FC<{ claims: any[]; addNotification: (type: NotificationType, title: string, message: string) => void }> = ({ claims, addNotification }) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/10 p-8 shadow-xl h-full">
            <h3 className="text-xl font-black text-[#0F172A] dark:text-white mb-6 flex items-center gap-3">
                <DocumentCheckIcon className="w-6 h-6 text-[#0F172A] dark:text-white" />
                Claims Ledger
            </h3>
            
            <div className="space-y-4">
                {claims.map((claim) => (
                    <div key={claim.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/10">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${claim.status === 'Paid' ? 'bg-green-100 text-green-600' : 'primary- primary-'}`}>
                                {claim.status === 'Paid' ? <CheckCircleIcon className="w-5 h-5" /> : <ClockIcon className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="font-bold text-[#0F172A] dark:text-white text-sm">{claim.type}</p>
                                <p className="text-[10px] text-[#0F172A] font-bold uppercase tracking-widest">{claim.date} • {claim.id}</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="font-mono font-bold text-[#0F172A] dark:text-white">{claim.amount}</p>
                             <p className={`text-[10px] font-black uppercase tracking-widest ${claim.status === 'Paid' ? 'text-green-600' : 'primary-'}`}>{claim.status}</p>
                        </div>
                    </div>
                ))}
                
                {claims.length === 0 && (
                    <div className="text-center py-12 text-[#0F172A] dark:text-white">
                        <ShieldCheckIcon className="w-12 h-12 mx-auto mb-3 opacity-70" />
                        <p className="text-xs font-bold uppercase tracking-widest">No Claims History</p>
                    </div>
                )}
            </div>
            
            <button onClick={() => addNotification(NotificationType.SECURITY, 'Archive Requested', 'Archived records are securely stored and can be requested via concierge.')} className="w-full mt-6 py-3 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white transition-all dark:bg-slate-800">
                View Archived Records
            </button>
        </div>
    );
};

export const Insurance: React.FC<{ addNotification: (type: NotificationType, title: string, message: string) => void; }> = ({ addNotification }) => {
    const [policies, setPolicies] = useState<EnrichedPolicy[]>(INITIAL_POLICIES);
    const [activationPolicy, setActivationPolicy] = useState<EnrichedPolicy | null>(null);
    const [selectedPolicy, setSelectedPolicy] = useState<EnrichedPolicy | null>(null);
    const [isFileClaimOpen, setIsFileClaimOpen] = useState(false);
    const [isSOSOpen, setIsSOSOpen] = useState(false);
    const [claims, setClaims] = useState<any[]>([
        { id: 'CLM-9921', type: 'Travel Delay', date: 'Oct 12, 2024', status: 'Paid', amount: '$450.00' },
        { id: 'CLM-8842', type: 'Medical (Urgent Care)', date: 'Aug 24, 2024', status: 'Approved', amount: '$1,240.00' }
    ]);

    const handlePolicyActivate = () => {
        if (!activationPolicy) return;
        
        // Update local state to reflect activation immediately
        setPolicies(prev => prev.map(p => 
            p.id === activationPolicy.id 
                ? { ...p, status: 'Active' } 
                : p
        ));

        addNotification(NotificationType.INSURANCE, 'Coverage Bound', `Your ${activationPolicy.title} is now active.`);
        setActivationPolicy(null);
    };

    const handleAddClaim = (claim: any) => {
        setClaims(prev => [claim, ...prev]);
        addNotification(NotificationType.INSURANCE, 'Claim Initiated', `Your claim ${claim.id} has been submitted.`);
    };

    return (
        <div className="space-y-12 pb-20 animate-fade-in-up">
            
            {/* Modals */}
            {isSOSOpen && <EmergencySOSModal onClose={() => setIsSOSOpen(false)} />}
            {isFileClaimOpen && <FileClaimModal onClose={() => setIsFileClaimOpen(false)} onAddClaim={handleAddClaim} />}
            {activationPolicy && (
                <PolicyActivationModal 
                    policy={activationPolicy} 
                    onClose={() => setActivationPolicy(null)} 
                    onConfirm={handlePolicyActivate} 
                />
            )}
            {selectedPolicy && (
                <PolicyDetailsModal
                    policy={selectedPolicy}
                    onClose={() => setSelectedPolicy(null)}
                    addNotification={addNotification}
                />
            )}

            {/* Hero Header */}
            <div className="relative rounded-[3rem] overflow-hidden bg-slate-100 p-10 md:p-16 border border-slate-100 dark:border-white/10 shadow-2xl">
                <div className="absolute inset-0 z-0">
                     <div 
                        className="absolute inset-0 bg-cover bg-center opacity-30"
                        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2940&auto=format&fit=crop')" }}
                     ></div>
                     <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-8">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white border border-slate-200 dark:border-white/10  text-[#0F172A] dark:text-white text-[10px] font-black uppercase tracking-[0.3em] mb-6 dark:bg-slate-800">
                            <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
                            Wealth Preservation Protocol
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-[#0F172A] dark:text-white tracking-tighter leading-none mb-6">
                            Sovereign<br/>Asset Protection.
                        </h1>
                        <p className="text-lg text-[#0F172A] dark:text-white font-bold leading-relaxed">
                            Comprehensive global coverage for your lifestyle, digital identity, and physical assets. Underwritten by the world's leading insurers for Premium Reserved clients.
                        </p>
                    </div>
                    
                    <div className="flex gap-4">
                         <button onClick={() => setIsSOSOpen(true)} className="px-8 py-5 bg-red-600 hover:bg-red-500 text-[#0F172A] dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-900/20 flex items-center gap-3 transition-all hover:-translate-y-1">
                             <PhoneIcon className="w-4 h-4" /> Emergency SOS
                         </button>
                         <button onClick={() => setIsFileClaimOpen(true)} className="px-8 py-5 bg-white text-[#0F172A] rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-200 transition-all flex items-center gap-3 dark:bg-slate-800">
                             <DocumentCheckIcon className="w-4 h-4" /> File New Claim
                         </button>
                    </div>
                </div>
            </div>

            {/* Policies Grid */}
            <div>
                <div className="flex items-center justify-between mb-8 px-2">
                    <h3 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight uppercase">Coverage Portfolio</h3>
                    <div className="flex gap-2">
                         <span className="px-3 py-1 bg-slate-200 dark:bg-slate-900 rounded-lg text-xs font-bold text-[#0F172A] dark:text-white cursor-pointer hover:text-primary">Personal</span>
                         <span className="px-3 py-1 bg-slate-200 dark:bg-slate-900 rounded-lg text-xs font-bold text-[#0F172A] dark:text-white cursor-pointer hover:text-primary">Business</span>
                    </div>
                </div>
                
                {/* Smart Coverage Analysis */}
                <div className="mb-8 p-6 bg-gradient-to-r primary- to-indigo-900 rounded-[2rem] border primary- shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl primary- flex items-center justify-center border primary- flex-shrink-0">
                            <ShieldCheckIcon className="w-8 h-8 primary-" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-[#0F172A] dark:text-white mb-1">Smart Coverage Analysis</h4>
                            <p className="text-sm primary-">Our AI has detected a potential gap in your digital asset protection based on recent linked accounts.</p>
                        </div>
                    </div>
                    <button onClick={() => addNotification(NotificationType.INSURANCE, 'Analysis Started', 'Our AI is generating a custom coverage proposal for your digital assets.')} className="whitespace-nowrap px-6 py-3 bg-white primary- font-black text-xs uppercase tracking-widest rounded-xl hover:primary- transition-all shadow-lg dark:bg-slate-800">
                        Review Proposal
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {policies.map(policy => (
                        <PolicyCard 
                            key={policy.id} 
                            policy={policy} 
                            onClick={() => setActivationPolicy(policy)}
                            onViewDetails={() => setSelectedPolicy(policy)}
                            isProcessing={false}
                        />
                    ))}
                </div>
            </div>

            {/* Claims & Support */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <ClaimsHistory claims={claims} addNotification={addNotification} />
                </div>
                <div className="bg-gradient-to-br primary- to-indigo-700 rounded-[2.5rem] p-8 text-[#0F172A] dark:text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                     <div className="absolute top-0 right-0 p-8 opacity-10">
                        <PremiumReservedBankLogo className="w-40 h-40 text-[#0F172A] dark:text-white" />
                     </div>
                     <div className="relative z-10">
                        <h4 className="text-2xl font-black tracking-tight mb-2">Concierge Claims</h4>
                        <p className="primary- text-sm leading-relaxed">
                            Premium Reserved clients enjoy dedicated claims handling. No paperwork, just instant adjudication for claims under $5,000.
                        </p>
                     </div>
                     <div className="relative z-10 mt-8">
                        <div className="flex items-center gap-4 bg-white p-4 rounded-xl  border border-slate-200 dark:border-white/10 dark:bg-slate-800">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center primary- shadow-lg dark:bg-slate-800">
                                <ArrowRightIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest primary-">Avg. Resolution</p>
                                <p className="text-xl font-black">24 Hours</p>
                            </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};
