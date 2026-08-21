
import React, { useState, useEffect, useRef } from 'react';
import { 
    SpinnerIcon, 
    CheckCircleIcon, 
    XIcon, 
    QuestionMarkCircleIcon, 
    ChatBubbleLeftRightIcon, 
    EnvelopeIcon, 
    PhoneIcon, 
    ShieldCheckIcon, 
    ExclamationCircleIcon, 
    LockClosedIcon, 
    PaperClipIcon, 
    ClockIcon, 
    CalendarDaysIcon,
    ArrowRightIcon,
    DocumentCheckIcon
} from './Icons';
import { db } from '../services/database';

interface ContactSupportModalProps {
    onClose: () => void;
    onSubmit: (data: { topic: string; transactionId?: string; message: string; attachmentUrl?: string }) => Promise<void>;
    transactions: { id: string }[];
    initialTransactionId?: string;
}

type Step = 'triage' | 'channel_selection' | 'chat' | 'message_form' | 'call_schedule' | 'success';
type Urgency = 'low' | 'medium' | 'high' | 'critical';

const SUPPORT_TOPICS = [
    { id: 'fraud', label: 'Report Fraud', icon: ExclamationCircleIcon, urgency: 'critical' as Urgency },
    { id: 'transaction', label: 'Transaction Dispute', icon: DocumentCheckIcon, urgency: 'high' as Urgency },
    { id: 'account', label: 'Account Access', icon: LockClosedIcon, urgency: 'medium' as Urgency },
    { id: 'card', label: 'Card Management', icon: ShieldCheckIcon, urgency: 'medium' as Urgency },
    { id: 'general', label: 'General Inquiry', icon: QuestionMarkCircleIcon, urgency: 'low' as Urgency },
    { id: 'advisory', label: 'Wealth Advisory', icon: CalendarDaysIcon, urgency: 'low' as Urgency },
];

const CHANNELS = [
    { id: 'chat', label: 'Live Agent Chat', icon: ChatBubbleLeftRightIcon, waitTime: '< 1 min', recommendedFor: ['general', 'account', 'card'] },
    { id: 'call', label: 'Priority Voice Support', icon: PhoneIcon, waitTime: '2 mins', recommendedFor: ['fraud', 'critical'] },
    { id: 'message', label: 'Secure Message Center', icon: EnvelopeIcon, waitTime: '24 hrs', recommendedFor: ['transaction', 'advisory'] },
];

