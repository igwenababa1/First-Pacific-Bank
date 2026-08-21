
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Cause, Donation, Account } from '../types';
import { INITIAL_CAUSES, USER_PIN } from './constants';
import { db } from '../services/database';
import { getCauseDetails } from '../services/geminiService';
import * as Icons from './Icons';
import { ComplianceHaltModal } from './ComplianceHaltModal';
import { getFlagUrl } from '../utils/flags';
import { useCurrency } from '../contexts/CurrencyContext';

// --- Types & Interfaces ---

interface ExtendedCause extends Omit<Cause, 'details'> {
    targetAmount: number;
    raisedAmount: number;
    donors: number;
    category: 'Humanitarian' | 'Environment' | 'Health' | 'Emergency';
    impactMetric: string; // e.g., "$10 = 1 Kit"
    region: string;
}

// Enhanced Initial Data
const ENRICHED_CAUSES: ExtendedCause[] = [
    { 
        id: 'cause1', 
        title: 'Global Disaster Relief Fund', 
        shortDescription: 'Deploying immediate medical aid and shelter to conflict zones and natural disaster areas.', 
        imageUrl: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=2940&auto=format&fit=crop',
        targetAmount: 5000000,
        raisedAmount: 3425000,
        donors: 12405,
        category: 'Emergency',
        impactMetric: '$50 provides emergency shelter for a family.',
        region: 'Global'
    },
    { 
        id: 'cause2', 
        title: 'Education for All Initiative', 
        shortDescription: 'Building sustainable schools and providing digital learning tools in underserved regions.', 
        imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2944&auto=format&fit=crop',
        targetAmount: 2000000,
        raisedAmount: 1150000,
        donors: 8200,
        category: 'Humanitarian',
        impactMetric: '$100 supplies a classroom for a month.',
        region: 'Sub-Saharan Africa'
    },
    { 
        id: 'cause3', 
        title: 'Ocean Cleanup Project', 
        shortDescription: 'Advanced technology deployment to remove plastics from international waters.', 
        imageUrl: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?q=80&w=2874&auto=format&fit=crop',
        targetAmount: 1500000,
        raisedAmount: 980000,
        donors: 6500,
        category: 'Environment',
        impactMetric: '$25 removes 5kg of ocean plastic.',
        region: 'Pacific Ocean'
    },
];

// --- Sub-Components ---

