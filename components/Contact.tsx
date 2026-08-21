
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FAQS } from './constants';
import { PhoneIcon, EnvelopeIcon, ChatBubbleLeftRightIcon, MapPinIcon, ChevronDownIcon, SparklesIcon } from './Icons';

interface ContactProps {
    onContactSupport: () => void;
}

const ContactCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; action?: React.ReactNode }> = ({ icon, title, children, action }) => (
    <div className="bg-slate-200 rounded-2xl shadow-digital p-6">
        <div className="flex items-center space-x-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shadow-digital text-primary">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-[#1E293B]">{title}</h3>
        </div>
        <div className="text-sm text-[#0F172A] space-y-2">
            {children}
        </div>
        {action && <div className="mt-4">{action}</div>}
    </div>
);

const FaqItem: React.FC<{ faq: { question: string, answer: string } }> = ({ faq }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-slate-300 last:border-b-0">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left py-4">
                <span className="font-semibold text-[#1E293B]">{faq.question}</span>
                <ChevronDownIcon className={`w-5 h-5 text-[#0F172A] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="pb-4 text-sm text-[#0F172A] animate-fade-in-down">
                    {faq.answer}
                </div>
            )}
            <style>{`
                @keyframes fade-in-down {
                    0% { opacity: 0; transform: translateY(-10px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down { animation: fade-in-down 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export const Contact: React.FC<ContactProps> = ({ onContactSupport }) => {
    return (
        <div className="space-y-12 max-w-5xl mx-auto">
            <div className="text-center">
                <h2 className="text-4xl font-extrabold text-[#1E293B]">Get in Touch</h2>
                <p className="text-lg text-[#0F172A] mt-2 max-w-2xl mx-auto">We're available 24/7 to help you with any questions or concerns. Choose the method that works best for you.</p>
            </div>

            {/* Quick Link to AI Support */}
            <div className="bg-gradient-to-r from-primary-500 primary- rounded-2xl p-8 text-[#0F172A] dark:text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                    <SparklesIcon className="w-10 h-10 flex-shrink-0" />
                    <div>
                        <h3 className="text-2xl font-bold">Need a Quick Answer?</h3>
                        <p className="opacity-90">Our AI Assistant can answer most questions instantly.</p>
                    </div>
                </div>
                <Link to="/support" className="bg-white text-primary font-bold py-3 px-6 rounded-lg shadow-md hover:bg-slate-100 transition-colors flex-shrink-0 dark:bg-slate-800">
                    Ask AI Assistant
                </Link>
            </div>

            {/* Contact Methods Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <ContactCard icon={<PhoneIcon className="w-6 h-6" />} title="Email Support">
                    <p><strong>General inquiries:</strong><br/><a href="mailto:info@firstpaba.com" className="text-primary hover:underline">info@firstpaba.com</a></p>
                    <p><strong>Support & Security:</strong><br/><a href="mailto:contact@firstpaba.com" className="text-primary hover:underline">contact@firstpaba.com</a></p>
                    <p className="text-xs">Response within 24 business hours.</p>
                </ContactCard>
                <ContactCard icon={<EnvelopeIcon className="w-6 h-6" />} title="Leadership">
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="relative">
                            <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256&auto=format&fit=crop" alt="Michael Olivia Br" className="w-14 h-14 rounded-full shadow-lg object-cover border-2 border-primary/20" referrerPolicy="no-referrer" />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-200"></div>
                        </div>
                        <div>
                            <p className="font-bold text-[#1E293B] text-lg leading-tight">Michael Olivia Br</p>
                            <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-0.5">Co-Founder & CEO</p>
                        </div>
                    </div>
                    <p className="text-sm text-[#0F172A] mb-4 leading-relaxed">Overseeing Global Strategy and Premium Client Relationships at First Pacific Bank.</p>
                    <a href="mailto:contact@firstpaba.com?subject=Private%20Client%20Inquiry%20-%20Michael%20Olivia" className="w-full py-2.5 text-xs font-bold text-primary border border-primary/30 rounded-lg shadow-sm hover:bg-primary hover:text-[#0F172A] dark:text-white transition-all flex justify-center items-center gap-2 group">
                        <EnvelopeIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        MESSAGE DIRECTLY
                    </a>
                </ContactCard>
                <ContactCard icon={<ChatBubbleLeftRightIcon className="w-6 h-6" />} title="Live Chat" action={
                    <button onClick={onContactSupport} className="w-full py-2 text-sm font-bold text-[#0F172A] dark:text-white bg-primary rounded-lg shadow-md">
                        Start Live Chat
                    </button>
                }>
                    <p className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span>Available Now</span>
                    </p>
                    <p>Get connected with a support agent in minutes for real-time assistance.</p>
                </ContactCard>
            </div>

            {/* FAQ Section */}
            <div className="bg-slate-200 rounded-2xl shadow-digital">
                <div className="p-6 border-b border-slate-300">
                    <h3 className="text-xl font-bold text-[#1E293B]">Frequently Asked Questions</h3>
                </div>
                <div className="px-6">
                    {FAQS.map((faq, i) => <FaqItem key={i} faq={faq} />)}
                </div>
            </div>

             {/* Headquarters Location */}
            <div className="bg-slate-200 rounded-2xl shadow-digital p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="md:col-span-1">
                    <h3 className="text-xl font-bold text-[#1E293B] mb-4 flex items-center"><MapPinIcon className="w-6 h-6 mr-2 text-primary" /> Global Headquarters</h3>
                    <address className="not-italic text-[#0F172A]">
                        <strong>First Pacific Bank (Rockefeller Center)</strong><br/>
                        45 Rockefeller Plaza<br/>
                        New York, NY 10111<br/>
                        United States<br/><br/>
                        <a href="mailto:info@firstpaba.com" className="text-primary hover:underline">info@firstpaba.com</a><br/>
                        <a href="mailto:contact@firstpaba.com" className="text-primary hover:underline">contact@firstpaba.com</a>
                    </address>
                 </div>
                 <div className="md:col-span-2 h-64 rounded-lg overflow-hidden shadow-inner bg-slate-300">
                     <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1564041956192-383a7364a932?q=80&w=2940&auto=format&fit=crop')" }}></div>
                 </div>
            </div>

        </div>
    );
};
