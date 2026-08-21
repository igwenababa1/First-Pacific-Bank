
import React, { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
    HomeIcon, SendIcon, UserGroupIcon, ActivityIcon, CogIcon, CreditCardIcon, 
    LifebuoyIcon, CashIcon, QuestionMarkCircleIcon, WalletIcon, ChartBarIcon, 
    ShoppingBagIcon, MapPinIcon, XIcon, PremiumReservedBankLogo, CubeTransparentIcon,
    ClipboardDocumentIcon, AirplaneTicketIcon, WrenchScrewdriverIcon, PuzzlePieceIcon, SparklesIcon,
    TrendingUpIcon, PlusCircleIcon, MapIcon, LightningBoltIcon, QrCodeIcon, ShieldCheckIcon,
    GlobeAmericasIcon, BuildingOfficeIcon, LogoutIcon, BellIcon, PackageIcon, HeartIcon, LockClosedIcon, FirstPacificLogo
} from './Icons';
import { View, UserProfile } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onOpenSendMoneyFlow: (initialTab?: 'send' | 'split' | 'deposit') => void;
  onOpenWireTransfer: (data?: any) => void;
  onOpenLogoutConfirm: () => void;
}

type MenuCategory = 'Banking' | 'Payments' | 'Wealth' | 'Lifestyle' | 'Support';

const CATEGORY_INFO: Record<MenuCategory, { image: string, title: string, description: string }> = {
    Banking: {
        image: 'https://images.unsplash.com/photo-1565514020176-dbf2277e9e6e?q=80&w=2940&auto=format&fit=crop',
        title: "Master Your Everyday Finances.",
        description: "Access premium checking, high-yield savings, and exclusive metal cards designed for the global citizen."
    },
    Payments: {
        image: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=2940&auto=format&fit=crop',
        title: "Global Reach, Instant Speed.",
        description: "Send money to over 190 countries with real-time tracking and institutional-grade settlement."
    },
    Wealth: {
        image: 'https://images.unsplash.com/photo-1611974765270-ca1258634369?q=80&w=2864&auto=format&fit=crop',
        title: "Grow Your Portfolio Intelligently.",
        description: "Unlock access to global markets, digital assets, and AI-driven wealth management strategies."
    },
    Lifestyle: {
        image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2948&auto=format&fit=crop',
        title: "Experience a World Without Borders.",
        description: "Exclusive travel perks, bespoke concierge services, and seamless logistics for your high-value assets."
    },
    Support: {
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2940&auto=format&fit=crop',
        title: "We Are Here For You, 24/7.",
        description: "Bank-grade security protocols and priority support channels ensure your peace of mind around the clock."
    },
};

