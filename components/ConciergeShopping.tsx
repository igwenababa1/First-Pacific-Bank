
import React, { useState, useEffect } from 'react';
import { getProductReviews, ProductReview } from '../services/shoppingService';
import { 
    ShoppingBagIcon, 
    StarIcon, 
    SpinnerIcon, 
    ShieldCheckIcon, 
    CheckCircleIcon,
    ChevronRightIcon,
    XIcon,
    CreditCardIcon,
    AppleIcon,
    GooglePlayIcon,
    DevicePhoneMobileIcon,
    TvIcon,
    GiftIcon,
    LockClosedIcon,
    ClipboardDocumentIcon,
    SparklesIcon,
    BoltIcon,
    WifiIcon,
    BrandLogo
} from './Icons';
import { ComplianceHaltModal } from './ComplianceHaltModal';
import { useCurrency } from '../contexts/CurrencyContext';

// --- Types ---
type StoreType = 'apple' | 'samsung' | 'amazon' | 'redim';
type Category = 'boutique' | 'digital' | 'rewards';

interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    rating: number;
    pointsPrice?: number; // For Redim store
    description: string;
}

interface GiftCard {
    id: string;
    name: string;
    domain: string; // Used to fetch real logo/image
    color: string;
    textColor?: string;
}

interface ConciergeShoppingProps {
    onContactSupport: () => void;
}

// --- Data ---
const STORES = [
    { id: 'apple', name: 'Apple Store', domain: 'apple.com', color: 'bg-slate-100 text-[#0F172A] dark:text-white' },
    { id: 'samsung', name: 'Samsung Hub', domain: 'samsung.com', color: 'primary- text-[#0F172A] dark:text-white' },
    { id: 'amazon', name: 'Amazon Prime', domain: 'amazon.com', color: 'bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white' },
    { id: 'redim', name: 'Redim Luxury', domain: 'rolex.com', color: 'bg-gradient-to-r from-amber-200 to-yellow-500 text-[#0F172A]' }, // Using Rolex as proxy for luxury
];

