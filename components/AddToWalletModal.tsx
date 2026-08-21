
import React, { useState, useEffect } from 'react';
import { Card } from '../types';
import { 
    XIcon, 
    AppleWalletIcon, 
    GooglePlayIcon, 
    CheckCircleIcon, 
    SpinnerIcon, 
    ShieldCheckIcon,
    LockClosedIcon,
    ChevronRightIcon
} from './Icons';

interface AddToWalletModalProps {
    card: Card;
    onClose: () => void;
}

type Step = 'select_wallet' | 'terms' | 'verifying' | 'success';

export const AddToWalletModal: React.FC<AddToWalletModalProps> = ({ card, onClose }) => {
    const [step, setStep] = useState<Step>('select_wallet');
    const [selectedWallet, setSelectedWallet] = useState<'Apple' | 'Google'>('Apple');

    useEffect(() => {
        if (step === 'verifying') {
            const timer = setTimeout(() => {
                setStep('success');
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [step]);

    const handleSelect = (wallet: 'Apple' | 'Google') => {
        setSelectedWallet(wallet);
        setStep('terms');
    };

    const handleAcceptTerms = () => {
        setStep('verifying');
    };

    return (
        <div className="fixed inset-0 bg-slate-100  z-[80] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative animate-fade-in-up border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-4 flex justify-between items-center border-b border-slate-100 dark:border-white/10">
                    <h3 className="font-bold text-[#0F172A] dark:text-white">Add to Wallet</h3>
                    <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full hover:bg-slate-200 dark:hover:bg-slate-100 dark:bg-slate-700 transition-colors">
                        <XIcon className="w-5 h-5 text-[#0F172A] dark:text-white" />
                    </button>
                </div>

                <div className="p-6 flex-grow flex flex-col items-center justify-center min-h-[300px]">
                    {step === 'select_wallet' && (
                        <div className="w-full space-y-4">
                            <div className="text-center mb-6">
                                <p className="text-sm text-[#0F172A] dark:text-white">Select a digital wallet to add your card ending in <span className="font-mono font-bold text-[#0F172A] dark:text-white">{card.lastFour}</span>.</p>
                            </div>
                            
                            <button onClick={() => handleSelect('Apple')} className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl group transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-[#0F172A] dark:text-white shadow-lg">
                                        <AppleWalletIcon className="w-7 h-7" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-[#0F172A] dark:text-white">Apple Wallet</p>
                                        <p className="text-xs text-[#0F172A]">iPhone, Watch, Mac</p>
                                    </div>
                                </div>
                                <ChevronRightIcon className="w-5 h-5 text-[#0F172A] dark:text-white group-hover:text-primary transition-colors" />
                            </button>

                            <button onClick={() => handleSelect('Google')} className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl group transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-[#0F172A] shadow-lg dark:bg-slate-800">
                                        <GooglePlayIcon className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-[#0F172A] dark:text-white">Google Pay</p>
                                        <p className="text-xs text-[#0F172A]">Android, Chrome</p>
                                    </div>
                                </div>
                                <ChevronRightIcon className="w-5 h-5 text-[#0F172A] dark:text-white group-hover:text-primary transition-colors" />
                            </button>
                        </div>
                    )}

                    {step === 'terms' && (
                        <div className="w-full flex flex-col h-full">
                            <div className="flex items-center justify-center mb-6">
                                <ShieldCheckIcon className="w-12 h-12 text-primary" />
                            </div>
                            <h4 className="text-lg font-bold text-center text-[#0F172A] dark:text-white mb-2">Terms & Conditions</h4>
                            <div className="flex-grow bg-slate-50 dark:bg-slate-900 rounded-xl p-4 mb-6 border border-slate-200 dark:border-white/10 overflow-y-auto max-h-40 text-xs text-[#0F172A] dark:text-white leading-relaxed">
                                <p className="mb-2"><strong>1. Digital Wallet Agreement.</strong> By adding your Premium Reserved Bank card to {selectedWallet} Wallet, you agree to the Digital Wallet Terms of Use.</p>
                                <p className="mb-2"><strong>2. Security.</strong> You are responsible for maintaining the security of your device and authentication credentials (passcode, biometrics).</p>
                                <p><strong>3. Data Privacy.</strong> Premium Reserved Bank shares limited transaction data with {selectedWallet} to enable transaction history display on your device.</p>
                            </div>
                            <button onClick={handleAcceptTerms} className="w-full py-3.5 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white rounded-xl font-bold shadow-lg transition-all">
                                Agree & Continue
                            </button>
                        </div>
                    )}

                    {step === 'verifying' && (
                        <div className="text-center space-y-6">
                            <div className="relative w-24 h-24 mx-auto">
                                <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-300 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <LockClosedIcon className="w-8 h-8 text-primary" />
                                </div>
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-[#0F172A] dark:text-white">Contacting Issuer...</h4>
                                <p className="text-sm text-[#0F172A] mt-1">Verifying card details with Premium Reserved Bank.</p>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center space-y-6 animate-fade-in-up">
                            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/30">
                                <CheckCircleIcon className="w-10 h-10 text-[#0F172A] dark:text-white" />
                            </div>
                            <div>
                                <h4 className="text-2xl font-bold text-[#0F172A] dark:text-white">Added to {selectedWallet}</h4>
                                <p className="text-sm text-[#0F172A] mt-2">Your card is ready for use in stores and online.</p>
                            </div>
                             {selectedWallet === 'Apple' ? (
                                <div className="p-4 bg-slate-100 rounded-2xl flex items-center justify-center gap-3 text-[#0F172A] dark:text-white shadow-xl transform hover:scale-105 transition-transform cursor-default">
                                    <AppleWalletIcon className="w-8 h-8" />
                                    <div className="text-left">
                                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Default Card</p>
                                        <p className="text-sm font-bold">•••• {card.lastFour}</p>
                                    </div>
                                </div>
                             ) : (
                                <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-[#0F172A] shadow-xl transform hover:scale-105 transition-transform cursor-default dark:bg-slate-800">
                                     <GooglePlayIcon className="w-8 h-8" />
                                     <div className="text-left">
                                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">NFC Ready</p>
                                        <p className="text-sm font-bold">•••• {card.lastFour}</p>
                                    </div>
                                </div>
                             )}
                             <button onClick={onClose} className="w-full py-3.5 bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 text-[#0F172A] dark:text-white dark:text-white rounded-xl font-bold shadow-md hover:opacity-90 transition-opacity">
                                Done
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