const menuConfig: {
    id: MenuCategory;
    titleKey: string;
    items: {
        view: View;
        labelKey: string;
        description: string;
        icon: React.ComponentType<{ className?: string }> | any;
    }[];
}[] = [
    {
        id: 'Banking',
        titleKey: 'nav_banking',
        items: [
            { view: 'dashboard', labelKey: 'header_title_dashboard', description: "Portfolio overview.", icon: HomeIcon },
            { view: 'accounts', labelKey: 'header_title_accounts', description: "Checking & Savings.", icon: WalletIcon },
            { view: 'cards', labelKey: 'header_title_cards', description: "Card management.", icon: CreditCardIcon },
            { view: 'wallet', labelKey: 'header_title_wallet', description: "Contactless hub.", icon: QrCodeIcon },
            { view: 'qrScanner', labelKey: 'NFC Scanner', description: "Physical terminal sync.", icon: MapPinIcon },
            { view: 'multisig', labelKey: 'Multi-Sig Vault', description: "Multi-signature auth.", icon: ShieldCheckIcon },
            { view: 'inbox', labelKey: 'Secure Inbox', description: "Financial notices & receipts.", icon: BellIcon },
            { view: 'atmLocator', labelKey: 'header_title_atmLocator', description: "Find global nodes.", icon: MapIcon },
        ]
    },
    {
        id: 'Payments',
        titleKey: 'nav_payments',
        items: [
            { view: 'send', labelKey: 'header_title_send', description: "Domestic & P2P.", icon: SendIcon },
            { view: 'wire', labelKey: 'quick_actions_send_money', description: "Global SWIFT/IBAN.", icon: GlobeAmericasIcon },
            { view: 'network', labelKey: 'Global Network', description: "Institutional banking.", icon: BuildingOfficeIcon },
            { view: 'recipients', labelKey: 'header_title_recipients', description: "Node directory.", icon: UserGroupIcon },
            { view: 'history', labelKey: 'header_title_history', description: "Audit ledger.", icon: ActivityIcon },
            { view: 'quickteller', labelKey: 'Quickteller', description: "Airtime & Utilities.", icon: LightningBoltIcon },
            { view: 'integrations', labelKey: 'header_title_integrations', description: "External linkages.", icon: PuzzlePieceIcon },
        ]
    },
    {
        id: 'Wealth',
        titleKey: 'nav_wealth',
        items: [
            { view: 'invest', labelKey: 'header_title_invest', description: "Markets & Stocks.", icon: TrendingUpIcon },
            { view: 'crypto', labelKey: 'header_title_crypto', description: "Digital asset vault.", icon: ChartBarIcon },
            { view: 'advisor', labelKey: 'header_title_advisor', description: "AI Strategic advisor.", icon: SparklesIcon },
            { view: 'tasks', labelKey: 'Fin Tasks', description: "Financial tracking.", icon: ClipboardDocumentIcon },
            { view: 'loans', labelKey: 'header_title_loans', description: "Liquidity lines.", icon: CashIcon },
            { view: 'insurance', labelKey: 'header_title_insurance', description: "Asset protection.", icon: LifebuoyIcon },
        ]
    },
    {
        id: 'Lifestyle',
        titleKey: 'nav_lifestyle',
        items: [
            { view: 'digital-store', labelKey: 'Digital Store', description: "Premium assets.", icon: ShoppingBagIcon },
            { view: 'logistics', labelKey: 'Asset Logistics', description: "Industrial tracking.", icon: PackageIcon },
            { view: 'flights', labelKey: 'header_title_flights', description: "Elite aviation.", icon: AirplaneTicketIcon },
            { view: 'checkin', labelKey: 'header_title_checkin', description: "Travel protocols.", icon: MapPinIcon },
            { view: 'utilities', labelKey: 'header_title_utilities', description: "Infrastructure pay.", icon: WrenchScrewdriverIcon },
            { view: 'services', labelKey: 'header_title_services', description: "Subscription hub.", icon: ShoppingBagIcon },
            { view: 'globalAid', labelKey: 'header_title_globalAid', description: "Philanthropy.", icon: HeartIcon },
        ]
    },
    {
        id: 'Support',
        titleKey: 'nav_support',
        items: [
            { view: 'security', labelKey: 'header_title_security', description: "Encryption & 2FA.", icon: ShieldCheckIcon },
            { view: 'alerts', labelKey: 'header_title_alerts', description: "Event notifications.", icon: BellIcon },
            { view: 'mobile-app', labelKey: 'header_title_mobile_app', description: "iOS & Android portable hub.", icon: CubeTransparentIcon },
            { view: 'support', labelKey: 'header_title_support', description: "Priority concierge.", icon: QuestionMarkCircleIcon },
            { view: 'privacy', labelKey: 'header_title_privacy', description: "Data governance.", icon: LockClosedIcon },
            { view: 'platform', labelKey: 'header_title_platform', description: "User preferences.", icon: CogIcon },
        ]
    },
];

