
import React, { useState, useEffect } from 'react';
import { SpinnerIcon, CheckCircleIcon, ShieldCheckIcon, GlobeAltIcon, BankIcon, DocumentCheckIcon } from './Icons';

interface AccountProvisioningAnimationProps {
    onComplete: () => void;
}

const provisioningSteps = [
    { text: 'Submitting Encrypted Application', icon: <DocumentCheckIcon className="w-6 h-6" /> },
    { text: 'Running Automated KYC/AML Checks', icon: <ShieldCheckIcon className="w-6 h-6" /> },
    { text: 'Provisioning IBAN & Account Number', icon: <BankIcon className="w-6 h-6" /> },
    { text: 'Activating Global Transfer Network', icon: <GlobeAltIcon className="w-6 h-6" /> },
    { text: 'Account Created Successfully!', icon: <CheckCircleIcon className="w-6 h-6 text-green-500" /> }
];

export const AccountProvisioningAnimation: React.FC<AccountProvisioningAnimationProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const processNextStep = () => {
            if (currentStep < provisioningSteps.length - 1) {
                const delay = currentStep === 1 ? 2000 : 1000; // Longer delay for "compliance checks"
                setTimeout(() => {
                    setCurrentStep(prev => prev + 1);
                }, delay);
            } else {
                setTimeout(onComplete, 1500); // Wait a bit on the final success message
            }
        };

        processNextStep();
    }, [currentStep, onComplete]);

    return (
        <div className="fixed inset-0 bg-slate-100 bg-opacity-70 flex items-center justify-center z-[100] overflow-hidden">
            <div className="bg-slate-200 rounded-2xl shadow-digital p-8 w-full max-w-md m-4">
                <h2 className="text-2xl font-bold text-[#1E293B] text-center mb-6">Creating Your Secure Account</h2>
                <div className="space-y-4">
                    {provisioningSteps.map((step, index) => (
                        <div key={index} className="flex items-center space-x-4 p-3 bg-slate-200 rounded-lg shadow-digital-inset transition-opacity duration-500" style={{ opacity: index <= currentStep ? 1 : 0.4 }}>
                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 shadow-digital">
                                {index < currentStep ? <CheckCircleIcon className="w-6 h-6 text-green-500" /> : index === currentStep ? <SpinnerIcon className="w-6 h-6 text-primary" /> : step.icon}
                            </div>
                            <p className="font-semibold text-[#0F172A]">{step.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