const LiveTicker: React.FC = () => {
    const { formatCurrency } = useCurrency();
    const donations = [
        { name: "Anonymous", amount: 500, from: "US" },
        { name: "Sarah J.", amount: 150, from: "GB" },
        { name: "Marcus L.", amount: 1000, from: "DE" },
        { name: "TechCorp Inc.", amount: 5000, from: "SG" },
        { name: "Elena R.", amount: 25, from: "ES" },
        { name: "Jin W.", amount: 200, from: "KR" },
    ];

    return (
        <div className="bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-white/10 overflow-hidden py-2 flex items-center -mx-4 sm:-mx-6 lg:-mx-8 relative z-20 shadow-xl">
            <div className="flex items-center space-x-2 px-4 border-r border-slate-200 dark:border-white/10 z-10 bg-slate-50 dark:bg-slate-900 shadow-[5px_0_15px_rgba(0,0,0,0.5)]">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider whitespace-nowrap">Live Feed</span>
            </div>
            <div className="flex animate-marquee whitespace-nowrap space-x-12 px-4">
                {[...donations, ...donations].map((d, i) => (
                    <div key={i} className="flex items-center space-x-2 text-xs text-[#0F172A] dark:text-white">
                        <img src={getFlagUrl(d.from)} alt={d.from} className="w-4 h-auto rounded-sm opacity-80" />
                        <span className="font-semibold text-[#0F172A] dark:text-[#1E293B]">{d.name}</span>
                        <span>donated</span>
                        <span className="font-mono text-green-400 font-bold">{formatCurrency(d.amount, 'USD')}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ImpactCard: React.FC<{ userTotal: number }> = ({ userTotal }) => {
    const { formatCurrency } = useCurrency();
    const impactLevel = userTotal > 1000 ? "Visionary" : userTotal > 500 ? "Champion" : "Supporter";
    const nextLevel = userTotal > 1000 ? null : userTotal > 500 ? 1000 : 500;
    const progress = nextLevel ? (userTotal / nextLevel) * 100 : 100;

    return (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icons.TrophyIcon className="w-32 h-32 text-yellow-500" />
            </div>
            
            <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-1">Your Global Impact</h3>
            <p className="text-xs text-[#0F172A] dark:text-white mb-6">Tax Year 2024 • ID: #GA-88219</p>

            <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-mono font-bold text-[#0F172A] dark:text-white">{formatCurrency(userTotal)}</span>
                <span className="text-xs text-[#0F172A] dark:text-white mb-1">Tax Deductible</span>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-yellow-500">{impactLevel} Status</span>
                    {nextLevel && <span className="text-[#0F172A]">{formatCurrency(nextLevel - userTotal)} to next level</span>}
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-1000" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            <div className="mt-6 flex gap-3">
                 <button className="flex-1 py-2 text-xs font-bold text-[#0F172A] dark:text-white bg-white hover:bg-white rounded-lg border border-slate-100 dark:border-white/10 transition-colors flex items-center justify-center gap-2 dark:bg-slate-800">
                    <Icons.DocumentCheckIcon className="w-4 h-4" /> Download Tax Receipt
                 </button>
            </div>
        </div>
    );
};

const CauseCard: React.FC<{
    cause: ExtendedCause;
    onDonate: (cause: ExtendedCause) => void;
}> = ({ cause, onDonate }) => {
    const { formatCurrency } = useCurrency();
    const percent = Math.min(100, (cause.raisedAmount / cause.targetAmount) * 100);

    return (
        <div className="group bg-slate-200 dark:bg-slate-900 rounded-2xl shadow-digital border border-slate-200 dark:border-white/10 overflow-hidden transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl">
            <div className="relative h-48 overflow-hidden">
                <div 
                    className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url("${cause.imageUrl}")` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent"></div>
                
                <div className="absolute top-4 right-4 bg-slate-100  border border-slate-200 dark:border-white/10 px-3 py-1 rounded-full flex items-center gap-2">
                    <Icons.GlobeAmericasIcon className="w-3 h-3 text-[#0F172A] dark:text-white" />
                    <span className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase tracking-wide">{cause.region}</span>
                </div>

                {cause.category === 'Emergency' && (
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1 bg-red-600 text-[#0F172A] dark:text-white text-xs font-bold uppercase tracking-wider rounded animate-pulse">
                        <Icons.ExclamationTriangleIcon className="w-4 h-4" />
                        Critical Response
                    </div>
                )}
            </div>

            <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-[#0F172A] dark:text-white group-hover:text-primary transition-colors">{cause.title}</h3>
                    {cause.category === 'Environment' ? <Icons.GlobeAltIcon className="w-5 h-5 text-green-500" /> : <Icons.HeartIcon className="w-5 h-5 text-red-500" />}
                </div>
                
                <p className="text-sm text-[#0F172A] dark:text-white mb-4 line-clamp-2">{cause.shortDescription}</p>

                <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-xs font-bold text-[#0F172A] dark:text-white">
                        <span>Raised: <span className="text-[#0F172A] dark:text-white">{formatCurrency(cause.raisedAmount, 'USD').replace(/,00$/, 'M')}</span></span>
                        <span>Goal: {formatCurrency(cause.targetAmount, 'USD').replace(/,00$/, 'M')}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${percent}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-[#0F172A] dark:text-white">
                         <span>{cause.donors.toLocaleString()} Donors</span>
                         <span className="text-green-500 flex items-center gap-1"><Icons.VerifiedBadgeIcon className="w-3 h-3"/> Verified NGO</span>
                    </div>
                </div>

                <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-3 mb-6 border border-slate-200 dark:border-white/10">
                    <p className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wide mb-1">Impact Metric</p>
                    <p className="text-sm text-primary font-bold">{cause.impactMetric}</p>
                </div>

                <button 
                    onClick={() => onDonate(cause)} 
                    className="w-full py-3 bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 text-[#0F172A] dark:text-white dark:text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <span>Donate Now</span>
                    <Icons.ArrowRightIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

const EmployerMatchingModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { formatCurrency } = useCurrency();
    const [step, setStep] = useState<'search' | 'found' | 'success'>('search');
    const [employer, setEmployer] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSearching(true);
        setTimeout(() => {
            setIsSearching(false);
            setStep('found');
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-slate-100  flex items-center justify-center z-[110] p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-md rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-fade-in-up">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-white dark:bg-slate-900 rounded-full transition-colors z-10">
                    <Icons.XIcon className="w-5 h-5 text-[#0F172A]" />
                </button>

                <div className="p-8">
                    {step === 'search' && (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 primary- dark:primary- rounded-full flex items-center justify-center mx-auto primary- dark:primary-">
                                <Icons.BuildingOfficeIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-[#0F172A] dark:text-white">Corporate Matching</h3>
                                <p className="text-[#0F172A] text-sm mt-2">Search our database of over 25,000 companies that match employee donations.</p>
                            </div>
                            <form onSubmit={handleSearch} className="relative">
                                <Icons.SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0F172A] dark:text-white" />
                                <input 
                                    type="text" 
                                    value={employer}
                                    onChange={e => setEmployer(e.target.value)}
                                    placeholder="Search Company Name..." 
                                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-300 focus:ring-2 focus:ring-primary outline-none transition-all text-[#0F172A] dark:text-white font-bold"
                                    required
                                />
                                <button type="submit" disabled={isSearching} className="w-full mt-4 py-4 bg-primary text-[#0F172A] dark:text-white font-bold rounded-xl shadow-lg hover:bg-primary-600 transition-all flex items-center justify-center gap-2">
                                    {isSearching ? <Icons.SpinnerIcon className="w-5 h-5 animate-spin" /> : "Search Database"}
                                </button>
                            </form>
                        </div>
                    )}

                    {step === 'found' && (
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400 border-4 border-white dark:border-slate-900 shadow-xl">
                                <Icons.CheckCircleIcon className="w-10 h-10" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-[#0F172A] dark:text-white">Match Eligible!</h3>
                                <p className="text-[#0F172A] text-sm mt-2">We found <span className="font-bold text-[#0F172A] dark:text-white">{employer}</span> in our network.</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl text-left border border-slate-200 dark:border-white/10">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-[#0F172A] uppercase">Match Ratio</span>
                                    <span className="text-sm font-bold text-green-600 dark:text-green-400">1:1</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-[#0F172A] uppercase">Min Donation</span>
                                    <span className="text-sm font-bold text-[#0F172A] dark:text-white">{formatCurrency(25)}</span>
                                </div>
                            </div>
                            <button onClick={() => setStep('success')} className="w-full py-4 bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 text-[#0F172A] dark:text-white dark:text-white font-bold rounded-xl shadow-lg transition-all">
                                Activate Matching
                            </button>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center space-y-6 animate-fade-in-up">
                            <div className="w-16 h-16 primary- dark:primary- rounded-full flex items-center justify-center mx-auto primary- dark:primary-">
                                <Icons.BriefcaseIcon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Matching Active</h3>
                            <p className="text-[#0F172A] text-sm">Future donations will automatically trigger a matching request to your employer.</p>
                            <button onClick={onClose} className="w-full py-4 bg-slate-200 dark:bg-slate-900 text-[#0F172A] dark:text-white font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-100 dark:bg-slate-700 transition-all">
                                Done
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Donation Modal ---

const DonationModal: React.FC<{
    cause: ExtendedCause;
    accounts: Account[];
    onClose: () => void;
    onDonate: (causeId: string, amount: number, sourceAccountId: string) => boolean;
    onContactSupport: () => void;
}> = ({ cause, accounts, onClose, onDonate, onContactSupport }) => {
    const { formatCurrency, displayCurrency, getCurrencyInfo } = useCurrency();
    const currencySymbol = getCurrencyInfo(displayCurrency)?.symbol || '$';
    
    const [step, setStep] = useState<'amount' | 'pin' | 'compliance' | 'processing' | 'success'>('amount');
    const [amount, setAmount] = useState(50);
    const [customAmount, setCustomAmount] = useState('');
    const [sourceAccountId, setSourceAccountId] = useState(accounts.find(a => a.balance > 0)?.id || '');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const finalAmount = customAmount ? parseFloat(customAmount) : amount;
    const impactQuantity = Math.floor(finalAmount / 25);
    const impactText = cause.impactMetric.split(' ')[2] + ' ' + cause.impactMetric.split(' ')[3];

    const handleDonateClick = () => {
        if (!sourceAccountId) { setError('Please select a source account.'); return; }
        if (finalAmount <= 0) { setError('Please enter a valid amount.'); return; }
        setError('');
        setStep('pin');
    };
    
    const handleConfirm = async () => {
        setError('');
        const email = db.getCurrentUserEmail();
        const isValid = await db.verifyPin(email, pin);
        if (!isValid) { setError('Incorrect PIN.'); return; }
        setStep('compliance');
    };

    const handleComplianceVerified = () => {
        setStep('processing');
        setTimeout(() => {
            onDonate(cause.id, finalAmount, sourceAccountId);
            setStep('success');
        }, 2000);
    };

    if (step === 'success') {
        return (
            <div className="fixed inset-0 bg-slate-100  flex items-center justify-center z-[100] animate-fade-in p-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center border border-slate-200 dark:border-white/10 animate-fade-in-up relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse"></div>
                    
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                        <Icons.CheckCircleIcon className="w-10 h-10 text-[#0F172A] dark:text-white" />
                    </div>
                    <h3 className="text-2xl font-black text-[#0F172A] dark:text-white mb-2">Impact Made!</h3>
                    <p className="text-[#0F172A] dark:text-white mb-6">
                        You've just contributed <strong className="text-[#0F172A] dark:text-white">{formatCurrency(finalAmount)}</strong> to {cause.title}.
                    </p>
                    <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl mb-6">
                        <p className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">Your Impact</p>
                        <p className="text-lg font-bold text-primary">~{impactQuantity || 1}x {impactText || 'Impact Units'}</p>
                    </div>
                    <button onClick={onClose} className="w-full py-3.5 bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 text-[#0F172A] dark:text-white dark:text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform">
                        Close & View Certificate
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {step === 'compliance' && (
                <ComplianceHaltModal isOpen={true} amount={finalAmount} onVerified={handleComplianceVerified} onCancel={() => setStep('pin')} onContactSupport={onContactSupport} />
            )}

            <div className={`fixed inset-0 bg-slate-100  flex items-center justify-center z-[90] p-4 animate-fade-in ${step === 'compliance' ? 'hidden' : ''}`}>
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="relative h-32 bg-white dark:bg-slate-900">
                        <div 
                            className="absolute inset-0 bg-cover bg-center opacity-60"
                            style={{ backgroundImage: `url("${cause.imageUrl}")` }}
                        ></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-100 text-[#0F172A] dark:text-white rounded-full  transition-colors">
                            <Icons.XIcon className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-4 left-6">
                            <h2 className="text-xl font-bold text-[#0F172A] dark:text-white shadow-black drop-shadow-md">Make a Donation</h2>
                            <p className="text-xs text-[#0F172A] dark:text-white">to {cause.title}</p>
                        </div>
                    </div>

                    <div className="p-6 overflow-y-auto">
                        {step === 'amount' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3 block">Choose Amount</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[25, 50, 100, 250, 500, 1000].map(val => (
                                            <button 
                                                key={val} 
                                                onClick={() => { setAmount(val); setCustomAmount(''); }} 
                                                className={`py-3 rounded-xl font-bold transition-all border ${amount === val && !customAmount ? 'bg-primary text-[#0F172A] dark:text-white border-primary shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-slate-900 text-[#0F172A] dark:text-white border-transparent hover:border-slate-300'}`}
                                            >
                                                {currencySymbol}{val}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-3 relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F172A] dark:text-white font-bold">{currencySymbol}</span>
                                        <input 
                                            type="number" 
                                            value={customAmount} 
                                            onChange={e => { setCustomAmount(e.target.value); setAmount(0); }} 
                                            placeholder="Other amount" 
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-300 rounded-xl py-3 pl-8 pr-4 font-bold text-[#0F172A] dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all" 
                                        />
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r primary- to-indigo-50 dark:primary- dark:to-indigo-900/10 p-4 rounded-xl border primary- dark:primary- flex items-start gap-3">
                                    <Icons.SparklesIcon className="w-5 h-5 primary- mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold primary- dark:primary- uppercase tracking-wide">Projected Impact</p>
                                        <p className="text-sm text-[#0F172A] dark:text-white mt-1">
                                            Your <strong>{formatCurrency(finalAmount)}</strong> could provide approximately <strong>{Math.max(1, Math.floor(finalAmount / 25))}x assistance units</strong> based on current efficiency rates.
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2 block">Payment Source</label>
                                    <select value={sourceAccountId} onChange={e => setSourceAccountId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-300 text-[#0F172A] dark:text-white p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none">
                                        {accounts.filter(a => a.balance > 0).map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.nickname || acc.type} ({formatCurrency(acc.balance)})</option>
                                        ))}
                                    </select>
                                </div>

                                {error && <p className="text-red-500 text-sm font-bold text-center bg-red-50 dark:bg-red-900 p-2 rounded-lg">{error}</p>}

                                <button onClick={handleDonateClick} className="w-full py-4 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-[0.98]">
                                    Review Contribution
                                </button>
                            </div>
                        )}

                        {step === 'pin' && (
                            <div className="text-center py-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full mb-6">
                                    <Icons.LockClosedIcon className="w-6 h-6 text-[#0F172A] dark:text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Authorize Donation</h3>
                                <p className="text-[#0F172A] mt-2 mb-6">Enter your 4-digit security PIN to confirm a donation of <strong>{formatCurrency(finalAmount)}</strong>.</p>
                                
                                <input 
                                    type="password" 
                                    value={pin} 
                                    onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} 
                                    maxLength={4} 
                                    className="w-48 mx-auto p-3 text-center text-3xl tracking-[1em] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white focus:ring-2 focus:ring-primary outline-none mb-4" 
                                    placeholder="----" 
                                    autoFocus 
                                />
                                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                                
                                <div className="flex gap-3">
                                    <button onClick={() => setStep('amount')} className="flex-1 py-3 text-[#0F172A] dark:text-white font-bold hover:bg-slate-100 dark:hover:bg-white dark:bg-slate-900 rounded-xl transition-colors">Back</button>
                                    <button onClick={handleConfirm} className="flex-1 py-3 bg-primary text-[#0F172A] dark:text-white font-bold rounded-xl shadow-md hover:bg-primary-600 transition-colors">Confirm</button>
                                </div>
                            </div>
                        )}
                        
                        {step === 'processing' && (
                             <div className="text-center py-12">
                                <Icons.SpinnerIcon className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                                <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Processing Transaction...</h3>
                                <p className="text-[#0F172A] mt-2">Securing funds and generating tax receipt.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

// --- Main Component ---

interface GlobalAidProps {
    donations: Donation[];
    onDonate: (causeId: string, amount: number, accountId: string) => boolean;
    accounts: Account[];
    onContactSupport: () => void;
}

export const GlobalAid: React.FC<GlobalAidProps> = ({ donations, onDonate, accounts, onContactSupport }) => {
    const { formatCurrency } = useCurrency();
    const [donatingCause, setDonatingCause] = useState<ExtendedCause | null>(null);
    const [liveTotalRaised, setLiveTotalRaised] = useState(14250890); 
    const [isMatchingModalOpen, setIsMatchingModalOpen] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setLiveTotalRaised(prev => prev + Math.floor(Math.random() * 50) + 10);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const userTotalDonated = useMemo(() => {
        return donations.reduce((sum, d) => sum + d.amount, 0);
    }, [donations]);

    return (
        <div className="space-y-12 pb-12">
            {isMatchingModalOpen && (
                <EmployerMatchingModal onClose={() => setIsMatchingModalOpen(false)} />
            )}

            {donatingCause && (
                <DonationModal
                    cause={donatingCause}
                    accounts={accounts}
                    onClose={() => setDonatingCause(null)}
                    onDonate={onDonate}
                    onContactSupport={onContactSupport}
                />
            )}

            {/* Hero Section */}
            <div className="relative md:rounded-3xl overflow-hidden bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white min-h-[85vh] md:min-h-[500px] flex items-center justify-center text-center px-4 -mx-4 sm:-mx-6 lg:-mx-8 -mt-6">
                <div className="absolute inset-0 z-0">
                     <div 
                        className="absolute inset-0 bg-cover bg-center opacity-40 animate-ken-burns"
                        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1454789548779-d5594f1327f9?q=80&w=2072&auto=format&fit=crop")' }}
                     ></div>
                     <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900"></div>
                </div>
                
                <div className="relative z-10 max-w-3xl animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white  border border-slate-300 dark:border-black/10 text-xs font-bold uppercase tracking-wider mb-6 dark:bg-slate-800">
                        <Icons.GlobeAmericasIcon className="w-4 h-4 primary-" />
                        Global Aid Initiative
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 drop-shadow-xl">
                        Powering Change,<br/>One Transaction at a Time.
                    </h1>
                    <p className="text-xl text-[#0F172A] dark:text-[#1E293B] mb-10 leading-relaxed drop-shadow-md">
                        Join a global network of changemakers. 100% of your donation goes directly to verified causes with zero transaction fees.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
                        <div className="text-center">
                            <p className="text-xs text-[#0F172A] dark:text-white uppercase tracking-widest font-bold mb-1">Total Raised Globally</p>
                            <p className="text-4xl font-mono font-bold text-green-400">{formatCurrency(liveTotalRaised, 'USD').replace(/(\.\d+)/, '')}</p>
                        </div>
                        <div className="hidden sm:block w-px h-12 bg-white dark:bg-slate-800"></div>
                        <div className="text-center">
                            <p className="text-xs text-[#0F172A] dark:text-white uppercase tracking-widest font-bold mb-1">Active Projects</p>
                            <p className="text-4xl font-mono font-bold primary-">142</p>
                        </div>
                    </div>
                </div>
            </div>

            <LiveTicker />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 md:px-0 pt-6">
                <div className="lg:col-span-4 space-y-6">
                    <ImpactCard userTotal={userTotalDonated} />
                    <div className="bg-slate-200 dark:bg-slate-900 rounded-2xl p-6 shadow-digital">
                        <h3 className="font-bold text-[#0F172A] dark:text-white mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <button className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 primary- primary- rounded-lg group-hover:primary- group-hover:text-[#0F172A] dark:text-white transition-colors">
                                        <Icons.ArrowPathIcon className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-semibold text-[#0F172A] dark:text-[#1E293B]">Recurring Giving</span>
                                </div>
                                <Icons.ArrowRightIcon className="w-4 h-4 text-[#0F172A] dark:text-white" />
                            </button>
                            <button className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-50 text-purple-500 rounded-lg group-hover:bg-purple-500 group-hover:text-[#0F172A] dark:text-white transition-colors">
                                        <Icons.PlusCircleIcon className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-semibold text-[#0F172A] dark:text-[#1E293B]">Round-up for Charity</span>
                                </div>
                                <div className="text-xs font-bold text-green-500 bg-green-500 px-2 py-0.5 rounded">Active</div>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8">
                    <div className="flex justify-between items-end mb-6">
                        <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white">Featured Causes</h2>
                        <button className="text-sm font-bold text-primary hover:text-primary-600 transition-colors">View All Projects &rarr;</button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {ENRICHED_CAUSES.map(cause => (
                            <CauseCard key={cause.id} cause={cause} onDonate={setDonatingCause} />
                        ))}
                    </div>

                    <div className="mt-8 primary- rounded-2xl p-8 text-[#0F172A] dark:text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold mb-2">Corporate Matching</h3>
                            <p className="primary- max-w-md">Your employer may match your donation 1:1. Search for your company to double your impact.</p>
                        </div>
                        <button onClick={() => setIsMatchingModalOpen(true)} className="relative z-10 px-6 py-3 bg-white primary- font-bold rounded-xl shadow-lg hover:primary- transition-colors dark:bg-slate-800">
                            Find Employer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
