import React, { useEffect } from 'react';
import { XIcon } from './Icons';

interface LegalModalProps {
    title: string;
    content: string;
    onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ title, content, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-slate-100  z-[100] flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-modal-title"
        >
            <div 
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl h-[90vh] flex flex-col border border-slate-200 dark:border-white/10 animate-fade-in-up"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-300 flex items-center justify-between">
                    <h2 id="legal-modal-title" className="text-xl font-bold text-slate-100">{title}</h2>
                    <button onClick={onClose} className="p-2 text-[#0F172A] dark:text-white hover:bg-slate-100 dark:bg-slate-700 rounded-full" aria-label="Close">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>
                <div 
                    className="flex-grow p-6 overflow-y-auto text-[#0F172A] dark:text-white prose-styles"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            </div>
            <style>{`
                .prose-styles h3 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #f1f5f9;
                    margin-top: 1.5em;
                    margin-bottom: 0.5em;
                }
                .prose-styles p {
                    line-height: 1.6;
                    margin-bottom: 1em;
                }
                .prose-styles ul {
                    list-style-type: disc;
                    padding-left: 1.5em;
                    margin-bottom: 1em;
                }
                .prose-styles li {
                    margin-bottom: 0.5em;
                }
                .prose-styles a {
                    color: #60a5fa;
                    text-decoration: none;
                }
                .prose-styles a:hover {
                    text-decoration: underline;
                }

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