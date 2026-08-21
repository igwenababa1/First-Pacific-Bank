import React, { useState, useMemo, useEffect } from 'react';
import { 
    Activity, 
    AlertTriangle, 
    CheckCircle, 
    XCircle, 
    RefreshCw, 
    Search, 
    Filter, 
    ArrowRight, 
    ShieldAlert, 
    Eye, 
    Copy, 
    Check, 
    Play, 
    Trash2, 
    Sliders, 
    Sparkles, 
    Clock, 
    Building2, 
    CreditCard, 
    Send, 
    FileText, 
    CheckCheck, 
    AlertCircle, 
    Database, 
    Zap, 
    Lock, 
    ArrowUpRight, 
    Info, 
    ChevronDown, 
    ChevronUp,
    ExternalLink,
    X,
    Cpu,
    Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, TransactionStatus, UserProfile } from '../types';
import { db } from '../services/database';

export interface WebhookLogEntry {
    id: string;
    timestamp: string;
    gateway: string;
    eventType: string;
    payload: any;
    status: 'failed' | 'halted' | 'processed' | 'reconciled' | 'reconciled_failed' | 'reconciled_hold' | string;
    message: string;
    isSimulated?: boolean;
    isReplayed?: boolean;
    replayedFrom?: string;
    reconciliation?: {
        reconciledAt: string;
        reconciledBy: string;
        action: string;
        newStatus: string;
        reason: string;
        referenceCode: string;
        notes?: string;
        previousStatus?: string;
    };
}

