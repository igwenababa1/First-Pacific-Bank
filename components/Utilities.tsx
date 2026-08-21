
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UtilityBill, UtilityBiller, Account } from '../types';
import { 
    SpinnerIcon, 
    ShieldCheckIcon, 
    QuestionMarkCircleIcon, 
    getUtilityBillerIcon, 
    LeafIcon, 
    ZapIcon, 
    RefreshCwIcon, 
    ReceiptIcon, 
    PlusCircleIcon,
    ArrowRightIcon,
    CheckCircleIcon,
    CameraIcon,
    XIcon,
    SearchIcon,
    UsersIcon,
    UserCircleIcon,
    LockClosedIcon,
    BrandLogo
} from './Icons';
import { USER_PIN } from './constants';
import { db } from '../services/database';
import { ComplianceHaltModal } from './ComplianceHaltModal';

interface UtilitiesProps {
    bills: UtilityBill[];
    billers: UtilityBiller[];
    onPayBill: (billId: string, sourceAccountId: string) => boolean;
    accounts: Account[];
    onContactSupport: () => void;
    onAddBiller: (name: string, type: string) => void;
}

// ... New Components ...

const SpendTrendChart: React.FC = () => {
    // Simulated data for last 6 months
    const data = [120, 135, 110, 145, 180, 160];
    const max = Math.max(...data);
    const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

    return (
        <div className="h-40 flex items-end justify-between gap-2 pt-6">
            {data.map((val, i) => {
                const height = (val / max) * 100;
                return (
                    <div key={i} className="flex flex-col items-center gap-2 flex-1 group cursor-default">
                        <div className="w-full bg-white dark:bg-slate-900 rounded-t-lg relative h-full flex items-end overflow-hidden group-hover:bg-slate-100 dark:bg-slate-700 transition-colors">
                            <div 
                                className="w-full bg-primary/20 group-hover:bg-primary/40 transition-all duration-700 ease-out relative" 
                                style={{ height: `${height}%` }}
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_10px_#0EA5E9]"></div>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider">{months[i]}</span>
                    </div>
                );
            })}
        </div>
    );
};

const EcoBadge: React.FC<{ score: number }> = ({ score }) => (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
        <LeafIcon className="w-3 h-3 text-emerald-500" />
        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{score}% Renewable</span>
    </div>
);

