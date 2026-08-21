
import React from 'react';
import { SavedSession } from '../types';
import { timeSince } from '../utils/time';
import { ArrowPathIcon, ArrowRightIcon } from './Icons';

interface ResumeSessionModalProps {
  session: SavedSession;
  onResume: () => void;
  onStartFresh: () => void;
}

export const ResumeSessionModal: React.FC<ResumeSessionModalProps> = ({ session, onResume, onStartFresh }) => {
  return (
    <div className="fixed inset-0 bg-slate-100 bg-opacity-60 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-900  rounded-2xl shadow-digital p-8 w-full max-w-md m-4 relative animate-fade-in-up border border-slate-200 dark:border-white/10">
        <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-100">Welcome Back!</h2>
            <p className="text-[#0F172A] dark:text-white my-4">
                Your last session was {timeSince(session.timestamp)}. You left off on the <span className="font-semibold text-primary-400 capitalize">{session.view}</span> page.
            </p>
            <p className="text-[#0F172A] dark:text-white my-4">
                Would you like to continue where you left off?
            </p>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
                onClick={onStartFresh}
                className="w-full sm:w-auto flex-1 py-3 px-4 rounded-lg text-sm font-bold text-[#0F172A] dark:text-[#1E293B] bg-slate-100 dark:bg-slate-700 hover:bg-slate-100 dark:bg-slate-700 shadow-digital active:shadow-digital-inset flex items-center justify-center space-x-2"
            >
                <ArrowPathIcon className="w-5 h-5" />
                <span>Start Fresh</span>
            </button>
            <button
                onClick={onResume}
                className="w-full sm:w-auto flex-1 py-3 px-4 rounded-lg text-sm font-bold text-[#0F172A] dark:text-white bg-primary-500 hover:bg-primary-600 shadow-md transition-shadow flex items-center justify-center space-x-2"
            >
                <span>Resume Session</span>
                <ArrowRightIcon className="w-5 h-5" />
            </button>
        </div>
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
