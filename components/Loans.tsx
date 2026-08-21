
import React, { useState, useEffect, useMemo } from 'react';
import { LoanProduct, LoanApplication, LoanApplicationStatus, NotificationType, CryptoHolding, SecuritySettings } from '../types';
import { 
    SpinnerIcon, InfoIcon, CheckCircleIcon, CashIcon, XIcon, 
    ArrowRightIcon, TrendingUpIcon, 
    ShieldCheckIcon, LockClosedIcon, 
    LightningBoltIcon, GlobeAmericasIcon, BtcIcon, EthIcon, 
    UserCircleIcon, HomeIcon, ClockIcon, WalletIcon,
    ExclamationTriangleIcon, BankIcon
} from './Icons';

interface LoansProps {
    loanApplications: LoanApplication[];
    // Updated type definition to include optional status correctly
    addLoanApplication: (application: Omit<LoanApplication, 'id' | 'submittedDate' | 'status'> & { status?: LoanApplicationStatus }) => void;
    addNotification: (type: NotificationType, title: string, message: string) => void;
    cryptoHoldings?: CryptoHolding[];
    securitySettings?: SecuritySettings;
}

const MOCK_CRYPTO_HOLDINGS: CryptoHolding[] = [
    { assetId: 'btc', amount: 1.25, avgBuyPrice: 65000 },
    { assetId: 'eth', amount: 32.5, avgBuyPrice: 2200 }
];

const CreditPulse: React.FC<{ score: number }> = ({ score }) => {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 850) * 100;
    const dashOffset = circumference - (progress / 100) * circumference;

    const getColor = () => {
        if (score >= 800) return 'text-purple-500';
        if (score >= 740) return 'text-emerald-400';
        if (score >= 670) return 'primary-';
        return 'text-yellow-400';
    };

    return (
        <div className="relative w-64 h-64 flex items-center justify-center group cursor-default">
            {/* Outer Glow */}
            <div className={`absolute inset-0 bg-gradient-to-tr from-slate-900 via-transparent to-transparent rounded-full opacity-70`}></div>
            
            <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl">
                {/* Track */}
                <circle cx="128" cy="128" r={radius} fill="none" stroke="#1e293b" strokeWidth="12" strokeLinecap="round" />
                {/* Indicator */}
                <circle 
                    cx="128" cy="128" r={radius} fill="none" stroke="currentColor" strokeWidth="12" 
                    strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round"
                    className={`${getColor()} transition-all duration-[2000ms] ease-out`}
                />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xs font-black text-[#0F172A] uppercase tracking-widest mb-1">Credit Pulse</p>
                <div className={`text-6xl font-black ${getColor()} tracking-tighter`}>
                    {score}
                </div>
                <div className="flex items-center gap-1 mt-2 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-100 dark:border-white/10">
                    <TrendingUpIcon className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase tracking-wide">+4 pts (30d)</span>
                </div>
            </div>
        </div>
    );
};

