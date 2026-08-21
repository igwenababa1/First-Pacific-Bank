
import React from 'react';
import { ExclamationTriangleIcon } from './Icons';

interface DeleteConfirmationModalProps {
  onClose: () => void;
  onConfirm: () => void;
  taskText?: string;
  title?: string;
  message?: string;
  itemText?: string;
  itemTypeLabel?: string;
  confirmButtonText?: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  onClose,
  onConfirm,
  taskText,
  title = "Confirm Deletion",
  message = "Are you sure you want to permanently delete this item?",
  itemText,
  itemTypeLabel = "Item to be deleted:",
  confirmButtonText = "Delete"
}) => {
  const displayItemText = itemText || taskText || "";
  const displayMessage = taskText ? "Are you sure you want to permanently delete this task?" : message;
  const displayTypeLabel = taskText ? "Task to be deleted:" : itemTypeLabel;
  const displayConfirmButtonText = taskText ? "Delete Task" : confirmButtonText;

  return (
    <div className="fixed inset-0 bg-slate-100  flex items-center justify-center z-50 p-4 animate-fade-in text-[#0F172A] dark:text-white">
      <div className="bg-slate-200 dark:bg-slate-900 rounded-[2rem] border border-slate-300 dark:border-white/10 shadow-2xl p-8 w-full max-w-md m-4 relative animate-fade-in-up">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-500 dark:bg-rose-500 text-rose-500 rounded-full mb-4 shadow-inner">
            <ExclamationTriangleIcon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">{title}</h2>
          <p className="text-[#0F172A] dark:text-white my-4 text-sm font-semibold">
            {displayMessage}
          </p>
          {displayItemText && (
            <div className="font-mono text-xs text-left bg-slate-300 dark:bg-slate-800 border border-slate-300/60 dark:border-white/10 p-4 rounded-2xl shadow-inner break-all">
              <p className="text-[10px] font-black text-[#0F172A] dark:text-white dark:text-white uppercase tracking-widest mb-1.5">{displayTypeLabel}</p>
              <p className="text-sm font-extrabold text-[#1E293B] dark:text-slate-100">"{displayItemText}"</p>
            </div>
          )}
          <p className="text-[#0F172A] dark:text-white mt-4 text-xs font-semibold uppercase tracking-wider">
            This action is final and cannot be undone.
          </p>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row-reverse gap-3">
          <button
            onClick={onConfirm}
            className="w-full sm:w-auto flex-1 py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-widest text-[#0F172A] dark:text-white bg-rose-600 hover:bg-rose-700 hover:scale-[1.02] active:scale-95 shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
          >
            {displayConfirmButtonText}
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto flex-1 py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-widest text-[#0F172A] dark:text-white bg-slate-300 dark:bg-slate-850 hover:bg-slate-300 dark:hover:bg-white dark:bg-slate-900 hover:scale-[1.02] active:scale-95 shadow-md active:shadow-inner transition-all cursor-pointer"
          >
            Cancel
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
