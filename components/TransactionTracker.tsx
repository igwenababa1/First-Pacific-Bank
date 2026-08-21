
import React from 'react';
import { Transaction, TransactionStatus } from '../types';
import { CheckCircleIcon, SendIcon, ArrowsRightLeftIcon, ShieldCheckIcon, ScaleIcon, GlobeAltIcon, BankIcon, XCircleIcon, ClockIcon } from './Icons';

interface TransactionTrackerProps {
  transaction: Transaction;
  theme?: 'light' | 'dark';
}

export const TransactionTracker: React.FC<TransactionTrackerProps> = ({ transaction, theme = 'dark' }) => {
  const { status, statusTimestamps } = transaction;

  const allPossibleSteps = [
    { status: TransactionStatus.SUBMITTED, label: 'Payment Initiated', icon: <SendIcon className="w-6 h-6" /> },
    { status: TransactionStatus.CONVERTING, label: 'Processing FX', icon: <ArrowsRightLeftIcon className="w-6 h-6" /> },
    { status: TransactionStatus.AWAITING_AUTHORIZATION, label: 'Pending Authorization', icon: <ShieldCheckIcon className="w-6 h-6" /> },
    { status: TransactionStatus.FLAGGED_AWAITING_CLEARANCE, label: 'Compliance Review', icon: <ScaleIcon className="w-6 h-6" /> },
    { status: TransactionStatus.CLEARANCE_GRANTED, label: 'Authorization Success', icon: <ShieldCheckIcon className="w-6 h-6" /> },
    { status: TransactionStatus.IN_TRANSIT, label: 'Sent to Network', icon: <GlobeAltIcon className="w-6 h-6" /> },
    { status: TransactionStatus.FUNDS_ARRIVED, label: 'Funds Delivered', icon: <BankIcon className="w-6 h-6" /> },
  ];
  
  // Determine if transaction failed
  const isFailed = status === TransactionStatus.FAILED;
  const isProcessing = status === TransactionStatus.PROCESSING;

  const steps = allPossibleSteps.filter(step => 
      step.status === status || statusTimestamps[step.status as keyof typeof statusTimestamps] || (isFailed && step.status === TransactionStatus.SUBMITTED)
  );

  const currentStepIndex = steps.findIndex(s => s.status === status);
  const isComplete = status === TransactionStatus.FUNDS_ARRIVED || status === TransactionStatus.COMPLETED;

  const styles = {
    light: {
      stepBgDefault: 'bg-slate-200 text-[#0F172A]',
      stepTextActive: 'text-[#1E293B]',
      stepTextInactive: 'text-[#0F172A]',
      timestamp: 'text-[#0F172A]',
      line: 'bg-slate-300',
    },
    dark: {
      stepBgDefault: 'bg-slate-100 dark:bg-slate-700 text-[#0F172A] dark:text-white',
      stepTextActive: 'text-[#0F172A] dark:text-[#1E293B]',
      stepTextInactive: 'text-[#0F172A]',
      timestamp: 'text-[#0F172A] dark:text-white',
      line: 'bg-slate-600',
    }
  }[theme];

  return (
    <div className="w-full">
      <div className="flex items-start justify-between">
        {steps.map((step, index) => {
          const isStepCompleted = (index < currentStepIndex || isComplete) && !isFailed;
          const isCurrentStep = index === currentStepIndex && !isComplete && !isFailed;
          const timestamp = statusTimestamps[step.status as keyof typeof statusTimestamps];
          const isFlaggedStep = step.status === TransactionStatus.FLAGGED_AWAITING_CLEARANCE;

          // Override for Failed State
          if (isFailed && index === steps.length - 1) {
              return (
                  <React.Fragment key="failed">
                      <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-red-500 text-[#0F172A] dark:text-white`}>
                              <XCircleIcon className="w-6 h-6" />
                          </div>
                          <p className={`mt-2 text-xs text-center font-bold w-24 text-red-500`}>
                              Transaction Failed
                          </p>
                          {timestamp && (
                            <div className={`text-xs ${styles.timestamp} mt-1 text-center`}>
                                <p>{new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                <p>{new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          )}
                      </div>
                  </React.Fragment>
              );
          }

          return (
            <React.Fragment key={step.status}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isStepCompleted
                      ? 'bg-green-500 text-[#0F172A] dark:text-white'
                      : isCurrentStep && isFlaggedStep
                      ? 'bg-yellow-500 text-[#0F172A] dark:text-white animate-pulse'
                      : isCurrentStep || (isProcessing && index === steps.length -1)
                      ? 'bg-primary text-[#0F172A] dark:text-white animate-pulse'
                      : styles.stepBgDefault
                  }`}
                >
                  {isStepCompleted ? (
                    <CheckCircleIcon className="w-6 h-6" />
                  ) : (
                    React.cloneElement(step.icon, {
                        className: `w-6 h-6 ${isCurrentStep ? 'text-[#0F172A] dark:text-white' : ''}`
                    })
                  )}
                </div>
                <p
                  className={`mt-2 text-xs text-center font-bold w-24 ${
                    isStepCompleted || isCurrentStep ? styles.stepTextActive : styles.stepTextInactive
                  }`}
                >
                  {step.label}
                </p>
                {timestamp && (
                  <div className={`text-xs ${styles.timestamp} mt-1 text-center`}>
                    <p>{new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    <p>{new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 mt-5 transition-colors duration-300 ${
                    isStepCompleted ? 'bg-green-500' : styles.line
                  }`}
                ></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