export const ContactSupportModal: React.FC<ContactSupportModalProps> = ({ onClose, onSubmit, transactions, initialTransactionId }) => {
    const [step, setStep] = useState<Step>('triage');
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [transactionId, setTransactionId] = useState(initialTransactionId || '');
    const [messageBody, setMessageBody] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [ticketId, setTicketId] = useState('');
    const [attachment, setAttachment] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Chat Simulation State
    const [chatMessages, setChatMessages] = useState<{role: 'agent' | 'user' | 'system', text: string}[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isAgentTyping, setIsAgentTyping] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialTransactionId) {
            setSelectedTopic('transaction');
            setStep('channel_selection');
        }
    }, [initialTransactionId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, isAgentTyping]);

    const handleTopicSelect = (topicId: string) => {
        setSelectedTopic(topicId);
        setIsProcessing(true);
        // Simulate AI Triage
        setTimeout(() => {
            setIsProcessing(false);
            setStep('channel_selection');
        }, 800);
    };

    const handleChannelSelect = (channelId: string) => {
        if (channelId === 'chat') {
            setStep('chat');
            initializeChat();
        } else if (channelId === 'message') {
            setStep('message_form');
        } else if (channelId === 'call') {
            setStep('call_schedule');
        }
    };

    const initializeChat = () => {
        setChatMessages([
            { role: 'system', text: 'Establishing secure connection (TLS 1.3)...' },
            { role: 'system', text: 'Verifying identity...' },
            { role: 'system', text: 'Connection established. Reference: CHAT-8829' },
        ]);
        setIsAgentTyping(true);
        setTimeout(() => {
            setChatMessages(prev => [...prev, { role: 'agent', text: `Hello, I'm Sarah, a senior specialist at Premium Reserved Bank. I see you need help with ${SUPPORT_TOPICS.find(t => t.id === selectedTopic)?.label}. How can I assist you today?` }]);
            setIsAgentTyping(false);
        }, 2500);
    };

    const handleChatSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        
        const userMsg = chatInput;
        setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setChatInput('');
        setIsAgentTyping(true);

        // Simulate Agent Response
        setTimeout(() => {
            let response = "I understand. Could you provide a few more details so I can look into that for you immediately?";
            if (userMsg.toLowerCase().includes("thank")) response = "You're welcome! Is there anything else I can help you with?";
            
            setChatMessages(prev => [...prev, { role: 'agent', text: response }]);
            setIsAgentTyping(false);
        }, 2000);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result as string;
                // Upload to Supabase 'documents' bucket in a 'support' folder
                const url = await db.uploadFile(base64, 'documents', 'support');
                setAttachment(url);
                setIsUploading(false);
            };
        }
    };

    const handleSubmitMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const newTicketId = `CAS-${Math.floor(Math.random() * 1000000)}-X${Math.floor(Math.random() * 9)}`;
        setTicketId(newTicketId);
        
        await onSubmit({ 
            topic: selectedTopic || 'General', 
            transactionId, 
            message: messageBody,
            attachmentUrl: attachment || undefined
        });
        
        setIsProcessing(false);
        setStep('success');
    };

    const renderTriage = () => (
        <div className="space-y-4 animate-fade-in-up">
            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-slate-900 rounded-full mb-4 shadow-digital ring-1 ring-white/10">
                    <ChatBubbleLeftRightIcon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-100">How can we help you today?</h3>
                <p className="text-[#0F172A] dark:text-white text-sm mt-2">Select a topic so our AI can route you to the right specialist.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                {SUPPORT_TOPICS.map(topic => (
                    <button
                        key={topic.id}
                        onClick={() => handleTopicSelect(topic.id)}
                        className="p-4 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-700 border border-slate-100 dark:border-white/10 rounded-xl text-left transition-all hover:shadow-lg group"
                    >
                        <div className={`p-2 rounded-lg inline-block mb-3 ${topic.urgency === 'critical' ? 'bg-red-500 text-red-400' : 'bg-primary/20 text-primary'}`}>
                            <topic.icon className="w-6 h-6" />
                        </div>
                        <p className="font-semibold text-[#0F172A] dark:text-[#1E293B] group-hover:text-[#0F172A] dark:text-white">{topic.label}</p>
                        {topic.urgency === 'critical' && <span className="text-[10px] text-red-400 uppercase font-bold tracking-wider">Priority</span>}
                    </button>
                ))}
            </div>
        </div>
    );

    const renderChannelSelection = () => {
        const currentTopic = SUPPORT_TOPICS.find(t => t.id === selectedTopic);
        return (
            <div className="space-y-6 animate-fade-in-up">
                <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-white/10">
                    <button onClick={() => setStep('triage')} className="text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white"><ArrowRightIcon className="w-5 h-5 rotate-180"/></button>
                    <div>
                        <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">{currentTopic?.label}</h3>
                        <p className="text-xs text-[#0F172A] dark:text-white">Recommended Support Channels</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {CHANNELS.map(channel => {
                        const isRecommended = channel.recommendedFor.includes(selectedTopic || '') || (selectedTopic === 'fraud' && channel.id === 'call');
                        return (
                            <button
                                key={channel.id}
                                onClick={() => handleChannelSelect(channel.id)}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${isRecommended ? 'bg-primary/10 border-primary/50 hover:bg-primary/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/10 hover:bg-slate-100 dark:bg-slate-700'}`}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className={`p-2 rounded-full ${isRecommended ? 'bg-primary text-[#0F172A] dark:text-white' : 'bg-slate-100 dark:bg-slate-700 text-[#0F172A] dark:text-white'}`}>
                                        <channel.icon className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-[#0F172A] dark:text-[#1E293B]">{channel.label}</p>
                                        <p className="text-xs text-[#0F172A] dark:text-white flex items-center gap-1">
                                            <ClockIcon className="w-3 h-3" /> Est. Wait: {channel.waitTime}
                                        </p>
                                    </div>
                                </div>
                                {isRecommended && (
                                    <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-1 rounded uppercase">Best Option</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderChat = () => (
        <div className="flex flex-col h-[500px] animate-fade-in-up">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-t-2xl">
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <div className="w-10 h-10 primary- rounded-full flex items-center justify-center text-[#0F172A] dark:text-white font-bold">S</div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-200 dark:border-slate-700 rounded-full"></div>
                    </div>
                    <div>
                        <p className="font-bold text-slate-100">Sarah J.</p>
                        <p className="text-xs text-[#0F172A] dark:text-white">Senior Support Specialist</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 text-xs text-green-400 bg-green-500 px-2 py-1 rounded">
                    <LockClosedIcon className="w-3 h-3" />
                    <span>Secure</span>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900 custom-scrollbar">
                {chatMessages.map((msg, i) => {
                    if (msg.role === 'system') {
                        return <p key={i} className="text-center text-xs text-[#0F172A] font-mono my-2">{msg.text}</p>;
                    }
                    return (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-[#0F172A] dark:text-white rounded-br-none' : 'bg-slate-100 dark:bg-slate-700 text-[#0F172A] dark:text-[#1E293B] rounded-bl-none'}`}>
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                {isAgentTyping && (
                    <div className="flex justify-start">
                        <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-2xl rounded-bl-none flex space-x-1 items-center">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleChatSend} className="p-4 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-b-2xl flex items-center gap-2">
                <button type="button" className="p-2 text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white hover:bg-white rounded-full dark:bg-slate-800">
                    <PaperClipIcon className="w-5 h-5" />
                </button>
                <input 
                    type="text" 
                    value={chatInput} 
                    onChange={(e) => setChatInput(e.target.value)} 
                    placeholder="Type your message securely..." 
                    className="flex-grow bg-slate-50 dark:bg-slate-900 border border-slate-600 text-[#0F172A] dark:text-[#1E293B] rounded-full px-4 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <button type="submit" className="p-2 bg-primary text-[#0F172A] dark:text-white rounded-full hover:bg-primary-600 transition-colors">
                    <ArrowRightIcon className="w-5 h-5" />
                </button>
            </form>
        </div>
    );

    const renderMessageForm = () => (
        <form onSubmit={handleSubmitMessage} className="space-y-4 animate-fade-in-up">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-white/10">
                <button type="button" onClick={() => setStep('channel_selection')} className="text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white"><ArrowRightIcon className="w-5 h-5 rotate-180"/></button>
                <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Secure Message Center</h3>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-xl text-sm text-[#0F172A] dark:text-white">
                <p>You are submitting a formal inquiry regarding <strong>{SUPPORT_TOPICS.find(t => t.id === selectedTopic)?.label}</strong>.</p>
            </div>

            {selectedTopic === 'transaction' && (
                <div>
                    <label className="block text-sm font-bold text-[#0F172A] dark:text-white mb-1">Transaction Reference</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={transactionId} 
                            onChange={(e) => setTransactionId(e.target.value)} 
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-600 rounded-lg p-3 text-[#0F172A] dark:text-[#1E293B] pl-10"
                            placeholder="Paste Transaction ID"
                        />
                        <DocumentCheckIcon className="w-5 h-5 text-[#0F172A] absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-bold text-[#0F172A] dark:text-white mb-1">Detailed Description</label>
                <textarea 
                    value={messageBody} 
                    onChange={(e) => setMessageBody(e.target.value)} 
                    rows={6} 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-600 rounded-lg p-3 text-[#0F172A] dark:text-[#1E293B] focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="Please provide as much detail as possible..."
                    required
                />
            </div>

            <div className="flex items-center justify-between text-xs text-[#0F172A]">
                <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center space-x-1 hover:text-primary transition-colors disabled:opacity-70"
                >
                    {isUploading ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : <PaperClipIcon className="w-4 h-4" />}
                    <span>{attachment ? 'File Attached' : 'Attach Documents'}</span>
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange}
                />
                <span>Max 10MB</span>
            </div>
            
            {attachment && <p className="text-xs text-green-400">File uploaded successfully.</p>}

            <button 
                type="submit" 
                disabled={isProcessing || isUploading} 
                className="w-full py-3 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70"
            >
                {isProcessing ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <EnvelopeIcon className="w-5 h-5" />}
                <span>Submit Secure Ticket</span>
            </button>
        </form>
    );

    const renderCallSchedule = () => (
        <div className="text-center py-8 animate-fade-in-up">
            <EnvelopeIcon className="w-16 h-16 text-[#0F172A] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Priority Direct Support</h3>
            <p className="text-[#0F172A] dark:text-white text-sm mt-2 mb-6">
                Our specialists are available 24/7 for critical issues. <br/>
                Expected response time is currently <strong>2 minutes</strong>.
            </p>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-white/10 mb-6">
                <p className="text-2xl font-mono font-bold text-primary">contact@firstpaba.com</p>
                <p className="text-xs text-[#0F172A] mt-1">Include PIN: <strong>8492</strong> in the subject for express verification.</p>
            </div>
            <button onClick={() => setStep('triage')} className="text-sm text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white">Return to options</button>
        </div>
    );

    const renderSuccess = () => (
        <div className="text-center py-8 animate-fade-in-up">
            <div className="w-20 h-20 bg-green-500 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-green-500/50">
                <CheckCircleIcon className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-[#0F172A] dark:text-white">Request Submitted</h3>
            <p className="text-[#0F172A] dark:text-white mt-2">We have received your inquiry.</p>
            
            <div className="mt-6 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/10 text-left">
                <div className="flex justify-between mb-2">
                    <span className="text-[#0F172A] text-sm">Ticket Reference</span>
                    <span className="text-[#0F172A] dark:text-white font-mono font-bold">{ticketId}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-[#0F172A] text-sm">Est. Response</span>
                    <span className="text-[#0F172A] dark:text-white text-sm">Within 24 Hours</span>
                </div>
            </div>
            
            <p className="text-xs text-[#0F172A] mt-6">A confirmation email has been sent to your registered address.</p>
            <button onClick={onClose} className="mt-6 w-full py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-600 text-[#0F172A] dark:text-white rounded-xl font-bold">Close</button>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-slate-100  z-[80] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-300 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Modal Header */}
                <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <ShieldCheckIcon className="w-5 h-5 text-green-400" />
                        <span className="text-sm font-bold text-[#0F172A] dark:text-[#1E293B] uppercase tracking-wide">Secure Support Concierge</span>
                    </div>
                    <button onClick={onClose} className="p-2 text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white rounded-full hover:bg-white transition-colors dark:bg-slate-800">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="p-6 overflow-y-auto">
                    {step === 'triage' && renderTriage()}
                    {step === 'channel_selection' && renderChannelSelection()}
                    {step === 'chat' && renderChat()}
                    {step === 'message_form' && renderMessageForm()}
                    {step === 'call_schedule' && renderCallSchedule()}
                    {step === 'success' && renderSuccess()}
                </div>

                {/* Footer Disclaimer */}
                {step !== 'chat' && (
                    <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-100 text-center">
                        <p className="text-[10px] text-[#0F172A]">
                            <LockClosedIcon className="w-3 h-3 inline mr-1" />
                            All communications are encrypted and monitored for quality assurance.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
