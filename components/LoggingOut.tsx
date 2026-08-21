
import React, { useState, useEffect } from 'react';
import { ShieldCheckIcon, PremiumReservedBankLogo } from './Icons';

interface LoggingOutProps {
    onComplete: () => void;
}

const steps = [
    {
        icon: <ShieldCheckIcon className="w-10 h-10 text-[#0F172A] dark:text-white" />,
        title: "Securely logging you out...",
        message: "Clearing session data and terminating your connection.",
        duration: 1500, // Reduced from 2500
    },
    {
        icon: <PremiumReservedBankLogo className="w-10 h-10" />,
        title: "Thank you for banking with First Pacific Bank.",
        message: "Your trust is our most valuable asset.",
        duration: 1000, // Reduced from 1500
    }
];

export const LoggingOut: React.FC<LoggingOutProps> = ({ onComplete }) => {
    const [stepIndex, setStepIndex] = useState(0);

    useEffect(() => {
        if (stepIndex >= steps.length - 1) {
            const timer = setTimeout(() => {
                onComplete();
            }, steps[stepIndex].duration);
            return () => clearTimeout(timer);
        }

        const timer = setTimeout(() => {
            setStepIndex(prev => prev + 1);
        }, steps[stepIndex].duration);

        return () => clearTimeout(timer);
    }, [stepIndex, onComplete]);

    const currentStep = steps[stepIndex];

    return (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center text-[#0F172A] dark:text-white z-[100] animate-fade-in">
            <div className="text-center transition-opacity duration-500" key={stepIndex}>
                <div className="inline-block p-4 rounded-full bg-white dark:bg-slate-800 mb-6 shadow-lg">
                    {currentStep.icon}
                </div>
                <h2 className="text-2xl font-bold text-slate-100">{currentStep.title}</h2>
                <p className="text-[#0F172A] dark:text-white mt-2">{currentStep.message}</p>
            </div>
             <style>{`
                @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
};