const PRODUCTS: Record<string, Product[]> = {
    apple: [
        { id: 'a1', name: 'iPhone 15 Pro Max', price: 1199, rating: 4.9, image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=400&auto=format&fit=crop', description: 'Titanium design. A17 Pro chip.' },
        { id: 'a2', name: 'MacBook Pro 16"', price: 2499, rating: 4.8, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?q=80&w=400&auto=format&fit=crop', description: 'Mind-blowing. Head-turning.' },
        { id: 'a3', name: 'Apple Watch Ultra 2', price: 799, rating: 4.9, image: 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?q=80&w=400&auto=format&fit=crop', description: 'Next level adventure.' },
    ],
    samsung: [
        { id: 's1', name: 'Galaxy S24 Ultra', price: 1299, rating: 4.7, image: 'https://images.unsplash.com/photo-1610945265078-3858a082d22a?q=80&w=400&auto=format&fit=crop', description: 'Galaxy AI is here.' },
        { id: 's2', name: 'Galaxy Z Fold5', price: 1799, rating: 4.6, image: 'https://images.unsplash.com/photo-1627389955611-70c92a5d2e2c?q=80&w=400&auto=format&fit=crop', description: 'PC power in your pocket.' },
    ],
    amazon: [
        { id: 'am1', name: 'Kindle Scribe', price: 339, rating: 4.5, image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop', description: 'Read and write naturally.' },
        { id: 'am2', name: 'Echo Show 15', price: 279, rating: 4.4, image: 'https://images.unsplash.com/photo-1543512214-318c77a799bf?q=80&w=400&auto=format&fit=crop', description: 'Smart display for family organization.' },
    ],
    redim: [
        { id: 'r1', name: 'Rolex Submariner', price: 12500, pointsPrice: 1250000, rating: 5.0, image: 'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?q=80&w=400&auto=format&fit=crop', description: 'Certified Pre-Owned. Box & Papers.' },
        { id: 'r2', name: 'Hermès Birkin 30', price: 18000, pointsPrice: 1800000, rating: 5.0, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=400&auto=format&fit=crop', description: 'Black Togo Leather. Gold Hardware.' },
    ]
};

const GIFT_CARDS: GiftCard[] = [
    { id: 'itunes', name: 'Apple Gift Card', domain: 'apple.com', color: 'bg-gradient-to-br from-gray-900 to-black', textColor: 'text-[#0F172A] dark:text-white' },
    { id: 'amazon_gc', name: 'Amazon', domain: 'amazon.com', color: 'bg-gradient-to-br from-slate-800 to-slate-900', textColor: 'text-[#0F172A] dark:text-white' },
    { id: 'google_play', name: 'Google Play', domain: 'play.google.com', color: 'bg-gradient-to-br from-white to-gray-100', textColor: 'text-[#0F172A]' },
    { id: 'psn', name: 'PlayStation', domain: 'playstation.com', color: 'bg-gradient-to-br from-[#00439C] to-[#003780]', textColor: 'text-[#0F172A] dark:text-white' },
    { id: 'xbox', name: 'Xbox Live', domain: 'xbox.com', color: 'bg-gradient-to-br from-[#107C10] to-[#0e6f0e]', textColor: 'text-[#0F172A] dark:text-white' },
    { id: 'spotify', name: 'Spotify Premium', domain: 'spotify.com', color: 'bg-gradient-to-br from-[#1DB954] to-[#1aa34a]', textColor: 'text-[#0F172A] dark:text-white' },
    { id: 'netflix', name: 'Netflix', domain: 'netflix.com', color: 'bg-gradient-to-br from-[#E50914] to-[#b8070f]', textColor: 'text-[#0F172A] dark:text-white' },
    { id: 'uber', name: 'Uber', domain: 'uber.com', color: 'bg-slate-100', textColor: 'text-[#0F172A] dark:text-white' },
];

const PurchaseModal: React.FC<{ 
    item: Product | GiftCard; 
    type: 'product' | 'giftcard'; 
    onClose: () => void;
    onContactSupport: () => void;
}> = ({ item, type, onClose, onContactSupport }) => {
    const { formatCurrency } = useCurrency();
    const [step, setStep] = useState<'details' | 'compliance' | 'processing' | 'success'>('details');
    const [amount, setAmount] = useState(25);
    const [generatedCode, setGeneratedCode] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const price = type === 'giftcard' ? amount : (item as Product).price;

    const handleInitiatePurchase = () => {
        // Enforce Compliance Halt before processing payment
        setStep('compliance');
    };

    const handleComplianceVerified = () => {
        setStep('processing');
    };

    // Simulate Code Generation / Order Processing
    useEffect(() => {
        if (step === 'processing') {
            const timer = setTimeout(() => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                let code = '';
                for (let i = 0; i < 16; i++) {
                    if (i > 0 && i % 4 === 0) code += '-';
                    code += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                setGeneratedCode(code);
                setStep('success');
            }, 3000); // 3 seconds for biometric simulation
            return () => clearTimeout(timer);
        }
    }, [step]);

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedCode);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <>
            {step === 'compliance' && (
                <ComplianceHaltModal 
                    isOpen={true} 
                    amount={price} 
                    onVerified={handleComplianceVerified} 
                    onCancel={() => setStep('details')} 
                    onContactSupport={onContactSupport}
                />
            )}

            <div className={`absolute inset-0 z-50 bg-slate-50 dark:bg-slate-900  flex items-center justify-center p-4 animate-fade-in rounded-2xl ${step === 'compliance' ? 'hidden' : ''}`}>
                <div className="w-full max-w-sm">
                    <div className="flex justify-end mb-2">
                        <button onClick={onClose} className="p-2 bg-white rounded-full hover:bg-white transition-colors dark:bg-slate-800">
                            <XIcon className="w-5 h-5 text-[#0F172A] dark:text-white" />
                        </button>
                    </div>

                    {step === 'details' && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl animate-fade-in-up">
                            <div className="text-center mb-6">
                                {'image' in item ? (
                                    <img src={item.image} alt={item.name} className="w-32 h-32 object-contain mx-auto rounded-xl shadow-lg mb-4" />
                                ) : (
                                    <div className={`w-full aspect-[1.58/1] rounded-xl shadow-lg mb-4 flex items-center justify-center relative overflow-hidden ${(item as GiftCard).color}`}>
                                         {/* Fallback pattern */}
                                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                                        <div className="w-20 h-20 relative z-10">
                                            <BrandLogo domain={(item as GiftCard).domain} name={item.name} fallback={GiftIcon} className="w-full h-full object-contain drop-shadow-md" />
                                        </div>
                                    </div>
                                )}
                                <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">{item.name}</h3>
                                <p className="text-[#0F172A] text-sm">{'description' in item ? item.description : 'Instant Digital Delivery'}</p>
                            </div>

                            {type === 'giftcard' && (
                                <div className="mb-6">
                                    <label className="text-xs font-bold text-[#0F172A] uppercase tracking-widest mb-2 block">Select Amount</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[25, 50, 100].map(val => (
                                            <button 
                                                key={val}
                                                onClick={() => setAmount(val)}
                                                className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${amount === val ? 'border-primary text-primary bg-primary/10' : 'border-slate-200 dark:border-slate-300 text-[#0F172A] dark:text-white'}`}
                                            >
                                                ${val}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center py-4 border-t border-slate-200 dark:border-white/10 mb-4">
                                <span className="text-sm text-[#0F172A]">Total</span>
                                <span className="text-2xl font-black text-[#0F172A] dark:text-white">
                                    {formatCurrency(price)}
                                </span>
                            </div>

                            <button 
                                onClick={handleInitiatePurchase}
                                className="w-full py-4 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <ShieldCheckIcon className="w-5 h-5" />
                                {type === 'giftcard' ? 'Purchase Code' : 'Authorize Order'}
                            </button>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="text-center">
                            <div className="relative w-24 h-24 mx-auto mb-8">
                                <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-300 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <LockClosedIcon className="w-10 h-10 text-[#0F172A] dark:text-white" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-2">Secure Verification</h3>
                            <p className="text-[#0F172A] dark:text-white text-sm">Processing biometric payment via Secure Enclave...</p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl animate-fade-in-up text-center">
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
                                <CheckCircleIcon className="w-8 h-8 text-[#0F172A] dark:text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white mb-2">Purchase Successful</h3>
                            
                            {type === 'giftcard' ? (
                                <div className="my-6">
                                    <p className="text-xs text-[#0F172A] uppercase tracking-widest mb-2">Your Digital Code</p>
                                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-300 flex items-center justify-between group cursor-pointer" onClick={handleCopy}>
                                        <span className="font-mono text-lg font-bold text-[#0F172A] dark:text-white tracking-widest">{generatedCode}</span>
                                        <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                                            {isCopied ? <CheckCircleIcon className="w-5 h-5 text-green-500" /> : <ClipboardDocumentIcon className="w-5 h-5 text-[#0F172A] dark:text-white" />}
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-[#0F172A] dark:text-white mt-2">Code also sent to secure email.</p>
                                </div>
                            ) : (
                                <p className="text-[#0F172A] text-sm mb-6">
                                    Your order for <strong>{item.name}</strong> has been placed with Priority Fulfillment. Tracking: #PRB-{Math.floor(Math.random()*1000000)}
                                </p>
                            )}
                            
                            <button onClick={onClose} className="w-full py-3 bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 text-[#0F172A] dark:text-white dark:text-white font-bold rounded-xl">
                                Done
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export const ConciergeShopping: React.FC<ConciergeShoppingProps> = ({ onContactSupport }) => {
    const { formatCurrency } = useCurrency();
    const [activeTab, setActiveTab] = useState<Category>('boutique');
    const [selectedStore, setSelectedStore] = useState<StoreType | null>(null);
    const [selectedItem, setSelectedItem] = useState<Product | GiftCard | null>(null);
    const [itemType, setItemType] = useState<'product' | 'giftcard'>('product');

    return (
        <div className="bg-slate-200 dark:bg-slate-900 rounded-[2.5rem] shadow-digital border border-slate-100 dark:border-white/10 overflow-hidden relative min-h-[600px]">
            {/* Modal Layer */}
            {selectedItem && (
                <PurchaseModal 
                    item={selectedItem} 
                    type={itemType} 
                    onClose={() => setSelectedItem(null)} 
                    onContactSupport={onContactSupport}
                />
            )}

            {/* Header */}
            <div className="p-8 border-b border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-slate-900">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight">Lifestyle Mall</h2>
                        <p className="text-xs font-bold text-[#0F172A] uppercase tracking-widest mt-1">Authorized Partner Network</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500 border border-green-500/20 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-bold text-green-500 uppercase">Live Inventory</span>
                    </div>
                </div>

                <div className="flex gap-2 p-1 bg-slate-300 dark:bg-slate-800 rounded-xl overflow-x-auto no-scrollbar">
                    {[
                        { id: 'boutique', label: 'Brand Boutiques' },
                        { id: 'digital', label: 'Digital Vault' },
                        { id: 'rewards', label: 'Redim Rewards' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id as Category); setSelectedStore(null); }}
                            className={`flex-1 px-4 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white shadow-md' : 'text-[#0F172A] hover:text-[#0F172A] dark:hover:text-[#0F172A] dark:text-white'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="p-8">
                
                {/* --- BOUTIQUES TAB --- */}
                {activeTab === 'boutique' && !selectedStore && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
                        {STORES.map(store => (
                            <button 
                                key={store.id}
                                onClick={() => setSelectedStore(store.id as StoreType)}
                                className={`relative h-40 rounded-3xl overflow-hidden shadow-lg transition-all hover:scale-[1.02] active:scale-95 group ${store.color}`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-10 transition-opacity">
                                    {/* Abstract bg pattern */}
                                    <div className="w-64 h-64 bg-white rounded-full blur-3xl dark:bg-slate-800"></div>
                                </div>
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4">
                                    <div className="p-3 bg-white  rounded-2xl mb-3 shadow-xl w-16 h-16 flex items-center justify-center dark:bg-slate-800">
                                        <BrandLogo domain={store.domain} name={store.name} fallback={ShoppingBagIcon} className="w-full h-full object-contain" />
                                    </div>
                                    <span className="font-black uppercase tracking-widest text-sm">{store.name}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* --- SELECTED STORE VIEW --- */}
                {activeTab === 'boutique' && selectedStore && (
                    <div className="animate-fade-in">
                        <button onClick={() => setSelectedStore(null)} className="mb-6 flex items-center text-xs font-bold text-[#0F172A] hover:text-primary transition-colors uppercase tracking-wider">
                            <ChevronRightIcon className="w-4 h-4 rotate-180 mr-1" /> Back to Directory
                        </button>
                        <h3 className="text-xl font-black text-[#0F172A] dark:text-white mb-6 flex items-center gap-3">
                            <div className="w-8 h-8 relative">
                                 <BrandLogo domain={STORES.find(s => s.id === selectedStore)?.domain} name="" fallback={ShoppingBagIcon} className="w-full h-full object-contain" />
                            </div>
                            {STORES.find(s => s.id === selectedStore)?.name}
                        </h3>
                        <div className="space-y-4">
                            {PRODUCTS[selectedStore].map(product => (
                                <div key={product.id} className="flex gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-primary/50 transition-all group">
                                    <div className="w-24 h-24 bg-white rounded-xl p-2 flex items-center justify-center shrink-0 dark:bg-slate-800">
                                        <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-[#0F172A] dark:text-white">{product.name}</h4>
                                            <span className="text-xs font-bold text-[#0F172A] flex items-center"><StarIcon className="w-3 h-3 text-yellow-400 mr-1"/> {product.rating}</span>
                                        </div>
                                        <p className="text-xs text-[#0F172A] mt-1 line-clamp-2">{product.description}</p>
                                        <div className="mt-3 flex justify-between items-center">
                                            <span className="font-mono font-bold text-lg text-[#0F172A] dark:text-white">{formatCurrency(product.price)}</span>
                                            <button 
                                                onClick={() => { setSelectedItem(product); setItemType('product'); }}
                                                className="px-4 py-2 bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 text-[#0F172A] dark:text-white dark:text-white rounded-lg text-xs font-bold uppercase tracking-wide hover:opacity-90 transition-opacity"
                                            >
                                                Buy Now
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- DIGITAL VAULT (GIFT CARDS) --- */}
                {activeTab === 'digital' && (
                    <div className="animate-fade-in-up">
                        <div className="bg-indigo-500 border border-indigo-500/20 p-4 rounded-2xl mb-6 flex items-start gap-3">
                            <BoltIcon className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-indigo-800 dark:text-indigo-200 leading-relaxed font-bold">
                                <strong className="block mb-1">Instant Code Generation</strong>
                                Purchase official digital codes. Upon biometric verification, codes are revealed instantly and emailed to your secure inbox.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            {GIFT_CARDS.map(card => (
                                <button 
                                    key={card.id}
                                    onClick={() => { setSelectedItem(card); setItemType('giftcard'); }}
                                    className={`relative aspect-[1.58/1] rounded-2xl shadow-lg overflow-hidden group transition-transform hover:scale-[1.03] active:scale-95 ${card.color}`}
                                >
                                    {/* Card Visuals */}
                                    <div className="absolute top-2 right-2 opacity-70"><WifiIcon className={`w-4 h-4 rotate-90 ${card.textColor}`} /></div>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                                        <div className="w-16 h-16 relative mb-2 flex items-center justify-center">
                                            <BrandLogo domain={card.domain} name={card.name} fallback={GiftIcon} className="w-full h-full object-contain drop-shadow-xl" />
                                        </div>
                                        <span className={`font-bold text-[10px] uppercase tracking-wider ${card.textColor}`}>{card.name}</span>
                                    </div>
                                    <div className="absolute bottom-3 left-3 opacity-60">
                                         <p className={`text-[8px] font-mono ${card.textColor}`}>•••• •••• •••• ••••</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- REDIM REWARDS --- */}
                {activeTab === 'rewards' && (
                    <div className="animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl text-[#0F172A] dark:text-white shadow-xl">
                            <div>
                                <p className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest">Available Points</p>
                                <p className="text-2xl font-black font-mono text-yellow-400">842,500 <span className="text-xs text-[#0F172A] dark:text-white">PTS</span></p>
                            </div>
                            <div className="p-3 bg-white rounded-full dark:bg-slate-800">
                                <SparklesIcon className="w-6 h-6 text-yellow-400" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {PRODUCTS.redim.map(product => (
                                <div key={product.id} className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 group">
                                    <div className="absolute top-3 right-3 bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider z-10">
                                        Verified Authentic
                                    </div>
                                    <div className="flex flex-col md:flex-row">
                                        <div className="w-full md:w-1/3 h-40 bg-gray-100">
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="p-4 flex flex-col justify-between flex-1">
                                            <div>
                                                <h4 className="font-bold text-[#0F172A] dark:text-white">{product.name}</h4>
                                                <p className="text-xs text-[#0F172A] mt-1">{product.description}</p>
                                            </div>
                                            <div className="mt-4 flex justify-between items-center">
                                                <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                                                    {product.pointsPrice?.toLocaleString()} PTS
                                                </p>
                                                <button className="px-4 py-2 bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 text-[#0F172A] dark:text-white dark:text-white text-xs font-bold uppercase tracking-wider rounded-lg disabled:opacity-70 disabled:cursor-not-allowed" disabled={product.pointsPrice! > 842500}>
                                                    {product.pointsPrice! > 842500 ? 'Insuff. Points' : 'Redeem'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
