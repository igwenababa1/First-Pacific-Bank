import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Notification, NotificationType, View } from '../types';
import { 
  BellIcon, 
  CheckCircleIcon, 
  CreditCardIcon, 
  ShieldCheckIcon, 
  LifebuoyIcon, 
  CashIcon 
} from './Icons';
import { timeSince } from '../utils/time';
import { 
  Play, 
  Pause, 
  X, 
  CheckCheck, 
  Timer, 
  RotateCcw, 
  BellOff, 
  Sparkles,
  Info
} from 'lucide-react';

interface NotificationsPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkNotificationsAsRead?: () => void;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.TRANSACTION:
      return <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0" />;
    case NotificationType.CARD:
      return <CreditCardIcon className="w-5 h-5 text-sky-400 shrink-0" />;
    case NotificationType.SECURITY:
      return <ShieldCheckIcon className="w-5 h-5 text-amber-400 shrink-0" />;
    case NotificationType.INSURANCE:
      return <LifebuoyIcon className="w-5 h-5 text-indigo-400 shrink-0" />;
    case NotificationType.LOAN:
      return <CashIcon className="w-5 h-5 text-teal-400 shrink-0" />;
    default:
      return <BellIcon className="w-5 h-5 text-[#0F172A] shrink-0" />;
  }
};

const getProgressBarColor = (type: NotificationType) => {
  switch (type) {
    case NotificationType.TRANSACTION:
      return 'from-emerald-500 via-teal-400 to-emerald-400';
    case NotificationType.SECURITY:
      return 'from-amber-500 via-yellow-400 to-amber-400';
    case NotificationType.CARD:
      return 'from-sky-500 via-blue-400 to-cyan-400';
    case NotificationType.INSURANCE:
      return 'from-indigo-500 via-purple-400 to-indigo-400';
    case NotificationType.LOAN:
      return 'from-teal-500 via-emerald-400 to-teal-400';
    default:
      return 'from-slate-400 to-slate-500';
  }
};

interface NotificationItemProps {
  notification: Notification;
  durationMs: number;
  isAutoDismissEnabled: boolean;
  onAutoDismiss: (id: string) => void;
  onClosePanel: () => void;
}

