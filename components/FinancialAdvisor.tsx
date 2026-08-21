
import React, { useState } from 'react';
import { AdvisorResponse, View } from '../types';
import { SpinnerIcon, SparklesIcon, InfoIcon, LightBulbIcon, TrendingUpIcon, ArrowPathIcon, SendIcon } from './Icons';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

interface FinancialAdvisorProps {
    analysis: AdvisorResponse | null;
    isAnalyzing: boolean;
    analysisError: boolean;
    runFinancialAnalysis: () => void;
}

export const FinancialAdvisor: React.FC<FinancialAdvisorProps> = ({ analysis, isAnalyzing, analysisError, runFinancialAnalysis }) => {
    const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatting, setIsChatting] = useState(false);

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isChatting) return;
        const newMsg = { role: 'user', content: chatInput };
        setChatMessages(prev => [...prev, newMsg]);
        setChatInput('');
        setIsChatting(true);

        try {
            const res = await fetch('/api/ai/chatgpt-42', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...chatMessages, newMsg],
                    system_prompt: "You are a professional financial advisor. Keep answers concise.",
                    temperature: 0.9,
                    top_k: 5,
                    top_p: 0.9,
                    max_tokens: 256,
                    web_access: false
                })
            });
            const data = await res.json();
            if (data && data.result) {
                setChatMessages(prev => [...prev, { role: 'assistant', content: data.result }]);
            } else {
                setChatMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now." }]);
            }
        } catch (e) {
            setChatMessages(prev => [...prev, { role: 'assistant', content: "An error occurred." }]);
        } finally {
            setIsChatting(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
             <div>
                <h2 className="text-3xl font-bold text-[#0F172A] dark:text-white tracking-tight">Portfolio Strategist</h2>
                <p className="text-[#0F172A] dark:text-white mt-2">Expert-level insights into your global financial trajectory.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Advisor analysis left */}
                <div className="md:col-span-2 space-y-6">
                    <div className="text-center p-8 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                        <div className="relative z-10">
                            <TrendingUpIcon className="w-12 h-12 text-primary mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white mb-2">Strategic Wealth Planning</h3>
                            <p className="text-[#0F172A] dark:text-white max-w-sm mx-auto leading-relaxed mb-6 text-sm">
                                Our advanced analytics engine evaluates your spending, saving, and investment data across all nodes.
                            </p>
                            
                            {analysisError ? (
                                <div className="bg-red-500 border border-red-500/20 rounded-2xl p-4 mb-4 max-w-sm mx-auto">
                                    <div className="flex items-center justify-center gap-2 text-red-400 mb-2">
                                        <InfoIcon className="w-4 h-4" />
                                        <span className="font-bold text-sm">Analysis Failed</span>
                                    </div>
                                    <button onClick={runFinancialAnalysis} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-[#0F172A] dark:text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 mx-auto">
                                        <ArrowPathIcon className="w-3 h-3" /> Retry Analysis
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={runFinancialAnalysis} 
                                    disabled={isAnalyzing}
                                    className="px-8 py-3 bg-white text-[#0F172A] font-black uppercase tracking-widest rounded-xl shadow-xl hover:scale-105 transition-all disabled:opacity-70 flex items-center gap-2 mx-auto text-xs dark:bg-slate-800"
                                >
                                    {isAnalyzing && <SpinnerIcon className="w-4 h-4 animate-spin" />}
                                    {isAnalyzing ? 'Analyzing...' : 'Refresh Strategy'}
                                </button>
                            )}
                        </div>
                    </div>

                    {analysis && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-white/10">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Financial Health Score</h3>
                                    <span className="text-2xl font-black text-primary">{analysis.financialScore}/100</span>
                                </div>
                                <p className="text-[#0F172A] dark:text-white text-sm">{analysis.overallSummary}</p>
                            </div>

                            {/* Portfolio Allocation vs Benchmark Radar Chart */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-xl space-y-4">
                                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/10">
                                    <div>
                                        <h3 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-wider">Benchmark Alignment</h3>
                                        <p className="text-[10px] text-[#0F172A] uppercase tracking-widest mt-0.5">Asset Allocation vs Core Institutional Benchmark</p>
                                    </div>
                                    <span className="bg-emerald-500 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold">
                                        VERIFIED BENCHMARK
                                    </span>
                                </div>
                                <div className="h-[320px] w-full flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                            { subject: 'Investments', current: 85, benchmark: 70, fullMark: 100 },
                                            { subject: 'Liquidity', current: analysis.financialScore > 80 ? 65 : 45, benchmark: 50, fullMark: 100 },
                                            { subject: 'Debt Servicing', current: 30, benchmark: 20, fullMark: 100 },
                                            { subject: 'Offshore Yield', current: 75, benchmark: 60, fullMark: 100 },
                                            { subject: 'Tax Structure', current: 90, benchmark: 80, fullMark: 100 },
                                            { subject: 'Overhead Cost', current: 40, benchmark: 35, fullMark: 100 }
                                        ]}>
                                            <PolarGrid stroke="rgba(148, 163, 184, 0.15)" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 8 }} stroke="rgba(148, 163, 184, 0.1)" />
                                            <Radar name="Your Portfolio" dataKey="current" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                                            <Radar name="Bank Benchmark" dataKey="benchmark" stroke="#6366f1" fill="#6366f1" fillOpacity={0.05} strokeDasharray="3 3" />
                                            <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', marginTop: '10px' }} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-xs text-[#0F172A] dark:text-white leading-relaxed border border-slate-100 dark:border-white/10">
                                    💡 <strong>Advisor Analysis:</strong> Your current portfolio exhibits higher concentration in <strong>Offshore Yield</strong> and <strong>Investments</strong> relative to suggested baseline benchmarks. This aligns with a sovereign private banking trajectory.
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {analysis.insights.map((insight, idx) => (
                                    <div key={idx} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-md">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em]">{insight.category}</h4>
                                            <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${insight.priority === 'high' ? 'bg-red-100 text-red-600' : 'primary- primary-'}`}>{insight.priority}</span>
                                        </div>
                                        <p className="text-[#0F172A] dark:text-white text-xs leading-relaxed">
                                            {insight.insight}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!analysis && !isAnalyzing && !analysisError && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70 pointer-events-none filter blur-sm select-none">
                            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl">
                                <h4 className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-2">Market Insight</h4>
                                <p className="text-[#0F172A] dark:text-white text-xs leading-relaxed">
                                    Global indices show consistent resilience in the fintech sector. We recommend maintaining current liquidity levels while exploring high-yield offshore opportunities.
                                </p>
                            </div>
                            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl">
                                <h4 className="text-xs font-black text-emerald-500 uppercase tracking-[0.3em] mb-2">Efficiency Node</h4>
                                <p className="text-[#0F172A] dark:text-white text-xs leading-relaxed">
                                    Automated clearing for domestic utilities could reduce monthly overhead by 2.4%.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* GPT Chat right column */}
                <div className="bg-[#0c121e] rounded-[2.5rem] border border-slate-200 dark:border-white/10 flex flex-col shadow-2xl h-[500px] overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-white[0.02] dark:bg-slate-800">
                        <h3 className="font-bold text-white flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-primary" /> Assistant AI 4.2</h3>
                        <p className="text-[10px] text-[#0F172A] uppercase tracking-widest mt-1">Institutional Intelligence</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {chatMessages.length === 0 && (
                            <div className="text-center text-[#0F172A] text-xs mt-10">
                                Ask me anything about your finances, market trends, or app usage.
                            </div>
                        )}
                        {chatMessages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-primary text-[#0F172A] rounded-br-sm' : 'bg-white text-[#0F172A] rounded-bl-sm border border-slate-200 dark:border-white/10'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isChatting && (
                            <div className="flex justify-start">
                                <div className="bg-white text-[#0F172A] rounded-2xl rounded-bl-sm p-3 text-sm border border-slate-200 dark:border-white/10 flex items-center gap-2 dark:bg-slate-800">
                                    <SpinnerIcon className="w-4 h-4 animate-spin text-primary" /> Thinking...
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800">
                        <div className="flex bg-slate-100 rounded-xl border border-slate-200 dark:border-white/10 p-1">
                            <input 
                                type="text"
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type a message..."
                                className="flex-1 bg-transparent text-white text-sm px-3 outline-none"
                            />
                            <button 
                                onClick={handleSendMessage}
                                disabled={isChatting || !chatInput.trim()}
                                className="p-2 bg-primary rounded-lg text-[#0F172A] disabled:opacity-70"
                            >
                                <SendIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {analysis && (
                <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-white/10">
                    <h4 className="text-lg font-bold text-[#0F172A] dark:text-white mb-4">Recommended Actions</h4>
                    <div className="space-y-4">
                        {analysis.recommendations.map((rec, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-white/10">
                                <div>
                                    <p className="font-bold text-[#0F172A] dark:text-white">{rec.suggestedAction}</p>
                                    <p className="text-xs text-[#0F172A] dark:text-white mt-1">{rec.reason}</p>
                                </div>
                                <Link to={`/${rec.linkTo}`} className="px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary hover:text-[#0F172A] dark:text-white transition-colors">
                                    View
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
