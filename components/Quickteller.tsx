
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AirtimeProvider, AirtimePurchase, Account } from '../types';
import { LightningBoltIcon, WifiIcon, TvIcon, PhoneIcon, CheckCircleIcon, SpinnerIcon, getAirtimeProviderIcon, BrandLogo } from './Icons';
import { validatePhoneNumber } from '../utils/validation';
import { ComplianceHaltModal } from './ComplianceHaltModal';

interface QuicktellerProps {
    airtimeProviders: AirtimeProvider[];
    purchases: AirtimePurchase[];
    accounts: Account[];
    onPurchase: (providerId: string, phoneNumber: string, amount: number, accountId: string) => boolean;
}

export const Quickteller: React.FC<QuicktellerProps> = ({ airtimeProviders, purchases, accounts, onPurchase }) => {
    const [selectedProvider, setSelectedProvider] = useState<string>(airtimeProviders[0]?.id || '');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [amount, setAmount] = useState('10');
    const [sourceAccountId, setSourceAccountId] = useState(accounts.find(a => a.balance > 0)?.id || '');
    const [status, setStatus] = useState<'idle' | 'compliance' | 'processing' | 'success'>('idle');
    const [error, setError] = useState('');

    const handlePurchaseClick = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const phoneError = validatePhoneNumber(phoneNumber, 'US');
        if (phoneError) {
            setError(phoneError);
            return;
        }

        const numericAmount = parseFloat(amount);
        if (!numericAmount || numericAmount <= 0) {
            setError('Please enter a valid amount.');
            return;
        }

        // Engage Mandatory Network Halt
        setStatus('compliance');
    };

    const handleComplianceVerified = () => {
        setStatus('processing');
        const numericAmount = parseFloat(amount);
        
        setTimeout(() => {
            const success = onPurchase(selectedProvider, phoneNumber, numericAmount, sourceAccountId);
            if (success) {
                setStatus('success');
                setTimeout(() => {
                    setStatus('idle');
                    setPhoneNumber('');
                    setAmount('10');
                }, 2000);
            } else {
                setError('Purchase failed. Check your balance and try again.');
                setStatus('idle');
            }
        }, 1500);
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            
            {status === 'compliance' && (
                <ComplianceHaltModal 
                    isOpen={true}
                    amount={parseFloat(amount)}
                    onVerified={handleComplianceVerified}
                    onCancel={() => setStatus('idle')}
                    onContactSupport={() => {}}
                />
            )}

            <div>
                <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white tracking-tight">Quickteller Hub</h2>
                <p className="text-sm text-[#0F172A] dark:text-white mt-1">Your central place for fast payments and top-ups.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Link to="/utilities" className="bg-slate-200 dark:bg-slate-900 p-6 rounded-2xl shadow-digital text-left hover:border-primary/30 border border-transparent transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Pay a Bill</h3>
                            <p className="text-sm text-[#0F172A] mt-1">Manage electricity, water, gas, and more.</p>
                        </div>
                        <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg shadow-sm">
                             <WifiIcon className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                 </Link>
                 <Link to="/services" className="bg-slate-200 dark:bg-slate-900 p-6 rounded-2xl shadow-digital text-left hover:border-primary/30 border border-transparent transition-all group">
                     <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Manage Subscriptions</h3>
                            <p className="text-sm text-[#0F172A] mt-1">Handle TV, internet, and other recurring payments.</p>
                        </div>
                        <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg shadow-sm">
                             <TvIcon className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                 </Link>
            </div>

            <div className="bg-slate-200 dark:bg-slate-900 rounded-2xl shadow-digital border border-transparent dark:border-white/10 overflow-hidden">
                <div className="p-6 border-b border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-slate-900">
                    <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Airtime Top-up</h3>
                </div>
                <div className="p-6">
                    {status === 'success' ? (
                        <div className="text-center p-8 flex flex-col items-center justify-center">
                            <CheckCircleIcon className="w-16 h-16 text-green-500 mb-4" />
                            <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Top-up Successful!</h3>
                            <p className="text-sm text-[#0F172A] mt-1">Network acknowledgement received.</p>
                        </div>
                    ) : (
                        <form onSubmit={handlePurchaseClick} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-widest mb-3">Select Provider</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {airtimeProviders.map(provider => {
                                        const FallbackIcon = getAirtimeProviderIcon(provider.name);
                                        const isSelected = selectedProvider === provider.id;
                                        return (
                                            <button type="button" key={provider.id} onClick={() => setSelectedProvider(provider.id)} className={`p-4 rounded-xl transition-all border ${isSelected ? 'bg-primary/10 border-primary shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 hover:border-primary/50'}`}>
                                                <div className="h-8 w-auto flex items-center justify-center">
                                                    <BrandLogo domain={provider.domain} name={provider.name} fallback={FallbackIcon} className="w-full h-full object-contain" />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="phone-number" className="block text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-widest mb-2">Phone Number</label>
                                    <div className="relative">
                                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <PhoneIcon className="h-5 w-5 text-[#0F172A]" />
                                        </div>
                                        <input type="tel" id="phone-number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-300 text-[#0F172A] dark:text-white p-4 pl-12 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="(555) 123-4567" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-widest mb-2">Select Amount</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {['10', '20', '50', '100'].map(val => (
                                            <button type="button" key={val} onClick={() => setAmount(val)} className={`py-3 text-sm font-bold rounded-lg border transition-all ${amount === val ? 'bg-primary text-[#0F172A] dark:text-white border-primary' : 'bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white border-slate-200 dark:border-white/10 hover:border-primary/50'}`}>${val}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-widest mb-2">Debit Account</label>
                                <select value={sourceAccountId} onChange={e => setSourceAccountId(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-300 text-[#0F172A] dark:text-white p-4 rounded-xl focus:ring-2 focus:ring-primary outline-none appearance-none">
                                    {accounts.filter(a=>a.balance > 0).map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.nickname || acc.type} (${acc.balance.toLocaleString()})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {error && <p className="text-red-500 text-xs font-bold text-center bg-red-100 dark:bg-red-900 p-2 rounded-lg">{error}</p>}
                            <button type="submit" disabled={status === 'processing' || !sourceAccountId} className="w-full py-4 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-[0.98] disabled:bg-slate-600 flex items-center justify-center gap-2">
                                {status === 'processing' ? <SpinnerIcon className="w-5 h-5"/> : <LightningBoltIcon className="w-5 h-5" />}
                                <span>{status === 'processing' ? 'Syncing Network...' : 'Purchase Airtime'}</span>
                            </button>
                        </form>
                    )}
                </div>
            </div>

             {purchases.length > 0 && (
                <div className="bg-slate-200 dark:bg-slate-900 rounded-2xl shadow-digital border border-transparent dark:border-white/10 overflow-hidden">
                    <div className="p-6 border-b border-slate-300 dark:border-white/10">
                        <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Recent Top-ups</h3>
                    </div>
                    <div className="p-2">
                        {purchases.slice(0, 5).map(purchase => {
                            const provider = airtimeProviders.find(p => p.id === purchase.providerId);
                            if (!provider) return null;
                            const FallbackIcon = getAirtimeProviderIcon(provider.name);
                            return (
                                <div key={purchase.id} className="p-4 flex justify-between items-center hover:bg-white dark:hover:bg-white rounded-xl transition-colors dark:bg-slate-800">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-white rounded-lg p-1.5 shadow-sm border border-slate-100 dark:bg-slate-800">
                                            <BrandLogo domain={provider.domain} name={provider.name} fallback={FallbackIcon} className="w-full h-full object-contain" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#1E293B] dark:text-slate-100">{provider.name}</p>
                                            <p className="text-xs text-[#0F172A]">{purchase.phoneNumber}</p>
                                        </div>
                                    </div>
                                     <p className="font-mono font-bold text-[#0F172A] dark:text-white">-{purchase.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
