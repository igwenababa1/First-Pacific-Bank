import React from 'react';
import { LogoutIcon } from './Icons.tsx';

interface LogoutConfirmationModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutConfirmationModal: React.FC<LogoutConfirmationModalProps> = ({ onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-slate-100 bg-opacity-60 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-slate-200 rounded-2xl shadow-digital p-8 w-full max-w-sm m-4 relative transform transition-all duration-300 scale-100 animate-fade-in-up">
        <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4 shadow-digital-inset">
                <LogoutIcon className="w-8 h-8 text-[#0F172A]"/>
            </div>
            <h2 className="text-2xl font-bold text-[#1E293B]">Secure Logout</h2>
            <p className="text-[#0F172A] my-4">
                You are about to securely terminate your session. For your protection, all session data will be cleared and you will be required to re-authenticate on your next visit.
            </p>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
            <button 
                onClick={onConfirm}
                className="w-full sm:w-auto flex-1 py-3 px-4 rounded-lg text-sm font-bold text-[#0F172A] dark:text-white bg-red-600 hover:bg-red-700 shadow-md hover:shadow-lg transition-shadow"
            >
                Confirm Logout
            </button>
            <button 
                onClick={onClose}
                className="w-full sm:w-auto flex-1 py-3 px-4 rounded-lg text-sm font-bold text-[#0F172A] bg-slate-200 shadow-digital active:shadow-digital-inset transition-shadow"
            >
                Cancel
            </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};