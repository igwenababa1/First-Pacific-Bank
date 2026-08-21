import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, Apple, Play, Download, ShieldCheck, Cpu, Zap, 
  QrCode, ExternalLink, HelpCircle, CheckCircle, RefreshCw, 
  Key, Radio, Fingerprint, Waves, Wifi, Battery, Send, Info,
  Sparkles, FileCode, Check, Copy, ArrowRight
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface MobileAppPortalProps {
  userProfile?: any;
  totalNetWorth?: number;
}

const AnimatedCounter: React.FC<{
  value: number;
  formatCurrency?: (v: number) => string;
}> = ({ value, formatCurrency = (v) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;
    const duration = 1200; // 1.2s smooth count up
    const startValue = displayValue;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setDisplayValue(startValue + (value - startValue) * easeProgress);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [value]);

  return <>{formatCurrency(displayValue)}</>;
};

export const MobileAppPortal: React.FC<MobileAppPortalProps> = ({ userProfile, totalNetWorth = 0 }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'install' | 'compile' | 'sandbox'>('install');
  const [deviceType, setDeviceType] = useState<'ios' | 'android'>('ios');
  const [installerPhone, setInstallerPhone] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [hasCopiedZipLink, setHasCopiedZipLink] = useState(false);
  const [sandboxScreen, setSandboxScreen] = useState<'dashboard' | 'enclave' | 'nfc'>('dashboard');
  
  // Interactive Sandbox state
  const [totpCode, setTotpCode] = useState('492 820');
  const [totpProgress, setTotpProgress] = useState(100);
  const [nfcScanning, setNfcScanning] = useState(false);
  const [nfcSuccess, setNfcSuccess] = useState(false);
  const [biometricPaired, setBiometricPaired] = useState(false);
  const [liveNetWorth, setLiveNetWorth] = useState(44821390);

  // Dynamic TOTP and Wealth generator
  useEffect(() => {
    const timer = setInterval(() => {
      setTotpProgress((prev) => {
        if (prev <= 3) {
          // Generate new token
          const part1 = Math.floor(100 + Math.random() * 900);
          const part2 = Math.floor(100 + Math.random() * 900);
          setTotpCode(`${part1} ${part2}`);
          return 100;
        }
        return prev - 3.33; // Approx 30s cycle
      });
      
      // Simulate live portfolio updates
      if (Math.random() > 0.6) {
          setLiveNetWorth(prev => {
              const change = (Math.random() * 200) - 50; // Tendency to trend up slightly
              return prev + change;
          });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSendProvisionSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!installerPhone) return;
    setSmsSent(true);
    
    // Play sound cue if enabled
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (_) {}

    // Dispatch global activity feed so notification toast plays
    try {
      window.dispatchEvent(new CustomEvent('APP_REALTIME_ACTIVITY', {
        detail: {
          type: 'upgrade',
          message: `Issued OTA Provisioning Profile token to cellular endnode: ${installerPhone.slice(-4)}`,
          name: 'Security Enclave',
          country: 'OTA Network',
          flag: '📱',
          amount: 0
        }
      }));
    } catch (_) {}

    setTimeout(() => setSmsSent(false), 9000);
  };

  const handleSynthesizeApp = () => {
    setIsSynthesizing(true);
    setTimeout(() => {
      setIsSynthesizing(false);
      // Download dynamic IPA/APK bundle or Capacitor config
      const blob = new Blob([JSON.stringify({
        appId: "com.firstpacific.reserved",
        appName: "First Pacific Bank",
        version: "4.2.1",
        capabilities: ["nfc", "biometrics", "hsm_auth", "hft_brokerage"],
        capacitorConfig: {
          webDir: "dist",
          bundledWebRuntime: false,
          server: {
            url: window.location.origin,
            allowNavigation: [window.location.hostname]
          }
        }
      }, null, 2)], { type: "application/json" });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = deviceType === 'ios' ? 'FirstPacific_Enterprise_Profile.mobileprovision' : 'FirstPacific_AppRelease.xml';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 4500);
  };

  const handleCopyZip = () => {
    navigator.clipboard.writeText(`npm i -g @capacitor/cli @capacitor/core
npx cap init "First Pacific Bank" "com.firstpacific.reserved" --web-dir=dist
npm run build
npx cap add ${deviceType === 'ios' ? 'ios' : 'android'}
npx cap sync ${deviceType === 'ios' ? 'ios' : 'android'}`);
    setHasCopiedZipLink(true);
    setTimeout(() => setHasCopiedZipLink(false), 3000);
  };

  const triggerNfcScan = () => {
    setNfcScanning(true);
    setNfcSuccess(false);
    setTimeout(() => {
      setNfcScanning(false);
      setNfcSuccess(true);
      
      // Emit sound
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
        }
      } catch (_) {}
    }, 2800);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24 animate-fade-in-up">
      {/* Featured Mobile Banking Hero Cover */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 mb-10 group">
        <div 
          className="h-48 md:h-60 w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url('https://cdn.corporatefinanceinstitute.com/assets/mobile-banking.jpeg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/85 to-transparent p-6 md:p-10 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary text-[10px] font-black uppercase tracking-widest mb-2  w-fit">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Standalone Native Systems
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">
            Universal Mobile Portal
          </h2>
          <p className="text-slate-300 mt-2 text-xs md:text-sm max-w-xl font-medium">
            Access the complete First Pacific private transaction suite directly from your iOS or Android handheld with biometrics, offline passkeys, and real-time push settlement.
          </p>
        </div>
      </div>

      {/* Header Controls Bar */}
      <div className="mb-8 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-white/10 pb-6">
        <div>
          <h3 className="text-xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">
            Device Distribution & Enclaves
          </h3>
          <p className="text-slate-600 dark:text-slate-300 text-xs mt-1">Select your preferred mobile architecture or native binary compilation.</p>
        </div>

        {/* Operating system tabs */}
        <div className="flex gap-1.5 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-white/10 self-center md:self-auto shrink-0">
          <button 
            onClick={() => setDeviceType('ios')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${deviceType === 'ios' ? 'bg-white text-slate-950 shadow-md' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white'}`}
          >
            <Apple className="w-4 h-4 fill-current" />
            Apple iOS
          </button>
          <button 
            onClick={() => setDeviceType('android')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${deviceType === 'android' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white'}`}
          >
            <Smartphone className="w-4 h-4" />
            Android OS
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Navigation Sidebar Controls */}
        <div className="lg:col-span-3 space-y-2.5">
          <p className="text-[10px] font-black tracking-widest text-[#0F172A] uppercase px-2">Deployment Routes</p>
          
          <button
            onClick={() => setActiveTab('install')}
            className={`w-full flex items-center justify-between p-4 rounded-xl text-left border transition-all ${
              activeTab === 'install' 
                ? 'bg-gradient-to-r from-slate-900 to-slate-900/50 border-primary/30 text-[#0F172A] dark:text-white shadow-lg shadow-black/30' 
                : 'bg-transparent border-transparent text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white hover:bg-white[0.02]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Download className={`w-5 h-5 ${activeTab === 'install' ? 'text-primary' : 'text-[#0F172A]'}`} />
              <div>
                <p className="font-bold text-xs uppercase tracking-tight">PWA Direct Saving</p>
                <p className="text-[9px] text-[#0F172A] mt-0.5">Quick standalone home screen save</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 opacity-45" />
          </button>

          <button
            onClick={() => setActiveTab('compile')}
            className={`w-full flex items-center justify-between p-4 rounded-xl text-left border transition-all ${
              activeTab === 'compile' 
                ? 'bg-gradient-to-r from-slate-900 to-slate-900/50 border-emerald-500/30 text-[#0F172A] dark:text-white shadow-lg shadow-black/30'  
                : 'bg-transparent border-transparent text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white hover:bg-white[0.02]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Cpu className={`w-5 h-5 ${activeTab === 'compile' ? 'text-emerald-400' : 'text-[#0F172A]'}`} />
              <div>
                <p className="font-bold text-xs uppercase tracking-tight">Capacitor Native APK/IPA</p>
                <p className="text-[9px] text-[#0F172A] mt-0.5">Local binary packaging scripts</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 opacity-45" />
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`w-full flex items-center justify-between p-4 rounded-xl text-left border transition-all ${
              activeTab === 'sandbox' 
                ? 'bg-gradient-to-r from-slate-900 to-slate-900/50 border-indigo-500/30 text-[#0F172A] dark:text-white shadow-lg shadow-black/30' 
                : 'bg-transparent border-transparent text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white hover:bg-white[0.02]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Key className={`w-5 h-5 ${activeTab === 'sandbox' ? 'text-indigo-400' : 'text-[#0F172A]'}`} />
              <div>
                <p className="font-bold text-xs uppercase tracking-tight">Enclave Hub Simulator</p>
                <p className="text-[9px] text-[#0F172A] mt-0.5">Pair biometric keys & TOTPs</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 opacity-45" />
          </button>

          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/10 space-y-2.5">
            <h4 className="text-[9px] font-black tracking-widest text-[#0F172A] uppercase">System Integrity</h4>
            <div className="space-y-1.5 font-mono text-[9px] text-[#0F172A] dark:text-white">
              <div className="flex justify-between">
                <span>Core Framework</span>
                <span className="text-emerald-400">PWA Manifest V2</span>
              </div>
              <div className="flex justify-between">
                <span>Security Sandbox</span>
                <span className="text-emerald-400">FIPS 140-3 Compliant</span>
              </div>
              <div className="flex justify-between">
                <span>Server Endpoint</span>
                <span className="text-[#0F172A] dark:text-white">Live API Tunnel</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Detail Interface */}
        <div className="lg:col-span-5 space-y-6">
          <AnimatePresence mode="wait">
            
            {/* TAB 1: PWA DOWNLOAD & INSTRUCTIONS */}
            {activeTab === 'install' && (
              <motion.div
                key="install"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-[#0F172A] dark:text-white">Progressive Web Installation</h3>
                    <p className="text-[10px] text-[#0F172A] dark:text-white">Instant offline-ready home screen deployment</p>
                  </div>
                </div>

                {/* Instructions timeline */}
                <div className="space-y-4">
                  <p className="text-xs text-[#0F172A] dark:text-white leading-relaxed font-sans">
                    With Progressive Web App support, First Pacific installs instantly onto your desktop or mobile home screens as a fast fullscreen application. No app store waiting or overhead memory required!
                  </p>

                  <div className="space-y-3 pt-2">
                    {deviceType === 'ios' ? (
                      <>
                        <div className="flex gap-4 items-start p-3 rounded-xl bg-white[0.02] border border-slate-100 dark:border-white/10 dark:bg-slate-800">
                          <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">1</div>
                          <div>
                            <p className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-tight">Open Safari Browser</p>
                            <p className="text-[10px] text-[#0F172A] dark:text-white leading-relaxed">Launch our transaction platform in your native Apple Safari browser.</p>
                          </div>
                        </div>

                        <div className="flex gap-4 items-start p-3 rounded-xl bg-white[0.02] border border-slate-100 dark:border-white/10 dark:bg-slate-800">
                          <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">2</div>
                          <div>
                            <p className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-tight flex items-center gap-1">Tap the iOS Share Icon</p>
                            <p className="text-[10px] text-[#0F172A] dark:text-white leading-relaxed">Tap the iOS global Share Button at the bottom center of Safari.</p>
                          </div>
                        </div>

                        <div className="flex gap-4 items-start p-3 rounded-xl bg-white[0.02] border border-slate-100 dark:border-white/10 dark:bg-slate-800">
                          <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">3</div>
                          <div>
                            <p className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-tight">Select 'Add to Home Screen'</p>
                            <p className="text-[10px] text-[#0F172A] dark:text-white leading-relaxed">Scroll down and tap <strong>Add to Home Screen</strong>, verifying the premium icons.</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex gap-4 items-start p-3 rounded-xl bg-white[0.02] border border-slate-100 dark:border-white/10 dark:bg-slate-800">
                          <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">1</div>
                          <div>
                            <p className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-tight">Open Android Chrome</p>
                            <p className="text-[10px] text-[#0F172A] dark:text-white leading-relaxed">Navigate to this banking link in Android Google Chrome browser.</p>
                          </div>
                        </div>

                        <div className="flex gap-4 items-start p-3 rounded-xl bg-white[0.02] border border-slate-100 dark:border-white/10 dark:bg-slate-800">
                          <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">2</div>
                          <div>
                            <p className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-tight">Tap Chrome Action Menu</p>
                            <p className="text-[10px] text-[#0F172A] dark:text-white leading-relaxed">Tap the Three-Dots action button on top right of Google Chrome window.</p>
                          </div>
                        </div>

                        <div className="flex gap-4 items-start p-3 rounded-xl bg-white[0.02] border border-slate-100 dark:border-white/10 dark:bg-slate-800">
                          <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">3</div>
                          <div>
                            <p className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-tight">Select 'Install App'</p>
                            <p className="text-[10px] text-[#0F172A] dark:text-white leading-relaxed">Select <strong>Install App</strong> or <strong>Add to Home Screen</strong> to initialize standalone launcher files.</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Simulated OTA Profile generator */}
                <form onSubmit={handleSendProvisionSms} className="pt-4 border-t border-slate-100 dark:border-white/10 space-y-3">
                  <div>
                    <h4 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1.5">Receive Remote Setup Token</h4>
                    <p className="text-[9px] text-[#0F172A] dark:text-white leading-normal mb-3">
                      We will shoot an encrypted Over-the-Air beta setup manifest to your cell device with installation configuration tags.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="tel"
                      value={installerPhone}
                      onChange={(e) => setInstallerPhone(e.target.value)}
                      placeholder="+1 (555) 019-2831" 
                      className="flex-1 bg-slate-100 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-[#0F172A] dark:text-white focus:outline-none focus:border-primary/50 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!installerPhone}
                      className="px-4 py-2 bg-gradient-to-r from-primary to-primary-600 hover:from-primary-400 hover:to-primary text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 shrink-0 disabled:opacity-40"
                    >
                      Verify Node
                    </button>
                  </div>

                  {smsSent && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }} 
                      className="p-3 bg-emerald-500 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-bold flex items-start gap-2"
                    >
                      <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Encryption Protocol Handshake Dispatched</p>
                        <p className="text-[#0F172A] dark:text-white mt-0.5">An authorized developer profile URL was dispatched to cellular endnode successfully.</p>
                      </div>
                    </motion.div>
                  )}
                </form>
              </motion.div>
            )}

            {/* TAB 2: COMPILE NATIVE SOURCE CODE AND BUILD RUNS */}
            {activeTab === 'compile' && (
              <motion.div
                key="compile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-5"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500 border border-emerald-500/20 text-emerald-400">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-[#0F172A] dark:text-white">Capacitor Mobile Packaging</h3>
                    <p className="text-[10px] text-[#0F172A] dark:text-white">Compile the static assets into Android Studio or iOS Xcode</p>
                  </div>
                </div>

                <div className="space-y-4 font-sans">
                  <p className="text-xs text-[#0F172A] dark:text-white leading-relaxed">
                    If you are looking to wrap this fully functional single page React application into an actual native Apple Xcode iOS project or Android Studio Gradle build, you can run compiling configurations using <strong>Capacitor.js</strong>.
                  </p>

                  <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-100 dark:border-white/10 space-y-2">
                    <div className="flex justify-between items-center text-[9px] text-[#0F172A] font-mono">
                      <span>CMD CLI CONFIG</span>
                      <button onClick={handleCopyZip} className="flex items-center gap-1 text-primary hover:text-[#0F172A] dark:text-white transition-colors">
                        {hasCopiedZipLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {hasCopiedZipLink ? 'Copied' : 'Copy Block'}
                      </button>
                    </div>
                    <pre className="text-[9.5px] font-mono text-[#0F172A] dark:text-white bg-transparent overflow-x-auto whitespace-pre leading-relaxed select-all">
                      {`npm i -g @capacitor/cli @capacitor/core
npx cap init "First Pacific Bank" "com.firstpacific" --web-dir=dist
npm run build
npx cap add ${deviceType}
npx cap sync ${deviceType}`}
                    </pre>
                  </div>

                  {/* Provision compiler simulation */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 space-y-4">
                    <div>
                      <h4 className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        Compile Standalone OTA Installation Config
                      </h4>
                      <p className="text-[9px] text-[#0F172A] dark:text-white">
                        Synthesize your verified app token, server proxies and compile an enterprise signed provisioning payload.
                      </p>
                    </div>

                    <div className="flex justify-between gap-4">
                      <button
                        onClick={handleSynthesizeApp}
                        disabled={isSynthesizing}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-[#0F172A] dark:text-white font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40"
                      >
                        {isSynthesizing ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Compiling Payload...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 fill-current text-yellow-300 animate-bounce" />
                            <span>Compile Enterprise {deviceType === 'ios' ? 'IPA payload' : 'APK payload'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: SECURE ENCLAVE SANDBOX KEYS - TOTP & NFC */}
            {activeTab === 'sandbox' && (
              <motion.div
                key="sandbox"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-5"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-500 border border-indigo-500/20 text-indigo-400">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-[#0F172A] dark:text-white">Cryptographic Companion Keys</h3>
                    <p className="text-[10px] text-[#0F172A] dark:text-white">Secure hardware keys hosted inside your paired device</p>
                  </div>
                </div>

                <div className="space-y-4 font-sans">
                  <p className="text-xs text-[#0F172A] dark:text-white leading-relaxed">
                    By synchronizing your client browser directly with your paired iOS or Android Secure Enclave, you can unlock FaceID, dynamic OTP signatures, and instant NFC login terminal transfers.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {/* TOTP Indicator card */}
                    <div className="p-3 bg-slate-100 rounded-xl border border-slate-100 dark:border-white/10 space-y-2">
                      <p className="text-[9px] font-black tracking-wider text-[#0F172A] uppercase flex items-center gap-1">
                        <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                        Dynamic OTP Token
                      </p>
                      <p className="font-mono text-lg font-bold text-[#0F172A] dark:text-white tracking-widest">{totpCode}</p>
                      <div className="w-full h-[3px] bg-white dark:bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${totpProgress}%` }} />
                      </div>
                      <p className="text-[8px] text-[#0F172A] font-mono">Regenerates every 30s</p>
                    </div>

                    {/* Biometrics Synced state */}
                    <button
                      onClick={() => setBiometricPaired(!biometricPaired)}
                      className={`p-3 rounded-xl border text-left transition-colors flex flex-col justify-between ${
                        biometricPaired 
                          ? 'bg-emerald-500 border-emerald-500/30' 
                          : 'bg-slate-100 border-slate-100 dark:border-white/10 hover:border-slate-200 dark:border-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <p className="text-[9px] font-black tracking-wider text-[#0F172A] uppercase">Keychain BioSync</p>
                        <Fingerprint className={`w-3.5 h-3.5 ${biometricPaired ? 'text-emerald-400' : 'text-[#0F172A]'}`} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-[#0F172A] dark:text-white mt-2">{biometricPaired ? 'Securely Linked' : 'Offline'}</p>
                        <p className="text-[8px] text-[#0F172A] font-mono">FaceID / TouchID Enclave</p>
                      </div>
                    </button>
                  </div>

                  {/* NFC pairing system simulator */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 space-y-3.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-wider mb-0.5">Contactless Card Sync via NFC</h4>
                        <p className="text-[9px] text-[#0F172A] dark:text-white">Pair your metal debit card dynamically with browser keychain.</p>
                      </div>
                      <span className="text-[9px] uppercase font-mono px-1 border border-slate-200 dark:border-slate-300/50 bg-white dark:bg-slate-900 rounded text-[#0F172A] dark:text-white font-bold shrink-0">Terminal L-2</span>
                    </div>

                    <div className="flex justify-center py-2.5">
                      {nfcScanning ? (
                        <div className="flex flex-col items-center gap-2">
                          <Waves className="w-8 h-8 text-primary animate-pulse" />
                          <p className="text-[9px] font-mono text-primary animate-pulse uppercase tracking-wider">Awaiting contact proximity...</p>
                        </div>
                      ) : nfcSuccess ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <CheckCircle className="w-8 h-8 text-emerald-400" />
                          <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">NFC Synced Successfully</p>
                        </div>
                      ) : (
                        <button
                          onClick={triggerNfcScan}
                          className="px-6 py-2 rounded-lg bg-indigo-500 border border-indigo-400/30 text-indigo-300 text-[10px] font-bold uppercase tracking-wider hover:bg-white dark:bg-slate-900 transition-colors"
                        >
                          Trigger Contactless Proximity Sync
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Column 3: The Beautiful Smartphone Showcase Model */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center">
          <p className="text-[10px] font-black tracking-widest text-[#0F172A] uppercase mb-4 self-center">Interactive Mobile OS Preview</p>

          {/* Core high-end iPhone flagship frame structure */}
          <div className="relative w-[280px] h-[580px] rounded-[50px] bg-slate-100 border-4 border-slate-200 dark:border-slate-700/80 shadow-[0_25px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10 p-2 overflow-hidden flex flex-col justify-between select-none">
            
            {/* Speaker Grille in Notch bezel */}
            <div className="absolute top-0 inset-x-0 h-5 flex justify-center z-50">
              {/* Dynamic Island Pill simulator shape */}
              <div className="w-[85px] h-[18px] bg-slate-100 rounded-b-xl border-x border-b border-white/[0.04] flex items-center justify-between px-2 text-[8px] font-sans text-[#0F172A] dark:text-white">
                <Wifi className="w-2.5 h-2.5 text-[#0F172A] dark:text-white" />
                <span className="text-[7.5px] text-[#0F172A] dark:text-white">Secure</span>
                <Battery className="w-2.5 h-2.5 text-emerald-400" />
              </div>
            </div>

            {/* Simulated Glass glare reflect highlight overlay */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/[0.01] via-transparent to-white/[0.05] z-30" />

            {/* Dynamic Screen View */}
            <div className="w-full h-full rounded-[44px] bg-[#0c111c] border border-white/[0.05] relative overflow-hidden flex flex-col p-3.5 pt-6 text-[#cbd5e1] font-sans">
              
              {/* Top title */}
              <div className="flex justify-between items-center text-[9px] mb-4 text-[#0F172A]">
                <span className="font-mono text-[8px]">AMX_OTA_PORTAL</span>
                <span className="font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1 h-1 bg-emerald-400 rounded-full animate-ping" />
                  ONLINE
                </span>
              </div>

              {/* Interactive Screens list within phone */}
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                
                {sandboxScreen === 'dashboard' && (
                  <div className="space-y-3 animate-fade-in">
                    {/* Private Banking balance card */}
                    <div className="p-3 bg-gradient-to-br from-slate-900 to-[#111827] rounded-xl border border-slate-200 dark:border-white/15 shadow-sm space-y-1 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none rounded-bl-3xl bg-primary/20 blur-md group-hover:scale-150 transition-all" />
                      <p className="text-[8px] text-[#0F172A] dark:text-white uppercase tracking-widest font-black leading-none">Total Net Worth</p>
                      <h4 className="text-sm font-black text-[#0F172A] dark:text-white leading-none font-sans mt-1">
                        <AnimatedCounter value={totalNetWorth} /> <span className="text-[10px] text-primary">USD</span>
                      </h4>
                      <p className="text-[8px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
                        <span>• SOVEREIGN RESERVE ACCT ACTIVE</span>
                      </p>
                    </div>

                    {/* Quick Access Grid info */}
                    <div className="space-y-1.5">
                      <p className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest">Enclave Status</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setSandboxScreen('enclave')}
                          className="p-2 rounded-lg bg-white[0.02] border border-slate-100 dark:border-white/10 hover:bg-white hover:border-slate-200 dark:border-white/15 text-left transition-all dark:bg-slate-800"
                        >
                          <Key className="w-3.5 h-3.5 text-primary mb-1" />
                          <p className="text-[8px] text-[#0F172A] dark:text-white font-bold uppercase leading-tight">Secure Keys</p>
                          <p className="text-[7px] text-[#0F172A] dark:text-white leading-tight">Paired token</p>
                        </button>

                        <button 
                          onClick={() => setSandboxScreen('nfc')}
                          className="p-2 rounded-lg bg-white[0.02] border border-slate-100 dark:border-white/10 hover:bg-white hover:border-slate-200 dark:border-white/15 text-left transition-all dark:bg-slate-800"
                        >
                          <Waves className="w-3.5 h-3.5 text-indigo-400 mb-1" />
                          <p className="text-[8px] text-[#0F172A] dark:text-white font-bold uppercase leading-tight">Card NFC</p>
                          <p className="text-[7px] text-[#0F172A] dark:text-white leading-tight">Proximity sync</p>
                        </button>
                      </div>
                    </div>

                    {/* App Features List */}
                    <div className="space-y-1.5 p-2 bg-slate-100 rounded-xl border border-white/[0.03]">
                      <h5 className="text-[7.5px] font-black text-[#0F172A] uppercase">Hardware features</h5>
                      <div className="space-y-1 font-mono text-[8px] text-[#0F172A] dark:text-white">
                        <div className="flex justify-between">
                          <span>NFC Terminal API</span>
                          <span className="text-emerald-400">Linked</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Biometrics Sync</span>
                          <span className="text-emerald-400">Secure</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Secure Keys</span>
                          <span className="text-emerald-400">Linked</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {sandboxScreen === 'enclave' && (
                  <div className="space-y-3.5 animate-fade-in">
                    <button 
                      onClick={() => setSandboxScreen('dashboard')}
                      className="text-[8px] font-bold text-primary flex items-center gap-1 hover:underline"
                    >
                      ← Back to Device
                    </button>

                    <div className="text-center space-y-1.5">
                      <Fingerprint className="w-8 h-8 text-primary mx-auto animate-pulse" />
                      <h5 className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-wider">Enclave Session Auth</h5>
                      <p className="text-[8px] text-[#0F172A] dark:text-white">Paired cryptographically with the Secure Trust Platform.</p>
                    </div>

                    <div className="p-3 bg-slate-100 rounded-xl border border-slate-100 dark:border-white/10 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[7.5px] font-bold text-[#0F172A] uppercase">Interactive OTP</span>
                        <span className="text-[8px] text-primary font-mono">{Math.floor(totpProgress)}%</span>
                      </div>
                      <p className="text-base font-mono font-bold text-[#0F172A] dark:text-white text-center tracking-widest">{totpCode}</p>
                    </div>

                    <button
                      onClick={() => {
                        setBiometricPaired(!biometricPaired);
                        // Trigger sound
                        try {
                          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                          if (AudioContext) {
                            const ctx = new AudioContext();
                            const osc = ctx.createOscillator();
                            const gain = ctx.createGain();
                            osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
                            gain.gain.setValueAtTime(0.02, ctx.currentTime);
                            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                            osc.connect(gain);
                            gain.connect(ctx.destination);
                            osc.start();
                            osc.stop(ctx.currentTime + 0.2);
                          }
                        } catch (_) {}
                      }}
                      className="w-full py-1.5 bg-primary rounded-lg text-slate-950 text-[8px] font-black uppercase tracking-widest text-center"
                    >
                      {biometricPaired ? 'Unlink Biometrics' : 'Link Biometrics'}
                    </button>
                  </div>
                )}

                {sandboxScreen === 'nfc' && (
                  <div className="space-y-3.5 animate-fade-in">
                    <button 
                      onClick={() => setSandboxScreen('dashboard')}
                      className="text-[8px] font-bold text-primary flex items-center gap-1 hover:underline"
                    >
                      ← Back to Device
                    </button>

                    <div className="text-center space-y-1.5">
                      <Waves className="w-8 h-8 text-indigo-400 mx-auto animate-bounce" />
                      <h5 className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-wider">Proximity NFC Sync</h5>
                      <p className="text-[8px] text-[#0F172A] dark:text-white">Place physical debit card near mobile device antenna.</p>
                    </div>

                    <div className="p-3 bg-slate-100 rounded-xl border border-slate-100 dark:border-white/10 text-center">
                      {nfcScanning ? (
                        <p className="text-[7px] font-mono text-primary animate-pulse">SYNCHRONIZING WITH ANTENNA...</p>
                      ) : nfcSuccess ? (
                        <p className="text-[7.5px] font-bold text-emerald-400">✓ VISA METAL CARD PAIRED</p>
                      ) : (
                        <p className="text-[7px] text-[#0F172A]">Antenna Standing By...</p>
                      )}
                    </div>

                    <button
                      onClick={triggerNfcScan}
                      disabled={nfcScanning}
                      className="w-full py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg text-[#0F172A] dark:text-white text-[8px] font-black uppercase tracking-widest text-center disabled:opacity-40"
                    >
                      {nfcScanning ? 'Scanning Card Near NFC...' : 'Trigger Proximity Scan'}
                    </button>
                  </div>
                )}

              </div>

              {/* Simulated iOS home bar indicator link at bottom of notch */}
              <div className="h-1 w-20 bg-white dark:bg-slate-900 rounded-full mx-auto mt-2 self-center shrink-0" />
            </div>
          </div>

          <div className="mt-4 text-center">
            <div className="flex gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-lg border border-slate-100 dark:border-white/10 text-[9px] mb-2 font-mono">
              <span className="text-[#0F172A] dark:text-white">Server Endpoint:</span>
              <span className="text-primary truncate">{window.location.hostname}</span>
            </div>
            <p className="text-[8px] text-[#0F172A]">Live PWA application container simulation active</p>
          </div>
        </div>

      </div>

      {/* Trust Badge security Footer */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-slate-100 dark:border-white/10 font-sans">
        <div className="flex gap-4 items-start p-4 bg-slate-50 dark:bg-slate-900 border border-white/[0.03] rounded-2xl">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-wider mb-1">No App Store Custody</h4>
            <p className="text-[10px] text-[#0F172A] dark:text-white leading-normal">
              Direct PWA installations completely bypass App Store third-party custody, ensuring cryptographically secure server links on your private domain folder.
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-start p-4 bg-slate-50 dark:bg-slate-900 border border-white/[0.03] rounded-2xl">
          <div className="p-2 rounded-xl bg-orange-400 border border-orange-400/20 text-orange-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-wider mb-1">Low Latency High Frequency</h4>
            <p className="text-[10px] text-[#0F172A] dark:text-white leading-normal">
              Native sandbox features bypass browser overhead parsing WebGL and WASM data layers at direct physical machine execution speeds.
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-start p-4 bg-slate-50 dark:bg-slate-900 border border-white/[0.03] rounded-2xl">
          <div className="p-2 rounded-xl bg-indigo-400 border border-indigo-400/20 text-indigo-400 shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-wider mb-1">Hardware Keychain Trust</h4>
            <p className="text-[10px] text-[#0F172A] dark:text-white leading-normal">
              Leverages high grade FIPS FaceID, biometric hardware secure elements, and native NFC dynamic key generation models instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileAppPortal;