export const MegaMenu: React.FC<MegaMenuProps> = ({ isOpen, onClose, userProfile, onOpenSendMoneyFlow, onOpenWireTransfer, onOpenLogoutConfirm }) => {
    const navigate = useNavigate();
    const [hoveredCategory, setHoveredCategory] = useState<MenuCategory>('Banking');
    const { t } = useLanguage();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, onClose]);

    const handleModalItemClick = (view: View) => {
        if (view === 'send') onOpenSendMoneyFlow('send');
        onClose();
    };

    const renderMenuItem = (item: any) => {
        const Icon = item.icon;
        const isModalTrigger = item.view === 'send';

        const content = ({ isActive }: { isActive?: boolean } = {}) => (
            <>
                <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-300 ${
                    isActive ? 'bg-primary text-[#0F172A] dark:text-white shadow-md shadow-primary/20' : 'bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white group-hover:text-primary group-hover:bg-primary/10'
                }`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div>
                    <p className={`font-bold text-xs transition-colors ${isActive ? 'text-[#0F172A] dark:text-white' : 'text-[#0F172A] dark:text-white group-hover:text-[#0F172A] dark:text-white'}`}>{t(item.labelKey)}</p>
                    <p className="text-[9px] text-[#0F172A] group-hover:text-[#0F172A] dark:text-white uppercase tracking-wider font-semibold mt-0.5">{item.description}</p>
                </div>
            </>
        );

        if (isModalTrigger) {
            return (
                <button
                    onClick={() => handleModalItemClick(item.view)}
                    className="w-full group flex items-center gap-2.5 p-1.5 rounded-xl text-left transition-all duration-300 border border-transparent hover:bg-white hover:border-slate-100 dark:border-white/10 hover:translate-x-0.5 dark:bg-slate-800"
                >
                    {content()}
                </button>
            );
        }

        const targetRoute = item.view === 'wire' ? 'wire-transfer' : item.view;

        return (
            <NavLink
                to={`/${targetRoute}`}
                onClick={onClose}
                className={({ isActive }: { isActive: boolean }) =>
                    `w-full group flex items-center gap-2.5 p-1.5 rounded-xl text-left transition-all duration-300 border border-transparent ${
                        isActive 
                        ? 'bg-primary/10 border-primary/20 shadow-[0_0_15px_rgba(14,197,242,0.08)]' 
                        : 'hover:bg-white hover:border-slate-100 dark:border-white/10 hover:translate-x-0.5'
                    }`
                }
            >
                {({ isActive }: { isActive: boolean }) => content({ isActive })}
            </NavLink>
        );
    };

    return (
        <>
            {/* Backdrop Blur */}
            <div
                className={`fixed inset-0 bg-slate-50 dark:bg-slate-800  z-[90] transition-opacity duration-700 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Menu Container */}
            <div
                ref={menuRef}
                className={`fixed inset-y-0 left-0 w-full max-w-[95%] md:max-w-[1400px] bg-slate-50 dark:bg-slate-900 z-[95] transform transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) shadow-[25px_0_60px_-15px_rgba(0,0,0,0.5)] flex overflow-hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex-grow flex flex-col h-full w-full md:w-3/4 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-900 border-r border-slate-100 dark:border-white/10">
                    
                    {/* Sticky Header */}
                    <div className="flex-shrink-0 flex justify-between items-center p-8 border-b border-slate-100 dark:border-white/10 sticky top-0 bg-slate-50 dark:bg-slate-900 z-20 ">
                        <div className="flex flex-row items-center gap-3">
                            <FirstPacificLogo className="w-6 h-6 text-primary" />
                            <span className="font-sans font-light text-[#0F172A] dark:text-white tracking-[0.1em] text-sm uppercase mt-0.5">
                                First Pacific
                            </span>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-4 rounded-2xl bg-white text-[#0F172A] dark:text-white hover:bg-red-500 hover:text-red-400 transition-all duration-300 transform active:scale-95 dark:bg-slate-800"
                            aria-label="Close Navigation"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Multi-column Grid */}
                    <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
                        {menuConfig.map((category, catIndex) => (
                            <div 
                                key={category.id} 
                                className="space-y-3.5 group/category animate-fade-in-up"
                                style={{ animationDelay: `${catIndex * 100}ms` }}
                                onMouseEnter={() => setHoveredCategory(category.id)}
                            >
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/10">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(14,197,242,0.6)]"></div>
                                    <h3 className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-[0.25em]">
                                        {t(category.titleKey)}
                                    </h3>
                                </div>
                                <ul className="space-y-1">
                                    {category.items.map((item) => {
                                        // Hide Admin Console if user is not an admin
                                        if (item.view === 'admin' && userProfile.role !== 'admin') {
                                            return null;
                                        }
                                        return (
                                            <li key={item.view} className="nav-item-hover">
                                                {renderMenuItem(item)}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Footer User Area */}
                    <div className="mt-auto p-10 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800 sticky bottom-0 ">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className="relative group">
                                    <img src={userProfile.profilePictureUrl} alt="Profile" className="w-16 h-16 rounded-3xl border-2 border-slate-200 dark:border-slate-300 object-cover shadow-2xl transition-transform group-hover:scale-105" />
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-slate-900 rounded-full shadow-lg"></div>
                                </div>
                                <div>
                                    <p className="text-lg font-black text-[#0F172A] dark:text-white tracking-tight leading-none mb-1">{userProfile.name}</p>
                                    <p className="text-xs text-[#0F172A] font-mono tracking-widest uppercase">{userProfile.email}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { onClose(); onOpenLogoutConfirm(); }}
                                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-red-500 text-red-500 hover:bg-red-500 hover:text-[#0F172A] dark:text-white transition-all text-xs font-black uppercase tracking-[0.2em] border border-red-500/20 shadow-xl"
                            >
                                <LogoutIcon className="w-4 h-4" />
                                <span>Terminate Session</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Side Visual Panel */}
                <div className="hidden lg:block w-1/4 relative overflow-hidden bg-slate-100">
                    {/* Background Images */}
                    {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                        <div 
                            key={key}
                            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${hoveredCategory === key ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
                        >
                            <div 
                                className="w-full h-full bg-cover bg-center" 
                                style={{ backgroundImage: `url("${info.image}")` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
                            <div className="absolute inset-0 primary- mix-blend-overlay"></div>
                        </div>
                    ))}

                    {/* Content Layer */}
                    <div className="absolute inset-0 flex flex-col justify-end p-12 z-10">
                        <div className="mb-auto">
                            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white  border border-slate-300 dark:border-black/10 text-[#0F172A] dark:text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl dark:bg-slate-800">
                                <SparklesIcon className="w-4 h-4 text-yellow-400" />
                                <span>Node Intelligence</span>
                            </div>
                        </div>

                        <div className="space-y-6 animate-fade-in">
                            <h1 key={hoveredCategory + 'title'} className="text-4xl font-black text-[#0F172A] dark:text-white leading-none tracking-tighter drop-shadow-2xl animate-fade-in-up">
                                {CATEGORY_INFO[hoveredCategory].title}
                            </h1>
                            <p key={hoveredCategory + 'desc'} className="text-[#0F172A] dark:text-white text-sm leading-relaxed max-w-xs drop-shadow-lg font-bold animate-fade-in-up delay-100">
                                {CATEGORY_INFO[hoveredCategory].description}
                            </p>
                            
                            <div className="flex items-center gap-4 pt-4 group cursor-pointer animate-fade-in-up delay-200">
                                <span className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-[0.3em]">Explore Module</span>
                                <div className="h-0.5 w-12 bg-primary transition-all duration-500 group-hover:w-24 group-hover:shadow-[0_0_10px_rgba(14,197,242,0.8)]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.4s ease-out forwards;
                }
            `}</style>
        </>
    );
};
