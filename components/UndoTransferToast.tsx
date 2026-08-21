import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Transaction } from "../types";
import { triggerHaptic, triggerSuccessHaptic, triggerFailureHaptic } from "../utils/haptics";
import { useCurrency } from "../contexts/CurrencyContext";
import { RotateCcw, AlertTriangle, CheckCircle2, X } from "lucide-react";

export interface UndoTransferToastProps {
  pendingTransaction: {
    transaction: Transaction;
    onUndo: (tx: Transaction) => void;
    onFinalize: (tx: Transaction) => void;
    durationMs?: number;
  } | null;
  onDismiss: () => void;
}

export const UndoTransferToast: React.FC<UndoTransferToastProps> = ({
  pendingTransaction,
  onDismiss,
}) => {
  const { formatCurrency } = useCurrency();
  const [timeLeftMs, setTimeLeftMs] = useState(5000);
  const [isUndone, setIsUndone] = useState(false);
  const totalDuration = pendingTransaction?.durationMs || 5000;
  const intervalRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!pendingTransaction) {
      setIsUndone(false);
      setTimeLeftMs(totalDuration);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    setIsUndone(false);
    setTimeLeftMs(totalDuration);
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, totalDuration - elapsed);
      setTimeLeftMs(remaining);

      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        pendingTransaction.onFinalize(pendingTransaction.transaction);
        onDismiss();
      }
    }, 50);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pendingTransaction, totalDuration]);

  if (!pendingTransaction) return null;

  const { transaction, onUndo } = pendingTransaction;
  const progressPercent = (timeLeftMs / totalDuration) * 100;
  const secondsRemaining = (timeLeftMs / 1000).toFixed(1);

  const handleUndoClick = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsUndone(true);
    triggerFailureHaptic(70);
    onUndo(transaction);
    setTimeout(() => {
      onDismiss();
    }, 2400);
  };

  const recipientName =
    transaction.recipient?.fullName ||
    transaction.recipient?.nickname ||
    transaction.description ||
    "Beneficiary";

  return (
    <AnimatePresence>
      <motion.div
        key="undo-toast"
        initial={{ opacity: 0, y: 50, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.92 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="fixed bottom-6 right-4 sm:right-8 z-[9999] max-w-md w-[calc(100vw-2rem)] sm:w-auto"
        id="undo-transfer-toast"
      >
        <div className="relative overflow-hidden rounded-2xl bg-slate-900/95 dark:bg-[#0c121e]/98  border border-amber-500/40 shadow-[0_15px_45px_rgba(0,0,0,0.5)] p-4 text-white">
          {/* Animated Countdown Progress Bar */}
          {!isUndone && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500"
                style={{ width: `${progressPercent}%` }}
                transition={{ ease: "linear", duration: 0.05 }}
              />
            </div>
          )}

          {isUndone ? (
            <div className="flex items-center gap-3 py-1 animate-fade-in text-emerald-400">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-wider text-emerald-300">
                  Transfer Instantly Cancelled
                </p>
                <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                  {formatCurrency(transaction.sendAmount)} has been restored to your account.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5 relative">
                  <RotateCcw className="w-5 h-5 text-amber-400 animate-spin-slow" />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center">
                    {Math.ceil(timeLeftMs / 1000)}
                  </span>
                </div>
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Pending Settlement
                    </span>
                    <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300 dark:text-slate-300 font-semibold">
                      ({secondsRemaining}s)
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-[220px]">
                    {formatCurrency(transaction.sendAmount)} → {recipientName}
                  </p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 dark:text-slate-300">
                    Tap Undo to abort before database finalization.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={handleUndoClick}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                  id="undo-transfer-btn"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Undo ({secondsRemaining}s)
                </button>
                <button
                  onClick={() => {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    pendingTransaction.onFinalize(pendingTransaction.transaction);
                    onDismiss();
                  }}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 dark:text-slate-300 hover:text-white hover:bg-white transition-colors dark:bg-slate-800"
                  title="Dismiss and finalize immediately"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
