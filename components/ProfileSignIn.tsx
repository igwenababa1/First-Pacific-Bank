
import React from 'react';
import { UserProfile } from '../types';
import { PremiumReservedBankLogo, MapPinIcon, ClockIcon, LockClosedIcon } from './Icons';
import { timeSince } from '../utils/time';
import { BackgroundManager } from './BackgroundManager';

interface ProfileSignInProps {
  user: UserProfile;
  onEnterDashboard: () => void;
}

export const ProfileSignIn: React.FC<ProfileSignInProps> = ({ user, onEnterDashboard }) => {
  // Ensure date is a Date object, handling potential string input from JSON
  const lastLoginDate = new Date(user.lastLogin.date);

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden font-sans text-white">
      <BackgroundManager section="Auth" overlayType="medium" />

      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-900/40 to-slate-950/80 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl animate-fade-in-up">
        <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-slate-950/80 rounded-full shadow-lg mb-6 border border-white/10">
                <PremiumReservedBankLogo className="w-12 h-12" />
            </div>
            
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                <img 
                    src={user.profilePictureUrl} 
                    alt={user.name} 
                    className="w-24 h-24 rounded-full border-4 border-slate-200 dark:border-slate-700 shadow-2xl relative z-10 object-cover"
                />
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-slate-200 dark:border-slate-800 rounded-full z-20"></div>
            </div>

            <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-1">Welcome back, {user.name.split(' ')[0]}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">{user.email}</p>

            <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200/50 dark:border-white/5 mb-8 flex justify-between items-center text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4 text-primary" />
                    <span>{user.lastLogin.from}</span>
                </div>
                <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-primary" />
                    <span>{timeSince(lastLoginDate)}</span>
                </div>
            </div>

            <button 
                onClick={onEnterDashboard}
                className="w-full py-4 bg-primary hover:bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
                <LockClosedIcon className="w-5 h-5" />
                <span>Enter Dashboard</span>
            </button>
            
            <p className="mt-6 text-xs text-slate-400">
                Secure Session ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}
            </p>
        </div>
      </div>
    </div>
  );
};
