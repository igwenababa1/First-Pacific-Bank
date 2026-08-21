
import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import { SystemUpdate, UserProfile } from '../types';
import { getSystemUpdates } from '../services/geminiService';
import { getSupportAiResponse } from '../services/aiChatService';
import { db as firestore } from '../services/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { SearchIcon, SpinnerIcon, InfoIcon, SparklesIcon, CheckCircleIcon, LightBulbIcon, UserCircleIcon, ArrowsRightLeftIcon, ShieldCheckIcon, CreditCardIcon, ChatBubbleLeftRightIcon, PhoneIcon, EnvelopeIcon, ArrowPathIcon } from './Icons';

interface SupportProps {
    userProfile: UserProfile | null;
    onContactSupport: () => void;
}

const SystemUpdateCard: React.FC<{ update: SystemUpdate }> = ({ update }) => {
    const categoryStyles = {
        'New Feature': 'primary- primary- primary-',
        'Improvement': 'bg-green-500/10 text-green-400 border-green-500/20',
        'Maintenance': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    };
    return (
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 hover:border-slate-200 dark:border-white/10 transition-all">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-[#0F172A] dark:text-[#1E293B]">{update.title}</h4>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${categoryStyles[update.category]}`}>{update.category}</span>
            </div>
            <p className="text-sm text-[#0F172A] dark:text-white leading-relaxed">{update.description}</p>
            <p className="text-xs text-[#0F172A] mt-3">{new Date(update.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
    );
};

const FormattedAnswer: React.FC<{ text: string }> = ({ text }) => {
    const formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\n\*/g, '\n•'); // Simple bullet points

    const paragraphs = formattedText.split('\n').map((paragraph, index) => {
        if (paragraph.startsWith('•')) {
            return (
                <li key={index} className="ml-5 list-disc">{paragraph.substring(1).trim()}</li>
            );
        }
        return paragraph ? <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }}></p> : <br key={index} />;
    });

    return <div className="space-y-2 text-sm text-[#0F172A] dark:text-white leading-relaxed">{paragraphs}</div>;
};

const supportTopics = [
    { title: "Account Access", icon: UserCircleIcon, query: "How do I reset my password or unlock my account?" },
    { title: "Global Transfers", icon: ArrowsRightLeftIcon, query: "What are the fees and limits for international wire transfers?" },
    { title: "Security & Fraud", icon: ShieldCheckIcon, query: "How do I report a suspicious transaction?" },
    { title: "Cards & Wallets", icon: CreditCardIcon, query: "How do I add my card to Apple Pay?" },
];

export const Support: React.FC<SupportProps> = ({ userProfile, onContactSupport }) => {
    const [updates, setUpdates] = useState<SystemUpdate[]>([]);
    const [isLoadingUpdates, setIsLoadingUpdates] = useState(true);
    const [updatesError, setUpdatesError] = useState(false);
    
    const [queryAI, setQueryAI] = useState('');
    const [answer, setAnswer] = useState('');
    const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);
    const [answerError, setAnswerError] = useState(false);

    const [complaints, setComplaints] = useState<any[]>([]);
    const [newComplaint, setNewComplaint] = useState('');
    const [submittingComplaint, setSubmittingComplaint] = useState(false);

    useEffect(() => {
        if (!userProfile?.email) return;
        const q = query(
            collection(firestore, "complaints"),
            where("userEmail", "==", userProfile.email),
            orderBy("createdAt", "desc")
        );
        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setComplaints(list);
        }, (err) => {
            console.error("Failed to fetch complaints:", err);
        });
        return () => unsub();
    }, [userProfile?.email]);

    const handleSubmitComplaint = async (e: FormEvent) => {
        e.preventDefault();
        const cleanedText = newComplaint.replace(/<[^>]*>/g, '').trim();
        if (!cleanedText || !userProfile?.email) return;
        setSubmittingComplaint(true);
        try {
            await addDoc(collection(firestore, "complaints"), {
                userEmail: userProfile.email,
                text: newComplaint,
                status: 'Open',
                createdAt: serverTimestamp(),
            });
            setNewComplaint('');
        } catch (err) {
            console.error("Error submitting complaint:", err);
        }
        setSubmittingComplaint(false);
    };

    const fetchUpdates = useCallback(async () => {
        setIsLoadingUpdates(true);
        setUpdatesError(false);
        const { updates: fetchedUpdates, isError } = await getSystemUpdates();
        if (isError) {
            setUpdatesError(true);
        } else {
            setUpdates(fetchedUpdates);
        }
        setIsLoadingUpdates(false);
    }, []);

    useEffect(() => {
        fetchUpdates();
    }, [fetchUpdates]);

    const handleSubmitAI = async (e: FormEvent, newQuery?: string) => {
        e.preventDefault();
        const currentQuery = newQuery || queryAI;
        if (!currentQuery.trim()) return;

        setIsLoadingAnswer(true);
        setAnswer('');
        setAnswerError(false);
        setQueryAI(currentQuery);

        const { answer: newAnswer, isError } = await getSupportAiResponse(currentQuery);
        if (isError) {
            setAnswerError(true);
        } else {
            setAnswer(newAnswer);
        }
        setIsLoadingAnswer(false);
    };

    return (
        <div className="space-y-10 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-[#0F172A] dark:text-white">Support Center</h2>
                    <p className="text-[#0F172A] dark:text-white mt-2">24/7 assistance, AI-powered answers, and system status.</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold text-green-400 uppercase tracking-wider">All Systems Operational</span>
                    </div>
                </div>
            </div>

            {/* AI Search Section */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-digital p-8 border border-slate-200 dark:border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                
                <h3 className="text-xl font-bold text-[#0F172A] dark:text-white mb-6 flex items-center gap-3 relative z-10">
                    <SparklesIcon className="w-6 h-6 text-primary" /> 
                    Ask our AI Banking Assistant
                </h3>
                
                <form onSubmit={handleSubmitAI} className="relative z-10">
                    <div className="relative group">
                        <SearchIcon className="w-6 h-6 text-[#0F172A] dark:text-white absolute top-1/2 left-4 -translate-y-1/2 transition-colors group-focus-within:text-primary" />
                        <input
                            type="text"
                            value={queryAI}
                            onChange={(e) => setQueryAI(e.target.value)}
                            placeholder="e.g., 'How do I increase my daily transfer limit?'"
                            className="w-full bg-slate-50 dark:bg-slate-800 text-[#0F172A] dark:text-white p-4 pl-14 rounded-xl border border-slate-200 dark:border-white/10 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-inner text-lg"
                        />
                        <button 
                            type="submit" 
                            disabled={isLoadingAnswer || !queryAI.trim()} 
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white rounded-lg font-bold shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                        >
                            {isLoadingAnswer ? <SpinnerIcon className="w-5 h-5"/> : 'Ask'}
                        </button>
                    </div>
                </form>

                {(isLoadingAnswer || answer || answerError) && (
                    <div className="mt-6 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/10 relative z-10 animate-fade-in-up">
                        {isLoadingAnswer ? (
                            <div className="flex items-center space-x-3 text-[#0F172A] dark:text-white">
                                <SpinnerIcon className="w-5 h-5 text-primary" />
                                <span>Analyzing your request...</span>
                            </div>
                        ) : answerError ? (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center space-x-3 text-yellow-400">
                                    <InfoIcon className="w-5 h-5"/>
                                    <span>Our AI assistant is temporarily unavailable.</span>
                                </div>
                                <button onClick={(e) => handleSubmitAI(e as any)} className="self-start px-4 py-2 bg-white hover:bg-white text-[#0F172A] dark:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 dark:bg-slate-800">
                                    <ArrowPathIcon className="w-4 h-4" /> Retry Request
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-4">
                                <div className="p-2 bg-primary/20 rounded-lg h-fit">
                                    <LightBulbIcon className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <FormattedAnswer text={answer} />
                                    <div className="mt-4 flex gap-2">
                                        <button className="text-xs font-bold text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white bg-slate-100 dark:bg-slate-700/50 px-3 py-1 rounded-full transition-colors">Was this helpful?</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Topics */}
                <div className="lg:col-span-2 bg-slate-200 dark:bg-slate-900 rounded-2xl shadow-digital p-6 border border-slate-100 dark:border-white/10">
                     <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-4">Common Topics</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {supportTopics.map(topic => {
                            const Icon = topic.icon;
                            return (
                                 <button 
                                    key={topic.title} 
                                    onClick={(e) => handleSubmitAI(e, topic.query)} 
                                    className="flex items-start space-x-4 p-4 text-left bg-white dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-white/10 hover:border-primary/50 hover:bg-white dark:hover:bg-slate-100 dark:bg-slate-700 transition-all group shadow-sm"
                                >
                                    <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-[#0F172A] group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-[#0F172A] dark:text-[#1E293B] block text-sm mb-1">{topic.title}</span>
                                        <span className="text-xs text-[#0F172A] dark:text-white group-hover:text-[#0F172A] dark:group-hover:text-[#0F172A] dark:text-white line-clamp-1">{topic.query}</span>
                                    </div>
                                </button>
                            )
                        })}
                     </div>
                </div>

                {/* Contact Channels Preview */}
                <div className="lg:col-span-1 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-digital p-6 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white">
                    <h3 className="text-lg font-bold mb-4">Need more help?</h3>
                    <div className="space-y-4">
                        <button onClick={onContactSupport} className="w-full flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-white transition-colors dark:bg-slate-800">
                            <ChatBubbleLeftRightIcon className="w-5 h-5 text-primary" />
                            <span className="text-sm font-bold">24/7 Live Agent Chat</span>
                        </button>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg dark:bg-slate-800">
                            <PhoneIcon className="w-5 h-5 text-green-400" />
                            <span className="text-sm font-bold">Priority Voice Support</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg dark:bg-slate-800">
                            <EnvelopeIcon className="w-5 h-5 primary-" />
                            <span className="text-sm font-bold">Secure Message Center</span>
                        </div>
                    </div>
                    {/* This button is purely visual here as the main interaction is via the modal triggered elsewhere, 
                        but ideally this would also trigger the modal if passed as a prop. For now, it guides users. */}
                    <p className="text-xs text-[#0F172A] dark:text-white mt-6 text-center">Access the full Support Concierge via the menu or dashboard.</p>
                </div>
            </div>

            {/* Real-time Complaint Tracking System */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-digital border border-slate-200 dark:border-white/10 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-white/10">
                    <h3 className="text-xl font-bold text-[#0F172A] dark:text-white flex items-center gap-3">
                        <ChatBubbleLeftRightIcon className="w-6 h-6 text-primary" />
                        Real-Time Complaint Tracking & Support Tickets
                    </h3>
                    <p className="text-[#0F172A] dark:text-white mt-2 text-sm">Submit your complaints or issues securely. Our global support team will respond directly via Firebase in real-time.</p>
                </div>
                
                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h4 className="text-lg font-bold text-[#0F172A] dark:text-white mb-4">Submit a New Ticket</h4>
                        <form onSubmit={handleSubmitComplaint} className="space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden text-[#0F172A] dark:text-white quill-support-editor">
                                <textarea
                                    value={newComplaint}
                                    onChange={(e) => setNewComplaint(e.target.value)}
                                    placeholder="Describe your issue or complaint in detail..."
                                    className="w-full min-h-[150px] p-4 bg-transparent outline-none text-[#0F172A] dark:text-white resize-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submittingComplaint || !newComplaint.trim()}
                                className="w-full py-3 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white font-bold rounded-xl shadow-lg disabled:opacity-70 transition-colors flex justify-center items-center gap-2"
                            >
                                {submittingComplaint ? <SpinnerIcon className="w-5 h-5" /> : 'Submit Complaint'}
                            </button>
                        </form>
                    </div>
                    
                    <div className="border-l border-slate-100 dark:border-white/10 pl-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        <h4 className="text-lg font-bold text-[#0F172A] dark:text-white mb-4">Your Recent Complaints</h4>
                        <div className="space-y-4">
                            {complaints.length === 0 ? (
                                <p className="text-[#0F172A] text-sm">You have no active or previous complaints on record.</p>
                            ) : (
                                complaints.map((comp) => (
                                    <div key={comp.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-xl">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${comp.status === 'Open' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                                                {comp.status || 'Pending'}
                                            </span>
                                            <span className="text-xs text-[#0F172A]">{comp.createdAt?.toDate ? comp.createdAt.toDate().toLocaleDateString() : 'Just now'}</span>
                                        </div>
                                        <div className="text-sm text-[#0F172A] dark:text-white prose prose-slate dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: comp.text }} />
                                        {comp.response && (
                                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 bg-primary/5 p-3 rounded-lg">
                                                <p className="text-xs text-primary font-bold mb-1">Support Response:</p>
                                                <div className="text-sm text-[#0F172A] dark:text-white prose prose-slate dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: comp.response }} />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* System Updates */}
            <div className="bg-slate-200 dark:bg-slate-900 rounded-2xl shadow-digital border border-slate-100 dark:border-white/10">
                <div className="p-6 border-b border-slate-300 dark:border-white/10 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">System Updates</h3>
                    {updatesError ? (
                        <button onClick={fetchUpdates} className="text-primary text-xs font-bold hover:underline">Retry</button>
                    ) : (
                        <span className="text-xs text-[#0F172A] font-mono">v2.4.0-stable</span>
                    )}
                </div>
                <div className="p-6">
                    {isLoadingUpdates ? (
                        <div className="flex justify-center p-8"><SpinnerIcon className="w-8 h-8 text-primary" /></div>
                    ) : updatesError ? (
                        <div className="flex items-center space-x-3 text-yellow-600 bg-yellow-500/10 p-4 rounded-lg"><InfoIcon className="w-5 h-5"/><span>Could not load system updates.</span></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {updates.map(update => <SystemUpdateCard key={update.id} update={update} />)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
