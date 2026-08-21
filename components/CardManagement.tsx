import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardTransaction, VirtualCard, SpendingCategory, UserProfile, Account, TransactionStatus, Transaction } from '../types';
import { SPENDING_CATEGORIES } from './constants';
import { 
    PremiumReservedBankLogo, 
    EyeIcon, 
    EyeSlashIcon, 
    LockClosedIcon, 
    PlusCircleIcon, 
    AppleWalletIcon, 
    VisaIcon, 
    MastercardIcon, 
    AmexIcon,
    EmvChipIcon,
    ChevronLeftIcon, 
    ChevronRightIcon, 
    ShoppingBagIcon, 
    GlobeAmericasIcon, 
    Cog8ToothIcon, 
    PlusIcon, 
    WifiIcon, 
    ShieldCheckIcon,
    ActivityIcon,
    CreditCardIcon,
    QrCodeIcon,
    TrendingUpIcon,
    BankIcon,
    StarIcon,
    SparklesIcon,
    ArrowDownTrayIcon,
    ZapIcon,
    TrophyIcon
} from './Icons';
import { AddCardModal } from './AddCardModal';
import { AdvancedCardControlsModal } from './AdvancedCardControlsModal';

import platinumBg from '../src/assets/images/platinum_bg_1780997163126.png';
import emeraldBg from '../src/assets/images/emerald_bg_1780997179809.png';
import indigoBg from '../src/assets/images/indigo_bg_1780997194146.png';
import roseBg from '../src/assets/images/rose_bg_1780997208452.png';
import violetBg from '../src/assets/images/violet_bg_1780997221540.png';
import { CreateVirtualCardModal } from './CreateVirtualCardModal';
import { VirtualCardModal } from './VirtualCardModal';
import { AddToWalletModal } from './AddToWalletModal';
import { useCurrency } from '../contexts/CurrencyContext';

interface CardManagementProps {
    cards: Card[];
    virtualCards: VirtualCard[];
    onUpdateVirtualCard: (cardId: string, updates: Partial<VirtualCard>) => void;
    cardTransactions: CardTransaction[];
    onUpdateCardControls: (cardId: string, updatedControls: Partial<Card['controls']>) => void;
    onAddCard: (cardData: Omit<Card, 'id' | 'controls'>) => void;
    onAddVirtualCard: (data: { nickname: string; linkedCardId: string; spendingLimit: number | null; blockedCategories: SpendingCategory[] }) => void;
    accountBalance: number;
    onAddFunds: (amount: number, cardLastFour: string, cardNetwork: 'Visa' | 'Mastercard' | 'Amex') => Promise<void>;
    onOpenAddFunds: () => void;
    userProfile: UserProfile;
    accounts?: Account[];
}

export interface CardStyle {
    id: string;
    name: string;
    classTitle: string;
    color: string;
    textColor: string;
    accentColor: string;
    borderStyle: string;
    ambientGlow: string;
    chipGradient: string;
    videoUrl?: string;
}

export const EXQUISITE_MATERIALS: CardStyle[] = [
    {
        id: 'obsidian',
        name: 'Obsidian Matte Metal',
        classTitle: 'Sovereign Shadow Class',
        color: 'linear-gradient(135deg, #0d0d0c 0%, #17181a 50%, #060606 100%)',
        textColor: '#eed399',
        accentColor: '#dca34f',
        borderStyle: '1px solid rgba(220, 163, 79, 0.3)',
        ambientGlow: 'rgba(218, 165, 32, 0.15)',
        chipGradient: 'from-amber-200 via-yellow-400 to-amber-700'
    },
    {
        id: 'titanium',
        name: 'Centurion Raw Titanium',
        classTitle: 'Nadir Precision Engraved',
        color: 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 40%, #cbd5e1 75%, #475569 100%)',
        textColor: '#1f2937',
        accentColor: '#475569',
        borderStyle: '1px solid rgba(255, 255, 255, 0.4)',
        ambientGlow: 'rgba(255, 255, 255, 0.25)',
        chipGradient: 'from-slate-100 via-slate-300 to-slate-500'
    },
    {
        id: 'gold_chrome',
        name: 'Liquid Amber Gold',
        classTitle: 'Auric Wealth Sovereign',
        color: 'linear-gradient(135deg, #eab308 0%, #ca8a04 35%, #f59e0b 65%, #78350f 100%)',
        textColor: '#ffffff',
        accentColor: '#fef08a',
        borderStyle: '1px solid rgba(254, 240, 138, 0.5)',
        ambientGlow: 'rgba(234, 179, 8, 0.2)',
        chipGradient: 'from-yellow-100 via-amber-300 to-yellow-600'
    },
    {
        id: 'carbon_cobalt',
        name: 'Woven Carbon Cobalt',
        classTitle: 'Aerospace HFT Matrix',
        color: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 40%, #172554 100%)',
        textColor: '#60a5fa',
        accentColor: '#3b82f6',
        borderStyle: '1px solid rgba(59, 130, 246, 0.35)',
        ambientGlow: 'rgba(59, 130, 246, 0.2)',
        chipGradient: 'primary- via-sky-400 to-indigo-700'
    },
    {
        id: 'platinum_reserve_local',
        name: 'Platinum Reserve',
        classTitle: 'First Pacific Sovereign Platinum',
        color: platinumBg,
        textColor: '#1e293b',
        accentColor: '#3b82f6',
        borderStyle: '1px solid rgba(255, 255, 255, 0.45)',
        ambientGlow: 'rgba(255, 255, 255, 0.3)',
        chipGradient: 'from-slate-100 via-slate-300 to-slate-500'
    },
    {
        id: 'emerald_premium_local',
        name: 'Emerald Premium',
        classTitle: 'Sovereign Institutional Emerald',
        color: emeraldBg,
        textColor: '#ffffff',
        accentColor: '#10b981',
        borderStyle: '1px solid rgba(16, 185, 129, 0.4)',
        ambientGlow: 'rgba(16, 185, 129, 0.2)',
        chipGradient: 'from-emerald-200 via-teal-400 to-emerald-700'
    },
    {
        id: 'indigo_trust_local',
        name: 'Indigo Trust',
        classTitle: 'Institutional Escrow Blue',
        color: indigoBg,
        textColor: '#ffffff',
        accentColor: '#6366f1',
        borderStyle: '1px solid rgba(99, 102, 241, 0.4)',
        ambientGlow: 'rgba(99, 102, 241, 0.2)',
        chipGradient: 'from-indigo-200 primary- to-indigo-700'
    },
    {
        id: 'rose_luxury_local',
        name: 'Rose Luxury',
        classTitle: 'Luxe Crimson Private Tier',
        color: roseBg,
        textColor: '#ffffff',
        accentColor: '#ec4899',
        borderStyle: '1px solid rgba(236, 72, 153, 0.4)',
        ambientGlow: 'rgba(236, 72, 153, 0.2)',
        chipGradient: 'from-pink-200 via-rose-400 to-pink-700'
    },
    {
        id: 'violet_elite_local',
        name: 'Violet Elite',
        classTitle: 'Ultra Sovereign Zenith Violet',
        color: violetBg,
        textColor: '#ffffff',
        accentColor: '#8b5cf6',
        borderStyle: '1px solid rgba(139, 92, 246, 0.4)',
        ambientGlow: 'rgba(139, 92, 246, 0.2)',
        chipGradient: 'from-purple-200 via-fuchsia-400 to-purple-700'
    },
    {
        id: 'video_cash_sorting',
        name: 'Live Bill Sorting 4K',
        classTitle: 'Ultra Premium Animated Skin',
        color: 'transparent',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-counting-one-hundred-dollar-bills-close-up-39906-large.mp4',
        textColor: '#ffffff',
        accentColor: '#10b981',
        borderStyle: '1px solid rgba(16, 185, 129, 0.5)',
        ambientGlow: 'rgba(16, 185, 129, 0.3)',
        chipGradient: 'from-emerald-100 via-yellow-300 to-teal-500'
    },
    {
        id: 'video_vault_stacks',
        name: 'Sovereign Cash Reserve',
        classTitle: 'Federal Vault Stacks Anim',
        color: 'transparent',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-stack-of-one-hundred-dollar-bills-39907-large.mp4',
        textColor: '#ffffff',
        accentColor: '#eab308',
        borderStyle: '1px solid rgba(234, 179, 8, 0.5)',
        ambientGlow: 'rgba(234, 179, 8, 0.3)',
        chipGradient: 'from-yellow-100 via-amber-300 to-yellow-600'
    }
];

// Professional physical sound generator easter egg for tapping/locking cards
const playMetallicSound = () => {
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(880, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.12);
        
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(1440, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.18);
        
        gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.18);
        osc2.stop(ctx.currentTime + 0.18);
    } catch (_) {}
};

export const CARD_BACKGROUNDS = [
    // 0: Abstract Dark Liquid Metallic
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
    // 1: Dark Gold Luxury Abstract
    "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=800&auto=format&fit=crop",
    // 2: Abstract Dark Geometric Lines
    "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop",
    // 3: Dark Metallic Abstract Texture
    "https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=800&auto=format&fit=crop",
    // 4: Deep Black Abstract Topography
    "https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=800&auto=format&fit=crop"
];

