import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    UserPlus, 
    Check, 
    Star, 
    Trash2, 
    Edit3, 
    Tag, 
    ShieldCheck, 
    ChevronDown, 
    ChevronUp, 
    ExternalLink,
    Building2,
    Sparkles,
    UserCheck,
    HeartHandshake
} from 'lucide-react';
import { Recipient } from '../types';
import { db } from '../services/database';

export interface QrRecipientPayload {
    recipientName?: string;
    fullName?: string;
    accountNumber?: string;
    routingNumber?: string;
    bankName?: string;
    email?: string;
    phone?: string;
    category?: string;
    amount?: number | string;
    description?: string;
    referenceId?: string;
}

interface QrContactPromptProps {
    payload: QrRecipientPayload;
    recipients?: Recipient[];
    onSaveRecipient?: (recipient: Recipient) => void;
    onDeleteRecipient?: (id: string) => void;
    onNavigateToContacts?: () => void;
    className?: string;
    autoSaveOnMount?: boolean;
}

const CATEGORY_OPTIONS = [
    { id: 'Friends', label: 'Friends', icon: '👥', color: 'bg-indigo-500 text-indigo-400 border-indigo-500/30' },
    { id: 'Business', label: 'Business', icon: '💼', color: 'bg-cyan-500 text-cyan-400 border-cyan-500/30' },
    { id: 'Shopping', label: 'Shopping', icon: '🛍️', color: 'bg-emerald-500 text-emerald-400 border-emerald-500/30' },
    { id: 'Family', label: 'Family', icon: '🏠', color: 'bg-amber-500 text-amber-400 border-amber-500/30' },
    { id: 'Services', label: 'Services', icon: '⚡', color: 'bg-purple-500 text-purple-400 border-purple-500/30' },
    { id: 'Other', label: 'Other', icon: '🏷️', color: 'bg-slate-500 text-[#0F172A] border-slate-500/30' }
];

const NICKNAME_SUGGESTIONS = [
    '☕ Coffee & Dining',
    '🏠 Rent / Housing',
    '💼 Client / Business',
    '🛍️ In-Store Retail',
    '⚡ Utility / Service',
    '👥 Peer Direct'
];

