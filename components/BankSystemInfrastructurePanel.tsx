import React, { useState, useEffect, useMemo } from 'react';
import { 
    ComputerDesktopIcon, 
    ArrowPathIcon, 
    ShieldCheckIcon, 
    ExclamationTriangleIcon,
    LockClosedIcon,
    LogoutIcon as ArrowRightOnRectangleIcon,
    WifiIcon as SignalIcon,
    ActivityIcon as CpuChipIcon,
    ServerIcon as CircleStackIcon,
    SparklesIcon,
    CheckCircleIcon,
    SparklesIcon as BoltIcon,
    SearchIcon,
    ChevronDownIcon,
    ArrowDownTrayIcon,
    XCircleIcon,
    BellIcon,
    GlobeAmericasIcon,
    DocumentTextIcon,
    ClockIcon
} from './Icons';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export interface AdminSessionRecord {
    id: string;
    principalName: string;
    email: string;
    role: string;
    ipAddress: string;
    location: string;
    userAgent: string;
    authMethod: string;
    loginTime: string;
    lastActive: string;
    isCurrent: boolean;
    mfaVerified: boolean;
    riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ServiceHealthLog {
    id: string;
    timestamp: string;
    serviceName: string;
    level: 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';
    message: string;
    errorCode?: string;
    sourceNode: string;
}

interface BankSystemInfrastructurePanelProps {
    addToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

export const BankSystemInfrastructurePanel: React.FC<BankSystemInfrastructurePanelProps> = ({ addToast }) => {
    // --- Real-time Metrics State ---
    const [activeConnections, setActiveConnections] = useState<number>(142);
    const [dbPoolActive, setDbPoolActive] = useState<number>(28);
    const [heapMemoryMB, setHeapMemoryMB] = useState<number>(412.4);
    const [cpuUtilizationPercent, setCpuUtilizationPercent] = useState<number>(28.4);
    const [isGcRunning, setIsGcRunning] = useState<boolean>(false);
    const [isFlushingCache, setIsFlushingCache] = useState<boolean>(false);
    const [workerThreads, setWorkerThreads] = useState<number>(12);
    const [gcCount, setGcCount] = useState<number>(184);

    // --- Feature 1: Transaction Velocity Control State ---
    const [velocityControlEnabled, setVelocityControlEnabled] = useState<boolean>(true);
    const [velocityThreshold, setVelocityThreshold] = useState<number>(120); // Txs per minute
    const [currentVelocity, setCurrentVelocity] = useState<number>(84); // Current Txs per minute
    const [isSystemLocked, setIsSystemLocked] = useState<boolean>(false);
    const [lockReason, setLockReason] = useState<string>('');
    const [lockTimestamp, setLockTimestamp] = useState<string | null>(null);

    // --- Feature 2: 60-Minute Resource Utilization Historical Data ---
    const [resourceMetricsView, setResourceMetricsView] = useState<'all' | 'cpu' | 'memory' | 'io'>('all');
    const [utilizationHistory, setUtilizationHistory] = useState<Array<{
        time: string;
        cpuPercent: number;
        memoryPercent: number;
        heapMB: number;
        threadSatPercent: number;
        ioOps: number;
    }>>(() => {
        // Seed 60 minutes of historical data
        const initialData = [];
        const now = new Date();
        for (let i = 59; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 60 * 1000);
            const timeStr = d.toTimeString().slice(0, 5);
            // Simulate realistic wave curves
            const baseCpu = 20 + Math.sin(i / 5) * 12 + (Math.random() * 8);
            const baseHeap = 380 + Math.cos(i / 7) * 45 + (Math.random() * 20);
            const baseThread = 30 + Math.sin(i / 4) * 15 + (Math.random() * 10);
            const baseIo = 900 + Math.sin(i / 6) * 400 + (Math.random() * 200);

            initialData.push({
                time: timeStr,
                cpuPercent: Number(Math.min(98, Math.max(8, baseCpu)).toFixed(1)),
                memoryPercent: Number(((baseHeap / 1024) * 100).toFixed(1)),
                heapMB: Number(baseHeap.toFixed(1)),
                threadSatPercent: Number(Math.min(95, Math.max(10, baseThread)).toFixed(1)),
                ioOps: Math.floor(baseIo)
            });
        }
        return initialData;
    });

    // --- Feature 3: Admin Session Audit Trail & Session Hygiene State ---
    const [sessionSearchQuery, setSessionSearchQuery] = useState<string>('');
    const [sessionRoleFilter, setSessionRoleFilter] = useState<string>('ALL');
    const [autoRefreshSessions, setAutoRefreshSessions] = useState<boolean>(true);
    const [sessionsCountdown, setSessionsCountdown] = useState<number>(30);
    const [showSessionHygieneModal, setShowSessionHygieneModal] = useState<boolean>(false);
    const [lastHygieneReport, setLastHygieneReport] = useState<{
        prunedCount: number;
        timestamp: string;
        prunedSessions: AdminSessionRecord[];
    } | null>(null);

    const [adminSessions, setAdminSessions] = useState<AdminSessionRecord[]>([
        {
            id: 'SESS-ADM-9012',
            principalName: 'Super Admin Principal',
            email: 'info@lawrenceconsultantsorg.org',
            role: 'Super Administrator',
            ipAddress: '192.168.1.104',
            location: 'Zurich, Switzerland (CH-ZH)',
            userAgent: 'Chrome 127.0.6533 (macOS Sequoia 15.0)',
            authMethod: 'OAuth2 + FIDO2 Hardware Key',
            loginTime: '2026-08-05 13:12:40',
            lastActive: 'Just now',
            isCurrent: true,
            mfaVerified: true,
            riskScore: 'LOW'
        },
        {
            id: 'SESS-ADM-8419',
            principalName: 'Compliance Director',
            email: 'compliance.lead@firstpacific.bank',
            role: 'Compliance Lead',
            ipAddress: '10.0.4.12',
            location: 'Frankfurt, Germany (DE-HE)',
            userAgent: 'Firefox Developer Edition 129.0 (Ubuntu Linux)',
            authMethod: 'MFA TOTP + RSA SecurID',
            loginTime: '2026-08-05 11:45:12',
            lastActive: '3 mins ago',
            isCurrent: false,
            mfaVerified: true,
            riskScore: 'LOW'
        },
        {
            id: 'SESS-ADM-7310',
            principalName: 'Senior Risk Auditor',
            email: 'risk.auditor@firstpacific.bank',
            role: 'Risk Auditor',
            ipAddress: '172.16.8.99',
            location: 'London, UK (GB-ENG)',
            userAgent: 'Safari 17.5 (macOS Sonoma)',
            authMethod: 'PKI Smartcard Certificate',
            loginTime: '2026-08-05 10:20:05',
            lastActive: '12 mins ago',
            isCurrent: false,
            mfaVerified: true,
            riskScore: 'LOW'
        },
        {
            id: 'SESS-ADM-6188',
            principalName: 'Ops Monitor Sentinel',
            email: 'ops.sentinel@firstpacific.bank',
            role: 'Operations Specialist',
            ipAddress: '198.51.100.45',
            location: 'New York, USA (US-NY)',
            userAgent: 'Edge 126.0 (Windows 11 Enterprise)',
            authMethod: 'OAuth2 Bearer Token',
            loginTime: '2026-08-05 09:05:18',
            lastActive: '18 mins ago',
            isCurrent: false,
            mfaVerified: true,
            riskScore: 'MEDIUM'
        },
        {
            id: 'SESS-ADM-5201',
            principalName: 'Legacy Support Admin',
            email: 'support.legacy@firstpacific.bank',
            role: 'Operations Specialist',
            ipAddress: '192.168.10.88',
            location: 'Zurich, Switzerland (CH-ZH)',
            userAgent: 'Chrome 120.0 (Windows 10)',
            authMethod: 'Password + SMS OTP',
            loginTime: '2026-08-05 08:30:10',
            lastActive: '5.4 hours ago',
            isCurrent: false,
            mfaVerified: true,
            riskScore: 'MEDIUM'
        },
        {
            id: 'SESS-ADM-4109',
            principalName: 'Offsite Security Vendor',
            email: 'vendor.audit@external-sec.org',
            role: 'Contractor Audit',
            ipAddress: '185.220.101.9',
            location: 'Amsterdam, Netherlands (NL-NH)',
            userAgent: 'Firefox 115.0 (Linux x86_64)',
            authMethod: 'OAuth2 Token',
            loginTime: '2026-08-05 06:12:44',
            lastActive: '7.8 hours ago',
            isCurrent: false,
            mfaVerified: false,
            riskScore: 'HIGH'
        }
    ]);

    // --- Feature 5: Aggressive Batch Sync (Firestore Database Optimization) State ---
    const [aggressiveBatchSyncEnabled, setAggressiveBatchSyncEnabled] = useState<boolean>(true);
    const [pendingBatchTxs, setPendingBatchTxs] = useState<number>(18);
    const [totalBatchesCommitted, setTotalBatchesCommitted] = useState<number>(54);
    const [totalWritesSaved, setTotalWritesSaved] = useState<number>(2410);
    const [lastCommitTimestamp, setLastCommitTimestamp] = useState<string>('14:42:18');
    const [batchCommitHistory, setBatchCommitHistory] = useState<Array<{ id: string; time: string; txCount: number; dbWritesSaved: number }>>([
        { id: 'BATCH-FS-904', time: '14:42:18', txCount: 44, dbWritesSaved: 43 },
        { id: 'BATCH-FS-903', time: '14:35:10', txCount: 65, dbWritesSaved: 64 },
        { id: 'BATCH-FS-902', time: '14:28:02', txCount: 51, dbWritesSaved: 50 }
    ]);

    // --- Feature 4: Service Health Logs State ---
    const [isHealthLogsExpanded, setIsHealthLogsExpanded] = useState<boolean>(true);
    const [healthLogSearch, setHealthLogSearch] = useState<string>('');
    const [healthLogLevelFilter, setHealthLogLevelFilter] = useState<'ALL' | 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO'>('ALL');
    const [autoRefreshLogs, setAutoRefreshLogs] = useState<boolean>(true);
    const [healthLogs, setHealthLogs] = useState<ServiceHealthLog[]>([
        {
            id: 'LOG-9941',
            timestamp: '2026-08-05 14:38:12',
            serviceName: 'LedgerReconciliationService',
            level: 'CRITICAL',
            message: 'Flagged transaction rate spike detected! 142 txs/min approaching circuit breaker threshold.',
            errorCode: 'ERR_VELOCITY_SPIKE_8801',
            sourceNode: 'node-ledger-us-east-1a'
        },
        {
            id: 'LOG-9938',
            timestamp: '2026-08-05 14:35:04',
            serviceName: 'SWIFTGatewayEngine',
            level: 'ERROR',
            message: 'Socket timeout on Frankfurt node SWIFT-DE-01 (attempt 2/3 retried successfully).',
            errorCode: 'SWIFT_SOCKET_TIMEOUT_408',
            sourceNode: 'node-swift-eu-central-1'
        },
        {
            id: 'LOG-9932',
            timestamp: '2026-08-05 14:30:22',
            serviceName: 'AuthEnclave',
            level: 'CRITICAL',
            message: '5 failed admin login attempts from unauthorized IP 185.220.101.4 (Tor exit node). IP blacklisted.',
            errorCode: 'SEC_TOR_BRUTE_FORCE_902',
            sourceNode: 'node-auth-global-01'
        },
        {
            id: 'LOG-9925',
            timestamp: '2026-08-05 14:24:18',
            serviceName: 'RedisCacheManager',
            level: 'WARNING',
            message: 'In-memory cache hit ratio dropped below 92% (automated re-indexing initiated).',
            errorCode: 'CACHE_RATIO_WARN_104',
            sourceNode: 'node-redis-cluster-03'
        },
        {
            id: 'LOG-9918',
            timestamp: '2026-08-05 14:18:50',
            serviceName: 'FedNowSettlement',
            level: 'INFO',
            message: 'Automated instant batch settlement completed. 1,482 records reconciled with Fed Reserve.',
            sourceNode: 'node-fednow-us-east-1'
        },
        {
            id: 'LOG-9905',
            timestamp: '2026-08-05 14:12:01',
            serviceName: 'DatabasePoolManager',
            level: 'WARNING',
            message: 'Connection pool near capacity (28/30 active). Worker pool scaled up by +2 threads.',
            errorCode: 'DB_POOL_NEAR_CAPACITY',
            sourceNode: 'node-db-primary-01'
        }
    ]);

    // --- Feature 3b: Session Audit Trail Auto Refresh Timer Effect ---
    useEffect(() => {
        if (!autoRefreshSessions) return;

        const interval = setInterval(() => {
            setSessionsCountdown(prev => {
                if (prev <= 1) {
                    // Perform 30s auto refresh pulse
                    setAdminSessions(current => 
                        current.map(s => s.isCurrent ? { ...s, lastActive: 'Just now' } : s)
                    );
                    return 30;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [autoRefreshSessions]);

    // --- Real-Time Telemetry Simulation Pulse ---
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const timeStr = now.toTimeString().slice(0, 5);

            // Fluctuate sockets and memory
            const deltaConn = Math.floor(Math.random() * 5) - 2;
            setActiveConnections(prev => Math.max(120, Math.min(220, prev + deltaConn)));

            const deltaMem = (Math.random() * 2 - 0.8);
            const newHeap = Number(Math.max(380, Math.min(540, heapMemoryMB + deltaMem)).toFixed(1));
            setHeapMemoryMB(newHeap);

            const newCpu = Number(Math.max(12, Math.min(88, cpuUtilizationPercent + (Math.random() * 4 - 2))).toFixed(1));
            setCpuUtilizationPercent(newCpu);

            // Fluctuate Transaction Velocity
            const velocityDelta = Math.floor(Math.random() * 11) - 5;
            const nextVelocity = Math.max(30, Math.min(240, currentVelocity + velocityDelta));
            setCurrentVelocity(nextVelocity);

            // Accumulate pending batch transactions if Aggressive Batch Sync is active
            if (aggressiveBatchSyncEnabled) {
                setPendingBatchTxs(prev => {
                    const nextCount = prev + Math.floor(Math.random() * 6) + 3;
                    if (nextCount >= 50) {
                        // Trigger automated atomic batch commit
                        setTimeout(() => executeAtomicBatchCommit(nextCount), 0);
                        return 0;
                    }
                    return nextCount;
                });
            }

            // Check Circuit Breaker Trigger
            if (velocityControlEnabled && nextVelocity > velocityThreshold && !isSystemLocked) {
                setIsSystemLocked(true);
                const reasonStr = `Automatic System-Wide Lock: Transaction velocity rate (${nextVelocity} Txs/min) exceeded safety limit threshold (${velocityThreshold} Txs/min).`;
                setLockReason(reasonStr);
                setLockTimestamp(now.toLocaleTimeString());

                // Log Critical Event
                const criticalLog: ServiceHealthLog = {
                    id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
                    timestamp: `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 8)}`,
                    serviceName: 'TransactionVelocityCircuitBreaker',
                    level: 'CRITICAL',
                    message: `SYSTEM-WIDE LOCK TRIPPED! Transaction velocity reached ${nextVelocity} Txs/min (Threshold: ${velocityThreshold}). All outgoing transfers held in isolation.`,
                    errorCode: 'ERR_CIRCUIT_BREAKER_TRIPPED',
                    sourceNode: 'node-velocity-sentinel-01'
                };
                setHealthLogs(prev => [criticalLog, ...prev.slice(0, 25)]);

                if (addToast) {
                    addToast('error', 'SYSTEM CIRCUIT BREAKER TRIPPED!', reasonStr);
                }
            }

            // Append live historical point to 60-minute array
            setUtilizationHistory(prev => {
                const nextHeap = newHeap;
                const nextCpu = newCpu;
                const nextSat = Math.floor(30 + Math.random() * 40);
                const nextIo = Math.floor(1000 + Math.random() * 500);

                const updated = [...prev.slice(1), {
                    time: timeStr,
                    cpuPercent: nextCpu,
                    memoryPercent: Number(((nextHeap / 1024) * 100).toFixed(1)),
                    heapMB: nextHeap,
                    threadSatPercent: nextSat,
                    ioOps: nextIo
                }];
                return updated;
            });
        }, 4000);

        return () => clearInterval(interval);
    }, [currentVelocity, velocityThreshold, velocityControlEnabled, isSystemLocked, heapMemoryMB, cpuUtilizationPercent, aggressiveBatchSyncEnabled, addToast]);

    // --- Action Handlers ---
    const executeAtomicBatchCommit = (txCountToCommit?: number) => {
        const count = txCountToCommit !== undefined ? txCountToCommit : pendingBatchTxs;
        if (count <= 0) {
            if (addToast) addToast('info', 'Batch Buffer Empty', 'No pending ledger transactions in queue to commit.');
            return;
        }

        const timeStr = new Date().toLocaleTimeString();
        const batchId = `BATCH-FS-${Math.floor(100 + Math.random() * 900)}`;
        const writesSaved = Math.max(0, count - 1);

        setTotalBatchesCommitted(prev => prev + 1);
        setTotalWritesSaved(prev => prev + writesSaved);
        setLastCommitTimestamp(timeStr);
        setPendingBatchTxs(0);

        setBatchCommitHistory(prev => [
            { id: batchId, time: timeStr, txCount: count, dbWritesSaved: writesSaved },
            ...prev.slice(0, 4)
        ]);

        const infoLog: ServiceHealthLog = {
            id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
            timestamp: `${new Date().toISOString().slice(0, 10)} ${timeStr}`,
            serviceName: 'FirestoreLedgerBatchEngine',
            level: 'INFO',
            message: `ATOMIC BATCH COMMIT [${batchId}]: Grouped ${count} pending micro-transactions into 1 single Firestore write call (Saved ${writesSaved} database write ops).`,
            sourceNode: 'node-firestore-gateway-01'
        };
        setHealthLogs(prev => [infoLog, ...prev.slice(0, 25)]);

        if (addToast) {
            addToast('success', 'Atomic Batch Sync Committed', `Grouped ${count} micro-transactions into 1 atomic Firestore commit payload. Saved ${writesSaved} database ops.`);
        }
    };

    const handleRunSessionHygiene = () => {
        const expiredSessions = adminSessions.filter(s => {
            if (s.isCurrent) return false;
            if (s.lastActive.includes('hours ago')) {
                const hrs = parseFloat(s.lastActive.split(' ')[0]);
                return hrs >= 4.0;
            }
            if (s.lastActive.includes('day') || s.lastActive.includes('Yesterday')) {
                return true;
            }
            return false;
        });

        if (expiredSessions.length === 0) {
            if (addToast) {
                addToast('info', 'Session Hygiene Checked', 'No admin sessions found idle for over 4 hours. All active tokens compliant.');
            }
            return;
        }

        const expiredIds = new Set(expiredSessions.map(s => s.id));
        setAdminSessions(prev => prev.filter(s => !expiredIds.has(s.id)));

        const report = {
            prunedCount: expiredSessions.length,
            timestamp: new Date().toLocaleTimeString(),
            prunedSessions: expiredSessions
        };

        setLastHygieneReport(report);
        setShowSessionHygieneModal(true);

        if (addToast) {
            addToast('success', 'Session Hygiene Executed', `Pruned ${expiredSessions.length} inactive admin session(s) (>4h idle limit). Disconnected tokens.`);
        }
    };

    // --- Action Handlers ---
    const handleTriggerGc = () => {
        setIsGcRunning(true);
        setTimeout(() => {
            setIsGcRunning(false);
            setHeapMemoryMB(368.2);
            setGcCount(prev => prev + 1);
            if (addToast) {
                addToast('success', 'Garbage Collection Complete', 'Reclaimed 44.2 MB of heap memory. V8 pause duration: 12ms.');
            }
        }, 1200);
    };

    const handleFlushCache = () => {
        setIsFlushingCache(true);
        setTimeout(() => {
            setIsFlushingCache(false);
            if (addToast) {
                addToast('info', 'Ledger Cache Purged', 'Flushed Redis in-memory transaction index. Re-indexed 100% database entities.');
            }
        }, 1000);
    };

    const handleScaleWorkers = () => {
        setWorkerThreads(prev => prev + 2);
        if (addToast) {
            addToast('success', 'Worker Threads Scaled', `Scaled ledger reconciliation worker pool to ${workerThreads + 2} active threads.`);
        }
    };

    const handleResetSystemLock = () => {
        setIsSystemLocked(false);
        setLockReason('');
        setLockTimestamp(null);
        if (addToast) {
            addToast('success', 'System Lock Disengaged', 'Admin override applied. Re-enabled outgoing transaction processing and SWIFT clearing queues.');
        }
    };

    const handleTriggerManualLock = () => {
        setIsSystemLocked(true);
        const reason = 'Manual Administrator Override: System-wide lockdown engaged via Admin Infrastructure Enclave.';
        setLockReason(reason);
        setLockTimestamp(new Date().toLocaleTimeString());
        if (addToast) {
            addToast('error', 'Manual Lockdown Engaged', reason);
        }
    };

    const handleForceTerminateSession = (session: AdminSessionRecord) => {
        if (session.isCurrent) {
            if (addToast) {
                addToast('warning', 'Action Prohibited', 'Cannot terminate your current active super admin session.');
            }
            return;
        }

        if (window.confirm(`FORCE TERMINATE SESSION?\n\nAdmin: ${session.principalName} (${session.email})\nIP: ${session.ipAddress}\nSession ID: ${session.id}`)) {
            setAdminSessions(prev => prev.filter(s => s.id !== session.id));
            if (addToast) {
                addToast('error', 'Admin Session Terminated', `Revoked token and forcibly disconnected ${session.email} [${session.id}].`);
            }
        }
    };

    const handleRevokeAllSecondary = () => {
        const secondaryCount = adminSessions.filter(s => !s.isCurrent).length;
        if (secondaryCount === 0) {
            if (addToast) addToast('info', 'No Secondary Sessions', 'No secondary admin sessions currently active.');
            return;
        }

        if (window.confirm(`Revoke all ${secondaryCount} secondary admin sessions immediately?`)) {
            setAdminSessions(prev => prev.filter(s => s.isCurrent));
            if (addToast) {
                addToast('warning', 'Secondary Sessions Purged', `Terminated ${secondaryCount} active admin sessions. Only current principal remains authenticated.`);
            }
        }
    };

    const handleExportSessionCSV = () => {
        const headers = ['Session ID', 'Principal Name', 'Email', 'Role', 'IP Address', 'Location', 'Auth Method', 'Login Time', 'Risk Score'];
        const rows = adminSessions.map(s => [
            s.id,
            `"${s.principalName}"`,
            s.email,
            `"${s.role}"`,
            s.ipAddress,
            `"${s.location}"`,
            `"${s.authMethod}"`,
            s.loginTime,
            s.riskScore
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `admin_sessions_audit_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (addToast) addToast('info', 'Audit Log Downloaded', 'Exported admin session audit trail to CSV file.');
    };

    const handleExportGlobalSnapshot = () => {
        const snapshot = {
            snapshotId: `SNAP-INFRA-${Date.now()}`,
            generatedAt: new Date().toISOString(),
            systemStatus: isSystemLocked ? 'SYSTEM_LOCKDOWN' : '99.999% OPERATIONAL',
            circuitBreaker: {
                isLocked: isSystemLocked,
                lockReason: lockReason || 'None',
                lockTimestamp: lockTimestamp || 'N/A',
                velocityGuardEnabled: velocityControlEnabled,
                currentVelocityTxsPerMin: currentVelocity,
                velocityThresholdLimit: velocityThreshold,
                hazardZone: currentVelocity > velocityThreshold ? 'CRITICAL_SPIKE' : currentVelocity > velocityThreshold * 0.8 ? 'WARNING_ZONE' : 'SAFE'
            },
            telemetry: {
                activeWebSockets: activeConnections,
                databasePoolActive: dbPoolActive,
                databasePoolCapacity: 30,
                cpuCoreUtilizationPercent: cpuUtilizationPercent,
                heapMemoryAllocatedMB: heapMemoryMB,
                maxMemoryLimitMB: 1024,
                memoryUtilizationPercent: memoryPercentage,
                workerThreadsCount: workerThreads,
                gcCyclesExecuted: gcCount
            },
            adminSessionsSummary: {
                totalActiveSessions: adminSessions.length,
                currentPrincipalEmail: adminSessions.find(s => s.isCurrent)?.email || 'Unknown',
                sessions: adminSessions.map(s => ({
                    id: s.id,
                    principalName: s.principalName,
                    email: s.email,
                    role: s.role,
                    ipAddress: s.ipAddress,
                    location: s.location,
                    mfaVerified: s.mfaVerified,
                    riskScore: s.riskScore,
                    sessionCryptoHash: `SHA256-${Math.random().toString(36).substring(2, 12).toUpperCase()}`
                }))
            },
            serviceHealthLogCount: healthLogs.length,
            criticalLogsFlagged: healthLogs.filter(l => l.level === 'CRITICAL' || l.level === 'ERROR').length
        };

        const jsonString = JSON.stringify(snapshot, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `global_system_snapshot_${Date.now()}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (addToast) {
            addToast('success', 'Global Snapshot Exported', `Generated snapshot ${snapshot.snapshotId}. Downloaded complete infrastructure state.`);
        }
    };

    const handleExportHealthLogs = () => {
        const jsonContent = JSON.stringify(healthLogs, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `service_health_logs_${Date.now()}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (addToast) addToast('info', 'Health Logs Exported', 'Downloaded system error and health diagnostic logs.');
    };

    // --- Filtered Data Computations ---
    const filteredSessions = useMemo(() => {
        return adminSessions.filter(session => {
            const matchesQuery = 
                (session.principalName || '').toLowerCase().includes(sessionSearchQuery.toLowerCase()) ||
                (session.email || '').toLowerCase().includes(sessionSearchQuery.toLowerCase()) ||
                (session.ipAddress || '').includes(sessionSearchQuery) ||
                (session.location || '').toLowerCase().includes(sessionSearchQuery.toLowerCase()) ||
                (session.id || '').toLowerCase().includes(sessionSearchQuery.toLowerCase());

            const matchesRole = sessionRoleFilter === 'ALL' || session.role.toUpperCase().includes(sessionRoleFilter);
            return matchesQuery && matchesRole;
        });
    }, [adminSessions, sessionSearchQuery, sessionRoleFilter]);

    const filteredHealthLogs = useMemo(() => {
        return healthLogs.filter(log => {
            const matchesQuery = 
                (log.message || '').toLowerCase().includes(healthLogSearch.toLowerCase()) ||
                (log.serviceName || '').toLowerCase().includes(healthLogSearch.toLowerCase()) ||
                (log.errorCode && log.errorCode.toLowerCase().includes(healthLogSearch.toLowerCase()));

            const matchesLevel = healthLogLevelFilter === 'ALL' || log.level === healthLogLevelFilter;
            return matchesQuery && matchesLevel;
        });
    }, [healthLogs, healthLogSearch, healthLogLevelFilter]);

    const memoryPercentage = Number(((heapMemoryMB / 1024) * 100).toFixed(1));

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* System Lock Circuit Breaker Critical Alert Overlay Banner */}
            {isSystemLocked && (
                <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-black border-2 border-rose-500 rounded-[2.5rem] p-6 shadow-[0_0_50px_rgba(244,63,94,0.4)] animate-pulse flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3.5 bg-rose-500 rounded-2xl text-white shadow-xl shadow-rose-900 animate-bounce">
                            <ExclamationTriangleIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <span className="px-3 py-1 bg-rose-500 text-rose-200 border border-rose-400/50 rounded-full text-[10px] font-black uppercase tracking-widest font-mono">
                                CRITICAL SYSTEM LOCK ACTIVE
                            </span>
                            <h3 className="text-xl font-black text-white uppercase tracking-wider font-mono mt-1">
                                CIRCUIT BREAKER ENGAGED & TRANSACTION GATEWAY ISOLATED
                            </h3>
                            <p className="text-xs text-rose-200 font-mono mt-0.5">
                                {lockReason || 'Transaction velocity exceeded configured safety limit threshold.'}
                            </p>
                            {lockTimestamp && (
                                <span className="text-[10px] text-rose-300 font-mono block mt-1">
                                    Triggered at: {lockTimestamp} | All outgoing SWIFT, ACH & FedWire transfers temporarily suspended.
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 relative z-10">
                        <button
                            onClick={handleResetSystemLock}
                            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-xl transition-all cursor-pointer transform hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <ShieldCheckIcon className="w-4 h-4" />
                            Disengage Lock & Resume Processing
                        </button>
                    </div>
                </div>
            )}

            {/* Top Infrastructure Enclave Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl text-slate-950 shadow-xl shadow-emerald-500/20">
                            <ComputerDesktopIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black text-white uppercase tracking-wider font-mono">
                                    BANK SYSTEM INFRASTRUCTURE
                                </h2>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm border ${
                                    isSystemLocked 
                                        ? 'bg-rose-500 border-rose-500/40 text-rose-400 animate-pulse' 
                                        : 'bg-emerald-500 border-emerald-500/40 text-emerald-400'
                                }`}>
                                    <span className={`w-2 h-2 rounded-full ${isSystemLocked ? 'bg-rose-500' : 'bg-emerald-400 animate-ping'}`}></span>
                                    {isSystemLocked ? 'SYSTEM LOCKDOWN ACTIVE' : '99.999% OPERATIONAL'}
                                </span>
                            </div>
                            <p className="text-xs text-[#0F172A] font-mono mt-1">
                                Real-time node telemetry, velocity circuit breaker, 60-min utilization diagnostics, admin session enclave & error logs.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={handleExportGlobalSnapshot}
                            className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 border border-cyan-300/40 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-950/50 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4 text-slate-950 font-black" />
                            Global System Snapshot
                        </button>

                        <button
                            onClick={handleTriggerGc}
                            disabled={isGcRunning}
                            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-500 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer disabled:opacity-70"
                        >
                            <ArrowPathIcon className={`w-4 h-4 ${isGcRunning ? 'animate-spin' : ''}`} />
                            {isGcRunning ? 'Running GC...' : 'Run GC Cycle'}
                        </button>

                        <button
                            onClick={handleRevokeAllSecondary}
                            className="px-4 py-2.5 bg-rose-500 hover:bg-rose-500 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
                        >
                            <ArrowRightOnRectangleIcon className="w-4 h-4" />
                            Purge Secondary Sessions
                        </button>
                    </div>
                </div>

                {/* Grid KPI Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 relative z-10">
                    <div className="bg-slate-100 border border-black/5 p-4 rounded-2xl">
                        <div className="flex items-center justify-between text-[#0F172A] text-[10px] font-mono uppercase mb-1">
                            <span>Active Sockets</span>
                            <SignalIcon className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="text-2xl font-black text-white font-mono">{activeConnections}</span>
                        <span className="text-[10px] text-emerald-400 font-mono block mt-0.5">WebSocket Mesh Connected</span>
                    </div>

                    <div className="bg-slate-100 border border-black/5 p-4 rounded-2xl">
                        <div className="flex items-center justify-between text-[#0F172A] text-[10px] font-mono uppercase mb-1">
                            <span>Current Tx Velocity</span>
                            <BoltIcon className={`w-4 h-4 ${currentVelocity > velocityThreshold ? 'text-rose-400 animate-bounce' : 'text-cyan-400'}`} />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-2xl font-black font-mono ${currentVelocity > velocityThreshold ? 'text-rose-400' : 'text-cyan-300'}`}>
                                {currentVelocity}
                            </span>
                            <span className="text-xs text-[#0F172A] font-mono">Txs/min</span>
                        </div>
                        <span className="text-[10px] text-[#0F172A] font-mono block mt-0.5">Threshold: {velocityThreshold} Txs/min</span>
                    </div>

                    <div className="bg-slate-100 border border-black/5 p-4 rounded-2xl">
                        <div className="flex items-center justify-between text-[#0F172A] text-[10px] font-mono uppercase mb-1">
                            <span>V8 Heap / CPU Load</span>
                            <CpuChipIcon className="w-4 h-4 text-amber-400" />
                        </div>
                        <span className="text-2xl font-black text-amber-400 font-mono">{heapMemoryMB} MB</span>
                        <span className="text-[10px] text-[#0F172A] font-mono block mt-0.5">CPU: {cpuUtilizationPercent}% | Heap: {memoryPercentage}%</span>
                    </div>

                    <div className="bg-slate-100 border border-black/5 p-4 rounded-2xl">
                        <div className="flex items-center justify-between text-[#0F172A] text-[10px] font-mono uppercase mb-1">
                            <span>Admin Sessions</span>
                            <LockClosedIcon className="w-4 h-4 text-purple-400" />
                        </div>
                        <span className="text-2xl font-black text-purple-300 font-mono">{adminSessions.length}</span>
                        <span className="text-[10px] text-purple-400 font-mono block mt-0.5">Authenticated Enclave</span>
                    </div>
                </div>
            </div>

            {/* FEATURE 1: Transaction Velocity Control Panel & Circuit Breaker */}
            <div className="bg-slate-50  border border-black/5 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden dark:bg-slate-900">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-black/5 pb-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-cyan-500 border border-cyan-500/30 rounded-xl text-cyan-400">
                            <BoltIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                                Transaction Velocity Circuit Breaker Control
                            </h3>
                            <p className="text-xs text-[#0F172A] font-mono">
                                Automated rate-limiting threshold that trips a system-wide isolation lock when transaction velocity spikes.
                            </p>
                        </div>
                    </div>

                    {/* Enable / Disable Toggle Switch */}
                    <div className="flex items-center gap-3 bg-slate-100 p-2.5 rounded-2xl border border-black/5">
                        <span className="text-xs font-mono font-bold text-[#0F172A] uppercase">
                            Velocity Guard: {velocityControlEnabled ? 'ENABLED' : 'DISABLED'}
                        </span>
                        <button
                            onClick={() => {
                                setVelocityControlEnabled(!velocityControlEnabled);
                                if (addToast) {
                                    addToast('info', 'Velocity Circuit Breaker Updated', `Automated lock guard set to ${!velocityControlEnabled ? 'ENABLED' : 'DISABLED'}.`);
                                }
                            }}
                            className={`w-12 h-6 rounded-full transition-colors relative p-1 cursor-pointer ${
                                velocityControlEnabled ? 'bg-cyan-500' : 'bg-slate-700'
                            }`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                velocityControlEnabled ? 'translate-x-6' : 'translate-x-0'
                            }`} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    
                    {/* Live Velocity Gauge & Meter (5 columns) */}
                    <div className="lg:col-span-5 bg-slate-100 border border-black/5 rounded-2xl p-5 space-y-4">
                        <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-[#0F172A] uppercase">Live Rate vs Limit Threshold:</span>
                            <span className={`font-black ${currentVelocity > velocityThreshold ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {currentVelocity} / {velocityThreshold} Txs/min
                            </span>
                        </div>

                        {/* Progress Meter Bar */}
                        <div className="h-4 w-full bg-slate-100 rounded-full p-0.5 border border-black/5 overflow-hidden relative">
                            <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                    currentVelocity > velocityThreshold 
                                        ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]' 
                                        : currentVelocity > velocityThreshold * 0.8 
                                            ? 'bg-amber-500' 
                                            : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                                }`}
                                style={{ width: `${Math.min(100, (currentVelocity / (velocityThreshold * 1.5)) * 100)}%` }}
                            />
                        </div>

                        {/* Presets */}
                        <div className="space-y-1.5 pt-2">
                            <span className="text-[10px] text-[#0F172A] font-mono uppercase block">Quick Threshold Presets:</span>
                            <div className="grid grid-cols-4 gap-2 font-mono text-[10px]">
                                {[
                                    { label: '50/min', value: 50 },
                                    { label: '120/min', value: 120 },
                                    { label: '250/min', value: 250 },
                                    { label: '500/min', value: 500 }
                                ].map(preset => (
                                    <button
                                        key={preset.value}
                                        onClick={() => {
                                            setVelocityThreshold(preset.value);
                                            if (addToast) addToast('info', 'Threshold Set', `Velocity limit adjusted to ${preset.value} Txs/min.`);
                                        }}
                                        className={`py-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                                            velocityThreshold === preset.value
                                                ? 'bg-cyan-500 border-cyan-400 text-cyan-300 font-bold'
                                                : 'bg-white border-black/5 text-[#0F172A] hover:text-white'
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Threshold Multi-Step Slider & Manual Override Controls (7 columns) */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="space-y-3 bg-slate-100 border border-black/5 rounded-2xl p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
                                <label className="text-[#1E293B] uppercase font-bold flex items-center gap-2">
                                    Threshold Control Input
                                    <span className="text-[10px] text-[#0F172A] font-normal">(Multi-Step Range Slider)</span>
                                </label>

                                {/* Visual Zone Color Indicator Badge */}
                                <div className="flex items-center gap-2">
                                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border shadow-sm ${
                                        velocityThreshold <= 80 
                                            ? 'bg-emerald-500 text-emerald-300 border-emerald-500/40 shadow-emerald-950'
                                            : velocityThreshold <= 180
                                                ? 'bg-cyan-500 text-cyan-300 border-cyan-500/40 shadow-cyan-950'
                                                : velocityThreshold <= 320
                                                    ? 'bg-amber-500 text-amber-300 border-amber-500/40 shadow-amber-950'
                                                    : 'bg-rose-500 text-rose-300 border-rose-500/40 shadow-rose-950 animate-pulse'
                                    }`}>
                                        <span className={`w-2 h-2 rounded-full ${
                                            velocityThreshold <= 80 ? 'bg-emerald-400' :
                                            velocityThreshold <= 180 ? 'bg-cyan-400' :
                                            velocityThreshold <= 320 ? 'bg-amber-400' : 'bg-rose-400'
                                        }`} />
                                        {velocityThreshold <= 80 ? 'CONSERVATIVE (STRICT)' :
                                         velocityThreshold <= 180 ? 'STANDARD BALANCED' :
                                         velocityThreshold <= 320 ? 'HIGH THROUGHPUT' : 'AGGRESSIVE / STRESS TEST'}
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <input 
                                            type="number" 
                                            min="30" 
                                            max="500" 
                                            value={velocityThreshold}
                                            onChange={(e) => setVelocityThreshold(Math.max(30, Math.min(500, Number(e.target.value))))}
                                            className="w-20 bg-slate-100 border border-white/20 rounded-lg px-2 py-1 text-center font-mono font-bold text-xs text-white focus:outline-none focus:border-cyan-400"
                                        />
                                        <span className="text-[#0F172A] text-[10px]">Txs/min</span>
                                    </div>
                                </div>
                            </div>

                            {/* Green-to-Red Visual Indicator Color-Coded Multi-Step Slider Bar */}
                            <div className="space-y-2 pt-1">
                                <div className="relative w-full">
                                    {/* Gradient Background Track (Green to Cyan to Amber to Red) */}
                                    <div className="absolute inset-0 h-3 my-auto rounded-full bg-gradient-to-r from-emerald-500 via-cyan-400 via-amber-400 to-rose-500 opacity-90 p-0.5 shadow-inner">
                                        <div className="w-full h-full rounded-full bg-slate-100" />
                                    </div>

                                    {/* Multi-Step Range Input Slider */}
                                    <input 
                                        type="range" 
                                        min="30" 
                                        max="500" 
                                        step="10" 
                                        value={velocityThreshold}
                                        onChange={(e) => setVelocityThreshold(Number(e.target.value))}
                                        className="relative z-10 w-full cursor-pointer h-5 opacity-90 accent-white"
                                    />
                                </div>

                                {/* Multi-Step Range Markers & Color Indicators */}
                                <div className="flex justify-between items-center text-[9px] font-mono font-bold px-1 text-[#0F172A]">
                                    <span className={`cursor-pointer transition-colors ${velocityThreshold <= 80 ? 'text-emerald-400 font-extrabold scale-110' : 'hover:text-emerald-300'}`} onClick={() => setVelocityThreshold(30)}>
                                        ● 30 (Strict)
                                    </span>
                                    <span className={`cursor-pointer transition-colors ${velocityThreshold > 80 && velocityThreshold <= 150 ? 'text-cyan-400 font-extrabold scale-110' : 'hover:text-cyan-300'}`} onClick={() => setVelocityThreshold(120)}>
                                        ● 120 (Normal)
                                    </span>
                                    <span className={`cursor-pointer transition-colors ${velocityThreshold > 150 && velocityThreshold <= 320 ? 'text-amber-400 font-extrabold scale-110' : 'hover:text-amber-300'}`} onClick={() => setVelocityThreshold(250)}>
                                        ● 250 (Peak)
                                    </span>
                                    <span className={`cursor-pointer transition-colors ${velocityThreshold > 320 ? 'text-rose-400 font-extrabold scale-110' : 'hover:text-rose-300'}`} onClick={() => setVelocityThreshold(500)}>
                                        ● 500 (Max)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Circuit Breaker Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                            <div className="text-[11px] font-mono text-[#0F172A]">
                                Status: {isSystemLocked ? (
                                    <span className="text-rose-400 font-bold uppercase">System Locked</span>
                                ) : (
                                    <span className="text-emerald-400 font-bold uppercase">Monitoring Velocity</span>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                {isSystemLocked ? (
                                    <button
                                        onClick={handleResetSystemLock}
                                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-950"
                                    >
                                        <CheckCircleIcon className="w-4 h-4" />
                                        Override & Unlock System
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleTriggerManualLock}
                                        className="px-4 py-2 bg-rose-500 hover:bg-rose-500 text-rose-300 border border-rose-500/40 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2"
                                    >
                                        <LockClosedIcon className="w-4 h-4" />
                                        Manual Lockdown Trigger
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* FEATURE 2: 60-Minute Real-Time Resource Utilization Chart & Gauge Meters */}
            <div className="bg-slate-50  border border-black/5 rounded-[2.5rem] p-6 shadow-2xl space-y-6 dark:bg-slate-900">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <CpuChipIcon className="w-6 h-6 text-amber-400" />
                            <h3 className="text-lg font-black text-white uppercase tracking-wider font-mono">
                                Ledger Service 60-Minute Resource Utilization
                            </h3>
                        </div>
                        <p className="text-xs text-[#0F172A] font-mono mt-0.5">
                            Real-time V8 heap memory & CPU core consumption telemetry stream over the last 60 minutes.
                        </p>
                    </div>

                    {/* Chart Metric View Toggles */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-black/5 font-mono text-[10px]">
                        {[
                            { id: 'all', label: 'All Metrics' },
                            { id: 'cpu', label: 'CPU %' },
                            { id: 'memory', label: 'Memory %' },
                            { id: 'io', label: 'I/O Ops/s' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setResourceMetricsView(tab.id as any)}
                                className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all cursor-pointer ${
                                    resourceMetricsView === tab.id
                                        ? 'bg-amber-500 text-amber-300 border border-amber-500/40 shadow-sm'
                                        : 'text-[#0F172A] hover:text-white'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Gauge Meters Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                    
                    {/* CPU Utilization Radial Dial */}
                    <div className="bg-slate-100 border border-black/5 p-4 rounded-2xl flex items-center justify-between">
                        <div>
                            <span className="text-[10px] text-[#0F172A] uppercase block">CPU Consumption</span>
                            <span className="text-2xl font-black text-amber-400 block mt-1">{cpuUtilizationPercent}%</span>
                            <span className="text-[10px] text-emerald-400 block mt-0.5">12 Core Worker Thread Pool</span>
                        </div>
                        <div className="w-16 h-16 relative flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <path className="text-[#1E293B]" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <path className="text-amber-400" strokeDasharray={`${cpuUtilizationPercent}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            </svg>
                        </div>
                    </div>

                    {/* V8 Heap Memory Radial Dial */}
                    <div className="bg-slate-100 border border-black/5 p-4 rounded-2xl flex items-center justify-between">
                        <div>
                            <span className="text-[10px] text-[#0F172A] uppercase block">V8 Heap Allocation</span>
                            <span className="text-2xl font-black text-cyan-300 block mt-1">{heapMemoryMB} MB</span>
                            <span className="text-[10px] text-[#0F172A] block mt-0.5">{memoryPercentage}% of 1,024 MB Limit</span>
                        </div>
                        <div className="w-16 h-16 relative flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <path className="text-[#1E293B]" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <path className="text-cyan-400" strokeDasharray={`${memoryPercentage}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            </svg>
                        </div>
                    </div>

                    {/* Garbage Collector & Replicas */}
                    <div className="bg-slate-100 border border-black/5 p-4 rounded-2xl flex items-center justify-between">
                        <div>
                            <span className="text-[10px] text-[#0F172A] uppercase block">Reconciliation Queue</span>
                            <span className="text-2xl font-black text-emerald-400 block mt-1">0 Backlog</span>
                            <span className="text-[10px] text-emerald-400 block mt-0.5">{gcCount} GC Cycles (12ms pause)</span>
                        </div>
                        <div className="p-3 bg-emerald-500 border border-emerald-500/30 rounded-xl text-emerald-400">
                            <CheckCircleIcon className="w-8 h-8" />
                        </div>
                    </div>

                </div>

                {/* Recharts Area Chart */}
                <div className="h-72 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={utilizationHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                            <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px' }}
                                itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                            {(resourceMetricsView === 'all' || resourceMetricsView === 'cpu') && (
                                <Area type="monotone" dataKey="cpuPercent" name="CPU Core Load (%)" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#cpuGrad)" />
                            )}
                            {(resourceMetricsView === 'all' || resourceMetricsView === 'memory') && (
                                <Area type="monotone" dataKey="memoryPercent" name="Heap Memory (%)" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#memGrad)" />
                            )}
                            {resourceMetricsView === 'io' && (
                                <Area type="monotone" dataKey="ioOps" name="I/O Operations / sec" stroke="#10b981" strokeWidth={2} fillOpacity={0.3} fill="#10b981" />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* FEATURE 5: Aggressive Batch Sync Mode (Firestore Database Optimizer) */}
            <div className="bg-slate-50  border border-black/5 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden dark:bg-slate-900">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-black/5 pb-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-500 border border-emerald-500/30 rounded-xl text-emerald-400">
                            <CircleStackIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-black text-white uppercase tracking-wider font-mono">
                                    Firestore Aggressive Batch Sync Engine
                                </h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                    aggressiveBatchSyncEnabled 
                                        ? 'bg-emerald-500 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-950 animate-pulse' 
                                        : 'bg-white text-[#0F172A] border-black/5'
                                }`}>
                                    {aggressiveBatchSyncEnabled ? 'ATOMIC BATCHING ACTIVE (50 txs/commit)' : 'DIRECT REAL-TIME COMMITS'}
                                </span>
                            </div>
                            <p className="text-xs text-[#0F172A] font-mono mt-0.5">
                                Groups small pending ledger transactions into single atomic commits to minimize Firestore database overhead during peak loads.
                            </p>
                        </div>
                    </div>

                    {/* Aggressive Batch Sync Toggle Switch */}
                    <div className="flex items-center gap-3 bg-slate-100 p-2.5 rounded-2xl border border-black/5">
                        <span className="text-xs font-mono font-bold text-[#0F172A] uppercase">
                            Aggressive Batching: {aggressiveBatchSyncEnabled ? 'ENABLED' : 'DISABLED'}
                        </span>
                        <button
                            onClick={() => {
                                setAggressiveBatchSyncEnabled(!aggressiveBatchSyncEnabled);
                                if (addToast) {
                                    addToast('info', 'Batch Sync Mode Updated', `Aggressive Firestore atomic batching set to ${!aggressiveBatchSyncEnabled ? 'ENABLED' : 'DISABLED'}.`);
                                }
                            }}
                            className={`w-12 h-6 rounded-full transition-colors relative p-1 cursor-pointer ${
                                aggressiveBatchSyncEnabled ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-slate-700'
                            }`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                aggressiveBatchSyncEnabled ? 'translate-x-6' : 'translate-x-0'
                            }`} />
                        </button>
                    </div>
                </div>

                {/* Batch Sync Controls & Real-Time Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    
                    {/* Metric Display Cards (7 columns) */}
                    <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="bg-slate-100 border border-black/5 p-4 rounded-2xl">
                            <span className="text-[10px] text-[#0F172A] font-mono uppercase block">Queued Micro Ledger Txs</span>
                            <span className="text-2xl font-black text-cyan-300 font-mono block mt-1">{pendingBatchTxs} Txs</span>
                            <span className="text-[10px] text-cyan-400 font-mono block mt-0.5">Buffer Target: 50 Txs/Batch</span>
                        </div>

                        <div className="bg-slate-100 border border-black/5 p-4 rounded-2xl">
                            <span className="text-[10px] text-[#0F172A] font-mono uppercase block">Total Atomic Batches</span>
                            <span className="text-2xl font-black text-emerald-400 font-mono block mt-1">{totalBatchesCommitted}</span>
                            <span className="text-[10px] text-[#0F172A] font-mono block mt-0.5">Last Commit: {lastCommitTimestamp}</span>
                        </div>

                        <div className="bg-slate-100 border border-black/5 p-4 rounded-2xl col-span-2 sm:col-span-1">
                            <span className="text-[10px] text-[#0F172A] font-mono uppercase block">Firestore Ops Saved</span>
                            <span className="text-2xl font-black text-amber-400 font-mono block mt-1">{totalWritesSaved}</span>
                            <span className="text-[10px] text-emerald-400 font-mono block mt-0.5">~78.2% Overhead Reduction</span>
                        </div>
                    </div>

                    {/* Manual Flush Button & Buffer Panel (5 columns) */}
                    <div className="lg:col-span-5 bg-slate-100 border border-black/5 p-4 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-[#1E293B] font-bold uppercase">Manual Batch Commit Action</span>
                            <span className="text-[#0F172A] text-[10px]">Instant Write</span>
                        </div>
                        <p className="text-[11px] text-[#0F172A] font-mono">
                            Flush all {pendingBatchTxs} currently queued ledger transactions to Firestore in a single atomic payload immediately.
                        </p>

                        <button
                            onClick={() => executeAtomicBatchCommit()}
                            disabled={pendingBatchTxs === 0}
                            className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                        >
                            <SparklesIcon className="w-4 h-4 text-slate-950 font-black" />
                            Trigger Manual Batch Commit ({pendingBatchTxs} Pending)
                        </button>
                    </div>
                </div>
            </div>

            {/* FEATURE 3: Detailed Admin Session Audit Trail Table */}
            <div className="bg-slate-50  border border-black/5 rounded-[2.5rem] p-6 shadow-2xl overflow-hidden dark:bg-slate-900">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-black/5 pb-4 mb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <LockClosedIcon className="w-6 h-6 text-purple-400" />
                            <h3 className="text-lg font-black text-white uppercase tracking-wider font-mono">
                                Admin Session Audit Trail Enclave
                            </h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${
                                autoRefreshSessions 
                                    ? 'bg-purple-500 text-purple-300 border-purple-500/40' 
                                    : 'bg-white text-[#0F172A] border-black/5'
                            }`}>
                                <span className={`w-2 h-2 rounded-full ${autoRefreshSessions ? 'bg-purple-400 animate-ping' : 'bg-slate-500'}`} />
                                {autoRefreshSessions ? `Auto-Refresh (${sessionsCountdown}s)` : 'Auto-Refresh PAUSED'}
                            </span>
                        </div>
                        <p className="text-xs text-[#0F172A] font-mono mt-0.5">
                            Comprehensive log of active administrative sessions, client IP addresses, geolocations, and access methods.
                        </p>
                    </div>

                    {/* Controls, Auto Refresh Toggle, Hygiene & Export Bar */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Auto Refresh Toggle Switch */}
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-white/15">
                            <span className="text-[10px] font-mono font-bold text-[#0F172A] uppercase">
                                30s Auto Refresh:
                            </span>
                            <button
                                onClick={() => {
                                    setAutoRefreshSessions(!autoRefreshSessions);
                                    if (addToast) {
                                        addToast('info', 'Audit Trail Auto Refresh', `Periodic session refresh (30s) ${!autoRefreshSessions ? 'ENABLED' : 'PAUSED'}.`);
                                    }
                                }}
                                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                                    autoRefreshSessions ? 'bg-purple-500' : 'bg-slate-700'
                                }`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                    autoRefreshSessions ? 'translate-x-4' : 'translate-x-0'
                                }`} />
                            </button>
                        </div>

                        {/* Session Hygiene Action Button */}
                        <button
                            onClick={handleRunSessionHygiene}
                            className="px-3.5 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer transform hover:scale-105 active:scale-95 shadow-lg shadow-emerald-950/30"
                        >
                            <SparklesIcon className="w-4 h-4 text-emerald-400" />
                            Session Hygiene (4h Expired)
                        </button>

                        <div className="relative">
                            <SearchIcon className="w-4 h-4 text-[#0F172A] absolute left-3 top-1/2 -translate-y-1/2" />
                            <input 
                                type="text"
                                placeholder="Search Principal, IP..."
                                value={sessionSearchQuery}
                                onChange={(e) => setSessionSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-slate-100 border border-white/15 rounded-xl text-xs text-[#1E293B] placeholder-slate-500 font-mono focus:outline-none focus:border-purple-400 w-48"
                            />
                        </div>

                        {/* Role Filter */}
                        <select
                            value={sessionRoleFilter}
                            onChange={(e) => setSessionRoleFilter(e.target.value)}
                            className="bg-slate-100 border border-white/15 rounded-xl px-3 py-2 text-xs text-[#1E293B] font-mono focus:outline-none focus:border-purple-400 cursor-pointer"
                        >
                            <option value="ALL">All Roles</option>
                            <option value="SUPER">Super Administrator</option>
                            <option value="COMPLIANCE">Compliance Lead</option>
                            <option value="AUDITOR">Risk Auditor</option>
                            <option value="OPERATIONS">Operations</option>
                        </select>

                        <button
                            onClick={handleExportSessionCSV}
                            className="px-3.5 py-2 bg-purple-500 hover:bg-purple-500 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Admin Session Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-mono text-xs">
                        <thead>
                            <tr className="border-b border-black/5 text-[9px] text-[#0F172A] font-black uppercase tracking-widest bg-slate-100">
                                <th className="px-6 py-4">Admin Principal / Email</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">IP Address & Geolocation</th>
                                <th className="px-6 py-4">User Agent / Client</th>
                                <th className="px-6 py-4">Authentication Standard</th>
                                <th className="px-6 py-4">Status & Risk</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredSessions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-[#0F172A] italic font-mono">
                                        No active admin sessions match the search parameters.
                                    </td>
                                </tr>
                            ) : (
                                filteredSessions.map((session, idx) => (
                                    <tr 
                                        key={session.id} 
                                        className={`group transition-all duration-300 transform hover:-translate-y-0.5 animate-in fade-in slide-in-from-left-2 border-l-4 ${
                                            session.isCurrent 
                                                ? 'bg-purple-900 border-l-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]' 
                                                : 'border-l-transparent hover:bg-purple-950 hover:border-l-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.25)]'
                                        }`}
                                        style={{ animationDelay: `${idx * 75}ms` }}
                                    >
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-white block uppercase tracking-wide group-hover:text-cyan-300 transition-colors">{session.principalName}</span>
                                                    {session.lastActive === 'Just now' && (
                                                        <span className="px-1.5 py-0.5 bg-cyan-500 border border-cyan-400/40 text-cyan-300 text-[8px] font-black uppercase rounded-md animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.5)]">
                                                            ACTIVE NOW
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-[#0F172A] block">{session.email}</span>
                                                <span className="text-[9px] text-purple-400 block font-mono">ID: {session.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-white text-[#0F172A] rounded-lg text-[10px] font-bold uppercase border border-black/5 dark:bg-slate-800">
                                                {session.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <span className="text-cyan-300 font-bold block flex items-center gap-1">
                                                    <GlobeAmericasIcon className="w-3.5 h-3.5 text-cyan-400" />
                                                    {session.ipAddress}
                                                </span>
                                                <span className="text-[10px] text-[#0F172A] block">{session.location}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs truncate">
                                            <span className="text-[#0F172A] text-[10px] block truncate">{session.userAgent}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[#0F172A] text-[10px] block">{session.authMethod}</span>
                                            <span className="text-[9px] text-emerald-400 block font-bold">✓ MFA Verified</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {session.isCurrent ? (
                                                <span className="px-2.5 py-1 bg-emerald-500 text-emerald-400 border border-emerald-500/40 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 w-fit">
                                                    <CheckCircleIcon className="w-3 h-3" />
                                                    CURRENT (YOU)
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 bg-purple-500 text-purple-300 border border-purple-500/40 rounded-xl text-[9px] font-black uppercase tracking-wider w-fit block">
                                                    ACTIVE SESSION
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleForceTerminateSession(session)}
                                                disabled={session.isCurrent}
                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ml-auto cursor-pointer transition-all ${
                                                    session.isCurrent 
                                                        ? 'bg-white text-[#0F172A] cursor-not-allowed border border-black/5' 
                                                        : 'bg-rose-500 hover:bg-rose-500 text-rose-300 border border-rose-500/40 active:scale-95'
                                                }`}
                                            >
                                                <ArrowRightOnRectangleIcon className="w-3.5 h-3.5" />
                                                {session.isCurrent ? 'Protected' : 'Force Terminate'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FEATURE 4: Service Health Logs Collapsible Section */}
            <div className="bg-slate-50  border border-black/5 rounded-[2.5rem] p-6 shadow-2xl space-y-6 dark:bg-slate-900">
                
                {/* Collapsible Header */}
                <div 
                    onClick={() => setIsHealthLogsExpanded(!isHealthLogsExpanded)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-rose-500 border border-rose-500/30 rounded-xl text-rose-400 group-hover:scale-105 transition-transform">
                            <DocumentTextIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-black text-white uppercase tracking-wider font-mono">
                                    Service Health & Diagnostic Logs
                                </h3>
                                <span className="px-2.5 py-0.5 bg-rose-500 border border-rose-500/40 text-rose-300 rounded-full text-[10px] font-mono font-bold">
                                    {healthLogs.filter(l => l.level === 'CRITICAL' || l.level === 'ERROR').length} Issues Flagged
                                </span>
                            </div>
                            <p className="text-xs text-[#0F172A] font-mono mt-0.5">
                                Real-time exception & audit event log stream from backend infrastructure nodes.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-[#0F172A]">
                            {isHealthLogsExpanded ? 'Hide Logs' : 'Expand Logs'}
                        </span>
                        <ChevronDownIcon className={`w-5 h-5 text-[#0F172A] transition-transform duration-300 ${isHealthLogsExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </div>

                {/* Collapsible Body */}
                {isHealthLogsExpanded && (
                    <div className="space-y-4 pt-2 border-t border-black/5 animate-in fade-in duration-200">
                        
                        {/* Search & Severity Filter Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <SearchIcon className="w-4 h-4 text-[#0F172A] absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input 
                                        type="text"
                                        placeholder="Filter by error message or service..."
                                        value={healthLogSearch}
                                        onChange={(e) => setHealthLogSearch(e.target.value)}
                                        className="pl-9 pr-4 py-2 bg-slate-100 border border-white/15 rounded-xl text-xs text-[#1E293B] placeholder-slate-500 font-mono focus:outline-none focus:border-rose-400 w-64"
                                    />
                                </div>

                                {/* Severity Filter Tabs */}
                                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-black/5 font-mono text-[10px]">
                                    {[
                                        { id: 'ALL', label: 'All Logs' },
                                        { id: 'CRITICAL', label: 'Critical' },
                                        { id: 'ERROR', label: 'Errors' },
                                        { id: 'WARNING', label: 'Warnings' },
                                        { id: 'INFO', label: 'Info' }
                                    ].map(lvl => (
                                        <button
                                            key={lvl.id}
                                            onClick={() => setHealthLogLevelFilter(lvl.id as any)}
                                            className={`px-2.5 py-1 rounded-lg font-bold uppercase transition-all cursor-pointer ${
                                                healthLogLevelFilter === lvl.id
                                                    ? 'bg-rose-500 text-rose-300 border border-rose-500/40'
                                                    : 'text-[#0F172A] hover:text-white'
                                            }`}
                                        >
                                            {lvl.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setAutoRefreshLogs(!autoRefreshLogs)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase flex items-center gap-1.5 border transition-all cursor-pointer ${
                                        autoRefreshLogs 
                                            ? 'bg-emerald-500 text-emerald-300 border-emerald-500/40' 
                                            : 'bg-white text-[#0F172A] border-black/5'
                                    }`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${autoRefreshLogs ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                                    {autoRefreshLogs ? 'Live Syncing' : 'Paused'}
                                </button>

                                <button
                                    onClick={handleExportHealthLogs}
                                    className="px-3.5 py-1.5 bg-white hover:bg-slate-700 text-[#1E293B] border border-white/15 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer dark:bg-slate-800"
                                >
                                    <ArrowDownTrayIcon className="w-4 h-4" />
                                    Export Logs JSON
                                </button>
                            </div>
                        </div>

                        {/* Logs Terminal Box */}
                        <div className="bg-slate-100 border border-black/5 rounded-2xl p-4 max-h-96 overflow-y-auto font-mono text-xs space-y-2.5 custom-scrollbar">
                            {filteredHealthLogs.length === 0 ? (
                                <div className="p-6 text-center text-[#0F172A] italic">
                                    No health logs found matching search criteria.
                                </div>
                            ) : (
                                filteredHealthLogs.map((log) => {
                                    const isCritical = log.level === 'CRITICAL';
                                    const isError = log.level === 'ERROR';
                                    const isWarning = log.level === 'WARNING';

                                    return (
                                        <div 
                                            key={log.id} 
                                            className={`p-3.5 rounded-xl border transition-all ${
                                                isCritical 
                                                    ? 'bg-rose-950 border-rose-500 text-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse' 
                                                    : isError 
                                                        ? 'bg-rose-900 border-rose-500/40 text-rose-200' 
                                                        : isWarning 
                                                            ? 'bg-amber-900 border-amber-500/40 text-amber-200' 
                                                            : 'bg-slate-100 border-black/5 text-[#0F172A]'
                                            }`}
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-2 mb-2 text-[10px]">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                                                        isCritical 
                                                            ? 'bg-rose-500 text-slate-950' 
                                                            : isError 
                                                                ? 'bg-rose-500 text-rose-300 border border-rose-400/40' 
                                                                : isWarning 
                                                                    ? 'bg-amber-500 text-amber-300 border border-amber-400/40' 
                                                                    : 'bg-cyan-500 text-cyan-300 border border-cyan-400/40'
                                                    }`}>
                                                        {log.level}
                                                    </span>
                                                    <span className="font-bold text-white">{log.serviceName}</span>
                                                    {log.errorCode && (
                                                        <span className="text-[#0F172A]">[{log.errorCode}]</span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3 text-[#0F172A]">
                                                    <span>Node: {log.sourceNode}</span>
                                                    <span>{log.timestamp}</span>
                                                </div>
                                            </div>

                                            <p className="text-xs leading-relaxed font-mono">
                                                {log.message}
                                            </p>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                    </div>
                )}

            </div>

            {/* Session Hygiene Summary Report Modal */}
            {showSessionHygieneModal && lastHygieneReport && (
                <div className="fixed inset-0 z-50 bg-slate-100  flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-50 border border-emerald-500/40 rounded-[2.5rem] p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 relative overflow-hidden font-mono dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-black/5 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-emerald-500 border border-emerald-500/40 rounded-2xl text-emerald-400">
                                    <SparklesIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-wider">
                                        Session Hygiene Clean-Up Report
                                    </h3>
                                    <span className="text-xs text-emerald-400 block mt-0.5">
                                        Executed at {lastHygieneReport.timestamp} (Idle Threshold: 4.0 Hours)
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSessionHygieneModal(false)}
                                className="p-2 text-[#0F172A] hover:text-white bg-white rounded-xl transition-colors cursor-pointer dark:bg-slate-800"
                            >
                                <XCircleIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-emerald-950 border border-emerald-500/30 p-4 rounded-2xl text-xs space-y-2">
                            <div className="flex justify-between items-center text-[#1E293B] font-bold">
                                <span>Pruned Idle Sessions Count:</span>
                                <span className="text-emerald-400 text-sm font-black">{lastHygieneReport.prunedCount} Session(s)</span>
                            </div>
                            <p className="text-[#0F172A] text-[11px] leading-relaxed">
                                Automated compliance audit revoked access tokens and terminated active websocket connections for all administrative accounts exceeding 4 hours of continuous inactivity.
                            </p>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">
                                Terminated Inactive Session Tokens
                            </h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {lastHygieneReport.prunedSessions.map(session => (
                                    <div key={session.id} className="bg-slate-100 border border-black/5 p-3 rounded-xl flex items-center justify-between text-xs">
                                        <div>
                                            <span className="text-white font-bold block">{session.principalName}</span>
                                            <span className="text-[10px] text-[#0F172A] block">{session.email} • {session.ipAddress}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-amber-400 block font-bold">Idle: {session.lastActive}</span>
                                            <span className="text-[9px] text-[#0F172A] block">ID: {session.id}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => setShowSessionHygieneModal(false)}
                            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
                        >
                            Acknowledge & Close Report
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};
