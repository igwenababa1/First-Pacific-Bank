
import React, { useState } from 'react';
import { CurrencyConverter } from './CurrencyConverter';
import { RealtimeCurrencyConverter } from './RealtimeCurrencyConverter';
import { XIcon } from './Icons';

interface CurrencyConverterModalProps {
  onClose: () => void;
  balances?: { usd: number; btc: number };
  accounts?: any[];
  setAccounts?: React.Dispatch<React.SetStateAction<any[]>>;
  cryptoHoldings?: any[];
  setCryptoHoldings?: React.Dispatch<React.SetStateAction<any[]>>;
  onSwap?: (fromId: string, toId: string, fromAmount: number, toAmount: number, rate: number, symbol: string) => void;
}

export const CurrencyConverterModal: React.FC<CurrencyConverterModalProps> = ({ 
  onClose, 
  balances, 
  accounts, 
  setAccounts, 
  cryptoHoldings, 
  setCryptoHoldings, 
  onSwap 
}) => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'swap'>('calculator');

  return (
    <div 
      className="fixed inset-0 bg-slate-100  z-[100] flex flex-col items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg relative animate-fade-in-up flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Floating Segmented Pill Tab Switcher */}
        <div className="flex bg-slate-50 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 shadow-2xl max-w-sm mx-auto w-full  shrink-0">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-300 ${
              activeTab === 'calculator' 
                ? 'bg-primary text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.3)]' 
                : 'text-[#0F172A] hover:text-white'
            }`}
          >
            Converter
          </button>
          <button
            onClick={() => setActiveTab('swap')}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-300 ${
              activeTab === 'swap' 
                ? 'bg-primary text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.3)]' 
                : 'text-[#0F172A] hover:text-white'
            }`}
          >
            Liquid Swap
          </button>
        </div>

        {/* Modal Content */}
        <div className="relative w-full">
          <button 
            onClick={onClose}
            title="Close"
            className="absolute -top-3 -right-3 w-10 h-10 bg-slate-100 dark:bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center text-[#0F172A] dark:text-white z-20 border-2 border-slate-200 dark:border-slate-700 shadow-lg transition-transform hover:scale-110 active:scale-95"
          >
            <XIcon className="w-6 h-6" />
          </button>
          
          {activeTab === 'calculator' ? (
            <RealtimeCurrencyConverter onClose={onClose} />
          ) : (
            <CurrencyConverter 
              balances={balances} 
              accounts={accounts}
              setAccounts={setAccounts}
              cryptoHoldings={cryptoHoldings}
              setCryptoHoldings={setCryptoHoldings}
              onSwap={onSwap} 
              onClose={onClose} 
            />
          )}
        </div>
      </div>
    </div>
  );
};
