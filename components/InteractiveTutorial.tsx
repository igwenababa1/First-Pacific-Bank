import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, X, HelpCircle, BrainCircuit, ShieldCheck, Milestone, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TourStep {
    id: string;
    targetId: string;
    title: string;
    description: string;
    highlightText: string;
    position: 'bottom' | 'top' | 'left' | 'right' | 'center';
}

export const InteractiveTutorial: React.FC = () => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [hasSeenTour, setHasSeenTour] = useState<boolean>(false);

    useEffect(() => {
        const seen = localStorage.getItem('fpb_seen_onboarding_tour');
        if (!seen) {
            // Auto trigger on first visit with a short delay
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 1500);
            return () => clearTimeout(timer);
        } else {
            setHasSeenTour(true);
        }
    }, []);

    const steps: TourStep[] = [
        {
            id: 'welcome',
            targetId: 'root',
            title: 'Welcome to First Pacific Bank',
            description: 'Experience our private wealth and sovereign clearing ledger. This interactive live tour will walk you through our core capabilities, including real-time transfers, AI spending optimization, and official statements.',
            highlightText: 'Sovereign Account Center',
            position: 'center'
        },
        {
            id: 'transfer',
            targetId: 'quick-transfer-container',
            title: 'Step 1: Real-time Instant Transfers',
            description: 'This is the Quick Transfer terminal. It is fully functional! To send funds: select a recipient, enter an amount (e.g., $150), and click Send. The platform will automatically execute compliance audits and real-time ledger settlement.',
            highlightText: 'Interactive Clearing Node',
            position: 'top'
        },
        {
            id: 'ai-spending',
            targetId: 'spending-analytics-widget',
            title: 'Step 2: AI Budget & D3 Visualizations',
            description: 'Our system analyzes your spending. Click the "AI Budget" tab inside this card to query our Gemini intelligence model. It suggests custom allocations and visualizes your targets using a D3.js powered donut chart!',
            highlightText: 'Gemini Wealth Strategic Allocations',
            position: 'top'
        },
        {
            id: 'export-statement',
            targetId: 'transmission-ledger-container',
            title: 'Step 3: Official Certified PDF Statements',
            description: 'Scroll down to the Ledger and click "Export PDF" to instantly download an enterprise-grade official account statement. It is dynamically generated with official headers, auditing summaries, a diagonal secure watermark, and a vector bank seal.',
            highlightText: 'Certified Audit Downloads',
            position: 'bottom'
        }
    ];

    const handleStartTour = () => {
        setIsOpen(true);
        setCurrentStep(0);
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
            scrollToTarget(steps[nextStep].targetId);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            const prevStep = currentStep - 1;
            setCurrentStep(prevStep);
            scrollToTarget(steps[prevStep].targetId);
        }
    };

    const handleComplete = () => {
        setIsOpen(false);
        localStorage.setItem('fpb_seen_onboarding_tour', 'true');
        setHasSeenTour(true);
    };

    const scrollToTarget = (id: string) => {
        if (id === 'root') return;
        setTimeout(() => {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Add a temporary subtle glow to the element
                element.classList.add('ring-4', 'ring-amber-500/50', 'transition-all', 'duration-500');
                setTimeout(() => {
                    element.classList.remove('ring-4', 'ring-amber-500/50');
                }, 3000);
            }
        }, 100);
    };

    const activeStep = steps[currentStep];

    return (
        <>
            {/* Float Quick Launcher Tooltip */}
            <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
                <button
                    onClick={handleStartTour}
                    className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-full text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95 cursor-pointer border border-amber-400/25 group"
                    title="Launch Guided Interactive Tour"
                >
                    <Sparkles className="w-4 h-4 text-slate-950 animate-pulse group-hover:rotate-12 transition-transform" />
                    <span>Interactive Guide</span>
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] bg-slate-100  flex items-center justify-center p-4">
                        {/* Highlighting Overlay Glow Effect for targeted IDs */}
                        {activeStep.targetId !== 'root' && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                <div className="absolute inset-0 bg-slate-100" />
                                {/* Cutout or spotlight effect can be styled dynamically, but a gorgeous centralized modal is standard and completely robust across resizing */}
                            </div>
                        )}

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-[#0a101d] border border-amber-500/20 rounded-[2.5rem] shadow-2xl overflow-hidden p-8 text-left z-50 flex flex-col space-y-6"
                        >
                            {/* Ambient golden background spots */}
                            <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-blue-500 rounded-full blur-3xl pointer-events-none" />

                            {/* Header */}
                            <div className="flex justify-between items-start relative z-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500 border border-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-[0.2em]">
                                    <Milestone className="w-3.5 h-3.5" />
                                    <span>Interactive Walkthrough</span>
                                </div>
                                <button
                                    onClick={handleComplete}
                                    className="p-1 rounded-xl text-[#0F172A] hover:text-white hover:bg-white transition-all cursor-pointer dark:bg-slate-800"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="space-y-4 relative z-10">
                                <h3 className="text-2xl font-black text-white tracking-tight uppercase">
                                    {activeStep.title}
                                </h3>

                                {activeStep.targetId !== 'root' && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-black/5 font-mono text-[9px] font-bold text-[#0F172A] uppercase tracking-widest dark:bg-slate-900">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                        <span>Target View: {activeStep.highlightText}</span>
                                    </div>
                                )}

                                <p className="text-sm font-bold text-[#0F172A] leading-relaxed uppercase tracking-wider">
                                    {activeStep.description}
                                </p>
                            </div>

                            {/* Progress bar */}
                            <div className="relative h-1 w-full bg-slate-50 rounded-full overflow-hidden dark:bg-slate-900">
                                <div 
                                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all duration-300"
                                    style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                                />
                            </div>

                            {/* Footer navigation */}
                            <div className="flex items-center justify-between relative z-10">
                                <div className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest font-mono">
                                    Step {currentStep + 1} of {steps.length}
                                </div>

                                <div className="flex items-center gap-3">
                                    {currentStep > 0 && (
                                        <button
                                            onClick={handleBack}
                                            className="px-4 py-2 bg-slate-50 hover:bg-white text-[#0F172A] text-[10px] font-black uppercase tracking-widest rounded-xl border border-black/5 flex items-center gap-1 active:scale-95 transition-all cursor-pointer dark:bg-slate-800"
                                        >
                                            <ArrowLeft className="w-3.5 h-3.5" /> Back
                                        </button>
                                    )}

                                    <button
                                        onClick={handleNext}
                                        className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/5 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                                    >
                                        <span>{currentStep === steps.length - 1 ? 'Unlock Terminal' : 'Next Step'}</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};
