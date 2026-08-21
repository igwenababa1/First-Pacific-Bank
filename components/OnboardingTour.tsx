
import React, { useState } from 'react';
import { 
    ArrowRightIcon, 
    GlobeAmericasIcon, 
    ShieldCheckIcon, 
    SparklesIcon, 
    PremiumReservedBankLogo, 
    XIcon 
} from './Icons';

interface OnboardingTourProps {
    onComplete: () => void;
}

const slides = [
    {
        id: 'welcome',
        icon: <PremiumReservedBankLogo className="w-16 h-16" />,
        title: "Welcome to Premium Reserved",
        description: "You have successfully unlocked access to the world's most advanced digital banking platform. Your financial journey begins now.",
        color: "text-[#0F172A] dark:text-white"
    },
    {
        id: 'global',
        icon: <GlobeAmericasIcon className="w-16 h-16 primary-" />,
        title: "Borderless Finance",
        description: "Send money instantly to over 190 countries. Our global settlement network ensures your funds arrive safely and swiftly, anywhere on Earth.",
        color: "primary-"
    },
    {
        id: 'security',
        icon: <ShieldCheckIcon className="w-16 h-16 text-emerald-400" />,
        title: "Fortress-Level Security",
        description: "Your assets are protected by military-grade encryption, biometric authentication, and real-time fraud monitoring via our AI Sentinel.",
        color: "text-emerald-400"
    },
    {
        id: 'ai',
        icon: <SparklesIcon className="w-16 h-16 text-purple-400" />,
        title: "Intelligent Insights",
        description: "Leverage our AI Financial Advisor to analyze spending patterns, optimize investments, and forecast your wealth growth.",
        color: "text-purple-400"
    }
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isExiting, setIsExiting] = useState(false);

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        setIsExiting(true);
        setTimeout(onComplete, 500); // Allow exit animation to play
    };

    const slide = slides[currentSlide];

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-800  transition-opacity duration-500 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
            <div className="relative w-full max-w-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[500px] animate-fade-in-up">
                
                {/* Background Decor */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl transition-all duration-700 transform ${currentSlide % 2 === 0 ? 'translate-x-10 -translate-y-10' : '-translate-x-10 translate-y-10'}`}></div>
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>

                {/* Skip Button */}
                <button 
                    onClick={handleComplete} 
                    className="absolute top-6 right-6 text-[#0F172A] hover:text-[#0F172A] dark:text-white transition-colors z-20 text-sm font-bold uppercase tracking-wider"
                >
                    Skip
                </button>

                {/* Content Area */}
                <div className="flex-grow flex flex-col items-center justify-center p-8 text-center relative z-10">
                    <div className={`mb-8 p-6 rounded-full bg-white dark:bg-slate-900 ring-1 ring-white/10 shadow-xl transition-all duration-500 transform ${isExiting ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}`}>
                        {slide.icon}
                    </div>
                    
                    <h2 className="text-3xl font-bold text-[#0F172A] dark:text-white mb-4 tracking-tight transition-all duration-300">
                        {slide.title}
                    </h2>
                    
                    <p className="text-[#0F172A] dark:text-white text-lg leading-relaxed max-w-sm mx-auto transition-all duration-300">
                        {slide.description}
                    </p>
                </div>

                {/* Footer Controls */}
                <div className="p-8 pt-0 flex flex-col gap-6 relative z-10">
                    {/* Pagination Dots */}
                    <div className="flex justify-center gap-2">
                        {slides.map((_, index) => (
                            <div 
                                key={index} 
                                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide ? `w-8 ${slide.color.replace('text-', 'bg-')}` : 'w-2 bg-slate-100 dark:bg-slate-700'}`}
                            />
                        ))}
                    </div>

                    {/* Action Button */}
                    <button 
                        onClick={handleNext}
                        className="w-full py-4 bg-white text-[#0F172A] rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-slate-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 dark:bg-slate-800"
                    >
                        <span>{currentSlide === slides.length - 1 ? "Get Started" : "Next"}</span>
                        <ArrowRightIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};