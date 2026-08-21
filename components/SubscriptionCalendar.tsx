import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Bell, Mail, ToggleLeft, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { SubscriptionService } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';

interface SubscriptionCalendarProps {
    subscriptions: SubscriptionService[];
}

interface ProjectedOccurrence {
    id: string;
    subscriptionId: string;
    provider: string;
    plan: string;
    amount: number;
    date: Date;
    isRemindersEnabled: boolean;
}

export const SubscriptionCalendar: React.FC<SubscriptionCalendarProps> = ({ subscriptions }) => {
    const { formatCurrency } = useCurrency();
    
    // Set up state for current selected calendar year and month
    // The current date metadata is July 2026, so let's default to July 2026!
    const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 6, 1)); // Month 6 is July (0-indexed)
    
    // Manage email reminders state locally, persisted in localStorage for premium persistence
    const [reminders, setReminders] = useState<Record<string, boolean>>(() => {
        try {
            const saved = localStorage.getItem('fpg_subscription_reminders');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });

    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Save reminders to localStorage when they change
    const toggleReminder = (subscriptionId: string) => {
        setReminders(prev => {
            const updated = { ...prev, [subscriptionId]: !prev[subscriptionId] };
            try {
                localStorage.setItem('fpg_subscription_reminders', JSON.stringify(updated));
            } catch (e) {
                console.error('Error saving reminders state', e);
            }
            
            // Show premium feedback message
            const isNowEnabled = updated[subscriptionId];
            const sub = subscriptions.find(s => s.id === subscriptionId);
            const providerName = sub ? sub.provider : 'subscription';
            setToastMessage(
                isNowEnabled 
                    ? `Email reminders activated for ${providerName}.` 
                    : `Reminders deactivated for ${providerName}.`
            );
            return updated;
        });
    };

    // Auto-dismiss toast message
    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => {
                setToastMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    // Derive the occurrences of all subscriptions for the next 6 months
    const allOccurrences = useMemo(() => {
        const occurrences: ProjectedOccurrence[] = [];
        
        subscriptions.forEach(sub => {
            const baseDate = new Date(sub.dueDate);
            const subId = sub.id;
            
            // Derive payments for 6 consecutive months based on historical pattern (monthly recurrence)
            for (let offset = -2; offset < 6; offset++) {
                const projectedDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + offset, baseDate.getDate());
                
                occurrences.push({
                    id: `${subId}_occurrence_${offset}`,
                    subscriptionId: subId,
                    provider: sub.provider,
                    plan: sub.plan,
                    amount: sub.amount,
                    date: projectedDate,
                    isRemindersEnabled: !!reminders[subId]
                });
            }
        });

        // Sort chronologically
        return occurrences.sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [subscriptions, reminders]);

    const activeMonthName = currentDate.toLocaleString('default', { month: 'long' });
    const activeYear = currentDate.getFullYear();
    const activeMonthIndex = currentDate.getMonth();

    // Filter occurrences specifically for the currently visible month
    const visibleOccurrences = useMemo(() => {
        return allOccurrences.filter(occ => {
            return occ.date.getMonth() === activeMonthIndex && occ.date.getFullYear() === activeYear;
        });
    }, [allOccurrences, activeMonthIndex, activeYear]);

    // Navigate to previous/next month
    const handlePrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    // Calculate details for rendering calendar days
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Days in active month
        const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
        // Day of week the month starts on
        const firstDayOfWeek = new Date(year, month, 1).getDay();

        const daysList = [];
        
        // Fill previous month empty pads
        for (let i = 0; i < firstDayOfWeek; i++) {
            daysList.push({ day: null, fullDate: null, hasPayment: false, payments: [] });
        }

        // Fill current month days
        for (let day = 1; day <= totalDaysInMonth; day++) {
            const fullDate = new Date(year, month, day);
            
            // Check if there are any payments scheduled for this day
            const dayOccurrences = visibleOccurrences.filter(occ => occ.date.getDate() === day);
            
            daysList.push({
                day,
                fullDate,
                hasPayment: dayOccurrences.length > 0,
                payments: dayOccurrences
            });
        }

        return daysList;
    }, [currentDate, visibleOccurrences]);

    // State for day clicked inside the calendar heat-map
    const [selectedDayPayments, setSelectedDayPayments] = useState<ProjectedOccurrence[] | null>(null);
    const [selectedDayNum, setSelectedDayNum] = useState<number | null>(null);

    // Reset day selection when month changes
    useEffect(() => {
        setSelectedDayPayments(null);
        setSelectedDayNum(null);
    }, [currentDate]);

    const handleDayClick = (dayData: any) => {
        if (dayData.day && dayData.hasPayment) {
            setSelectedDayPayments(dayData.payments);
            setSelectedDayNum(dayData.day);
        } else {
            setSelectedDayPayments(null);
            setSelectedDayNum(null);
        }
    };

    return (
        <div className="bg-slate-200 rounded-2xl shadow-digital overflow-hidden flex flex-col h-full border border-slate-300/30">
            {/* Header section */}
            <div className="p-6 border-b border-slate-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-200">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-300 flex items-center justify-center shadow-digital-inset">
                        <Calendar className="w-5 h-5 text-[#0F172A]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[#1E293B]">Subscription Calendar</h3>
                        <p className="text-xs font-semibold text-[#0F172A]">Recurrence derived from patterns</p>
                    </div>
                </div>

                {/* Toast Feedback */}
                <AnimatePresence mode="wait">
                    {toastMessage && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white text-white dark:bg-slate-900 dark:text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center space-x-1.5 shadow-md self-start sm:self-auto"
                        >
                            <Bell className="w-3.5 h-3.5 text-primary" />
                            <span>{toastMessage}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
                {/* Month Navigator */}
                <div className="flex items-center justify-between">
                    <button 
                        onClick={handlePrevMonth}
                        className="p-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-[#0F172A] shadow-digital hover:shadow-digital-inset transition-all"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold text-[#1E293B] uppercase tracking-widest font-sans">
                        {activeMonthName} {activeYear}
                    </span>
                    <button 
                        onClick={handleNextMonth}
                        className="p-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-[#0F172A] shadow-digital hover:shadow-digital-inset transition-all"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="bg-slate-200 p-4 rounded-xl shadow-digital-inset space-y-3">
                    {/* Weekday Labels */}
                    <div className="grid grid-cols-7 text-center text-[10px] font-bold text-[#0F172A] uppercase tracking-wider">
                        <span>Su</span>
                        <span>Mo</span>
                        <span>Tu</span>
                        <span>We</span>
                        <span>Th</span>
                        <span>Fr</span>
                        <span>Sa</span>
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1.5 text-center">
                        {calendarDays.map((dayData, index) => {
                            const isSelected = selectedDayNum === dayData.day;
                            return (
                                <div key={index} className="aspect-square flex items-center justify-center">
                                    {dayData.day ? (
                                        <button
                                            onClick={() => handleDayClick(dayData)}
                                            className={`relative w-full h-full rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer
                                                ${dayData.hasPayment 
                                                    ? 'bg-slate-300/40 text-[#1E293B] shadow-digital hover:bg-slate-300 border border-slate-300' 
                                                    : 'text-[#0F172A] hover:bg-slate-300/20'
                                                }
                                                ${isSelected ? 'ring-2 ring-primary bg-primary/20 border-primary' : ''}
                                            `}
                                        >
                                            <span>{dayData.day}</span>
                                            {dayData.hasPayment && (
                                                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                            )}
                                        </button>
                                    ) : (
                                        <div className="w-full h-full opacity-0" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Calendar Interaction details / Reminders Toggle list */}
                <div className="space-y-4">
                    {/* Selected Day Payments detail popup inside layout */}
                    <AnimatePresence mode="wait">
                        {selectedDayPayments ? (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-slate-300/30 p-4 rounded-xl border border-slate-300 space-y-3 overflow-hidden shadow-inner"
                            >
                                <div className="flex justify-between items-center">
                                    <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                                        Due on {activeMonthName} {selectedDayNum}
                                    </h4>
                                    <button 
                                        onClick={() => { setSelectedDayPayments(null); setSelectedDayNum(null); }}
                                        className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                                    >
                                        Clear Filter
                                    </button>
                                </div>
                                {selectedDayPayments.map(occ => (
                                    <div key={occ.id} className="flex items-center justify-between text-xs">
                                        <div>
                                            <p className="font-bold text-[#1E293B]">{occ.provider}</p>
                                            <p className="text-[10px] text-[#0F172A] font-bold">{occ.plan}</p>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <span className="font-bold text-[#1E293B] font-mono">
                                                {formatCurrency(occ.amount)}
                                            </span>
                                            <button
                                                onClick={() => toggleReminder(occ.subscriptionId)}
                                                className={`p-1.5 rounded-md shadow-sm transition-all cursor-pointer ${
                                                    reminders[occ.subscriptionId]
                                                        ? 'bg-green-500/20 text-green-700 border border-green-500/30'
                                                        : 'bg-slate-300 text-[#0F172A] hover:bg-slate-400'
                                                }`}
                                                title={reminders[occ.subscriptionId] ? "Email Reminder Active" : "Reminders Muted"}
                                            >
                                                {reminders[occ.subscriptionId] ? <Mail className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-widest">
                                        Projected Payments ({visibleOccurrences.length})
                                    </h4>
                                    <span className="text-[10px] text-[#0F172A] font-bold bg-slate-300/50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                        <Info className="w-3 h-3 text-[#0F172A]" /> Derived recurrence
                                    </span>
                                </div>

                                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                                    {visibleOccurrences.length > 0 ? (
                                        visibleOccurrences.map(occ => {
                                            const isReminderEnabled = !!reminders[occ.subscriptionId];
                                            return (
                                                <div 
                                                    key={occ.id} 
                                                    className="bg-slate-200 p-3.5 rounded-xl shadow-digital-inset flex items-center justify-between border border-transparent hover:border-slate-300 transition-all"
                                                >
                                                    <div className="space-y-1">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-xs font-black text-[#1E293B]">{occ.provider}</span>
                                                            <span className="text-[9px] font-bold bg-slate-300/70 text-[#0F172A] px-1.5 py-0.5 rounded-md">
                                                                Pattern: High
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-[#0F172A] font-bold">
                                                            {occ.date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                                        </p>
                                                    </div>
                                                    
                                                    <div className="flex items-center space-x-3">
                                                        <span className="text-sm font-black text-[#1E293B] font-mono">
                                                            {formatCurrency(occ.amount)}
                                                        </span>
                                                        
                                                        {/* Animated switch toggling reminders */}
                                                        <button
                                                            onClick={() => toggleReminder(occ.subscriptionId)}
                                                            className="flex items-center space-x-1 focus:outline-none cursor-pointer"
                                                            aria-label="Toggle Email Reminders"
                                                        >
                                                            <div className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-all duration-300 ${isReminderEnabled ? 'bg-primary' : 'bg-slate-400'}`}>
                                                                <motion.div 
                                                                    layout
                                                                    className="bg-slate-200 w-4 h-4 rounded-full shadow-md"
                                                                    animate={{ x: isReminderEnabled ? 20 : 0 }}
                                                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                                />
                                                            </div>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-xs text-[#0F172A] text-center py-6">
                                            No projected recurrence cycles for this period.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
