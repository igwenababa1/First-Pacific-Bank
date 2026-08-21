
import React from 'react';
import { UserProfile } from '../types';
import { PremiumReservedBankLogo } from './Icons';
import { BackgroundManager } from './BackgroundManager';

interface LoggedOutProps {
  user: UserProfile;
  onLogin: () => void;
  onSwitchUser: () => void;
}

export const LoggedOut: React.FC<LoggedOutProps> = ({ user, onLogin, onSwitchUser }) => {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <BackgroundManager section="Auth" overlayType="medium" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="inline-block p-3 rounded-2xl bg-white/10 dark:bg-slate-800/80 backdrop-blur-xl border border-white/10 shadow-2xl">
            <PremiumReservedBankLogo className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-white mt-3 drop-shadow">First Pacific Bank</h1>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 text-center animate-fade-in-up">
          <img
            src={user.profilePictureUrl}
            alt="Profile"
            className="w-24 h-24 rounded-full mx-auto mb-4 shadow-md border-2 border-primary/40 object-cover"
          />
          <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">{user.name}</h2>
          
          <button
            onClick={onLogin}
            className="w-full mt-6 py-3 text-white bg-primary-500 hover:bg-primary-600 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all transform active:scale-95"
          >
            Sign In as {user.name.split(' ')[0]}
          </button>
          
          <div className="mt-4 text-center text-sm">
            <button onClick={onSwitchUser} className="font-bold text-primary-500 hover:underline">
                Not you? Sign in with a different account.
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
