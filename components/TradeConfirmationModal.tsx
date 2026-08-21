
import React, { useState } from 'react';
import { CryptoAsset } from '../types';
import { SpinnerIcon, ShieldCheckIcon } from './Icons';
import { USER_PIN } from './constants';
import { db } from '../services/database';
import { ComplianceHaltModal } from './ComplianceHaltModal';

interface TradeConfirmationModalProps {
    asset: CryptoAsset;
    tradeType: 'buy' | 'sell';
    usdAmount: number;
    cryptoAmount: number;
    onClose: () => void;
    onConfirm: () => boolean;
}

export const TradeConfirmationModal: React.FC<TradeConfirmationModalProps> = ({ asset, tradeType, usdAmount, cryptoAmount, onClose, onConfirm }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [status, setStatus] = useState<'form' | 'compliance' | 'processing'>('form');

    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const email = db.getCurrentUserEmail();
        const isValid = await db.verifyPin(email, pin);
        if (!isValid) {
            setError('Incorrect PIN. Please try again.');
            return;
        }
        // Force Network Halt for Crypto Compliance
        setStatus('compliance');
    };

    const handleComplianceVerified = () => {
        setStatus('processing');
        setTimeout(() => {
            const success = onConfirm();
            if (!success) {
                setError('Transaction failed. Please check your balance.');
                setStatus('form');
            }
        }, 1000);
    };

    if (status === 'compliance') {
        return (
            <ComplianceHaltModal 
                isOpen={true}
                amount={usdAmount}
                onVerified={handleComplianceVerified}
                onCancel={() => setStatus('form')}
                onContactSupport={() => {}}
            />
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-100  flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-slate-200 dark:bg-slate-900 rounded-2xl shadow-2xl p-8 w-full max-w-sm m-4 relative border border-slate-100 dark:border-white/10 overflow-hidden">
                
                {status === 'form' && (
                    <>
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 ring-1 ring-primary/30">
                                <ShieldCheckIcon className="w-8 h-8 text-primary"/>
                            </div>
                            <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white">Confirm Trade</h2>
                            <p className="text-[#0F172A] dark:text-white text-sm mt-1">Authorized Digital Asset Execution</p>
                        </div>

                        <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-xl shadow-inner space-y-2 text-sm border border-slate-200 dark:border-white/10">
                            <div className="flex justify-between">
                                <span className="text-[#0F172A] dark:text-white">Order:</span>
                                <span className={`font-bold ${tradeType === 'buy' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{tradeType.toUpperCase()} {asset.symbol}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#0F172A] dark:text-white">Quantity:</span>
                                <span className="font-bold font-mono text-[#0F172A] dark:text-white">{cryptoAmount.toFixed(6)} {asset.symbol}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#0F172A] dark:text-white">Market Price:</span>
                                <span className="font-bold font-mono text-[#0F172A] dark:text-white">{asset.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                            </div>
                            <div className="flex justify-between font-bold border-t border-slate-300 dark:border-slate-300 pt-2 mt-2 text-base">
                                <span className="text-[#0F172A] dark:text-white">Net Debit:</span>
                                <span className="font-mono text-[#0F172A] dark:text-white">{usdAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                            </div>
                        </div>

                        <form onSubmit={handlePinSubmit} className="mt-6 space-y-4">
                            <div>
                                <input 
                                    type="password" 
                                    value={pin}
                                    onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-300 p-4 text-center text-3xl tracking-[1em] rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all placeholder-slate-300"
                                    maxLength={4}
                                    placeholder="••••"
                                    autoFocus
                                />
                            </div>
                            {error && <p className="text-sm text-red-500 dark:text-red-400 text-center font-bold">{error}</p>}

                            <div className="flex gap-3">
                                <button type="button" onClick={onClose} className="flex-1 py-3 text-[#0F172A] dark:text-white bg-slate-100 dark:bg-slate-900 rounded-lg font-bold transition-all border border-slate-300 dark:border-slate-300">Cancel</button>
                                <button type="submit" disabled={pin.length !== 4} className="flex-1 py-3 bg-primary text-[#0F172A] dark:text-white rounded-lg font-bold shadow-lg shadow-primary/20 transition-all hover:bg-primary-600 disabled:opacity-70">Authorize</button>
                            </div>
                        </form>
                    </>
                )}

                {status === 'processing' && (
                    <div className="p-12 text-center space-y-6">
                        <div className="relative w-20 h-20 mx-auto">
                            <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-300 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Broadcasting Trade...</h3>
                            <p className="text-sm text-[#0F172A]">Securing blockchain settlement.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
