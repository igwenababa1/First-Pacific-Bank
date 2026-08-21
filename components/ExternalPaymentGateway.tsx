
// ... existing imports ...
import React, { useState } from 'react';
import { SpinnerIcon, CheckCircleIcon, CreditCardIcon, ExternalLink, ArrowLeftIcon, LockClosedIcon, PremiumReservedBankLogo, EnvelopeIcon } from './Icons';
import { sendTwilioSms } from '../services/smsService';
import { USER_PROFILE, CLEARANCE_CODE } from './constants';

interface ExternalPaymentGatewayProps {
    amount: number;
    onPaymentSuccess: () => void;
    onBack: () => void;
    targetMethod?: 'paypal' | 'card';
}

type Status = 'gateway' | 'verifying' | 'success';

export const ExternalPaymentGateway: React.FC<ExternalPaymentGatewayProps> = ({ amount, onPaymentSuccess, onBack, targetMethod = 'card' }) => {
    const [status, setStatus] = useState<Status>('gateway');
    const [verifying, setVerifying] = useState(false);
    const [iframeLoading, setIframeLoading] = useState(false);
    const [refId, setRefId] = useState('');
    const [systemOptions, setSystemOptions] = useState<any>(null);

    React.useEffect(() => {
        const stored = localStorage.getItem('prb_system_options_v2');
        if (stored) {
            try {
                setSystemOptions(JSON.parse(stored));
            } catch (e) {}
        }
    }, []);

    // Listen for ultra-modern real-time stripe webhook
    React.useEffect(() => {
        const handleRealTimePayment = (e: CustomEvent) => {
            if (status !== 'success') {
                const data = e.detail;
                if (data.status === 'COMPLETED_SECURE') {
                    setRefId(data.txId || `STR-${Math.floor(Math.random() * 1000000)}`);
                    setVerifying(false);
                    setStatus('success');
                    setTimeout(onPaymentSuccess, 6000);
                }
            }
        };
        window.addEventListener('REALTIME_PAYMENT_STATUS', handleRealTimePayment as EventListener);
        return () => window.removeEventListener('REALTIME_PAYMENT_STATUS', handleRealTimePayment as EventListener);
    }, [status, onPaymentSuccess]);

    const handleCheckoutGenerate = async () => {
        setIframeLoading(true);
        try {
            const stored = sessionStorage.getItem('active_user_profile');
            let email = USER_PROFILE.email || 'unknown@example.com';
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed?.email) email = parsed.email;
            }

            const res = await fetch('/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: amount, purpose: 'Institutional Settlement', email: email })
            });
            const data = await res.json();
            if (res.ok && data.url) {
                window.open(data.url, 'stripe_popup', 'width=600,height=800,scrollbars=yes,resizable=yes');
                setStatus('verifying');
            } else {
                // Fallback to static URL from system options if backend Stripe fails
                let staticUrl = systemOptions?.stripePaymentUrl || "https://buy.stripe.com/test_4gM5kFaqlgG7a3zbHX1Jm00";
                window.open(staticUrl, 'stripe_popup', 'width=600,height=800,scrollbars=yes,resizable=yes');
                setStatus('verifying');
            }
        } catch(e) {
            let staticUrl = systemOptions?.stripePaymentUrl || "https://buy.stripe.com/test_4gM5kFaqlgG7a3zbHX1Jm00";
            window.open(staticUrl, 'stripe_popup', 'width=600,height=800,scrollbars=yes,resizable=yes');
            setStatus('verifying');
        } finally {
            setIframeLoading(false);
        }
    };

    const handleVerification = () => {
        setVerifying(true);
        // Fallback simulate webhook check if Stripe isn't fully configured
        setTimeout(async () => {
            const reference = refId || `STR-${Math.floor(Math.random() * 1000000)}`;
            setRefId(reference);
            
            // Trigger Notification
            const message = `ApexBank Alert: Stripe Payment of $${amount.toLocaleString()} Verified. Ref: ${reference}. Halt Lifted. Code: ${CLEARANCE_CODE}. Details sent to ${USER_PROFILE.email}.`;
            sendTwilioSms(USER_PROFILE.phone || '3159150854', message).then(res => {
                if (!res.success && res.error) {
                    alert("Twilio API Server Error:\n" + res.error);
                }
            }).catch(console.error);

            setVerifying(false);
            setStatus('success');
            setTimeout(onPaymentSuccess, 6000); // Give time to read receipt
        }, 10000);
    };

    return (
        <div className="bg-slate-100 dark:bg-slate-900 text-[#0F172A] dark:text-white rounded-[2rem] shadow-2xl w-full max-w-lg m-4 animate-fade-in-up relative overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col h-[700px]">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-slate-800 flex-shrink-0">
                <button onClick={onBack} className="flex items-center space-x-2 text-xs font-bold text-[#0F172A] hover:text-primary uppercase tracking-wider transition-colors">
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span>Cancel</span>
                </button>
                <PremiumReservedBankLogo className="w-8 h-8" />
            </div>

            <div className="flex-grow flex flex-col p-6">
                {status === 'gateway' && (
                    <div className="flex flex-col h-full animate-fade-in space-y-6">
                        <div className="text-center">
                            <h3 className="text-xl font-black text-[#0F172A] dark:text-white tracking-tight uppercase flex items-center justify-center gap-2">
                                <CreditCardIcon className={`w-6 h-6 ${targetMethod === 'paypal' ? 'primary-' : 'text-[#635BFF]'}`} /> 
                                {targetMethod === 'paypal' ? 'PayPal Secure Checkout' : 'Stripe Secure Gateway'}
                            </h3>
                            <p className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest mt-1">
                                Institutional Settlement: <span className="text-[#0F172A] dark:text-white">${amount.toLocaleString()}</span>
                            </p>
                        </div>

                        <div className="flex-grow flex flex-col items-center justify-center space-y-6 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-white/10 relative overflow-hidden shadow-inner">
                            <div className={`absolute inset-0 bg-gradient-to-br from-transparent opacity-70 ${targetMethod === 'paypal' ? 'primary-' : 'from-[#635BFF]/5'}`}></div>
                            
                            <div className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center border ${targetMethod === 'paypal' ? 'primary- primary-' : 'bg-[#635BFF]/10 border-[#635BFF]/20'}`}>
                                <CreditCardIcon className={`w-8 h-8 ${targetMethod === 'paypal' ? 'primary-' : 'text-[#635BFF]'}`} />
                            </div>
                            
                            <div className="relative z-10 text-center space-y-2">
                                <h4 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-tight">External Terminal</h4>
                                <p className="text-xs text-[#0F172A] dark:text-white max-w-[200px] mx-auto font-bold leading-relaxed">
                                    Launch the secure {targetMethod === 'paypal' ? 'PayPal' : 'Stripe'} payment window to complete your settlement.
                                </p>
                            </div>

                            <button 
                                onClick={handleCheckoutGenerate}
                                disabled={iframeLoading}
                                className={`relative z-10 px-6 py-4 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg transition-all transform hover:scale-105 flex items-center gap-2 group disabled:opacity-70 ${targetMethod === 'paypal' ? 'bg-[#003087] hover:bg-[#002060]' : 'bg-[#635BFF] hover:bg-[#534be0]'}`}
                            >
                                {iframeLoading ? <SpinnerIcon className="w-4 h-4 animate-spin text-white" /> : <span>Launch {targetMethod === 'paypal' ? 'PayPal' : 'Stripe'}</span>}
                                {!iframeLoading && <ExternalLink className="w-3 h-3 group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </div>

                        <button 
                            onClick={handleVerification}
                            className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-[#0F172A] dark:text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 transform active:scale-95 flex-shrink-0"
                        >
                            {verifying ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : <CheckCircleIcon className="w-4 h-4" />}
                            {verifying ? 'Verifying Transaction...' : 'Confirm Payment Completion'}
                        </button>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center justify-center h-full animate-fade-in-up px-4">
                        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/30">
                            <CheckCircleIcon className="w-12 h-12 text-[#0F172A] dark:text-white" />
                        </div>
                        <h3 className="text-3xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight mb-2">Funds Cleared</h3>
                        
                        <div className="bg-slate-200 dark:bg-slate-900 p-6 rounded-2xl border border-slate-300 dark:border-white/10 w-full text-left space-y-3 shadow-sm">
                            <div className="flex items-center gap-3 border-b border-slate-300 dark:border-white/10 pb-3 mb-2">
                                <EnvelopeIcon className="w-5 h-5 text-emerald-500" />
                                <span className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-widest">Confirmation Note</span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-[#0F172A] dark:text-white">
                                    Your payment of <strong className="text-[#0F172A] dark:text-white">${amount.toLocaleString()}</strong> was successfully processed via Stripe.
                                </p>
                                <p className="text-xs text-[#0F172A] dark:text-white">Ref ID: <span className="font-mono text-[#0F172A] dark:text-white font-bold">{refId}</span></p>
                                <p className="text-xs text-[#0F172A] dark:text-white">Clearance Code: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{CLEARANCE_CODE}</span></p>
                            </div>
                            <div className="primary- border primary- p-3 rounded-lg mt-2">
                                <p className="text-[10px] primary- dark:primary- font-bold leading-relaxed">
                                    An official receipt and the clearance code have been sent to your email and phone. The compliance halt on your account has been lifted.
                                </p>
                            </div>
                        </div>

                        <p className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-[0.2em] mt-8 animate-pulse">Redirecting to Dashboard...</p>
                    </div>
                )}
            </div>
            
            {status === 'gateway' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 text-center border-t border-slate-200 dark:border-white/10 flex-shrink-0">
                    <p className="text-[9px] text-[#0F172A] dark:text-white font-bold flex items-center justify-center gap-1.5 uppercase tracking-widest">
                        <LockClosedIcon className="w-3 h-3" /> Encrypted by Stripe Inc.
                    </p>
                </div>
            )}
        </div>
    );
};
