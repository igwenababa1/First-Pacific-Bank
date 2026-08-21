
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
    HomeIcon, 
    WalletIcon, 
    CreditCardIcon, 
    MenuIcon,
    ArrowsRightLeftIcon,
    SendIcon
} from './Icons';

interface MobileBottomNavProps {
    onOpenSendMoneyFlow: () => void;
    onToggleMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenSendMoneyFlow, onToggleMenu }) => {
    const location = useLocation();

    const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
        const isActive = location.pathname === to || (to === '/dashboard' && location.pathname === '/');
        return (
            <NavLink 
                to={to} 
                className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:hover:text-[#1E293B]'}`}
            >
                {isActive && (
                    <motion.div 
                        layoutId="activeTabMobile" 
                        className="absolute top-0 w-10 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-b-full shadow-[0_2px_10px_rgba(79,70,229,0.5)]" 
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                )}
                <Icon className={`w-6 h-6 transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-md' : 'scale-100'}`} />
                <span className={`text-[9px] uppercase tracking-widest ${isActive ? 'font-black' : 'font-semibold'}`}>{label}</span>
            </NavLink>
        );
    };

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 h-[84px] bg-white dark:bg-slate-800  border-t border-slate-200/80 dark:border-white/10 z-[60] px-2 pb-safe-area shadow-[0_-5px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.3)] flex flex-col">
            <div className="grid grid-cols-5 h-full items-center">
                <NavItem to="/dashboard" icon={HomeIcon} label="Home" />
                <NavItem to="/accounts" icon={WalletIcon} label="Accounts" />
                
                {/* Center Premium Action Button */}
                <div className="relative -top-7 flex justify-center w-full group">
                    <button 
                        onClick={onOpenSendMoneyFlow}
                        className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 primary- to-indigo-800 text-white flex items-center justify-center border-[6px] border-white dark:border-slate-950 transition-transform active:scale-95 shadow-[0_10px_25px_rgba(79,70,229,0.4)] group-hover:shadow-[0_15px_35px_rgba(79,70,229,0.5)] focus:outline-none"
                    >
                        <ArrowsRightLeftIcon className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500 ease-in-out" />
                    </button>
                    {/* Ring glow behind FAB */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-indigo-500 dark:bg-indigo-500 blur-xl pointer-events-none"></div>
                </div>

                <NavItem to="/cards" icon={CreditCardIcon} label="Cards" />
                
                <button 
                    onClick={onToggleMenu}
                    className="relative flex flex-col items-center justify-center w-full h-full space-y-1 text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:hover:text-[#1E293B] transition-colors focus:outline-none"
                >
                    <MenuIcon className="w-6 h-6 transition-transform duration-300 active:scale-110" />
                    <span className="text-[9px] font-semibold uppercase tracking-widest">Menu</span>
                </button>
            </div>
        </div>
    );
};
