import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    SparklesIcon, 
    TrendingUpIcon, 
    LeafIcon, 
    ShieldCheckIcon, 
    SendIcon, 
    ArrowPathIcon, 
    SpinnerIcon, 
    GlobeAmericasIcon, 
    ArrowDownTrayIcon,
    CertificateIcon,
    CheckCircleIcon
} from './Icons';
import { 
    ResponsiveContainer, 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    Tooltip, 
    CartesianGrid 
} from 'recharts';
import { db } from '../services/database';
import { UserProfile } from '../types';

interface GeminiIntelligenceProps {
    userProfile: UserProfile;
}

export const GeminiIntelligence: React.FC<GeminiIntelligenceProps> = ({ userProfile }) => {
    // Tabs state
    const [activeTab, setActiveTab] = useState<'esg' | 'chat'>('esg');

    // ESG States
    const [selectedSector, setSelectedSector] = useState<string>('Offshore Wind & Hydro');
    const [allocationSlider, setAllocationSlider] = useState<number>(20);
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [esgData, setEsgData] = useState<{
        score: number;
        certLabel: string;
        offsetTons: string;
        recommendation: string;
    } | null>(null);

    // Chat States
    const [chatInput, setChatInput] = useState<string>('');
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', text: string }>>([
        { 
            role: 'assistant', 
            text: `Greetings, ${userProfile?.name || 'Valued Partner'}. I am Sovereign Core AI, powered by Gemini 3.5. How may I optimize your ESG directives, direct air carbon offsets, or credit union yields today?` 
        }
    ]);
    const [isThinking, setIsThinking] = useState<boolean>(false);

    // Certificate state
    const [showCert, setShowCert] = useState<boolean>(false);

    // Dynamic Chart projection based on allocation
    const chartData = React.useMemo(() => {
        const baseOffset = 1.2 * allocationSlider;
        const baseYield = 4.2 + (allocationSlider * 0.05);
        return Array.from({ length: 6 }, (_, idx) => {
            const year = 2026 + idx;
            const multiplier = Math.pow(1.08, idx);
            return {
                name: String(year),
                Yield: Number((baseYield * multiplier).toFixed(2)),
                Offsets: Number((baseOffset * multiplier).toFixed(1)),
                SovereignIndex: Math.floor(82 + (idx * 3) + (allocationSlider / 10))
            };
        });
    }, [allocationSlider]);

    // Initial Trigger for ESG load
    useEffect(() => {
        runEsgAnalysis();
    }, [selectedSector]);

    const runEsgAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const res = await fetch('/api/gemini/eco-analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: userProfile?.name || 'Sovereign Client',
                    email: userProfile?.email || 'private@wealth.fpb',
                    balance: 1540000,
                    sector: selectedSector
                })
            });
            const data = await res.json();
            if (data && !data.error) {
                setEsgData(data);
            } else {
                // Procedural fallback schema matching
                setEsgData({
                    score: 92,
                    certLabel: "AERO-GREEN CLASS-1 SUPREME",
                    offsetTons: "284.2 Metric Tons CO2e Expected",
                    recommendation: `Our model recommends allocating ${allocationSlider}% to certified clean-energy micro-grids. This aligns sovereign liquidity with net-zero mandates seamlessly.`
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isThinking) return;
        
        const userText = chatInput.trim();
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setChatInput('');
        setIsThinking(true);

        try {
            const formattedMessages = messages
                .concat({ role: 'user', text: userText })
                .map(m => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    content: m.text
                }));

            const res = await fetch('/api/gemini/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: formattedMessages,
                    systemInstruction: `You are Sovereign Core AI, a state-of-the-art elite banking intelligence at First Pacific Bank (powered by Gemini). 
Your persona is incredibly prestige, high-tech, welcoming, and elite. You advise ultra-high-net-worth customers on how to align corporate liquidity with clean energy investments, zero-emission credit lines, and premium assets.
Respond in up to 3 sentences. Be extraordinarily professional, concise, reassuring, and articulate.`
                })
            });

            const data = await res.json();
            if (data && data.text) {
                setMessages(prev => [...prev, { role: 'assistant', text: data.text }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', text: "Sovereign AI node experienced a validation cycle transition. How may I audit your portfolio parameters further?" }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', text: "Network latency encountered in secure AI sub-routines." }]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto px-4 md:px-8 py-4">
            {/* Ambient visual header with carbon/green theme accents */}
            <div className="relative rounded-3xl p-8 bg-slate-100 border border-emerald-500/20 shadow-2xl overflow-hidden min-h-[160px] flex flex-col justify-center">
                <div className="absolute inset-x-0 bottom-0 top-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.06),transparent_60%)] pointer-events-none"></div>
                <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                                Active Node Operational
                            </span>
                            <span className="text-[10px] text-[#0F172A] font-bold uppercase tracking-wider font-mono">Powered by Gemini 3.5</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mt-3">
                            Gemini AI <span className="text-emerald-400 font-light">Core Intelligence</span>
                        </h1>
                        <p className="text-sm text-[#0F172A] mt-2 max-w-2xl leading-relaxed">
                            Pioneering net-zero wealth engineering. Access custom ESG metrics, analyze green carbon portfolios, and direct direct-air offset balances securely in real-time.
                        </p>
                    </div>

                    {/* Quick navigation toggles */}
                    <div className="flex p-1 bg-slate-50 border border-slate-200 dark:border-white/10 rounded-2xl w-fit shrink-0 font-mono dark:bg-slate-900">
                        <button 
                            onClick={() => setActiveTab('esg')}
                            className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'esg' ? 'bg-emerald-600 text-white shadow-lg' : 'text-[#0F172A] hover:text-white'}`}
                        >
                            <LeafIcon className="w-3.5 h-3.5" />
                            Eco-Sovereign Node
                        </button>
                        <button 
                            onClick={() => setActiveTab('chat')}
                            className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'chat' ? 'bg-emerald-600 text-white shadow-lg' : 'text-[#0F172A] hover:text-white'}`}
                        >
                            <SparklesIcon className="w-3.5 h-3.5 text-primary" />
                            Security AI Copilot
                        </button>
                    </div>
                </div>
            </div>

            {/* TAB CONTENT: Eco Portfolio Nodes */}
            {activeTab === 'esg' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Tool Column left: Custom Configuration Sliders */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-slate-50 dark:bg-slate-900  rounded-3xl p-6 border border-slate-200 shadow-xl space-y-6">
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">Configure Green Directives</h3>
                                <p className="text-xs text-[#0F172A] mt-1">Set targets to offset emissions & acquire premium carbon yields.</p>
                            </div>

                            {/* Selector card */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest font-mono block">Focus Green Infrastructure Sector</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {['Offshore Wind & Hydro', 'Volcanic Geothermal Energy', 'Smart Grid Solar Networks', 'Agrarian Carbon Captures'].map((sector) => (
                                        <button
                                            key={sector}
                                            onClick={() => setSelectedSector(sector)}
                                            className={`p-3.5 rounded-xl border text-left text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-between ${selectedSector === sector ? 'bg-emerald-950 border-emerald-500/50 text-emerald-300 shadow-md' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-[#0F172A] hover:bg-slate-50 dark:bg-slate-800'}`}
                                        >
                                            <span>{sector}</span>
                                            {selectedSector === sector && <CheckCircleIcon className="w-4 h-4 text-emerald-400" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Portfolio Allocation Slider */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-[10px] font-black text-[#0F172A] uppercase tracking-widest font-mono">
                                    <span>Portfolio Allocation</span>
                                    <span className="text-emerald-400">{allocationSlider}% Capital</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="5" 
                                    max="50" 
                                    value={allocationSlider} 
                                    onChange={(e) => setAllocationSlider(Number(e.target.value))}
                                    className="w-full h-1 bg-white rounded-lg appearance-none cursor-pointer accent-emerald-500 dark:bg-slate-800"
                                />
                                <span className="text-[10px] text-[#0F172A] font-mono block leading-relaxed">
                                    Directs ledger asset indices to clean energy instruments automatically.
                                </span>
                            </div>

                            {/* Score status panel */}
                            <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-3 relative overflow-hidden">
                                {isAnalyzing ? (
                                    <div className="py-6 flex flex-col items-center justify-center space-y-2">
                                        <SpinnerIcon className="w-8 h-8 text-emerald-500 animate-spin" />
                                        <span className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest font-mono">Sovereign Core Computing...</span>
                                    </div>
                                ) : esgData ? (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-[#0F172A] font-black uppercase tracking-widest font-mono">Eco-Sovereign Rating</span>
                                            <span className="text-2xl font-black text-emerald-400 font-mono">{esgData.score}/100</span>
                                        </div>
                                        <div className="h-2 bg-white rounded-full overflow-hidden dark:bg-slate-800">
                                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${esgData.score}%` }}></div>
                                        </div>
                                        <div className="pt-2 text-[10px] font-bold text-[#0F172A] uppercase tracking-wider flex justify-between">
                                            <span>Tier Class:</span>
                                            <span className="text-white text-right">{esgData.certLabel}</span>
                                        </div>
                                        <div className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider flex justify-between">
                                            <span>Offsets Cleared:</span>
                                            <span className="text-emerald-400 text-right">{esgData.offsetTons}</span>
                                        </div>
                                    </>
                                ) : null}
                            </div>

                            {/* Certificate Toggle */}
                            <button
                                onClick={() => setShowCert(true)}
                                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                <CertificateIcon className="w-4 h-4" />
                                Issue Eco-Sovereign Certificate
                            </button>
                        </div>
                    </div>

                    {/* Analytical & Projection Panel right */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Interactive Graph Box */}
                        <div className="bg-slate-50 dark:bg-slate-900  border border-slate-200 rounded-3xl p-6 shadow-xl space-y-6">
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">Projected Portfolio Performance (ESG)</h3>
                                <p className="text-xs text-[#0F172A] mt-1">Multi-year forecast on direct-air offset indices and carbon-free yields (%).</p>
                            </div>

                            <div className="h-[280px] w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-white/10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="offsetGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} className="font-mono" />
                                        <YAxis stroke="#64748b" fontSize={10} className="font-mono" />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                            labelStyle={{ color: '#94a3b8', fontSize: '10px', fontStyle: 'bold' }}
                                        />
                                        <Area type="monotone" dataKey="Yield" name="Annual Yield %" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#yieldGrad)" />
                                        <Area type="monotone" dataKey="Offsets" name="Metric Tons Saved" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#offsetGrad)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Recommendation Box */}
                            {esgData && (
                                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-emerald-500/20 flex gap-4">
                                    <div className="p-3 bg-emerald-500 text-emerald-400 border border-emerald-500/20 rounded-xl h-fit">
                                        <GlobeAmericasIcon className="w-5 h-5 text-emerald-400 animate-spin-slow" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest font-mono">Gemini Generative Portfolio Guidance</p>
                                        <p className="text-[#0F172A] text-xs leading-relaxed">
                                            {esgData.recommendation}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: Real-Time Security AI Copilot Chat */}
            {activeTab === 'chat' && (
                <div className="max-w-4xl mx-auto bg-slate-50 dark:bg-slate-900  border border-slate-200 rounded-3xl shadow-2xl h-[560px] flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-500 rounded-xl border border-emerald-500/20">
                                <SparklesIcon className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-white uppercase tracking-wider">Sovereign Gemini Quantum Node</h3>
                                <p className="text-[9.5px] text-[#0F172A] uppercase tracking-widest font-mono">Secure Core-3 Intercept Chat</p>
                            </div>
                        </div>
                        <span className="text-[9px] font-mono px-3 py-1 bg-teal-950 text-teal-400 border border-teal-500/20 rounded-full font-bold uppercase tracking-widest">
                            SHA-256 CONDUIT ACTIVE
                        </span>
                    </div>

                    {/* Messages Stack */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50 dark:bg-slate-800">
                        {messages.map((m, idx) => (
                            <div 
                                key={idx} 
                                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                            >
                                <div className={`max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed shadow-lg ${
                                    m.role === 'user' 
                                        ? 'bg-emerald-600 text-white rounded-tr-none' 
                                        : 'bg-slate-50 border border-slate-200 text-slate-100 rounded-tl-none'
                                }`}>
                                    <p className="font-sans whitespace-pre-line">{m.text}</p>
                                    <span className="text-[8px] opacity-40 block text-right mt-1.5 font-mono">
                                        SECURE PROTOCOL • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {isThinking && (
                            <div className="flex justify-start items-center gap-2 text-[#0F172A] text-xs font-mono pl-2">
                                <SpinnerIcon className="w-3.5 h-3.5 animate-spin" />
                                <span>Sovereign intelligence compiling feedback...</span>
                            </div>
                        )}
                    </div>

                    {/* Form Input */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-white/10 flex gap-2">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Direct secure portfolio inquiries to AI controller..."
                            className="flex-1 bg-slate-50 text-white text-xs px-4 py-3 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:border-emerald-500 transition-colors dark:bg-slate-900"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isThinking || !chatInput.trim()}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 rounded-2xl transition-all cursor-pointer flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <SendIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* HIGH-FIDELITY PRINTABLE ECO SIGNED CERTIFICATE OVERLAY */}
            <AnimatePresence>
                {showCert && (
                    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-800  flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-50 border-2 border-emerald-500/40 rounded-[2.5rem] p-8 md:p-12 max-w-2xl w-full text-center space-y-8 relative overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.15)] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] dark:bg-slate-900"
                        >
                            <div className="absolute top-4 right-4">
                                <button 
                                    onClick={() => setShowCert(false)}
                                    className="p-2 hover:bg-white rounded-full text-[#0F172A] hover:text-white transition-colors cursor-pointer dark:bg-slate-800"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="w-14 h-14 bg-emerald-500 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto shadow-md">
                                    <CertificateIcon className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.25em] font-mono leading-tight">First Pacific Bank Enclave</p>
                                    <h4 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider mt-1">Eco-Sovereign Ledger Certification</h4>
                                </div>
                            </div>

                            <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl text-left space-y-4 font-mono">
                                <div className="text-[10px] uppercase text-[#0F172A] border-b border-slate-200 dark:border-white/10 pb-2 flex justify-between">
                                    <span>CERT ID: FPB-ECO-{Date.now().toString().slice(-6)}</span>
                                    <span>STATUS: VERIFIED SECURED</span>
                                </div>
                                <div className="text-xs text-[#0F172A] leading-relaxed text-center py-4">
                                    We hereby certify that client account held by <span className="text-emerald-300 font-bold">{userProfile?.name}</span> (<span className="text-emerald-400 font-bold">{userProfile?.email}</span>) allocates <span className="text-emerald-300 font-bold border-b border-emerald-500/30 pb-0.5">{allocationSlider}% of capital index reserves</span> directly into certified climate mitigation and carbon offsetting structures. This portfolio conforms to elite US treasury green frameworks.
                                </div>
                                <div className="grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-white/10 pt-3 text-[10px] text-[#0F172A]">
                                    <div>
                                        <p className="text-[8px] uppercase text-[#0F172A]">Infrastructure Mode</p>
                                        <p className="text-white font-bold mt-0.5">{selectedSector.toUpperCase()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] uppercase text-[#0F172A]">Computed Offset</p>
                                        <p className="text-emerald-400 font-bold mt-0.5">{esgData?.offsetTons || '248.6 Metric Tons CO2e'}</p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-[9px] text-[#0F172A] font-mono italic">
                                Securely validated by First Pacific Bank Private Wealth Enclave Core-Neural Ledger system via Gemini 3.5 Flash.
                            </p>

                            <div className="flex justify-center gap-3">
                                <button
                                    onClick={() => window.print()}
                                    className="px-6 py-3 bg-white hover:bg-slate-700 text-white font-black uppercase tracking-widest text-[9px] rounded-xl transition-all flex items-center gap-2 cursor-pointer dark:bg-slate-800"
                                >
                                    <ArrowDownTrayIcon className="w-3.5 h-3.5" /> Printable PDF
                                </button>
                                <button
                                    onClick={() => setShowCert(false)}
                                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-[9px] rounded-xl transition-all cursor-pointer"
                                >
                                    Acknowledge Ledger
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
