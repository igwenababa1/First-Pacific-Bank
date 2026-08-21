
import React from 'react';
import { EnvelopeIcon, PremiumReservedBankLogo, ArrowRightIcon } from './Icons';

interface VerificationScreenProps {
  email: string;
  onGoToLogin: () => void;
}

export const VerificationScreen: React.FC<VerificationScreenProps> = ({ email, onGoToLogin }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
      
      <div className="relative z-10 w-full max-w-md bg-slate-50 dark:bg-slate-900  border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl animate-fade-in-up text-center">
        
        <div className="inline-flex p-4 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 mb-6 shadow-lg">
           <PremiumReservedBankLogo className="w-12 h-12" />
        </div>

        <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                <EnvelopeIcon className="w-10 h-10 text-primary" />
            </div>
        </div>

        <h2 className="text-2xl font-black text-[#0F172A] dark:text-white mb-4 tracking-tight">Verify Your Identity</h2>
        
        <p className="text-[#0F172A] dark:text-white text-sm leading-relaxed mb-6">
          Your account registered to <span className="font-bold text-[#0F172A] dark:text-white">{email}</span> is currently pending strict KYC validation.
        </p>
        
        <p className="text-[#0F172A] dark:text-white text-xs mb-8">
          To comply with international banking regulations, an administrator must manually review your registration dossier. You will receive an email once your vault access is approved.
        </p>

        <button 
          onClick={onGoToLogin}
          className="w-full py-4 bg-white text-[#0F172A] font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 group dark:bg-slate-800"
        >
          <span>Return to Login</span>
          <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
