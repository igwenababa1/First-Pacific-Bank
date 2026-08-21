import React from 'react';
import { Transaction, TransactionStatus } from '../types';
import { SendIcon, getBankIcon } from './Icons';

interface DynamicIslandSimulatorProps {
  transaction: Transaction | null;
}

const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

export const DynamicIslandSimulator: React.FC<DynamicIslandSimulatorProps> = ({ transaction }) => {
  const isVisible = transaction && transaction.status !== TransactionStatus.FUNDS_ARRIVED;
  const BankIconComponent = transaction ? getBankIcon(transaction.recipient.bankName) : SendIcon;

  const progressPercentage = (() => {
    if (!transaction) return 0;
    switch (transaction.status) {
      case TransactionStatus.SUBMITTED: return 10;
      case TransactionStatus.CONVERTING: return 40;
      case TransactionStatus.IN_TRANSIT: return 75;
      default: return 0;
    }
  })();

  return (
    <div
      className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 w-80 h-16 bg-slate-100 rounded-[32px] shadow-2xl flex items-center justify-between p-3 transition-all duration-500 ease-in-out ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}
      aria-hidden={!isVisible}
      role="status"
    >
      {transaction && (
        <>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center text-[#0F172A] dark:text-white font-bold text-sm shadow-inner">
              <BankIconComponent className="w-6 h-6" />
            </div>
            <div className="text-[#0F172A] dark:text-white">
              <p className="text-sm font-semibold leading-tight">{transaction.recipient.nickname || getInitials(transaction.recipient.fullName)}</p>
              <p className="text-xs text-[#0F172A] dark:text-white leading-tight">Sending funds...</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-12 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                    className="h-2 bg-green-500 rounded-full transition-all duration-500"
                    style={{width: `${progressPercentage}%`}}
                ></div>
            </div>
            <SendIcon className="w-5 h-5 text-[#0F172A] transform -rotate-45" />
          </div>
        </>
      )}
    </div>
  );
};