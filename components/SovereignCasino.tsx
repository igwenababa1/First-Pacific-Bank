import React, { useState, useEffect } from 'react';
import { Account, TransactionStatus, Transaction } from '../types';
import { TrophyIcon, ChartBarIcon, CurrencyDollarIcon, ActivityIcon, XCircleIcon, CheckCircleIcon } from './Icons';
import { db } from '../services/database';

interface SovereignCasinoProps {
    accounts: Account[];
    createTransaction: (tx: any, prefix: string) => Promise<boolean | void>;
    addNotification: (type: any, title: string, message: string) => void;
}

export const SovereignCasino: React.FC<SovereignCasinoProps> = ({ accounts, createTransaction, addNotification }) => {
    const [activeTab, setActiveTab] = useState<'roulette' | 'sports' | 'crypto'>('roulette');
    const [isLoading, setIsLoading] = useState(false);
    const [betAmount, setBetAmount] = useState<string>('100');
    
    // Roulette State
    const [selectedColor, setSelectedColor] = useState<'red' | 'black' | 'green'>('red');
    const [spinResult, setSpinResult] = useState<{ number: number, color: string } | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);

    // Sports State
    const [selectedMatch, setSelectedMatch] = useState<string>('');
    const [matchResult, setMatchResult] = useState<{ winner: string, odds: number } | null>(null);

    // UI
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const checkBalance = (amount: number) => {
        if (!accounts || accounts.length === 0) return false;
        // checking the first active checking account or just the first account
        const account = accounts[0];
        return account.balance >= amount;
    };

    const processBet = async (amount: number, multiplier: number, won: boolean, gameName: string) => {
        try {
            const account = accounts[0];
            if (!account) return;

            if (won) {
                const winnings = amount * multiplier;
                // Add winnings (Credit)
                await createTransaction({
                    accountId: account.id,
                    recipient: { fullName: `Sovereign Yield: ${gameName}` },
                    sendAmount: winnings,
                    receiveAmount: winnings,
                    fee: 0,
                    exchangeRate: 1,
                    status: TransactionStatus.COMPLETED,
                    estimatedArrival: new Date(),
                    description: `Yield Return: ${gameName}`,
                    type: 'credit',
                    category: 'Entertainment'
                }, 'CAS-WIN');
                setMessage({ type: 'success', text: `You won $${winnings.toLocaleString()}!` });
            } else {
                // Deduct Bet (Debit)
                await createTransaction({
                    accountId: account.id,
                    recipient: { fullName: `Sovereign Capital: ${gameName}` },
                    sendAmount: amount,
                    receiveAmount: amount,
                    fee: 0,
                    exchangeRate: 1,
                    status: TransactionStatus.COMPLETED,
                    estimatedArrival: new Date(),
                    description: `Capital Placement: ${gameName}`,
                    type: 'debit',
                    category: 'Entertainment'
                }, 'CAS-BET');
                setMessage({ type: 'error', text: `You lost $${amount.toLocaleString()}.` });
            }
        } catch (err) {
            console.error("Bet processing failed.", err);
        }
    };

    const playRoulette = async () => {
        const amount = parseFloat(betAmount);
        if (isNaN(amount) || amount <= 0) {
            setMessage({ type: 'error', text: 'Enter a valid bet amount.' });
            return;
        }
        if (!checkBalance(amount)) {
            setMessage({ type: 'error', text: 'Insufficient funds for this stake.' });
            return;
        }

        setMessage(null);
        setIsSpinning(true);
        setSpinResult(null);

        // Simulation delay
        setTimeout(async () => {
            const number = Math.floor(Math.random() * 37); // 0-36
            let color = 'green'; // 0
            if (number !== 0) {
                color = number % 2 === 0 ? 'black' : 'red';
            }

            setSpinResult({ number, color });
            setIsSpinning(false);

            const isWin = color === selectedColor;
            const multiplier = selectedColor === 'green' ? 14 : 2; // high risk/reward for green

            await processBet(amount, multiplier, isWin, 'Roulette Protocol');
        }, 3000);
    };

    const playSports = async () => {
        const amount = parseFloat(betAmount);
        if (isNaN(amount) || amount <= 0) {
            setMessage({ type: 'error', text: 'Enter a valid bet amount.' });
            return;
        }
        if (!selectedMatch) {
            setMessage({ type: 'error', text: 'Select a match to predict.' });
            return;
        }
        if (!checkBalance(amount)) {
            setMessage({ type: 'error', text: 'Insufficient funds for this stake.' });
            return;
        }

        setMessage(null);
        setIsLoading(true);

        setTimeout(async () => {
            const isWin = Math.random() > 0.6; // 40% win chance
            const odds = parseFloat((Math.random() * (3.5 - 1.5) + 1.5).toFixed(2));
            setMatchResult({ winner: isWin ? 'Your Selection' : 'Opponent', odds });
            setIsLoading(false);

            await processBet(amount, odds, isWin, 'Global Sports Arbitrage');
        }, 2000);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="bg-slate-50 border border-slate-200 dark:border-white/10 rounded-[2rem] p-8 relative overflow-hidden  dark:bg-slate-900">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-primary to-amber-500"></div>
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-primary/20 flex items-center justify-center border border-amber-500/30">
                            <TrophyIcon className="w-8 h-8 text-amber-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white uppercase tracking-widest">Sovereign Stakes</h1>
                            <p className="text-sm font-mono text-[#0F172A] mt-1 uppercase tracking-widest">Global Wealth Forecasting & Risk Ledgers</p>
                        </div>
                    </div>
                    <div className="bg-slate-100 border border-amber-500/20 px-6 py-4 rounded-2xl text-right">
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Available Capital Reserve</p>
                        <p className="text-2xl font-black text-white font-mono">${(accounts[0]?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-4 p-2 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 overflow-x-auto custom-scrollbar">
                <button 
                    onClick={() => { setActiveTab('roulette'); setMessage(null); }}
                    className={`flex items-center gap-3 px-6 py-4 rounded-xl font-black text-xs tracking-widest uppercase transition-all whitespace-nowrap ${activeTab === 'roulette' ? 'bg-amber-500 text-[#0F172A] shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'text-[#0F172A] hover:text-white hover:bg-white'}`}
                >
                    <ChartBarIcon className="w-4 h-4" />
                    Market Roulette
                </button>
                <button 
                    onClick={() => { setActiveTab('sports'); setMessage(null); }}
                    className={`flex items-center gap-3 px-6 py-4 rounded-xl font-black text-xs tracking-widest uppercase transition-all whitespace-nowrap ${activeTab === 'sports' ? 'bg-amber-500 text-[#0F172A] shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'text-[#0F172A] hover:text-white hover:bg-white'}`}
                >
                    <ActivityIcon className="w-4 h-4" />
                    Sports Arbitrage
                </button>
            </div>

            {/* Content Area */}
            {message && (
                <div className={`p-6 rounded-2xl flex items-center justify-between border  animate-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-emerald-500 border-emerald-500/30' : 'bg-rose-500 border-rose-500/30'}`}>
                    <div className="flex items-center gap-4">
                        {message.type === 'success' ? <CheckCircleIcon className="w-8 h-8 text-emerald-400" /> : <XCircleIcon className="w-8 h-8 text-rose-400" />}
                        <div>
                            <p className={`font-black uppercase tracking-widest text-sm ${message.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {message.type === 'success' ? 'Yield Generated' : 'Capital Liquidated'}
                            </p>
                            <p className="text-white font-mono mt-1">{message.text}</p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'roulette' && (
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Controls */}
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 space-y-8 ">
                        <div>
                            <label className="text-[10px] font-black uppercase text-[#0F172A] tracking-widest mb-4 block">Stake Amount (USD)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                    <CurrencyDollarIcon className="w-6 h-6 text-[#0F172A]" />
                                </div>
                                <input
                                    type="number"
                                    value={betAmount}
                                    onChange={(e) => setBetAmount(e.target.value)}
                                    className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 rounded-2xl pl-14 pr-6 py-6 text-3xl font-black text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors font-mono"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase text-[#0F172A] tracking-widest mb-4 block">Select Index Protocol (Color)</label>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setSelectedColor('red')}
                                    className={`flex-1 py-6 rounded-2xl font-black uppercase tracking-widest border transition-all ${selectedColor === 'red' ? 'bg-red-500 text-white border-red-400 shadow-[0_0_25px_rgba(239,68,68,0.3)]' : 'bg-red-500 text-red-400 border-red-500/20 hover:bg-red-500'}`}
                                >
                                    Red Index
                                </button>
                                <button
                                    onClick={() => setSelectedColor('black')}
                                    className={`flex-1 py-6 rounded-2xl font-black uppercase tracking-widest border transition-all ${selectedColor === 'black' ? 'bg-white text-white border-slate-600 shadow-[0_0_25px_rgba(0,0,0,0.5)]' : 'bg-slate-100 text-[#0F172A] border-slate-200 dark:border-white/10 hover:bg-slate-100'}`}
                                >
                                    Black Index
                                </button>
                                <button
                                    onClick={() => setSelectedColor('green')}
                                    className={`flex-1 py-6 rounded-2xl font-black uppercase tracking-widest border transition-all ${selectedColor === 'green' ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)]' : 'bg-emerald-500 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500'}`}
                                >
                                    Zero (14x)
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={playRoulette}
                            disabled={isSpinning || parseFloat(betAmount) <= 0}
                            className="w-full py-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-black uppercase tracking-widest text-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                        >
                            {isSpinning ? 'Executing Protocol...' : 'Commit Stake Reserve'}
                        </button>
                    </div>

                    {/* Wheel Display */}
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center justify-center min-h-[400px]  relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent"></div>
                        {isSpinning ? (
                            <div className="relative animate-pulse">
                                <div className="w-48 h-48 rounded-full border-8 border-dashed border-amber-500/50 animate-[spin_1s_linear_infinite] flex items-center justify-center">
                                    <div className="text-amber-500/50 font-black tracking-widest uppercase text-xs">Simulating</div>
                                </div>
                            </div>
                        ) : spinResult ? (
                            <div className="flex flex-col items-center justify-center animate-in zoom-in-75 duration-500">
                                <div className={`w-48 h-48 rounded-full flex items-center justify-center text-7xl font-black shadow-2xl ${
                                    spinResult.color === 'red' ? 'bg-red-500 text-white shadow-red-500/50' : 
                                    spinResult.color === 'black' ? 'bg-white text-white shadow-slate-900/50' : 
                                    'bg-emerald-500 text-white shadow-emerald-500/50'
                                }`}>
                                    {spinResult.number}
                                </div>
                                <div className="mt-8 text-center">
                                    <p className="text-[#0F172A] font-mono uppercase tracking-widest text-xs">Protocol Result</p>
                                    <p className={`text-2xl font-black uppercase tracking-widest mt-2 ${
                                        spinResult.color === 'red' ? 'text-red-400' : 
                                        spinResult.color === 'black' ? 'text-[#0F172A]' : 'text-emerald-400'
                                    }`}>{spinResult.color} Index {spinResult.number}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center opacity-70">
                                <TrophyIcon className="w-24 h-24 text-[#0F172A] mx-auto mb-4" />
                                <p className="text-[#0F172A] font-black uppercase tracking-widest">Awaiting Capital Commitment</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'sports' && (
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 space-y-8 ">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <label className="text-[10px] font-black uppercase text-[#0F172A] tracking-widest mb-4 block">Global Sports Arbitrage Portfolio</label>
                            <select 
                                value={selectedMatch} 
                                onChange={(e) => setSelectedMatch(e.target.value)}
                                className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 rounded-2xl p-6 text-white appearance-none focus:outline-none focus:border-amber-500 uppercase tracking-widest text-xs font-bold"
                            >
                                <option value="" disabled>Select Target Asset</option>
                                <option value="NFL">Los Angeles Rams vs. SF 49ers (NFL Futures)</option>
                                <option value="UCL">Real Madrid vs. Bayern Munich (UCL Final)</option>
                                <option value="NBA">LA Lakers vs. GS Warriors (NBA Playoffs)</option>
                                <option value="F1">Monaco Grand Prix: Constructor Predictor</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="text-[10px] font-black uppercase text-[#0F172A] tracking-widest mb-4 block">Stake Amount (USD)</label>
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(e.target.value)}
                                className="w-full bg-slate-100 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-6 text-xl font-black text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <button
                        onClick={playSports}
                        disabled={isLoading || !selectedMatch || parseFloat(betAmount) <= 0}
                        className="w-full py-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-black uppercase tracking-widest text-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                    >
                        {isLoading ? 'Calculating Derivatives...' : 'Execute Arbitrage Contract'}
                    </button>

                    {matchResult && (
                        <div className="p-8 mt-8 bg-slate-100 rounded-3xl border border-slate-200 dark:border-white/10 text-center flex flex-col items-center">
                            <p className="text-[10px] font-black uppercase text-[#0F172A] tracking-widest mb-2">Arbitrage Settlement Result</p>
                            <h2 className={`text-4xl font-black uppercase tracking-widest ${matchResult.winner === 'Your Selection' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {matchResult.winner}
                            </h2>
                            <p className="text-white font-mono mt-4 bg-white px-4 py-2 rounded-lg dark:bg-slate-800">Settled at {matchResult.odds}x Output</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
