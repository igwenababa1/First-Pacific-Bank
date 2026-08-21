import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, ShieldAlert, Sparkles, RefreshCw, X, ArrowUpCircle } from 'lucide-react';

interface ApkVersionInfo {
  versionCode: number;
  versionName: string;
  downloadUrl: string;
  releaseNotes: string;
  isMandatory: boolean;
}

// Current build version of this running app
const CURRENT_VERSION_CODE = 3;
const CURRENT_VERSION_NAME = "1.2";

export const ApkUpdateChecker: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<ApkVersionInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkForUpdates = async (manual = false) => {
    if (isChecking) return;
    
    // If not manual, respect user's skip decision for this session to prevent spamming
    if (!manual && sessionStorage.getItem('apk_update_dismissed') === 'true') {
      return;
    }

    setIsChecking(true);
    try {
      // Fetch version manifest from the server root
      const response = await fetch('/apk-version.json?t=' + Date.now());
      if (response.ok) {
        const data: ApkVersionInfo = await response.json();
        if (data.versionCode > CURRENT_VERSION_CODE) {
          setUpdateInfo(data);
          setIsOpen(true);
        } else if (manual) {
          // If manually checked and up-to-date, we could show a brief toast or logs
          console.log("App is up to date:", CURRENT_VERSION_NAME);
        }
      }
    } catch (error) {
      console.error("Failed to check for APK updates:", error);
    } finally {
      setIsChecking(false);
      setLastCheck(new Date());
    }
  };

  const handleSkipUpdate = () => {
    setIsOpen(false);
    sessionStorage.setItem('apk_update_dismissed', 'true');
  };

  useEffect(() => {
    // Initial check on mount
    checkForUpdates();

    // Periodically check every 2 minutes for any hot-fixes/updates
    const interval = setInterval(() => {
      checkForUpdates();
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Floating security badge indicating the current build version, clickable to trigger update check */}
      <div 
        id="apk-version-badge"
        onClick={() => checkForUpdates(true)}
        className="fixed bottom-16 right-4 z-40 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 hover:bg-slate-50 border border-slate-300/60 text-[10px] font-mono text-[#0F172A] hover:text-emerald-400 shadow-lg cursor-pointer transition-all active:scale-95 select-none dark:bg-slate-900"
        title={`First Pacific Private Bank App Build (v${CURRENT_VERSION_NAME}). Click to inspect upgrades.`}
      >
        <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin text-emerald-400' : ''}`} />
        <span>BUILD v{CURRENT_VERSION_NAME}</span>
      </div>

      <AnimatePresence>
        {isOpen && updateInfo && (
          <div id="apk-update-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-100 ">
            <motion.div
              id="apk-update-modal-container"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header Banner */}
              <div className="relative p-6 bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 border-b border-slate-200">
                <div className="absolute top-3 right-3">
                  <button 
                    onClick={handleSkipUpdate}
                    className="p-1.5 rounded-full bg-white hover:bg-slate-700 text-[#0F172A] hover:text-[#1E293B] transition-colors dark:bg-slate-800"
                    title="Dismiss update"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500 border border-blue-500/30 text-blue-400">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] tracking-widest font-mono text-blue-400 font-bold uppercase">Private Client Core</span>
                    <h3 className="text-lg font-bold text-slate-100 tracking-tight">Security Update Available</h3>
                  </div>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs dark:bg-slate-900">
                  <div className="space-y-0.5">
                    <span className="text-[#0F172A] block">CURRENT VERSION</span>
                    <span className="font-mono font-bold text-[#0F172A]">v{CURRENT_VERSION_NAME} (Build {CURRENT_VERSION_CODE})</span>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-blue-400 font-bold flex items-center gap-1 justify-end text-[10px]">
                      <Sparkles className="w-3 h-3 text-blue-400 animate-pulse" /> RECOMMENDED
                    </span>
                    <span className="font-mono font-bold text-emerald-400">v{updateInfo.versionName} (Build {updateInfo.versionCode})</span>
                  </div>
                </div>

                {/* Release Notes */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider font-mono">Enclave Patch Notes</span>
                  <div className="p-3 bg-slate-100 border border-slate-200/50 rounded-lg max-h-36 overflow-y-auto text-xs text-[#0F172A] leading-relaxed font-sans">
                    {updateInfo.releaseNotes}
                  </div>
                </div>

                {/* Threat advisory warning */}
                <div className="flex gap-2.5 p-3 rounded-lg bg-emerald-500 border border-emerald-500/20 text-xs text-emerald-400 leading-relaxed">
                  <ArrowUpCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
                  <span>This build includes critical network endpoints for universal transfer deep linking and offline-resilience synchronization.</span>
                </div>
              </div>

              {/* Action CTA */}
              <div className="p-6 pt-0 flex gap-3">
                <button
                  onClick={handleSkipUpdate}
                  className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-850 border border-slate-200 text-[#0F172A] rounded-xl text-sm font-bold transition-colors dark:bg-slate-900"
                >
                  Skip Update
                </button>
                <a
                  href={updateInfo.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all transform active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>Install APK</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
