import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    AppleIcon, TvIcon, CreditCardIcon, BankIcon, 
    CheckCircleIcon, XIcon, ArrowRightIcon, TrendingUpIcon,
    ShieldCheckIcon, LockClosedIcon, GlobeAmericasIcon,
    SparklesIcon, GiftIcon, QrCodeIcon, DocumentTextIcon, PrinterIcon, AppleWalletIcon, BarcodeIcon
} from './Icons';
import { useCurrency } from '../contexts/CurrencyContext';
import { ComplianceHaltModal } from './ComplianceHaltModal';
import { Account, Transaction, NotificationType, TransactionStatus } from '../types';
import { sendTransactionNotification } from '../utils/notificationService';
import { PhysicalGiftCard, CardUsageAdvisor, WalletPassModal, CardType } from './PhysicalGiftCard';

const BrandLogo: React.FC<{ domain: string, name: string, fallback: React.FC<any>, className?: string }> = ({ domain, name, fallback: Fallback, className }) => {
    const [error, setError] = useState(false);
    if (error) return <Fallback className={className} />;
    return <img src={`https://logo.clearbit.com/${domain}`} alt={`${name} logo`} className={className} onError={() => setError(true)} referrerPolicy="no-referrer" />;
};

interface DigitalStoreProps {
    accounts: Account[];
    onUpdateAccount: (id: string, updates: Partial<Account>) => void;
    onAddTransaction: (transaction: Transaction) => void;
    addNotification: (type: NotificationType, title: string, message: string) => void;
    userEmail?: string;
    userName?: string;
}

