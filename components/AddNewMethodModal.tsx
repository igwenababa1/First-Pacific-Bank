
import React, { useState, useMemo, useEffect } from 'react';
import { 
    XIcon, 
    SearchIcon, 
    BankIcon, 
    CheckCircleIcon, 
    SpinnerIcon, 
    ShieldCheckIcon, 
    LockClosedIcon, 
    GlobeAmericasIcon,
    getBankIcon,
    getServiceIcon,
    ServerIcon,
    BtcIcon,
    EthIcon,
    SolIcon,
    ArrowsRightLeftIcon,
    ChevronRightIcon,
    ArrowLeftIcon,
    WifiIcon,
    Terminal,
    WalletIcon,
    PremiumReservedBankLogo
} from './Icons';
import { establishSecureConnection, getServiceUrl } from '../services/secureRoutingService';

interface AddNewMethodModalProps {
    onClose: () => void;
    onAdd: (methodId: string, name: string, type: 'BANK' | 'SERVICE' | 'CRYPTO') => void;
}

const FEATURED_BANKS = [
    "Chase Bank", "Bank of America", "Wells Fargo", "Citibank", "Capital One", "Barclays", "HSBC", "Deutsche Bank", "Standard Chartered", "N26", "Česká spořitelna", "Erste Group", "Raiffeisenbank"
];

const FEATURED_SERVICES = [
    "PayPal", "Wise", "Revolut", "Venmo", "Payoneer", "Skrill", "Zelle", "CashApp"
];

const FEATURED_CRYPTO = [
    { name: "Bitcoin", symbol: "BTC", icon: BtcIcon },
    { name: "Ethereum", symbol: "ETH", icon: EthIcon },
    { name: "Solana", symbol: "SOL", icon: SolIcon }
];

type PaymentMethodItem = {
    id: string;
    name: string;
    type: 'BANK' | 'SERVICE' | 'CRYPTO';
    symbol?: string;
};

type Step = 'select' | 'details' | 'connecting' | 'success';

const connectionLogs = [
    "Initializing secure handshake (TLS 1.3)...",
    "Verifying institutional node credentials...",
    "Establishing encrypted tunnel (AES-256)...",
    "Validating settlement protocols...",
    "Syncing historical ledger metadata...",
    "Finalizing network connection...",
    "Success: Secure Node Integrated."
];

