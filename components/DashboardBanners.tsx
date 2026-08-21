import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeftIcon, ChevronRightIcon, SparklesIcon, ShieldCheckIcon, GlobeAmericasIcon, ExclamationTriangleIcon, BriefcaseIcon } from './Icons';
import { X as XMarkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BRANDING_CONFIG } from './constants';
import { VerificationLevel, Task } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { useBranding } from '../contexts/BrandingContext';

import platinumBg from '../src/assets/images/platinum_bg_1780997163126.png';
import emeraldBg from '../src/assets/images/emerald_bg_1780997179809.png';
import indigoBg from '../src/assets/images/indigo_bg_1780997194146.png';
import roseBg from '../src/assets/images/rose_bg_1780997208452.png';
import violetBg from '../src/assets/images/violet_bg_1780997221540.png';

interface DashboardBannersProps {
    verificationLevel?: VerificationLevel | string | number;
    tasks?: Task[];
    userName?: string;
    totalNetWorth?: number;
    customBanner?: string;
}

export const DEFAULT_BANNERS = [
    {
        id: 'promo-1',
        title: 'Swiss Reserve Vaults',
        subTitle: 'Premium Dossier',
        badge: 'Sovereign Holding',
        description: 'Bespoke high-security multi-currency private safety compartments nested in secure offshore Zurich banking bays.',
        cta: 'Browse Reserves',
        link: '/summary',
        tooltipText: 'Subject to KYC and Sovereign Approval.',
        icon: SparklesIcon,
        hexColor: '#D4AF37',
        bgImage: 'https://images.unsplash.com/photo-1563013544-824ae1d704d3?q=80&w=1200&auto=format&fit=crop'
    },
    {
        id: 'promo-2',
        title: 'Solid Gold Custody',
        subTitle: 'Institutional Liquidity Dossier',
        badge: 'Escrow Trust',
        description: 'Direct physical gold allocation. Sourced from London Bullion Market Association (LBMA) accredited refineries fully insured.',
        cta: 'Open Vault',
        link: '/settings',
        tooltipText: 'Minimum deposit 10oz. Fully insured custodian.',
        icon: ShieldCheckIcon,
        hexColor: '#fbbf24',
        bgImage: 'https://images.unsplash.com/photo-1610375461246-83df859d8222?q=80&w=1200&auto=format&fit=crop'
    },
    {
        id: 'promo-3',
        title: 'Wealth Management',
        subTitle: 'Global Advisory Dossier',
        badge: 'Private Banking',
        description: 'Connect with a personal wealth advisor to structure your portfolio, manage estate planning, and optimize tax strategies.',
        cta: 'Schedule Call',
        link: '/advisor',
        tooltipText: 'Available for accounts >$250k. 30min intro session included.',
        icon: GlobeAmericasIcon,
        hexColor: '#6366f1',
        bgImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop'
    },
    {
        id: 'promo-4',
        title: 'Carbon Black Card',
        subTitle: 'Titanium Bespoke Syndicate',
        badge: 'Black Tier Card',
        description: 'Engineered from heavy-grade carbon titanium. Provides complete custom limits, absolute purchase confidentiality, and full-status VIP 24/7 personal concierge.',
        cta: 'Apply Black',
        link: '/cards',
        tooltipText: 'Exclusive sovereign invite-only tier. Bespoke terms apply.',
        icon: SparklesIcon,
        hexColor: '#a855f7',
        bgImage: 'https://images.unsplash.com/photo-1563013544-824ae1d704d3?q=80&w=1200&auto=format&fit=crop'
    },
    {
        id: 'promo-5',
        title: 'Sovereign Escrow & Trust',
        subTitle: 'Swiss-Grade Asset Protection',
        badge: 'Family Trust Vaults',
        description: 'Fully protected cross-border multi-currency escrow repositories. Guaranteed absolute privacy protection and Swiss-grade security for your domestic or international corporate trusts.',
        cta: 'Verify Assets',
        link: '/settings',
        tooltipText: 'Establish legal protection and international capital transfer trusts.',
        icon: ShieldCheckIcon,
        hexColor: '#14b8a6',
        bgImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1200&auto=format&fit=crop'
    },
    {
        id: 'promo-6',
        title: 'Digital Asset Trust',
        subTitle: 'High-Sec Crypto Custody',
        badge: 'Cold-Storage Ledgers',
        description: 'Deploy institutional grade multi-signature cryptocurrency storage. Fully insured digital assets custody with zero slippage corporate liquidity loops.',
        cta: 'Fund Crypto',
        link: '/summary',
        tooltipText: 'Insured assets secured with physical HSM security modules.',
        icon: GlobeAmericasIcon,
        hexColor: '#ec4899',
        bgImage: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200&auto=format&fit=crop'
    },
    {
        id: 'promo-7',
        title: 'Global Concierge',
        subTitle: 'Lifestyle Architecture',
        badge: 'Elite Gateway',
        description: 'Unrestricted access to sold-out events, private galleries, and exclusive global residencies expertly curated by our lifestyle desk.',
        cta: 'Enter Concierge',
        link: '/messages',
        tooltipText: '24/7 Priority access to dedicated lifestyle architects.',
        icon: SparklesIcon,
        hexColor: '#f43f5e',
        bgImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop'
    },
    {
        id: 'promo-8',
        title: 'Offshore Holding Vehicles',
        subTitle: 'Corporate Sovereignty',
        badge: 'Tax Optimization',
        description: 'Establish offshore intellectual property holding companies and dynamic structural entities optimized for seamless cross-border dividend flow.',
        cta: 'Structure Entity',
        link: '/settings',
        tooltipText: 'Strictly compliant corporate strategy implementations.',
        icon: BriefcaseIcon,
        hexColor: '#fbbf24',
        bgImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop'
    },
    {
        id: 'promo-9',
        title: 'Private Equity Syndicates',
        subTitle: 'Institutional Ventures',
        badge: 'Accredited Access',
        description: 'Co-invest alongside leading sovereign wealth funds and institutional firms in late-stage pre-IPO unicorns and specialized buyout markets.',
        cta: 'View Offerings',
        link: '/summary',
        tooltipText: '$500k minimum commitment per syndicate line.',
        icon: GlobeAmericasIcon,
        hexColor: '#60a5fa',
        bgImage: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1200&auto=format&fit=crop'
    },
    {
        id: 'promo-10',
        title: 'Luxury Real Estate',
        subTitle: 'Trophy Asset Portfolio',
        badge: 'Alternative Equity',
        description: 'Diversify into fractionalized Tier-1 commercial real estate and ultra-luxury residential properties across Monaco, Dubai, and New York.',
        cta: 'Browse Portfolio',
        link: '/summary',
        tooltipText: 'Liquid secondary markets available for fractional shares.',
        icon: BriefcaseIcon,
        hexColor: '#8b5cf6',
        bgImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop'
    },
    {
        id: 'promo-11',
        title: 'Geopolitical Strategy',
        subTitle: 'Macro Intelligence Desk',
        badge: 'Market Briefings',
        description: 'Access classified macro-economic briefings from our dedicated geopolitical strategy desk to preempt global market volatility and policy shifts.',
        cta: 'Read Briefing',
        link: '/messages',
        tooltipText: 'Updated dynamically based on global intelligence signals.',
        icon: ExclamationTriangleIcon,
        hexColor: '#dc2626',
        bgImage: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&auto=format&fit=crop'
    },
    {
        id: 'promo-12',
        title: 'Multi-Generational Legacy',
        subTitle: 'Dynastic Wealth Planning',
        badge: 'Endowment Structuring',
        description: 'Protect your legacy with bulletproof multi-generational wealth vehicles, specialized philanthropic foundations, and dynastic succession plans.',
        cta: 'Plan Legacy',
        link: '/advisor',
        tooltipText: 'Tailored legal and fiduciary infrastructure.',
        icon: ShieldCheckIcon,
        hexColor: '#fcd34d',
        bgImage: 'https://images.unsplash.com/photo-1460518451285-97b6aa326961?q=80&w=1200&auto=format&fit=crop'
    },
    {
        id: 'promo-13',
        title: 'Precious Metals Reserve',
        subTitle: 'Physical Bullion Vault',
        badge: 'Allocated Gold',
        description: 'Acquire and securely store physical LBMA-certified gold, silver, and platinum. 100% physically allocated to your sovereign name in Zurich vaults.',
        cta: 'Enter Vault',
        link: '/summary',
        tooltipText: 'Real-time audits and physical redemption available.',
        icon: SparklesIcon,
        hexColor: '#fb923c',
        bgImage: 'https://images.unsplash.com/photo-1610484826967-09c5720778c7?q=80&w=1200&auto=format&fit=crop'
    },
    {
        id: 'promo-14',
        title: 'High-Frequency Quants',
        subTitle: 'Algorithmic Arbitrage',
        badge: 'Quantitative Access',
        description: 'Leverage our proprietary quantitative models. Execute high-frequency statistical arbitrage and dark pool liquidity routing seamlessly.',
        cta: 'Deploy Capital',
        link: '/summary',
        tooltipText: 'Low latency HFT infrastructure nodes available.',
        icon: GlobeAmericasIcon,
        hexColor: '#34d399',
        bgImage: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-network-connection-background-3134-large.mp4'
    },
    {
        id: 'promo-15',
        title: 'Eco-Sovereign Bonds',
        subTitle: 'Green Energy Infrastructure',
        badge: 'Impact Investing',
        description: 'Invest directly into government-backed sovereign green bonds and strategic clean energy infrastructure projects with steady geopolitical yields.',
        cta: 'View Yields',
        link: '/summary',
        tooltipText: 'Tax-exempt municipal and sovereign obligations.',
        icon: BriefcaseIcon,
        hexColor: '#10b981',
        bgImage: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?q=80&w=1200&auto=format&fit=crop'
    },
    {
        id: 'promo-16',
        title: 'Dubai & UAE Corporate Gateway',
        subTitle: 'International Business Hub',
        badge: 'Zero-Tax Entity',
        description: 'Accelerate your global enterprise formation across the UAE and GCC. Instant corporate multi-currency accounts and seamless international tax residency solutions.',
        cta: 'Open UAE Entity',
        link: '/settings',
        tooltipText: 'Full concierge company registration and sovereign banking desk.',
        icon: GlobeAmericasIcon,
        hexColor: '#fbbf24',
        bgImage: 'https://smartzone.ae/wp-content/uploads/2026/02/Can-Foreigners-Start-a-Business-in-Dubai.jpg'
    },
    {
        id: 'promo-17',
        title: 'Global ATM & POS Protection',
        subTitle: 'Instant Zero-Fee Access',
        badge: 'Biometric Terminals',
        description: 'Enjoy 85,000+ surcharge-free ATM cash points worldwide, multi-factor encrypted cardless withdrawals, and zero overseas withdrawal markups.',
        cta: 'Find ATM Node',
        link: '/atm-locator',
        tooltipText: 'Contactless NFC & GPS location integration.',
        icon: ShieldCheckIcon,
        hexColor: '#10b981',
        bgImage: 'https://www.housingfinance.co.ug/wp-content/uploads/2022/11/hfb-Safety-precautions-at-the-ATM-1024x768.jpg'
    },
    {
        id: 'promo-18',
        title: 'Institutional Interbank Clearing',
        subTitle: 'High-Throughput Digital Rails',
        badge: 'Temenos & FedNow',
        description: 'Real-time ISO-20022 wire routing, automated FedNow and Fedwire dispatch, and cross-border currency conversion at interbank wholesale rates.',
        cta: 'Explore Rails',
        link: '/summary',
        tooltipText: '24/7/365 uninterrupted liquidity settlement.',
        icon: BriefcaseIcon,
        hexColor: '#3b82f6',
        bgImage: 'https://www.temenos.com/wp-content/uploads/2025/04/Temenos-digital-banking-scaled.jpg'
    },
    {
        id: 'promo-19',
        title: 'Commercial & Retail Syndicate',
        subTitle: 'Corporate Liquidity Facilities',
        badge: 'Commercial Lines',
        description: 'Scale your operations with institutional working capital lines, structured equipment financing, and commercial debt underwriting.',
        cta: 'View Facilities',
        link: '/loans',
        tooltipText: 'Bespoke corporate underwriting with prime interest index.',
        icon: SparklesIcon,
        hexColor: '#a855f7',
        bgImage: 'https://www.theforage.com/blog/wp-content/uploads/2023/05/what-explains-the-difference-between-retail-and-commercial-banking-1-1024x768.jpg'
    },
    {
        id: 'promo-20',
        title: 'Aviation Syndicate',
        subTitle: 'Fractional Jet Ownership',
        badge: 'Air Sovereignty',
        description: 'Enter our private aviation syndicate. Secure fractional equity in our fleet of ultra-long-range Gulfstreams with guaranteed zero-notice availability.',
        cta: 'View Fleet',
        link: '/cards',
        tooltipText: 'Global positioning and empty leg optimization.',
        icon: GlobeAmericasIcon,
        hexColor: '#9ca3af',
        bgImage: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=1200&auto=format&fit=crop'
    },
    {
        id: 'promo-21',
        title: 'Cyber-Vault Defense',
        subTitle: 'Digital Identity Shield',
        badge: 'Quantum Security',
        description: 'Fortify your corporate and personal digital identity with our military-grade quantum-resistant encryption and active dark web monitoring.',
        cta: 'Enable Shield',
        link: '/settings',
        tooltipText: 'Proactive penetration testing and asset cloaking.',
        icon: ShieldCheckIcon,
        hexColor: '#38bdf8',
        bgImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop'
    },
    {
        id: 'promo-18',
        title: 'Venture Capital Network',
        subTitle: 'Seed-Stage Innovation',
        badge: 'Silicon Gateway',
        description: 'Gain direct LP access to top-tier Silicon Valley venture capital funds. Participate in seed and Series A rounds of paradigm-shifting startups.',
        cta: 'Explore Foundries',
        link: '/summary',
        tooltipText: 'Direct GP/LP co-investment opportunities.',
        icon: BriefcaseIcon,
        hexColor: '#a78bfa',
        bgImage: 'https://images.unsplash.com/photo-1559136555-9ce7b5a51368?q=80&w=1200&auto=format&fit=crop'
    },
    {
        id: 'promo-19',
        title: 'Philanthropic Design',
        subTitle: 'Global Impact Engines',
        badge: 'Charismatic Giving',
        description: 'Engineer high-impact philanthropic strategies using donor-advised funds and tax-optimized charitable lead annuity trusts.',
        cta: 'Design Impact',
        link: '/advisor',
        tooltipText: 'Maximize societal impact while minimizing tax liabilities.',
        icon: SparklesIcon,
        hexColor: '#f472b6',
        bgImage: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=1200&auto=format&fit=crop'
    },
    {
        id: 'promo-20',
        title: 'Diplomatic Gateway',
        subTitle: 'Second Citizenship',
        badge: 'Global Mobility',
        description: 'Navigate complex Citizenship-by-Investment programs to secure powerful second passports and optimize your international tax residency.',
        cta: 'Begin Process',
        link: '/settings',
        tooltipText: 'Full legal concierge for EU and Caribbean programs.',
        icon: GlobeAmericasIcon,
        hexColor: '#fb7185',
        bgImage: 'https://images.unsplash.com/photo-1524850011238-e3d235c7d4c9?q=80&w=1200&auto=format&fit=crop'
    }
];