const NotificationItemWithProgress: React.FC<NotificationItemProps> = ({
  notification,
  durationMs,
  isAutoDismissEnabled,
  onAutoDismiss,
  onClosePanel,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(durationMs);
  const [isHovered, setIsHovered] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  // If notification is already read, progress timer is inactive
  const isTimerActive = isAutoDismissEnabled && !notification.read && !isDismissing;

  useEffect(() => {
    if (!isTimerActive) {
      return;
    }

    lastTickRef.current = performance.now();

    const updateTimer = (now: number) => {
      if (lastTickRef.current !== null && !isHovered) {
        const delta = now - lastTickRef.current;
        setTimeLeft((prev) => {
          const nextTime = prev - delta;
          if (nextTime <= 0) {
            setIsDismissing(true);
            setTimeout(() => {
              onAutoDismiss(notification.id);
            }, 300);
            return 0;
          }
          return nextTime;
        });
      }
      lastTickRef.current = now;

      if (timeLeft > 0 && !isHovered) {
        animFrameRef.current = requestAnimationFrame(updateTimer);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateTimer);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isTimerActive, isHovered, timeLeft, durationMs, notification.id, onAutoDismiss]);

  const progressPercent = Math.max(0, Math.min(100, (timeLeft / durationMs) * 100));

  const content = (
    <div className="flex items-start space-x-3 p-3.5 relative overflow-hidden">
      <div className="flex-shrink-0 mt-0.5 p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold text-xs text-[#0F172A] dark:text-white truncate">
            {notification.title}
          </p>
          <span className="text-[10px] font-bold text-[#0F172A] dark:text-white whitespace-nowrap">
            {timeSince(notification.timestamp)}
          </span>
        </div>
        <p className="text-xs text-[#0F172A] dark:text-white mt-1 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>

        {!notification.read && (
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              New
            </span>
            {isTimerActive && (
              <span className={`inline-flex items-center gap-1 text-[9px] font-mono ${
                isHovered ? 'text-amber-500 font-bold' : 'text-[#0F172A]'
              }`}>
                {isHovered ? (
                  <>
                    <Pause className="w-2.5 h-2.5 animate-pulse text-amber-500" />
                    <span>PAUSED</span>
                  </>
                ) : (
                  <>
                    <Timer className="w-2.5 h-2.5" />
                    <span>{Math.ceil(timeLeft / 1000)}s</span>
                  </>
                )}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Manual Dismiss Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDismissing(true);
          setTimeout(() => onAutoDismiss(notification.id), 250);
        }}
        className="absolute top-2.5 right-2.5 p-1 rounded-lg text-[#0F172A] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white transition-colors dark:bg-slate-800"
        title="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Auto-Dismiss Timer Progress Bar */}
      {isTimerActive && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getProgressBarColor(notification.type)} transition-all duration-75 ${
              isHovered ? 'opacity-100 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'opacity-80'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );

  const wrapperClass = `group relative block rounded-xl border transition-all duration-300 ${
    isDismissing ? 'opacity-0 scale-95 -translate-x-4 max-h-0 py-0 overflow-hidden my-0 border-0' : 'opacity-100'
  } ${
    notification.read
      ? 'bg-slate-50 dark:bg-slate-900 border-slate-200/60 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white'
      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 shadow-sm hover:border-emerald-500/40'
  }`;

  if (notification.linkTo) {
    return (
      <Link
        to={`/${notification.linkTo}`}
        onClick={onClosePanel}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={wrapperClass}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={wrapperClass}
    >
      {content}
    </div>
  );
};

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications,
  onClose,
  onMarkNotificationsAsRead,
}) => {
  const [autoDismissEnabled, setAutoDismissEnabled] = useState<boolean>(true);
  const [timerSeconds, setTimerSeconds] = useState<number>(8); // 8 seconds per notification
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const handleAutoDismiss = (id: string) => {
    setDismissedIds((prev) => [...prev, id]);
  };

  const handleResetDismissed = () => {
    setDismissedIds([]);
  };

  // Filter out locally dismissed notifications
  const activeNotifications = notifications.filter((n) => !dismissedIds.includes(n.id));
  const displayedNotifications = activeNotifications.filter((n) =>
    activeTab === 'unread' ? !n.read : true
  );

  const unreadCount = activeNotifications.filter((n) => !n.read).length;

  return (
    <div className="absolute top-full right-0 mt-2.5 w-80 sm:w-[420px] bg-white dark:bg-[#0e1626]/95  rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 z-50 animate-slide-in-panel overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900[0.02]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500 text-emerald-500 border border-emerald-500/20">
              <BellIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0F172A] dark:text-white flex items-center gap-1.5">
                Notifications
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px]">
                    {unreadCount}
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-[#0F172A] dark:text-white">
                Live alerts & security updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Auto-Dismiss Timer Toggle */}
            <button
              onClick={() => setAutoDismissEnabled(!autoDismissEnabled)}
              className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all ${
                autoDismissEnabled
                  ? 'bg-emerald-500 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-900 text-[#0F172A] border-slate-200 dark:border-white/10'
              }`}
              title={autoDismissEnabled ? 'Pause Auto-Dismiss Timers' : 'Enable Auto-Dismiss Timers'}
            >
              <Timer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {autoDismissEnabled ? `${timerSeconds}s Auto` : 'Off'}
              </span>
            </button>

            {/* Mark All Read */}
            {onMarkNotificationsAsRead && unreadCount > 0 && (
              <button
                onClick={onMarkNotificationsAsRead}
                className="p-1.5 rounded-lg text-[#0F172A] hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-white transition-colors dark:bg-slate-800"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#0F172A] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white transition-colors dark:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs & Controls */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/60 dark:border-white/10 text-[11px]">
          <div className="flex items-center gap-1 p-0.5 bg-slate-200 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white shadow-sm'
                  : 'text-[#0F172A] hover:text-[#1E293B] dark:hover:text-[#1E293B]'
              }`}
            >
              All ({activeNotifications.length})
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                activeTab === 'unread'
                  ? 'bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white shadow-sm'
                  : 'text-[#0F172A] hover:text-[#1E293B] dark:hover:text-[#1E293B]'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Dismiss Speed Selector */}
          {autoDismissEnabled && (
            <div className="flex items-center gap-1 text-[10px] text-[#0F172A] font-mono">
              <span>Timer:</span>
              {[5, 8, 12].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setTimerSeconds(sec)}
                  className={`px-1.5 py-0.5 rounded font-bold ${
                    timerSeconds === sec
                      ? 'bg-emerald-500 text-slate-950'
                      : 'hover:bg-slate-200 dark:hover:bg-white text-[#0F172A]'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notifications List Body */}
      <div className="max-h-96 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {displayedNotifications.length === 0 ? (
          <div className="text-center py-10 px-4 text-[#0F172A] dark:text-white">
            <BellOff className="w-10 h-10 mx-auto text-[#0F172A] dark:text-white mb-2.5 animate-pulse" />
            <p className="text-xs font-bold text-[#0F172A] dark:text-white">
              No notifications to show
            </p>
            <p className="text-[11px] mt-1 text-[#0F172A]">
              {dismissedIds.length > 0
                ? `${dismissedIds.length} notifications auto-dismissed`
                : 'You are all caught up!'}
            </p>
            {dismissedIds.length > 0 && (
              <button
                onClick={handleResetDismissed}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-emerald-500 hover:text-emerald-400 bg-emerald-500 rounded-lg transition-colors border border-emerald-500/20"
              >
                <RotateCcw className="w-3 h-3" />
                Restore Dismissed ({dismissedIds.length})
              </button>
            )}
          </div>
        ) : (
          displayedNotifications.map((notification) => (
            <NotificationItemWithProgress
              key={notification.id}
              notification={notification}
              durationMs={timerSeconds * 1000}
              isAutoDismissEnabled={autoDismissEnabled}
              onAutoDismiss={handleAutoDismiss}
              onClosePanel={onClose}
            />
          ))
        )}
      </div>

      {/* Panel Footer */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] text-[#0F172A] dark:text-white">
          <Info className="w-3 h-3 text-emerald-500 shrink-0" />
          <span>Hover notification to pause timer</span>
        </div>
        <Link
          to="/inbox"
          onClick={onClose}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-lg transition-all shadow-md cursor-pointer shrink-0"
        >
          <BellIcon className="w-3 h-3" />
          Inbox Dashboard
        </Link>
      </div>

      {/* Slide-In Keyframe Styling */}
      <style>{`
        @keyframes slideInPanel {
          0% {
            opacity: 0;
            transform: translateY(-16px) translateX(12px) scale(0.95);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) translateX(0) scale(1);
            filter: blur(0);
          }
        }
        .animate-slide-in-panel {
          animation: slideInPanel 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};