export const AddNewMethodModal: React.FC<AddNewMethodModalProps> = ({ onClose, onAdd }) => {
    const [step, setStep] = useState<Step>('select');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'ALL' | 'BANKS' | 'SERVICES' | 'CRYPTO'>('ALL');
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethodItem | null>(null);
    const [logIndex, setLogIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    // Form data
    const [details, setDetails] = useState({
        accountNumber: '',
        routingNumber: '',
        swiftBic: '',
        walletAddress: '',
        userId: '',
        network: 'Mainnet'
    });

    const filteredMethods = useMemo(() => {
        const term = searchTerm.toLowerCase();
        const methods: PaymentMethodItem[] = [];

        if (activeTab === 'ALL' || activeTab === 'BANKS') {
            FEATURED_BANKS.forEach(bank => {
                if (bank.toLowerCase().includes(term)) {
                    methods.push({ id: bank, name: bank, type: 'BANK' });
                }
            });
        }

        if (activeTab === 'ALL' || activeTab === 'SERVICES') {
            FEATURED_SERVICES.forEach(service => {
                if (service.toLowerCase().includes(term)) {
                    methods.push({ id: service, name: service, type: 'SERVICE' });
                }
            });
        }

        if (activeTab === 'ALL' || activeTab === 'CRYPTO') {
            FEATURED_CRYPTO.forEach(crypto => {
                if (crypto.name.toLowerCase().includes(term) || crypto.symbol.toLowerCase().includes(term)) {
                    methods.push({ id: crypto.name, name: crypto.name, type: 'CRYPTO', symbol: crypto.symbol });
                }
            });
        }

        return methods;
    }, [searchTerm, activeTab]);

    useEffect(() => {
        if (step === 'connecting') {
            const totalDuration = 3500;
            const intervalTime = totalDuration / connectionLogs.length;
            let isCancelled = false;

            const logInterval = setInterval(() => {
                setLogIndex(prev => (prev < connectionLogs.length - 1 ? prev + 1 : prev));
            }, intervalTime);

            const progressInterval = setInterval(() => {
                setProgress(prev => (prev >= 95 ? 95 : prev + 2));
            }, totalDuration / 50);

            // Execute real handshake
            const executeHandshake = async () => {
                const url = getServiceUrl(selectedMethod?.name || '');
                await establishSecureConnection(url);
                
                if (!isCancelled) {
                    setProgress(100);
                    setTimeout(() => {
                        setStep('success');
                    }, 500);
                }
            };

            executeHandshake();

            return () => {
                isCancelled = true;
                clearInterval(logInterval);
                clearInterval(progressInterval);
            };
        }
    }, [step, selectedMethod]);

    const handleMethodSelect = (method: PaymentMethodItem) => {
        setSelectedMethod(method);
        setStep('details');
    };

    const handleDetailsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep('connecting');
    };

    const handleFinish = () => {
        if (selectedMethod) {
            onAdd(selectedMethod.id, selectedMethod.name, selectedMethod.type);
        }
    };

    const handleBack = () => {
        if (step === 'details') setStep('select');
        else if (step === 'connecting') setStep('details');
    };

    const renderInput = (label: string, name: string, placeholder: string, type: string = "text") => (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">{label}</label>
            <input 
                type={type}
                required
                value={(details as any)[name]}
                onChange={e => setDetails({...details, [name]: e.target.value})}
                placeholder={placeholder}
                className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-4 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-mono text-sm shadow-inner"
            />
        </div>
    );

    return (
        <div className="fixed inset-0 bg-slate-100  flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="bg-[#0c121e] border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-xl h-[85vh] flex flex-col overflow-hidden animate-fade-in-up relative">
                
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-indigo-50 to-primary opacity-70"></div>

                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-white/10 bg-white flex justify-between items-center dark:bg-slate-800">
                    <div className="flex items-center gap-4">
                        {step !== 'select' && step !== 'success' && (
                            <button onClick={handleBack} className="p-2 hover:bg-white rounded-xl transition-colors dark:bg-slate-800">
                                <ArrowLeftIcon className="w-5 h-5 text-[#0F172A] dark:text-white" />
                            </button>
                        )}
                        <div>
                            <h2 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase">
                                {step === 'select' ? 'Integrate Node' : 
                                 step === 'details' ? 'Node Credentials' :
                                 step === 'connecting' ? 'Network Handshake' : 'Node Active'}
                            </h2>
                            <p className="text-[#0F172A] text-xs font-bold uppercase tracking-widest mt-0.5">
                                {step === 'select' ? 'Global Institutional Connect' : 
                                 selectedMethod?.name + ' Protocol Setup'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white rounded-2xl text-[#0F172A] hover:text-[#0F172A] dark:text-white transition-colors dark:bg-slate-800">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto custom-scrollbar p-8">
                    {step === 'select' && (
                        <div className="space-y-8">
                            <div className="relative">
                                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0F172A]" />
                                <input 
                                    type="text" 
                                    placeholder="Search global banks, wallets, or crypto nodes..." 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white pl-12 pr-4 py-5 rounded-3xl focus:ring-2 focus:ring-primary outline-none shadow-inner text-sm font-bold placeholder-slate-700"
                                    autoFocus
                                />
                            </div>
                            
                            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-100 dark:border-white/10 overflow-x-auto no-scrollbar">
                                {['ALL', 'BANKS', 'SERVICES', 'CRYPTO'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={`flex-1 min-w-[90px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            activeTab === tab 
                                            ? 'bg-primary text-[#0F172A] dark:text-white shadow-lg shadow-primary/20' 
                                            : 'text-[#0F172A] hover:text-[#0F172A] dark:text-white'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {filteredMethods.map(method => {
                                    const Icon = method.type === 'BANK' ? getBankIcon(method.name) : 
                                                 method.type === 'CRYPTO' ? FEATURED_CRYPTO.find(c => c.name === method.name)?.icon || WalletIcon :
                                                 getServiceIcon(method.name);
                                    
                                    return (
                                        <button
                                            key={method.name}
                                            onClick={() => handleMethodSelect(method)}
                                            className="group flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-[2rem] hover:bg-white dark:bg-slate-900 hover:border-primary/50 transition-all duration-300"
                                        >
                                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform">
                                                <Icon className="w-full h-full object-contain" />
                                            </div>
                                            <span className="text-xs font-black text-[#0F172A] dark:text-white group-hover:text-[#0F172A] dark:text-white uppercase tracking-tighter text-center">{method.name}</span>
                                            <span className="text-[8px] font-bold text-[#0F172A] uppercase tracking-widest mt-1">{method.type}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {step === 'details' && selectedMethod && (
                        <form onSubmit={handleDetailsSubmit} className="space-y-8 animate-fade-in">
                            <div className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-inner">
                                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-2xl overflow-hidden dark:bg-slate-800">
                                    {selectedMethod.type === 'BANK' ? React.createElement(getBankIcon(selectedMethod.name), { className: "w-10 h-10" }) :
                                     selectedMethod.type === 'CRYPTO' ? React.createElement(FEATURED_CRYPTO.find(c => c.name === selectedMethod.name)?.icon || WalletIcon, { className: "w-10 h-10" }) :
                                     React.createElement(getServiceIcon(selectedMethod.name), { className: "w-10 h-10" })}
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-[#0F172A] dark:text-white uppercase tracking-tighter">{selectedMethod.name} Integration</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Awaiting Data Input</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {selectedMethod.type === 'BANK' && (
                                    <>
                                        {renderInput("Account ID / IBAN", "accountNumber", "Enter account number", "text")}
                                        <div className="grid grid-cols-2 gap-4">
                                            {renderInput("Routing Number", "routingNumber", "9-digit code")}
                                            {renderInput("SWIFT / BIC", "swiftBic", "BANKCODE")}
                                        </div>
                                    </>
                                )}

                                {selectedMethod.type === 'CRYPTO' && (
                                    <>
                                        {renderInput("Global Wallet Address", "walletAddress", "0x... or bc1...")}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">Network Node</label>
                                            <select 
                                                value={details.network} 
                                                onChange={e => setDetails({...details, network: e.target.value})}
                                                className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-4 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-sm shadow-inner appearance-none"
                                            >
                                                <option>Mainnet (Primary)</option>
                                                <option>Testnet (Development)</option>
                                                <option>Layer 2 (Express)</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {selectedMethod.type === 'SERVICE' && (
                                    <>
                                        {renderInput("Service ID / Email", "userId", "username@domain.com", "email")}
                                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-white/10">
                                            <p className="text-[10px] text-[#0F172A] font-bold leading-relaxed">
                                                By linking this service, you authorize First Pacific Bank to initiate secure payment handshakes via the OAUTH 2.1 protocol. No credentials will be stored.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="primary- border primary- p-4 rounded-2xl flex items-start gap-4">
                                <ShieldCheckIcon className="w-5 h-5 text-primary mt-0.5" />
                                <p className="text-xs text-[#0F172A] dark:text-white leading-relaxed font-bold">
                                    Our <span className="text-[#0F172A] dark:text-white font-bold">Ironclad Security</span> protocol ensures your node credentials are encrypted at the hardware level. We never share raw data with external networks.
                                </p>
                            </div>

                            <button type="submit" className="w-full py-5 bg-white hover:bg-primary hover:text-[#0F172A] dark:text-white text-[#0F172A] font-black uppercase tracking-[0.3em] rounded-3xl shadow-2xl transition-all transform active:scale-[0.98] dark:bg-slate-800">
                                Initialize Handshake
                            </button>
                        </form>
                    )}

                    {step === 'connecting' && (
                        <div className="space-y-12 animate-fade-in flex flex-col items-center justify-center h-full">
                            <div className="relative w-40 h-40">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="none" className="text-[#1E293B]" />
                                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="none" className="text-primary transition-all duration-300" strokeDasharray={440} strokeDashoffset={440 - (440 * progress) / 100} />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <ServerIcon className="w-10 h-10 text-[#0F172A] dark:text-white mb-2 animate-pulse" />
                                    <span className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tighter">{Math.round(progress)}%</span>
                                </div>
                            </div>
                            
                            <div className="w-full bg-slate-100 rounded-2xl p-6 border border-slate-100 dark:border-white/10 font-mono text-[10px] text-emerald-400/80 h-40 overflow-hidden shadow-inner flex flex-col justify-end">
                                {connectionLogs.slice(0, logIndex + 1).map((log, i) => (
                                    <p key={i} className="mb-1 truncate">
                                        <span className="text-[#0F172A] mr-2">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                                        {log}
                                    </p>
                                ))}
                                <span className="animate-pulse text-primary">_</span>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fade-in-up text-center">
                            <div className="relative">
                                <div className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_80px_rgba(16,185,129,0.4)]">
                                    <CheckCircleIcon className="w-16 h-16 text-[#0F172A] dark:text-white" />
                                </div>
                                <div className="absolute -top-2 -right-2 bg-slate-100 p-2 rounded-full border border-slate-200 dark:border-white/10">
                                    <ShieldCheckIcon className="w-8 h-8 text-emerald-400" />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-4xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase mb-2">Integration Complete</h3>
                                <p className="text-[#0F172A] dark:text-white text-sm font-bold">Your new settlement node is active and ready for transmission.</p>
                            </div>

                            <button onClick={handleFinish} className="w-full py-5 bg-white text-[#0F172A] font-black uppercase tracking-[0.2em] rounded-3xl shadow-2xl hover:bg-slate-200 transition-all dark:bg-slate-800">
                                Access Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
