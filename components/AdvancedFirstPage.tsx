
import React, { useState, useEffect } from 'react';
import { ArrowRightIcon, GlobeAmericasIcon, ShieldCheckIcon, TrendingUpIcon, FirstPacificLogo, LockClosedIcon, BankIcon, UserCircleIcon } from './Icons';
import { MASTER_WALLPAPERS } from './bankingImageAssets';

interface AdvancedFirstPageProps {
    onComplete: () => void;
    onOpenAccount: () => void;
}

const BACKGROUND_IMAGES = MASTER_WALLPAPERS;

const MarketTicker = () => (
    <div className="absolute bottom-0 left-0 right-0 bg-slate-50 dark:bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]/90  border-t border-slate-200 dark:border-white/10 py-3 overflow-hidden z-30">
        <div className="flex items-center animate-marquee whitespace-nowrap">
            <div className="flex space-x-12 px-4">
                {[
                    { label: "S&P 500", val: "5,245.12", change: "+0.45%", up: true },
                    { label: "NASDAQ", val: "16,428.82", change: "+0.82%", up: true },
                    { label: "EUR/USD", val: "1.0842", change: "-0.12%", up: false },
                    { label: "GBP/USD", val: "1.2635", change: "+0.05%", up: true },
                    { label: "BTC/USD", val: "68,420.00", change: "+1.24%", up: true },
                    { label: "Gold", val: "2,345.50", change: "+0.30%", up: true },
                    { label: "Oil (WTI)", val: "82.15", change: "-0.45%", up: false },
                    { label: "JPY/USD", val: "151.40", change: "+0.15%", up: true },
                ].map((item, i) => (
                    <div key={i} className="flex items-center space-x-3 text-sm font-mono tracking-tight">
                        <span className="text-[#0F172A] dark:text-white font-bold">{item.label}</span>
                        <span className="text-[#0F172A] dark:text-white">{item.val}</span>
                        <span className={`flex items-center ${item.up ? "text-emerald-400" : "text-red-400"}`}>
                            <span className="mr-1">{item.up ? '▲' : '▼'}</span> {item.change}
                        </span>
                    </div>
                ))}
                 {/* Repeat for seamless loop */}
                 {[
                    { label: "S&P 500", val: "5,245.12", change: "+0.45%", up: true },
                    { label: "NASDAQ", val: "16,428.82", change: "+0.82%", up: true },
                    { label: "EUR/USD", val: "1.0842", change: "-0.12%", up: false },
                    { label: "GBP/USD", val: "1.2635", change: "+0.05%", up: true },
                    { label: "BTC/USD", val: "68,420.00", change: "+1.24%", up: true },
                ].map((item, i) => (
                    <div key={`dup-${i}`} className="flex items-center space-x-3 text-sm font-mono tracking-tight">
                        <span className="text-[#0F172A] dark:text-white font-bold">{item.label}</span>
                        <span className="text-[#0F172A] dark:text-white">{item.val}</span>
                        <span className={`flex items-center ${item.up ? "text-emerald-400" : "text-red-400"}`}>
                            <span className="mr-1">{item.up ? '▲' : '▼'}</span> {item.change}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export const AdvancedFirstPage: React.FC<AdvancedFirstPageProps> = ({ onComplete, onOpenAccount }) => {
    const [bgIndex, setBgIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
        }, 7000); 
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white flex flex-col items-center justify-center relative overflow-x-hidden font-sans pb-16 md:pb-0">
            
            {/* Dynamic Background Slider */}
            <div className="fixed inset-0 z-0">
                {BACKGROUND_IMAGES.map((img, index) => (
                    <div 
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-[2500ms] ease-in-out bg-cover bg-center ${index === bgIndex ? 'opacity-100 scale-100 animate-ken-burns' : 'opacity-0 scale-105'}`}
                        style={{ backgroundImage: `url('${img}')` }}
                    ></div>
                ))}
            </div>

            {/* Overlays */}
            <div className="fixed inset-0 z-10 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900/90"></div>
            <div className="fixed inset-0 z-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
            
            {/* Navigation Bar */}
            <div className="absolute top-0 left-0 right-0 z-40 p-6 md:p-8 flex justify-between items-center animate-fade-in-down">
                <div className="flex items-center gap-3 group cursor-default">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white  border border-slate-300 dark:border-white/20 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 hover:bg-white dark:bg-slate-800">
                        <FirstPacificLogo className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div className="flex flex-col">
                        <span className="brand-text-premium text-base md:text-lg leading-none tracking-[0.2em] mb-1">FIRST</span>
                        <span className="text-[8px] md:text-[10px] font-sans font-bold text-[#0F172A] dark:text-white uppercase tracking-[0.4em] leading-tight">Pacific Bank</span>
                    </div>
                </div>
                
                <div className="hidden md:flex gap-10 text-xs font-bold uppercase tracking-[0.2em] text-[#0F172A] dark:text-[#334155]">
                    <span className="hover:text-[#0F172A] dark:text-white cursor-pointer transition-colors duration-300 border-b-2 border-transparent hover:border-primary pb-1">Private Banking</span>
                    <span className="hover:text-[#0F172A] dark:text-white cursor-pointer transition-colors duration-300 border-b-2 border-transparent hover:border-primary pb-1">Corporate</span>
                    <span className="hover:text-[#0F172A] dark:text-white cursor-pointer transition-colors duration-300 border-b-2 border-transparent hover:border-primary pb-1">Wealth Management</span>
                </div>
                
                <button 
                    onClick={onComplete} 
                    className="hidden md:flex px-6 py-3 bg-white hover:bg-white  border border-slate-300 dark:border-white/20 rounded-full text-xs font-black uppercase tracking-widest transition-all hover:scale-105 flex items-center gap-2 dark:bg-slate-800"
                >
                    <LockClosedIcon className="w-3 h-3" /> Client Login
                </button>
            </div>

            {/* Main Content */}
            <div className="relative z-30 w-full max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-12 md:gap-16 mt-32 mb-20 md:mt-0 md:mb-0">
                <div className="md:w-1/2 text-center md:text-left animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-8 ">
                        <ShieldCheckIcon className="w-4 h-4" /> Global Financial Standard
                    </div>
                    <h1 className="text-6xl lg:text-8xl font-black font-serif tracking-tighter leading-[0.9] text-[#0F172A] dark:text-white drop-shadow-2xl mb-8">
                        Wealth Beyond<br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-white to-slate-400">Boundaries.</span>
                    </h1>
                    <p className="text-xl text-[#0F172A] dark:text-[#334155] max-w-lg leading-relaxed drop-shadow-md font-light mb-12">
                        The world's first truly global private bank. Experience unparalleled security, instant cross-border transactions, and AI-powered wealth management.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-6 justify-center md:justify-start">
                        <button 
                            onClick={onComplete} 
                            className="px-10 py-5 bg-white hover:bg-slate-100 text-[#0F172A] font-black text-sm uppercase tracking-widest rounded-full shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all transform hover:scale-105 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 group dark:bg-slate-800"
                        >
                            <BankIcon className="w-5 h-5 text-primary" />
                            <span>Account Login</span>
                            <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                         <button 
                            onClick={onOpenAccount} 
                            className="px-10 py-5 bg-white hover:bg-white  border border-slate-300 dark:border-white/20 text-[#0F172A] dark:text-white font-black text-sm uppercase tracking-widest rounded-full shadow-lg transition-all transform hover:scale-105 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 group dark:bg-slate-800"
                        >
                            <UserCircleIcon className="w-5 h-5 text-primary" />
                            <span>Open an Account</span>
                        </button>
                    </div>
                </div>

                <div className="md:w-1/2 max-w-sm w-full space-y-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    {[
                        { icon: <GlobeAmericasIcon className="w-8 h-8 primary-"/>, title: "Global Access", desc: "Instantly transact in 150+ currencies." },
                        { icon: <ShieldCheckIcon className="w-8 h-8 text-emerald-400"/>, title: "Ironclad Security", desc: "Military-grade encryption & AI fraud detection." },
                        { icon: <TrendingUpIcon className="w-8 h-8 text-purple-400"/>, title: "AI-Powered Insights", desc: "Optimize your portfolio with machine learning." }
                    ].map((item, index) => (
                        <div 
                            key={index} 
                            className="bg-slate-50 dark:bg-slate-900  border border-slate-200 dark:border-white/10 rounded-3xl p-6 flex items-center gap-6 hover:border-slate-200 dark:border-white/30 hover:bg-white transition-all duration-300 cursor-default shadow-xl group hover:-translate-y-1"
                        >
                            <div className="p-4 bg-black rounded-2xl border border-slate-100 dark:border-white/5 group-hover:scale-110 transition-transform">
                                {item.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-[#0F172A] dark:text-white text-lg tracking-tight">{item.title}</h3>
                                <p className="text-[#0F172A] dark:text-white text-sm leading-snug mt-1 font-bold">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <MarketTicker />
        </div>
    );
};