export const QrContactPrompt: React.FC<QrContactPromptProps> = ({
    payload,
    recipients = [],
    onSaveRecipient,
    onDeleteRecipient,
    onNavigateToContacts,
    className = '',
    autoSaveOnMount = true
}) => {
    const rawName = payload.recipientName || payload.fullName || 'QR Payee';
    const rawAcc = payload.accountNumber || 'ACC-QR-P2P';
    const rawBank = payload.bankName || 'First Pacific Clearing Node';
    const rawRouting = payload.routingNumber || '021000021';

    // Find if contact already exists in saved list
    const existingContact = recipients.find(r => {
        if (!r) return false;
        const matchAcc = r.accountNumber && (r.accountNumber.includes(rawAcc) || rawAcc.includes(r.accountNumber));
        const matchRealAcc = r.realDetails?.accountNumber && (r.realDetails.accountNumber.includes(rawAcc) || rawAcc.includes(r.realDetails.accountNumber));
        const matchName = r.fullName?.toLowerCase().trim() === rawName.toLowerCase().trim();
        return matchAcc || matchRealAcc || matchName;
    });

    const [savedContactId, setSavedContactId] = useState<string | null>(existingContact ? existingContact.id : null);
    const [nickname, setNickname] = useState(existingContact?.nickname || '');
    const [selectedCategory, setSelectedCategory] = useState<string>(
        existingContact?.category || payload.category || 'Business'
    );
    const [isFavorite, setIsFavorite] = useState<boolean>(existingContact?.isFavorite || false);
    const [isCustomizing, setIsCustomizing] = useState<boolean>(false);
    const [status, setStatus] = useState<'saved' | 'idle' | 'removed' | 'editing'>(
        existingContact ? 'saved' : 'idle'
    );
    const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

    // Auto-save recipient if not existing already
    useEffect(() => {
        let isSubscribed = true;

        const performAutoSave = async () => {
            if (existingContact) {
                setSavedContactId(existingContact.id);
                setStatus('saved');
                return;
            }

            if (autoSaveOnMount && status === 'idle') {
                const newId = `rec_qr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                const newRecipient: Recipient = {
                    id: newId,
                    userId: db.getCurrentUserEmail() || 'user@firstpacific.com',
                    fullName: rawName,
                    nickname: nickname || undefined,
                    bankName: rawBank,
                    accountNumber: rawAcc.length > 12 ? `${rawAcc.slice(0, 4)}...${rawAcc.slice(-4)}` : rawAcc,
                    country: {
                        code: 'US',
                        name: 'United States',
                        currency: 'USD',
                        symbol: '$'
                    },
                    realDetails: {
                        accountNumber: rawAcc,
                        routingNumber: rawRouting,
                        swiftBic: 'FPBUS33'
                    },
                    recipientType: 'bank',
                    category: selectedCategory as any,
                    trustScore: 99,
                    isFavorite: isFavorite,
                    lastPaymentDate: new Date(),
                    email: payload.email,
                    phone: payload.phone
                };

                try {
                    await db.saveRecipient(newRecipient);
                    if (onSaveRecipient) {
                        onSaveRecipient(newRecipient);
                    }
                    if (isSubscribed) {
                        setSavedContactId(newId);
                        setStatus('saved');
                        setFeedbackMsg('Added to contacts automatically');
                    }
                } catch (e) {
                    console.warn('[QrContactPrompt] Auto-save error:', e);
                }
            }
        };

        performAutoSave();

        return () => {
            isSubscribed = false;
        };
    }, [autoSaveOnMount, rawName, rawAcc]);

    // Handle manual save / update
    const handleSaveOrUpdate = async () => {
        const targetId = savedContactId || `rec_qr_${Date.now()}`;
        const updatedRecipient: Recipient = {
            id: targetId,
            userId: db.getCurrentUserEmail() || 'user@firstpacific.com',
            fullName: rawName,
            nickname: nickname.trim() || undefined,
            bankName: rawBank,
            accountNumber: rawAcc.length > 12 ? `${rawAcc.slice(0, 4)}...${rawAcc.slice(-4)}` : rawAcc,
            country: {
                code: 'US',
                name: 'United States',
                currency: 'USD',
                symbol: '$'
            },
            realDetails: {
                accountNumber: rawAcc,
                routingNumber: rawRouting,
                swiftBic: 'FPBUS33'
            },
            recipientType: 'bank',
            category: selectedCategory as any,
            trustScore: 99,
            isFavorite: isFavorite,
            lastPaymentDate: new Date(),
            email: payload.email,
            phone: payload.phone
        };

        try {
            await db.saveRecipient(updatedRecipient);
            if (onSaveRecipient) {
                onSaveRecipient(updatedRecipient);
            }
            setSavedContactId(targetId);
            setStatus('saved');
            setIsCustomizing(false);
            setFeedbackMsg('Contact updated successfully!');
            setTimeout(() => setFeedbackMsg(null), 3500);
        } catch (e) {
            console.error('[QrContactPrompt] Update failed:', e);
        }
    };

    // Handle removal / opt-out
    const handleRemoveFromContacts = async () => {
        if (!savedContactId) {
            setStatus('removed');
            return;
        }

        try {
            await db.deleteRecipient(savedContactId);
            if (onDeleteRecipient) {
                onDeleteRecipient(savedContactId);
            }
            setStatus('removed');
            setSavedContactId(null);
            setFeedbackMsg('Recipient removed from your contacts.');
        } catch (e) {
            console.error('[QrContactPrompt] Delete failed:', e);
        }
    };

    // Handle re-add if user clicked removed
    const handleReAdd = async () => {
        const newId = `rec_qr_${Date.now()}`;
        const newRec: Recipient = {
            id: newId,
            userId: db.getCurrentUserEmail() || 'user@firstpacific.com',
            fullName: rawName,
            nickname: nickname.trim() || undefined,
            bankName: rawBank,
            accountNumber: rawAcc.length > 12 ? `${rawAcc.slice(0, 4)}...${rawAcc.slice(-4)}` : rawAcc,
            country: {
                code: 'US',
                name: 'United States',
                currency: 'USD',
                symbol: '$'
            },
            realDetails: {
                accountNumber: rawAcc,
                routingNumber: rawRouting,
                swiftBic: 'FPBUS33'
            },
            recipientType: 'bank',
            category: selectedCategory as any,
            trustScore: 99,
            isFavorite: isFavorite,
            lastPaymentDate: new Date()
        };

        await db.saveRecipient(newRec);
        if (onSaveRecipient) {
            onSaveRecipient(newRec);
        }
        setSavedContactId(newId);
        setStatus('saved');
        setFeedbackMsg('Recipient saved to contacts!');
        setTimeout(() => setFeedbackMsg(null), 3500);
    };

    if (status === 'removed') {
        return (
            <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={`w-full bg-slate-900 border border-slate-700/40 rounded-2xl p-4 text-center space-y-2 ${className}`}
            >
                <p className="text-xs text-[#0F172A]">
                    Recipient was not saved to your contact directory.
                </p>
                <button
                    type="button"
                    onClick={handleReAdd}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-500 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/30 transition-all cursor-pointer"
                >
                    <UserPlus className="w-3.5 h-3.5" /> Add to Contacts
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full bg-gradient-to-br from-slate-900/90 via-[#0d1627] to-slate-900/90 border-2 border-emerald-500/30 rounded-2xl p-4 text-left shadow-xl  space-y-3.5 ${className}`}
        >
            {/* Header with Status Banner */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xs shadow-md shrink-0">
                        {rawName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                                {status === 'saved' ? 'Saved to Contacts' : 'Add to Contacts'}
                            </span>
                            {isFavorite && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-amber-500 text-amber-300 text-[9px] font-bold">
                                    ★ Favorite
                                </span>
                            )}
                        </div>
                        <h4 className="text-xs font-black text-white truncate max-w-[180px] sm:max-w-[220px]">
                            {nickname ? `${nickname} (${rawName})` : rawName}
                        </h4>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    {/* Favorite Star Button */}
                    <button
                        type="button"
                        onClick={async () => {
                            const newFav = !isFavorite;
                            setIsFavorite(newFav);
                            if (savedContactId) {
                                await db.updateRecipient(savedContactId, { isFavorite: newFav });
                                if (onSaveRecipient) {
                                    const rec = recipients.find(r => r.id === savedContactId);
                                    if (rec) onSaveRecipient({ ...rec, isFavorite: newFav });
                                }
                            }
                        }}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            isFavorite 
                                ? 'bg-amber-500 border-amber-500/40 text-amber-400' 
                                : 'bg-white border-slate-700/50 text-[#0F172A] hover:text-amber-300 hover:bg-white'
                        }`}
                        title={isFavorite ? 'Remove from favorites' : 'Mark as favorite contact'}
                    >
                        <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
                    </button>

                    {/* Customize / Expand Button */}
                    <button
                        type="button"
                        onClick={() => setIsCustomizing(prev => !prev)}
                        className="px-2.5 py-1.5 bg-white hover:bg-white text-[#334155] hover:text-white rounded-xl border border-slate-700/50 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer dark:bg-slate-800"
                        title="Customize Nickname and Category"
                    >
                        <Edit3 className="w-3 h-3 text-cyan-400" />
                        <span className="hidden sm:inline">{isCustomizing ? 'Done' : 'Edit'}</span>
                        {isCustomizing ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                </div>
            </div>

            {/* Quick Status Tag / Details */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-0.5 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                    <span className="text-[#0F172A] flex items-center gap-1 font-mono text-[10px]">
                        <Building2 className="w-3 h-3 text-[#0F172A]" />
                        {rawBank}
                    </span>
                    <span className="text-[#0F172A]">•</span>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                        CATEGORY_OPTIONS.find(c => c.id === selectedCategory)?.color || 'bg-slate-800 text-[#334155] border-slate-700'
                    }`}>
                        {selectedCategory}
                    </span>
                </div>

                <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Ready for Quick Pay
                </span>
            </div>

            {/* Expandable Customization Panel */}
            <AnimatePresence>
                {isCustomizing && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 pt-2 border-t border-slate-800/80 overflow-hidden"
                    >
                        {/* Nickname Input */}
                        <div>
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 mb-1.5">
                                Custom Nickname / Reference
                            </label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder={`e.g. ${rawName.split(' ')[0]} - Main Office`}
                                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-bold"
                            />
                            
                            {/* Preset Nickname Quick-tags */}
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {NICKNAME_SUGGESTIONS.map((sug, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setNickname(sug)}
                                        className="text-[9px] px-2 py-0.5 rounded-lg bg-white hover:bg-cyan-500 text-[#0F172A] hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/30 transition-all cursor-pointer dark:bg-slate-800"
                                    >
                                        {sug}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category Selector */}
                        <div>
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 mb-1.5">
                                Contact Category
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                                {CATEGORY_OPTIONS.map((cat) => {
                                    const isSel = selectedCategory === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`p-1.5 rounded-xl text-center border text-[10px] font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                                                isSel 
                                                    ? 'bg-cyan-500 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400/50' 
                                                    : 'bg-white border-slate-800 text-[#0F172A] hover:bg-white hover:text-white'
                                            }`}
                                        >
                                            <span className="text-xs">{cat.icon}</span>
                                            <span className="truncate w-full">{cat.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between gap-2 pt-2">
                            <button
                                type="button"
                                onClick={handleRemoveFromContacts}
                                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-500 text-rose-400 rounded-xl border border-rose-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                            >
                                <Trash2 className="w-3 h-3" /> Don't Save
                            </button>

                            <button
                                type="button"
                                onClick={handleSaveOrUpdate}
                                className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                            >
                                <Check className="w-3.5 h-3.5 stroke-[3]" /> Save Contact Details
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Temporary Feedback Message */}
            {feedbackMsg && (
                <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-emerald-400 font-bold text-center bg-emerald-500 border border-emerald-500/20 rounded-lg py-1 px-2"
                >
                    {feedbackMsg}
                </motion.div>
            )}
        </motion.div>
    );
};