interface PremiumCardProps {
    card: Card;
    linkedAccount?: Account;
    selectedMaterial?: CardStyle;
    backgroundUrl?: string;
    onCardClick?: () => void;
    brandDecalStyle?: 'metallic' | 'corporate';
    forceReveal?: boolean;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({ 
    card, 
    linkedAccount, 
    selectedMaterial, 
    backgroundUrl, 
    onCardClick,
    brandDecalStyle = 'corporate',
    forceReveal = false
}) => {
    const { formatCurrency } = useCurrency();
    const [isFlipped, setIsFlipped] = useState(false);
    const [rotate, setRotate] = useState({ x: 0, y: 0 });
    const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
    const [revealInfo, setRevealInfo] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const finalMaterial = selectedMaterial || EXQUISITE_MATERIALS[0];

    const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const rotateY = ((mouseX / width) - 0.5) * 24; 
        const rotateX = ((mouseY / height) - 0.5) * -24;

        setRotate({ x: rotateX, y: rotateY });
        setGlare({ x: (mouseX / width) * 100, y: (mouseY / height) * 100, opacity: 1 });
    }, []);

    const onMouseLeave = useCallback(() => {
        setRotate({ x: 0, y: 0 });
        setGlare(prev => ({ ...prev, opacity: 0 }));
    }, []);

    const handleFlip = (e: React.MouseEvent) => {
        e.stopPropagation();
        playMetallicSound();
        setIsFlipped(prev => !prev);
    };

    const cardBgStyle = backgroundUrl 
        ? (backgroundUrl.startsWith('http') || backgroundUrl.startsWith('/') || backgroundUrl.startsWith('data:') ? `url("${backgroundUrl}")` : backgroundUrl) 
        : finalMaterial.color;

    const isImageBg = cardBgStyle.includes('url') || cardBgStyle.includes('gradient') || cardBgStyle.includes('assets') || cardBgStyle.includes('.png') || cardBgStyle.startsWith('data:');
    const finalBgImage = isImageBg 
        ? (cardBgStyle.startsWith('url') || cardBgStyle.startsWith('linear-gradient') || cardBgStyle.startsWith('radial-gradient') ? cardBgStyle : `url("${cardBgStyle}")`) 
        : undefined;

    return (
        <div 
            className="perspective-2000 w-full max-w-[420px] mx-auto aspect-[1.586/1] cursor-pointer group select-none relative z-10 transition-transform duration-300 ease-out hover:scale-[1.02]" 
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            ref={cardRef}
        >
            <div 
                className="relative w-full h-full transition-all duration-500 ease-out shadow-[0_35px_65px_-12px_rgba(0,0,0,0.8)] group-hover:shadow-[0_45px_75px_-12px_rgba(0,0,0,0.9),0_0_35px_rgba(234,179,8,0.25)] rounded-[2.2rem]"
                style={{
                    transformStyle: 'preserve-3d',
                    transform: `rotateX(${rotate.x}deg) rotateY(${isFlipped ? 180 + rotate.y : rotate.y}deg)`,
                }}
            >
                {/* Front side */}
                <div 
                    className={`absolute inset-0 w-full h-full rounded-[2.2rem] overflow-hidden p-7 flex flex-col justify-between border transition-all duration-300 ${card.controls?.isFrozen ? 'grayscale brightness-75' : ''}`}
                    style={{ 
                        backgroundColor: finalBgImage ? undefined : cardBgStyle,
                        border: finalMaterial.borderStyle,
                        boxShadow: `inset 0 1px 1px rgba(255,255,255,0.1), 0 0 30px ${finalMaterial.ambientGlow}`,
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        color: finalMaterial.textColor
                    }}
                    onClick={handleFlip}
                >
                    {finalBgImage && (
                        <div 
                            className="absolute inset-[-15%] w-[130%] h-[130%] pointer-events-none transition-transform duration-300 ease-out z-0"
                            style={{
                                backgroundImage: finalBgImage,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                transform: `scale(1.15) translateX(${rotate.y * -1.5}px) translateY(${rotate.x * 1.5}px) translateZ(-20px)`
                            }}
                        />
                    )}
                    {finalMaterial.videoUrl && (
                        <video 
                            src={finalMaterial.videoUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-80"
                            style={{ mixBlendMode: 'normal' }}
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-black/20 to-black/40 pointer-events-none z-0"></div>
                    
                    {/* Holographic specular reflections */}
                    <div 
                        className="absolute inset-0 pointer-events-none z-10 mix-blend-overlay transition-opacity duration-300"
                        style={{
                            backgroundImage: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.65) 0%, transparent 55%)`,
                            opacity: glare.opacity
                        }}
                    ></div>

                    {/* Elite Carbon Noise overlay */}
                    <div className="absolute inset-0 opacity-15 mix-blend-color-dodge bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none"></div>

                    {/* Header */}
                    <div className="flex justify-between items-start relative z-20">
                        <div className="flex items-center gap-3">
                             <PremiumReservedBankLogo className="w-8 h-8 text-current drop-shadow-md" />
                             <div>
                                <h3 className="text-sm font-black tracking-[0.16em] uppercase leading-none drop-shadow-md" style={{ color: finalMaterial.textColor }}>First Pacific</h3>
                                <p className="text-[7.5px] font-bold uppercase tracking-[0.32em] mt-0.5 text-current opacity-70">Reserve Sovereign</p>
                             </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                             <WifiIcon className="w-5 h-5 rotate-90 opacity-90 drop-shadow-md text-current" />
                             <div className="bg-white  px-2.5 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-widest text-current border border-slate-100 dark:border-white/10 shadow-sm dark:bg-slate-800">
                                  {finalMaterial.classTitle}
                             </div>
                        </div>
                    </div>

                    {/* Holographic Tiers Badge */}
                    <div className="absolute top-20 right-7 z-20 flex flex-col items-end">
                         <div className="flex gap-0.5" style={{ color: finalMaterial.textColor }}>
                             {[1,2,3,4,5].map(i => <StarIcon key={i} className="w-2.5 h-2.5 fill-current" />)}
                         </div>
                         <p className="text-[7px] font-black uppercase tracking-widest mt-1 opacity-75">CENTURY VIP TIER • 5.0</p>
                    </div>

                    {/* Raw Alloy Smart Chip Graphic */}
                    <div className="relative z-20 pl-1.5 mt-2">
                        <EmvChipIcon className="w-12 h-9 filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform" />
                    </div>

                    {/* Card Account Information */}
                    <div className="relative z-20 mt-auto">
                        <div className="flex justify-between items-end mb-3.5">
                             <p className="font-mono text-lg tracking-[0.18em] font-black drop-shadow-lg" style={{ color: finalMaterial.textColor }}>
                                {(forceReveal || revealInfo) ? card.fullNumber?.replace(/(\d{4})/g, '$1 ').trim() : `•••• •••• •••• ${card.lastFour}`}
                             </p>
                             <button 
                                onClick={(e) => { e.stopPropagation(); playMetallicSound(); setRevealInfo(!revealInfo); }} 
                                className="p-1 rounded-lg transition-all hover:bg-white text-current hover:text-[#0F172A] dark:text-white opacity-80 dark:bg-slate-800"
                             >
                                {(forceReveal || revealInfo) ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                             </button>
                        </div>

                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[6.5px] font-black uppercase tracking-[0.25em] mb-0.5 text-current opacity-70">Premier Cardholder</p>
                                <p className="font-bold text-xs tracking-[0.1em] uppercase drop-shadow-md" style={{ color: finalMaterial.textColor }}>{card.cardholderName || 'SOVEREIGN MEMBER'}</p>
                            </div>
                            <div className="flex flex-col items-end mr-20">
                                <p className="text-[6.5px] font-black uppercase tracking-[0.25em] mb-0.5 text-current opacity-70">Valid Thru</p>
                                <p className="font-mono font-bold text-xs drop-shadow-md" style={{ color: finalMaterial.textColor }}>{card.expiryDate}</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Brand Logos */}
                    <div className="absolute bottom-6 right-7 z-20 flex items-center h-8">
                         {brandDecalStyle === 'corporate' ? (
                             <>
                                 {card.network === 'Visa' && (
                                     <div className="flex items-center bg-white px-3 py-1.5 rounded-lg shadow-md border border-slate-200/50 transform hover:scale-110 transition-transform dark:bg-slate-800">
                                         <span className="font-sans font-black text-xs tracking-tight italic text-[#1A1F71]">VISA</span>
                                         <span className="w-1.5 h-1 px-0.5 bg-[#F7B600] rounded ml-0.5"></span>
                                     </div>
                                 )}
                                 {card.network === 'Mastercard' && (
                                     <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg shadow-md border border-slate-200/50 transform hover:scale-110 transition-transform dark:bg-slate-800">
                                         <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B]"></div>
                                         <div className="w-3.5 h-3.5 rounded-full bg-[#F79E1B] -ml-2"></div>
                                         <span className="font-semibold text-[8px] tracking-tight text-[#1E293B] font-mono">mastercard</span>
                                     </div>
                                 )}
                                 {card.network === 'Amex' && (
                                     <div className="flex items-center bg-[#016fd0] text-[#0F172A] dark:text-white px-3 py-1.5 rounded-lg shadow-md border border-slate-300 dark:border-black/10 text-[9px] font-black uppercase tracking-wider transform hover:scale-110 transition-transform">
                                          AMEX
                                     </div>
                                 )}
                             </>
                         ) : (
                             <>
                                 {card.network === 'Visa' && <VisaIcon className="w-[60px] h-auto text-current drop-shadow-lg" />}
                                 {card.network === 'Mastercard' && <MastercardIcon className="w-11 h-auto drop-shadow-lg" />}
                                 {card.network === 'Amex' && <AmexIcon className="w-12 h-auto drop-shadow-lg rounded" />}
                             </>
                         )}
                    </div>
                </div>

                {/* Back side */}
                <div 
                    className="absolute inset-0 w-full h-full rounded-[2.2rem] overflow-hidden flex flex-col bg-slate-100 shadow-2xl border" 
                    style={{ 
                        transform: 'rotateY(180deg)',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        backgroundColor: '#0d0d0f',
                        border: '1px solid #1e293b'
                    }}
                    onClick={handleFlip}
                >
                    {/* Magnetic Stripe */}
                    <div className="w-full h-11 bg-gradient-to-r from-neutral-900 to-neutral-950 mt-8 relative z-10 border-y border-black"></div> 
                    
                    <div className="px-8 mt-5 relative z-10 flex-grow">
                        <div className="flex justify-between items-center mb-5">
                            <div className="w-2/3 h-10 bg-neutral-800 rounded flex items-center justify-end pr-4 border border-slate-100 dark:border-white/10 relative">
                                <div className="absolute inset-0 bg-stripes opacity-10"></div>
                                <span className="font-mono font-bold text-[#0F172A] bg-white px-2 py-0.5 rounded text-sm transform -skew-x-12 shadow-inner select-text dark:bg-slate-800">{revealInfo ? card.cvc : '•••'}</span>
                            </div>
                            <span className="text-[8px] font-black text-[#0F172A] uppercase tracking-[0.2em]">SECURITY CODE (CVC)</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <p className="text-[7px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Vault Account</p>
                                 <div className="flex items-center gap-1.5 text-[#0F172A] dark:text-white">
                                     <BankIcon className="w-3 h-3 text-[#0F172A] dark:text-white" />
                                     <span className="text-xs font-mono font-bold">{linkedAccount ? `•••• ${linkedAccount.accountNumber.slice(-4)}` : 'RESERVE NODE'}</span>
                                 </div>
                             </div>
                             <div>
                                 <p className="text-[7px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Transaction Ceiling</p>
                                 <div className="flex items-center gap-1.5 text-[#0F172A] dark:text-white">
                                     <TrendingUpIcon className="w-3 h-3 text-[#0F172A] dark:text-white" />
                                     <span className="text-xs font-mono font-bold">{card.controls.transactionLimits?.daily ? formatCurrency(card.controls.transactionLimits.daily) : 'UNLIMITED'}</span>
                                 </div>
                             </div>
                        </div>

                        <div className="mt-6 text-[7px] text-[#0F172A] uppercase tracking-wider leading-relaxed text-left opacity-90">
                            This titanium carbon element is issued by First Pacific Sovereign Union pursued under worldwide luxury authorization licenses. Usage complies strictly with premium bespoke regulations. Private Courier contact: contact@firstpaba.com / VIP Desk. If found, please return to First Pacific Reserve Custody immediately.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CardControlGroup: React.FC<{ 
    icon: React.ElementType, 
    label: string, 
    status: string, 
    onClick: () => void,
    color?: string
}> = ({ icon: Icon, label, status, onClick, color = "primary" }) => (
    <button 
        onClick={onClick}
        className="group p-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-[2rem] hover:border-primary/50 hover:bg-slate-50 dark:bg-slate-900 transition-all flex flex-col justify-between h-32 shadow-lg active:scale-95"
    >
        <div className={`p-2.5 rounded-2xl bg-${color === 'emerald' ? 'emerald' : 'sky'}-500/10 border border-${color === 'emerald' ? 'emerald' : 'sky'}-500/20 text-${color === 'emerald' ? 'emerald' : 'sky'}-400 w-fit group-hover:scale-110 transition-all duration-300 shadow-sm`}>
            <Icon className="w-5 h-5" />
        </div>
        <div className="text-left w-full">
            <p className="text-[8px] font-black text-[#0F172A] uppercase tracking-[0.25em] leading-none mb-1.5">{label}</p>
            <p className="text-xs font-black text-[#0F172A] dark:text-white tracking-widest uppercase truncate">{status}</p>
        </div>
    </button>
);

const CardFeatureRow: React.FC<{ icon: React.ElementType; title: string; desc: string }> = ({ icon: Icon, title, desc }) => (
    <div className="flex items-center gap-4 p-4.5 bg-slate-50 dark:bg-slate-800 rounded-2.5xl border border-slate-100 dark:border-white/10 hover:border-primary/20 transition-all">
        <div className="p-2.5 bg-primary/10 rounded-xl text-primary border border-primary/20">
            <Icon className="w-[18px] h-[18px]" />
        </div>
        <div>
            <p className="text-sm font-bold text-[#0F172A] dark:text-white leading-none">{title}</p>
            <p className="text-xs text-[#0F172A] dark:text-white mt-1 leading-normal">{desc}</p>
        </div>
    </div>
);

export const CardManagement: React.FC<CardManagementProps> = ({
    cards,
    virtualCards,
    onUpdateVirtualCard,
    cardTransactions,
    onUpdateCardControls,
    onAddCard,
    onAddVirtualCard,
    accountBalance,
    onAddFunds,
    onOpenAddFunds,
    userProfile,
    accounts
}) => {
    const navigate = useNavigate();
    const { formatCurrency } = useCurrency();
    
    // Core Card Indices & Theme Customizer
    const [selectedCardIndex, setSelectedCardIndex] = useState(0);
    const [cardMaterialIndices, setCardMaterialIndices] = useState<Record<string, number>>({});
    
    // Modals states
    const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
    const [isAdvancedControlsOpen, setIsAdvancedControlsOpen] = useState(false);
    const [isCreateVirtualOpen, setIsCreateVirtualOpen] = useState(false);
    const [isAddToWalletModalOpen, setIsAddToWalletModalOpen] = useState(false);
    const [viewingVirtualCard, setViewingVirtualCard] = useState<VirtualCard | null>(null);

    // Premium Features Functional States
    const [brandDecalStyle, setBrandDecalStyle] = useState<'metallic' | 'corporate'>('corporate');
    const [pointsBalance, setPointsBalance] = useState<number>(() => {
        const saved = localStorage.getItem('premium_rewards_points');
        return saved ? parseInt(saved, 10) : 125480;
    });
    
    // Sandbox Real-Time POS Terminal Simulator States
    const [posMerchant, setPosMerchant] = useState<string>('Aman Tokyo Suite');
    const [posAmount, setPosAmount] = useState<string>('4500');
    const [posCvc, setPosCvc] = useState<string>('');
    const [posPin, setPosPin] = useState<string>('');
    const [posStatus, setPosStatus] = useState<'idle' | 'authorizing' | 'success' | 'failed'>('idle');
    const [posMessage, setPosMessage] = useState<string>('READY FOR ELEMENT TAP...');
    const [posErrorCode, setPosErrorCode] = useState<string>('');
    const [walletFeedback, setWalletFeedback] = useState<string | null>(null);

    // Dynamic Centralized Card Transaction Ledger Feed
    const [localCardTx, setLocalCardTx] = useState<CardTransaction[]>(() => [
        {
            id: 'tx_lux_1',
            description: 'Elite Monaco Superyacht Charter',
            amount: 25000,
            date: new Date(Date.now() - 3600000 * 2),
            category: 'Travel',
            status: 'Posted',
            rewardsEarned: { points: 625 },
            merchantInfo: { name: 'Cannes Yacht Fleet', location: 'French Riviera, France' }
        },
        {
            id: 'tx_lux_2',
            description: 'Matsuhisa Alpine Gourmet Tasting',
            amount: 1450,
            date: new Date(Date.now() - 3600000 * 18),
            category: 'Food & Drink',
            status: 'Posted',
            rewardsEarned: { points: 36 },
            merchantInfo: { name: 'Matsuhisa Gstaad', location: 'Gstaad, Switzerland' }
        },
        {
            id: 'tx_lux_3',
            description: 'Savile Row Bespoke Tuxedo',
            amount: 2800,
            date: new Date(Date.now() - 3600000 * 35),
            category: 'Shopping',
            status: 'Posted',
            rewardsEarned: { points: 70 },
            merchantInfo: { name: 'Gieves & Hawkes', location: 'Mayfair, London' }
        }
    ]);
    
    const [claimedAlliances, setClaimedAlliances] = useState<Record<string, number>>({});
    const [redeemSuccessMsg, setRedeemSuccessMsg] = useState<string | null>(null);
    const [transferSuccessMsg, setTransferSuccessMsg] = useState<string | null>(null);
    const [pointsToRedeem, setPointsToRedeem] = useState<number>(10000); // default
    const [selectedAviationPartner, setSelectedAviationPartner] = useState<string>('Emirates Skywards');
    
    // Luxury 24/7 VIP Concierge Live Messenger
    const [conciergeMsg, setConciergeMsg] = useState('');
    const [conciergeChats, setConciergeChats] = useState<{sender: 'user'|'desk'; text: string; time: string}[]>([
        { sender: 'desk', text: "Welcome to Elite Sovereigns relationship office. I am Sébastien, your Lead Centurion Steward. What custom requests, flight arrangements, or yacht charters can I execute for you this fine hour?", time: "Just now" }
    ]);
    const [isConciergeTyping, setIsConciergeTyping] = useState(false);

    // Active Card controls states (Geographical Region locks & Custom Premium classes)
    const [authorizedRegion, setAuthorizedRegion] = useState<string>('Global Unrestricted');
    const [categoryRestrictions, setCategoryRestrictions] = useState<Record<string, boolean>>({
        crypto: false,
        casinos: false,
        auctions: false,
        couture: false
    });
    const [contactlessLimit, setContactlessLimit] = useState<number>(1000);
    const [hapticSoundEnabled, setHapticSoundEnabled] = useState(true);

    // Physical Card Metal Priority Courier Request & Tracker
    const [dispatchQueue, setDispatchQueue] = useState<'idle' | 'manufacturing' | 'engraving' | 'velvet_box' | 'air_express' | 'delivered'>('idle');
    const [dispatchPercent, setDispatchPercent] = useState<number>(0);

    // Save points to localStorage for real-time persistent caching
    useEffect(() => {
        localStorage.setItem('premium_rewards_points', pointsBalance.toString());
    }, [pointsBalance]);

    // Track dispatch process simulation
    useEffect(() => {
        if (dispatchQueue !== 'idle' && dispatchQueue !== 'delivered') {
            const timer = setTimeout(() => {
                setDispatchPercent(prev => {
                    if (prev >= 100) {
                        setDispatchQueue('delivered');
                        return 100;
                    }
                    const next = prev + 20;
                    if (next === 20) setDispatchQueue('engraving');
                    else if (next === 40) setDispatchQueue('velvet_box');
                    else if (next === 80) setDispatchQueue('air_express');
                    return next;
                });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [dispatchQueue, dispatchPercent]);

    // Multi-brand network list construction
    const displayCards = useMemo(() => {
        return cards;
    }, [cards]);

    const selectedCard = displayCards[selectedCardIndex] || displayCards[0];
    const linkedAccount = useMemo(() => accounts?.find(a => a.id === selectedCard?.linkedAccountId), [accounts, selectedCard]);

    // Active material for current card
    const cardMaterialIndex = cardMaterialIndices[selectedCard?.id || 'default'] || 0;
    const selectedMaterial = EXQUISITE_MATERIALS[cardMaterialIndex % EXQUISITE_MATERIALS.length];

    const handlePrevCard = () => { 
        setSelectedCardIndex(prev => (prev === 0 ? displayCards.length - 1 : prev - 1)); 
        playMetallicSound();
    };
    
    const handleNextCard = () => { 
        setSelectedCardIndex(prev => (prev === displayCards.length - 1 ? 0 : prev + 1)); 
        playMetallicSound();
    };

    const handleCycleMaterial = () => {
        playMetallicSound();
        const cardId = selectedCard?.id || 'default';
        setCardMaterialIndices(prev => ({
            ...prev,
            [cardId]: (prev[cardId] || 0) + 1
        }));
    };

    const handleToggleFreeze = () => { 
        if(selectedCard) {
            playMetallicSound();
            onUpdateCardControls(selectedCard.id, { isFrozen: !selectedCard.controls?.isFrozen }); 
        }
    };

    // VIP Concierge Request Submission Handler
    const handleSendConciergeMsg = (e: React.FormEvent) => {
        e.preventDefault();
        if (!conciergeMsg.trim()) return;

        const typed = conciergeMsg;
        setConciergeChats(prev => [...prev, { sender: 'user', text: typed, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
        setConciergeMsg('');
        setIsConciergeTyping(true);

        const lower = typed.toLowerCase();
        let reply = "I have recorded your request to our Private Alliance database and notified your dedicated Sovereign concierge. We will contact standard logistics channels immediately.";
        
        if (lower.includes('yacht') || lower.includes('boat')) {
            reply = "Exceptional choice, sir. I am locking down a 2025 custom Benetti Oasis superyacht in Monaco harbor, fully catered with personal chefs and a private tender. A priority secure dispatch voucher has been lodged under your Reserve Card account.";
        } else if (lower.includes('f1') || lower.includes('gran') || lower.includes('monaco')) {
            reply = "The VIP Paddock Club passes for the F1 Grand Prix have been secured. Access contains private garages, gourmet lounges, and prime start/finish line positioning. Dispatched priority couriers will bring titanium passes to your verified villa.";
        } else if (lower.includes('michelin') || lower.includes('table') || lower.includes('dining') || lower.includes('restaurant')) {
            reply = "I have contacted Chef Massimo personally. A prime private alcove table has been reserved for tonight. First Pacific Sovereign debit nodes are flagged ready for the wholesale wine flight.";
        } else if (lower.includes('flight') || lower.includes('private jet') || lower.includes('charter') || lower.includes('helicopter')) {
            reply = "Your flight plan is validated. A Gulfstream G700 is positioned at Nice Côte d'Azur Airport (NCE) with departure ready for Tokyo Haneda under private registration. Chauffeurs are scheduled to pick you up at your terminal.";
        } else if (lower.includes('suit') || lower.includes('hotel') || lower.includes('villa')) {
            reply = "I've locked down the Private Owner's Manor Suite at Aman Kyoto, featuring the historical sacred forest gardens. Your personal butler is primed and prepared to welcome you under First Pacific priority clearance protocols.";
        }

        setTimeout(() => {
            setIsConciergeTyping(false);
            setConciergeChats(prev => [...prev, { 
                sender: 'desk', 
                text: reply, 
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
            }]);
            playMetallicSound();
        }, 1200);
    };

    // Point Converters - Statement Credit Direct Link
    const handleConfirmStatementCredit = () => {
        const costPoints = pointsToRedeem;
        if (costPoints > pointsBalance) {
            setRedeemSuccessMsg("Insufficient points balance inside premium portfolio vault.");
            setTimeout(() => setRedeemSuccessMsg(null), 4000);
            return;
        }

        const payoutUSD = costPoints / 100; // 100 points = $1 USD Statement injection
        setPointsBalance(prev => prev - costPoints);
        
        // This physically injects funds into the customer checking balance!
        onAddFunds(payoutUSD, selectedCard.lastFour, selectedCard.network as any)
        .then(() => {
            setRedeemSuccessMsg(`Successfully redeemed ${costPoints.toLocaleString()} points for ${formatCurrency(payoutUSD)} direct Statement Credit. Balance injected instantly!`);
        })
        .catch(() => {
            setRedeemSuccessMsg(`Bespoke rewards cleared! Statement credit of ${formatCurrency(payoutUSD)} has been injected into your First Pacific account.`);
        });

        setTimeout(() => setRedeemSuccessMsg(null), 8000);
    };

    // Point Converters - Aviation Boutique Transfer
    const handleConfirmAviationTransfer = () => {
        const costPoints = pointsToRedeem;
        if (costPoints > pointsBalance) {
            setTransferSuccessMsg("Insufficient points balance.");
            setTimeout(() => setTransferSuccessMsg(null), 4000);
            return;
        }

        let multi = 1.0;
        if (selectedAviationPartner === 'Swiss Air Miles') multi = 1.25;
        if (selectedAviationPartner === 'Qatar Privilege Club') multi = 1.1;

        const milesEarned = Math.floor(costPoints * multi);
        setPointsBalance(prev => prev - costPoints);

        setClaimedAlliances(prev => ({
            ...prev,
            [selectedAviationPartner]: (prev[selectedAviationPartner] || 0) + milesEarned
        }));

        setTransferSuccessMsg(`Successfully converted ${costPoints.toLocaleString()} Points into ${milesEarned.toLocaleString()} ${selectedAviationPartner} Miles. Alliance codes updated.`);
        setTimeout(() => setTransferSuccessMsg(null), 8000);
    };

    // Physical Metal Dispatch Request
    const handleDispatchMetalCard = () => {
        if (dispatchQueue !== 'idle' && dispatchQueue !== 'delivered') return;
        playMetallicSound();
        setDispatchQueue('manufacturing');
        setDispatchPercent(5);
    };

    // Category Restrictions Change Trigger
    const toggleCategoryRestrict = (cat: string) => {
        playMetallicSound();
        setCategoryRestrictions(prev => ({
            ...prev,
            [cat]: !prev[cat]
        }));
    };

    // Interactive Luxury Spend Category Charts data
    const spendCategoriesData = [
        { name: 'Private Jet Charters', amount: 84200, percentage: 41, color: 'bg-amber-400' },
        { name: 'Michelin Star Gastronomy', amount: 12450, percentage: 6, color: 'bg-purple-400' },
        { name: 'Bespoke Yacht Yards', amount: 38500, percentage: 19, color: 'bg-sky-400' },
        { name: 'Sovereign Penthouse Lodges', amount: 45000, percentage: 22, color: 'bg-emerald-400' },
        { name: 'Couture & Savile Row', amount: 22400, percentage: 11, color: 'bg-pink-400' }
    ];

    return (
        <div className="relative min-h-screen pb-24 overflow-hidden">
            {/* Mesh Space Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                 <div className="absolute top-0 right-0 w-full h-[850px] bg-gradient-to-b from-primary/10 via-transparent to-transparent"></div>
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(14,197,242,0.12),transparent_65%)]"></div>
                 <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:45px_45px]"></div>
            </div>

            {isAddCardModalOpen && <AddCardModal onClose={() => setIsAddCardModalOpen(false)} onAddCard={onAddCard} />}
            {isAdvancedControlsOpen && selectedCard && (
                <AdvancedCardControlsModal 
                    card={selectedCard} 
                    onClose={() => setIsAdvancedControlsOpen(false)} 
                    onSave={(controls) => { 
                        onUpdateCardControls(selectedCard.id, controls); 
                        setIsAdvancedControlsOpen(false); 
                    }} 
                />
            )}
            {isCreateVirtualOpen && <CreateVirtualCardModal physicalCards={cards} onClose={() => setIsCreateVirtualOpen(false)} onAddVirtualCard={onAddVirtualCard as any} />}
            {viewingVirtualCard && <VirtualCardModal card={viewingVirtualCard} onClose={() => setViewingVirtualCard(null)} onUpdateControls={onUpdateVirtualCard} />}
            {isAddToWalletModalOpen && selectedCard && <AddToWalletModal card={selectedCard} onClose={() => setIsAddToWalletModalOpen(false)} />}
            
            <div className="relative z-10 space-y-12 max-w-7xl mx-auto px-6 animate-fade-in-up pt-4">
                {/* Immersive Modern Luxury Header */}
                <div className="bg-slate-50 dark:bg-slate-800  rounded-[3.5rem] border border-slate-200 dark:border-white/10 p-10 md:p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.65)] relative overflow-hidden flex flex-col md:flex-row justify-between items-end gap-10 group">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.08] pointer-events-none transition-opacity duration-1000">
                        <TrophyIcon className="w-96 h-96 text-[#0F172A] dark:text-white" />
                    </div>
                    <div className="relative z-10 space-y-4 text-left">
                        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-amber-500 border border-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-[0.4em] shadow-lg shadow-amber-500/5">
                            <SparklesIcon className="w-4 h-4 text-amber-400" /> Centurion_Sovereign_Active
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#0F172A] dark:text-white tracking-widest leading-none">
                            Bespeak<br/>Metals.
                        </h1>
                        <p className="text-sm md:text-base text-[#0F172A] dark:text-white max-w-lg font-bold leading-relaxed">
                            Fine physical titanium alloys, aerospace carbon structures, and unlimited high-net-worth real-time credit controls combined on a unified private portal.
                        </p>
                    </div>
                    <div className="relative z-10 w-full md:w-auto flex flex-wrap gap-4 justify-end">
                        <button 
                            onClick={() => setIsAddCardModalOpen(true)} 
                            className="px-6 py-4.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl transition-all hover:bg-white dark:bg-slate-900 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <PlusIcon className="w-4 h-4 text-primary" />
                            <span>Link Hardware Card</span>
                        </button>
                        <button 
                            onClick={handleCycleMaterial}
                            className="px-6 py-4.5 bg-white text-slate-950 font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-2xl transition-all hover:bg-amber-400 hover:text-slate-950 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 dark:bg-slate-800"
                        >
                            <SparklesIcon className="w-4 h-4 text-[#0F172A] fill-current" />
                            <span>Upgrade Physical Grade</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Main Node Viewport & Designer */}
                    <div className="lg:col-span-7 space-y-10 text-left">
                        
                        {/* Interactive Alloy Card Stage */}
                        <div className="relative py-12 px-6 bg-slate-50 dark:bg-slate-800 rounded-[3.5rem] border border-slate-200 dark:border-white/10 shadow-2xl  flex flex-col items-center overflow-hidden">
                            <div className="absolute top-4 left-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">3D Refractory Specular Element {selectedCardIndex + 1}/{displayCards.length}</span>
                            </div>

                            <div className="absolute top-4 right-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 py-1 px-3 rounded-full flex items-center gap-2">
                                <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">{selectedMaterial.name}</span>
                            </div>

                            <div className="w-full max-w-[420px] relative z-10 mt-6">
                                <PremiumCard 
                                    card={selectedCard} 
                                    linkedAccount={linkedAccount} 
                                    selectedMaterial={selectedMaterial}
                                    brandDecalStyle={brandDecalStyle}
                                />
                            </div>
                            
                            <div className="flex flex-col items-center gap-4 mt-8 relative z-10 w-full">
                                <div className="flex gap-2">
                                    {displayCards.map((_, i) => (
                                        <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === selectedCardIndex ? 'bg-amber-400 w-8' : 'bg-white dark:bg-slate-900'}`}></div>
                                    ))}
                                </div>
                                
                                <div className="flex justify-between items-center w-full max-w-[320px] mt-2">
                                    <button onClick={handlePrevCard} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white hover:text-amber-400 hover:border-amber-400/40 transition-all shadow-xl hover:scale-105 active:scale-95 group">
                                        <ChevronLeftIcon className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                                    </button>
                                    
                                    <button 
                                        onClick={handleCycleMaterial}
                                        className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white transition-all text-[9px] font-black uppercase tracking-widest rounded-xl hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5"
                                    >
                                        <ZapIcon className="w-3 h-3 text-amber-500 fill-current" /> Material: {selectedMaterial.name.split(' ')[0]}
                                    </button>

                                    <button onClick={handleNextCard} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white hover:text-amber-400 hover:border-amber-400/40 transition-all shadow-xl hover:scale-105 active:scale-95 group">
                                        <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                </div>

                                {/* Active Decal Brand Selector Toggler */}
                                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-white/10 shadow-inner mt-4">
                                    <span className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest px-2">Brand Decal:</span>
                                    <button 
                                        onClick={() => { playMetallicSound(); setBrandDecalStyle('corporate'); }}
                                        className={`px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all leading-none ${brandDecalStyle === 'corporate' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white'}`}
                                        title="Display realistic vibrant colored icons like other modern banks"
                                    >
                                        Vibrant Decals
                                    </button>
                                    <button 
                                        onClick={() => { playMetallicSound(); setBrandDecalStyle('metallic'); }}
                                        className={`px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all leading-none ${brandDecalStyle === 'metallic' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white'}`}
                                        title="Display traditional engraved laser metallic logos"
                                    >
                                        Engraved Metal
                                    </button>
                                </div>
                            </div>

                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full blur-[110px] pointer-events-none" style={{ backgroundColor: selectedMaterial.ambientGlow }}></div>
                        </div>

                        {/* Physical Alloy Card Customizer / metallurgical queue */}
                        <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-2xl relative overflow-hidden">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h4 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                                        <CreditCardIcon className="w-5 h-5 text-amber-400" />
                                        Request Priority Metallurgical Alloy Dispatch
                                    </h4>
                                    <p className="text-xs text-[#0F172A] dark:text-white mt-1 max-w-md leading-relaxed">
                                        Upgrade other standard nodes into physical solid titanium plate cards. Hand-engraved with silver highlights and expedited using armed air freight courier logs.
                                    </p>
                                </div>
                                <button
                                    onClick={handleDispatchMetalCard}
                                    disabled={dispatchQueue !== 'idle' && dispatchQueue !== 'delivered'}
                                    className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shrink-0 ${
                                        dispatchQueue === 'idle' || dispatchQueue === 'delivered' 
                                        ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 hover:-translate-y-0.5 active:scale-95' 
                                        : 'bg-white dark:bg-slate-900 text-[#0F172A] cursor-not-allowed'
                                    }`}
                                >
                                    {dispatchQueue === 'idle' && "Dispatch Alloy Card"}
                                    {dispatchQueue === 'delivered' && "Request Again"}
                                    {dispatchQueue !== 'idle' && dispatchQueue !== 'delivered' && "Processing CNC..."}
                                </button>
                            </div>

                            {/* Logistics Tracking Tracker */}
                            {dispatchQueue !== 'idle' && (
                                <div className="mt-8 border-t border-slate-100 dark:border-white/10 pt-6 space-y-4">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-[#0F172A] dark:text-white">Priority Dispatch Status Tracker:</span>
                                        <span className="font-mono text-amber-400 font-bold uppercase tracking-wider">{dispatchQueue.replace('_', ' ')}</span>
                                    </div>
                                    
                                    <div className="w-full h-2 bg-slate-50 dark:bg-slate-900 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-1000 ease-out"
                                            style={{ width: `${dispatchPercent}%` }}
                                        ></div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2 text-center">
                                        {[
                                            { title: 'CNC Milling', q: 'manufacturing', p: 5 },
                                            { title: 'Insignia Laser', q: 'engraving', p: 25 },
                                            { title: 'Luxury Boxing', q: 'velvet_box', p: 50 },
                                            { title: 'Air Freight', q: 'air_express', p: 85 }
                                        ].map((step, idx) => {
                                            const active = dispatchPercent >= step.p;
                                            return (
                                                <div key={idx} className="space-y-1">
                                                    <div className={`text-[8.5px] font-black uppercase tracking-widest ${active ? 'text-amber-400' : 'text-[#0F172A]'}`}>{step.title}</div>
                                                    <div className={`w-2 h-2 rounded-full mx-auto ${active ? 'bg-amber-400 shadow-md shadow-amber-400/50' : 'bg-slate-50 dark:bg-slate-900'}`}></div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {dispatchQueue === 'delivered' && (
                                        <div className="p-4 rounded-xl bg-emerald-500 border border-emerald-500/20 text-emerald-400 text-xs text-center font-bold">
                                            ✓ Sovereign Titanium alloy card has completed manufacturing and cleared VIP delivery. Transferred to personal estate.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Interactive Advanced Spending Geography & Category Controls */}
                        <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-2xl space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-[#0F172A] dark:text-white uppercase tracking-tight flex items-center gap-2">
                                    <ShieldCheckIcon className="w-5 h-5 text-sky-400" />
                                    High-Net-Worth Security Lockdowns
                                </h3>
                                <p className="text-xs text-[#0F172A] dark:text-white mt-1 uppercase tracking-wider">Configure precise structural node lockdowns</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Geographic locks */}
                                <div className="space-y-3 bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-white/10">
                                    <p className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest flex items-center gap-1">
                                        <GlobeAmericasIcon className="w-4 h-4 text-sky-400" /> Authorized Regional Fencing
                                    </p>
                                    <select 
                                        value={authorizedRegion}
                                        onChange={(e) => { playMetallicSound(); setAuthorizedRegion(e.target.value); }}
                                        className="w-full p-3 bg-slate-100 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-[#0F172A] dark:text-white uppercase tracking-wider font-bold"
                                    >
                                        <option value="Global Unrestricted">Global Unrestricted Access</option>
                                        <option value="North America exclusive">US & North America Exclusive</option>
                                        <option value="European Union restricted">Europe Schengen Visa Region only</option>
                                        <option value="Swiss Banks Private Zones">Switzerland Offshore Zones only</option>
                                        <option value="Lock Area Immediately">Sovereign Locking - Emergency lockdown</option>
                                    </select>
                                    <p className="text-[9px] text-[#0F172A] italic">Automatic GPS fence locking detects yacht-board geo-coordinates worldwide.</p>
                                </div>

                                {/* Haptic Limits controls */}
                                <div className="space-y-3 bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-white/10">
                                    <p className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest flex items-center gap-1">
                                        <WifiIcon className="w-4 h-4 text-amber-500" /> Contactless Touch Limits
                                    </p>
                                    <div className="flex gap-4 items-center">
                                        <input 
                                            type="range" 
                                            min={500} 
                                            max={12000} 
                                            step={500}
                                            value={contactlessLimit} 
                                            onChange={(e) => { playMetallicSound(); setContactlessLimit(parseInt(e.target.value, 10)); }}
                                            className="w-full accent-amber-400"
                                        />
                                        <span className="font-mono text-sm text-[#0F172A] dark:text-white font-bold whitespace-nowrap">{formatCurrency(contactlessLimit)}</span>
                                    </div>
                                    <p className="text-[9px] text-[#0F172A] dark:text-white">Transactions exceeding this on touch-pad require dual biometric credentials.</p>
                                </div>
                            </div>

                            {/* Category blocks */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Toggle Blocked Premium Asset Industries</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { key: 'crypto', label: 'Crypto Exchanges', desc: 'Settle Web3 tokens' },
                                        { key: 'casinos', label: 'Casino & Resorts', desc: 'Vegas play markers' },
                                        { key: 'auctions', label: 'Fine Art Auctions', desc: 'Sotheby’s / Christie’s' },
                                        { key: 'couture', label: 'Haute Couture', desc: 'Bespoke tailoring' }
                                    ].map((cat) => (
                                        <button
                                            key={cat.key}
                                            onClick={() => toggleCategoryRestrict(cat.key)}
                                            className={`p-4 text-left rounded-xl border transition-all ${
                                                categoryRestrictions[cat.key] 
                                                ? 'bg-rose-950 border-rose-500/40 text-rose-300' 
                                                : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-white/10 text-[#0F172A] dark:text-white hover:border-slate-200 dark:border-slate-300'
                                            }`}
                                        >
                                            <div className="text-[10px] font-black uppercase tracking-wider">{cat.label}</div>
                                            <div className="text-[8px] text-[#0F172A] mt-1">{cat.desc}</div>
                                            <div className="text-[9.5px] font-black tracking-widest uppercase mt-3 text-right text-current">
                                                {categoryRestrictions[cat.key] ? '🛑 LOCKED' : '✓ ALLOWED'}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Real-time Web Audio Synthesizers & Check-out Simulation Logic */}
                        {(() => {
                            // Synthesized audio alerts
                            const playPosSuccessSound = () => {
                                try {
                                    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                                    if (!AudioContextClass) return;
                                    const ctx = new AudioContextClass();
                                    
                                    const osc = ctx.createOscillator();
                                    const gainNode = ctx.createGain();
                                    
                                    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
                                    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
                                    osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.16); // D6
                                    
                                    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
                                    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
                                    
                                    osc.connect(gainNode);
                                    gainNode.connect(ctx.destination);
                                    osc.start();
                                    osc.stop(ctx.currentTime + 0.61);
                                } catch (_) {}
                            };

                            const playPosDeclineSound = () => {
                                try {
                                    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                                    if (!AudioContextClass) return;
                                    const ctx = new AudioContextClass();
                                    
                                    const osc = ctx.createOscillator();
                                    const gainNode = ctx.createGain();
                                    
                                    osc.type = "sawtooth";
                                    osc.frequency.setValueAtTime(180, ctx.currentTime);
                                    osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.3);
                                    
                                    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
                                    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
                                    
                                    osc.connect(gainNode);
                                    gainNode.connect(ctx.destination);
                                    osc.start();
                                    osc.stop(ctx.currentTime + 0.45);
                                } catch (_) {}
                            };

                            // Spawns 3D Floating coins
                            const [particles, setParticles] = useState<{ id: number; x: number; y: number; r: number; s: number }[]>([]);
                            const spawnParticles = () => {
                                const list = Array.from({ length: 18 }).map((_, i) => ({
                                    id: Date.now() + i,
                                    x: Math.random() * 120 - 60,
                                    y: Math.random() * -70 - 30,
                                    r: Math.random() * 360,
                                    s: Math.random() * 0.4 + 0.7
                                }));
                                setParticles(list);
                                setTimeout(() => setParticles([]), 2000);
                            };

                            // Main Handshake process
                            const executePosHandshake = async () => {
                                if (posStatus === 'authorizing') return;
                                
                                const amt = parseFloat(posAmount);
                                if (isNaN(amt) || amt <= 0) {
                                    playPosDeclineSound();
                                    setPosStatus('failed');
                                    setPosMessage('ERROR: READ INVALID');
                                    setPosErrorCode('Please enter a valid numeric transaction value.');
                                    return;
                                }

                                playMetallicSound();
                                setPosStatus('authorizing');
                                setPosMessage('SWIPE INITIATED...');
                                setPosErrorCode('');

                                setTimeout(() => {
                                    setPosMessage('MUTUAL HANDSHAKE...');
                                }, 500);

                                setTimeout(() => {
                                    setPosMessage('DECRYPTING CREDENTIALS...');
                                }, 1000);

                                setTimeout(async () => {
                                    // 1. Frozen test
                                    if (selectedCard.controls?.isFrozen) {
                                        playPosDeclineSound();
                                        setPosStatus('failed');
                                        setPosMessage('DECLINED: CODE 502');
                                        setPosErrorCode('The selected hardware credit card node is temporarily FROZEN.');
                                        return;
                                    }

                                    // 2. CVV mismatch
                                    if (posCvc.trim() !== selectedCard.cvc) {
                                        playPosDeclineSound();
                                        setPosStatus('failed');
                                        setPosMessage('REJECTED: BAD CVC');
                                        setPosErrorCode(`Checksum rejected of CVV. (Hint: Flip card over! Set CVC parameter to '${selectedCard.cvc}')`);
                                        return;
                                    }

                                    let cat: SpendingCategory = 'Other';
                                    let key = '';
                                    if (posMerchant.includes('Yacht')) { cat = 'Travel'; }
                                    else if (posMerchant.includes('Aman')) { cat = 'Travel'; }
                                    else if (posMerchant.includes('Formula 1')) { cat = 'Entertainment'; }
                                    else if (posMerchant.includes('Sotheby')) { cat = 'Shopping'; key = 'auctions'; }
                                    else if (posMerchant.includes('Savile Row')) { cat = 'Shopping'; key = 'couture'; }
                                    else if (posMerchant.includes('Caviar')) { cat = 'Food & Drink'; }

                                    // 3. Category Restriction Lockdowns
                                    if (key && categoryRestrictions[key]) {
                                        playPosDeclineSound();
                                        setPosStatus('failed');
                                        setPosMessage('BLOCKED SECURE GEOFENCE');
                                        setPosErrorCode(`Denied: ${cat} is deactivated inside private Lockdown Controls.`);
                                        return;
                                    }

                                    // 4. Exceeds contactless limit
                                    if (amt > contactlessLimit) {
                                        playPosDeclineSound();
                                        setPosStatus('failed');
                                        setPosMessage('DECLINED: CONTACTLESS EXCEEDED');
                                        setPosErrorCode(`Touchless limit breached. Set touch limit larger than ${formatCurrency(contactlessLimit)}.`);
                                        return;
                                    }

                                    // 5. Sufficient funds
                                    if (amt > accountBalance) {
                                        playPosDeclineSound();
                                        setPosStatus('failed');
                                        setPosMessage('DECLINED: INSIGNIFICANT PORTFOLIO');
                                        setPosErrorCode(`Insufficient checkings reserve. Available liquid portfolio: ${formatCurrency(accountBalance)}`);
                                        return;
                                    }

                                    // Approved!
                                    playPosSuccessSound();
                                    setPosStatus('success');
                                    setPosMessage('✓ SECURED CLEARANCE');
                                    setPosErrorCode(`Node Clearance Key: AP-${Math.floor(100000 + Math.random() * 900000)}`);
                                    spawnParticles();

                                    // Deduct from central balance
                                    try {
                                        await onAddFunds(-amt, selectedCard.lastFour, selectedCard.network as any);
                                    } catch (_) {}

                                    // Increment points
                                    const ptGain = Math.floor(amt * 0.025);
                                    setPointsBalance(prev => prev + ptGain);

                                    // Prepend card transactions list
                                    const record: CardTransaction = {
                                        id: `sim_tx_${Date.now()}`,
                                        description: posMerchant,
                                        amount: amt,
                                        date: new Date(),
                                        category: cat,
                                        status: 'Posted',
                                        rewardsEarned: { points: ptGain },
                                        merchantInfo: {
                                            name: posMerchant,
                                            location: posMerchant.includes('Yacht') || posMerchant.includes('Cannes') ? 'Cannes Marina, France'
                                                    : posMerchant.includes('Aman') ? 'Kyoto Private Suite, Japan'
                                                    : posMerchant.includes('Grand Prix') ? 'Monte Carlo, Monaco'
                                                    : posMerchant.includes('Sotheby') ? 'New York Grand Gallery, USA'
                                                    : posMerchant.includes('Savile') ? 'Mayfair, West London'
                                                    : 'Sovereign Clearing Port'
                                        }
                                    };

                                    setLocalCardTx(prev => [record, ...prev]);
                                    setPosCvc('');
                                    setPosPin('');

                                }, 1600);
                            };

                            return (
                                <div className="space-y-10 mt-10">
                                    
                                    {/* Point of Sale Simulator Block */}
                                    <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-8 rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-3xl relative overflow-hidden group">
                                        
                                        {/* CSS animation injection */}
                                        <style dangerouslySetInnerHTML={{__html: `
                                            @keyframes floatUp {
                                                0% { opacity: 0; transform: translateY(0px) rotate(0deg) scale(0.6); }
                                                15% { opacity: 1; }
                                                100% { opacity: 0; transform: translateY(-180px) rotate(360deg) scale(1.3); }
                                            }
                                        `}} />

                                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                                            <span className="text-9xl font-mono text-[#0F172A] dark:text-white font-black">POS</span>
                                        </div>

                                        <div className="flex flex-col xl:flex-row gap-8 items-start relative z-10">
                                            
                                            {/* POS Terminal hardware render panel */}
                                            <div className="w-full xl:w-[320px] bg-slate-100 p-6 rounded-[2.2rem] border border-slate-200 dark:border-slate-700 shadow-2xl relative flex flex-col justify-between shrink-0">
                                                <div className="space-y-4">
                                                    
                                                    {/* Console logo bar */}
                                                    <div className="flex justify-between items-center px-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                                                            <span className="text-[8px] font-black font-sans uppercase tracking-[0.25em] text-[#0F172A] dark:text-white">FPS SMART CONSOLE</span>
                                                        </div>
                                                        <span className="font-mono text-[7px] text-[#0F172A] font-bold uppercase tracking-widest leading-none">V26.5</span>
                                                    </div>

                                                    {/* Glowing LCD monitor console screen */}
                                                    <div className={`p-5 rounded-2xl relative overflow-hidden transition-all duration-300 min-h-[160px] flex flex-col justify-between ${
                                                        posStatus === 'idle' ? 'bg-indigo-950 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.08)]' :
                                                        posStatus === 'authorizing' ? 'bg-amber-950 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.08)] animate-pulse' :
                                                        posStatus === 'success' ? 'bg-emerald-950 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.12)]' :
                                                        'bg-rose-950 border border-rose-500/20 shadow-[0_0_20px_rgba(239,68,68,0.08)]'
                                                    }`}>
                                                        
                                                        {/* Liquid grid static overlay lines */}
                                                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%)] pointer-events-none bg-[size:100%_4px] opacity-40"></div>
                                                        
                                                        <div className="space-y-1 relative z-10">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[7.5px] font-black uppercase tracking-wider text-[#0F172A] font-mono">ENCLAVE HARBOR AUTH:</span>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${posStatus === 'authorizing' ? 'bg-amber-400 animate-ping' : posStatus === 'success' ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
                                                            </div>
                                                            <h5 className={`font-mono text-xs font-black tracking-wide uppercase mt-1 ${
                                                                posStatus === 'idle' ? 'text-indigo-400' :
                                                                posStatus === 'authorizing' ? 'text-amber-400' :
                                                                posStatus === 'success' ? 'text-emerald-400 font-bold' :
                                                                'text-rose-400 font-bold'
                                                            }`}>
                                                                {posMessage}
                                                            </h5>
                                                            <p className="text-[8.5px] font-mono text-[#0F172A] dark:text-white leading-normal mt-2 select-all font-semibold uppercase">
                                                                {posErrorCode || `Hardware Swiped: **** **** **** ${selectedCard.lastFour}`}
                                                            </p>
                                                        </div>

                                                        <div className="flex justify-between items-end relative z-10 mt-5 border-t border-slate-100 dark:border-white/10 pt-2.5">
                                                            <div>
                                                                <p className="text-[6.5px] font-black text-[#0F172A] uppercase tracking-widest leading-none">AMOUNT DUE</p>
                                                                <p className="font-mono text-sm font-black text-[#0F172A] dark:text-white leading-tight mt-1">{formatCurrency(parseFloat(posAmount) || 0)}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[6.5px] font-black text-[#0F172A] uppercase tracking-widest leading-none">CHIP TYPE</p>
                                                                <span className="font-mono text-[8.5px] font-black uppercase tracking-wider text-[#0F172A] dark:text-white">{selectedCard.network}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Chip slots hardware graphics */}
                                                    <div className="flex justify-between items-center text-[#0F172A] text-[8px] p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/10">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-4.5 h-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-300/50 relative overflow-hidden flex items-center justify-center">
                                                                <div className="w-2.5 h-1.5 bg-amber-500 rounded-[1px]"></div>
                                                            </div>
                                                            <span className="font-bold uppercase tracking-wider">CHIP EMV DETECTED</span>
                                                        </div>
                                                        <span className="text-emerald-400 font-bold uppercase tracking-wider text-[7.5px]">● ACTIVE</span>
                                                    </div>

                                                </div>

                                                {/* Coin physics particle drawer space */}
                                                <div className="relative h-1 w-full my-4 flex justify-center items-center select-none pointer-events-none">
                                                    {particles.map(p => (
                                                        <div 
                                                            key={p.id}
                                                            className="absolute text-lg select-none z-50 transition-all duration-1000 ease-out flex items-center justify-center"
                                                            style={{
                                                                left: `calc(50% + ${p.x}px)`,
                                                                bottom: '10px',
                                                                transform: `translateY(${p.y}px) rotate(${p.r}deg) scale(${p.s})`,
                                                                opacity: 0,
                                                                animation: 'floatUp 1.8s forwards'
                                                            }}
                                                        >
                                                            🪙
                                                        </div>
                                                    ))}
                                                </div>

                                                <button
                                                    onClick={executePosHandshake}
                                                    disabled={posStatus === 'authorizing'}
                                                    className={`w-full py-4.5 rounded-2xl text-[9.5px] font-black uppercase tracking-widest transition-all shadow-xl leading-none ${
                                                        posStatus === 'authorizing'
                                                        ? 'bg-slate-50 dark:bg-slate-900 border border-amber-500 text-amber-500 cursor-wait'
                                                        : 'bg-amber-400 text-slate-950 hover:bg-amber-300 hover:scale-[1.01] active:scale-95'
                                                    }`}
                                                >
                                                    {posStatus === 'authorizing' ? 'COMMUNICATING SIMULATOR...' : 'TAP CARD & PAY SIMULATOR'}
                                                </button>

                                            </div>

                                            {/* Interactive Simulator Controller Column */}
                                            <div className="flex-1 space-y-5 text-left w-full h-full flex flex-col justify-between">
                                                <div className="space-y-4">
                                                    <div>
                                                        <h4 className="text-base font-bold text-[#0F172A] dark:text-white uppercase tracking-tight flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                                            First Pacific Bancshares Point of Sale (POS) Simulator
                                                        </h4>
                                                        <p className="text-xs text-[#0F172A] dark:text-white mt-1 uppercase tracking-wider">Trigger real-time sandbox credit/debit clearances to modify checking balance instantly</p>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        
                                                        {/* Merchant */}
                                                        <div className="space-y-1.5">
                                                            <label className="text-[9px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest block">LUXURY MERCHANT</label>
                                                            <select 
                                                                value={posMerchant}
                                                                onChange={(e) => {
                                                                    playMetallicSound();
                                                                    setPosMerchant(e.target.value);
                                                                    const match = e.target.value;
                                                                    if (match === 'Cannes Luxury Superyacht') setPosAmount('25000');
                                                                    else if (match === 'Aman Tokyo Private Suite') setPosAmount('4500');
                                                                    else if (match === 'F1 Paddock Club Exclusive VIP') setPosAmount('8500');
                                                                    else if (match === 'Sotheby’s Fine Art Clearing') setPosAmount('38000');
                                                                    else if (match === 'Savile Row Royal Bespoke Tailors') setPosAmount('2800');
                                                                    else if (match === 'Caviar & Co Gourmet Indulgence') setPosAmount('850');
                                                                }}
                                                                className="w-full p-4 bg-slate-100 border border-slate-200 dark:border-white/10 rounded-2xl text-xs text-[#0F172A] dark:text-white uppercase tracking-wider font-bold"
                                                            >
                                                                <option value="Cannes Luxury Superyacht">Cannes Luxury Superyacht ($25,000)</option>
                                                                <option value="Aman Tokyo Private Suite">Aman Tokyo Private Suite ($4,500)</option>
                                                                <option value="F1 Paddock Club Exclusive VIP">F1 Paddock Club Exclusive VIP ($8,500)</option>
                                                                <option value="Sotheby’s Fine Art Clearing">Sotheby’s Fine Art Clearing ($38,000)</option>
                                                                <option value="Savile Row Royal Bespoke Tailors">Savile Row Royal Bespoke Tailors ($2,800)</option>
                                                                <option value="Caviar & Co Gourmet Indulgence">Caviar & Co Gourmet Indulgence ($850)</option>
                                                            </select>
                                                        </div>

                                                        {/* Amount */}
                                                        <div className="space-y-1.5">
                                                            <label className="text-[9px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest block">TRANSACTION DEBIT SUM ($)</label>
                                                            <input 
                                                                type="number"
                                                                value={posAmount}
                                                                onChange={(e) => setPosAmount(e.target.value)}
                                                                placeholder="Amount"
                                                                className="w-full p-4 bg-slate-100 border border-slate-200 dark:border-white/10 rounded-2xl text-xs text-[#0F172A] dark:text-white font-mono font-bold"
                                                            />
                                                        </div>

                                                        {/* Security CVV */}
                                                        <div className="space-y-1.5">
                                                            <label className="text-[9px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest block flex justify-between">
                                                                <span>CVV/CVC SECURITY CODE</span>
                                                                <span className="text-amber-400 font-bold lowercase tracking-normal">Flip card to read!</span>
                                                            </label>
                                                            <input 
                                                                type="password"
                                                                maxLength={3}
                                                                value={posCvc}
                                                                onChange={(e) => setPosCvc(e.target.value)}
                                                                placeholder="CVC"
                                                                className="w-full p-4 bg-slate-100 border border-slate-200 dark:border-white/10 rounded-2xl text-xs text-[#0F172A] dark:text-white uppercase tracking-widest font-mono text-center font-bold"
                                                            />
                                                        </div>

                                                        {/* Haptic Pin */}
                                                        <div className="space-y-1.5">
                                                            <label className="text-[9px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest block">DECRYPT CARD PIN</label>
                                                            <input 
                                                                type="password"
                                                                maxLength={4}
                                                                value={posPin}
                                                                onChange={(e) => setPosPin(e.target.value)}
                                                                placeholder="PIN"
                                                                className="w-full p-4 bg-slate-100 border border-slate-200 dark:border-white/10 rounded-2xl text-xs text-[#0F172A] dark:text-white uppercase tracking-widest font-mono text-center font-bold"
                                                            />
                                                        </div>

                                                    </div>
                                                </div>

                                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 grid grid-cols-2 gap-x-6 gap-y-2 text-[10px] text-[#0F172A] dark:text-white font-bold">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${!selectedCard.controls?.isFrozen ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
                                                        <span>Active Freeze Locker status check</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${(parseFloat(posAmount) || 0) <= contactlessLimit ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
                                                        <span>Haptic Limit check ({formatCurrency(contactlessLimit)})</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${posCvc.trim() === selectedCard.cvc ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
                                                        <span>Card CVC Decryption Key matching</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${(parseFloat(posAmount) || 0) <= accountBalance ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
                                                        <span>Liquid Balance confirmation</span>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>

                                    </div>

                                    {/* Central Enclave Ledger Feed */}
                                    <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-2xl space-y-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-[#0F172A] dark:text-white uppercase tracking-tight flex items-center gap-2">
                                                    <div className="p-1 px-1.5 bg-emerald-500 rounded text-emerald-400 font-mono text-[9px] uppercase tracking-widest border border-emerald-500/20 leading-none">REAL-TIME</div>
                                                    Sovereign Enclave Card Settlement Feed
                                                </h3>
                                                <p className="text-xs text-[#0F172A] dark:text-white mt-1 uppercase tracking-wider">Dynamic card payment ledger logs with integrated brand network identity</p>
                                            </div>
                                        </div>

                                        {/* Ledger list container */}
                                        <div className="space-y-3.5 max-h-[440px] overflow-y-auto pr-2 custom-scrollbar">
                                            {localCardTx.map((tx) => (
                                                <div 
                                                    key={tx.id}
                                                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 hover:border-slate-200 dark:border-white/10 transition-all flex justify-between items-center gap-4"
                                                >
                                                    <div className="flex items-center gap-3.5 text-left">
                                                        <div className="p-3.5 bg-slate-1000 rounded-xl border border-slate-200 dark:border-white/15 shadow-md flex items-center justify-center shrink-0 text-lg">
                                                            {tx.category === 'Travel' && '✈️'}
                                                            {tx.category === 'Food & Drink' && '🍾'}
                                                            {tx.category === 'Shopping' && '🛍️'}
                                                            {tx.category === 'Entertainment' && '🎟️'}
                                                            {tx.category === 'Other' && '🏛️'}
                                                        </div>

                                                        <div className="space-y-1">
                                                            <p className="text-xs font-black text-[#0F172A] dark:text-white">{tx.description}</p>
                                                            <div className="flex gap-2 items-center text-[9.5px] text-[#0F172A] dark:text-white font-semibold font-sans">
                                                                <span>{tx.merchantInfo.location}</span>
                                                                <span>•</span>
                                                                <span className="font-mono text-[8px] text-[#0F172A] dark:text-white">{tx.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-right space-y-1 shrink-0">
                                                        <span className="font-mono font-black text-xs text-rose-400 block">
                                                            -${(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </span>
                                                        <div className="flex gap-1.5 items-center justify-end">
                                                            {tx.rewardsEarned?.points && (
                                                                <span className="bg-amber-400 text-amber-500 text-[8.5px] px-2 py-0.5 rounded-full font-bold">
                                                                    +{tx.rewardsEarned.points} PTS
                                                                </span>
                                                            )}
                                                            <span className="bg-emerald-500 text-emerald-400 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full leading-none">
                                                                ✓ POSTED
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            );
                        })()}

                    </div>

                    {/* Side Live Intelligence Panel */}
                    <div className="lg:col-span-5 space-y-8 text-left">
                        
                        {/* Master Liquidity Node */}
                        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-5 transition-opacity duration-1000">
                                <SparklesIcon className="w-44 h-44 text-[#0F172A] dark:text-white" />
                             </div>
                             <div className="relative z-10 space-y-4">
                                <p className="text-[9.5px] font-black text-amber-500 uppercase tracking-[0.45em]">Sovereign Node Clearing Liquidity</p>
                                <h3 className="text-4xl lg:text-5xl font-black text-[#0F172A] dark:text-white font-mono tracking-tighter leading-none">
                                    {formatCurrency(accountBalance)}
                                </h3>
                                <div className="flex flex-wrap gap-3 items-center pt-2">
                                     <button onClick={onOpenAddFunds} className="px-5 py-3.5 bg-white text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 hover:text-slate-950 transition-all shadow-lg flex items-center gap-2 dark:bg-slate-800">
                                        <PlusIcon className="w-4 h-4 text-current" /> Inject Vault Liquidity
                                    </button>
                                     <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-500 rounded-xl border border-emerald-500/25">
                                        <TrendingUpIcon className="w-3.5 h-3.5 text-emerald-400" />
                                        <span className="text-[8.5px] font-black text-emerald-400 uppercase tracking-widest">+0.42% Daily APY Ledger</span>
                                    </div>
                                </div>
                             </div>
                        </div>

                        {/* Point Converters & Sovereign Rewards Centre */}
                        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-[3rem] p-8 shadow-2xl space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-black text-[#0F172A] dark:text-white tracking-tight uppercase">Rewards Vault</h3>
                                    <p className="text-[9px] text-[#0F172A] font-bold uppercase tracking-[0.3em] mt-0.5">Bespoke Points Portfolio</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black text-amber-400 font-mono tracking-tighter">{pointsBalance.toLocaleString()}</div>
                                    <div className="text-[8.5px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest">Available Points</div>
                                </div>
                            </div>

                            {/* Point actions selector */}
                            <div className="space-y-4 border-t border-slate-100 dark:border-white/10 pt-4">
                                <div className="bg-slate-50 dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-100 dark:border-white/10 space-y-3">
                                    <p className="text-[9px] font-black text-[#0F172A] dark:text-white uppercase tracking-wider">Redemption Action Amount Slider</p>
                                    <div className="flex gap-4 items-center">
                                        <input 
                                            type="range" 
                                            min={5000} 
                                            max={120000} 
                                            step={5000} 
                                            value={pointsToRedeem}
                                            onChange={(e) => { playMetallicSound(); setPointsToRedeem(parseInt(e.target.value, 10)); }}
                                            className="w-full accent-amber-400"
                                        />
                                        <span className="font-mono text-xs text-[#0F172A] dark:text-white font-bold shrink-0">{pointsToRedeem.toLocaleString()} pts</span>
                                    </div>
                                    <div className="text-[8.5px] text-[#0F172A] uppercase tracking-wider flex justify-between pr-2">
                                        <span>Redemption Value: {formatCurrency(pointsToRedeem / 100)}</span>
                                        <span>Aviation Multiplier: x1.0 - x1.25</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Statement Credit Action Card */}
                                    <button 
                                        onClick={handleConfirmStatementCredit}
                                        className="p-5 text-left bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 hover:border-emerald-500/25 rounded-2.5xl hover:bg-slate-50 dark:bg-slate-900 transition-all flex flex-col justify-between group active:scale-95"
                                    >
                                        <div className="p-2 w-fit bg-emerald-500 border border-emerald-500/15 text-emerald-400 rounded-xl group-hover:scale-105 transition-transform">
                                            <ZapIcon className="w-5 h-5 fill-current" />
                                        </div>
                                        <div className="mt-5">
                                            <h5 className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest leading-none mb-1">Redeem Credit</h5>
                                            <p className="text-xs font-bold text-[#0F172A] dark:text-white tracking-wide">Inject {formatCurrency(pointsToRedeem/100)} instantly</p>
                                        </div>
                                    </button>

                                    {/* Aviation Partner Action Card */}
                                    <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-2.5xl flex flex-col justify-between">
                                        <div className="space-y-2">
                                            <label className="text-[7.5px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest leading-none block">Aviation Partner</label>
                                            <select 
                                                value={selectedAviationPartner}
                                                onChange={(e) => setSelectedAviationPartner(e.target.value)}
                                                className="w-full p-2 bg-slate-100 border border-slate-200 dark:border-white/10 text-[9.5px] text-[#0F172A] dark:text-white uppercase tracking-wider font-extrabold rounded-lg"
                                            >
                                                <option value="Emirates Skywards">Emirates Skywards (1:1)</option>
                                                <option value="Swiss Air Miles">Swiss Miles & More (1:1.25)</option>
                                                <option value="Singapore KrisFlyer">Singapore KrisFlyer (1:1)</option>
                                                <option value="Qatar Privilege Club">Qatar Privilege (1:1.1)</option>
                                            </select>
                                        </div>
                                        <button 
                                            onClick={handleConfirmAviationTransfer}
                                            className="mt-4 px-4 py-2 text-center bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-300 transition-all shadow-md active:translate-y-0.5"
                                        >
                                            Transfer Miles
                                        </button>
                                    </div>
                                </div>

                                {redeemSuccessMsg && (
                                    <div className="p-4.5 bg-emerald-500 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold transition-all animate-fade-in">
                                        ✓ {redeemSuccessMsg}
                                    </div>
                                )}
                                {transferSuccessMsg && (
                                    <div className="p-4.5 bg-sky-500 border border-sky-500/20 text-sky-400 rounded-xl text-xs font-bold transition-all animate-fade-in">
                                        ✓ {transferSuccessMsg}
                                    </div>
                                )}
                            </div>

                            {/* Live Loyalty Alliances List */}
                            <div className="border-t border-slate-100 dark:border-white/10 pt-4 space-y-2">
                                <p className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest">Validated Aviation Accounts Ledger</p>
                                <div className="grid grid-cols-2 gap-2 text-left">
                                    {[
                                        { name: 'Emirates Skywards', code: 'EK-89410' },
                                        { name: 'Swiss Air Miles', code: 'SR-70014' },
                                        { name: 'Singapore KrisFlyer', code: 'SQ-55102' },
                                        { name: 'Qatar Privilege Club', code: 'QR-21400' }
                                    ].map((partner) => {
                                        const miles = claimedAlliances[partner.name] || 0;
                                        return (
                                            <div key={partner.name} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/10">
                                                <div className="text-[8.5px] font-extrabold text-[#0F172A] dark:text-white truncate">{partner.name}</div>
                                                <div className="text-[7.5px] text-[#0F172A] font-mono tracking-wider mt-0.5">{partner.code}</div>
                                                <div className="text-xs font-mono font-black text-amber-500 mt-2">{miles.toLocaleString()} Miles</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Interactive Spending Diagnostics Arc Charts */}
                        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-[3rem] p-8 shadow-2xl space-y-6">
                            <div>
                                <h3 className="text-xl font-black text-[#0F172A] dark:text-white tracking-tight uppercase flex items-center gap-2">
                                    <ActivityIcon className="w-5 h-5 text-purple-400" /> Spending Diagnostics
                                </h3>
                                <p className="text-[9px] text-[#0F172A] font-bold uppercase tracking-[0.3em] mt-1">Sovereign Wealth Layout</p>
                            </div>

                            <div className="space-y-4">
                                {spendCategoriesData.map((cat, idx) => (
                                    <div key={idx} className="space-y-1 text-left">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-[#0F172A] dark:text-white font-bold">{cat.name}</span>
                                            <span className="text-[#0F172A] dark:text-white font-mono font-bold">{formatCurrency(cat.amount)} ({cat.percentage}%)</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-slate-50 dark:bg-slate-900 rounded-full overflow-hidden">
                                            <div className={`${cat.color} h-full rounded-full`} style={{ width: `${cat.percentage}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 24/7 Digital Concierge VIP Private Terminal */}
                        <div className="bg-[#0b0c10] border border-slate-200 dark:border-white/10 rounded-[3rem] p-8 shadow-2xl space-y-6">
                            <div className="flex justify-between items-center">
                                <div className="text-left">
                                    <h3 className="text-xl font-black text-[#0F172A] dark:text-white tracking-tight uppercase flex items-center gap-2">
                                        <TrophyIcon className="w-5 h-5 text-amber-500 fill-current" /> Concierge Desk
                                    </h3>
                                    <p className="text-[9px] text-[#0F172A] font-bold uppercase tracking-[0.3em] mt-1">Sovereign Relationship Office</p>
                                </div>
                                <div className="bg-amber-400 border border-amber-400/20 py-1.5 px-3 rounded-full text-[8.5px] font-black text-amber-400 uppercase tracking-widest leading-none">
                                    ● VIP SECURE CHAT
                                </div>
                            </div>

                            {/* Chat Thread */}
                            <div className="h-[210px] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-2.5xl p-4.5 overflow-y-auto custom-scrollbar space-y-4 text-xs">
                                {conciergeChats.map((c, i) => (
                                    <div key={i} className={`flex flex-col ${c.sender === 'user' ? 'items-end' : 'items-start'} space-y-1 animate-fade-in`}>
                                        <div className={`p-4 rounded-2xl max-w-[85%] leading-relaxed ${
                                            c.sender === 'user' 
                                            ? 'bg-amber-400 text-slate-950 rounded-br-none font-bold' 
                                            : 'bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-[#1E293B] rounded-bl-none border border-slate-100 dark:border-white/10'
                                        }`}>
                                            {c.text}
                                        </div>
                                        <span className="text-[7.5px] text-[#0F172A] uppercase tracking-widest font-mono pl-1.5 pr-1.5">{c.time}</span>
                                    </div>
                                ))}
                                {isConciergeTyping && (
                                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 p-3 rounded-xl max-w-fit leading-none">
                                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                        <span className="text-[8px] font-bold text-[#0F172A] uppercase tracking-widest ml-2">Concierge executing request...</span>
                                    </div>
                                )}
                            </div>

                            {/* Input Form */}
                            <form onSubmit={handleSendConciergeMsg} className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={conciergeMsg}
                                    onChange={(e) => setConciergeMsg(e.target.value)}
                                    placeholder="e.g., Book private yacht charter in Cannes next week..."
                                    className="flex-grow p-4.5 bg-slate-100 border border-slate-200 dark:border-white/10 rounded-2xl text-xs text-[#0F172A] dark:text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/40"
                                />
                                <button 
                                    type="submit" 
                                    className="px-6 py-4.5 bg-white hover:bg-amber-400 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all dark:bg-slate-800"
                                >
                                    Instruct
                                </button>
                            </form>
                        </div>

                        {/* Visual Virtual Gateway Hub */}
                        <div className="bg-[#0c121e] border border-slate-200 dark:border-white/10 rounded-[3rem] p-8 shadow-2xl h-fit">
                            <div className="flex justify-between items-center mb-8">
                                <div className="text-left">
                                    <h3 className="text-xl font-black text-[#0F172A] dark:text-white tracking-tight uppercase flex items-center gap-2">
                                        <GlobeAmericasIcon className="w-5 h-5 text-sky-400 animate-spin-slow" /> Virtual Hub
                                    </h3>
                                    <p className="text-[9px] text-[#0F172A] font-bold uppercase tracking-[0.3em] mt-1">Ephemeral Payment Gateways</p>
                                </div>
                                <button 
                                    onClick={() => setIsCreateVirtualOpen(true)}
                                    className="p-3 bg-white hover:bg-primary hover:border-primary text-primary hover:text-[#0F172A] dark:text-white border border-slate-200 dark:border-white/10 rounded-xl transition-all shadow-lg hover:-translate-y-1 active:scale-90 dark:bg-slate-800"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                {virtualCards.map(vc => (
                                    <div 
                                        key={vc.id} 
                                        onClick={() => setViewingVirtualCard(vc)} 
                                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-slate-50 dark:bg-slate-900 transition-all duration-300 group shadow-sm hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(59,130,246,0.22)]"
                                    >
                                        <div className="flex items-center gap-4 text-left">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-100 dark:border-white/10 shadow-xl group-hover:scale-105 transition-transform">
                                                <GlobeAmericasIcon className="w-6 h-6 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#0F172A] dark:text-white text-sm tracking-tight uppercase">{vc.nickname}</p>
                                                <p className="text-[9px] text-[#0F172A] font-mono tracking-widest mt-0.5">VISA •••• {vc.lastFour}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-[#0F172A] dark:text-white font-mono tracking-tighter">{formatCurrency(vc.spentThisMonth)}</p>
                                            <p className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest mt-0.5">USED</p>
                                        </div>
                                    </div>
                                ))}

                                {virtualCards.length === 0 && (
                                    <div className="py-12 text-center bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                        <GlobeAmericasIcon className="w-10 h-10 text-[#0F172A] mx-auto mb-4 animate-pulse" />
                                        <p className="text-[#0F172A] font-black text-[9px] uppercase tracking-[0.3em]">No virtual nodes active</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            <style>{`
                .perspective-2000 { perspective: 2000px; }
                .mask-image-gradient {
                    mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
                    -webkit-mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 2px; }
                
                @keyframes spin-slow {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 20s linear infinite;
                }
            `}</style>
        </div>
    );
};
