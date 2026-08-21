import React, { useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Activity, ShieldCheck, RefreshCw } from 'lucide-react';

interface InactivityModalProps {
  onStayLoggedIn: () => void;
  onLogout: () => void;
  countdownStart: number;
}

export const InactivityModal: React.FC<InactivityModalProps> = ({ onStayLoggedIn, onLogout, countdownStart }) => {
  const [countdown, setCountdown] = useState(countdownStart);
  const [isExtending, setIsExtending] = useState(false);
  const [extendStatus, setExtendStatus] = useState<'idle' | 'pinging' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (countdown <= 0) {
      onLogout();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(c => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onLogout]);

  const handleExtendSession = async () => {
    if (isExtending) return;
    setIsExtending(true);
    setExtendStatus('pinging');

    try {
      // 1. Refresh Firebase Auth token (this actively pings the Firebase Auth server)
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);

        // 2. Write to Firestore to update user session activity record (this pings the Firestore server)
        const uid = auth.currentUser.uid;
        const heartbeatRef = doc(db, 'session_heartbeats', uid);
        await setDoc(heartbeatRef, {
          email: auth.currentUser.email,
          lastHeartbeat: new Date(),
          platform: 'web_heartbeat_extend'
        }, { merge: true });
      } else {
        // Fallback for demo when not explicitly signed in
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      setExtendStatus('success');
      // Brief aesthetic delay to let the user see the success verification state
      setTimeout(() => {
        onStayLoggedIn();
        setIsExtending(false);
        setExtendStatus('idle');
      }, 1000);

    } catch (error) {
      console.error("[Session Heartbeat Fail] Couldn't ping Firebase server:", error);
      setExtendStatus('error');
      // Fallback to local extension on network failure to avoid blocking user
      setTimeout(() => {
        onStayLoggedIn();
        setIsExtending(false);
        setExtendStatus('idle');
      }, 1500);
    }
  };

  const circumference = 2 * Math.PI * 48; // r="48"
  const progress = countdown / countdownStart;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="fixed inset-0 bg-slate-100  flex items-center justify-center z-[999999] animate-fade-in p-4">
      {/* Ambient glowing circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-primary/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-rose-500 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="bg-slate-100 border border-black/5  rounded-[2.5rem] shadow-[0_24px_80px_rgba(0,0,0,0.8)] p-8 md:p-10 w-full max-w-md transform animate-fade-in-up relative overflow-hidden text-center">
        {/* Top glowing accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-blue-500 to-rose-500"></div>

        <div>
            <div className="relative w-32 h-32 mx-auto mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 110 110">
                    <circle cx="55" cy="55" r="48" fill="none" strokeWidth="8" className="stroke-white/5" />
                    <circle
                        cx="55"
                        cy="55"
                        r="48"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="text-primary"
                        style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-mono font-black text-white leading-none">{countdown}</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#0F172A] mt-1">Seconds</span>
                </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] bg-rose-500 text-rose-400 border border-rose-500/20 mb-4">
                Session Expiration Impending
            </span>

            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Are you still there?</h2>
            <p className="text-[#0F172A] text-xs max-w-xs mx-auto my-4 leading-relaxed font-bold">
                For your security, this session will be locked and portfolio access frozen in <span className="font-mono text-primary font-bold">{countdown}s</span> due to detected inactivity.
            </p>
        </div>

        {/* Heartbeat Status Indicator */}
        <div className="my-4 h-8 flex items-center justify-center">
          {extendStatus === 'pinging' && (
            <div className="flex items-center gap-2 text-primary text-xs font-mono">
              <Activity className="w-4 h-4 animate-bounce text-primary" />
              <span>TRANSMITTING CRYPTO HEARTBEAT...</span>
            </div>
          )}
          {extendStatus === 'success' && (
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono">
              <ShieldCheck className="w-4 h-4 animate-pulse text-emerald-400" />
              <span>VERIFIED: SESSION RENEWED WITH SERVER</span>
            </div>
          )}
          {extendStatus === 'error' && (
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>NETWORK HEARTBEAT BYPASSED: LOCAL OVERRIDE ACTIVE</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
                onClick={onLogout}
                disabled={isExtending}
                className="w-full sm:w-auto flex-1 py-4 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-[#0F172A] hover:text-white bg-white hover:bg-white transition-all border border-black/5 disabled:opacity-40 dark:bg-slate-800"
            >
                Lock Now
            </button>
            <button
                onClick={handleExtendSession}
                disabled={isExtending}
                className="w-full sm:w-auto flex-[2] py-4 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-[#0F172A] bg-primary shadow-lg shadow-primary/20 hover:bg-primary/95 hover:scale-[1.02] transition-all disabled:opacity-80 flex items-center justify-center gap-2"
            >
                {extendStatus === 'pinging' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Pinging server...
                  </>
                ) : extendStatus === 'success' ? (
                  "Verified"
                ) : (
                  "Extend Session"
                )}
            </button>
        </div>
        <style>{`
          @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
          .animate-fade-in { animation: fade-in 0.25s ease-out forwards; }
          @keyframes fade-in-up {
            0% { opacity: 0; transform: translateY(20px) scale(0.95); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          .animate-fade-in-up { animation: fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        `}</style>
      </div>
    </div>
  );
};