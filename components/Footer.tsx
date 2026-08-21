import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { View } from '../types';
import {
    FirstPacificLogo,
    XSocialIcon,
    LinkedInIcon,
    InstagramIcon,
    AppleIcon,
    GooglePlayIcon,
    FdicIcon,
    EqualHousingLenderIcon,
    GlobeAmericasIcon,
    ShieldCheckIcon,
    LockClosedIcon,
    MapPinIcon,
    PhoneIcon,
    ChevronDownIcon,
    ServerIcon
} from './Icons';
import { LEGAL_CONTENT } from './constants';
import { useLanguage } from '../contexts/LanguageContext';

interface FooterProps {
    onOpenSendMoneyFlow: (initialTab?: 'send' | 'split' | 'deposit') => void;
    openLegalModal: (title: string, content: string) => void;
}

interface FooterLinkProps {
    to?: `/${View}`;
    onClick?: () => void;
    children: React.ReactNode;
}

const FooterLink: React.FC<FooterLinkProps> = ({ to, onClick, children }) => (
    <li className="group">
        {to ? (
            <Link 
                to={to} 
                className="text-xs sm:text-sm text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:hover:text-white transition-all duration-200 group-hover:translate-x-1 flex items-center gap-1.5"
            >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary font-bold text-xs">›</span>
                <span>{children}</span>
            </Link>
        ) : (
            <button 
                type="button"
                onClick={onClick} 
                className="text-xs sm:text-sm text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:hover:text-white transition-all duration-200 group-hover:translate-x-1 flex items-center gap-1.5 text-left cursor-pointer"
            >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary font-bold text-xs">›</span>
                <span>{children}</span>
            </button>
        )}
    </li>
);

const DownloadButton: React.FC<{ icon: React.ReactNode; store: string; title: string; href: string }> = ({ icon, store, title, href }) => (
    <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="flex items-center space-x-3 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:border-primary/50 text-[#0F172A] dark:text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 group  shadow-sm"
    >
        <div className="text-[#0F172A] dark:text-[#334155] group-hover:text-primary transition-colors">
            {icon}
        </div>
        <div className="text-left">
            <p className="text-[9px] leading-none text-[#0F172A] dark:text-white uppercase tracking-widest font-mono">{store}</p>
            <p className="text-xs leading-tight font-bold">{title}</p>
        </div>
    </a>
);

const GlobalMarketClock = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const utcTimeStr = time.toUTCString().replace('GMT', 'UTC');

    return (
        <div className="flex items-center gap-2 font-mono text-[11px] text-[#0F172A] dark:text-white bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-[#0F172A] dark:text-[#334155]">UTC:</span>
            <span>{utcTimeStr}</span>
        </div>
    );
};

const SystemStatus = () => (
    <div className="flex items-center space-x-2 bg-emerald-500 border border-emerald-500/25 rounded-full px-3.5 py-1">
        <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </div>
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono">ISO 20022 & FedNow: Operational</span>
    </div>
);

