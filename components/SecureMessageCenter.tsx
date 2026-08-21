import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { db as firestore } from '../services/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db as generalDb } from '../services/database';
import { sendEmail, generateBankingEmailTemplate } from '../services/emailService';
import { 
    EnvelopeIcon as InboxIcon, SendIcon, PencilIcon, SparklesIcon, CheckCircleIcon, ShieldCheckIcon,
    TrashIcon, ArrowPathIcon, ClockIcon, PaperClipIcon, XIcon, UserCircleIcon
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

interface SecureMessageCenterProps {
    userProfile: UserProfile | null;
}

export const SecureMessageCenter: React.FC<SecureMessageCenterProps> = ({ userProfile }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
    const [isComposing, setIsComposing] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

    // Compose State
    const [composeSubject, setComposeSubject] = useState('');
    const [composeBody, setComposeBody] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (!userProfile?.email) return;

        const q = query(
            collection(firestore, 'secure_messages'),
            where('involvedParties', 'array-contains', userProfile.email),
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
    }, [userProfile?.email]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!composeSubject.trim() || !composeBody.replace(/<[^>]+>/g, '').trim() || !userProfile?.email) return;

        setIsSending(true);
        try {
            await addDoc(collection(firestore, 'secure_messages'), {
                senderId: userProfile.email,
                receiverId: 'admin',
                involvedParties: [userProfile.email, 'admin'],
                subject: composeSubject,
                content: composeBody,
                status: 'unread',
                isPriority: true,
                createdAt: serverTimestamp()
            });

            // Trigger real-time email warning to administrators about new secure customer message
            try {
                const systemOpts = await generalDb.getSystemOptions();
                const adminNotifyEmail = systemOpts?.emailGatewayConfig?.fromEmail || "info@lawrenceconsultantsorg.org";
                
                const brandOptions = {
                    logoStyle: systemOpts?.logoStyle || 'classic',
                    primaryColor: systemOpts?.primaryColor || '#D4AF37',
                    customIssuer: systemOpts?.customIssuer || 'First Pacific Bank Secure Message Relay',
                    securityBadges: systemOpts?.securityBadges || ["TLS 1.3 SECURED", "FORENSIC COMPLIANT"],
                    bannerUrl: systemOpts?.emailBannerUrl || "/standard_dispatch_banner.png"
                };

                const emailHtml = generateBankingEmailTemplate(
                    "Incoming Client Message Notice",
                    `<p>A certified client has submitted a secure correspondence to the Operations Support Queue.</p>
                     <p>Please review the details of the communication transmission below:</p>
                     <table cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
                         <tr style="background-color: #f8fafc;">
                             <td style="font-weight: bold; width: 35%; color: #475569; padding: 8px; border-bottom: 1px solid #e2e8f0;">Client Account Email:</td>
                             <td style="color: #0f172a; font-weight: bold; padding: 8px; border-bottom: 1px solid #e2e8f0;">${userProfile.email}</td>
                         </tr>
                         <tr>
                             <td style="font-weight: bold; color: #475569; padding: 8px; border-bottom: 1px solid #e2e8f0;">Clearing Full Name:</td>
                             <td style="color: #0f172a; padding: 8px; border-bottom: 1px solid #e2e8f0;">${userProfile.name || 'Sovereign Account Holder'}</td>
                         </tr>
                     </table>
                     <div style="background-color: #fdfaf2; border-left: 4px solid #d97706; padding: 18px; margin: 20px 0; border-radius: 8px; border: 1px solid #fef3c7;">
                         <strong style="display: block; font-size: 14px; margin-bottom: 8px; color: #78350f;">Subject: ${composeSubject}</strong>
                         <div style="font-size: 13px; color: #451a03; line-height: 1.6;">
                             ${composeBody}
                         </div>
                     </div>
                     <p>Log in to the administrator portal terminal to issue an approved secure clearance reply coordinate:</p>`,
                    "Launch Admin Desk Hub",
                    `${window.location.origin}/admin`,
                    brandOptions
                );

                await sendEmail(
                    adminNotifyEmail,
                    `🔔 Operations Alert: New Message from ${userProfile.email}`,
                    emailHtml
                );
            } catch (emailErr) {
                console.warn('[SecureMessageCenter] Admin email notification offline:', emailErr);
            }

            setComposeSubject('');
            setComposeBody('');
            setIsComposing(false);
        } catch (error) {
            console.error("Failed to send secure message:", error);
        } finally {
            setIsSending(false);
        }
    };

    const handleSelectMessage = async (msg: Message) => {
        setSelectedMessage(msg);
        
        // Mark as read if it was sent to user and is unread
        if (msg.receiverId === userProfile?.email && msg.status === 'unread') {
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
        activeTab === 'inbox' ? msg.receiverId === userProfile?.email : msg.senderId === userProfile?.email
    );

    const unreadCount = messages.filter(m => m.receiverId === userProfile?.email && m.status === 'unread').length;

    return (
        <div className="max-w-6xl mx-auto h-[750px] bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 flex overflow-hidden shadow-2xl relative">
            
            {/* LEFT SIDEBAR */}
            <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/10 flex flex-col pt-6 pb-4">
                <div className="px-6 mb-8">
                    <button 
                        onClick={() => { setIsComposing(true); setSelectedMessage(null); }}
                        className="w-full bg-slate-50 hover:bg-white dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 py-3.5 rounded-2xl flex justify-center items-center gap-2 font-bold transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
                    >
                        <PencilIcon className="w-5 h-5" />
                        Compose
                    </button>
                </div>

                <div className="flex flex-col gap-1 px-3">
                    <button 
                        onClick={() => { setActiveTab('inbox'); setSelectedMessage(null); setIsComposing(false); }}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                            activeTab === 'inbox' && !isComposing ? 'bg-emerald-50 dark:bg-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold' : 'text-[#0F172A] dark:text-white hover:bg-slate-100 dark:hover:bg-white'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <InboxIcon className="w-5 h-5" />
                            <span className="text-sm">Inbox</span>
                        </div>
                        {unreadCount > 0 && (
                            <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    <button 
                        onClick={() => { setActiveTab('sent'); setSelectedMessage(null); setIsComposing(false); }}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                            activeTab === 'sent' && !isComposing ? 'bg-emerald-50 dark:bg-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold' : 'text-[#0F172A] dark:text-white hover:bg-slate-100 dark:hover:bg-white'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <SendIcon className="w-5 h-5" />
                            <span className="text-sm">Sent</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col bg-white dark:bg-[#0b101c]">
                {/* Header */}
                <div className="h-16 border-b border-slate-200 dark:border-white/10 flex items-center px-6 justify-between bg-white dark:bg-slate-900 ">
                    <h2 className="font-bold text-lg text-[#0F172A] dark:text-white capitalize">
                        {isComposing ? 'New Secure Message' : activeTab}
                    </h2>
                    <div className="flex items-center gap-2 text-xs font-mono text-[#0F172A]">
                        <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
                        E2E Encrypted
                    </div>
                </div>

                {isComposing ? (
                    /* COMPOSE PANE (Gmail Style) */
                    <div className="flex-1 flex flex-col p-6 animate-fade-in">
                        <div className="max-w-3xl w-full mx-auto bg-white dark:bg-slate-900 
                            border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden flex flex-col">
                            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                                <span className="font-bold text-[#0F172A] dark:text-[#1E293B] text-sm">New Complaint / Inquiry</span>
                                <button onClick={() => setIsComposing(false)} className="text-[#0F172A] hover:text-red-500 transition">
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSendMessage} className="flex-1 flex flex-col">
                                <div className="px-6 py-3 border-b border-slate-100 dark:border-white/10 flex items-center gap-4">
                                    <span className="text-sm font-bold text-[#0F172A] w-12">To</span>
                                    <span className="bg-emerald-50 dark:bg-emerald-500 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                                        Bank Support / Security Desk
                                    </span>
                                </div>
                                <div className="px-6 py-3 border-b border-slate-100 dark:border-white/10 flex items-center gap-4">
                                    <span className="text-sm font-bold text-[#0F172A] w-12">Subject</span>
                                    <input 
                                        type="text"
                                        value={composeSubject}
                                        onChange={e => setComposeSubject(e.target.value)}
                                        className="flex-1 bg-transparent border-none outline-none text-[#0F172A] dark:text-white font-bold"
                                        placeholder="Brief description of the issue..."
                                        maxLength={100}
                                        required
                                    />
                                </div>
                                <div className="flex-1 px-6 pb-6 flex flex-col overflow-hidden">
                                    <textarea 
                                        value={composeBody}
                                        onChange={(e) => setComposeBody(e.target.value)}
                                        className="w-full flex-1 p-4 bg-transparent outline-none resize-none text-[#1E293B] dark:text-slate-100 border border-slate-200 dark:border-slate-300 rounded-xl"
                                        placeholder="Please provide full details regarding your complaint or inquiry..."
                                    />
                                </div>
                                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <button type="submit" disabled={isSending || !composeSubject.trim() || !composeBody.trim()} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-70">
                                            {isSending ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <SendIcon className="w-4 h-4" />}
                                            {isSending ? 'Sending...' : 'Send Securely'}
                                        </button>
                                        <button type="button" className="p-2 text-[#0F172A] hover:text-[#0F172A] dark:hover:text-[#1E293B] disabled:opacity-70" title="Attach Files">
                                            <PaperClipIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : selectedMessage ? (
                    /* READING PANE */
                    <div className="flex-1 overflow-y-auto p-8 animate-fade-in flex flex-col h-full">
                        <div className="flex items-center gap-4 mb-8 border-b border-slate-200 dark:border-white/10 pb-6">
                            <button onClick={() => setSelectedMessage(null)} className="text-[#0F172A] hover:text-[#0F172A] dark:hover:text-[#1E293B] flex items-center gap-2 text-sm font-bold">
                                ← Back
                            </button>
                        </div>
                        <div className="flex justify-between items-start mb-6">
                            <h1 className="text-2xl font-black text-[#0F172A] dark:text-white">
                                {selectedMessage.subject}
                            </h1>
                        </div>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center font-bold text-lg">
                                    {selectedMessage.senderId === 'admin' ? 'FP' : selectedMessage.senderId.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-bold text-[#0F172A] dark:text-white">
                                        {selectedMessage.senderId === 'admin' ? 'First Pacific Private Bank' : 'You'}
                                    </div>
                                    <div className="text-xs text-[#0F172A] mt-0.5">
                                        to {selectedMessage.receiverId === 'admin' ? 'Bank Support' : 'You'}
                                    </div>
                                </div>
                            </div>
                            <div className="text-xs text-[#0F172A] font-mono">
                                {selectedMessage.createdAt?.toDate ? selectedMessage.createdAt.toDate().toLocaleString() : 'Just now'}
                            </div>
                        </div>

                        <div 
                            className="prose prose-slate dark:prose-invert max-w-none text-[#0F172A] dark:text-white leading-relaxed font-bold"
                            dangerouslySetInnerHTML={{ __html: selectedMessage.content }}
                        />
                    </div>
                ) : (
                    /* LIST PANE */
                    <div className="flex-1 overflow-y-auto">
                        {displayedMessages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-[#0F172A]">
                                <InboxIcon className="w-12 h-12 mb-4 opacity-20" />
                                <p className="font-bold">No messages found in your {activeTab}.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-white/5">
                                {displayedMessages.map(msg => {
                                    const isUnread = msg.receiverId === userProfile?.email && msg.status === 'unread';
                                    return (
                                        <button
                                            key={msg.id}
                                            onClick={() => handleSelectMessage(msg)}
                                            className={`w-full text-left px-6 py-4 flex items-center gap-4 hover:shadow-md transition-all group ${
                                                isUnread ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800'
                                            }`}
                                        >
                                            <div className="shrink-0 w-8 flex justify-center text-[#0F172A]">
                                                {msg.senderId === 'admin' ? (
                                                    <ShieldCheckIcon className={`w-5 h-5 ${isUnread ? 'text-emerald-500' : ''}`} />
                                                ) : (
                                                    <UserCircleIcon className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div className="w-48 shrink-0 truncate font-bold text-[#0F172A] dark:text-white text-sm">
                                                {msg.senderId === 'admin' ? 'First Pacific Official' : 'You'}
                                            </div>
                                            <div className="flex-1 truncate text-sm flex gap-2">
                                                <span className={`truncate ${isUnread ? 'font-bold text-[#0F172A] dark:text-white' : 'font-bold text-[#0F172A] dark:text-white'}`}>
                                                    {msg.subject}
                                                </span>
                                                <span className="text-[#0F172A] dark:text-white hidden md:inline truncate" dangerouslySetInnerHTML={{ __html: `- ${msg.content.replace(/<[^>]+>/g, ' ')}` }} />
                                            </div>
                                            <div className={`w-24 shrink-0 text-right text-xs font-mono font-bold ${isUnread ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#0F172A]'}`}>
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