interface AdminWebhookReconciliationProps {
    webhookLogs: WebhookLogEntry[];
    allTransactions: Transaction[];
    onUpdateTransaction: (txId: string, updates: Partial<Transaction>) => Promise<void>;
    onRefreshWebhooks?: () => Promise<void>;
    addToast?: ((type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void) | ((toast: { title: string; message: string; type: 'success' | 'warning' | 'danger' | 'info' }) => void);
    currentAdminEmail?: string;
    onSetWebhookLogs?: React.Dispatch<React.SetStateAction<WebhookLogEntry[]>>;
}

export const AdminWebhookReconciliation: React.FC<AdminWebhookReconciliationProps> = ({
    webhookLogs,
    allTransactions,
    onUpdateTransaction,
    onRefreshWebhooks,
    addToast,
    currentAdminEmail = 'super_admin@firstpaba.com',
    onSetWebhookLogs
}) => {
    // Helper to dispatch toast in either signature
    const triggerToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
        if (!addToast) return;
        if (typeof addToast === 'function') {
            try {
                if (addToast.length >= 3) {
                    (addToast as any)(type, title, message);
                } else {
                    (addToast as any)({ title, message, type: type === 'error' ? 'danger' : type });
                }
            } catch {
                try {
                    (addToast as any)(type, title, message);
                } catch {
                    (addToast as any)({ title, message, type: type === 'error' ? 'danger' : type });
                }
            }
        }
    };
    // Local Filter & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'FAILED_ONLY' | 'HALTED_ONLY' | 'RECONCILED' | 'PROCESSED'>('FAILED_ONLY');
    const [gatewayFilter, setGatewayFilter] = useState<string>('ALL');
    const [selectedLog, setSelectedLog] = useState<WebhookLogEntry | null>(null);
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);
    
    // Reconciliation Drawer / Modal State
    const [reconcileModalLog, setReconcileModalLog] = useState<WebhookLogEntry | null>(null);
    const [reconcileAction, setReconcileAction] = useState<'APPROVE_COMPLETE' | 'REJECT_REFUND' | 'HOLD_INVESTIGATION' | 'MANUAL_OVERRIDE'>('APPROVE_COMPLETE');
    const [reconcileReason, setReconcileReason] = useState('Verified proof of external bank clearance slip');
    const [customReasonText, setCustomReasonText] = useState('');
    const [reconcileNotes, setReconcileNotes] = useState('');
    const [matchedTxId, setMatchedTxId] = useState('');
    const [targetUserEmail, setTargetUserEmail] = useState('');
    const [overrideStatus, setOverrideStatus] = useState<TransactionStatus>(TransactionStatus.COMPLETED);
    const [notifyUserCheckbox, setNotifyUserCheckbox] = useState(true);
    const [isReconciling, setIsReconciling] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Simulation Modal State
    const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
    const [simGateway, setSimGateway] = useState('Stripe Payment Gateway');
    const [simEventType, setSimEventType] = useState('payment_intent.payment_failed');
    const [simEmail, setSimEmail] = useState('info@lawrenceconsultantsorg.org');
    const [simAmount, setSimAmount] = useState('12500');
    const [simErrorCode, setSimErrorCode] = useState('insufficient_funds');
    const [simIsLoading, setSimIsLoading] = useState(false);

    // Auto-refresh pulse animation state
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Copy to clipboard helper
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        triggerToast('info', 'Copied to Clipboard', `Copied: ${text.slice(0, 32)}...`);
    };

    // Calculate metrics
    const metrics = useMemo(() => {
        const total = webhookLogs.length;
        const failed = webhookLogs.filter(w => w.status === 'failed').length;
        const halted = webhookLogs.filter(w => w.status === 'halted').length;
        const reconciled = webhookLogs.filter(w => w.status?.startsWith('reconciled')).length;
        const processed = webhookLogs.filter(w => w.status === 'processed').length;
        return { total, failed, halted, reconciled, processed };
    }, [webhookLogs]);

    // Available gateways list
    const gatewaysList = useMemo(() => {
        const unique = Array.from(new Set(webhookLogs.map(w => w.gateway).filter(Boolean)));
        return ['ALL', ...unique];
    }, [webhookLogs]);

    // Map webhook to matching transactions in system ledger
    const findMatchedTransaction = (log: WebhookLogEntry): Transaction | undefined => {
        if (!log) return undefined;
        const payload = log.payload || {};
        
        // 1. Direct ID match
        const searchIds = [
            payload.txId,
            payload.id,
            payload.metadata?.orderId,
            payload.metadata?.reference,
            log.id
        ].filter(Boolean);

        for (const id of searchIds) {
            const found = allTransactions.find(t => 
                t.id === id || 
                t.referenceNumber === id || 
                t.description?.includes(id)
            );
            if (found) return found;
        }

        // 2. Email + approximate amount match
        const email = payload.customer_email || payload.userEmail;
        const amt = payload.amount || (payload.amount_total ? payload.amount_total / 100 : undefined) || payload.amount_disputed;
        
        if (email && amt) {
            const numAmt = Number(amt);
            const found = allTransactions.find(t => {
                const txAmt = t.sendAmount || t.receiveAmount || 0;
                return (
                    (t.recipientEmail === email || t.accountId?.toLowerCase().includes(email.toLowerCase())) &&
                    Math.abs(txAmt - numAmt) < 0.01
                );
            });
            if (found) return found;
        }

        return undefined;
    };

    // Filtered logs
    const filteredLogs = useMemo(() => {
        return webhookLogs.filter(log => {
            // Status filter
            if (statusFilter === 'FAILED_ONLY' && log.status !== 'failed') return false;
            if (statusFilter === 'HALTED_ONLY' && log.status !== 'halted') return false;
            if (statusFilter === 'RECONCILED' && !log.status?.startsWith('reconciled')) return false;
            if (statusFilter === 'PROCESSED' && log.status !== 'processed') return false;

            // Gateway filter
            if (gatewayFilter !== 'ALL' && log.gateway !== gatewayFilter) return false;

            // Search filter
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase().trim();
                const matchedTx = findMatchedTransaction(log);
                const str = JSON.stringify({
                    id: log.id,
                    gateway: log.gateway,
                    eventType: log.eventType,
                    message: log.message,
                    payload: log.payload,
                    status: log.status,
                    reconciliation: log.reconciliation,
                    matchedTxId: matchedTx?.id,
                    matchedTxDesc: matchedTx?.description
                }).toLowerCase();
                if (!str.includes(term)) return false;
            }

            return true;
        });
    }, [webhookLogs, statusFilter, gatewayFilter, searchTerm, allTransactions]);

    // Open reconciliation modal with pre-populated data
    const handleOpenReconcile = (log: WebhookLogEntry) => {
        setReconcileModalLog(log);
        const payload = log.payload || {};
        const email = payload.customer_email || payload.userEmail || '';
        setTargetUserEmail(email);

        const matched = findMatchedTransaction(log);
        if (matched) {
            setMatchedTxId(matched.id);
        } else if (payload.txId) {
            setMatchedTxId(payload.txId);
        } else {
            setMatchedTxId(payload.id || '');
        }

        // Set sensible defaults based on failure type
        if (log.eventType?.includes('failed') || log.status === 'failed') {
            setReconcileAction('APPROVE_COMPLETE');
            setOverrideStatus(TransactionStatus.COMPLETED);
            setReconcileReason('Verified proof of external bank clearance slip');
        } else if (log.eventType?.includes('halt') || log.status === 'halted') {
            setReconcileAction('APPROVE_COMPLETE');
            setOverrideStatus(TransactionStatus.COMPLETED);
            setReconcileReason('Compliance officer reviewed and cleared AML false positive');
        } else {
            setReconcileAction('APPROVE_COMPLETE');
            setOverrideStatus(TransactionStatus.COMPLETED);
            setReconcileReason('Manual ledger reconciliation completed');
        }
        setCustomReasonText('');
        setReconcileNotes('');
    };

    // Execute reconciliation action
    const handleExecuteReconciliation = async () => {
        if (!reconcileModalLog) return;
        setIsReconciling(true);

        try {
            const finalReason = customReasonText.trim() || reconcileReason;
            const refCode = `REC-${Date.now().toString().slice(-6)}-ADM`;
            
            let targetStatus: TransactionStatus = TransactionStatus.COMPLETED;
            if (reconcileAction === 'APPROVE_COMPLETE') {
                targetStatus = TransactionStatus.COMPLETED;
            } else if (reconcileAction === 'REJECT_REFUND') {
                targetStatus = TransactionStatus.FAILED;
            } else if (reconcileAction === 'HOLD_INVESTIGATION') {
                targetStatus = TransactionStatus.PAUSED_ON_HOLD;
            } else {
                targetStatus = overrideStatus;
            }

            // 1. If there is an associated transaction in the database, update its status directly!
            if (matchedTxId) {
                const existingTx = allTransactions.find(t => t.id === matchedTxId);
                if (existingTx) {
                    await onUpdateTransaction(matchedTxId, {
                        status: targetStatus,
                        description: `${existingTx.description} [Manual Reconciliation: ${refCode}]`
                    });
                } else {
                    // Also attempt direct DB update
                    try {
                        await db.updateTransactionStatus(matchedTxId, targetStatus);
                    } catch (e) {
                        console.warn('[Reconciliation] Direct DB transaction update warning:', e);
                    }
                }
            }

            // 2. Call backend reconciliation endpoint
            const res = await fetch('/api/admin/webhook-events/reconcile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    webhookId: reconcileModalLog.id,
                    action: reconcileAction,
                    newStatus: targetStatus,
                    reason: finalReason,
                    referenceCode: refCode,
                    adminEmail: currentAdminEmail,
                    notes: reconcileNotes,
                    txId: matchedTxId,
                    targetUserEmail: targetUserEmail,
                    notifyUser: notifyUserCheckbox
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Server rejected reconciliation request');
            }

            const data = await res.json();
            
            // 3. Log audit action in system
            await db.logAuditAction(
                currentAdminEmail,
                'Webhook Status Reconciled',
                `Reconciled webhook ${reconcileModalLog.id} for ${targetUserEmail || 'N/A'}. Action: ${reconcileAction}. Status: ${targetStatus}. Ref: ${refCode}. Reason: ${finalReason}`
            );

            // 4. Update local state
            if (onSetWebhookLogs && data.log) {
                onSetWebhookLogs(prev => prev.map(w => w.id === reconcileModalLog.id ? data.log : w));
            }

            if (onRefreshWebhooks) {
                await onRefreshWebhooks();
            }

            triggerToast(
                'success',
                'Reconciliation Successful',
                `Webhook ${reconcileModalLog.id} status reconciled to ${targetStatus} (Ref: ${refCode}).`
            );

            setReconcileModalLog(null);
        } catch (err: any) {
            console.error('[Reconciliation Error]', err);
            triggerToast(
                'error',
                'Reconciliation Failed',
                err.message || 'Could not reconcile status.'
            );
        } finally {
            setIsReconciling(false);
        }
    };

    // Replay webhook event
    const handleReplayWebhook = async (webhookId: string) => {
        try {
            const res = await fetch('/api/admin/webhook-events/replay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ webhookId })
            });
            if (res.ok) {
                const data = await res.json();
                if (onSetWebhookLogs && data.log) {
                    onSetWebhookLogs(prev => [data.log, ...prev]);
                }
                triggerToast(
                    'info',
                    'Webhook Replayed',
                    `Event re-dispatched to gateway listener with ID ${data.log.id}.`
                );
            }
        } catch (e: any) {
            triggerToast(
                'error',
                'Replay Failed',
                e.message || 'Failed to replay webhook event.'
            );
        }
    };

    // Delete single webhook log
    const handleDeleteWebhook = async (webhookId: string) => {
        try {
            const res = await fetch('/api/admin/webhook-events/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ webhookId })
            });
            if (res.ok) {
                if (onSetWebhookLogs) {
                    onSetWebhookLogs(prev => prev.filter(w => w.id !== webhookId));
                }
                triggerToast(
                    'info',
                    'Webhook Deleted',
                    `Event ${webhookId} removed from logging queue.`
                );
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Manual Refresh
    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        if (onRefreshWebhooks) {
            await onRefreshWebhooks();
        }
        setTimeout(() => setIsRefreshing(false), 600);
    };

    // Run Simulator Event
    const handleTriggerSimulatedWebhook = async () => {
        setSimIsLoading(true);
        try {
            let payload: any = {
                id: `sim_evt_${Date.now()}`,
                customer_email: simEmail,
                amount: Number(simAmount),
                timestamp: new Date().toISOString()
            };

            if (simEventType === 'payment_intent.payment_failed') {
                payload = {
                    id: `pi_failed_${Date.now()}`,
                    txId: `tx_sim_${Date.now().toString().slice(-4)}`,
                    customer_email: simEmail,
                    amount_total: Number(simAmount) * 100,
                    currency: 'usd',
                    error: {
                        code: simErrorCode,
                        decline_code: simErrorCode,
                        message: simErrorCode === 'insufficient_funds' 
                            ? 'The card issuer declined the transaction due to insufficient available funds.'
                            : simErrorCode === 'card_velocity_exceeded'
                            ? 'Transaction rejected due to exceeding 24H payment frequency limit.'
                            : 'Gateway authentication signature timeout during 3D Secure verification.'
                    }
                };
            } else if (simEventType === 'wire.settlement_timeout') {
                payload = {
                    id: `wire_timeout_${Date.now()}`,
                    txId: `tx_wire_${Date.now().toString().slice(-4)}`,
                    customer_email: simEmail,
                    amount: Number(simAmount),
                    senderBank: 'First Pacific International',
                    recipientBank: 'JPMorgan Chase (ABA 021000021)',
                    errorCode: 'FED_SETTLEMENT_TIMEOUT',
                    errorDetails: 'Interbank correspondent gateway ACK timed out after 120s.'
                };
            } else if (simEventType === 'compliance.halt_triggered') {
                payload = {
                    id: `aml_halt_${Date.now()}`,
                    txId: `tx_halt_${Date.now().toString().slice(-4)}`,
                    userEmail: simEmail,
                    amount: Number(simAmount),
                    ruleId: 'RULE-AML-HIGH-VELOCITY',
                    severity: 'CRITICAL',
                    action: 'ACCOUNT_TEMP_HOLD'
                };
            } else if (simEventType === 'ach.return_received') {
                payload = {
                    id: `ach_ret_${Date.now()}`,
                    txId: `tx_ach_${Date.now().toString().slice(-4)}`,
                    customer_email: simEmail,
                    amount: Number(simAmount),
                    returnCode: 'R01',
                    returnReason: 'Insufficient Funds in originating depository account'
                };
            }

            const res = await fetch('/api/admin/webhook-events/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gateway: simGateway,
                    eventType: simEventType,
                    payload
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (onSetWebhookLogs) {
                    onSetWebhookLogs(prev => [data, ...prev]);
                }
                triggerToast(
                    'warning',
                    'Simulated Webhook Ingested',
                    `Event ${simEventType} generated and pushed to live monitor.`
                );
                setIsSimulatorOpen(false);
            }
        } catch (e: any) {
            triggerToast(
                'error',
                'Simulation Error',
                e.message || 'Failed to simulate webhook event.'
            );
        } finally {
            setSimIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-12">
            {/* 1. Header Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="p-2.5 bg-rose-500 border border-rose-500/20 rounded-xl text-rose-400">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                                Webhook & Failed Transaction Reconciliation Center
                            </h2>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold">
                                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                                <span>Live Ingestion Active</span>
                            </div>
                        </div>
                        <p className="text-sm text-[#0F172A] max-w-3xl">
                            Monitor external payment gateway dropouts, investigate incoming webhook payload failures, and execute direct status reconciliation on stuck or failed transactions without requiring raw database manipulation.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            id="btn-simulate-webhook"
                            onClick={() => setIsSimulatorOpen(true)}
                            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-amber-500/20 flex items-center gap-2"
                        >
                            <Zap className="w-4 h-4" />
                            <span>Simulate Gateway Failure</span>
                        </button>

                        <button
                            id="btn-refresh-webhooks"
                            onClick={handleManualRefresh}
                            disabled={isRefreshing}
                            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
                            <span>Refresh Stream</span>
                        </button>
                    </div>
                </div>

                {/* 2. Executive Key Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6 pt-6 border-t border-slate-800/80">
                    <div 
                        onClick={() => setStatusFilter('ALL')}
                        className={`p-4 rounded-xl border transition cursor-pointer ${
                            statusFilter === 'ALL' 
                                ? 'bg-slate-800 border-cyan-500/40 ring-1 ring-cyan-500/30' 
                                : 'bg-slate-950 border-slate-800 hover:bg-slate-800'
                        }`}
                    >
                        <div className="flex items-center justify-between text-[#0F172A] mb-1">
                            <span className="text-xs font-bold">Total Webhook Logs</span>
                            <Activity className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="text-2xl font-black text-white">{metrics.total}</div>
                        <div className="text-[11px] text-[#0F172A] mt-1">All gateway events</div>
                    </div>

                    <div 
                        onClick={() => setStatusFilter('FAILED_ONLY')}
                        className={`p-4 rounded-xl border transition cursor-pointer ${
                            statusFilter === 'FAILED_ONLY' 
                                ? 'bg-rose-950 border-rose-500/50 ring-1 ring-rose-500/30' 
                                : 'bg-slate-950 border-slate-800 hover:bg-slate-800'
                        }`}
                    >
                        <div className="flex items-center justify-between text-rose-400 mb-1">
                            <span className="text-xs font-bold flex items-center gap-1.5">
                                <span>Failed Transactions</span>
                                {metrics.failed > 0 && (
                                    <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px]">
                                        {metrics.failed}
                                    </span>
                                )}
                            </span>
                            <XCircle className="w-4 h-4 text-rose-400" />
                        </div>
                        <div className="text-2xl font-black text-rose-300">{metrics.failed}</div>
                        <div className="text-[11px] text-rose-400/80 mt-1">Action required</div>
                    </div>

                    <div 
                        onClick={() => setStatusFilter('HALTED_ONLY')}
                        className={`p-4 rounded-xl border transition cursor-pointer ${
                            statusFilter === 'HALTED_ONLY' 
                                ? 'bg-amber-950 border-amber-500/50 ring-1 ring-amber-500/30' 
                                : 'bg-slate-950 border-slate-800 hover:bg-slate-800'
                        }`}
                    >
                        <div className="flex items-center justify-between text-amber-400 mb-1">
                            <span className="text-xs font-bold">Halted / AML Holds</span>
                            <ShieldAlert className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="text-2xl font-black text-amber-300">{metrics.halted}</div>
                        <div className="text-[11px] text-amber-400/80 mt-1">Velocity & Risk Alerts</div>
                    </div>

                    <div 
                        onClick={() => setStatusFilter('RECONCILED')}
                        className={`p-4 rounded-xl border transition cursor-pointer ${
                            statusFilter === 'RECONCILED' 
                                ? 'bg-emerald-950 border-emerald-500/50 ring-1 ring-emerald-500/30' 
                                : 'bg-slate-950 border-slate-800 hover:bg-slate-800'
                        }`}
                    >
                        <div className="flex items-center justify-between text-emerald-400 mb-1">
                            <span className="text-xs font-bold">Manually Reconciled</span>
                            <CheckCheck className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="text-2xl font-black text-emerald-300">{metrics.reconciled}</div>
                        <div className="text-[11px] text-emerald-400/80 mt-1">Settled by Admin</div>
                    </div>

                    <div 
                        onClick={() => setStatusFilter('PROCESSED')}
                        className={`p-4 rounded-xl border transition cursor-pointer col-span-2 sm:col-span-1 ${
                            statusFilter === 'PROCESSED' 
                                ? 'bg-blue-950 border-blue-500/50 ring-1 ring-blue-500/30' 
                                : 'bg-slate-950 border-slate-800 hover:bg-slate-800'
                        }`}
                    >
                        <div className="flex items-center justify-between text-blue-400 mb-1">
                            <span className="text-xs font-bold">Processed</span>
                            <CheckCircle className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="text-2xl font-black text-blue-300">{metrics.processed}</div>
                        <div className="text-[11px] text-[#0F172A] mt-1">Standard settlements</div>
                    </div>
                </div>
            </div>

            {/* 3. Search & Multi-Filter Control Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Search input */}
                <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0F172A]" />
                    <input
                        id="input-webhook-search"
                        type="text"
                        placeholder="Search txId, webhookId, customer email, decline code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-8 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0F172A] hover:text-white"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Filter pills & Gateway dropdown */}
                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                        <button
                            onClick={() => setStatusFilter('ALL')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition ${
                                statusFilter === 'ALL' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-[#0F172A] hover:text-white'
                            }`}
                        >
                            All ({metrics.total})
                        </button>
                        <button
                            onClick={() => setStatusFilter('FAILED_ONLY')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                                statusFilter === 'FAILED_ONLY' ? 'bg-rose-500 text-white font-bold' : 'text-rose-400 hover:text-rose-300'
                            }`}
                        >
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Failed ({metrics.failed})</span>
                        </button>
                        <button
                            onClick={() => setStatusFilter('HALTED_ONLY')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition ${
                                statusFilter === 'HALTED_ONLY' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-amber-400 hover:text-amber-300'
                            }`}
                        >
                            Halted ({metrics.halted})
                        </button>
                        <button
                            onClick={() => setStatusFilter('RECONCILED')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition ${
                                statusFilter === 'RECONCILED' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-emerald-400 hover:text-emerald-300'
                            }`}
                        >
                            Reconciled ({metrics.reconciled})
                        </button>
                    </div>

                    {/* Gateway filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-3.5 h-3.5 text-[#0F172A]" />
                        <select
                            id="select-gateway-filter"
                            value={gatewayFilter}
                            onChange={(e) => setGatewayFilter(e.target.value)}
                            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
                        >
                            <option value="ALL">All Gateways</option>
                            {gatewaysList.filter(g => g !== 'ALL').map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* 4. Webhook Logs List */}
            <div className="space-y-4">
                {filteredLogs.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-[#0F172A]">
                            <Activity className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-white">No Webhook Logs Match Filters</h3>
                            <p className="text-xs text-[#0F172A] max-w-md mx-auto">
                                No incoming webhook events found matching the selected status or search term. Try resetting your search filter or trigger a simulated failure.
                            </p>
                        </div>
                        <button
                            onClick={() => { setStatusFilter('ALL'); setSearchTerm(''); setGatewayFilter('ALL'); }}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-semibold transition"
                        >
                            Reset All Filters
                        </button>
                    </div>
                ) : (
                    filteredLogs.map((log) => {
                        const isFailed = log.status === 'failed';
                        const isHalted = log.status === 'halted';
                        const isReconciled = log.status?.startsWith('reconciled');
                        const matchedTx = findMatchedTransaction(log);
                        const payload = log.payload || {};
                        const userEmail = payload.customer_email || payload.userEmail || 'Unspecified User';
                        const errorReason = payload.error?.message || payload.errorDetails || payload.flagReason || payload.returnReason || log.message;
                        const errorCode = payload.error?.decline_code || payload.error?.code || payload.errorCode || payload.returnCode || (isHalted ? 'AML_HOLD' : 'DECLINED');
                        const rawAmount = payload.amount || (payload.amount_total ? payload.amount_total / 100 : undefined) || payload.amount_disputed;

                        return (
                            <motion.div
                                key={log.id}
                                layout
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className={`bg-slate-900 border rounded-2xl p-5 shadow-lg transition duration-200 relative overflow-hidden ${
                                    isFailed 
                                        ? 'border-rose-500/30 hover:border-rose-500/50 bg-gradient-to-r from-rose-950/10 via-slate-900 to-slate-900' 
                                        : isHalted 
                                        ? 'border-amber-500/30 hover:border-amber-500/50 bg-gradient-to-r from-amber-950/10 via-slate-900 to-slate-900' 
                                        : isReconciled 
                                        ? 'border-emerald-500/30 hover:border-emerald-500/50 bg-gradient-to-r from-emerald-950/10 via-slate-900 to-slate-900' 
                                        : 'border-slate-800 hover:border-slate-700'
                                }`}
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    {/* Left summary info */}
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            {/* Status Badge */}
                                            {isFailed && (
                                                <span className="px-2.5 py-1 bg-rose-500 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 tracking-wider">
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    <span>Transaction Failed</span>
                                                </span>
                                            )}
                                            {isHalted && (
                                                <span className="px-2.5 py-1 bg-amber-500 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 tracking-wider">
                                                    <ShieldAlert className="w-3.5 h-3.5" />
                                                    <span>Compliance Halt</span>
                                                </span>
                                            )}
                                            {isReconciled && (
                                                <span className="px-2.5 py-1 bg-emerald-500 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 tracking-wider">
                                                    <CheckCheck className="w-3.5 h-3.5" />
                                                    <span>Reconciled ({log.reconciliation?.newStatus || 'Resolved'})</span>
                                                </span>
                                            )}
                                            {!isFailed && !isHalted && !isReconciled && (
                                                <span className="px-2.5 py-1 bg-blue-500 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold uppercase tracking-wider">
                                                    Processed
                                                </span>
                                            )}

                                            {/* Gateway & Event Type */}
                                            <span className="px-2.5 py-1 bg-slate-800 text-[#334155] rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700">
                                                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                                                <span>{log.gateway}</span>
                                            </span>

                                            <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-1 rounded border border-cyan-800/40">
                                                {log.eventType}
                                            </span>

                                            {/* Event ID with copy */}
                                            <button
                                                onClick={() => handleCopy(log.id, `id_${log.id}`)}
                                                className="text-xs font-mono text-[#0F172A] hover:text-white flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800"
                                                title="Click to copy ID"
                                            >
                                                <span>{log.id}</span>
                                                {copiedId === `id_${log.id}` ? (
                                                    <Check className="w-3 h-3 text-emerald-400" />
                                                ) : (
                                                    <Copy className="w-3 h-3 text-[#0F172A]" />
                                                )}
                                            </button>

                                            {/* Timestamp */}
                                            <span className="text-xs text-[#0F172A] flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-[#0F172A]" />
                                                <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                                <span className="text-[#0F172A]">({new Date(log.timestamp).toLocaleDateString()})</span>
                                            </span>
                                        </div>

                                        {/* Main message / error */}
                                        <div className="space-y-1.5">
                                            <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                                                {isFailed && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
                                                {isHalted && <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />}
                                                <span>{log.message}</span>
                                            </div>

                                            {/* Error diagnostic box if failure */}
                                            {(isFailed || isHalted) && (
                                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1.5">
                                                    <div className="flex items-center justify-between text-[#0F172A] flex-wrap gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[#0F172A]">Decline / Halt Code:</span>
                                                            <span className="font-mono font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-900/50">
                                                                {errorCode}
                                                            </span>
                                                        </div>
                                                        {rawAmount && (
                                                            <div className="flex items-center gap-1.5 text-white font-bold">
                                                                <span className="text-[#0F172A] text-[11px]">Amount Involved:</span>
                                                                <span className="text-sm font-black text-amber-400">${Number(rawAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
                                                            </div>
                                                        )}
                                                        <div className="text-[#334155]">
                                                            <span className="text-[#0F172A]">Entity:</span> <span className="font-semibold text-cyan-400">{userEmail}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-[#334155] font-mono text-[11px] leading-relaxed">
                                                        {errorReason}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Reconciliation banner if already reconciled */}
                                            {isReconciled && log.reconciliation && (
                                                <div className="p-3 bg-emerald-950 border border-emerald-500/30 rounded-xl text-xs space-y-1">
                                                    <div className="flex items-center justify-between text-emerald-400 font-bold flex-wrap gap-2">
                                                        <span className="flex items-center gap-1.5">
                                                            <CheckCheck className="w-4 h-4 text-emerald-400" />
                                                            <span>Reconciled by {log.reconciliation.reconciledBy}</span>
                                                        </span>
                                                        <span className="font-mono text-emerald-300">Ref: {log.reconciliation.referenceCode}</span>
                                                        <span className="text-[#0F172A] text-[11px]">
                                                            {new Date(log.reconciliation.reconciledAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="text-[#334155]">
                                                        <span className="text-[#0F172A]">Action:</span> <strong className="text-white">{log.reconciliation.action}</strong> → Status: <strong className="text-emerald-400">{log.reconciliation.newStatus}</strong>
                                                    </div>
                                                    {log.reconciliation.reason && (
                                                        <div className="text-[#0F172A] text-[11px]">
                                                            <span className="text-[#0F172A]">Justification:</span> {log.reconciliation.reason}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Matched system transaction indicator */}
                                            {matchedTx ? (
                                                <div className="flex items-center gap-3 text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                                                    <Database className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                                    <div className="flex-1 flex items-center justify-between flex-wrap gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[#0F172A]">Linked System Tx:</span>
                                                            <span className="font-mono text-white font-semibold">{matchedTx.id}</span>
                                                            <span className="text-[#0F172A]">|</span>
                                                            <span className="text-[#334155]">${(matchedTx.sendAmount || matchedTx.receiveAmount || 0).toLocaleString()} USD</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[#0F172A]">Current Ledger Status:</span>
                                                            <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                                                                matchedTx.status === TransactionStatus.COMPLETED 
                                                                    ? 'bg-emerald-500 text-emerald-400' 
                                                                    : matchedTx.status === TransactionStatus.FAILED 
                                                                    ? 'bg-rose-500 text-rose-400' 
                                                                    : matchedTx.status === TransactionStatus.PAUSED_ON_HOLD
                                                                    ? 'bg-amber-500 text-amber-400'
                                                                    : 'bg-cyan-500 text-cyan-400'
                                                            }`}>
                                                                {matchedTx.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-[11px] text-[#0F172A] italic">
                                                    <Info className="w-3 h-3 text-[#0F172A]" />
                                                    <span>No direct un-reconciled transaction record mapped yet; manual override or auto-mapping available in reconciliation console.</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Action buttons */}
                                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-end gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                                        {/* Main Reconcile Button */}
                                        <button
                                            id={`btn-reconcile-${log.id}`}
                                            onClick={() => handleOpenReconcile(log)}
                                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-2 w-full sm:w-auto justify-center ${
                                                isFailed || isHalted
                                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                                                    : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700'
                                            }`}
                                        >
                                            <Sliders className="w-4 h-4" />
                                            <span>{isReconciled ? 'Re-Reconcile' : 'Reconcile Status'}</span>
                                        </button>

                                        {/* Inspect JSON */}
                                        <button
                                            id={`btn-inspect-${log.id}`}
                                            onClick={() => { setSelectedLog(log); setIsInspectorOpen(true); }}
                                            className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-[#334155] border border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                                        >
                                            <Eye className="w-3.5 h-3.5 text-cyan-400" />
                                            <span>Inspect JSON</span>
                                        </button>

                                        {/* Replay Event */}
                                        <button
                                            id={`btn-replay-${log.id}`}
                                            onClick={() => handleReplayWebhook(log.id)}
                                            title="Re-dispatch webhook event"
                                            className="px-3 py-2 bg-slate-950 hover:bg-slate-800 text-[#0F172A] hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1"
                                        >
                                            <Play className="w-3.5 h-3.5 text-amber-400" />
                                            <span>Replay</span>
                                        </button>

                                        {/* Delete */}
                                        <button
                                            id={`btn-delete-${log.id}`}
                                            onClick={() => handleDeleteWebhook(log.id)}
                                            title="Remove log from queue"
                                            className="p-2 text-[#0F172A] hover:text-rose-400 hover:bg-rose-950 rounded-xl transition"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* 5. Direct Manual Status Reconciliation Modal */}
            <AnimatePresence>
                {reconcileModalLog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black ">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative p-6 space-y-6"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-cyan-500 border border-cyan-500/20 text-cyan-400 rounded-lg">
                                            <Sliders className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white">
                                            Manual Status Reconciliation Console
                                        </h3>
                                    </div>
                                    <p className="text-xs text-[#0F172A]">
                                        Resolve and synchronize transaction ledger state without raw database access.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setReconcileModalLog(null)}
                                    className="p-2 text-[#0F172A] hover:text-white rounded-lg hover:bg-slate-800 transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Event Summary Snapshot */}
                            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                                <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                                    <span className="text-[#0F172A]">Target Webhook ID:</span>
                                    <span className="font-mono text-cyan-400 font-bold">{reconcileModalLog.id}</span>
                                    <span className="text-[#0F172A]">|</span>
                                    <span className="text-[#0F172A]">Gateway:</span>
                                    <span className="font-semibold text-white">{reconcileModalLog.gateway}</span>
                                    <span className="text-[#0F172A]">|</span>
                                    <span className="text-[#0F172A]">Event:</span>
                                    <span className="font-mono text-amber-400">{reconcileModalLog.eventType}</span>
                                </div>
                                <div className="text-xs font-semibold text-[#334155] bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 font-mono">
                                    {reconcileModalLog.message}
                                </div>
                            </div>

                            {/* Reconciliation Action Selection */}
                            <div className="space-y-3">
                                <label className="block text-xs font-bold uppercase tracking-wider text-[#334155]">
                                    Select Reconciliation Settlement Action:
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setReconcileAction('APPROVE_COMPLETE');
                                            setOverrideStatus(TransactionStatus.COMPLETED);
                                            setReconcileReason('Verified proof of external bank clearance slip');
                                        }}
                                        className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between space-y-2 ${
                                            reconcileAction === 'APPROVE_COMPLETE'
                                                ? 'bg-emerald-950 border-emerald-500 ring-1 ring-emerald-500/50 text-white'
                                                : 'bg-slate-950 border-slate-800 hover:bg-slate-850 text-[#0F172A]'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                                <CheckCircle className="w-4 h-4" />
                                                <span>Force Settle & Complete</span>
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500 text-emerald-400 rounded">
                                                COMPLETED
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-[#0F172A] leading-snug">
                                            Clears funds, credits beneficiary ledger, and dispatches official completion confirmation.
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setReconcileAction('REJECT_REFUND');
                                            setOverrideStatus(TransactionStatus.FAILED);
                                            setReconcileReason('Transaction declined by issuer - debited principal auto-refunded');
                                        }}
                                        className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between space-y-2 ${
                                            reconcileAction === 'REJECT_REFUND'
                                                ? 'bg-rose-950 border-rose-500 ring-1 ring-rose-500/50 text-white'
                                                : 'bg-slate-950 border-slate-800 hover:bg-slate-850 text-[#0F172A]'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                                                <XCircle className="w-4 h-4" />
                                                <span>Confirm Decline & Refund</span>
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 bg-rose-500 text-rose-400 rounded">
                                                FAILED / REFUND
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-[#0F172A] leading-snug">
                                            Marks transfer as failed and restores any debited balance + processing fee to customer account.
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setReconcileAction('HOLD_INVESTIGATION');
                                            setOverrideStatus(TransactionStatus.PAUSED_ON_HOLD);
                                            setReconcileReason('Flagged for secondary AML documentation review');
                                        }}
                                        className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between space-y-2 ${
                                            reconcileAction === 'HOLD_INVESTIGATION'
                                                ? 'bg-amber-950 border-amber-500 ring-1 ring-amber-500/50 text-white'
                                                : 'bg-slate-950 border-slate-800 hover:bg-slate-850 text-[#0F172A]'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                                                <ShieldAlert className="w-4 h-4" />
                                                <span>Place on Compliance Hold</span>
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 bg-amber-500 text-amber-400 rounded">
                                                ON_HOLD
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-[#0F172A] leading-snug">
                                            Freezes transfer progression until user provides verified source of wealth / identity proof.
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setReconcileAction('MANUAL_OVERRIDE');
                                            setReconcileReason('Administrative manual status alignment');
                                        }}
                                        className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between space-y-2 ${
                                            reconcileAction === 'MANUAL_OVERRIDE'
                                                ? 'bg-cyan-950 border-cyan-500 ring-1 ring-cyan-500/50 text-white'
                                                : 'bg-slate-950 border-slate-800 hover:bg-slate-850 text-[#0F172A]'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                                                <Sliders className="w-4 h-4" />
                                                <span>Custom Status Override</span>
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 bg-cyan-500 text-cyan-400 rounded">
                                                CUSTOM
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-[#0F172A] leading-snug">
                                            Assign any arbitrary ledger status with custom settlement justification.
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {/* Transaction ID & Entity Target Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#334155] mb-1">
                                        Associated Transaction Reference ID:
                                    </label>
                                    <input
                                        type="text"
                                        value={matchedTxId}
                                        onChange={(e) => setMatchedTxId(e.target.value)}
                                        placeholder="e.g. tx_1049_stripe_declined"
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#334155] mb-1">
                                        Target Client / Entity Email:
                                    </label>
                                    <input
                                        type="email"
                                        value={targetUserEmail}
                                        onChange={(e) => setTargetUserEmail(e.target.value)}
                                        placeholder="customer@organization.com"
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                            </div>

                            {/* Custom Status dropdown if Manual Override */}
                            {reconcileAction === 'MANUAL_OVERRIDE' && (
                                <div>
                                    <label className="block text-xs font-semibold text-[#334155] mb-1">
                                        Select Target Transaction Status:
                                    </label>
                                    <select
                                        value={overrideStatus}
                                        onChange={(e) => setOverrideStatus(e.target.value as TransactionStatus)}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-cyan-400 focus:outline-none focus:border-cyan-500"
                                    >
                                        <option value={TransactionStatus.COMPLETED}>Completed</option>
                                        <option value={TransactionStatus.FAILED}>Failed</option>
                                        <option value={TransactionStatus.PAUSED_ON_HOLD}>Paused / On Hold</option>
                                        <option value={TransactionStatus.REFUNDED}>Refunded</option>
                                        <option value={TransactionStatus.PROCESSING}>Processing</option>
                                        <option value={TransactionStatus.CLEARANCE_GRANTED}>Clearance Granted</option>
                                        <option value={TransactionStatus.IN_TRANSIT}>Sent to Network</option>
                                    </select>
                                </div>
                            )}

                            {/* Reason & Justification */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-[#334155] mb-1">
                                        Reconciliation Reason / Justification:
                                    </label>
                                    <select
                                        value={reconcileReason}
                                        onChange={(e) => setReconcileReason(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 mb-2"
                                    >
                                        <option value="Verified proof of external bank clearance slip">Verified proof of external bank clearance slip</option>
                                        <option value="Compliance officer reviewed and cleared AML false positive">Compliance officer reviewed and cleared AML false positive</option>
                                        <option value="Card issuer offline fallback authorized by merchant">Card issuer offline fallback authorized by merchant</option>
                                        <option value="Interbank correspondent ACK verified via manual MT103">Interbank correspondent ACK verified via manual MT103</option>
                                        <option value="Transaction declined by issuer - debited principal auto-refunded">Transaction declined by issuer - debited principal auto-refunded</option>
                                        <option value="Customer requested cancellation / chargeback resolution">Customer requested cancellation / chargeback resolution</option>
                                        <option value="Custom justification">Custom justification (Enter below)</option>
                                    </select>

                                    {reconcileReason === 'Custom justification' && (
                                        <input
                                            type="text"
                                            value={customReasonText}
                                            onChange={(e) => setCustomReasonText(e.target.value)}
                                            placeholder="Specify custom resolution reason..."
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#334155] mb-1">
                                        Internal Compliance Audit Notes (Optional):
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={reconcileNotes}
                                        onChange={(e) => setReconcileNotes(e.target.value)}
                                        placeholder="Record additional audit rationale, ticket IDs, or officer remarks..."
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                                    />
                                </div>
                            </div>

                            {/* Real-time notification toggle */}
                            <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                                <input
                                    type="checkbox"
                                    id="checkbox-notify-user"
                                    checked={notifyUserCheckbox}
                                    onChange={(e) => setNotifyUserCheckbox(e.target.checked)}
                                    className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 bg-slate-900 border-slate-700"
                                />
                                <label htmlFor="checkbox-notify-user" className="text-xs font-semibold text-[#334155] cursor-pointer">
                                    <strong className="text-white">Dispatch Real-Time Notification & Email Receipt:</strong> Automatically inform client of status resolution via WebSocket and banking notification email.
                                </label>
                            </div>

                            {/* Modal Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setReconcileModalLog(null)}
                                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-[#334155] rounded-xl text-xs font-semibold transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    id="btn-confirm-reconciliation"
                                    type="button"
                                    onClick={handleExecuteReconciliation}
                                    disabled={isReconciling}
                                    className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-xl text-xs font-black transition shadow-lg shadow-cyan-500/20 flex items-center gap-2"
                                >
                                    {isReconciling ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>Synchronizing Ledger...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCheck className="w-4 h-4" />
                                            <span>Execute Reconciliation & Sync Ledger</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 6. Raw JSON & Diagnostics Inspector Modal */}
            <AnimatePresence>
                {isInspectorOpen && selectedLog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black ">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl"
                        >
                            {/* Inspector Header */}
                            <div className="flex items-center justify-between p-5 border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-800 rounded-lg text-cyan-400">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-white">Webhook Ingress Inspector</h3>
                                        <p className="text-xs font-mono text-[#0F172A]">ID: {selectedLog.id}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleCopy(JSON.stringify(selectedLog, null, 2), `inspect_${selectedLog.id}`)}
                                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                                    >
                                        {copiedId === `inspect_${selectedLog.id}` ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5" />
                                        )}
                                        <span>Copy JSON</span>
                                    </button>
                                    <button
                                        onClick={() => setIsInspectorOpen(false)}
                                        className="p-1.5 text-[#0F172A] hover:text-white rounded-lg hover:bg-slate-800 transition"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Inspector Body */}
                            <div className="p-5 overflow-y-auto flex-1 space-y-4">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                                        <div className="text-[11px] text-[#0F172A]">Gateway</div>
                                        <div className="text-xs font-bold text-white mt-0.5">{selectedLog.gateway}</div>
                                    </div>
                                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                                        <div className="text-[11px] text-[#0F172A]">Event Type</div>
                                        <div className="text-xs font-mono font-bold text-cyan-400 mt-0.5">{selectedLog.eventType}</div>
                                    </div>
                                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                                        <div className="text-[11px] text-[#0F172A]">Ingress Status</div>
                                        <div className="text-xs font-bold text-rose-400 mt-0.5 uppercase">{selectedLog.status}</div>
                                    </div>
                                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                                        <div className="text-[11px] text-[#0F172A]">Timestamp</div>
                                        <div className="text-xs font-mono text-[#334155] mt-0.5">
                                            {new Date(selectedLog.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                                        Raw Payload Data & Diagnostic Tree:
                                    </label>
                                    <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto max-h-96 leading-relaxed select-all">
                                        {JSON.stringify(selectedLog, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 7. Interactive Gateway Simulator Modal */}
            <AnimatePresence>
                {isSimulatorOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black ">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5"
                        >
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-amber-500 text-amber-400 rounded-lg">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-white">Gateway Failure Simulator</h3>
                                </div>
                                <button
                                    onClick={() => setIsSimulatorOpen(false)}
                                    className="p-1.5 text-[#0F172A] hover:text-white rounded-lg hover:bg-slate-800 transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block font-semibold text-[#334155] mb-1">Select Gateway Node:</label>
                                    <select
                                        value={simGateway}
                                        onChange={(e) => setSimGateway(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                    >
                                        <option value="Stripe Payment Gateway">Stripe Payment Gateway</option>
                                        <option value="Fedwire / Sovereign Swift Node">Fedwire / Sovereign Swift Node</option>
                                        <option value="Compliance & AML Guard">Compliance & AML Guard</option>
                                        <option value="ACH Direct Debit Node">ACH Direct Debit Node</option>
                                        <option value="Plaid Financial Node">Plaid Financial Node</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-semibold text-[#334155] mb-1">Failure Event Scenario:</label>
                                    <select
                                        value={simEventType}
                                        onChange={(e) => setSimEventType(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-amber-400 font-mono focus:outline-none focus:border-cyan-500"
                                    >
                                        <option value="payment_intent.payment_failed">payment_intent.payment_failed (Card Decline)</option>
                                        <option value="wire.settlement_timeout">wire.settlement_timeout (Fedwire ACK Dropout)</option>
                                        <option value="compliance.halt_triggered">compliance.halt_triggered (AML Velocity Alert)</option>
                                        <option value="ach.return_received">ach.return_received (NSF Return R01)</option>
                                        <option value="checkout.session.completed">checkout.session.completed (Success Checkout)</option>
                                    </select>
                                </div>

                                {simEventType === 'payment_intent.payment_failed' && (
                                    <div>
                                        <label className="block font-semibold text-[#334155] mb-1">Decline Error Code:</label>
                                        <select
                                            value={simErrorCode}
                                            onChange={(e) => setSimErrorCode(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-rose-400 font-mono focus:outline-none focus:border-cyan-500"
                                        >
                                            <option value="insufficient_funds">insufficient_funds</option>
                                            <option value="card_velocity_exceeded">card_velocity_exceeded</option>
                                            <option value="3ds_signature_timeout">3ds_signature_timeout</option>
                                            <option value="do_not_honor">do_not_honor</option>
                                        </select>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-semibold text-[#334155] mb-1">Simulated User Email:</label>
                                        <input
                                            type="email"
                                            value={simEmail}
                                            onChange={(e) => setSimEmail(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-[#334155] mb-1">Amount ($ USD):</label>
                                        <input
                                            type="number"
                                            value={simAmount}
                                            onChange={(e) => setSimAmount(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsSimulatorOpen(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-[#334155] rounded-xl text-xs font-semibold transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    id="btn-inject-simulation"
                                    type="button"
                                    onClick={handleTriggerSimulatedWebhook}
                                    disabled={simIsLoading}
                                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-1.5"
                                >
                                    {simIsLoading ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Zap className="w-3.5 h-3.5" />
                                    )}
                                    <span>Inject Simulated Failure</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
