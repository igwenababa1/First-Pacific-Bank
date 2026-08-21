/**
 * Bank-Grade Real-Time Administrative Event Logging System
 * Captures, verifies, broadcasts, and visualizes all Admin UI interactions and Firestore mutations.
 */

export type AdminEventCategory =
  | 'UI_INTERACTION'
  | 'DATA_OVERRIDE'
  | 'AUTH_SECURITY'
  | 'RECONCILIATION'
  | 'SYSTEM'
  | 'NAVIGATION'
  | 'EXPORT';

export type AdminEventStatus = 'SUCCESS' | 'PENDING' | 'OVERRIDE' | 'WARNING' | 'ERROR';

export interface AdminLogEvent {
  id: string;
  timestamp: string; // ISO 8601 string
  timestampMs: number;
  category: AdminEventCategory;
  action: string;
  actor: string;
  target?: string;
  status: AdminEventStatus;
  details: string;
  payload?: Record<string, any>;
  durationMs?: number;
  checksum: string;
  sourceComponent?: string;
}

const MAX_STORED_EVENTS = 300;
const STORAGE_KEY = 'sovereign_admin_event_stream_v1';

// In-memory reactive event ring buffer
let eventHistory: AdminLogEvent[] = [];
const subscribers = new Set<(event: AdminLogEvent, history: AdminLogEvent[]) => void>();

// Generate simple deterministic verification checksum
function generateChecksum(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `SEC-VERIFY-${hex}`;
}

// Load initial history from localStorage if present
try {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      eventHistory = JSON.parse(cached).slice(0, MAX_STORED_EVENTS);
    }
  }
} catch {
  eventHistory = [];
}

/**
 * Log an administrative event with real-time UI broadcast, console verification, and persistence.
 */
export function logAdminEvent(params: {
  category: AdminEventCategory;
  action: string;
  actor?: string;
  target?: string;
  status?: AdminEventStatus;
  details: string;
  payload?: Record<string, any>;
  durationMs?: number;
  sourceComponent?: string;
}): AdminLogEvent {
  const now = new Date();
  const timestamp = now.toISOString();
  const timestampMs = now.getTime();
  const id = `evt_${timestampMs}_${Math.random().toString(36).substring(2, 7)}`;
  const actor = params.actor || 'admin@sovereign-core.internal';
  const status = params.status || 'SUCCESS';

  const rawForChecksum = `${id}:${timestamp}:${params.category}:${params.action}:${actor}:${params.target || ''}`;
  const checksum = generateChecksum(rawForChecksum);

  const event: AdminLogEvent = {
    id,
    timestamp,
    timestampMs,
    category: params.category,
    action: params.action,
    actor,
    target: params.target,
    status,
    details: params.details,
    payload: params.payload,
    durationMs: params.durationMs,
    checksum,
    sourceComponent: params.sourceComponent || 'AdminDashboard',
  };

  // 1. Update in-memory buffer
  eventHistory = [event, ...eventHistory].slice(0, MAX_STORED_EVENTS);

  // 2. Persist to storage safely
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(eventHistory));
    }
  } catch {
    // Ignore storage quota limits
  }

  // 3. Output Bank-Grade Console Verification Log
  emitConsoleVerification(event);

  // 4. Dispatch DOM custom event for real-time reactivity across components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('admin_ui_event', {
        detail: event,
      })
    );
  }

  // 5. Notify all active React hook subscribers
  subscribers.forEach((callback) => {
    try {
      callback(event, eventHistory);
    } catch (err) {
      console.warn('[AdminEventLogger] Subscriber error:', err);
    }
  });

  return event;
}

/**
 * Formatted console output with bank-grade CSS badges for browser DevTools verification.
 */
