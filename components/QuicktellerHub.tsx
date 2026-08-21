import React from 'react';
import { View } from '../types';
import { ArrowsRightLeftIcon, CurrencyDollarIcon, DevicePhoneMobileIcon, QrCodeIcon, CameraIcon, MapPinIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface QuicktellerHubProps {
    setActiveView: (view: View) => void;
    onOpenSendMoneyFlow: (initialTab?: 'send' | 'split' | 'deposit') => void;
}

const ActionButton: React.FC<{
    title: string;
    icon: React.ReactNode;
    bgImage: string;
    onClick: () => void;
}> = ({ title, icon, bgImage, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="group relative h-40 rounded-2xl text-[#0F172A] dark:text-white overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105"
        >
            <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110 animate-card-zoom"
                style={{ backgroundImage: `url(${bgImage})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
            <div className="relative h-full flex flex-col items-center justify-center p-4 z-20 text-center">
                <div className="mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    {icon}
                </div>
                <h4 className="font-bold text-lg leading-tight">{title}</h4>
            </div>
        </button>
    );
};


export const QuicktellerHub: React.FC<QuicktellerHubProps> = ({ setActiveView, onOpenSendMoneyFlow }) => {
    const { t } = useLanguage();

    const actions = [
        {
            title: t('quick_actions_send_money'),
            icon: <ArrowsRightLeftIcon className="w-10 h-10 text-primary-300" />,
            bgImage: 'https://static.vecteezy.com/system/resources/thumbnails/051/170/340/small/online-banking-interbank-payment-concept-businessman-with-virtual-global-currency-symbols-in-hand-free-photo.jpg',
            onClick: () => onOpenSendMoneyFlow('send'),
        },
        {
            title: t('quick_actions_pay_bills'),
            icon: <CurrencyDollarIcon className="w-10 h-10 text-primary-300" />,
            bgImage: 'https://cdn.businessday.ng/wp-content/uploads/2025/12/POS-terminal-.jpg',
            onClick: () => setActiveView('utilities'),
        },
        {
            title: t('quick_actions_buy_airtime'),
            icon: <DevicePhoneMobileIcon className="w-10 h-10 text-primary-300" />,
            bgImage: 'https://cdn.corporatefinanceinstitute.com/assets/mobile-banking.jpeg',
            onClick: () => setActiveView('quickteller'),
        },
        {
            title: t('quick_actions_scan_to_pay'),
            icon: <QrCodeIcon className="w-10 h-10 text-primary-300" />,
            bgImage: 'https://images.unsplash.com/photo-1588196749107-1a71a9953488?q=80&w=2942&auto=format&fit=crop',
            onClick: () => setActiveView('qrScanner'),
        },
        {
            title: t('quick_actions_deposit_check'),
            icon: <CameraIcon className="w-10 h-10 text-primary-300" />,
            bgImage: 'https://www.temenos.com/wp-content/uploads/2025/04/Temenos-digital-banking-scaled.jpg',
            onClick: () => onOpenSendMoneyFlow('deposit'),
        },
        {
            title: t('quick_actions_find_atm'),
            icon: <MapPinIcon className="w-10 h-10 text-primary-300" />,
            bgImage: 'https://www.housingfinance.co.ug/wp-content/uploads/2022/11/hfb-Safety-precautions-at-the-ATM-1024x768.jpg',
            onClick: () => setActiveView('atmLocator'),
        }
    ];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-digital">
            <h3 className="text-2xl font-bold text-slate-100 mb-4">{t('dashboard_quick_actions')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {actions.map(action => (
                    <ActionButton
                        key={action.title}
                        title={action.title}
                        icon={action.icon}
                        bgImage={action.bgImage}
                        onClick={action.onClick}
                    />
                ))}
            </div>
        </div>
    );
};