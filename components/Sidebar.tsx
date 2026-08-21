
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
    HomeIcon, 
    WalletIcon, 
    CreditCardIcon, 
    ActivityIcon, 
    UserGroupIcon, 
    TrendingUpIcon, 
    ChartBarIcon, 
    ShoppingBagIcon, 
    ShieldCheckIcon, 
    SendIcon,
    GlobeAmericasIcon,
    LifebuoyIcon,
    QuestionMarkCircleIcon,
    ClipboardDocumentIcon,
    DepositIcon,
    WithdrawIcon,
    EnvelopeIcon,
    BellIcon,
    QrCodeIcon,
    CertificateIcon,
    TrophyIcon,
    SparklesIcon,
    FilmIcon
} from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
    onOpenSendMoneyFlow: (initialTab?: 'send' | 'split' | 'deposit') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSendMoneyFlow }) => {
    const { t } = useLanguage();

    const navItems = [
        { to: '/dashboard', icon: HomeIcon, label: 'header_title_dashboard' },
        { to: '/accounts', icon: WalletIcon, label: 'header_title_accounts' },
        { to: '/media-library', icon: FilmIcon, label: 'Video Media Library' },
        { to: '/gemini-intelligence', icon: SparklesIcon, label: 'Gemini AI Intelligence' },
        { to: '/quick-qr-pay', icon: QrCodeIcon, label: 'Quick QR Pay' },
        { to: '/casino', icon: TrophyIcon, label: 'Wealth Stakes & Casino' },
        { to: '/joint-accounts', icon: UserGroupIcon, label: 'Joint Accounts' },
        { to: '/compliance-center', icon: ShieldCheckIcon, label: 'Compliance Center' },
        { to: '/deposits', icon: DepositIcon, label: 'Deposits' },
        { to: '/withdrawals', icon: WithdrawIcon, label: 'Withdrawals' },
        { to: '/verification', icon: ShieldCheckIcon, label: 'Verification' },
        { to: '/cards', icon: CreditCardIcon, label: 'header_title_cards' },
        { to: '/history', icon: ActivityIcon, label: 'header_title_history' },
        { to: '/statements', icon: ClipboardDocumentIcon, label: 'Official Statements' },
        { to: '/recipients', icon: UserGroupIcon, label: 'header_title_recipients' },
        { to: '/email-alerts', icon: EnvelopeIcon, label: 'Email Alerts' },
        { to: '/messages', icon: EnvelopeIcon, label: 'Secure Messages' },
        { to: '/certificates', icon: CertificateIcon, label: 'Certificates Center' },
        { to: '/invest', icon: TrendingUpIcon, label: 'header_title_invest' },
        { to: '/crypto', icon: ChartBarIcon, label: 'header_title_crypto' },
        { to: '/tasks', icon: ClipboardDocumentIcon, label: 'header_title_tasks' },
        { to: '/services', icon: ShoppingBagIcon, label: 'header_title_services' },
        { to: '/security', icon: ShieldCheckIcon, label: 'header_title_security' },
        { to: '/support', icon: QuestionMarkCircleIcon, label: 'header_title_support' },
    ];

    return (
        <aside className="w-64 h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-white/10 flex flex-col pt-24 pb-8 overflow-y-auto custom-scrollbar z-30">
            <div className="px-6 mb-8">
                <button 
                    onClick={() => onOpenSendMoneyFlow('send')}
                    className="w-full py-4 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 group"
                >
                    <SendIcon className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                    <span>Quick Transfer</span>
                </button>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                            isActive 
                            ? 'bg-slate-100 dark:bg-slate-900 text-[#0F172A] dark:text-white shadow-lg border border-slate-200 dark:border-white/10' 
                            : 'text-[#0F172A] hover:bg-slate-50 dark:hover:bg-white hover:text-[#0F172A] dark:hover:text-[#0F172A] border border-transparent'
                        }`}
                    >
                        <item.icon className={`w-5 h-5 transition-colors ${
                            item.to === '/dashboard' ? 'group-[.active]:text-primary-600 dark:group-[.active]:text-primary-400' : 
                            item.to === '/security' ? 'group-[.active]:text-emerald-500 dark:group-[.active]:text-emerald-400' : 
                            'group-[.active]:text-primary'
                        }`} />
                        <span className="text-xs font-bold uppercase tracking-wider">{t(item.label) || item.label}</span>
                        
                        {/* Active Indicator */}
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-[.active]:opacity-100 transition-opacity shadow-[0_0_8px_rgba(14,197,242,0.8)]"></div>
                    </NavLink>
                ))}
            </nav>

            <div className="px-6 mt-8 pt-6 border-t border-slate-200 dark:border-white/10">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-white/10 shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 dark:opacity-20"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-emerald-500 rounded-lg border border-emerald-500/20">
                                <GlobeAmericasIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                            </div>
                            <span className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest">Network Status</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,233,129,0.6)]"></div>
                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">All Nodes Operational</p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};
