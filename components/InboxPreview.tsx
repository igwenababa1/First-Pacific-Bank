import React from 'react';
import { Notification, NotificationType } from '../types';
import { BellIcon, CheckCircleIcon, ShieldCheckIcon, EnvelopeIcon, ArrowRightIcon } from './Icons';
import { Link } from 'react-router-dom';
import { timeSince } from '../utils/time';

interface InboxPreviewProps {
    notifications: Notification[];
}

const getNotificationIcon = (type: NotificationType) => {
    switch(type) {
        case NotificationType.TRANSACTION:
            return <CheckCircleIcon className="w-5 h-5 text-emerald-400" />;
        case NotificationType.SECURITY:
            return <ShieldCheckIcon className="w-5 h-5 text-amber-400" />;
        default:
            return <BellIcon className="w-5 h-5 text-indigo-400" />;
    }
};

export const InboxPreview: React.FC<InboxPreviewProps> = ({ notifications }) => {
    const previewNotifs = notifications.slice(0, 3);

    return (
        <div className="bg-[#0b1122]/90  rounded-[24px] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10 flex justify-between items-center relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 blur-[80px] pointer-events-none rounded-full" />
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 dark:border-white/10 flex items-center justify-center dark:bg-slate-800">
                        <EnvelopeIcon className="w-5 h-5 text-[#0F172A]" />
                        {notifications.some(n => !n.read) && (
                            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#0b1122] animate-pulse" />
                        )}
                    </div>
                </div>
                <div className="w-full flex justify-between items-center relative z-10 pl-3">
                    <div>
                        <h2 className="text-lg font-black text-white tracking-tight">Communications Inbox</h2>
                        <p className="text-[10px] text-[#0F172A] font-bold uppercase tracking-[0.2em] mt-0.5">Secure Regulatory & Alerts Channel</p>
                    </div>
                    <Link to="/inbox" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 uppercase tracking-wider transition-colors group">
                        Open Inbox
                        <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </div>

            <div className="divide-y divide-white/5">
                {previewNotifs.length > 0 ? (
                    previewNotifs.map(notif => (
                        <Link key={notif.id} to={`/inbox`} className="flex items-start gap-4 p-5 hover:bg-white transition-colors cursor-pointer group relative dark:bg-slate-800">
                            {/* Unread dot */}
                            {!notif.read && (
                                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            )}
                            <div className="shrink-0 w-10 h-10 rounded-xl bg-[#060a14] border border-slate-200 dark:border-white/10 shadow-inner flex items-center justify-center p-0 mt-0.5 ml-2">
                                {getNotificationIcon(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center justify-between mb-1 gap-2">
                                    <h4 className={`font-bold text-sm truncate ${!notif.read ? 'text-white' : 'text-[#0F172A]'}`}>
                                        {notif.title}
                                    </h4>
                                    <span className="text-[10px] font-mono text-[#0F172A] shrink-0">
                                        {timeSince(notif.timestamp)}
                                    </span>
                                </div>
                                <p className="text-[13px] text-[#0F172A] line-clamp-2 leading-relaxed">
                                    {notif.message}
                                </p>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="p-10 text-center flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 dark:bg-slate-800">
                            <BellIcon className="w-8 h-8 text-[#0F172A]" />
                        </div>
                        <p className="text-sm font-bold text-[#0F172A]">No recent communications</p>
                        <p className="text-xs text-[#0F172A] mt-1">Your inbox is clear of alerts.</p>
                    </div>
                )}
            </div>
            
            {notifications.length > 3 && (
                <Link to="/inbox" className="block w-full text-center py-4 text-[10px] uppercase font-bold tracking-widest text-[#0F172A] hover:text-white hover:bg-white transition-colors border-t border-slate-200 dark:border-white/10 dark:bg-slate-800">
                    View All {notifications.length} Messages
                </Link>
            )}
        </div>
    );
};