export const DashboardBanners: React.FC<DashboardBannersProps> = ({ verificationLevel, tasks, userName, totalNetWorth, customBanner }) => {
    const { logoUrl, bannerUrl, primaryColor, customIssuer, galleryBanners = [] } = useBranding();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [carouselIndex, setCarouselIndex] = useState<number | null>(null);
    const { formatCurrency } = useCurrency();
    
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };
    const greeting = getGreeting();
    
    // A/B test variant
    const [kycBannerVariant] = useState<'A' | 'B'>(() => {
        try {
            const stored = localStorage.getItem('kycBannerVariant');
            if (stored === 'A' || stored === 'B') return stored;
        } catch {}
        const newVariant = Math.random() > 0.5 ? 'A' : 'B'; // A: Golden Geometry, B: Minimal Light
        localStorage.setItem('kycBannerVariant', newVariant);
        return newVariant as 'A' | 'B';
    });

    const [dismissedBanners, setDismissedBanners] = useState<string[]>(() => {
        try {
            const stored = localStorage.getItem('dismissedBanners');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const activeBanners = useMemo(() => {
        const banners = [];

        // Add welcome or KYC banner first
        if (verificationLevel === VerificationLevel.UNVERIFIED || verificationLevel === 'Unverified') {
            const isVariantA = kycBannerVariant === 'A';
            
            banners.push({
                id: 'kyc-action',
                title: 'Verify Identity',
                subTitle: 'Compliance Verification Dossier',
                badge: 'Action Required',
                description: 'Please complete your identity verification to unlock full account features, increase limits, and enable global transfers.',
                cta: 'Verify Now',
                link: '/security',
                tooltipText: 'Requires Photo ID & liveness check. ~2 min process.',
                icon: ExclamationTriangleIcon,
                hexColor: isVariantA ? '#D4AF37' : '#8b5cf6', // Violet
                bgImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1200&auto=format&fit=crop' // Elite private banker explaining identity security steps
            });
        }

        const pendingTasks = tasks?.filter(t => !t.completed);
        if (pendingTasks && pendingTasks.length > 0) {
             banners.push({
                id: 'pending-tasks',
                title: 'Pending Tasks',
                subTitle: 'Action Required Dossier',
                badge: 'Account Management',
                description: `You have ${pendingTasks.length} pending tasks. Review your financial tasks to keep your portfolio and pending applications on track this week.`,
                cta: 'View Tasks',
                link: '/tasks',
                tooltipText: 'Includes card dispatch tracking and transfer reviews.',
                icon: BriefcaseIcon,
                hexColor: '#f43f5e', // Rose
                bgImage: 'https://images.unsplash.com/photo-1606857521015-7f9fcf423740?q=80&w=1200&auto=format&fit=crop' // Secure ledger oversight team managing institutional tasks
            });
        }

        const filtered = [...banners, ...galleryBanners, ...DEFAULT_BANNERS].filter(b => !dismissedBanners.includes(b.id));
        return filtered;
    }, [verificationLevel, tasks, dismissedBanners, kycBannerVariant, galleryBanners]);

    useEffect(() => {
        if (isPaused || activeBanners.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
        }, 8000); // 8 seconds per banner
        return () => clearInterval(timer);
    }, [isPaused, activeBanners.length]);

    const handleNext = () => {
        if (activeBanners.length === 0) return;
        setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
        setIsPaused(true);
    };

    const handlePrev = () => {
        if (activeBanners.length === 0) return;
        setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
        setIsPaused(true);
    };

    const handleDismiss = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const updated = [...dismissedBanners, id];
        setDismissedBanners(updated);
        localStorage.setItem('dismissedBanners', JSON.stringify(updated));
        setCurrentIndex(0); // reset index
    };

    const currentBanner = activeBanners[currentIndex];

    if (!currentBanner || activeBanners.length === 0) return null;

    return (
        <>
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full mb-6 rounded-3xl overflow-hidden text-white relative transition-colors duration-1000 group/banner bg-slate-50 border-0 dark:bg-slate-900"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Elegant Header with greeting & balance */}
            <div className="px-6 sm:px-8 py-6 flex justify-between items-end relative z-20 bg-slate-50 dark:bg-slate-900 ">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{greeting}, {userName || 'Client'}</h1>
                    <p className="text-[9px] text-[#0F172A] font-bold uppercase tracking-[0.2em] mt-1" style={{ color: currentBanner.hexColor }}>Sovereign Wealth Profile</p>
                </div>
                {totalNetWorth !== undefined && (
                    <div className="text-right">
                        <p className="text-[9px] text-[#0F172A] font-bold uppercase tracking-[0.2em] mb-1">Liquid Reserves</p>
                        <p className="text-lg sm:text-xl font-mono font-black" style={{ color: currentBanner.hexColor }}>{formatCurrency(totalNetWorth)}</p>
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="flex flex-col w-full"
                >
                    {/* Header Image - Premium Corporate HUD & Branding Mask */}
                    <div 
                        className="w-full relative bg-slate-100 overflow-hidden h-[240px] md:h-[260px] group/banner-img select-none cursor-zoom-in"
                        onClick={() => {
                            setCarouselIndex(currentIndex);
                        }}
                    >
                        {customBanner ? (
                            <div className="w-full h-full scale-100 group-hover/banner-img:scale-110 transition-transform duration-[6000ms] opacity-60 pointer-events-none" dangerouslySetInnerHTML={{ __html: customBanner }}></div>
                        ) : (
                            <React.Fragment>
                                {(currentBanner.bgImage || bannerUrl).includes('mp4') ? (
                                    <video
                                        src={currentBanner.bgImage || bannerUrl}
                                        className="w-full h-full object-cover object-center scale-100 group-hover/banner-img:scale-110 transition-transform duration-[6000ms] opacity-70 shrink-0"
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                    />
                                ) : (
                                    <img 
                                        src={currentBanner.bgImage || bannerUrl} 
                                        alt={currentBanner.title} 
                                        className="w-full h-full object-cover object-center scale-100 group-hover/banner-img:scale-110 transition-transform duration-[6000ms] opacity-70 shrink-0"
                                        referrerPolicy="no-referrer"
                                    />
                                )}
                            </React.Fragment>
                        )}
                        
                        {/* Dynamic Layered Brand Mask with Glassmorphic Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent z-10 p-6 md:p-8 flex flex-col justify-between">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 w-full">
                                {/* Brand Crest Group */}
                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900  px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg w-fit">
                                     <div className="w-10 h-10 rounded-full bg-[#050810] border-2 flex items-center justify-center shadow-[0_0_12px_rgba(212,175,55,0.4)] overflow-hidden" style={{ borderColor: primaryColor }}>
                                         <img src={logoUrl || BRANDING_CONFIG.logoUrl} alt="Logo" className="w-full h-full object-contain scale-[0.8]" referrerPolicy="no-referrer" />
                                     </div>
                                     <div>
                                         <p className="text-[11px] font-black tracking-[0.14em] text-white uppercase leading-tight">{BRANDING_CONFIG.shortName}</p>
                                         <p className="text-[7.5px] font-extrabold tracking-[0.22em] uppercase mt-0.5" style={{ color: primaryColor }}>{customIssuer || 'Private Wealth Enclave'}</p>
                                     </div>
                                </div>
                                
                                {/* Compliance Badge */}
                                <div className="bg-emerald-950  text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-[8px] font-black tracking-widest uppercase flex items-center gap-1.5 w-fit shadow-md">
                                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                     🏛️ US ACCOUNT SECURITY STANDARDS
                                </div>
                            </div>
                            
                            {/* Bottom Audit Rails */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-200 dark:border-white/10 pt-3 text-[#0F172A] text-[8.5px] font-bold uppercase tracking-[0.15em]">
                                <div className="flex items-center gap-2">
                                     <span>SOVEREIGN DISPATCH PORTID: FPB-OP-8829</span>
                                     <span className="hidden md:inline text-[#0F172A]">|</span>
                                     <span className="hidden md:inline">NODE_SYNC: SECURE_STABLE</span>
                                </div>
                                <div className="bg-[#0b1122]/80 border border-slate-200 dark:border-white/10 px-2.5 py-0.5 rounded text-[7.5px] font-black text-amber-100/90 shadow-inner w-fit">
                                     MEMBER OCC &bull; FDIC INSURED EQUIV
                                </div>
                            </div>
                        </div>

                        {/* Subtle fade only at the very bottom to connect with the body */}
                        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-900 to-transparent z-10 pointer-events-none"></div>
                    </div>

                    {/* Body - Clean Frameless Style */}
                    <div className="w-full px-6 sm:px-8 pb-8 pt-4 flex flex-col justify-center relative bg-slate-50 dark:bg-slate-900">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="space-y-4 max-w-xl w-full">
                                {/* Title Container (matching email template) */}
                                <div className="border rounded-xl p-5 text-left md:items-start flex flex-col" style={{ 
                                    borderColor: `${currentBanner.hexColor}33`, 
                                    backgroundColor: `${currentBanner.hexColor}08` 
                                }}>
                                    <div className="inline-block px-3 py-1 rounded-full border mb-3" style={{
                                        backgroundColor: `${currentBanner.hexColor}1a`,
                                        borderColor: currentBanner.hexColor
                                    }}>
                                        <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: currentBanner.hexColor }}>
                                            {currentBanner.badge}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="hidden sm:flex shrink-0 w-10 h-10 rounded-full items-center justify-center bg-[#0b1122] border shadow-inner" style={{ borderColor: `${currentBanner.hexColor}40` }}>
                                            {React.createElement(currentBanner.icon || SparklesIcon, { className: 'w-5 h-5', style: { color: currentBanner.hexColor } })}
                                        </div>
                                        <div>
                                            <h2 className="text-xl sm:text-[22px] font-black text-white tracking-[0.1em] uppercase leading-tight" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                                                {currentBanner.title}
                                            </h2>
                                            <p className="text-[8.5px] font-bold tracking-[0.25em] uppercase mt-1" style={{ color: currentBanner.hexColor }}>
                                                {currentBanner.subTitle}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-[13.5px] leading-relaxed text-[#0F172A] font-bold">
                                    {currentBanner.description}
                                </p>
                            </div>

                            {/* CTA Action styling from luxury cert */}
                            <div className="flex flex-col items-center md:items-end justify-center w-full md:w-auto shrink-0 md:min-w-[160px]">
                                <div className="relative group/btn z-10 w-full md:w-auto">
                                    <Link 
                                        to={currentBanner.link} 
                                        className="block w-full md:w-auto text-center px-6 py-4 rounded-xl font-black text-xs uppercase tracking-[0.15em] text-[#0b1122] shadow-[0_0_20px_rgba(0,0,0,0.4)] hover:shadow-2xl transition-all active:scale-95 duration-200 group-hover/btn:-translate-y-0.5 border"
                                        style={{ backgroundColor: currentBanner.hexColor, borderColor: '#ffffff20' }}
                                    >
                                        {currentBanner.cta}
                                    </Link>

                                    {(currentBanner as any).tooltipText && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 opacity-0 group-hover/btn:opacity-100 translate-y-2 group-hover/btn:translate-y-0 transition-all duration-200 pointer-events-none z-50">
                                            <div className="bg-slate-50 dark:bg-slate-900  text-white text-[10px] font-bold p-3 rounded-xl text-center shadow-2xl border border-slate-200 dark:border-white/10 relative">
                                                <span className="relative z-10">{(currentBanner as any).tooltipText}</span>
                                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-50 border-r border-b border-slate-200 dark:border-white/10 rotate-45 dark:bg-slate-900"></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Dismiss Button positioned at top right relative to banner container */}
            {(currentBanner.id === 'kyc-action' || currentBanner.id === 'pending-tasks') && (
                <button 
                    onClick={(e) => handleDismiss((currentBanner as any).id, e)}
                    className="absolute top-4 right-4 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-100  border outline-none cursor-pointer transition-all hover:scale-110 active:scale-95"
                    style={{ borderColor: `${currentBanner.hexColor}40`, color: currentBanner.hexColor }}
                    title="Remind me later"
                >
                    <XMarkIcon className="w-4 h-4" />
                </button>
            )}

            {/* Navigation Controls & Dots Overlayed on the Image Side (Left) */}
            <div className="absolute bottom-6 left-6 flex items-center gap-4 z-20">
                <div className="flex gap-1">
                    <button 
                        onClick={handlePrev}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-100  border transition-colors outline-none cursor-pointer"
                        style={{ borderColor: `${currentBanner.hexColor}40`, color: currentBanner.hexColor }}
                    >
                        <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={handleNext}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-100  border transition-colors outline-none cursor-pointer"
                        style={{ borderColor: `${currentBanner.hexColor}40`, color: currentBanner.hexColor }}
                    >
                        <ChevronRightIcon className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="flex gap-1.5 opacity-80 pl-2 border-l border-slate-200 dark:border-white/10 items-center">
                    {activeBanners.map((_, idx) => (
                        <div 
                            key={idx} 
                            className="h-1.5 rounded-full transition-all duration-300"
                            style={{
                                width: idx === currentIndex ? '24px' : '6px',
                                backgroundColor: idx === currentIndex ? currentBanner.hexColor : 'rgba(255,255,255,0.2)'
                            }}
                        />
                    ))}
                </div>

                {dismissedBanners.length > 0 && (
                    <button
                        onClick={() => {
                            setDismissedBanners([]);
                            localStorage.removeItem('dismissedBanners');
                            setCurrentIndex(0);
                        }}
                        className="text-[9px] text-[#0F172A] hover:text-white uppercase font-black tracking-wider transition-colors bg-slate-100 hover:bg-slate-100 border border-slate-200 dark:border-white/10 rounded px-2 py-1 ml-2 shadow cursor-pointer"
                    >
                        Reset Banners 🔄
                    </button>
                )}
            </div>
        </motion.div>

        {/* Ultra Zoom Fullscreen Interactive Carousel Modal */}
        <AnimatePresence>
            {carouselIndex !== null && (
                <FullscreenBannerCarousel 
                    initialIndex={carouselIndex}
                    activeBanners={activeBanners}
                    bannerUrl={bannerUrl}
                    customBanner={customBanner}
                    onClose={() => setCarouselIndex(null)}
                />
            )}
        </AnimatePresence>
        </>
    );
};

const FullscreenBannerCarousel: React.FC<{
    initialIndex: number;
    activeBanners: any[];
    bannerUrl?: string;
    customBanner?: string;
    onClose: () => void;
}> = ({ initialIndex, activeBanners, bannerUrl, customBanner, onClose }) => {
    const [index, setIndex] = useState(initialIndex);
    const [scale, setScale] = useState(1);
    const [touchDist, setTouchDist] = useState(0);

    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset: number, velocity: number) => {
        return Math.abs(offset) * velocity;
    };

    const paginate = (newDirection: number) => {
        setIndex(prev => (prev + newDirection + activeBanners.length) % activeBanners.length);
        setScale(1);
    };

    const currentItem = activeBanners[index];

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            setTouchDist(dist);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            if (touchDist > 0) {
                setScale(s => Math.max(1, Math.min(4, s * (dist / touchDist))));
            }
            setTouchDist(dist);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-100  overflow-hidden touch-none"
            onClick={onClose}
        >
            <button 
                className="absolute top-8 right-8 text-white/50 hover:text-white bg-white hover:bg-white p-3 rounded-full transition-all z-[100000] cursor-pointer outline-none dark:bg-slate-800"
                onClick={(e) => { e.stopPropagation(); onClose(); }}
            >
                <XMarkIcon className="w-8 h-8" />
            </button>
            <button 
                className="absolute left-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-white hover:bg-white p-4 rounded-full transition-all z-[100000] cursor-pointer outline-none md:block hidden dark:bg-slate-800"
                onClick={(e) => { e.stopPropagation(); paginate(-1); }}
            >
                <ChevronLeftIcon className="w-8 h-8" />
            </button>
            <button 
                className="absolute right-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-white hover:bg-white p-4 rounded-full transition-all z-[100000] cursor-pointer outline-none md:block hidden dark:bg-slate-800"
                onClick={(e) => { e.stopPropagation(); paginate(1); }}
            >
                <ChevronRightIcon className="w-8 h-8" />
            </button>
            
            <AnimatePresence initial={false} custom={index}>
                <motion.div 
                    key={index}
                    custom={index}
                    initial={{ opacity: 0, x: 300, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: scale }}
                    exit={{ opacity: 0, x: -300, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    drag={scale === 1 ? "x" : true}
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={scale === 1 ? 1 : 0.2}
                    onDragEnd={(e, { offset, velocity }) => {
                        if (scale > 1) return; // Only swipe to next if not zoomed
                        const swipe = swipePower(offset.x, velocity.x);
                        if (swipe < -swipeConfidenceThreshold) {
                            paginate(1);
                        } else if (swipe > swipeConfidenceThreshold) {
                            paginate(-1);
                        }
                    }}
                    className="absolute w-full h-full max-w-[100vw] max-h-[100vh] md:max-w-[95vw] md:max-h-[95vh] md:rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] cursor-grab active:cursor-grabbing flex items-center justify-center pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                    onWheel={(e) => {
                        if (e.deltaY < 0) setScale(s => Math.min(s + 0.1, 4));
                        else setScale(s => Math.max(s - 0.1, 1));
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                >
                    {customBanner ? (
                        <div 
                            className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[90vh] pointer-events-none select-none" 
                            dangerouslySetInnerHTML={{ __html: customBanner }}
                        ></div>
                    ) : (
                        <React.Fragment>
                            {(currentItem.bgImage || bannerUrl).includes('mp4') ? (
                                <video
                                    src={currentItem.bgImage || bannerUrl}
                                    className="w-full h-full object-contain pointer-events-none select-none"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    draggable={false}
                                />
                            ) : (
                                <img 
                                    src={currentItem.bgImage || bannerUrl} 
                                    alt={currentItem.title} 
                                    className="w-full h-full object-contain pointer-events-none select-none"
                                    referrerPolicy="no-referrer"
                                    draggable={false}
                                />
                            )}
                        </React.Fragment>
                    )}
                    
                    {/* Caption / Title overlay when not heavily zoomed */}
                    <AnimatePresence>
                        {scale < 1.2 && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="absolute bottom-8 left-8 right-8 text-center pointer-events-none"
                            >
                                <span className="inline-block px-3 py-1 bg-white  rounded-full text-xs font-black tracking-widest text-white/70 uppercase mb-4 border border-slate-200 dark:border-black/10 dark:bg-slate-800">
                                    {currentItem.badge}
                                </span>
                                <h2 className="text-3xl md:text-5xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] mb-2 tracking-tight">{currentItem.title}</h2>
                                <p className="text-lg md:text-xl text-white/90 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] max-w-2xl mx-auto">{currentItem.description}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
};
