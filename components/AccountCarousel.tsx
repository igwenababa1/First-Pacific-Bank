
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Account, AccountType } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, VerifiedBadgeIcon, SpinnerIcon, ClockIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'motion/react';

interface AccountCarouselCardProps {
    account: Account;
    isBalanceVisible: boolean;
    displayCurrency: string;
    exchangeRate: number;
}

const AccountCarouselCard: React.FC<AccountCarouselCardProps> = ({ account, isBalanceVisible, displayCurrency, exchangeRate }) => {
    const { t } = useLanguage();

    if (account.status === 'Provisioning') {
        return (
            <div className="relative w-full rounded-2xl shadow-digital-inset overflow-hidden text-[#0F172A] dark:text-white bg-slate-100 dark:bg-slate-700 flex flex-col items-center justify-center text-center p-6" style={{ height: '220px' }}>
                <SpinnerIcon className="w-10 h-10 text-primary" />
                <h4 className="font-bold text-lg mt-3 text-[#0F172A] dark:text-[#1E293B]">Account Provisioning</h4>
                <p className="text-sm mt-1">This may take 4-5 business hours. We'll notify you when it's ready.</p>
            </div>
        );
    }
    if (account.status === 'Under Review') {
        return (
            <div className="relative w-full rounded-2xl shadow-digital-inset overflow-hidden text-[#0F172A] dark:text-white bg-slate-100 dark:bg-slate-700 flex flex-col items-center justify-center text-center p-6" style={{ height: '220px' }}>
                <ClockIcon className="w-10 h-10 text-yellow-400" />
                <h4 className="font-bold text-lg mt-3 text-[#0F172A] dark:text-[#1E293B]">Account Under Review</h4>
                <p className="text-sm mt-1">Your account is pending approval by our customer service team.</p>
            </div>
        );
    }
    
    const convertedBalance = account.balance * exchangeRate;

    const accountBackgrounds: { [key in AccountType]?: string } = {
        [AccountType.CHECKING]: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=1200&auto=format&fit=crop',
        [AccountType.SAVINGS]: 'https://images.unsplash.com/photo-1579621970795-87f9ac75d601?q=80&w=1200&auto=format&fit=crop',
        [AccountType.BUSINESS]: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop',
    };
    
    const backgroundUrl = accountBackgrounds[account.type] || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop';

    return (
        <motion.div 
            whileHover={{ 
                scale: 1.02, 
                y: -4, 
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 0 30px 2px rgba(16, 185, 129, 0.22), 0 0 10px rgba(255, 255, 255, 0.1)" 
            }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            className="group relative w-full rounded-2xl shadow-lg overflow-hidden text-[#0F172A] dark:text-white cursor-pointer border border-white/10 hover:border-emerald-400/50 transition-colors duration-300" 
            style={{ height: '220px' }}
        >
            {/* Soft Ambient Hover Glow Layer */}
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-emerald-400/0 group-hover:ring-emerald-400/40 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none z-10"></div>
            
            <img
                src={backgroundUrl}
                alt={`${account.nickname || account.type} background`}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110 animate-ken-burns"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10"></div>
            
            <div className="relative z-20 p-6 flex flex-col h-full">
                <div>
                    <h4 className="font-bold text-xl drop-shadow-md">{account.nickname || account.type}</h4>
                    <p className="text-sm font-mono opacity-80 drop-shadow-sm">{account.accountNumber}</p>
                </div>
                <div className="flex-grow flex flex-col justify-center">
                    <p className="text-sm opacity-80">{t('label_available_balance')}</p>
                    <p className={`text-4xl font-bold tracking-wider transition-all duration-300 ${!isBalanceVisible ? 'blur-md' : ''}`} style={{ textShadow: '1px 1px 5px rgba(0,0,0,0.5)' }}>
                        {isBalanceVisible ? convertedBalance.toLocaleString('en-US', { style: 'currency', currency: displayCurrency }) : '$ ••••••••'}
                    </p>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 bg-white  px-3 py-1 rounded-full text-xs font-bold dark:bg-slate-800">
                       <VerifiedBadgeIcon className="w-4 h-4 primary-" />
                       <span>{account.features[0]}</span>
                    </div>
                    <Link to="/accounts" className="text-xs font-bold bg-white hover:bg-white  px-4 py-2 rounded-full transition-colors dark:bg-slate-800">
                        {t('action_view_details')} &rarr;
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

interface AccountCarouselProps {
    accounts: Account[];
    isBalanceVisible: boolean;
    displayCurrency: string;
    exchangeRate: number;
}

export const AccountCarousel: React.FC<AccountCarouselProps> = ({ accounts, isBalanceVisible, displayCurrency = 'USD', exchangeRate = 1 }) => {
    const [currentAccountIndex, setCurrentAccountIndex] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);
  
    const handlePrev = useCallback(() => {
        setCurrentAccountIndex((prevIndex) => (prevIndex === 0 ? accounts.length - 1 : prevIndex - 1));
    }, [accounts.length]);

    const handleNext = useCallback(() => {
        setCurrentAccountIndex((prevIndex) => (prevIndex === accounts.length - 1 ? 0 : prevIndex + 1));
    }, [accounts.length]);

    return (
        <div className="relative" ref={carouselRef} tabIndex={0}>
            <div className="overflow-hidden relative">
                <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentAccountIndex * 100}%)` }}
                >
                    {accounts.map((account) => (
                        <div key={account.id} className="w-full flex-shrink-0 px-2">
                            <AccountCarouselCard account={account} isBalanceVisible={isBalanceVisible} displayCurrency={displayCurrency} exchangeRate={exchangeRate} />
                        </div>
                    ))}
                </div>
            </div>

            {accounts.length > 1 && (
                <>
                    <button onClick={handlePrev} className="absolute top-1/2 -left-4 transform -translate-y-1/2 p-2 rounded-full bg-white dark:bg-slate-900  text-[#0F172A] dark:text-white/70 hover:text-[#0F172A] dark:text-white hover:bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-white/10 transition-all z-10 shadow-lg">
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <button onClick={handleNext} className="absolute top-1/2 -right-4 transform -translate-y-1/2 p-2 rounded-full bg-white dark:bg-slate-900  text-[#0F172A] dark:text-white/70 hover:text-[#0F172A] dark:text-white hover:bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-white/10 transition-all z-10 shadow-lg">
                        <ChevronRightIcon className="w-6 h-6" />
                    </button>
                </>
            )}
        </div>
    );
};