export const Footer: React.FC<FooterProps> = ({ onOpenSendMoneyFlow, openLegalModal }) => {
    const [region, setRegion] = useState('Global (English)');
    const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
    const { t } = useLanguage();

    const handleOpenTerms = () => {
        openLegalModal(LEGAL_CONTENT.terms.title, LEGAL_CONTENT.terms.content);
    };

    const handleOpenPrivacy = () => {
        openLegalModal(LEGAL_CONTENT.privacy.title, LEGAL_CONTENT.privacy.content);
    };

    const handleOpenLicenses = () => {
        openLegalModal(LEGAL_CONTENT.licenses.title, LEGAL_CONTENT.licenses.content);
    };

    const handleOpenFdic = () => {
        openLegalModal(
            "FDIC Insurance & Deposit Protection",
            `<h3>Federal Deposit Insurance Corporation (FDIC) Coverage</h3>
            <p>First Pacific Bank, N.A. (FDIC Certificate #34912) provides standard deposit insurance coverage of up to $250,000 per depositor, for each account ownership category.</p>
            <h3>Insured Cash Sweep (ICS) & CDARS Program</h3>
            <p>For sovereign and ultra-high-net-worth clients, balances exceeding $250,000 can be seamlessly swept across our network of participating FDIC-insured partner institutions, providing multi-million-dollar aggregate coverage up to $2,500,000 while maintaining single-statement simplicity.</p>
            <h3>Routing & Clearing Identifiers</h3>
            <p><strong>Routing Number (ABA):</strong> 021000021<br/><strong>SWIFT/BIC:</strong> FPABUS33<br/><strong>NMLS ID:</strong> 994821</p>`
        );
    };

    const handleOpenSecurity = () => {
        openLegalModal(
            "Bank Cybersecurity & Encryption Standards",
            `<h3>Institutional-Grade Security Protocols</h3>
            <p>First Pacific Bank utilizes 256-bit TLS 1.3 cryptographic protocols across all communication channels, hardware security modules (HSM) for key management, and continuous automated fraud telemetry.</p>
            <h3>Zero-Trust Architecture</h3>
            <p>Every transaction, transfer request, and API call requires dynamic cryptographic authentication and automated multi-signature verification thresholds.</p>
            <h3>Compliance & Certifications</h3>
            <p>• SOC-2 Type II Certified<br/>• ISO 27001 Information Security Management<br/>• PCI-DSS Level 1 Compliant<br/>• Basel III Capital Adequacy Compliant</p>`
        );
    };

    return (
        <footer className="relative bg-slate-50 dark:bg-[#080d1a] text-[#0F172A] dark:text-white font-sans border-t border-slate-200 dark:border-slate-800/80 transition-colors duration-200">
            {/* Top Institutional Bar */}
            <div className="border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 ">
                <div className="w-full max-w-[1720px] mx-auto px-2.5 sm:px-4 md:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="p-2 bg-slate-900 dark:bg-slate-900 rounded-xl shadow-md group-hover:scale-105 transition-transform">
                                <FirstPacificLogo className="w-5 h-5 text-white dark:text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="brand-text-premium text-xs tracking-[0.2em] font-black text-[#0F172A] dark:text-white leading-none">FIRST</span>
                                <span className="text-[9px] font-sans text-[#0F172A] dark:text-white uppercase tracking-[0.25em] leading-tight mt-0.5">Pacific Bank</span>
                            </div>
                        </Link>
                        <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-800"></div>
                        <SystemStatus />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                        <button 
                            type="button"
                            onClick={handleOpenSecurity}
                            className="flex items-center gap-1.5 text-xs font-semibold text-[#0F172A] dark:text-[#334155] hover:text-primary transition-colors cursor-pointer"
                            title="View security protocols and encryption credentials"
                        >
                            <LockClosedIcon className="w-3.5 h-3.5 text-emerald-500" />
                            <span>256-Bit TLS 1.3</span>
                        </button>
                        <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-800"></div>
                        <GlobalMarketClock />
                        
                        <div className="relative">
                            <button 
                                type="button"
                                onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                                className="flex items-center gap-2 text-xs font-bold text-[#0F172A] dark:text-[#334155] uppercase tracking-wider hover:text-primary transition-colors bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer"
                            >
                                <GlobeAmericasIcon className="w-3.5 h-3.5 text-primary" />
                                <span>{region}</span>
                                <ChevronDownIcon className="w-3 h-3" />
                            </button>
                            {isRegionDropdownOpen && (
                                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-1 z-50 overflow-hidden">
                                    {['Global (English)', 'Americas (USD)', 'EMEA (EUR/GBP)', 'Asia-Pacific (SGD/JPY)', 'Switzerland (CHF)'].map(r => (
                                        <button 
                                            key={r} 
                                            type="button"
                                            onClick={() => {
                                                setRegion(r);
                                                setIsRegionDropdownOpen(false);
                                            }} 
                                            className={`block w-full text-left px-4 py-2 text-xs transition-colors cursor-pointer ${
                                                region === r 
                                                    ? 'bg-primary/10 text-primary font-bold' 
                                                    : 'text-[#0F172A] dark:text-[#334155] hover:bg-slate-100 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Navigation Columns */}
            <div className="w-full max-w-[1720px] mx-auto px-2.5 sm:px-4 md:px-6 lg:px-8 py-10 lg:py-14">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-10">
                    {/* Brand Column */}
                    <div className="col-span-1 sm:col-span-2 lg:col-span-2 space-y-6">
                        <div className="space-y-3">
                            <h3 className="text-[#0F172A] dark:text-white font-bold text-lg tracking-tight">Sovereign Wealth & Private Banking</h3>
                            <p className="text-xs sm:text-sm text-[#0F172A] dark:text-white leading-relaxed max-w-md">
                                First Pacific Bank unites the privacy and confidentiality of Swiss private banking with modern real-time settlement rails. Serving global family offices, sovereign entities, and institutional clients across 190+ jurisdictions.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <DownloadButton icon={<AppleIcon className="w-5 h-5"/>} store="Download on the" title="App Store" href="#" />
                            <DownloadButton icon={<GooglePlayIcon className="w-5 h-5"/>} store="Get it on" title="Google Play" href="#" />
                        </div>

                        {/* Routing & Clearing Quick Info */}
                        <div className="bg-slate-100 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-[#0F172A] dark:text-white space-y-1">
                            <div className="flex justify-between items-center">
                                <span className="text-[#0F172A]">Routing (ABA):</span>
                                <span className="font-bold text-[#1E293B] dark:text-slate-200">021000021</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#0F172A]">SWIFT / BIC:</span>
                                <span className="font-bold text-[#1E293B] dark:text-slate-200">FPABUS33</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#0F172A]">NMLS ID:</span>
                                <span className="font-bold text-[#1E293B] dark:text-slate-200">994821</span>
                            </div>
                        </div>
                    </div>

                    {/* Column 1: Private Wealth */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-[#0F172A] dark:text-white text-xs uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-2.5">
                            {t('footer_private_banking')}
                        </h4>
                        <ul className="space-y-2.5">
                            <FooterLink to="/accounts">{t('header_title_accounts')}</FooterLink>
                            <FooterLink to="/cards">{t('header_title_cards')}</FooterLink>
                            <FooterLink to="/invest">{t('header_title_invest')}</FooterLink>
                            <FooterLink to="/crypto">{t('header_title_crypto')}</FooterLink>
                            <FooterLink to="/loans">{t('header_title_loans')}</FooterLink>
                        </ul>
                    </div>

                    {/* Column 2: Treasury & Services */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-[#0F172A] dark:text-white text-xs uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-2.5">
                            {t('footer_services')}
                        </h4>
                        <ul className="space-y-2.5">
                            <FooterLink onClick={() => onOpenSendMoneyFlow('send')}>{t('quick_actions_send_money')}</FooterLink>
                            <FooterLink to="/flights">{t('header_title_flights')}</FooterLink>
                            <FooterLink to="/insurance">{t('header_title_insurance')}</FooterLink>
                            <FooterLink to="/checkin">{t('header_title_checkin')}</FooterLink>
                            <FooterLink to="/globalAid">{t('header_title_globalAid')}</FooterLink>
                        </ul>
                    </div>

                    {/* Column 3: Governance & Security */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-[#0F172A] dark:text-white text-xs uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-2.5">
                            {t('footer_governance')}
                        </h4>
                        <ul className="space-y-2.5">
                            <FooterLink to="/about">{t('header_title_about')}</FooterLink>
                            <FooterLink to="/support">{t('header_title_support')}</FooterLink>
                            <FooterLink to="/security">{t('header_title_security')}</FooterLink>
                            <FooterLink onClick={handleOpenFdic}>FDIC Insurance Disclosures</FooterLink>
                            <FooterLink onClick={handleOpenSecurity}>Cybersecurity & SOC2</FooterLink>
                        </ul>
                    </div>

                    {/* Column 4: Global Desks & Contact */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-[#0F172A] dark:text-white text-xs uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-2.5">
                            {t('footer_contact')}
                        </h4>
                        <div className="space-y-3.5 text-xs text-[#0F172A] dark:text-white">
                            <div className="flex items-start gap-2.5">
                                <MapPinIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <span className="leading-snug">45 Rockefeller Plaza, New York, NY 10111 (Rockefeller Center)</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <PhoneIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                                <a href="mailto:contact@firstpaba.com" className="hover:text-primary transition-colors">contact@firstpaba.com</a>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <ServerIcon className="w-4 h-4 text-cyan-500 shrink-0" />
                                <a href="mailto:info@firstpaba.com" className="hover:text-primary transition-colors">info@firstpaba.com</a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Regulatory & Institutional Disclosures Section */}
                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800/80 space-y-4">
                    <p className="text-[11px] text-[#0F172A] dark:text-white leading-relaxed font-sans">
                        First Pacific Bank, N.A. is a Member of the Federal Reserve System and Member FDIC. Deposit products are insured by the FDIC up to $250,000 per depositor, per ownership category. Balances participating in the Insured Cash Sweep (ICS®) and CDARS® programs are eligible for multi-million-dollar aggregate coverage through our network of FDIC-insured depository institutions. Investment, cryptocurrency, and digital asset products are NOT deposits, are NOT insured by the FDIC or any government agency, and are subject to investment risks, including possible loss of principal. Equal Housing Lender.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[#0F172A] dark:text-white font-bold">
                            <button type="button" onClick={handleOpenPrivacy} className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</button>
                            <span>•</span>
                            <button type="button" onClick={handleOpenTerms} className="hover:text-primary transition-colors cursor-pointer">Terms of Service</button>
                            <span>•</span>
                            <button type="button" onClick={handleOpenLicenses} className="hover:text-primary transition-colors cursor-pointer">Licenses & Disclosures</button>
                            <span>•</span>
                            <button type="button" onClick={handleOpenFdic} className="hover:text-primary transition-colors cursor-pointer">FDIC Protection</button>
                            <span>•</span>
                            <button type="button" onClick={handleOpenSecurity} className="hover:text-primary transition-colors cursor-pointer">Security Protocol</button>
                        </div>

                        <div className="flex items-center gap-3">
                            <button 
                                type="button" 
                                onClick={handleOpenFdic}
                                className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-[#334155] text-xs font-bold transition-colors cursor-pointer"
                                title="Member FDIC"
                            >
                                <FdicIcon className="h-4" />
                                <span>Member FDIC</span>
                            </button>
                            <button 
                                type="button" 
                                onClick={handleOpenLicenses}
                                className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-[#334155] text-xs font-bold transition-colors cursor-pointer"
                                title="Equal Housing Lender"
                            >
                                <EqualHousingLenderIcon className="h-4" />
                                <span>Equal Housing</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Copyright and Social Links */}
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#0F172A] dark:text-white font-mono">
                    <div>
                        &copy; {new Date().getFullYear()} First Pacific Bank, N.A. All rights reserved. Sovereign Clearing & Settlement Node.
                    </div>
                    <div className="flex items-center gap-4">
                        <a href="#" className="text-[#0F172A] hover:text-primary transition-colors" title="X (Twitter)"><XSocialIcon className="w-4 h-4"/></a>
                        <a href="#" className="text-[#0F172A] hover:text-primary transition-colors" title="LinkedIn"><LinkedInIcon className="w-4 h-4"/></a>
                        <a href="#" className="text-[#0F172A] hover:text-primary transition-colors" title="Instagram"><InstagramIcon className="w-4 h-4"/></a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
