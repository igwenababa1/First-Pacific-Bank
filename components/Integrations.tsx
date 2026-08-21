
import React, { useState, useEffect } from 'react';
import { NotificationType } from '../types';
import { 
    CheckCircleIcon, OnfidoIcon, PhoneIcon, EnvelopeIcon, PlusIcon, 
    ArrowRightIcon, ShieldCheckIcon, GlobeAltIcon,
    getServiceIcon, getBankIcon, BrandLogo
} from './Icons';
import { LinkServiceModal } from './LinkServiceModal';
import { LinkBankAccountModal } from './LinkBankAccountModal';
import { ExternalAccountsService } from '../services/externalAccountsService';

interface IntegrationsProps {
    linkedServices: Record<string, any>;
    onLinkService: (serviceName: string, identifier: string) => void;
    addNotification: (type: any, title: string, message: string) => void;
}

const ServiceCard: React.FC<{ 
    name: string; 
    icon: React.ComponentType<{ className?: string }>; 
    description: string; 
    isLinked: boolean; 
    identifier?: string; 
    balance?: number;
    accountType?: string;
    onLink: () => void;
    category: string;
    domain: string;
}> = ({ name, icon: Icon, description, isLinked, identifier, balance, accountType, onLink, category, domain }) => (
    <div className={`group relative overflow-hidden p-6 rounded-2xl border  transition-all duration-300 flex flex-col h-full ${isLinked ? 'bg-white dark:bg-slate-900 border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.1)]' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/10 hover:bg-white dark:bg-slate-900 hover:border-primary/30 hover:shadow-[0_0_30px_rgba(0,82,255,0.15)]'}`}>
        
        {isLinked && (
            <div className="absolute top-4 right-4 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Active</span>
            </div>
        )}

        <div className="flex items-start justify-between mb-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 p-2 ${isLinked ? 'bg-white' : 'bg-white'}`}>
                <BrandLogo 
                    domain={domain} 
                    name={name} 
                    fallback={Icon} 
                    className="w-full h-full object-contain" 
                />
            </div>
        </div>

        <div className="mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F172A] border border-slate-200 dark:border-slate-300 px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-900">{category}</span>
        </div>

        <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-1 group-hover:text-primary-300 transition-colors">{name}</h3>
        <p className="text-sm text-[#0F172A] dark:text-white leading-relaxed mb-6 flex-grow">{description}</p>

        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/10">
            {isLinked ? (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-green-400 font-bold">
                            <CheckCircleIcon className="w-4 h-4 mr-1.5" />
                            <span className="truncate">{identifier}</span>
                        </div>
                        {balance !== undefined && (
                            <div className="text-right">
                                <p className="text-[10px] text-[#0F172A] uppercase tracking-wider">{accountType || 'Balance'}</p>
                                <p className="text-sm font-bold text-[#0F172A] dark:text-white">${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] text-[#0F172A]">Last synced: Just now</p>
                        <button className="text-[10px] font-bold text-primary hover:text-primary-300 transition-colors uppercase tracking-wider">Sync Now</button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={onLink}
                    className="w-full py-2.5 text-sm font-semibold text-[#0F172A] dark:text-white bg-white hover:bg-primary hover:text-[#0F172A] dark:text-white rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-lg dark:bg-slate-800"
                >
                    <span>Connect</span>
                    <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
            )}
        </div>
    </div>
);

const PartnerCard: React.FC<{
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    website: string;
    category: string;
    domain: string;
    status?: 'operational' | 'degraded' | 'offline';
    onClick?: () => void;
}> = ({ name, icon: Icon, description, website, category, domain, status, onClick }) => (
    <div onClick={(e) => {
        if (onClick) { e.preventDefault(); onClick(); }
        else { window.open(website, '_blank', 'noopener,noreferrer'); }
    }} className="cursor-pointer block group relative p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 hover:bg-white dark:bg-slate-900 hover:border-slate-200 dark:border-white/10 transition-all duration-300">
        <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 text-[#0F172A] dark:text-white group-hover:text-[#0F172A] dark:text-white transition-colors w-12 h-12 flex items-center justify-center">
                 <BrandLogo domain={domain} name={name} fallback={Icon} className="w-8 h-8 object-contain" />
            </div>
            <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-[#0F172A] dark:text-[#1E293B] group-hover:text-[#0F172A] dark:text-white">{name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#0F172A] dark:text-white border border-slate-100 dark:border-white/10 dark:bg-slate-800">{category}</span>
                </div>
                <p className="text-xs text-[#0F172A] group-hover:text-[#0F172A] dark:text-white leading-relaxed mb-2">{description}</p>
                
                {status && (
                    <div className={`mt-2 inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                        status === 'operational' ? 'bg-emerald-500 text-emerald-500 border border-emerald-500/20' : 
                        status === 'degraded' ? 'bg-amber-500 text-amber-500 border border-amber-500/20' :
                        'bg-rose-500 text-rose-500 border border-rose-500/20'
                    }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status === 'operational' ? 'bg-emerald-500 animate-pulse' : status === 'degraded' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                        {status === 'operational' ? 'Fully Functional' : status === 'degraded' ? 'Sandbox Simulation' : 'Offline'}
                    </div>
                )}
            </div>
            <ArrowRightIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0F172A] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
        </div>
    </div>
);

export const Integrations: React.FC<IntegrationsProps> = ({ linkedServices, onLinkService, addNotification }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [isBankModalOpen, setIsBankModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState('');
    const [configStatus, setConfigStatus] = useState<{ hasResendKey: boolean, hasTwilioKey: boolean } | null>(null);

    useEffect(() => {
        fetch('/api/config-status')
            .then(res => res.json())
            .then(data => setConfigStatus(data))
            .catch(err => console.error("Failed to load gateway config:", err));
    }, []);

    const handleLinkClick = (serviceName: string) => {
        setSelectedService(serviceName);
        setModalOpen(true);
    };

    const handleLink = (serviceName: string, identifier: string) => {
        onLinkService(serviceName, identifier);
        setModalOpen(false);
    };

    const paymentServices = [
        { name: 'PayPal', description: 'Global secure payments.', category: 'Digital Wallet', domain: 'paypal.com' },
        { name: 'CashApp', description: 'Instant P2P payments.', category: 'Digital Wallet', domain: 'cash.app' },
        { name: 'Venmo', description: 'Social payments & splitting.', category: 'Digital Wallet', domain: 'venmo.com' },
        { name: 'Zelle', description: 'Fast US bank transfers.', category: 'Instant Pay', domain: 'zellepay.com' },
        { name: 'Wise', description: 'Low-cost international.', category: 'Global Transfer', domain: 'wise.com' },
        { name: 'Revolut', description: 'Global money app.', category: 'Global Transfer', domain: 'revolut.com' },
        { name: 'Western Union', description: 'Cash pickup & wiring.', category: 'Remittance', domain: 'westernunion.com' },
        { name: 'MoneyGram', description: 'Cross-border remittance.', category: 'Remittance', domain: 'moneygram.com' },
    ];

    const bankServices = [
        { name: 'Chase', description: 'Connect checking & savings.', category: 'Major Bank', domain: 'chase.com' },
        { name: 'Bank of America', description: 'Link accounts instantly.', category: 'Major Bank', domain: 'bankofamerica.com' },
        { name: 'Wells Fargo', description: 'Secure data sharing.', category: 'Major Bank', domain: 'wellsfargo.com' },
        { name: 'Citi', description: 'Global banking connection.', category: 'Major Bank', domain: 'citi.com' },
        { name: 'Capital One', description: 'Credit cards & banking.', category: 'Major Bank', domain: 'capitalone.com' },
        { name: 'Chime', description: 'Mobile banking integration.', category: 'Neobank', domain: 'chime.com' },
    ];

    return (
        <>
            {modalOpen && (
                <LinkServiceModal
                    serviceName={selectedService}
                    onClose={() => setModalOpen(false)}
                    onLink={handleLink}
                />
            )}

            {isBankModalOpen && (
                <LinkBankAccountModal
                    onClose={() => setIsBankModalOpen(false)}
                    onLinkSuccess={(bankName, accountName, lastFour, balance) => {
                        addNotification(NotificationType.ACCOUNT, 'Bank Account Linked', `Successfully linked ${bankName} (${accountName}) for real-time portfolio tracking.`);
                        setIsBankModalOpen(false);
                    }}
                />
            )}
            
            <div className="relative min-h-screen text-[#0F172A] dark:text-white">
                {/* Immersive Background */}
                <div className="absolute inset-0 z-0">
                    <div 
                        className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity"
                        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')" }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-900"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:48px_48px] mask-image-gradient"></div>
                </div>

                <div className="relative z-10 space-y-12 pb-12">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-200 dark:border-white/10 pb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
                                    <GlobeAltIcon className="w-6 h-6 text-primary" />
                                </div>
                                <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white">Integration Hub</h2>
                            </div>
                            <p className="text-[#0F172A] dark:text-white max-w-2xl">
                                Connect your financial ecosystem. Link external accounts, wallets, and banks to centralize your finances within Premium Reserved Bank.
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-white/10  shadow-lg">
                                <ShieldCheckIcon className="w-4 h-4 text-green-400" />
                                <span className="text-xs font-bold text-[#0F172A] dark:text-white">Bank-Grade Encryption Protocols Active</span>
                            </div>
                            <button onClick={() => addNotification(NotificationType.SECURITY, 'Smart Sync Initiated', 'All linked accounts are being securely updated.')} className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/20">
                                <GlobeAltIcon className="w-4 h-4" />
                                Smart Sync All
                            </button>
                        </div>
                    </div>

                    {/* Digital Wallets & Transfers */}
                    <div>
                        <h3 className="text-xl font-bold text-[#0F172A] dark:text-white mb-6 flex items-center gap-2">
                            <span className="w-1 h-6 bg-primary rounded-full"></span>
                            Digital Wallets & Transfers
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {paymentServices.map(service => (
                                <ServiceCard 
                                    key={service.name}
                                    {...service}
                                    icon={getServiceIcon(service.name)}
                                    isLinked={linkedServices.hasOwnProperty(service.name)}
                                    identifier={linkedServices[service.name]?.identifier}
                                    balance={linkedServices[service.name]?.balance}
                                    accountType={linkedServices[service.name]?.accountType}
                                    onLink={() => handleLinkClick(service.name)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Connected Bank Accounts */}
                    <div>
                        <h3 className="text-xl font-bold text-[#0F172A] dark:text-white mb-6 flex items-center gap-2">
                            <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                            Connected Bank Accounts
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {bankServices.map(service => (
                                <ServiceCard 
                                    key={service.name}
                                    {...service}
                                    icon={getBankIcon(service.name)}
                                    isLinked={linkedServices.hasOwnProperty(service.name)}
                                    identifier={linkedServices[service.name]?.identifier}
                                    balance={linkedServices[service.name]?.balance}
                                    accountType={linkedServices[service.name]?.accountType}
                                    onLink={() => handleLinkClick(service.name)}
                                />
                            ))}
                            
                            {/* Add New Placeholder */}
                            <button 
                                onClick={() => setIsBankModalOpen(true)}
                                className="group relative p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-300 bg-white dark:bg-slate-900 hover:bg-white dark:bg-slate-900 transition-all duration-300 flex flex-col items-center justify-center text-center h-full min-h-[240px]"
                            >
                                <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <PlusIcon className="w-6 h-6 text-[#0F172A] dark:text-white" />
                                </div>
                                <h4 className="font-bold text-[#0F172A] dark:text-white">Link Other Bank</h4>
                                <p className="text-xs text-[#0F172A] mt-2 px-4">Connect external banks & credit unions via OAuth 2.0 FDX for real-time portfolio tracking.</p>
                            </button>
                        </div>
                    </div>

                    {/* Platform Infrastructure Partners */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t border-slate-200 dark:border-white/10">
                        <div className="lg:col-span-2">
                            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white mb-6 flex items-center gap-2">
                                <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                                Platform Infrastructure
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <PartnerCard 
                                    name="Onfido" 
                                    icon={OnfidoIcon} 
                                    category="Security"
                                    description="Real-time identity verification and AML compliance engine." 
                                    website="https://onfido.com" 
                                    domain="onfido.com"
                                    status="operational"
                                />
                                <PartnerCard 
                                    name="Twilio" 
                                    icon={PhoneIcon} 
                                    category="Communication"
                                    description="Secure 2FA delivery and transactional SMS notifications." 
                                    website="https://twilio.com" 
                                    domain="twilio.com"
                                    status={configStatus ? (configStatus.hasTwilioKey ? 'operational' : 'degraded') : 'degraded'}
                                />
                                <PartnerCard 
                                    name="SendGrid / Resend" 
                                    icon={EnvelopeIcon} 
                                    category="Communication"
                                    description="Enterprise-grade email delivery infrastructure." 
                                    website="https://resend.com" 
                                    domain="resend.com"
                                    status={configStatus ? (configStatus.hasResendKey ? 'operational' : 'degraded') : 'degraded'}
                                />
                            </div>
                        </div>

                        {/* API Status Widget */}
                        <div className="lg:col-span-1">
                            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white mb-6 flex items-center gap-2">
                                <span className="w-1 h-6 bg-green-500 rounded-full"></span>
                                API Status
                            </h3>
                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-2xl p-6 ">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-[#0F172A] dark:text-white">Payment API</span>
                                        <span className="flex items-center gap-2 text-xs font-bold text-green-400 bg-green-500 px-2 py-1 rounded">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> 99.99% Uptime
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 w-full shadow-[0_0_10px_#22c55e]"></div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-sm text-[#0F172A] dark:text-white">Identity API</span>
                                        <span className="flex items-center gap-2 text-xs font-bold text-green-400 bg-green-500 px-2 py-1 rounded">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> Operational
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 w-full shadow-[0_0_10px_#22c55e]"></div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 text-center">
                                    <a href="#" className="text-xs text-primary hover:text-primary-300 transition-colors">View Full System Status &rarr;</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
