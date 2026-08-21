
import React, { useState, useEffect } from 'react';
// FIX: Replaced missing icon with correct one
import { PremiumReservedBankLogo, CheckCircleIcon } from './Icons';

const loadingMessages = [
    "Establishing Secure Connection...",
    "Encrypting Data Packets...",
    "Verifying Device Integrity...",
    "Authenticating User Credentials...",
    "Loading User Profile & Settings...",
    "Syncing Account Data...",
    "Finalizing Secure Session..."
];

interface OpeningSequenceProps {
  onComplete: () => void;
}

export const OpeningSequence: React.FC<OpeningSequenceProps> = ({ onComplete }) => {
    const [phase, setPhase] = useState<'loading' | 'success'>('loading');
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const totalDuration = 1000; // Significantly reduced from 2500ms
        // Cycle through messages
        const messageInterval = setInterval(() => {
            setMessageIndex(prev => {
                if (prev >= loadingMessages.length - 1) {
                    clearInterval(messageInterval);
                    return prev;
                }
                return prev + 1;
            });
        }, totalDuration / loadingMessages.length);

        // Main timer to trigger the success animation
        const successTimer = setTimeout(() => {
            clearInterval(messageInterval);
            setPhase('success');
        }, totalDuration);

        return () => {
            clearInterval(messageInterval);
            clearTimeout(successTimer);
        };
    }, []);

    useEffect(() => {
        if (phase === 'success') {
            const completeTimer = setTimeout(() => {
                onComplete();
            }, 300); // Reduced from 800ms
            return () => clearTimeout(completeTimer);
        }
    }, [phase, onComplete]);

    return (
        <div className="fixed inset-0 bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-[#0F172A] dark:text-white z-[100] overflow-hidden">
            <div className="w-80 h-80" style={{ perspective: '1200px' }}>
                <div 
                    className="relative w-full h-full transition-transform duration-[800ms] ease-in-out" 
                    style={{ transformStyle: 'preserve-3d', transform: phase === 'success' ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                >
                    {/* Front side: Loading animation */}
                    <div className="absolute w-full h-full flex flex-col items-center justify-center text-center p-4" style={{ backfaceVisibility: 'hidden' }}>
                        <div className="relative w-32 h-32">
                            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-primary/50 rounded-full animate-spin [animation-duration:2s]"></div>
                            <div className="absolute inset-4 flex items-center justify-center">
                                <PremiumReservedBankLogo />
                            </div>
                        </div>
                        <p className="mt-6 font-semibold transition-opacity duration-300" key={messageIndex}>
                            {loadingMessages[messageIndex]}
                        </p>
                    </div>

                    {/* Back side: Success animation */}
                    <div className="absolute w-full h-full flex flex-col items-center justify-center text-center p-4 bg-slate-100 dark:bg-slate-700 rounded-2xl" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <CheckCircleIcon className="w-24 h-24 text-green-400" />
                        <h2 className="mt-4 text-2xl font-bold">Secure Session Established</h2>
                    </div>
                </div>
            </div>
        </div>
    );
};
