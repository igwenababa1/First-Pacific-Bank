
import React, { useMemo } from 'react';
import { Transaction, TransactionStatus, Recipient } from '../types';
import { CheckCircleIcon, SendIcon, ArrowsRightLeftIcon, GlobeAltIcon, BankIcon, CurrencyDollarIcon, BrandLogo, getBankIcon } from './Icons';
import { SmsConfirmation } from './SmsConfirmation';
import { BANKS_BY_COUNTRY, SERVICES_CONFIG } from './constants';
import { TransactionFlowMap } from './TransactionFlowMap';

interface LiveTransactionViewProps {
  transaction: Transaction;
  phone?: string;
}

// Helper to resolve domain
const getRecipientDomain = (recipient: Recipient): string => {
    if (recipient.recipientType === 'service' && recipient.serviceName) {
         if (SERVICES_CONFIG[recipient.serviceName]) {
             return SERVICES_CONFIG[recipient.serviceName].domain;
         }
         return `${recipient.serviceName.toLowerCase().replace(/\s/g, '')}.com`;
    }
    
    // Check known banks map
    for (const country in BANKS_BY_COUNTRY) {
        const bank = BANKS_BY_COUNTRY[country].find(b => b.name === recipient.bankName);
        if (bank) return bank.domain;
    }

    return `${recipient.bankName.toLowerCase().replace(/\s/g, '')}.com`;
};

export const LiveTransactionView: React.FC<LiveTransactionViewProps> = ({ transaction, phone }) => {
    const { status, statusTimestamps, recipient } = transaction;
    
    const steps = useMemo(() => {
        const FinalIcon = () => {
            const domain = getRecipientDomain(recipient);
            const Fallback = getBankIcon(recipient.bankName);
            return (
                <BrandLogo 
                    domain={domain} 
                    name={recipient.bankName} 
                    fallback={Fallback} 
                    className="w-full h-full object-contain rounded-full" 
                />
            );
        };

        const allPossibleSteps = [
            { status: TransactionStatus.SUBMITTED, label: 'Payment Initiated', icon: <SendIcon className="w-6 h-6" /> },
            { status: TransactionStatus.CONVERTING, label: 'Processing FX', icon: <ArrowsRightLeftIcon className="w-6 h-6" /> },
            { status: TransactionStatus.IN_TRANSIT, label: 'Sent to Network', icon: <GlobeAltIcon className="w-6 h-6" /> },
            { status: TransactionStatus.FUNDS_ARRIVED, label: 'Funds Delivered', icon: <FinalIcon /> },
        ];
        return allPossibleSteps;
    }, [recipient]);

  const currentStepIndex = steps.findIndex(s => s.status === status);
  
  const progressPercentage = currentStepIndex >= 0 ? (currentStepIndex / (steps.length - 1)) * 100 : 0;
  const isComplete = status === TransactionStatus.FUNDS_ARRIVED;

  return (
    <div className="w-full font-sans">
      <div className="relative h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full my-10 shadow-inner overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-2.5 rounded-full transition-all duration-[2000ms] ease-in-out bg-gradient-to-r primary- to-primary"
          style={{ 
            width: `${progressPercentage}%`, 
            boxShadow: '0 0 12px rgba(0, 82, 255, 0.6)'
          }}
        >
            {/* Shimmer effect inside progress bar */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
        </div>
        
        {/* Floating indicator icon */}
        <div 
          className="absolute -top-4 transform -translate-x-1/2 transition-all duration-[2000ms] ease-in-out z-20"
          style={{ 
              left: `${progressPercentage}%`
          }}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[#0F172A] dark:text-white ring-4 ring-slate-900 shadow-lg transition-all duration-500 ${isComplete ? 'bg-green-500 scale-110' : 'bg-primary animate-pulse'}`}>
            {isComplete ? <CheckCircleIcon className="w-6 h-6" /> : <CurrencyDollarIcon className="w-6 h-6" />}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-start text-center relative z-10">
        {steps.map((step, index) => {
          const isStepCompleted = index <= currentStepIndex;
          const timestamp = statusTimestamps?.[step.status as keyof typeof statusTimestamps];
          const isFinal = index === steps.length - 1;

          return (
            <div key={step.status} className="w-1/4 px-1 flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-700 mb-2 border-2 overflow-hidden p-0.5 ${
                  isStepCompleted 
                  ? 'bg-white dark:bg-slate-900 border-primary text-primary shadow-[0_0_15px_rgba(0,82,255,0.3)]' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-300 text-[#0F172A]'}`
              }>
                {/* Clone element doesn't work well with custom components like FinalIcon, so render directly if valid element, or just render icon */}
                 {React.isValidElement(step.icon) ? React.cloneElement(step.icon as React.ReactElement<any>, { className: isFinal ? "w-full h-full object-contain rounded-full bg-white" : "w-6 h-6" }) : step.icon}
              </div>
              <p className={`text-xs font-bold transition-all duration-500 ${isStepCompleted ? 'text-[#0F172A] dark:text-white' : 'text-[#0F172A]'}`}>
                {step.label}
              </p>
              <div className={`h-4 overflow-hidden transition-all duration-500 ${isStepCompleted ? 'opacity-100 max-h-10' : 'opacity-0 max-h-0'}`}>
                  {timestamp && (
                     <p className="text-[10px] text-[#0F172A] dark:text-white mt-1 font-mono">
                       {timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                     </p>
                  )}
              </div>
            </div>
          );
        })}
      </div>
      
      {isComplete && (
        <div className="text-center mt-8 animate-fade-in-up">
            <div className="inline-flex items-center space-x-2 bg-green-500 text-green-400 border border-green-500/20 font-semibold px-6 py-2 rounded-full shadow-lg">
                <CheckCircleIcon className="w-5 h-5" />
                <span>Transfer Successful</span>
            </div>
        </div>
      )}

      {/* Render D3 Visualization for clearing path */}
      <div className="mt-8 animate-fade-in-up">
          <TransactionFlowMap 
             status={
                 status === TransactionStatus.FAILED ? 'halted' :
                 status === TransactionStatus.FUNDS_ARRIVED || status === TransactionStatus.COMPLETED ? 'completed' :
                 status === TransactionStatus.IN_TRANSIT ? 'clearing' :
                 'pending'
             }
          />
      </div>

      {isComplete && phone && (
        <div className="mt-6 text-left">
            <SmsConfirmation transaction={transaction} phone={phone} />
        </div>
      )}
    </div>
  );
};
