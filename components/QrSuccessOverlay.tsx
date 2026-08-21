import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ShieldCheck, Sparkles, Download, X, QrCode, ArrowRight, Lock, Building2 } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics.ts';
import { QrContactPrompt } from './QrContactPrompt';
import { Recipient } from '../types';

export interface QrSuccessPayload {
    recipientName?: string;
    accountNumber?: string;
    bankName?: string;
    amount?: number | string;
    description?: string;
    referenceId?: string;
    routingNumber?: string;
    swiftBic?: string;
    mode?: string;
    email?: string;
    phone?: string;
    category?: string;
}

interface QrSuccessOverlayProps {
    isOpen: boolean;
    type: 'scan' | 'generate';
    payload: QrSuccessPayload;
    onClose: () => void;
    onDownloadReceipt?: () => void;
    title?: string;
    subtitle?: string;
    recipients?: Recipient[];
    onSaveRecipient?: (recipient: Recipient) => void;
    onDeleteRecipient?: (id: string) => void;
    autoSaveRecipient?: boolean;
}

export const QrSuccessOverlay: React.FC<QrSuccessOverlayProps> = ({
    isOpen,
    type,
    payload,
    onClose,
    onDownloadReceipt,
    title,
    subtitle,
    recipients = [],
    onSaveRecipient,
    onDeleteRecipient,
    autoSaveRecipient = true
}) => {
    useEffect(() => {
        if (isOpen) {
            try {
                triggerHaptic();
            } catch (e) {
                // ignore if haptics unavailable
            }
        }
    }, [isOpen]);

    const parsedAmount = typeof payload.amount === 'number'
        ? payload.amount
        : payload.amount ? parseFloat(String(payload.amount).replace(/[^0-9.]/g, '')) : undefined;

    const formattedAmount = parsedAmount && !isNaN(parsedAmount)
        ? parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : undefined;

    const refId = payload.referenceId || `FPB-QR-${Math.floor(100000000 + Math.random() * 900000000)}`;
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-100  overflow-y-auto font-sans">
                    {/* Background Ambient Glows */}
                    <div className="absolute w-[500px] h-[500px] bg-emerald-500 rounded-full blur-[140px] pointer-events-none animate-pulse" />
                    <div className="absolute w-[300px] h-[300px] bg-cyan-500 rounded-full blur-[100px] pointer-events-none -top-10 -right-10" />

                    <motion.div
                        initial={{ scale: 0.85, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: -20 }}
                        transition={{ type: "spring", stiffness: 260, damping: 22 }}
                        className="relative w-full max-w-lg bg-slate-50 border-2 border-emerald-500/30 rounded-[2.5rem] shadow-[0_0_80px_rgba(16,185,129,0.25)] overflow-hidden text-center p-6 md:p-8 flex flex-col items-center gap-5 my-auto max-h-[90vh] overflow-y-auto custom-scrollbar dark:bg-slate-900"
                    >
                    {/* Top Dismiss Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 p-2 bg-white hover:bg-white text-[#0F172A] hover:text-white rounded-full transition-all border border-black/5 cursor-pointer z-20 dark:bg-slate-800"
                        title="Close Confirmation"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Header Pill */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] shadow-inner">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
                        {type === 'scan' ? 'Sovereign QR Payload Cleared' : 'Dynamic Peer QR Generated'}
                    </div>

                    {/* Central Morphing Shield & Ring Animation */}
                    <div className="relative w-24 h-24 flex items-center justify-center my-0.5">
                        {/* Outer Expanding Waves */}
                        <motion.div
                            initial={{ scale: 0.6, opacity: 1 }}
                            animate={{ scale: [0.8, 1.5, 1.3], opacity: [0.8, 0.2, 0] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                            className="absolute inset-0 bg-emerald-500 rounded-full blur-md"
                        />
                        <motion.div
                            initial={{ rotate: 0 }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                            className="absolute -inset-2 border-2 border-dashed border-emerald-500/40 rounded-full"
                        />

                        {/* Central Emerald Sphere */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
                            className="w-20 h-20 bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.6)] relative z-10 border-2 border-emerald-300/40"
                        >
                            <motion.svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3.5}
                                className="w-10 h-10 text-slate-950"
                            >
                                <motion.path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.5, delay: 0.2, ease: "easeInOut" }}
                                    d="M5 13l4 4L19 7"
                                />
                            </motion.svg>
                        </motion.div>
                    </div>

                    {/* Main Title & Status Text */}
                    <div className="space-y-1">
                        <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight font-serif">
                            {title || (type === 'scan' ? 'Transfer Status Verified' : 'QR Code Ready to Scan')}
                        </h3>
                        <p className="text-xs text-[#0F172A] font-bold">
                            {subtitle || (type === 'scan' 
                                ? 'Target coordinates authenticated and registered on the private ledger.' 
                                : 'Coordinates encoded for instant peer-to-peer liquidity settlement.')}
                        </p>
                    </div>

                    {/* Amount Banner (if parsed) */}
                    {formattedAmount && (
                        <div className="w-full bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border border-emerald-500/30 rounded-2xl p-4 shadow-lg">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/80 block mb-1">
                                {type === 'scan' ? 'Verified Transfer Volume' : 'Requested Transfer Amount'}
                            </span>
                            <span className="text-3xl md:text-4xl font-black font-mono text-emerald-400 tracking-tight drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                                ${formattedAmount} <span className="text-xs font-sans text-[#0F172A] font-bold uppercase">USD</span>
                            </span>
                        </div>
                    )}

                    {/* Auto-Save Contact Prompt for Scanned/Completed Payments */}
                    {type === 'scan' && (
                        <QrContactPrompt
                            payload={{
                                recipientName: payload.recipientName,
                                accountNumber: payload.accountNumber,
                                bankName: payload.bankName,
                                routingNumber: payload.routingNumber,
                                email: payload.email,
                                phone: payload.phone,
                                category: payload.category,
                                amount: payload.amount,
                                description: payload.description
                            }}
                            recipients={recipients}
                            onSaveRecipient={onSaveRecipient}
                            onDeleteRecipient={onDeleteRecipient}
                            autoSaveOnMount={autoSaveRecipient}
                        />
                    )}

                    {/* Coordinates Grid */}
                    <div className="w-full bg-slate-100 border border-black/5 rounded-2xl p-4 text-left space-y-2.5 text-xs font-mono">
                        <div className="flex justify-between items-center border-b border-black/5 pb-2">
                            <span className="text-[#0F172A] font-sans flex items-center gap-1.5 text-[11px]">
                                <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Beneficiary / Payee
                            </span>
                            <span className="text-white font-bold uppercase truncate max-w-[180px]">
                                {payload.recipientName || 'First Pacific Client'}
                            </span>
                        </div>

                        {payload.accountNumber && (
                            <div className="flex justify-between items-center border-b border-black/5 pb-2">
                                <span className="text-[#0F172A] font-sans text-[11px]">Account Reference</span>
                                <span className="text-emerald-400 font-bold">{payload.accountNumber}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center border-b border-black/5 pb-2">
                            <span className="text-[#0F172A] font-sans text-[11px]">Institution & Network</span>
                            <span className="text-[#0F172A]">{payload.bankName || 'First Pacific Bank, N.A.'}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-[#0F172A] font-sans text-[11px]">ISO-20022 Audit Hash</span>
                            <span className="text-[#0F172A] text-[10px]">{refId}</span>
                        </div>
                    </div>

                    {/* Trust Badges Bar */}
                    <div className="w-full flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-[#0F172A] pt-1">
                        <span className="flex items-center gap-1 text-emerald-400">
                            <ShieldCheck className="w-3.5 h-3.5" /> ISO-20022 SECURED
                        </span>
                        <span className="flex items-center gap-1 text-[#0F172A]">
                            <Lock className="w-3 h-3 text-cyan-400" /> {timestamp} EST
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full flex gap-3 pt-2">
                        {onDownloadReceipt && (
                            <button
                                onClick={onDownloadReceipt}
                                className="flex-1 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Download className="w-4 h-4" />
                                Save PDF Receipt
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className={`py-3.5 px-6 bg-white hover:bg-slate-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all border border-black/5 active:scale-95 cursor-pointer ${!onDownloadReceipt ? 'w-full' : ''}`}
                        >
                            Confirm & Continue
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
        </AnimatePresence>
    );
};