function emitConsoleVerification(evt: AdminLogEvent) {
  if (typeof window === 'undefined' || !console || !console.groupCollapsed) return;

  const categoryColors: Record<AdminEventCategory, { bg: string; text: string; border: string }> = {
    DATA_OVERRIDE: { bg: '#b45309', text: '#fef3c7', border: '#f59e0b' },
    AUTH_SECURITY: { bg: '#991b1b', text: '#fee2e2', border: '#ef4444' },
    RECONCILIATION: { bg: '#581c87', text: '#f3e8ff', border: '#a855f7' },
    UI_INTERACTION: { bg: '#0369a1', text: '#e0f2fe', border: '#38bdf8' },
    SYSTEM: { bg: '#334155', text: '#f8fafc', border: '#94a3b8' },
    NAVIGATION: { bg: '#0f766e', text: '#ccfbf1', border: '#14b8a6' },
    EXPORT: { bg: '#15803d', text: '#dcfce7', border: '#22c55e' },
  };

  const statusColors: Record<AdminEventStatus, string> = {
    SUCCESS: '#22c55e',
    OVERRIDE: '#f59e0b',
    WARNING: '#fbbf24',
    ERROR: '#ef4444',
    PENDING: '#38bdf8',
  };

  const catStyle = categoryColors[evt.category] || categoryColors.SYSTEM;
  const statusColor = statusColors[evt.status] || '#94a3b8';

  const badgeA = 'background: #0f172a; color: #38bdf8; font-weight: bold; padding: 2px 6px; border-radius: 4px 0 0 4px; font-size: 10px; border: 1px solid #1e293b;';
  const badgeB = `background: ${catStyle.bg}; color: ${catStyle.text}; font-weight: bold; padding: 2px 6px; font-size: 10px; border-top: 1px solid ${catStyle.border}; border-bottom: 1px solid ${catStyle.border};`;
  const badgeC = `background: #1e293b; color: ${statusColor}; font-weight: bold; padding: 2px 6px; border-radius: 0 4px 4px 0; font-size: 10px; border: 1px solid #334155;`;
  const titleStyle = 'color: #f8fafc; font-weight: bold; font-size: 11px; margin-left: 6px;';

  console.groupCollapsed(
    `%cADMIN AUDIT%c${evt.category}%c${evt.status}%c ${evt.action} ➔ ${evt.target || 'GLOBAL'}`,
    badgeA,
    badgeB,
    badgeC,
    titleStyle
  );

  console.info(
    `%c[Timestamp]%c ${evt.timestamp} (%c${evt.id}%c)`,
    'color: #94a3b8; font-weight: bold;',
    'color: #38bdf8;',
    'color: #a855f7; font-family: monospace;',
    'color: #94a3b8;'
  );
  console.info(
    `%c[Actor]%c ${evt.actor}  |  %c[Checksum]%c ${evt.checksum}`,
    'color: #94a3b8; font-weight: bold;',
    'color: #f8fafc; font-weight: bold;',
    'color: #94a3b8; font-weight: bold;',
    'color: #22c55e; font-family: monospace;'
  );
  console.info(`%c[Details]%c ${evt.details}`, 'color: #94a3b8; font-weight: bold;', 'color: #e2e8f0;');

  if (evt.payload) {
    console.info('%c[Payload Data / Mutation Diffs]', 'color: #f59e0b; font-weight: bold;', evt.payload);
  }

  console.groupEnd();
}

/**
 * Subscribe to the live administrative event stream.
 */
export function subscribeToAdminEvents(
  callback: (event: AdminLogEvent, history: AdminLogEvent[]) => void
): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Get current snapshot of recent administrative events.
 */
export function getAdminEventsHistory(): AdminLogEvent[] {
  return [...eventHistory];
}

/**
 * Clear the local administrative events history buffer.
 */
export function clearAdminEventsHistory(): void {
  eventHistory = [];
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore
  }
  subscribers.forEach((cb) => cb({} as any, []));
}

/**
 * Export all recorded administrative events as JSON.
 */
export function exportAdminEventsAsJson(): void {
  if (typeof window === 'undefined') return;
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(eventHistory, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `admin_audit_event_log_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Export all recorded administrative events as CSV.
 */
export function exportAdminEventsAsCsv(): void {
  if (typeof window === 'undefined' || eventHistory.length === 0) return;

  const headers = ['Event ID', 'Timestamp', 'Category', 'Action', 'Actor', 'Target Entity', 'Status', 'Details', 'Checksum'];
  const rows = eventHistory.map((e) => [
    `"${e.id}"`,
    `"${e.timestamp}"`,
    `"${e.category}"`,
    `"${e.action.replace(/"/g, '""')}"`,
    `"${e.actor.replace(/"/g, '""')}"`,
    `"${(e.target || 'N/A').replace(/"/g, '""')}"`,
    `"${e.status}"`,
    `"${e.details.replace(/"/g, '""')}"`,
    `"${e.checksum}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `admin_audit_event_log_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
