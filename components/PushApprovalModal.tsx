import React, { useState, useEffect } from 'react';
import { SpinnerIcon, DevicePhoneMobileIcon, CheckCircleIcon } from './Icons';

interface PushApprovalModalProps {
    transactionId: string;
    onAuthorize: (transactionId: string) => void;
    onClose: () => void;
}

export const PushApprovalModal: React.FC<PushApprovalModalProps> = ({ transactionId, onAuthorize, onClose }) => {
    const [status, setStatus] = useState<'waiting' | 'approving' | 'approved'>('waiting');

    useEffect(() => {
        // Simulate user taking time to approve on their other device
        const waitTimer = setTimeout(() => {
            setStatus('approving');
        }, 3000);

        return () => clearTimeout(waitTimer);
    }, []);
    
    useEffect(() => {
        if (status === 'approving') {
            // Simulate API call to check for approval
            const approvalTimer = setTimeout(() => {
                onAuthorize(transactionId);
                setStatus('approved');
            }, 2000);
            return () => clearTimeout(approvalTimer);
        } else if (status === 'approved') {
            // Close modal after showing success message
            const closeTimer = setTimeout(() => {
                onClose();
            }, 1500);
            return () => clearTimeout(closeTimer);
        }
    }, [status, onAuthorize, onClose, transactionId]);

    const renderContent = () => {
        switch (status) {
            case 'waiting':
            case 'approving':
                return (
                    <>
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-slate-900 rounded-full mb-4 ring-8 ring-primary/20 animate-pulse">
                            <DevicePhoneMobileIcon className="w-10 h-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-100">Approve From Your Device</h3>
                        <p className="text-[#0F172A] dark:text-white mt-2">A push notification has been sent to your primary device. Please review and approve the transaction to proceed.</p>
                        {status === 'approving' && <SpinnerIcon className="w-8 h-8 text-primary mx-auto mt-6" />}
                    </>
                );
            case 'approved':
                return (
                    <div className="animate-fade-in-up">
                        <CheckCircleIcon className="w-20 h-20 text-green-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-slate-100">Transaction Approved</h3>
                        <p className="text-[#0F172A] dark:text-white mt-2">Your transfer is now being processed.</p>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-100  flex items-center justify-center z-[70] p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md m-4 border border-primary/50 animate-fade-in-up">
                <div className="p-8 text-center">
                    {renderContent()}
                </div>
            </div>
            <style>{`
                @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                @keyframes fade-in-up {
                0% { opacity: 0; transform: translateY(20px) scale(0.95); }
                100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.4s ease-out forwards; }
            `}</style>
        </div>
    );
};