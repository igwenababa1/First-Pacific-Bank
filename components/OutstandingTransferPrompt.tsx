import React from "react";
import { AlertTriangleIcon, XIcon, ArrowRightIcon } from "./Icons";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onResume: () => void;
  onCancel: () => void;
}

export const OutstandingTransferPrompt: React.FC<Props> = ({
  onResume,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className="fixed bottom-24 sm:bottom-8 right-4 sm:right-8 z-[100] max-w-sm w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden "
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-amber-300"></div>
        <div className="p-5 sm:p-6 relative">
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-[#0F172A] hover:text-white transition-colors bg-white rounded-full p-1 dark:bg-slate-800"
          >
            <XIcon className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/30">
              <AlertTriangleIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base mb-1">
                Outstanding Transfer
              </h3>
              <p className="text-[#0F172A] text-xs leading-relaxed">
                You have an incomplete payment pending. Would you like to resume
                and finalize this transaction?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-[#0F172A] bg-white hover:bg-white transition-colors border border-black/5 dark:bg-slate-800"
            >
              Cancel Draft
            </button>
            <button
              onClick={onResume}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-[#0F172A] bg-amber-400 hover:bg-amber-500 transition-colors flex items-center justify-center gap-2"
            >
              Resume <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