const UtilityServiceCard: React.FC<{ 
    biller: UtilityBiller; 
    bill?: UtilityBill; 
    onPay: () => void; 
    onConfigureAuto: () => void 
}> = ({ biller, bill, onPay, onConfigureAuto }) => {
    const FallbackIcon = getUtilityBillerIcon(biller.name);
    const isDue = bill && !bill.isPaid;
    
    return (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-[2rem] p-6 hover:border-primary/30 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-2 shadow-lg dark:bg-slate-800">
                        <BrandLogo 
                            domain={biller.domain} 
                            name={biller.name} 
                            fallback={FallbackIcon} 
                            className="w-full h-full object-contain" 
                        />
                    </div>
                    <div>
                        <h4 className="font-bold text-[#0F172A] dark:text-white text-lg">{biller.name}</h4>
                        <p className="text-xs text-[#0F172A] font-mono tracking-widest">{biller.accountNumber}</p>
                    </div>
                </div>
                {biller.type === 'Electricity' && <EcoBadge score={85} />}
            </div>

            <div className="flex justify-between items-end mb-6">
                <div>
                    <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Current Cycle</p>
                    <p className={`text-3xl font-mono font-bold ${isDue ? 'text-[#0F172A] dark:text-white' : 'text-[#0F172A]'}`}>
                        {bill ? `$${bill.amount.toFixed(2)}` : '$0.00'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Status</p>
                    {isDue ? (
                        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded">Awaiting Settlement</span>
                    ) : (
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">All Clear</span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={onConfigureAuto}
                    className="py-3 bg-white hover:bg-white rounded-xl text-[10px] font-black uppercase tracking-widest text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white transition-all flex items-center justify-center gap-2 dark:bg-slate-800"
                >
                    <RefreshCwIcon className="w-3 h-3" /> Auto-Pilot
                </button>
                <button 
                    onClick={onPay}
                    disabled={!isDue}
                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isDue ? 'bg-primary text-[#0F172A] dark:text-white hover:bg-primary-600 shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-900 text-[#0F172A] cursor-not-allowed'}`}
                >
                    {isDue ? 'Pay Now' : 'Settled'}
                </button>
            </div>
        </div>
    );
};

// ... AutoPayModal, ScanBillModal, SplitBillModal, LinkProviderModal, PaymentConfirmationModal, Utilities Component ...
// (Rest of the file content remains the same, just the UtilityServiceCard was updated)

const AutoPayModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    // ... same as before
    const [isEnabled, setIsEnabled] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            setIsSaved(true);
            setTimeout(onClose, 1500);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-slate-100  flex items-center justify-center z-[80] p-4 animate-fade-in">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-md p-8 animate-fade-in-up relative overflow-hidden">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-primary/20 rounded-xl">
                        <RefreshCwIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Smart Auto-Pilot</h3>
                        <p className="text-xs text-[#0F172A] dark:text-white">Configure automated settlement rules.</p>
                    </div>
                </div>
                
                {!isSaved ? (
                    <div className="space-y-6">
                        <div 
                            className="bg-slate-100 p-5 rounded-2xl border border-slate-100 dark:border-white/10 flex items-center justify-between cursor-pointer"
                            onClick={() => setIsEnabled(!isEnabled)}
                        >
                            <span className="text-sm font-bold text-[#0F172A] dark:text-white">Enable Automation</span>
                            <div className={`w-12 h-7 rounded-full relative transition-colors ${isEnabled ? 'bg-primary' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${isEnabled ? 'left-6' : 'left-1'}`}></div>
                            </div>
                        </div>
                        
                        <div className={`transition-all duration-300 ${isEnabled ? 'opacity-100' : 'opacity-70 pointer-events-none'}`}>
                            <label className="text-xs font-bold text-[#0F172A] uppercase tracking-widest block mb-2">Maximum Threshold</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F172A] dark:text-white font-mono">$</span>
                                <input type="number" placeholder="200.00" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-4 pl-8 text-[#0F172A] dark:text-white font-mono outline-none focus:border-primary" />
                            </div>
                            <p className="text-[10px] text-[#0F172A] mt-2 flex items-center gap-2">
                                <ShieldCheckIcon className="w-3 h-3" /> Bills above this amount trigger manual review.
                            </p>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button onClick={onClose} className="flex-1 py-4 bg-white rounded-2xl text-xs font-bold uppercase text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white transition-colors dark:bg-slate-800">Cancel</button>
                            <button onClick={handleSave} disabled={isSaving} className="flex-1 py-4 bg-primary text-[#0F172A] dark:text-white rounded-2xl text-xs font-bold uppercase shadow-lg hover:bg-primary-600 transition-all flex items-center justify-center gap-2">
                                {isSaving ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : 'Save Rules'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="py-10 text-center animate-fade-in-up">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400">
                            <CheckCircleIcon className="w-8 h-8" />
                        </div>
                        <h4 className="text-xl font-bold text-[#0F172A] dark:text-white">Configured</h4>
                        <p className="text-[#0F172A] dark:text-white text-sm mt-2">Your automated rules are now active.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const ScanBillModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    // ... same as before
    const [step, setStep] = useState<'scan' | 'analyzing' | 'result'>('scan');
    useEffect(() => {
        if (step === 'scan') {
            const timer = setTimeout(() => setStep('analyzing'), 2000);
            return () => clearTimeout(timer);
        }
        if (step === 'analyzing') {
            const timer = setTimeout(() => setStep('result'), 2500);
            return () => clearTimeout(timer);
        }
    }, [step]);

    return (
        <div className="fixed inset-0 bg-slate-100 flex items-center justify-center z-[90] animate-fade-in">
            {step === 'scan' && (
                <div className="relative w-full h-full flex flex-col">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-64 h-96 border-2 border-primary/50 rounded-3xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_20px_rgba(14,197,242,0.8)] animate-[scan-vertical_2s_ease-in-out_infinite]"></div>
                        </div>
                    </div>
                    <button onClick={onClose} className="absolute top-6 right-6 p-4 bg-slate-100 rounded-full text-[#0F172A] dark:text-white ">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
            )}
             {step === 'analyzing' && (
                <div className="text-center">
                    <SpinnerIcon className="w-16 h-16 text-primary animate-spin mb-6" />
                    <h3 className="text-2xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Extracting Data</h3>
                </div>
            )}
            {step === 'result' && (
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-sm p-8 m-4 shadow-2xl relative animate-fade-in-up">
                     <div className="text-center mb-6"><h3 className="text-xl font-black text-[#0F172A] dark:text-white">Bill Detected</h3></div>
                     <div className="bg-slate-100 p-6 rounded-2xl border border-slate-100 dark:border-white/10 space-y-4">
                        <div className="flex justify-between items-center"><span className="text-[#0F172A] dark:text-white text-xs uppercase font-bold">Vendor</span><span className="text-[#0F172A] dark:text-white font-bold">ConEdison Power</span></div>
                        <div className="flex justify-between items-center"><span className="text-[#0F172A] dark:text-white text-xs uppercase font-bold">Amount</span><span className="text-2xl font-mono font-black text-primary">$145.20</span></div>
                    </div>
                    <div className="mt-8 gap-3 flex">
                        <button onClick={onClose} className="flex-1 py-4 bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white rounded-xl font-bold text-xs uppercase tracking-widest">Cancel</button>
                        <button onClick={onClose} className="flex-[2] py-4 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg">Pay Now</button>
                    </div>
                </div>
            )}
        </div>
    )
};

const SplitBillModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
     // ... same as before
     return <div className="fixed inset-0 bg-slate-100 flex items-center justify-center z-[80]"><button onClick={onClose} className="text-[#0F172A] dark:text-white">Close</button></div>
};

const LinkProviderModal: React.FC<{ onClose: () => void; onLink: (name: string, type: string) => void }> = ({ onClose, onLink }) => {
    // ... same as before
    const [searchTerm, setSearchTerm] = useState('');
    const [connecting, setConnecting] = useState<string | null>(null);

    const handleConnect = (id: string, name: string, type: string) => {
        setConnecting(id);
        setTimeout(() => {
            onLink(name, type);
            onClose(); 
        }, 1500);
    };

    const providers = [
        { id: '1', name: 'Comcast / Xfinity', type: 'Internet' },
        { id: '2', name: 'PG&E Energy', type: 'Electricity' },
        { id: '3', name: 'AT&T Fiber', type: 'Internet' },
        { id: '4', name: 'American Water', type: 'Water' },
        { id: '5', name: 'T-Mobile', type: 'Phone' },
        { id: '6', name: 'Verizon', type: 'Phone' },
    ];

    const filtered = providers.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="fixed inset-0 bg-slate-100  flex items-center justify-center z-[80] p-4 animate-fade-in">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-lg p-8 animate-fade-in-up flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Link Service Provider</h3>
                    <button onClick={onClose}><XIcon className="w-6 h-6 text-[#0F172A] hover:text-[#0F172A] dark:text-white"/></button>
                </div>
                
                <div className="relative mb-6">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0F172A]" />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search provider..."
                        className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-12 text-[#0F172A] dark:text-white outline-none focus:border-primary"
                    />
                </div>

                <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2">
                    {filtered.map(p => {
                        const ProviderIcon = getUtilityBillerIcon(p.name);
                        return (
                            <div key={p.id} className="flex justify-between items-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/10">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 dark:bg-slate-800">
                                        <BrandLogo domain={p.name.toLowerCase().replace(/\s/g, '') + '.com'} name={p.name} fallback={ProviderIcon} className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#0F172A] dark:text-white text-sm">{p.name}</p>
                                        <p className="text-[10px] text-[#0F172A] uppercase tracking-widest">{p.type}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleConnect(p.id, p.name, p.type)}
                                    disabled={connecting !== null}
                                    className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold hover:bg-primary hover:text-[#0F172A] dark:text-white transition-all min-w-[90px] flex justify-center"
                                >
                                    {connecting === p.id ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : 'Connect'}
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

const PaymentConfirmationModal: React.FC<{ bill: UtilityBill, biller: UtilityBiller, accounts: Account[], onConfirm: (sourceAccountId: string) => boolean, onClose: () => void, onContactSupport: () => void }> = ({ bill, biller, accounts, onConfirm, onClose, onContactSupport }) => {
    // ... same as before
    const [step, setStep] = useState<'pay' | 'compliance' | 'processing' | 'success'>('pay');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [sourceAccountId, setSourceAccountId] = useState(accounts.find(a => a.balance > bill.amount)?.id || accounts[0]?.id || '');

    const handleConfirm = async () => {
        const email = db.getCurrentUserEmail();
        const isValid = await db.verifyPin(email, pin);
        if (!isValid) { setError('Incorrect PIN.'); return; }
        setStep('compliance');
    };

    const handleComplianceVerified = () => {
        setStep('processing');
        setTimeout(() => {
            onConfirm(sourceAccountId);
            setStep('success');
        }, 1500);
    };

    return (
        <>
            {step === 'compliance' && <ComplianceHaltModal isOpen={true} amount={bill.amount} onVerified={handleComplianceVerified} onCancel={() => setStep('pay')} onContactSupport={onContactSupport} />}
            
            <div className={`fixed inset-0 bg-slate-100  flex items-center justify-center z-50 p-4 ${step === 'compliance' ? 'hidden' : ''} animate-fade-in`}>
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative animate-fade-in-up">
                    {step === 'pay' && (
                        <div className="p-8">
                             <h2 className="text-2xl font-black text-[#0F172A] dark:text-white mb-6 uppercase tracking-tight">Confirm Settlement</h2>
                             <div className="space-y-6">
                                <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/10">
                                    <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Target Entity</p>
                                    <p className="text-lg font-bold text-[#0F172A] dark:text-white mb-4">{biller.name}</p>
                                    <div className="h-px bg-white w-full mb-4 dark:bg-slate-800"></div>
                                    <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Debit Amount</p>
                                    <p className="text-4xl font-mono font-black text-[#0F172A] dark:text-white tracking-tighter">${bill.amount.toLocaleString()}</p>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-widest mb-2">Auth PIN</label>
                                    <input type="password" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength={4} className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-4 rounded-xl text-center text-2xl tracking-[1em] focus:ring-1 focus:ring-primary outline-none" placeholder="••••" />
                                </div>
                                {error && <p className="text-red-400 text-xs font-bold text-center bg-red-900/20 p-2 rounded">{error}</p>}
                            </div>
                            <div className="mt-8 flex gap-3">
                                <button onClick={onClose} className="flex-1 py-4 text-[#0F172A] dark:text-white font-bold text-xs uppercase tracking-widest hover:text-[#0F172A] dark:text-white transition-colors">Cancel</button>
                                <button onClick={handleConfirm} disabled={pin.length !== 4} className="flex-1 py-4 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg transition-all disabled:opacity-70">Authorize</button>
                            </div>
                        </div>
                    )}
                    {step === 'processing' && <div className="p-12 text-center"><SpinnerIcon className="w-12 h-12 text-primary animate-spin mx-auto mb-6" /><p className="text-lg font-bold text-[#0F172A] dark:text-white">Processing...</p></div>}
                    {step === 'success' && <div className="p-12 text-center animate-fade-in-up"><CheckCircleIcon className="w-20 h-20 text-emerald-500 mx-auto mb-6" /><h2 className="text-2xl font-black text-[#0F172A] dark:text-white">Paid!</h2><button onClick={onClose} className="mt-8 px-8 py-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-700 text-[#0F172A] dark:text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all">Close</button></div>}
                </div>
            </div>
        </>
    )
};

export const Utilities: React.FC<UtilitiesProps> = ({ bills, billers, onPayBill, accounts, onContactSupport, onAddBiller }) => {
    // ... same as before
    const [payingBill, setPayingBill] = useState<UtilityBill | null>(null);
    const [activeModal, setActiveModal] = useState<'none' | 'autopay' | 'scan' | 'split' | 'link'>('none');
    
    const activeBills = bills.sort((a,b) => a.dueDate.getTime() - b.dueDate.getTime());
    const payingBiller = billers.find(b => b.id === payingBill?.billerId);
    const totalSpend = 452.80;

    return (
        <div className="space-y-10 max-w-6xl mx-auto pb-20">
            {payingBill && payingBiller && <PaymentConfirmationModal bill={payingBill} biller={payingBiller} accounts={accounts} onConfirm={(accId) => onPayBill(payingBill.id, accId)} onClose={() => setPayingBill(null)} onContactSupport={onContactSupport} />}
            {activeModal === 'autopay' && <AutoPayModal onClose={() => setActiveModal('none')} />}
            {activeModal === 'scan' && <ScanBillModal onClose={() => setActiveModal('none')} />}
            {activeModal === 'split' && <SplitBillModal onClose={() => setActiveModal('none')} />}
            {activeModal === 'link' && <LinkProviderModal onClose={() => setActiveModal('none')} onLink={onAddBiller} />}

            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-primary/20 rounded-xl border border-primary/30 shadow-lg">
                                    <ZapIcon className="w-6 h-6 text-primary" />
                                </div>
                                <h2 className="text-3xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Utility Command</h2>
                            </div>
                            <p className="text-[#0F172A] text-sm font-bold">Manage infrastructure payments and consumption analytics.</p>
                        </div>
                         <Link to="/support" className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-900 rounded-full text-xs font-bold text-[#0F172A] dark:text-white hover:bg-slate-300 dark:hover:bg-slate-100 dark:bg-slate-700 transition-colors">
                            <QuestionMarkCircleIcon className="w-4 h-4" />
                            <span>Help</span>
                        </Link>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-[0.3em] mb-2">Monthly Overhead</p>
                                <h3 className="text-5xl font-mono font-black text-[#0F172A] dark:text-white tracking-tighter">${totalSpend.toFixed(2)}</h3>
                                <div className="flex items-center gap-2 mt-4 text-xs font-bold text-emerald-400">
                                    <div className="px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">-4.2%</div>
                                    <span className="text-[#0F172A] uppercase tracking-wider text-[10px]">vs last month</span>
                                </div>
                            </div>
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-[0.3em] mb-2">Consumption Trend</p>
                                <SpendTrendChart />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-1 flex flex-col gap-4">
                    <div className="flex-1 bg-gradient-to-br from-emerald-900 to-slate-900 rounded-[2.5rem] p-8 border border-emerald-500/20 shadow-xl relative overflow-hidden group cursor-default">
                         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leaf.png')] opacity-10"></div>
                         <div className="relative z-10">
                            <LeafIcon className="w-8 h-8 text-emerald-400 mb-4" />
                            <h4 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Eco Impact</h4>
                            <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed">Your energy portfolio is 85% renewable. Great job.</p>
                         </div>
                    </div>
                    
                    <div className="flex gap-4">
                         <button 
                            onClick={() => setActiveModal('scan')}
                            className="flex-1 p-6 bg-slate-100 dark:bg-slate-900 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:bg-white dark:hover:bg-slate-100 dark:bg-slate-700 transition-all shadow-sm group"
                         >
                             <div className="w-10 h-10 bg-slate-200 dark:bg-slate-900 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><ReceiptIcon className="w-5 h-5 text-[#0F172A] dark:text-white"/></div>
                             <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">Scan Bill</span>
                         </button>
                         <button 
                            onClick={() => setActiveModal('split')}
                            className="flex-1 p-6 bg-slate-100 dark:bg-slate-900 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:bg-white dark:hover:bg-slate-100 dark:bg-slate-700 transition-all shadow-sm group"
                         >
                             <div className="w-10 h-10 bg-slate-200 dark:bg-slate-900 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><PlusCircleIcon className="w-5 h-5 text-[#0F172A] dark:text-white"/></div>
                             <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">Split Cost</span>
                         </button>
                    </div>
                </div>
            </div>

            {/* Service Grid */}
            <div>
                <div className="flex items-center gap-4 mb-6">
                    <h3 className="text-xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Connected Infrastructure</h3>
                    <div className="h-px bg-slate-200 dark:bg-slate-900 flex-1"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {billers.map(biller => {
                        const bill = activeBills.find(b => b.billerId === biller.id);
                        return (
                            <UtilityServiceCard 
                                key={biller.id} 
                                biller={biller} 
                                bill={bill} 
                                onPay={() => bill && setPayingBill(bill)} 
                                onConfigureAuto={() => setActiveModal('autopay')}
                            />
                        );
                    })}
                    
                    {/* Add New Placeholder */}
                    <button 
                        onClick={() => setActiveModal('link')}
                        className="border-2 border-dashed border-slate-300 dark:border-slate-300 rounded-[2rem] flex flex-col items-center justify-center gap-4 text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:hover:text-[#0F172A] dark:text-[#1E293B] hover:border-slate-400 dark:hover:border-slate-500 transition-all min-h-[200px] group"
                    >
                        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <PlusCircleIcon className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">Link New Provider</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
