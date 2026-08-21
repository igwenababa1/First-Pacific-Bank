import React, { useState, useEffect } from "react";
import {
  EnvelopeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
} from "./Icons";

interface LogEntry {
  id: string;
  timestamp: string;
  type: string;
  target: string;
  subject: string;
  provider: string;
  status: string;
  statusCode: number | null;
  latency?: number;
  responsePayload?: any;
}

const LogEntryRow: React.FC<{
  log: LogEntry;
  isFailed: boolean;
  isPending: boolean;
  isSent: boolean;
  bgColor: string;
  statusColor: string;
  statusText: string;
  StatusIcon: any;
}> = ({
  log,
  isFailed,
  isPending,
  isSent,
  bgColor,
  statusColor,
  statusText,
  StatusIcon,
}) => {
  const [isDebuggerOpen, setIsDebuggerOpen] = useState(false);

  return (
    <div
      key={log.id}
      className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-white/10 flex flex-col gap-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-full mt-1 ${bgColor}`}>
          <EnvelopeIcon className={`w-5 h-5 ${statusColor}`} />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-[#1E293B] dark:text-slate-100">
              {log.subject}
            </h4>
            <span
              className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${bgColor} ${statusColor} flex items-center gap-1`}
            >
              <StatusIcon className="w-3 h-3" />
              {statusText}
            </span>
          </div>
          <div className="text-xs text-[#0F172A] dark:text-white mt-2 space-y-1 font-mono">
            <div>
              <strong className="text-[#0F172A] dark:text-white">
                Target:
              </strong>{" "}
              {log.target}
            </div>
            <div>
              <strong className="text-[#0F172A] dark:text-white">
                Timestamp:
              </strong>{" "}
              {new Date(log.timestamp).toLocaleString()}
            </div>
            <div>
              <strong className="text-[#0F172A] dark:text-white">
                Gateway:
              </strong>{" "}
              {log.provider}
            </div>
            {log.responsePayload?.messageId && (
              <div>
                <strong className="text-[#0F172A] dark:text-white">
                  Ref ID:
                </strong>{" "}
                {log.responsePayload.messageId}
              </div>
            )}
            {isFailed && log.responsePayload?.error && (
              <div className="text-red-500 mt-1">
                <strong>Error:</strong> {log.responsePayload.error}
              </div>
            )}
          </div>
          {isFailed && (
            <div className="mt-3">
              <button
                onClick={() => setIsDebuggerOpen(!isDebuggerOpen)}
                className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
              >
                {isDebuggerOpen ? "Hide" : "Show"} Raw Dispatch Metadata
              </button>
              {isDebuggerOpen && (
                <div className="mt-2 bg-slate-50 rounded-lg p-3 overflow-x-auto dark:bg-slate-900">
                  <pre className="text-[10px] text-emerald-400 font-mono">
                    {JSON.stringify(log.responsePayload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const SecurityDispatchLog: React.FC<{ userEmail: string }> = ({
  userEmail,
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notification-logs");
      const data = await res.json();
      // Filter logs intended for the current user and specifically ITCC or general security alarms
      const userLogs = data.filter(
        (log: LogEntry) =>
          log.target === userEmail &&
          log.type === "email" &&
          log.subject.toLowerCase().includes("security"),
      );
      setLogs(userLogs);
    } catch (err) {
      console.error("Failed to fetch dispatch logs", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Polling every 5 seconds
    return () => clearInterval(interval);
  }, [userEmail]);

  return (
    <div className="bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-2xl shadow-digital p-6">
      <div className="flex justify-between items-center border-b border-slate-300 dark:border-white/10 pb-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
            <ExclamationTriangleIcon className="w-6 h-6 text-primary" />
            ITCC Security Dispatch Log
          </h2>
          <p className="text-sm text-[#0F172A] dark:text-white mt-1">
            Live monitoring of automated security alarm deliveries.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-[#0F172A] dark:text-white"
          title="Refresh Logs"
        >
          <ArrowPathIcon
            className={`w-5 h-5 ${loading ? "animate-spin text-primary" : ""}`}
          />
        </button>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {logs.length === 0 && !loading ? (
          <div className="text-center py-10 text-[#0F172A] dark:text-white font-mono text-sm">
            No security dispatches found for your account.
          </div>
        ) : (
          logs.map((log) => {
            const isSent = log.status === "delivered";
            const isFailed =
              log.status === "failed" ||
              (log.statusCode !== null && log.statusCode >= 400);
            const isPending = log.status === "pending";

            let StatusIcon = CheckCircleIcon;
            let statusColor = "text-emerald-500";
            let bgColor = "bg-emerald-100 dark:bg-emerald-500";
            let statusText = "Sent";

            if (isFailed) {
              StatusIcon = XCircleIcon;
              statusColor = "text-red-500";
              bgColor = "bg-red-100 dark:bg-red-500";
              statusText = "Failed";
            } else if (isPending) {
              StatusIcon = ClockIcon;
              statusColor = "text-amber-500";
              bgColor = "bg-amber-100 dark:bg-amber-500";
              statusText = "Pending";
            }

            return (
              <LogEntryRow
                key={log.id}
                log={log}
                isFailed={isFailed}
                isPending={isPending}
                isSent={isSent}
                bgColor={bgColor}
                statusColor={statusColor}
                statusText={statusText}
                StatusIcon={StatusIcon}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