export const DigitalStore: React.FC<DigitalStoreProps> = ({ accounts, onUpdateAccount, onAddTransaction, addNotification, userEmail, userName }) => {
    const { formatCurrency } = useCurrency();
    const [activeCategory, setActiveCategory] = useState<'gaming' | 'entertainment' | 'retail' | 'crypto' | 'gold'>('gaming');
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [amount, setAmount] = useState<string>('50');
    const [purchaseState, setPurchaseState] = useState<'idle' | 'compliance' | 'processing' | 'success'>('idle');
    const [generatedCode, setGeneratedCode] = useState('');
    const [goldPrice, setGoldPrice] = useState(2345.50);
    const [receiptId, setReceiptId] = useState('');

    // Advanced Apple Card States
    const [selectedCardType, setSelectedCardType] = useState<CardType>('unified');
    const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);
    const [isWalletOpen, setIsWalletOpen] = useState<boolean>(false);
    const [scratchCompleted, setScratchCompleted] = useState<boolean>(false);
    const [printReceiptOpen, setPrintReceiptOpen] = useState<boolean>(false);

    // Live Gold Price Simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setGoldPrice(prev => prev + (Math.random() - 0.5) * 2.5);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const categories = [
        { id: 'gaming', label: 'Gaming & Esports', icon: TvIcon },
        { id: 'entertainment', label: 'Entertainment', icon: GiftIcon },
        { id: 'retail', label: 'Retail & Shopping', icon: AppleIcon },
        { id: 'crypto', label: 'Digital Assets', icon: QrCodeIcon },
        { id: 'gold', label: 'Precious Metals', icon: SparklesIcon },
    ];

    const products = {
        gaming: [
            { id: 'steam', name: 'Steam Wallet', domain: 'steamcommunity.com', bgImage: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&q=80&w=1000', color: 'primary- to-slate-900', type: 'fixed', options: ['20', '50', '100'] },
            { id: 'playstation', name: 'PlayStation Store', domain: 'playstation.com', bgImage: 'https://images.unsplash.com/photo-1606144042873-1f196c8d4389?auto=format&fit=crop&q=80&w=1000', color: 'primary- primary-', type: 'fixed', options: ['10', '25', '50', '100'] },
            { id: 'xbox', name: 'Xbox Live', domain: 'xbox.com', bgImage: 'https://images.unsplash.com/photo-1621259403882-ebd30441ac3d?auto=format&fit=crop&q=80&w=1000', color: 'from-green-600 to-green-900', type: 'fixed', options: ['15', '25', '50'] },
            { id: 'roblox', name: 'Roblox Robux', domain: 'roblox.com', bgImage: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&q=80&w=1000', color: 'from-slate-800 to-black', type: 'fixed', options: ['10', '25', '50'] },
        ],
        entertainment: [
            { id: 'netflix', name: 'Netflix', domain: 'netflix.com', bgImage: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=1000', color: 'from-red-600 to-red-900', type: 'fixed', options: ['25', '50', '100'] },
            { id: 'spotify', name: 'Spotify Premium', domain: 'spotify.com', bgImage: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=1000', color: 'from-emerald-500 to-emerald-800', type: 'fixed', options: ['10', '30', '60'] },
            { id: 'disney', name: 'Disney+', domain: 'disneyplus.com', bgImage: 'https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?auto=format&fit=crop&q=80&w=1000', color: 'primary- to-indigo-900', type: 'fixed', options: ['25', '50', '100'] },
        ],
        retail: [
            { id: 'apple', name: 'App Store & iTunes / Apple Gift Card', domain: 'apple.com', bgImage: 'https://images.unsplash.com/photo-1611186716075-8bd026857ad8?auto=format&fit=crop&q=80&w=1000', color: 'from-slate-700 to-black', type: 'variable' },
            { id: 'amazon', name: 'Amazon', domain: 'amazon.com', bgImage: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&q=80&w=1000', color: 'from-yellow-600 to-orange-800', type: 'variable' },
            { id: 'nike', name: 'Nike', domain: 'nike.com', bgImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1000', color: 'from-slate-800 to-black', type: 'variable' },
        ],
        crypto: [
            { id: 'btc', name: 'Bitcoin (BTC)', domain: 'bitcoin.org', bgImage: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&q=80&w=1000', color: 'from-orange-500 to-yellow-600', type: 'crypto', ticker: 'BTC' },
            { id: 'eth', name: 'Ethereum (ETH)', domain: 'ethereum.org', bgImage: 'https://images.unsplash.com/photo-1622736136708-48524850c892?auto=format&fit=crop&q=80&w=1000', color: 'from-indigo-500 to-purple-700', type: 'crypto', ticker: 'ETH' },
        ],
        gold: [
            { id: 'paxg', name: 'Physical Gold (Vaulted)', domain: 'paxos.com', bgImage: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&q=80&w=1000', color: 'from-yellow-400 to-yellow-700', type: 'commodity', unit: 'oz' },
        ]
    };

    const handleInitiatePurchase = (product: any) => {
        setSelectedProduct(product);
        setPurchaseState('compliance');
    };

    const handleComplianceSuccess = async () => {
        const total = calculateTotal();
        const primaryAccount = accounts[0];

        if (primaryAccount.balance < total) {
            addNotification(NotificationType.SECURITY, 'Insufficient Funds', 'Your primary account does not have enough funds for this purchase.');
            setPurchaseState('idle');
            return;
        }

        setPurchaseState('processing');
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 3500));

        // Deduct funds
        onUpdateAccount(primaryAccount.id, { balance: primaryAccount.balance - total });

        // Create Transaction
        const newTransaction: Transaction = {
            id: `txn_${Date.now()}`,
            accountId: primaryAccount.id,
            type: 'debit',
            sendAmount: total,
            receiveAmount: total,
            receiveCurrency: 'USD',
            fee: 0,
            exchangeRate: 1,
            estimatedArrival: new Date(),
            description: `Digital Store: ${selectedProduct.name} (${selectedCardType === 'unified' ? 'Unified' : selectedCardType === 'classic' ? 'App Store Blue' : 'Special Gold' })`,
            status: TransactionStatus.COMPLETED,
            recipient: {
                id: 'store',
                fullName: selectedProduct.name,
                accountNumber: 'DIGITAL',
                bankName: 'Digital Store',
                isFavorite: false,
                country: {
                    code: 'US',
                    name: 'United States',
                    currency: 'USD',
                    symbol: '$'
                },
                realDetails: {
                    accountNumber: 'DIGITAL',
                    swiftBic: 'DIGITAL'
                }
            },
            statusTimestamps: {
                [TransactionStatus.SUBMITTED]: new Date(),
                [TransactionStatus.PROCESSING]: new Date(),
                [TransactionStatus.COMPLETED]: new Date()
            }
        };

        onAddTransaction(newTransaction);

        // Send Alert
        const newBal = primaryAccount.balance - total;
        sendTransactionNotification(newTransaction, true, userEmail, newBal, userName).catch(console.warn);
        addNotification(NotificationType.ACCOUNT, 'Purchase Successful', `Successfully purchased ${selectedProduct.name} for ${formatCurrency(total)}`);

        // Generate customized serial codes
        const codeSegments = Array(3).fill(0).map(() => Math.random().toString(36).substring(2, 6).toUpperCase());
        setGeneratedCode(codeSegments.join('-'));
        setReceiptId(`TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
        
        // Success flip action default to scratch PIN view
        if (selectedProduct.id === 'apple') {
            setIsCardFlipped(true); // Flip on back side to reveal scratch overlay
        }
        setPurchaseState('success');
    };

    const resetStore = () => {
        setPurchaseState('idle');
        setSelectedProduct(null);
        setGeneratedCode('');
        setReceiptId('');
        setAmount('50');
        setIsCardFlipped(false);
        setScratchCompleted(false);
        setPrintReceiptOpen(false);
    };

    const calculateTotal = () => {
        if (!selectedProduct) return 0;
        if (selectedProduct.type === 'commodity') {
            return parseFloat(amount) * goldPrice;
        }
        return parseFloat(amount);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
            {/* Header with Video Background */}
            <div className="relative rounded-[2.5rem] overflow-hidden mb-8 border border-slate-200 dark:border-white/10 shadow-2xl bg-slate-50 dark:bg-slate-900">
                <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen pointer-events-none">
                    <source src="https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-network-connection-background-3134-large.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900/40"></div>
                
                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-indigo-500 rounded-xl  border border-indigo-500/30">
                                <GiftIcon className="w-8 h-8 text-indigo-400" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase drop-shadow-lg">Digital Store</h1>
                        </div>
                        <p className="text-[#0F172A] dark:text-white font-bold max-w-xl text-lg drop-shadow-md">
                            Purchase premium gift cards, digital assets, and commodities instantly. Securely funded directly from your primary account.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-slate-50 dark:bg-slate-800  border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex items-center gap-5 shadow-2xl">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                                <SparklesIcon className="w-6 h-6 text-yellow-950" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-yellow-500/80 uppercase tracking-widest mb-1">Live Gold / OZ</p>
                                <p className="text-2xl font-black text-[#0F172A] dark:text-white font-mono tracking-tight">${goldPrice.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Categories */}
                <div className="lg:col-span-1 space-y-2">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => { setActiveCategory(cat.id as any); setSelectedProduct(null); }}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${
                                activeCategory === cat.id 
                                ? 'bg-indigo-600 text-slate-950 dark:text-white shadow-[0_0_30px_rgba(79,70,229,0.3)] border-indigo-500 font-bold' 
                                : 'bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white hover:bg-white dark:bg-slate-850 hover:text-[#0F172A] dark:text-white border border-transparent hover:border-slate-200 dark:border-white/10'
                            }`}
                        >
                            <cat.icon className={`w-5 h-5 ${activeCategory === cat.id ? 'text-slate-950 dark:text-white' : 'text-[#0F172A]'}`} />
                            <span className="font-bold tracking-wide">{cat.label}</span>
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                <div className="lg:col-span-3">
                    {!selectedProduct ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
                            {(products[activeCategory] as any[]).map(product => (
                                <div 
                                    key={product.id}
                                    onClick={() => handleInitiatePurchase(product)}
                                    className="relative overflow-hidden rounded-[2rem] border border-slate-200 dark:border-white/10 group cursor-pointer min-h-[240px] flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 bg-slate-50 dark:bg-slate-900"
                                >
                                    {/* Realistic Background Image */}
                                    <img 
                                        src={product.bgImage} 
                                        alt={product.name} 
                                        className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-700"
                                        referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
                                    
                                    <div className="relative z-10 p-6">
                                        <div className="w-14 h-14 bg-white  rounded-2xl flex items-center justify-center mb-4 border border-slate-300 dark:border-black/10 shadow-lg dark:bg-slate-800">
                                            <BrandLogo domain={product.domain} name={product.name} fallback={GiftIcon} className="w-8 h-8 object-contain drop-shadow-md" />
                                        </div>
                                        <h3 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight drop-shadow-md">{product.name}</h3>
                                        <p className="text-xs text-[#0F172A] dark:text-white/80 font-bold uppercase tracking-widest mt-2 drop-shadow-md">
                                            {product.type === 'fixed' ? 'Fixed Denominations' : product.type === 'variable' ? 'Custom Amount' : 'Live Market Price'}
                                        </p>
                                    </div>
                                    <div className="relative z-10 p-6 flex justify-end">
                                        <div className="w-10 h-10 rounded-full bg-white  border border-slate-300 dark:border-black/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors duration-300 dark:bg-slate-800">
                                            <ArrowRightIcon className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Product Detail / Purchase View */
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 animate-fade-in relative overflow-hidden shadow-2xl min-h-[600px] flex flex-col">
                            {/* Realistic Background Image for Detail View */}
                            <img 
                                src={selectedProduct.bgImage} 
                                alt={selectedProduct.name} 
                                className="absolute inset-0 w-full h-full object-cover opacity-15 blur-xl scale-110"
                                referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-slate-950/95"></div>
                            
                            <div className="relative z-10 flex flex-col md:flex-row gap-12 flex-grow">
                                {/* Left: Product Info / Core Card Display */}
                                <div className="flex-1 flex flex-col">
                                    <button onClick={() => setSelectedProduct(null)} className="text-xs font-bold text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white uppercase tracking-widest mb-8 flex items-center gap-2 transition-colors w-fit bg-white px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 hover:bg-white dark:bg-slate-800">
                                        <XIcon className="w-4 h-4" /> Back to {categories.find(c => c.id === activeCategory)?.label}
                                    </button>
                                    
                                    {selectedProduct.id === 'apple' ? (
                                        /* Advanced Realistic Apple Configurator View */
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <h2 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tight">Apple Store Configurator</h2>
                                                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">Configure Card Template & Specifications</p>
                                                </div>
                                                <span className="text-[9px] bg-indigo-500 text-indigo-400 border border-indigo-500/20 rounded px-2 py-1 font-bold">HIGH FIDELITY PREVIEW</span>
                                            </div>

                                            {/* Dynamic 3D physical card component */}
                                            <PhysicalGiftCard 
                                                type={selectedCardType}
                                                amount={amount}
                                                isFlipped={isCardFlipped}
                                                onFlip={() => setIsCardFlipped(!isCardFlipped)}
                                                isPurchased={false}
                                            />

                                            {/* Interactive Template Selector (Unified vs Classic vs Premium Gold) */}
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-[#0F172A] dark:text-zinc-500 block">Select Official Card Background / Type</label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <button 
                                                        onClick={() => { setSelectedCardType('unified'); setIsCardFlipped(false); }} 
                                                        className={`p-3.5 rounded-2xl flex flex-col items-center justify-center border text-center transition-all ${
                                                            selectedCardType === 'unified' 
                                                            ? 'bg-zinc-50 border-zinc-400 text-zinc-950 shadow-lg scale-105 font-bold' 
                                                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                                        }`}
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center mb-1.5 shadow">
                                                            <AppleIcon className="w-4 h-4 text-white" />
                                                        </div>
                                                        <span className="text-[11px] font-extrabold uppercase">Unified Card</span>
                                                        <span className="text-[7.5px] opacity-60 mt-0.5">Universal Redemptions</span>
                                                    </button>

                                                    <button 
                                                        onClick={() => { setSelectedCardType('classic'); setIsCardFlipped(false); }}
                                                        className={`p-3.5 rounded-2xl flex flex-col items-center justify-center border text-center transition-all ${
                                                            selectedCardType === 'classic' 
                                                            ? 'primary- primary- text-white shadow-lg scale-105 font-bold primary-' 
                                                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                                        }`}
                                                    >
                                                        <div className="w-8 h-8 rounded-full primary- flex items-center justify-center mb-1.5 shadow">
                                                            <AppleIcon className="w-4 h-4 text-white" />
                                                        </div>
                                                        <span className="text-[11px] font-extrabold uppercase">Classic Blue</span>
                                                        <span className="text-[7.5px] opacity-60 mt-0.5">App Store & iTunes Only</span>
                                                    </button>

                                                    <button 
                                                        onClick={() => { setSelectedCardType('gold'); setIsCardFlipped(false); }}
                                                        className={`p-3.5 rounded-2xl flex flex-col items-center justify-center border text-center transition-all ${
                                                            selectedCardType === 'gold' 
                                                            ? 'bg-amber-950 border-amber-500 text-white shadow-lg scale-105 font-bold shadow-amber-500/20' 
                                                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                                        }`}
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-600 flex items-center justify-center mb-1.5 shadow">
                                                            <AppleIcon className="w-4 h-4 text-amber-950 font-black" />
                                                        </div>
                                                        <span className="text-[11px] font-extrabold uppercase">Special Gold</span>
                                                        <span className="text-[7.5px] opacity-60 mt-0.5">Exclusive Metallics</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Standard Card Display */
                                        <>
                                            <div className="flex items-center gap-6 mb-8">
                                                <div className="w-24 h-24 bg-white  rounded-3xl flex items-center justify-center shadow-2xl border border-slate-300 dark:border-black/10 p-4 dark:bg-slate-800">
                                                    <BrandLogo domain={selectedProduct.domain} name={selectedProduct.name} fallback={GiftIcon} className="w-full h-full object-contain drop-shadow-lg" />
                                                </div>
                                                <div>
                                                    <h2 className="text-4xl font-black text-[#0F172A] dark:text-white tracking-tight drop-shadow-lg">{selectedProduct.name}</h2>
                                                    <p className="text-sm text-indigo-300 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                                                        <ShieldCheckIcon className="w-4 h-4" /> Official Retailer
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="relative overflow-hidden aspect-[1.586/1] w-full max-w-[420px] rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl mb-8 group">
                                                <img 
                                                    src={selectedProduct.bgImage} 
                                                    alt={selectedProduct.name} 
                                                    className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-1000"
                                                    referrerPolicy="no-referrer"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                                                <div className="absolute top-6 left-6 font-mono font-black text-3xl text-white">${amount}</div>
                                                <div className="absolute bottom-6 right-6 p-2 bg-slate-100  rounded-xl border border-slate-200 dark:border-white/10">
                                                    <BrandLogo domain={selectedProduct.domain} name={selectedProduct.name} fallback={GiftIcon} className="w-7 h-7 object-contain" />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Right: Action / Custom Amount Configuration */}
                                <div className="flex-grow flex flex-col justify-between max-w-md w-full gap-6">
                                    <div className="space-y-6 bg-slate-50 dark:bg-slate-800  p-8 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-xl flex-grow">
                                        <div>
                                            <label className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-widest block mb-4">Select Amount</label>
                                            {selectedProduct.type === 'fixed' ? (
                                                <div className="grid grid-cols-3 gap-4">
                                                    {selectedProduct.options.map((opt: string) => (
                                                        <button 
                                                            key={opt}
                                                            onClick={() => setAmount(opt)}
                                                            className={`py-3.5 rounded-2xl font-black text-lg transition-all border ${amount === opt ? 'bg-indigo-600 text-slate-950 dark:text-white border-indigo-450 shadow-[0_0_20px_rgba(79,70,229,0.4)] scale-105' : 'bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white border-slate-200 dark:border-white/10 hover:border-slate-200 dark:border-white/30 hover:bg-white dark:bg-slate-900'}`}
                                                        >
                                                            ${opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-[#0F172A] dark:text-white">$</span>
                                                    <input 
                                                        type="number" 
                                                        value={amount}
                                                        onChange={(e) => setAmount(e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl py-4.5 pl-14 pr-6 text-2xl font-black text-[#0F172A] dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-6 border-t border-slate-200 dark:border-white/10">
                                            <div className="flex justify-between items-center mb-2.5">
                                                <span className="text-xs text-[#0F172A] dark:text-white font-bold">Subtotal</span>
                                                <span className="text-xs text-[#0F172A] dark:text-white font-mono font-bold">{formatCurrency(calculateTotal())}</span>
                                            </div>
                                            <div className="flex justify-between items-center mb-5">
                                                <span className="text-xs text-[#0F172A] dark:text-white font-bold">Processing Fee</span>
                                                <span className="text-xs text-emerald-400 font-mono font-bold font-extrabold uppercase tracking-widest">Waived</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-5 border-t border-slate-200 dark:border-white/10">
                                                <span className="text-lg font-black text-[#0F172A] dark:text-white">Total Due</span>
                                                <span className="text-2xl font-black text-[#0F172A] dark:text-white font-mono tracking-tight">{formatCurrency(calculateTotal())}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="w-full">
                                        {purchaseState === 'idle' && (
                                            <div className="bg-slate-50 dark:bg-slate-800  border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 text-center shadow-2xl space-y-4">
                                                <p className="text-[11px] text-[#0F172A] dark:text-white leading-normal">
                                                    Charges will be securely debited from your primary accounts linked directly. Security covered by 256-bit encryption.
                                                </p>
                                                <button 
                                                    onClick={() => setPurchaseState('compliance')}
                                                    className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-500 text-slate-950 dark:text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_30px_rgba(79,70,229,0.4)] hover:shadow-[0_0_40px_rgba(79,70,229,0.6)] hover:-translate-y-1 flex items-center justify-center gap-3 text-xs"
                                                >
                                                    <ShieldCheckIcon className="w-5 h-5 text-slate-950 dark:text-white" /> Confirm purchase gateway
                                                </button>
                                            </div>
                                        )}

                                        {purchaseState === 'processing' && (
                                            <div className="bg-slate-50 dark:bg-slate-800  border border-slate-200 dark:border-white/10 rounded-[2rem] p-8 text-center shadow-2xl flex flex-col items-center justify-center min-h-[140px]">
                                                <div className="relative w-16 h-16 mb-4">
                                                    <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
                                                    <div className="absolute inset-0 border-4 border-t-indigo-500 border-r-indigo-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                                                    <div className="absolute inset-3 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center shadow-inner">
                                                        <BrandLogo domain={selectedProduct.domain} name={selectedProduct.name} fallback={GiftIcon} className="w-5 h-5 object-contain opacity-55 animate-pulse" />
                                                    </div>
                                                </div>
                                                <p className="text-indigo-400 font-extrabold uppercase tracking-widest text-[9px] animate-pulse">Forging Card Crypto Keys...</p>
                                            </div>
                                        )}

                                        {purchaseState === 'success' && (
                                            <div className="bg-slate-50 dark:bg-slate-800  border border-emerald-500/30 rounded-[2rem] p-6 text-center animate-fade-in-up shadow-[0_0_50px_rgba(16,185,129,0.15)]">
                                                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                                                    <CheckCircleIcon className="w-6 h-6 text-emerald-400" />
                                                </div>
                                                <h3 className="text-xl font-black text-[#0F172A] dark:text-white mb-1 tracking-tight">Invoice Confirmed!</h3>
                                                <p className="text-[11px] text-[#0F172A] dark:text-white mb-5">Card code key generated successfully under serial: {receiptId}</p>
                                                
                                                {/* Advanced interactive actions of the card success */}
                                                <div className="space-y-3 pt-2">
                                                    <button 
                                                        onClick={() => setIsWalletOpen(true)}
                                                        className="w-full py-3 bg-[linear-gradient(135deg,#000000,#2a2a2a)] border border-neutral-700 hover:border-neutral-500 text-white rounded-2xl flex items-center justify-center gap-3 transition-all font-black uppercase text-[10px] tracking-wider shadow"
                                                    >
                                                        <AppleWalletIcon className="w-5 h-5" /> Add to Apple Passbook Wallet
                                                    </button>

                                                    <button 
                                                        onClick={() => setPrintReceiptOpen(true)}
                                                        className="w-full py-3 bg-slate-50 border border-slate-200 hover:bg-slate-855 text-zinc-300 rounded-2xl flex items-center justify-center gap-3 transition-all font-bold uppercase text-[10px] tracking-wider dark:bg-slate-900"
                                                    >
                                                        <PrinterIcon className="w-4 h-4 text-zinc-400" /> Print Certificate / Receipt
                                                    </button>

                                                    <button 
                                                        onClick={resetStore}
                                                        className="pt-2 text-xs font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest transition-all block mx-auto flex items-center gap-1"
                                                    >
                                                        Buy another code <ArrowRightIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Success screen unique overlay card revealing (Only showing if purchasing Apple Card & in success stage) */}
                            {purchaseState === 'success' && selectedProduct.id === 'apple' && (
                                <div className="border-t border-slate-200 dark:border-white/10 mt-12 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in text-left">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-wider flex items-center gap-2">
                                            <SparklesIcon className="w-5 h-5 text-indigo-400 animate-pulse" /> Real Scratch-Off Verification
                                        </h3>
                                        <p className="text-xs text-[#0F172A] dark:text-zinc-400 leading-relaxed">
                                            For military-grade checkout confidentiality on electronic streams, your real purchased PIN code is locked underneath an interactive latex scratch layer. Hover or drag across the panel on the back of the card to reveal your key!
                                        </p>
                                        <div className="p-4 bg-emerald-500 border border-emerald-500/20 rounded-2xl">
                                            <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                                                <ShieldCheckIcon className="w-4 h-4" /> Ready to Scratch Off
                                            </h5>
                                            <p className="text-[11px] text-[#0F172A] dark:text-zinc-300 leading-normal">
                                                By doing a manual click-drag, you reveal the official cryptographically authentic 16-character Apple redeem key which can be loaded globally on any iOS device.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-center">
                                        <PhysicalGiftCard 
                                            type={selectedCardType}
                                            amount={amount}
                                            isFlipped={isCardFlipped}
                                            onFlip={() => setIsCardFlipped(!isCardFlipped)}
                                            revealedCode={generatedCode}
                                            isPurchased={true}
                                            onScratchComplete={() => {
                                                setScratchCompleted(true);
                                                addNotification(NotificationType.SECURITY, 'Latex Layer Scratched', 'Your Apple Redeem PIN code is fully uncovered.');
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* If selected style is 'apple' (Gift Card), show the card comparison checker under detail state to prevent buying mistakes */}
                            {selectedProduct.id === 'apple' && purchaseState !== 'success' && (
                                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-white/10 w-full">
                                    <CardUsageAdvisor />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Compliance Modal */}
            {purchaseState === 'compliance' && (
                <ComplianceHaltModal 
                    isOpen={true} 
                    amount={calculateTotal()} 
                    onVerified={handleComplianceSuccess} 
                    onCancel={() => setPurchaseState('idle')} 
                    onContactSupport={() => {}}
                />
            )}

            {/* Electronic iOS add-to-wallet modal */}
            <WalletPassModal 
                isOpen={isWalletOpen} 
                onClose={() => {
                    setIsWalletOpen(false);
                    addNotification(NotificationType.ACCOUNT, 'Wallet Added', 'Apple Gift Card pass loaded into Apple Passbook securely.');
                }}
                amount={amount}
                cardType={selectedCardType}
                serialNumber={`${selectedCardType.toUpperCase()}-WAL-${receiptId}`}
            />

            {/* High Realism Printed Gift Certificate Receipt Modal */}
            {printReceiptOpen && (
                <AnimatePresence>
                    <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800 " onClick={() => setPrintReceiptOpen(false)} />
                        
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white border rounded-3xl p-8 max-w-[500px] w-full text-left shadow-2xl relative z-10 text-[#0F172A] border-slate-200 dark:bg-slate-800"
                        >
                            {/* Decorative scissor line */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-4 border border-dashed border-slate-300 rounded-full py-1 text-[10px] text-[#0F172A] font-extrabold uppercase dark:bg-slate-800">
                                ✂️ Cut Along Dashed Frame
                            </div>

                            <div className="border-4 border-double border-slate-200 p-6 rounded-2xl relative">
                                <div className="absolute top-4 right-4 text-xs font-mono text-[#0F172A] font-extrabold rotate-[12deg] border border-slate-200 px-2 py-1 rounded">
                                    OFFICIAL DOCUMENT
                                </div>

                                <div className="flex justify-between items-start border-b pb-4 mb-6">
                                    <div>
                                        <p className="text-[10px] uppercase font-black tracking-widest text-[#1e3a8a]">First Premium Pacific Union</p>
                                        <h4 className="text-xl font-black text-[#0F172A] leading-tight">Digital Gift Certificate</h4>
                                        <span className="text-[9px] text-[#0F172A] font-mono">Receipt Token: {receiptId}</span>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                        <AppleIcon className="w-6 h-6 text-black" />
                                    </div>
                                </div>

                                <div className="space-y-4 text-xs">
                                    <div className="grid grid-cols-2 gap-2 text-[#0F172A]">
                                        <div>
                                            <span className="text-[8px] text-[#0F172A] uppercase tracking-widest font-bold">RECIPIENT AUTHORIZED</span>
                                            <p className="font-extrabold text-[#1E293B]">{userEmail || 'Primary Member Holder'}</p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] text-[#0F172A] uppercase tracking-widest font-bold">ISSUANCE DATE</span>
                                            <p className="font-bold text-[#1E293B]">{new Date().toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-250 text-center my-4 space-y-1 dark:bg-slate-900">
                                        <span className="text-[8px] text-[#0F172A] uppercase tracking-widest font-black block">REDEEMABLE CODE VALUE</span>
                                        <p className="text-3xl font-black text-[#0F172A] font-mono">${amount}</p>
                                        <p className="text-[9px] font-mono font-black tracking-widest text-[#1e3a8a] select-all cursor-all pointer-events-auto">
                                            {generatedCode || 'REVEAL_ON_SCRATCH'}
                                        </p>
                                        <span className="text-[7px] text-[#0F172A] block uppercase tracking-widest leading-none">Keep securely guarded ● Do not share</span>
                                    </div>

                                    <div className="text-[8px] text-[#0F172A] leading-relaxed space-y-1">
                                        <p className="font-bold text-[#0F172A] uppercase">Product Details:</p>
                                        <p>Purchased: Apple Digital Code Key ({selectedCardType === 'unified' ? 'Unified Standard' : selectedCardType === 'classic' ? 'App Store Blue Services Only' : 'Special Golden Luxury Option'}). Works on App Store, iTunes Store, Apple Books, and support services globally.</p>
                                        <p className="italic">Authorized by Premium First Pacific Trust Services. Security compliance inspected. Signature verification intact.</p>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-between items-center pt-4 border-t border-slate-100">
                                    {/* Small visual barcode */}
                                    <div className="flex flex-col items-start gap-0.5 opacity-60">
                                        <BarcodeIcon className="w-24 h-5 text-black" />
                                        <span className="font-mono text-[6px] text-[#0F172A]">{receiptId}</span>
                                    </div>
                                    <div className="p-1 px-2.5 bg-emerald-50 text-emerald-700 rounded-full font-black text-[9px] tracking-widest border border-emerald-200">
                                        SECURE PASS
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button 
                                    onClick={() => window.print()}
                                    className="flex-1 py-3 bg-[#1e3a8a] text-white rounded-xl text-xs uppercase font-black tracking-widest hover:bg-[#152e72] hover:scale-101 active:scale-99 shadow transition-all flex items-center justify-center gap-2"
                                >
                                    <PrinterIcon className="w-4 h-4 text-white" /> Confirm & Send to Printer
                                </button>
                                <button 
                                    onClick={() => setPrintReceiptOpen(false)}
                                    className="py-3 px-5 bg-slate-100 text-[#0F172A] hover:bg-slate-200 transition-colors uppercase text-xs font-black tracking-wider rounded-xl"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </AnimatePresence>
            )}
        </div>
    );
};
