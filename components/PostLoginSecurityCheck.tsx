

import React, { useState, useEffect, useRef } from 'react';
import { 
    ShieldCheckIcon, 
    LockClosedIcon, 
    GlobeAmericasIcon, 
    DevicePhoneMobileIcon, 
    CheckCircleIcon, 
    SpinnerIcon,
    ServerIcon
} from './Icons';
import { UserProfile } from '../types';

interface PostLoginSecurityCheckProps {
    onComplete: () => void;
    userProfile: UserProfile;
}

// Realistic technical logs
const SYSTEM_LOGS = [
    "[INIT] Secure Session Handshake started...",
    "[NET] Verifying TLS 1.3 encryption (AES-256-GCM)...",
    "[AUTH] Token exchange successful. Session ID: 8f92-11b...",
    "[GEO] IP Analysis: Low Risk. Location consistent.",
    "[DEV] Device Fingerprint: SHA-256 Match.",
    "[RISK] Behavioral Analysis Score: 99/100.",
    "[DB] Syncing user profile preferences...",
    "[API] Establishing WebSocket connection to wss://api.premiumreserved.com...",
    "[SEC] 2FA Verification: Bylaw satisfied.",
    "[FIN] Decrypting financial ledger cache...",
    "[SUCCESS] Secure Environment Initialized."
];

const SecurityModule: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
    status: 'pending' | 'scanning' | 'verified'; 
    delay: number 
}> = ({ icon, label, delay }) => {
    const [internalStatus, setInternalStatus] = useState<'pending' | 'scanning' | 'verified'>('pending');

    useEffect(() => {
        let scanTimer: ReturnType<typeof setTimeout>;

        const startTimer = setTimeout(() => {
            setInternalStatus('scanning');
            // Scan duration reduced for speed
            scanTimer = setTimeout(() => {
                setInternalStatus('verified');
            }, 300 + Math.random() * 200); 
        }, delay);

        return () => {
            clearTimeout(startTimer);
            clearTimeout(scanTimer);
        };
    }, [delay]);

    const isActive = internalStatus === 'scanning';
    const isDone = internalStatus === 'verified';

    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${isActive ? 'bg-primary/10 border-primary/30' : isDone ? 'bg-green-500 border-green-500/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/10'}`}>
            <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${isActive ? 'text-primary animate-pulse' : isDone ? 'text-green-400' : 'text-[#0F172A]'}`}>
                    {icon}
                </div>
                <div>
                    <p className={`text-sm font-semibold ${isDone ? 'text-[#0F172A] dark:text-[#1E293B]' : 'text-[#0F172A] dark:text-white'}`}>{label}</p>
                    <p className="text-[10px] font-mono text-[#0F172A]">
                        {isActive ? 'ANALYZING...' : isDone ? 'VERIFIED' : 'PENDING'}
                    </p>
                </div>
            </div>
            <div className="transition-opacity duration-300">
                {isActive && <SpinnerIcon className="w-5 h-5 text-primary" />}
                {isDone && <CheckCircleIcon className="w-5 h-5 text-green-400" />}
            </div>
        </div>
    );
};

export const PostLoginSecurityCheck: React.FC<PostLoginSecurityCheckProps> = ({ onComplete, userProfile }) => {
    const [logIndex, setLogIndex] = useState(0);
    const logContainerRef = useRef<HTMLDivElement>(null);

    const securityModules = [
        { icon: <LockClosedIcon className="w-6 h-6" />, label: "Session Encryption", delay: 100 },
        { icon: <GlobeAmericasIcon className="w-6 h-6" />, label: "Geolocation & IP Analysis", delay: 400 },
        { icon: <DevicePhoneMobileIcon className="w-6 h-6" />, label: "Device Integrity Check", delay: 700 },
        { icon: <ServerIcon className="w-6 h-6" />, label: "Secure Server Handshake", delay: 1000 },
    ];

    useEffect(() => {
        const logInterval = setInterval(() => {
            setLogIndex(prev => {
                if (prev >= SYSTEM_LOGS.length - 1) {
                    clearInterval(logInterval);
                    setTimeout(onComplete, 1200); // Wait after logs are complete
                    return prev;
                }
                return prev + 1;
            });
        }, 200); // Fast log speed

        return () => clearInterval(logInterval);
    }, [onComplete]);
    
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logIndex]);

    return (
        <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-900  flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-slate-900 rounded-full mb-4 ring-1 ring-white/10 shadow-lg">
                        <ShieldCheckIcon className="w-10 h-10 text-primary animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-bold text-[#0F172A] dark:text-white">Establishing Secure Session</h2>
                    <p className="text-[#0F172A] dark:text-white mt-2">Running system diagnostics to ensure your connection is private and secure.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {securityModules.map((mod, i) => (
                        <SecurityModule key={mod.label} {...mod} status="pending" />
                    ))}
                </div>
                
                <div className="bg-slate-100 rounded-lg p-4 border border-slate-100 dark:border-white/10 h-32 overflow-hidden font-mono text-xs shadow-inner">
                    <div ref={logContainerRef} className="h-full overflow-y-auto custom-scrollbar pr-2">
                        {SYSTEM_LOGS.slice(0, logIndex + 1).map((log, i) => (
                            <div key={i} className={`flex gap-2 ${log.startsWith('[SUCCESS]') ? 'text-green-400 font-bold' : 'text-[#0F172A] dark:text-white'}`}>
                                <span className="text-[#0F172A] flex-shrink-0">{`[${new Date().toLocaleTimeString()}]`}</span>
                                <span className="flex-grow">{log}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
             <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
            `}</style>
        </div>
    );
};
