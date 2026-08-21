
import React from 'react';
import { CheckCircleIcon } from './Icons';

export interface Step {
    label: string;
    icon?: React.ReactNode;
}

interface StepperProps {
    steps: Step[];
    currentStep: number;
    className?: string;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep, className = '' }) => {
    return (
        <div className={`w-full px-4 ${className}`}>
            <div className="flex items-center justify-between relative">
                {/* Background Line */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-0.5 bg-slate-300 dark:bg-slate-700 -z-10 rounded"></div>
                
                {/* Active Progress Line (calculated based on steps) */}
                <div 
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 h-0.5 bg-primary -z-10 rounded transition-all duration-500 ease-in-out"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                ></div>

                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;
                    const isPending = index > currentStep;

                    return (
                        <div key={index} className="flex flex-col items-center group">
                            <div 
                                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 
                                ${isCompleted 
                                    ? 'bg-primary border-primary text-[#0F172A] dark:text-white scale-100' 
                                    : isCurrent 
                                        ? 'bg-slate-50 dark:bg-slate-900 dark:bg-slate-200 border-primary text-primary shadow-[0_0_10px_rgba(14,165,233,0.5)] scale-110' 
                                        : 'bg-slate-200 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-[#0F172A] dark:text-white scale-100'
                                }`}
                            >
                                {isCompleted ? (
                                    <CheckCircleIcon className="w-5 h-5 md:w-6 md:h-6" />
                                ) : step.icon ? (
                                    <span className={`${isCurrent ? 'text-primary dark:text-white' : ''}`}>{step.icon}</span>
                                ) : (
                                    <span className={`text-xs md:text-sm font-bold ${isCurrent ? 'text-[#0F172A] dark:text-white dark:text-white' : ''}`}>{index + 1}</span>
                                )}
                            </div>
                            
                            <div className={`absolute mt-10 md:mt-12 text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
                                isCurrent 
                                    ? 'text-primary' 
                                    : isCompleted 
                                        ? 'text-[#0F172A] dark:text-white' 
                                        : 'text-[#0F172A] dark:text-white dark:text-white'
                            }`}>
                                {step.label}
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Spacer to prevent text from overlapping content below */}
            <div className="h-8 md:h-10"></div> 
        </div>
    );
};
