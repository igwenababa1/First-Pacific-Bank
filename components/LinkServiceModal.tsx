
import React, { useState, useEffect } from 'react';
import { SpinnerIcon, CheckCircleIcon, ShieldCheckIcon, LockClosedIcon, ServerIcon, GlobeAltIcon, XIcon, getServiceIcon } from './Icons';
import { establishSecureConnection, getServiceUrl } from '../services/secureRoutingService';
import { BRANDING_CONFIG } from './constants';

interface LinkServiceModalProps {
    serviceName: string;
    onClose: () => void;
    onLink: (serviceName: string, identifier: string) => void;
}

type Step = 'consent' | 'connecting' | 'success';

const connectionLogs = [
    "Initializing secure handshake...",
    "Verifying SSL/TLS certificates...",
    "Requesting authorization token...",
    "Validating merchant credentials...",
    "Establishing encrypted tunnel...",
    "Syncing historical transaction data...",
    "Finalizing connection..."
];

export const LinkServiceModal: React.FC<LinkServiceModalProps> = ({ serviceName, onClose, onLink }) => {
    const [step, setStep] = useState<Step>('consent');
    const [identifier, setIdentifier] = useState('');
    const [logIndex, setLogIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    
    const ServiceIcon = getServiceIcon(serviceName);
    
    // Determine input type based on service
    const isBank = ['Chase', 'Bank of America', 'Wells Fargo', 'Citi', 'Capital One', 'Chime'].includes(serviceName);
    const identifierType = serviceName === 'CashApp' ? '$Cashtag' : 
                           serviceName === 'Zelle' ? 'Email or Phone' : 
                           isBank ? 'Online Banking ID' : 
                           'Email Address';
    const placeholderText = isBank ? `Enter ${serviceName} Username` : `Enter your ${serviceName} ID`;

    // Connection Simulation + Real API Call
    useEffect(() => {
        if (step === 'connecting') {
            const totalDuration = 3000;
            const intervalTime = totalDuration / connectionLogs.length;
            let isCancelled = false;

            // Visual Logs
            const logInterval = setInterval(() => {
                setLogIndex(prev => {
                    if (prev < connectionLogs.length - 1) return prev + 1;
                    return prev;
                });
            }, intervalTime);

            // Visual Progress
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 95) return 95; // Hold at 95 until API finishes
                    return prev + 2;
                });
            }, totalDuration / 50);

            // Real API Call
            const performHandshake = async () => {
                const targetUrl = getServiceUrl(serviceName);
                await establishSecureConnection(targetUrl);
                
                if (!isCancelled) {
                    setProgress(100);
                    setTimeout(() => {
                        setStep('success');
                    }, 500);
                }
            };

            performHandshake();

            return () => {
                isCancelled = true;
                clearInterval(logInterval);
                clearInterval(progressInterval);
            };
        }
    }, [step, serviceName]);

    const handleConnect = (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier.trim()) return;
        setStep('connecting');
    };

    const handleFinish = () => {
        onLink(serviceName, identifier);
    };

    return (
        <div className="fixed inset-0 bg-slate-100  flex items-center justify-center z-[60] p-4 animate-fade-in">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-300 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden flex flex-col animate-fade-in-up">
                
                {/* Header */}
                <div className="bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-300 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <LockClosedIcon className="w-4 h-4 text-green-400" />
                        <span className="text-xs font-mono text-green-400 uppercase">Secure Connection</span>
                    </div>
                    <button onClick={onClose} className="text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white transition-colors">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="relative inline-block">
                            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg z-10 relative dark:bg-slate-800">
                                {ServiceIcon && <ServiceIcon className="w-12 h-12 object-contain" />}
                            </div>
                            {step === 'connecting' && (
                                <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-xl animate-pulse"></div>
                            )}
                        </div>
                        <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white mt-4">
                            {step === 'consent' ? `Connect ${serviceName}` : step === 'connecting' ? 'Authenticating...' : 'Connected'}
                        </h2>
                    </div>

                    {step === 'consent' && (
                        <form onSubmit={handleConnect} className="space-y-6">
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-white/10 space-y-3">
                                <h4 className="text-sm font-semibold text-[#0F172A] dark:text-white">Permissions Requested:</h4>
                                <ul className="text-xs text-[#0F172A] dark:text-white space-y-2">
                                    <li className="flex items-center gap-2"><CheckCircleIcon className="w-3 h-3 text-primary"/> View account balance and details</li>
                                    <li className="flex items-center gap-2"><CheckCircleIcon className="w-3 h-3 text-primary"/> View transaction history</li>
                                    <li className="flex items-center gap-2"><CheckCircleIcon className="w-3 h-3 text-primary"/> Initiate transfers (requires approval)</li>
                                </ul>
                            </div>

                            <div>
                                <label htmlFor="identifier" className="block text-sm font-bold text-[#0F172A] dark:text-white mb-2">{identifierType}</label>
                                <input
                                    type={isBank ? "text" : "text"} 
                                    id="identifier"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full bg-slate-100 border border-slate-600 text-[#0F172A] dark:text-white p-3 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    placeholder={placeholderText}
                                    autoFocus
                                    required
                                />
                                {isBank && <p className="text-[10px] text-[#0F172A] mt-1 ml-1">We never store your login credentials.</p>}
                            </div>

                            <p className="text-[10px] text-[#0F172A] text-center">
                                By clicking "Agree & Connect", you agree to the First Pacific Bank Third-Party Access Policy and {serviceName}'s Terms of Service.
                            </p>

                            <div className="flex gap-3">
                                <button type="button" onClick={onClose} className="flex-1 py-3 text-[#0F172A] dark:text-white bg-white dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-700 rounded-lg font-bold transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-3 text-[#0F172A] dark:text-white bg-primary hover:bg-primary-600 rounded-lg font-bold shadow-lg shadow-primary/20 transition-all">Agree & Connect</button>
                            </div>
                        </form>
                    )}

                    {step === 'connecting' && (
                        <div className="space-y-6">
                            {/* Visual Connection Graph */}
                            <div className="flex justify-between items-center px-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-10 h-10 rounded-full border border-slate-600 flex items-center justify-center overflow-hidden bg-[#050810]">
                                        <img src={BRANDING_CONFIG.logoUrl} alt="Logo" className="w-full h-full object-contain scale-[0.8]" referrerPolicy="no-referrer" />
                                    </div>
                                    <span className="text-[10px] text-[#0F172A] mt-1">{BRANDING_CONFIG.bankName}</span>
                                </div>
                                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700 mx-2 relative">
                                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_#0052FF] animate-ping-slow" style={{ left: `${progress}%` }}></div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center dark:bg-slate-800">
                                        {ServiceIcon && <ServiceIcon className="w-5 h-5 object-contain" />}
                                    </div>
                                    <span className="text-[10px] text-[#0F172A] mt-1">{serviceName}</span>
                                </div>
                            </div>

                            {/* Terminal Logs */}
                            <div className="bg-slate-100 rounded-lg p-4 font-mono text-xs space-y-1 h-24 overflow-hidden border border-slate-100 dark:border-white/10">
                                {connectionLogs.slice(0, logIndex + 1).map((log, i) => (
                                    <div key={i} className="text-green-400/80 flex gap-2">
                                        <span className="text-[#0F172A]">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                                        {log}
                                    </div>
                                ))}
                                <div className="animate-pulse text-primary">_</div>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center space-y-6 animate-fade-in-up">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500 text-green-400 ring-1 ring-green-500/50">
                                <CheckCircleIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-[#0F172A] dark:text-white">Your <strong className="text-[#0F172A] dark:text-white">{serviceName}</strong> account has been successfully linked.</p>
                                <p className="text-sm text-[#0F172A] mt-2">You can now initiate transfers directly from your dashboard.</p>
                            </div>
                            <button onClick={handleFinish} className="w-full py-3 text-[#0F172A] dark:text-white bg-green-600 hover:bg-green-500 rounded-lg font-bold shadow-lg shadow-green-900/20 transition-all">
                                Complete Setup
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes ping-slow {
                    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    75%, 100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
                }
                .animate-ping-slow {
                    animation: ping-slow 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
            `}</style>
        </div>
    );
};
