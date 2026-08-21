import React, { useState, useEffect } from 'react';
import { SpinnerIcon, CheckCircleIcon, ReCaptchaIcon } from './Icons';

interface ReCaptchaProps {
    onVerified: () => void;
}

export const ReCaptcha: React.FC<ReCaptchaProps> = ({ onVerified }) => {
    const [status, setStatus] = useState<'unchecked' | 'checking' | 'checked'>('unchecked');

    const handleCheck = () => {
        if (status === 'unchecked') {
            setStatus('checking');
            setTimeout(() => {
                setStatus('checked');
            }, 1500); // Simulate verification delay
        }
    };

    useEffect(() => {
        if (status === 'checked') {
            setTimeout(() => {
                onVerified();
            }, 500); // Short delay after checkmark appears
        }
    }, [status, onVerified]);

    const renderCheckbox = () => {
        switch (status) {
            case 'unchecked':
                return <div className="w-6 h-6 border-2 border-slate-400 rounded-sm cursor-pointer"></div>;
            case 'checking':
                return <SpinnerIcon className="w-6 h-6 text-primary" />;
            case 'checked':
                return <CheckCircleIcon className="w-7 h-7 text-green-500" />;
        }
    };

    return (
        <div className="bg-slate-200 p-3 rounded-md border border-slate-300 shadow-md my-4 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button onClick={handleCheck} className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-inner dark:bg-slate-800">
                        {renderCheckbox()}
                    </button>
                    <span className="font-semibold text-[#0F172A]">I'm not a robot</span>
                </div>
                <div className="text-center">
                    <ReCaptchaIcon className="w-10 h-10" />
                    <p className="text-[10px] text-[#0F172A] -mt-1">reCAPTCHA</p>
                    <p className="text-[8px] text-[#0F172A] dark:text-white">Privacy - Terms</p>
                </div>
            </div>
        </div>
    );
};