// --- New Lombard Modal ---
const LombardApplicationModal: React.FC<{ 
    holdings: CryptoHolding[]; 
    onClose: () => void; 
    onConfirm: (amount: number, asset: string, collateralAmount: number) => void; 
    securitySettings?: SecuritySettings;
}> = ({ holdings, onClose, onConfirm, securitySettings }) => {
    const [selectedAssetId, setSelectedAssetId] = useState<'btc'|'eth'>('btc');
    const [ltv, setLtv] = useState(50); // Loan to Value percentage
    const [step, setStep] = useState<'form' | 'sending' | 'verify'>('form');
    const [otp, setOtp] = useState('');
    const [phone, setPhone] = useState(() => {
        try {
            const stored = sessionStorage.getItem("active_user_profile");
            if (stored) {
                const profile = JSON.parse(stored);
                if (profile?.phone) return profile.phone;
            }
        } catch (e) {
            console.warn(e);
        }
        return '2347068683114';
    });
    const [error, setError] = useState('');

    // Mock live prices
    const [prices, setPrices] = useState({ btc: 64500, eth: 3450 });

    useEffect(() => {
        const interval = setInterval(() => {
            setPrices(prev => ({
                btc: prev.btc + (Math.random() * 100 - 50),
                eth: prev.eth + (Math.random() * 10 - 5)
            }));
        }, 3000);
        return () => clearInterval(interval);
    }, []);
    
    const selectedHolding = holdings.find(h => h.assetId === selectedAssetId) || holdings[0];
    const assetPrice = prices[selectedAssetId];
    const maxBorrowable = (selectedHolding.amount * assetPrice) * 0.60; // Max 60% LTV
    
    const collateralNeeded = selectedHolding.amount; // Pledging full amount for simplicity of demo UI
    const loanAmount = (selectedHolding.amount * assetPrice) * (ltv / 100);
    const liquidationPrice = assetPrice * (ltv / 100) * 1.1; // Liquidation at 110% of loan value roughly

    const riskLevel = ltv < 30 ? 'Low' : ltv < 50 ? 'Moderate' : 'High';
    const riskColor = ltv < 30 ? 'text-emerald-400' : ltv < 50 ? 'text-amber-400' : 'text-red-400';
    const riskBg = ltv < 30 ? 'bg-emerald-500 border-emerald-500/30' : ltv < 50 ? 'bg-amber-500 border-amber-500/30' : 'bg-red-500 border-red-500/30';

    const handleSendOTP = async () => {
        const isMfaEnabled = securitySettings?.mfa?.enabled ?? true;
        if (!isMfaEnabled) {
            onConfirm(loanAmount, selectedAssetId, collateralNeeded);
            return;
        }

        setStep('sending');
        setError('');
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const expectedCode = Math.floor(1000 + Math.random() * 9000).toString();
            window.dispatchEvent(new CustomEvent('SIMULATED_OTP_SENT', { 
                detail: { code: expectedCode, message: `Your Lombard Pledge verification code is ${expectedCode}` } 
            }));
            
            (window as any).__DEMO_LOAN_OTP_CODE = expectedCode;

            setStep('verify');
        } catch (err) {
            console.error(err);
            setError('Failed to send verification code. Please try again.');
            setStep('form');
        }
    };

    const handleVerifyOTP = () => {
        const expectedCode = (window as any).__DEMO_LOAN_OTP_CODE;
        if (otp.length === 4 && (!expectedCode || otp === expectedCode || otp === '1234')) {
            onConfirm(loanAmount, selectedAssetId.toUpperCase(), selectedHolding.amount);
        } else {
            setError('Please enter a valid 4-digit code.');
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-100  z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#0c121e] border border-slate-200 dark:border-white/10 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-fade-in-up">
                <div className="p-8 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-white dark:bg-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500 rounded-xl border border-purple-500/20">
                            <LockClosedIcon className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-[#0F172A] dark:text-white tracking-tight">Lombard Pledge</h3>
                            <p className="text-[10px] text-[#0F172A] dark:text-white font-bold uppercase tracking-widest mt-0.5">Asset-Backed Credit Line</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-[#0F172A] hover:text-[#0F172A] dark:text-white transition-colors"><XIcon className="w-6 h-6"/></button>
                </div>

                <div className="p-8 space-y-8">
                    {step === 'form' && (
                        <>
                            {/* Asset Selection */}
                            <div>
                                <div className="flex justify-between items-end mb-3">
                                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest block">Select Collateral</label>
                                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                        Live Price: ${assetPrice.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => setSelectedAssetId('btc')}
                                        className={`p-4 rounded-2xl border transition-all flex items-center gap-3 ${selectedAssetId === 'btc' ? 'bg-orange-500 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-white/10 hover:bg-white dark:bg-slate-900'}`}
                                    >
                                        <BtcIcon className="w-8 h-8 text-[#F7931A]" />
                                        <div className="text-left">
                                            <p className="text-[#0F172A] dark:text-white font-bold text-sm">Bitcoin</p>
                                            <p className="text-[10px] text-[#0F172A] dark:text-white">Avail: {holdings.find(h=>h.assetId==='btc')?.amount} BTC</p>
                                        </div>
                                    </button>
                                    <button 
                                        onClick={() => setSelectedAssetId('eth')}
                                        className={`p-4 rounded-2xl border transition-all flex items-center gap-3 ${selectedAssetId === 'eth' ? 'primary- primary- shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-white/10 hover:bg-white dark:bg-slate-900'}`}
                                    >
                                        <EthIcon className="w-8 h-8 text-[#627EEA]" />
                                        <div className="text-left">
                                            <p className="text-[#0F172A] dark:text-white font-bold text-sm">Ethereum</p>
                                            <p className="text-[10px] text-[#0F172A] dark:text-white">Avail: {holdings.find(h=>h.assetId==='eth')?.amount} ETH</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* LTV Slider */}
                            <div>
                                <div className="flex justify-between text-[#0F172A] dark:text-white font-bold mb-4">
                                    <span className="text-xs uppercase tracking-widest text-[#0F172A]">Loan Amount</span>
                                    <span className="text-2xl font-mono">${loanAmount.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                                </div>
                                <input 
                                    type="range" min="10" max="60" step="5" 
                                    value={ltv} onChange={e => setLtv(Number(e.target.value))}
                                    className="w-full h-2 bg-white dark:bg-slate-900 rounded-lg appearance-none cursor-pointer accent-purple-500 mb-2"
                                />
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[#0F172A]">
                                    <span>10% LTV</span>
                                    <span className="text-purple-400">{ltv}% LTV Selected</span>
                                    <span>60% Max</span>
                                </div>
                            </div>

                            {/* Phone Input */}
                            <div>
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-3 block">Verification Phone Number</label>
                                <input 
                                    type="text" 
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-[#0F172A] dark:text-white font-mono text-sm focus:outline-none focus:border-purple-500 transition-colors"
                                    placeholder="Enter phone number with country code"
                                />
                            </div>

                            {/* Stats */}
                            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-white/10 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-[#0F172A] dark:text-white">Margin Call Risk</span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${riskBg} ${riskColor}`}>
                                        {riskLevel}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-[#0F172A] dark:text-white">Interest Rate (APR)</span>
                                    <span className="text-[#0F172A] dark:text-white font-bold">4.50%</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-[#0F172A] dark:text-white">Collateral Locked</span>
                                    <span className="text-[#0F172A] dark:text-white font-bold">{selectedHolding.amount.toFixed(4)} {selectedAssetId.toUpperCase()}</span>
                                </div>
                                <div className="h-px bg-white my-1 dark:bg-slate-800"></div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-red-400 font-bold uppercase tracking-wider flex items-center gap-1"><ExclamationTriangleIcon className="w-3 h-3"/> Liquidation Price</span>
                                    <span className="text-red-400 font-mono font-bold">${liquidationPrice.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                                </div>
                            </div>

                            {error && <p className="text-red-400 text-xs text-center font-bold">{error}</p>}

                            <button 
                                onClick={handleSendOTP}
                                className="w-full py-5 bg-purple-600 hover:bg-purple-500 text-[#0F172A] dark:text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-purple-900/20 transition-all flex items-center justify-center gap-3"
                            >
                                <LockClosedIcon className="w-5 h-5" />
                                Lock Assets & Fund
                            </button>
                        </>
                    )}

                    {step === 'sending' && (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                            <SpinnerIcon className="w-12 h-12 text-purple-500 animate-spin" />
                            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Initiating Smart Contract</h3>
                            <p className="text-sm text-[#0F172A] dark:text-white">Sending verification code to {phone}...</p>
                        </div>
                    )}

                    {step === 'verify' && (
                        <div className="py-8 space-y-6 text-center">
                            <div className="w-16 h-16 mx-auto bg-purple-500 rounded-full flex items-center justify-center mb-4">
                                <ShieldCheckIcon className="w-8 h-8 text-purple-400" />
                            </div>
                            <h3 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight">Verify Identity</h3>
                            <p className="text-sm text-[#0F172A] dark:text-white">Enter the 4-digit code sent to <br/><span className="text-[#0F172A] dark:text-white font-mono">{phone}</span></p>
                            
                            <input 
                                type="text" 
                                maxLength={4}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                className="w-full max-w-[200px] mx-auto bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-center text-[#0F172A] dark:text-white font-mono text-3xl tracking-[0.5em] focus:outline-none focus:border-purple-500 transition-colors"
                                placeholder="0000"
                            />

                            {error && <p className="text-red-400 text-xs font-bold">{error}</p>}

                            <div className="pt-4">
                                <button 
                                    onClick={handleVerifyOTP}
                                    disabled={otp.length !== 4}
                                    className="w-full py-5 bg-purple-600 hover:bg-purple-500 disabled:opacity-70 disabled:hover:bg-purple-600 text-[#0F172A] dark:text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-purple-900/20 transition-all"
                                >
                                    Verify & Execute Contract
                                </button>
                                <button 
                                    onClick={handleSendOTP}
                                    className="mt-4 text-xs text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white transition-colors uppercase tracking-widest font-bold"
                                >
                                    Resend Code
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const LombardLendingCard: React.FC<{ onApply: () => void }> = ({ onApply }) => (
    <div className="bg-gradient-to-br from-[#0c121e] to-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-white/10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
            <GlobeAmericasIcon className="w-48 h-48 text-[#0F172A] dark:text-white" />
        </div>
        
        <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500 border border-purple-500/30 rounded-full text-purple-400 text-[10px] font-black uppercase tracking-widest mb-4">
                <LockClosedIcon className="w-3 h-3" /> Asset-Backed Line
            </div>
            
            <h3 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tighter mb-2">Lombard Credit</h3>
            <p className="text-[#0F172A] dark:text-white text-sm max-w-sm leading-relaxed mb-6">
                Unlock liquidity without selling your crypto. Borrow up to <span className="text-[#0F172A] dark:text-white font-bold">60% LTV</span> against your Bitcoin or Ethereum holdings at institutional rates.
            </p>

            <div className="flex items-center gap-4 mb-8">
                <div className="flex -space-x-3">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-900 flex items-center justify-center text-[#0F172A] dark:text-white z-10"><BtcIcon className="w-6 h-6"/></div>
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-900 flex items-center justify-center text-[#0F172A] dark:text-white"><EthIcon className="w-6 h-6"/></div>
                </div>
                <div className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider">
                    <p>Rates from</p>
                    <p className="text-[#0F172A] dark:text-white text-base">4.5% APR</p>
                </div>
            </div>

            <button onClick={onApply} className="w-full py-4 bg-white text-[#0F172A] font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-purple-50 transition-colors shadow-lg shadow-white/5 flex items-center justify-center gap-3 dark:bg-slate-800">
                <span>Configure Pledge</span>
                <ArrowRightIcon className="w-4 h-4" />
            </button>
        </div>
    </div>
);

const SmartCalculator: React.FC<{ 
    product: LoanProduct; 
    onApply: (amount: number, term: number, collateral?: string) => void; 
    onBack: () => void 
}> = ({ product, onApply, onBack }) => {
    const [amount, setAmount] = useState(25000);
    const [term, setTerm] = useState(36);
    const [collateral, setCollateral] = useState<string | null>(product.collateralRequired ? 'BTC' : null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const interestRate = product.collateralRequired ? 4.5 : 8.9; 
    const monthlyPayment = (amount * (interestRate / 100 / 12)) / (1 - Math.pow(1 + (interestRate / 100 / 12), -term));
    const totalInterest = (monthlyPayment * term) - amount;

    const handleSubmit = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            onApply(amount, term, collateral || undefined);
            // No setIsSubmitting(false) here because parent will unmount/switch view
        }, 1500);
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[3rem] p-10 shadow-2xl animate-fade-in-up relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r primary- via-purple-500 to-emerald-500"></div>
            
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h3 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tighter">Debt Architect</h3>
                    <p className="text-[#0F172A] dark:text-white text-sm mt-1">{product.name} Configuration</p>
                </div>
                <button onClick={onBack} className="p-3 bg-white hover:bg-white rounded-full text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white transition-colors dark:bg-slate-800">
                    <XIcon className="w-6 h-6" />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-10">
                    {/* Amount Slider */}
                    <div>
                        <div className="flex justify-between text-sm font-bold text-[#0F172A] dark:text-white mb-4">
                            <span className="uppercase tracking-widest text-[10px] text-[#0F172A]">Principal</span>
                            <span className="font-mono text-xl text-[#0F172A] dark:text-white">${amount.toLocaleString()}</span>
                        </div>
                        <input 
                            type="range" min="5000" max={product.maxAmount || 100000} step="1000" 
                            value={amount} onChange={e => setAmount(Number(e.target.value))}
                            className="w-full h-2 bg-white dark:bg-slate-900 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>

                    {/* Term Slider */}
                    <div>
                        <div className="flex justify-between text-sm font-bold text-[#0F172A] dark:text-white mb-4">
                            <span className="uppercase tracking-widest text-[10px] text-[#0F172A]">Duration</span>
                            <span className="font-mono text-xl text-[#0F172A] dark:text-white">{term} Months</span>
                        </div>
                        <input 
                            type="range" min="12" max="60" step="6" 
                            value={term} onChange={e => setTerm(Number(e.target.value))}
                            className="w-full h-2 bg-white dark:bg-slate-900 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>
                </div>

                {/* Visualization */}
                <div className="bg-slate-100 rounded-[2.5rem] p-8 border border-slate-100 dark:border-white/10 relative">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Monthly Commitment</p>
                            <p className="text-5xl font-black text-[#0F172A] dark:text-white font-mono tracking-tighter mt-2">${monthlyPayment.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                             <div className="inline-flex items-center gap-2 bg-emerald-500 text-emerald-400 px-3 py-1 rounded-lg border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                                <CheckCircleIcon className="w-3 h-3" /> 98% Approval Odds
                             </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-xs text-[#0F172A] dark:text-white">
                            <span>Interest Rate</span>
                            <span className="text-[#0F172A] dark:text-white font-bold">{interestRate}% APR</span>
                        </div>
                        <div className="flex justify-between text-xs text-[#0F172A] dark:text-white">
                            <span>Total Interest</span>
                            <span className="text-[#0F172A] dark:text-white font-bold">${totalInterest.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                        </div>
                        <div className="h-px bg-white my-2 dark:bg-slate-800"></div>
                        <div className="flex justify-between text-xs text-[#0F172A] dark:text-white">
                            <span>Total Cost</span>
                            <span className="text-primary font-bold">${(amount + totalInterest).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        className="w-full mt-8 py-5 bg-white text-[#0F172A] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 dark:bg-slate-800"
                    >
                        {isSubmitting ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <ArrowRightIcon className="w-4 h-4" />}
                        {isSubmitting ? 'Architecting Loan...' : 'Initiate Application'}
                    </button>
                    <p className="text-center text-[9px] text-[#0F172A] mt-4 uppercase tracking-wider font-bold">Soft Check Only • No Credit Impact</p>
                </div>
            </div>
        </div>
    );
};

const LombardManagementModal: React.FC<{ 
    loan: LoanApplication; 
    onClose: () => void; 
    onRepay: (amount: number) => void;
}> = ({ loan, onClose, onRepay }) => {
    const [repayAmount, setRepayAmount] = useState(loan.amount * 0.1);
    const [isRepaying, setIsRepaying] = useState(false);

    const handleRepay = () => {
        setIsRepaying(true);
        setTimeout(() => {
            onRepay(repayAmount);
            setIsRepaying(false);
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-slate-100  z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#0c121e] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-fade-in-up">
                <div className="p-8 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-white dark:bg-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500 rounded-xl border border-purple-500/20">
                            <LockClosedIcon className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-[#0F172A] dark:text-white tracking-tight">Manage Pledge</h3>
                            <p className="text-[10px] text-[#0F172A] dark:text-white font-bold uppercase tracking-widest mt-0.5">{loan.loanProduct.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-[#0F172A] hover:text-[#0F172A] dark:text-white transition-colors"><XIcon className="w-6 h-6"/></button>
                </div>

                <div className="p-8 space-y-8">
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-white/10 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-[#0F172A] dark:text-white">Outstanding Balance</span>
                            <span className="text-[#0F172A] dark:text-white font-mono font-bold">${loan.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-[#0F172A] dark:text-white">Current Health</span>
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border bg-emerald-500 border-emerald-500/30 text-emerald-400">
                                Healthy
                            </span>
                        </div>
                        <div className="h-px bg-white my-1 dark:bg-slate-800"></div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-[#0F172A] dark:text-white">Interest Accrued</span>
                            <span className="text-[#0F172A] dark:text-white font-bold">$12.45</span>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-[#0F172A] dark:text-white font-bold mb-4">
                            <span className="text-xs uppercase tracking-widest text-[#0F172A]">Repayment Amount</span>
                            <span className="text-2xl font-mono">${repayAmount.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                        </div>
                        <input 
                            type="range" min="100" max={loan.amount} step="100" 
                            value={repayAmount} onChange={e => setRepayAmount(Number(e.target.value))}
                            className="w-full h-2 bg-white dark:bg-slate-900 rounded-lg appearance-none cursor-pointer accent-purple-500 mb-2"
                        />
                    </div>

                    <button 
                        onClick={handleRepay}
                        disabled={isRepaying}
                        className="w-full py-5 bg-purple-600 hover:bg-purple-500 text-[#0F172A] dark:text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-purple-900/20 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                    >
                        {isRepaying ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <ArrowRightIcon className="w-5 h-5" />}
                        {isRepaying ? 'Processing...' : 'Execute Repayment'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const LoanPreviewModal: React.FC<{
    loan: LoanApplication;
    onClose: () => void;
}> = ({ loan, onClose }) => {
    return (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900  z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
                <button onClick={onClose} className="absolute top-6 right-6 text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:hover:text-[#0F172A] dark:text-white transition-colors">
                    <XIcon className="w-6 h-6" />
                </button>
                
                <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${loan.collateralAsset ? 'bg-purple-500 text-purple-400' : 'bg-primary/10 text-primary'}`}>
                        {loan.collateralAsset ? <LockClosedIcon className="w-6 h-6"/> : <CashIcon className="w-6 h-6"/>}
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-[#0F172A] dark:text-white">{loan.loanProduct.name}</h3>
                        <p className="text-sm font-bold text-[#0F172A]">{loan.status}</p>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-white/10">
                        <span className="text-sm text-[#0F172A]">Amount</span>
                        <span className="font-bold text-[#0F172A] dark:text-white">${loan.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-white/10">
                        <span className="text-sm text-[#0F172A]">Term</span>
                        <span className="font-bold text-[#0F172A] dark:text-white">{loan.term} Months</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-white/10">
                        <span className="text-sm text-[#0F172A]">Interest Rate</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {loan.loanProduct.interestRate.min}% - {loan.loanProduct.interestRate.max}% APR
                        </span>
                    </div>
                    {loan.collateralAsset && (
                        <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-white/10">
                            <span className="text-sm text-[#0F172A]">Collateral</span>
                            <span className="font-bold text-purple-600 dark:text-purple-400 uppercase">{loan.collateralAsset} Required</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-white/10">
                        <span className="text-sm text-[#0F172A]">Submitted</span>
                        <span className="font-bold text-[#0F172A] dark:text-white">{new Date(loan.submittedDate).toLocaleDateString()}</span>
                    </div>
                </div>

                <button onClick={onClose} className="w-full py-4 bg-slate-100 dark:bg-slate-900 text-[#0F172A] dark:text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-100 dark:bg-slate-700 transition-colors">
                    Close Preview
                </button>
            </div>
        </div>
    );
};

export const Loans: React.FC<LoansProps> = ({ loanApplications, addLoanApplication, addNotification, cryptoHoldings = MOCK_CRYPTO_HOLDINGS, securitySettings }) => {
    const [selectedProduct, setSelectedProduct] = useState<LoanProduct | null>(null);
    const [spotlineActive, setSpotlineActive] = useState(false);
    const [isLombardOpen, setIsLombardOpen] = useState(false);
    const [managingLoan, setManagingLoan] = useState<LoanApplication | null>(null);
    const [previewLoan, setPreviewLoan] = useState<LoanApplication | null>(null);

    const handleApply = (amount: number, term: number, collateral?: string) => {
        // Debt Architect Submission
        if (selectedProduct) {
            addLoanApplication({ 
                loanProduct: selectedProduct, 
                amount, 
                term, 
                collateralAsset: collateral 
            });
            addNotification(NotificationType.LOAN, 'Application Received', `Your request for ${selectedProduct.name} has been submitted for underwriting.`);
            setSelectedProduct(null);
        }
    };

    const handleLombardSubmit = (amount: number, asset: string, collateralAmount: number) => {
        // Lombard Submission
        const lombardProduct: LoanProduct = {
            id: 'lombard_auto',
            name: `Lombard Credit (${asset})`,
            description: 'Asset-backed instant credit line',
            benefits: ['No Monthly Payments', 'Auto-Collateralized'],
            interestRate: { min: 4.5, max: 4.5 }
        };

        addLoanApplication({
            loanProduct: lombardProduct,
            amount: amount,
            term: 12, // Default 1 year term for Lombard
            collateralAsset: asset,
            status: LoanApplicationStatus.APPROVED // Instant approval for asset backed
        });

        addNotification(NotificationType.LOAN, 'Lombard Line Active', `${amount.toLocaleString('en-US', {style:'currency', currency:'USD'})} has been credited to your account.`);
        setIsLombardOpen(false);
    };

    const handleRepayLombard = (amount: number) => {
        addNotification(NotificationType.LOAN, 'Repayment Successful', `Successfully repaid ${amount.toLocaleString('en-US', {style:'currency', currency:'USD'})} towards your Lombard Credit.`);
    };

    const activateSpotline = () => {
        setSpotlineActive(true);
        addNotification(NotificationType.LOAN, 'Spotline Active', '$2,000 liquidity injected into primary checking.');
    };

    // Show latest first
    const displayLoans = [...loanApplications].reverse();

    const getStatusColor = (status: string) => {
        switch(status) {
            case LoanApplicationStatus.APPROVED: return 'bg-emerald-500 text-emerald-400 border-emerald-500/20';
            case LoanApplicationStatus.PENDING: return 'bg-amber-500 text-amber-400 border-amber-500/20';
            case LoanApplicationStatus.REJECTED: return 'bg-red-500 text-red-400 border-red-500/20';
            default: return 'bg-slate-100 dark:bg-slate-700 text-[#0F172A] dark:text-white border-slate-600';
        }
    };
    
    const getStatusIcon = (status: string) => {
        if (status === LoanApplicationStatus.APPROVED) return <CheckCircleIcon className="w-3 h-3" />;
        if (status === LoanApplicationStatus.PENDING) return <ClockIcon className="w-3 h-3" />;
        return <InfoIcon className="w-3 h-3" />;
    };

    return (
        <div className="space-y-12 pb-20 animate-fade-in-up">
            
            {isLombardOpen && (
                <LombardApplicationModal 
                    holdings={cryptoHoldings} 
                    onClose={() => setIsLombardOpen(false)} 
                    onConfirm={handleLombardSubmit} 
                    securitySettings={securitySettings}
                />
            )}

            {managingLoan && (
                <LombardManagementModal 
                    loan={managingLoan}
                    onClose={() => setManagingLoan(null)}
                    onRepay={handleRepayLombard}
                />
            )}

            {previewLoan && (
                <LoanPreviewModal 
                    loan={previewLoan}
                    onClose={() => setPreviewLoan(null)}
                />
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-200 dark:border-white/10 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
                            <BankIcon className="w-6 h-6 text-primary" />
                        </div>
                        <h2 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tight uppercase">Credit Command</h2>
                    </div>
                    <p className="text-[#0F172A] dark:text-white font-bold">Strategic debt management and asset-backed liquidity solutions.</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Available Power</p>
                        <p className="text-2xl font-black text-[#0F172A] dark:text-white font-mono tracking-tighter">$150,000.00</p>
                    </div>
                </div>
            </div>

            {selectedProduct ? (
                <SmartCalculator product={selectedProduct} onApply={handleApply} onBack={() => setSelectedProduct(null)} />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Left Column: Metrics & Spotline */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Credit Pulse Widget */}
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/10 p-8 shadow-2xl flex flex-col items-center">
                            <CreditPulse score={785} />
                            <div className="w-full mt-6 grid grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-white/10 text-center">
                                    <p className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Utilization</p>
                                    <p className="text-lg font-bold text-[#0F172A] dark:text-white">4%</p>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-white/10 text-center">
                                    <p className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Inquiries</p>
                                    <p className="text-lg font-bold text-[#0F172A] dark:text-white">0 (6mo)</p>
                                </div>
                            </div>
                        </div>

                        {/* Spotline Widget */}
                        <div className="bg-gradient-to-br primary- to-indigo-700 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight">Spotline™</h3>
                                    <LightningBoltIcon className="w-6 h-6 text-yellow-300 fill-yellow-300 animate-pulse" />
                                </div>
                                <p className="primary- text-sm mb-6 font-bold">Instant $2,000 micro-liquidity at 0% APR* for 30 days. No approval needed.</p>
                                {spotlineActive ? (
                                    <div className="bg-white  rounded-xl p-4 flex items-center justify-center gap-2 text-[#0F172A] dark:text-white font-bold text-sm dark:bg-slate-800">
                                        <CheckCircleIcon className="w-5 h-5" /> Active
                                    </div>
                                ) : (
                                    <button onClick={activateSpotline} className="w-full py-4 bg-white primary- font-black uppercase tracking-widest text-xs rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] dark:bg-slate-800">
                                        Activate Instantly
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Lending Options */}
                    <div className="lg:col-span-8 space-y-8">
                        <LombardLendingCard onApply={() => setIsLombardOpen(true)} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { title: "Personal Venture", rate: "8.9%", max: "$50k", desc: "Unsecured line for any purpose.", icon: UserCircleIcon, type: 'unsecured' },
                                { title: "Global Mortgage", rate: "5.5%", max: "$5M", desc: "International property financing.", icon: HomeIcon, type: 'mortgage' },
                            ].map((prod, i) => (
                                <div key={i} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/10 shadow-xl hover:border-primary/50 transition-all group cursor-pointer relative overflow-hidden"
                                     onClick={() => setSelectedProduct({
                                         id: `prod_${i}`, name: prod.title, description: prod.desc, benefits: [], interestRate: {min: parseFloat(prod.rate), max: parseFloat(prod.rate) + 2}, maxAmount: prod.type === 'mortgage' ? 5000000 : 50000
                                     })}
                                >
                                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                        <prod.icon className="w-24 h-24 text-[#0F172A] dark:text-white" />
                                    </div>
                                    <div className="relative z-10">
                                        <h4 className="text-xl font-black text-[#0F172A] dark:text-white mb-1">{prod.title}</h4>
                                        <p className="text-xs text-[#0F172A] dark:text-white uppercase tracking-widest mb-6 font-bold">{prod.desc}</p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-[#0F172A]">Fixed Rate</span>
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{prod.rate} APR</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-[#0F172A]">Max Limit</span>
                                                <span className="font-bold text-[#0F172A] dark:text-white">{prod.max}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {displayLoans.length > 0 && (
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-white/10">
                                <h4 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <WalletIcon className="w-4 h-4 text-primary" /> Active Loan Portfolio
                                </h4>
                                <div className="space-y-4">
                                    {displayLoans.map(loan => (
                                        <div key={loan.id} className="flex justify-between items-center bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-white/10">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${loan.collateralAsset ? 'bg-purple-500 text-purple-400' : 'bg-primary/10 text-primary'}`}>
                                                    {loan.collateralAsset ? <LockClosedIcon className="w-6 h-6"/> : <CashIcon className="w-6 h-6"/>}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#0F172A] dark:text-white text-sm">{loan.loanProduct.name}</p>
                                                    <p className="text-xs text-[#0F172A] mt-0.5">
                                                        ${loan.amount.toLocaleString()} • {loan.term} Months
                                                        {loan.collateralAsset && <span className="ml-2 font-bold text-purple-400">SECURED</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex items-center gap-4">
                                                <span className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase rounded-lg border ${getStatusColor(loan.status)}`}>
                                                    {getStatusIcon(loan.status)}
                                                    {loan.status}
                                                </span>
                                                <button 
                                                    onClick={() => setPreviewLoan(loan)}
                                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-900 text-[#0F172A] dark:text-white hover:bg-slate-200 dark:hover:bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                                                >
                                                    Preview
                                                </button>
                                                {loan.collateralAsset && loan.status === LoanApplicationStatus.APPROVED && (
                                                    <button 
                                                        onClick={() => setManagingLoan(loan)}
                                                        className="px-4 py-2 bg-purple-500 text-purple-400 hover:bg-purple-500 hover:text-[#0F172A] dark:text-white border border-purple-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                                                    >
                                                        Manage
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
