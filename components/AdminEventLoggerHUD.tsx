import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  AdminLogEvent,
  AdminEventCategory,
  subscribeToAdminEvents,
  getAdminEventsHistory,
  clearAdminEventsHistory,
  exportAdminEventsAsJson,
  exportAdminEventsAsCsv,
  logAdminEvent,
} from '../services/adminEventLogger';
import {
  ActivityIcon,
  XIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Trash2Icon,
  DownloadIcon,
  PlayIcon,
  PauseIcon,
  ShieldAlertIcon,
  DatabaseIcon,
  RefreshCwIcon,
  SlidersIcon,
  LayersIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  SearchIcon,
  CopyIcon,
  CheckIcon,
  SparklesIcon,
  Maximize2Icon,
  Minimize2Icon,
} from 'lucide-react';

interface AdminEventLoggerHUDProps {
  currentAdminEmail?: string;
  className?: string;
}

export const AdminEventLoggerHUD: React.FC<AdminEventLoggerHUDProps> = ({
  currentAdminEmail = 'admin@sovereign-core.internal',
  className = '',
}) => {
  const [events, setEvents] = useState<AdminLogEvent[]>(() => getAdminEventsHistory());
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AdminEventCategory | 'ALL'>('ALL');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastEventFlash, setLastEventFlash] = useState<boolean>(false);
  const [eventsPerSec, setEventsPerSec] = useState<number>(0);

  const eventCountWindowRef = useRef<number[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  // Rate calculation (events / sec over rolling 5s window)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      eventCountWindowRef.current = eventCountWindowRef.current.filter((t) => now - t <= 5000);
      setEventsPerSec(Math.round((eventCountWindowRef.current.length / 5) * 10) / 10);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to live events
  useEffect(() => {
    const unsubscribe = subscribeToAdminEvents((newEvent, allEvents) => {
      eventCountWindowRef.current.push(Date.now());
      if (!isPausedRef.current) {
        setEvents(allEvents);
        setLastEventFlash(true);
        setTimeout(() => setLastEventFlash(false), 800);
      }
    });
    return () => unsubscribe();
  }, []);

  const latestEvent = events[0] || null;

  // Filtered event list
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (selectedCategory !== 'ALL' && e.category !== selectedCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        e.action.toLowerCase().includes(q) ||
        e.details.toLowerCase().includes(q) ||
        (e.target && e.target.toLowerCase().includes(q)) ||
        e.actor.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.checksum.toLowerCase().includes(q)
      );
    });
  }, [events, selectedCategory, searchQuery]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSimulateUIAction = () => {
    const actions = [
      {
        category: 'UI_INTERACTION' as const,
        action: 'SEARCH_QUERY_EXECUTED',
        details: 'Admin filtered transactions by risk score threshold > 80',
        target: 'transactions:view',
        payload: { query: 'riskScore > 80', resultsCount: 4 },
      },
      {
        category: 'DATA_OVERRIDE' as const,
        action: 'HOT_BALANCE_ADJUSTMENT',
        details: 'Simulated admin balance test override +$5,000.00 USD',
        target: 'account:ACC-CHASE-019',
        payload: { previousBalance: 45000, newBalance: 50000, delta: 5000 },
      },
      {
        category: 'AUTH_SECURITY' as const,
        action: 'MFA_BYPASS_VERIFIED',
        details: 'Biometric authorization validated for administrative elevation',
        target: `user:${currentAdminEmail}`,
        payload: { method: 'FIDO2_WEBAUTHN', level: 'HIGH' },
      },
      {
        category: 'RECONCILIATION' as const,
        action: 'LEDGER_INTEGRITY_CHECK',
        details: 'Automated Firestore vs Transaction ledger audit completed without drift',
        target: 'firestore:all_collections',
        payload: { accountsAudited: 12, driftDetected: false },
      },
    ];

    const chosen = actions[Math.floor(Math.random() * actions.length)];
    logAdminEvent({
      ...chosen,
      actor: currentAdminEmail,
      status: 'SUCCESS',
      sourceComponent: 'AdminEventLoggerHUD',
    });
  };

  const getCategoryBadgeClass = (category: AdminEventCategory) => {
    switch (category) {
      case 'DATA_OVERRIDE':
        return 'bg-amber-500 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'AUTH_SECURITY':
        return 'bg-rose-500 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'RECONCILIATION':
        return 'bg-purple-500 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'UI_INTERACTION':
        return 'bg-sky-500 text-sky-600 dark:text-sky-400 border-sky-500/30';
      case 'NAVIGATION':
        return 'bg-teal-500 text-teal-600 dark:text-teal-400 border-teal-500/30';
      case 'EXPORT':
        return 'bg-emerald-500 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-500 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-emerald-500 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'OVERRIDE':
        return 'bg-amber-500 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'WARNING':
        return 'bg-yellow-500 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
      case 'ERROR':
        return 'bg-rose-500 text-rose-600 dark:text-rose-400 border-rose-500/30';
      default:
        return 'bg-sky-500 text-sky-600 dark:text-sky-400 border-sky-500/30';
    }
  };

  return (
    <>
      {/* 1. Floating Collapsed HUD Pill */}
      {!isOpen && (
        <div
          id="admin-event-logger-floating-pill"
          className={`fixed bottom-5 right-5 z-40 flex items-center gap-2 p-1.5 pl-3 pr-2 bg-[#0d1527]/95 text-white  border border-slate-700/60 shadow-2xl rounded-full transition-all duration-200 hover:scale-[1.02] hover:border-sky-500/50 cursor-pointer ${
            lastEventFlash ? 'ring-2 ring-sky-400/80 shadow-sky-500/20' : ''
          } ${className}`}
          onClick={() => setIsOpen(true)}
          role="button"
          aria-label="Open Real-time Admin Event Logger"
          title="Open Real-time Admin Event Logger HUD"
        >
          {/* Live Pulsing Dot */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
            </span>
            <span className="text-[11px] font-black tracking-wider uppercase text-slate-200">Event Stream</span>
          </div>

          {/* Rate & Count Badge */}
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700/50 rounded-full px-2.5 py-0.5 text-[10px] font-mono text-sky-400 font-bold">
            <span>{events.length} evts</span>
            <span className="text-slate-500">|</span>
            <span>{eventsPerSec} e/s</span>
          </div>

          {/* Latest Event Teaser */}
          {latestEvent && (
            <div className="hidden md:flex items-center max-w-[220px] truncate text-[10px] text-slate-400 font-mono px-1">
              <span className="text-slate-300 font-semibold truncate">{latestEvent.action}</span>
            </div>
          )}

          <button
            type="button"
            className="w-6 h-6 rounded-full bg-sky-500 hover:bg-sky-500 text-sky-400 flex items-center justify-center transition-colors"
            title="Expand Event Logger"
          >
            <ActivityIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Expanded Interactive Real-Time Event Console Drawer */}
      {isOpen && (
        <div
          id="admin-event-logger-drawer"
          className={`fixed z-50 transition-all duration-300 ${
            isExpanded
              ? 'inset-4 md:inset-8 bg-[#090e1a]/98 rounded-3xl border border-slate-700 shadow-2xl  flex flex-col overflow-hidden'
              : 'bottom-4 right-4 w-[95vw] sm:w-[580px] h-[640px] max-h-[90vh] bg-[#090e1a]/98 rounded-2xl border border-slate-700 shadow-2xl  flex flex-col overflow-hidden'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-[#0f172a]/90 border-b border-slate-800 text-white select-none">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white">Admin Event Stream</h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-sky-500 text-sky-400 border border-sky-500/30">
                    REAL-TIME
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  {events.length} captured • {eventsPerSec} evt/s • Checksum verified
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Simulate UI action */}
              <button
                type="button"
                onClick={handleSimulateUIAction}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg bg-sky-500 hover:bg-sky-500 text-sky-300 border border-sky-500/30 transition-all active:scale-95 cursor-pointer"
                title="Trigger simulated UI administrative interaction"
              >
                <SparklesIcon className="w-3 h-3" />
                <span className="hidden sm:inline">Simulate Action</span>
              </button>

              {/* Pause/Resume Stream */}
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className={`p-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                  isPaused
                    ? 'bg-amber-500 text-amber-300 border-amber-500/30 hover:bg-amber-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title={isPaused ? 'Resume stream' : 'Pause stream'}
              >
                {isPaused ? <PlayIcon className="w-3.5 h-3.5" /> : <PauseIcon className="w-3.5 h-3.5" />}
              </button>

              {/* Expand / Minimize */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer hidden sm:flex"
                title={isExpanded ? 'Minimize' : 'Expand full screen'}
              >
                {isExpanded ? <Minimize2Icon className="w-3.5 h-3.5" /> : <Maximize2Icon className="w-3.5 h-3.5" />}
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500 hover:text-rose-400 text-slate-400 border border-slate-700 transition-colors cursor-pointer"
                title="Close logger HUD"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-bar: Search, Filters & Export Tools */}
          <div className="px-4 py-2.5 bg-[#0b1120] border-b border-slate-800 flex flex-col gap-2">
            {/* Search + Action Buttons */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <SearchIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter events by action, target, actor, or checksum..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#11192e] border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500/60 font-mono"
                />
              </div>

              <button
                type="button"
                onClick={exportAdminEventsAsJson}
                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                title="Export as JSON"
              >
                <DownloadIcon className="w-3 h-3" />
                <span>JSON</span>
              </button>

              <button
                type="button"
                onClick={exportAdminEventsAsCsv}
                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                title="Export as CSV"
              >
                <DownloadIcon className="w-3 h-3" />
                <span>CSV</span>
              </button>

              <button
                type="button"
                onClick={clearAdminEventsHistory}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500 hover:text-rose-400 text-slate-400 border border-slate-700 transition-colors cursor-pointer"
                title="Clear event history"
              >
                <Trash2Icon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-[10px] font-bold">
              {(
                [
                  'ALL',
                  'UI_INTERACTION',
                  'DATA_OVERRIDE',
                  'AUTH_SECURITY',
                  'RECONCILIATION',
                  'NAVIGATION',
                  'SYSTEM',
                  'EXPORT',
                ] as const
              ).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded-md border whitespace-nowrap uppercase tracking-wider transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-sky-500 text-slate-950 border-sky-400 font-black shadow-sm'
                      : 'bg-slate-800 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Live Event Stream List */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-[#070b14]"
          >
            {filteredEvents.length === 0 ? (
              <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-slate-500 text-center p-6">
                <LayersIcon className="w-8 h-8 mb-2 opacity-40 text-sky-400" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No Events Found</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  Interact with the Admin Dashboard (change tabs, edit users, adjust balances, run reconciliations) to stream live events.
                </p>
                <button
                  type="button"
                  onClick={handleSimulateUIAction}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-sky-500 text-sky-400 border border-sky-500/30 text-xs font-bold uppercase hover:bg-sky-500 transition-all cursor-pointer"
                >
                  Simulate Interaction Now
                </button>
              </div>
            ) : (
              filteredEvents.map((evt) => {
                const isSelected = selectedEventId === evt.id;
                const timeString = new Date(evt.timestampMs).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
                const msString = String(evt.timestampMs % 1000).padStart(3, '0');

                return (
                  <div
                    key={evt.id}
                    className={`rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-[#11192e] border-sky-500/60 shadow-lg'
                        : 'bg-[#0d1425] border-slate-800/80 hover:border-slate-700 hover:bg-[#0f172a]'
                    }`}
                  >
                    {/* Main Row */}
                    <div
                      className="p-3 flex items-start justify-between gap-2 cursor-pointer select-none"
                      onClick={() => setSelectedEventId(isSelected ? null : evt.id)}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        {/* Top Metadata Line */}
                        <div className="flex items-center gap-2 flex-wrap text-[10px]">
                          {/* Time */}
                          <span className="font-mono text-slate-400 font-bold">
                            {timeString}.{msString}
                          </span>

                          {/* Category Badge */}
                          <span
                            className={`px-1.5 py-0.5 rounded border text-[9px] font-mono font-black uppercase tracking-wider ${getCategoryBadgeClass(
                              evt.category
                            )}`}
                          >
                            {evt.category.replace('_', ' ')}
                          </span>

                          {/* Status Badge */}
                          <span
                            className={`px-1.5 py-0.5 rounded border text-[9px] font-mono font-black uppercase ${getStatusBadgeClass(
                              evt.status
                            )}`}
                          >
                            {evt.status}
                          </span>

                          {/* Target Entity */}
                          {evt.target && (
                            <span className="font-mono text-slate-400 truncate max-w-[180px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/50">
                              {evt.target}
                            </span>
                          )}
                        </div>

                        {/* Action & Details */}
                        <div className="flex items-baseline gap-2">
                          <h4 className="text-xs font-bold text-slate-100 font-mono tracking-tight">
                            {evt.action}
                          </h4>
                          <span className="text-[11px] text-slate-400 truncate flex-1">
                            {evt.details}
                          </span>
                        </div>
                      </div>

                      {/* Expand / Checksum Pill */}
                      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                        <span className="text-[9px] font-mono text-emerald-400/80 bg-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20 hidden sm:inline">
                          {evt.checksum.slice(0, 14)}
                        </span>
                        {isSelected ? (
                          <ChevronUpIcon className="w-4 h-4 text-sky-400" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </div>

                    {/* Expandable JSON Payload & Full Forensics View */}
                    {isSelected && (
                      <div className="border-t border-slate-800/80 p-3 bg-[#080d17] rounded-b-xl space-y-2.5 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                          <div>
                            <span className="text-slate-500 uppercase text-[9px] block">Actor Session:</span>
                            <span className="text-slate-200 font-semibold">{evt.actor}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 uppercase text-[9px] block">Event ID:</span>
                            <span className="text-sky-400 font-semibold">{evt.id}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 uppercase text-[9px] block">Component Source:</span>
                            <span className="text-slate-300">{evt.sourceComponent || 'AdminDashboard'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 uppercase text-[9px] block">Verification Checksum:</span>
                            <span className="text-emerald-400 font-semibold">{evt.checksum}</span>
                          </div>
                        </div>

                        {/* Details Paragraph */}
                        <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300 text-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Action Description
                          </span>
                          {evt.details}
                        </div>

                        {/* Raw JSON Payload */}
                        {evt.payload && Object.keys(evt.payload).length > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                                Data Payload / State Mutation Diffs
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(JSON.stringify(evt.payload, null, 2), `payload_${evt.id}`)}
                                className="flex items-center gap-1 text-[10px] font-mono text-sky-400 hover:text-sky-300 cursor-pointer"
                              >
                                {copiedId === `payload_${evt.id}` ? (
                                  <>
                                    <CheckIcon className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <CopyIcon className="w-3 h-3" />
                                    <span>Copy JSON</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="p-2.5 rounded-lg bg-black border border-slate-800/80 font-mono text-[11px] text-amber-300/90 overflow-x-auto max-h-48 custom-scrollbar">
                              {JSON.stringify(evt.payload, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-4 py-2 bg-[#0b1120] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Audit Logging: Active (Console + Broadcast)</span>
            </div>
            <span>Showing {filteredEvents.length} of {events.length}</span>
          </div>
        </div>
      )}
    </>
  );
};
export default AdminEventLoggerHUD;
