import React, { useState, useEffect } from 'react';
import { UserRecord, db as generalDb } from '../services/database';
import { db as firestore } from '../services/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { sendEmail, generateBankingEmailTemplate } from '../services/emailService';
import { 
    EnvelopeIcon as InboxIcon, SendIcon, PencilIcon, CheckCircleIcon, ShieldCheckIcon,
    ArrowPathIcon, ClockIcon, PaperClipIcon, XIcon, UserCircleIcon
} from './Icons';
import { timeSince } from '../utils/time';

interface Message {
    id: string;
    senderId: string;
    receiverId: string;
    subject: string;
    content: string;
    status: 'read' | 'unread';
    createdAt: any;
    isPriority?: boolean;
}

interface AdminSecureMailboxProps {
    allUsers: UserRecord[];
}

export const AdminSecureMailbox: React.FC<AdminSecureMailboxProps> = ({ allUsers }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
    const [isComposing, setIsComposing] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

    // Compose State
    const [composeTargetEmail, setComposeTargetEmail] = useState('');
    const [composeSubject, setComposeSubject] = useState('');
    const [composeBody, setComposeBody] = useState('');
    const [isSending, setIsSending] = useState(false);
    
    // For replying
    useEffect(() => {
        if (selectedMessage) {
            setComposeTargetEmail(selectedMessage.senderId === 'admin' ? selectedMessage.receiverId : selectedMessage.senderId);
            setComposeSubject(selectedMessage.subject.startsWith('Re:') ? selectedMessage.subject : `Re: ${selectedMessage.subject}`);
        } else {
            setComposeTargetEmail('');
            setComposeSubject('');
        }
    }, [selectedMessage]);

    useEffect(() => {
        const q = query(
            collection(firestore, 'secure_messages'),
            where('involvedParties', 'array-contains', 'admin'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Message[];
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, []);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!composeTargetEmail.trim() || !composeSubject.trim() || !composeBody.replace(/<[^>]+>/g, '').trim()) return;

        setIsSending(true);
        try {
            await addDoc(collection(firestore, 'secure_messages'), {
                senderId: 'admin',
                receiverId: composeTargetEmail,
                involvedParties: [composeTargetEmail, 'admin'],
                subject: composeSubject,
                content: composeBody,
                status: 'unread',
                isPriority: true,
                createdAt: serverTimestamp()
            });

            // Send real-time email notification to the user about this secure inbox message
            try {
                const systemOpts = await generalDb.getSystemOptions();
                const brandOptions = {
                    logoStyle: systemOpts?.logoStyle || 'classic',
                    primaryColor: systemOpts?.primaryColor || '#D4AF37',
                    customIssuer: systemOpts?.customIssuer || 'First Pacific Bank Secure Message Relay',
                    securityBadges: systemOpts?.securityBadges || ["TLS 1.3 SECURED", "FORENSIC COMPLIANT"],
                    bannerUrl: systemOpts?.emailBannerUrl || "/standard_dispatch_banner.png"
                };

                const emailHtml = generateBankingEmailTemplate(
                    "Encrypted Message Transmission Received",
                    `<p>An authorized operations administrator has dispatched a secure message to your private banking inbox.</p>
                     <p>Please review the details of the transmission of security clearance coordinates below:</p>
                     <div style="background-color: #f8fafc; border-left: 4px solid ${brandOptions.primaryColor}; padding: 18px; margin: 20px 0; border-radius: 8px; border: 1px solid #e2e8f0;">
                         <strong style="display: block; font-size: 14px; margin-bottom: 8px; color: #0f172a;">Subject: ${composeSubject}</strong>
                         <div style="font-size: 13px; color: #334155; line-height: 1.6;">
                             ${composeBody}
                         </div>
                     </div>
                     <p>For your protection, do not reply directly to this notification. Sign in to your authorized secure member area using the certified link below:</p>`,
                    "Log In to Secure Terminal",
                    `${window.location.origin}`,
                    brandOptions
                );

                await sendEmail(
                    composeTargetEmail.trim(),
                    `🔒 Secure Correspondence: ${composeSubject}`,
                    emailHtml
                );
            } catch (emailErr) {
                console.warn('[AdminSecureMailbox] Non-blocking email dispatch failed:', emailErr);
            }

            setComposeSubject('');
            setComposeBody('');
            setIsComposing(false);
            if (activeTab === 'inbox') setSelectedMessage(null); // Return to list if replying
        } catch (error) {
            console.error("Failed to send secure message:", error);
        } finally {
            setIsSending(false);
        }
    };

    const handleSelectMessage = async (msg: Message) => {
        setSelectedMessage(msg);
        
        // Mark as read if it was sent to admin and is unread
        if (msg.receiverId === 'admin' && msg.status === 'unread') {
            try {
                await updateDoc(doc(firestore, 'secure_messages', msg.id), {
                    status: 'read'
                });
            } catch (e) {
                console.error("Failed to mark read:", e);
            }
        }
    };

    const displayedMessages = messages.filter(msg => 
        activeTab === 'inbox' ? msg.receiverId === 'admin' : msg.senderId === 'admin'
    );

    const unreadCount = messages.filter(m => m.receiverId === 'admin' && m.status === 'unread').length;

    return (
        <div className="h-[750px] bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 flex overflow-hidden shadow-2xl relative">
            {/* LEFT SIDEBAR */}
            <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/10 flex flex-col pt-6 pb-4">
                <div className="px-6 mb-8">
                    <button 
                        onClick={() => { setIsComposing(true); setSelectedMessage(null); }}
                        className="w-full bg-slate-50 hover:bg-white dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 py-3.5 rounded-2xl flex justify-center items-center gap-2 font-bold transition-all shadow-lg shadow-cyan-500/10 active:scale-95"
                    >
                        <PencilIcon className="w-5 h-5" />
                        Compose Reply
                    </button>
                </div>

                <div className="flex flex-col gap-1 px-3">
                    <button 
                        onClick={() => { setActiveTab('inbox'); setSelectedMessage(null); setIsComposing(false); }}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                            activeTab === 'inbox' && !isComposing ? 'bg-cyan-50 dark:bg-cyan-500 text-cyan-600 dark:text-cyan-400 font-bold' : 'text-[#0F172A] dark:text-white hover:bg-slate-100 dark:hover:bg-white'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <InboxIcon className="w-5 h-5" />
                            <span className="text-sm">Client Inbox</span>
                        </div>
                        {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    <button 
                        onClick={() => { setActiveTab('sent'); setSelectedMessage(null); setIsComposing(false); }}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                            activeTab === 'sent' && !isComposing ? 'bg-cyan-50 dark:bg-cyan-500 text-cyan-600 dark:text-cyan-400 font-bold' : 'text-[#0F172A] dark:text-white hover:bg-slate-100 dark:hover:bg-white'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <SendIcon className="w-5 h-5" />
                            <span className="text-sm">Sent Dispatches</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col bg-white dark:bg-[#0b101c]">
                {/* Header */}
                <div className="h-16 border-b border-slate-200 dark:border-white/10 flex items-center px-6 justify-between bg-white dark:bg-slate-900 ">
                    <h2 className="font-bold text-lg text-[#0F172A] dark:text-white capitalize">
                        {isComposing ? 'New Operator Dispatch' : activeTab}
                    </h2>
                    <div className="flex items-center gap-2 text-xs font-mono text-[#0F172A]">
                        <ShieldCheckIcon className="w-4 h-4 text-cyan-500" />
                        Admin End-to-End Encrypted
                    </div>
                </div>

                {isComposing ? (
                    /* COMPOSE PANE */
                    <div className="flex-1 flex flex-col p-6 animate-fade-in">
                        <div className="max-w-3xl w-full mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden flex flex-col h-full">
                            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                                <span className="font-bold text-[#0F172A] dark:text-[#1E293B] text-sm">Operator Dispatch Module</span>
                                <button onClick={() => setIsComposing(false)} className="text-[#0F172A] hover:text-red-500 transition">
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSendMessage} className="flex-1 flex flex-col">
                                <div className="px-6 py-3 border-b border-slate-100 dark:border-white/10 flex items-center gap-4">
                                    <span className="text-sm font-bold text-[#0F172A] w-12">To</span>
                                    <input 
                                        type="email"
                                        value={composeTargetEmail}
                                        onChange={e => setComposeTargetEmail(e.target.value)}
                                        className="flex-1 bg-transparent border-none outline-none text-[#0F172A] dark:text-white font-bold"
                                        placeholder="client.email@example.com"
                                        required
                                    />
                                </div>
                                <div className="px-6 py-3 border-b border-slate-100 dark:border-white/10 flex items-center gap-4">
                                    <span className="text-sm font-bold text-[#0F172A] w-12">Subject</span>
                                    <input 
                                        type="text"
                                        value={composeSubject}
                                        onChange={e => setComposeSubject(e.target.value)}
                                        className="flex-1 bg-transparent border-none outline-none text-[#0F172A] dark:text-white font-bold"
                                        placeholder="Message Subject..."
                                        maxLength={150}
                                        required
                                    />
                                </div>
                                <div className="flex-1 px-6 pb-6 flex flex-col overflow-hidden">
                                    <textarea 
                                        value={composeBody}
                                        onChange={(e) => setComposeBody(e.target.value)}
                                        className="w-full flex-1 p-4 bg-transparent outline-none resize-none text-[#1E293B] dark:text-slate-100 border border-slate-200 dark:border-slate-300 rounded-xl"
                                        placeholder="Draft official operator responses here..."
                                    />
                                </div>
                                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <button type="submit" disabled={isSending || !composeSubject.trim() || !composeBody.trim() || !composeTargetEmail.trim()} className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-70">
                                            {isSending ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <SendIcon className="w-4 h-4" />}
                                            {isSending ? 'Transmitting...' : 'Transmit Securely'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : selectedMessage ? (
                    /* READING PANE */
                    <div className="flex-1 overflow-y-auto p-8 animate-fade-in flex flex-col h-full bg-white dark:bg-slate-800">
                        <div className="flex items-center gap-4 mb-8 border-b border-slate-200 dark:border-white/10 pb-6">
                            <button onClick={() => setSelectedMessage(null)} className="text-[#0F172A] hover:text-[#0F172A] dark:hover:text-[#1E293B] flex items-center gap-2 text-sm font-bold">
                                ← Back to Queue
                            </button>
                            <div className="flex-1" />
                            <button onClick={() => setIsComposing(true)} className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-white text-[#0F172A] dark:text-white transition flex items-center gap-2 dark:bg-slate-800">
                                <SendIcon className="w-3.5 h-3.5" /> Reply
                            </button>
                        </div>
                        <div className="flex justify-between items-start mb-6">
                            <h1 className="text-2xl font-black text-[#0F172A] dark:text-white">
                                {selectedMessage.subject}
                            </h1>
                        </div>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 text-[#0F172A] dark:text-white rounded-full flex items-center justify-center font-bold text-lg border border-slate-200 dark:border-white/10">
                                    {selectedMessage.senderId === 'admin' ? 'A' : 'C'}
                                </div>
                                <div>
                                    <div className="font-bold text-[#0F172A] dark:text-white">
                                        {selectedMessage.senderId === 'admin' ? 'Operator (You)' : selectedMessage.senderId}
                                    </div>
                                    <div className="text-xs text-[#0F172A] mt-0.5 font-mono">
                                        to {selectedMessage.receiverId}
                                    </div>
                                </div>
                            </div>
                            <div className="text-xs text-[#0F172A] font-mono">
                                {selectedMessage.createdAt?.toDate ? selectedMessage.createdAt.toDate().toLocaleString() : 'Just now'}
                            </div>
                        </div>

                        <div 
                            className="prose prose-slate dark:prose-invert max-w-none text-[#0F172A] dark:text-white leading-relaxed font-bold flex-1 bg-slate-50 dark:bg-slate-900[0.02] p-6 rounded-2xl border border-slate-100 dark:border-white/10"
                            dangerouslySetInnerHTML={{ __html: selectedMessage.content }}
                        />
                    </div>
                ) : (
                    /* LIST PANE */
                    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#070b12]">
                        {displayedMessages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-[#0F172A]">
                                <InboxIcon className="w-12 h-12 mb-4 opacity-20" />
                                <p className="font-bold text-sm">Mailbox queue clear.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-200/50 dark:divide-white/5">
                                {displayedMessages.map(msg => {
                                    const isUnread = msg.receiverId === 'admin' && msg.status === 'unread';
                                    return (
                                        <button
                                            key={msg.id}
                                            onClick={() => handleSelectMessage(msg)}
                                            className={`w-full text-left px-6 py-4 flex items-center gap-4 hover:shadow-md transition-all group ${
                                                isUnread ? 'bg-white dark:bg-slate-900 shadow-sm' : 'bg-transparent dark:bg-transparent'
                                            }`}
                                        >
                                            <div className="shrink-0 w-8 flex justify-center text-[#0F172A]">
                                                {msg.senderId !== 'admin' ? (
                                                    <UserCircleIcon className={`w-5 h-5 ${isUnread ? 'text-rose-500' : ''}`} />
                                                ) : (
                                                    <ShieldCheckIcon className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div className="w-48 shrink-0 truncate font-mono text-[#1E293B] dark:text-slate-100 text-xs font-bold">
                                                {msg.senderId === 'admin' ? 'System Operator' : msg.senderId}
                                            </div>
                                            <div className="flex-1 truncate text-sm flex gap-2">
                                                <span className={`truncate ${isUnread ? 'font-bold text-[#0F172A] dark:text-white' : 'font-bold text-[#0F172A] dark:text-white'}`}>
                                                    {msg.subject}
                                                </span>
                                                <span className="text-[#0F172A] dark:text-white hidden md:inline truncate" dangerouslySetInnerHTML={{ __html: `- ${msg.content.replace(/<[^>]+>/g, ' ')}` }} />
                                            </div>
                                            <div className={`w-24 shrink-0 text-right text-[10px] font-mono font-bold ${isUnread ? 'text-red-500 font-bold' : 'text-[#0F172A]'}`}>
                                                {msg.createdAt?.toDate ? timeSince(msg.createdAt.toDate()) : 'Now'}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
