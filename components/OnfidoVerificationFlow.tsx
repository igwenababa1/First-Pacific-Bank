
import React, { useState, useEffect, useRef } from 'react';
import { VerificationLevel } from '../types';
import { SpinnerIcon, CheckCircleIcon, DocumentCheckIcon, CameraIcon, IdentificationIcon, ShieldCheckIcon, OnfidoIcon, XIcon, ArrowRightIcon } from './Icons';
import { db } from '../services/database';

interface OnfidoVerificationFlowProps {
  levelToAchieve: VerificationLevel;
  onClose: (finalLevel?: VerificationLevel) => void;
}

type OnfidoStep = 'intro' | 'documentSelect' | 'documentCapture' | 'selfie' | 'analyzing' | 'success';

const StepIndicator: React.FC<{ label: string, isDone: boolean, isActive: boolean }> = ({ label, isDone, isActive }) => (
    <div className="flex items-center">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${isDone ? 'bg-green-500 text-[#0F172A] dark:text-white' : isActive ? 'bg-primary text-[#0F172A] dark:text-white' : 'bg-slate-300 text-[#0F172A]'}`}>
            {isDone ? <CheckCircleIcon className="w-4 h-4" /> : '•'}
        </div>
        <span className={`ml-2 text-sm font-semibold ${isActive || isDone ? 'text-[#1E293B]' : 'text-[#0F172A] dark:text-white'}`}>{label}</span>
    </div>
);

// Helper to create a dummy image blob for simulation if no camera available
const createDummyBlob = (): Promise<string> => {
    return new Promise((resolve) => {
        // Create a 1x1 white pixel
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0,0,1,1);
            resolve(canvas.toDataURL('image/jpeg'));
        } else {
            resolve('');
        }
    });
};

export const OnfidoVerificationFlow: React.FC<OnfidoVerificationFlowProps> = ({ levelToAchieve, onClose }) => {
    const [step, setStep] = useState<OnfidoStep>('intro');
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const analysisSteps = ["Verifying document authenticity", "Checking for tampering", "Analyzing biometric data", "Cross-referencing data points", "Finalizing verification"];
    const [capturedData, setCapturedData] = useState<string>('');

    useEffect(() => {
        let interval: number;
        if (step === 'analyzing') {
            interval = window.setInterval(() => {
                setAnalysisProgress(prev => {
                    const next = prev + 20;
                    if (next >= 100) {
                        clearInterval(interval);
                        setTimeout(() => setStep('success'), 500);
                        return 100;
                    }
                    return next;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [step]);
    
    const handleCapture = async (nextStep: OnfidoStep) => {
        // Simulate capture by generating a dummy image
        const base64Image = await createDummyBlob();
        
        // Upload to Supabase 'documents' bucket
        // We use 'secure-docs' folder to keep it separate
        if (base64Image) {
            await db.uploadFile(base64Image, 'documents', 'identity-verification');
        }

        const tempStep = step;
        setStep('analyzing'); // Go to analyzing immediately after capture
        setTimeout(() => {
            setStep(nextStep);
            setAnalysisProgress(0); // Reset for final analysis
        }, 1500);
    };
    
    const renderContent = () => {
        const flowSteps = levelToAchieve === VerificationLevel.LEVEL_2 ? ['Document'] : ['Document', 'Selfie'];
        const currentFlowStepIndex = step === 'documentSelect' || step === 'documentCapture' ? 0 : 1;
        
        const mainContent = (() => {
            switch (step) {
                case 'intro':
                    return (
                        <div className="text-center">
                            <IdentificationIcon className="w-12 h-12 text-primary mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-[#1E293B]">Secure Identity Verification</h3>
                            <p className="text-sm text-[#0F172A] my-4">To unlock more features, we need to verify your identity. This is a secure process powered by Onfido and takes about 2 minutes.</p>
                            <button onClick={() => setStep('documentSelect')} className="w-full py-3 text-[#0F172A] dark:text-white bg-primary rounded-lg font-semibold shadow-md flex items-center justify-center space-x-2">
                                <span>Get Started</span>
                                <ArrowRightIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    );
                case 'documentSelect':
                     return (
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-[#1E293B]">Upload a photo of your ID</h3>
                             <p className="text-sm text-[#0F172A] my-4">Make sure it’s a valid, government-issued document.</p>
                             <div className="space-y-3">
                                <button onClick={() => setStep('documentCapture')} className="w-full text-left p-4 bg-slate-200 rounded-lg shadow-digital active:shadow-digital-inset font-semibold">Passport</button>
                                <button onClick={() => setStep('documentCapture')} className="w-full text-left p-4 bg-slate-200 rounded-lg shadow-digital active:shadow-digital-inset font-semibold">Driver's License</button>
                                <button onClick={() => setStep('documentCapture')} className="w-full text-left p-4 bg-slate-200 rounded-lg shadow-digital active:shadow-digital-inset font-semibold">Identity Card</button>
                             </div>
                        </div>
                    );
                case 'documentCapture':
                     return (
                        <div className="text-center">
                             <h3 className="text-xl font-bold text-[#1E293B]">Capture your document</h3>
                             <p className="text-sm text-[#0F172A] my-2">Place your ID inside the frame. Make sure it's clear and readable.</p>
                             <div className="relative w-full aspect-[4/3] bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center text-[#0F172A] dark:text-white overflow-hidden my-4">
                                <p>(Simulated Camera View)</p>
                                <div className="absolute inset-4 border-2 border-dashed border-slate-100 dark:border-white/50 rounded-md"></div>
                             </div>
                             <button onClick={() => handleCapture(levelToAchieve === VerificationLevel.LEVEL_2 ? 'analyzing' : 'selfie')} className="w-full py-3 text-[#0F172A] dark:text-white bg-primary rounded-lg font-semibold shadow-md flex items-center justify-center space-x-2">
                                <CameraIcon className="w-5 h-5" />
                                <span>Capture Photo</span>
                             </button>
                        </div>
                    );
                case 'selfie':
                     return (
                        <div className="text-center">
                             <h3 className="text-xl font-bold text-[#1E293B]">Take a selfie</h3>
                             <p className="text-sm text-[#0F172A] my-2">Position your face in the oval. This helps us confirm you're the person in your ID.</p>
                             <div className="relative w-full aspect-[4/3] bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center text-[#0F172A] dark:text-white overflow-hidden my-4">
                                <p>(Simulated Camera View)</p>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-4/5 h-5/6 border-2 border-dashed border-slate-100 dark:border-white/50 rounded-[50%]"></div>
                                </div>
                             </div>
                             <button onClick={() => handleCapture('analyzing')} className="w-full py-3 text-[#0F172A] dark:text-white bg-primary rounded-lg font-semibold shadow-md flex items-center justify-center space-x-2">
                                <CameraIcon className="w-5 h-5" />
                                <span>Capture Selfie</span>
                             </button>
                        </div>
                    );
                case 'analyzing':
                    return (
                        <div className="text-center">
                            <SpinnerIcon className="w-12 h-12 text-primary mx-auto mb-4 animate-spin"/>
                            <h3 className="text-xl font-bold text-[#1E293B]">Analyzing your data...</h3>
                            <p className="text-sm text-[#0F172A] my-4">{analysisSteps[Math.floor(analysisProgress / 20)] || 'Finalizing...'}</p>
                            <div className="w-full bg-slate-300 rounded-full h-2.5 shadow-inner">
                                <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${analysisProgress}%` }}></div>
                            </div>
                        </div>
                    );
                case 'success':
                     return (
                        <div className="text-center">
                            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto" />
                            <h3 className="mt-4 text-2xl font-bold text-[#1E293B]">Verification Successful!</h3>
                            <p className="text-[#0F172A] mt-2">You have successfully been verified to {levelToAchieve}.</p>
                            <button onClick={() => onClose(levelToAchieve)} className="w-full mt-6 py-3 text-[#0F172A] dark:text-white bg-primary rounded-lg font-semibold shadow-md">
                                Done
                            </button>
                        </div>
                    );
            }
        })();

        return (
            <>
                {step !== 'intro' && step !== 'success' && (
                     <div className="mb-6 flex justify-center space-x-4">
                        {flowSteps.map((label, index) => (
                           <StepIndicator key={label} label={label} isActive={currentFlowStepIndex === index && step !== 'analyzing'} isDone={currentFlowStepIndex > index} />
                        ))}
                    </div>
                )}
                {mainContent}
            </>
        )
    };
    
    return (
        <div className="fixed inset-0 bg-slate-100 bg-opacity-70  flex items-center justify-center z-[60] p-4 animate-fade-in">
            <div className="bg-slate-200 rounded-2xl shadow-digital p-6 w-full max-w-md relative animate-fade-in-up flex flex-col max-h-[90vh]">
                <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                    {renderContent()}
                </div>
                 <div className="mt-6 pt-4 border-t border-slate-300 flex items-center justify-between text-xs text-[#0F172A]">
                    <span>Powered by</span>
                    <a href="https://onfido.com" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 font-bold">
                        <OnfidoIcon className="w-4 h-4" />
                        <span>Onfido</span>
                    </a>
                </div>
                <button onClick={() => onClose()} className="absolute top-3 right-3 p-2 text-[#0F172A] dark:text-white hover:text-[#0F172A] rounded-full">
                    <XIcon className="w-5 h-5"/>
                </button>
            </div>
             <style>{`
                @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
                @keyframes fade-in-up {
                  0% { opacity: 0; transform: translateY(20px) scale(0.95); }
                  100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
              `}</style>
        </div>
    );
};
