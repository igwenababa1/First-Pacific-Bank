import React, { useState, useEffect, useMemo } from 'react';
import { 
    ShieldCheck, 
    CheckCircle2, 
    Search, 
    FileText, 
    AlertTriangle, 
    Clock, 
    ArrowRight, 
    Eye, 
    RefreshCw, 
    User, 
    DollarSign,
    Lock,
    ExternalLink,
    X,
    Filter,
    Download
} from 'lucide-react';
import { Transaction, TransactionStatus, UserProfile } from '../types';
import { db } from '../services/database';
import { socket } from '../services/socket';
import ComplianceReportGeneratorModal from './ComplianceReportGeneratorModal';

interface ComplianceAuditViewProps {
    transactions?: Transaction[];
    onUpdateTransaction?: (txId: string, updates: Partial<Transaction>) => Promise<void> | void;
    onClose?: () => void;
}

export const ComplianceAuditView: React.FC<ComplianceAuditViewProps> = ({
    transactions: propTransactions,
    onUpdateTransaction,
    onClose
}) => {
    const [allTxs, setAllTxs] = useState<Transaction[]>(propTransactions || []);
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState<boolean>(!propTransactions);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedProofTx, setSelectedProofTx] = useState<Transaction | null>(null);
    const [updatingTxIds, setUpdatingTxIds] = useState<Set<string>>(new Set());
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

    // Fetch transactions and users from DB if not provided via props
    const loadTransactions = async () => {
        setLoading(true);
        try {
            const data = await db.getAllTransactions();
            setAllTxs(data);
            const users = await db.getAllUsers();
            setAllUsers((users || []).map(u => (u as any).profile || u));
        } catch (err) {
            console.error('[ComplianceAuditView] Error loading transactions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!propTransactions) {
            loadTransactions();
        } else {
            setAllTxs(propTransactions);
        }
    }, [propTransactions]);

    // Real-time listener for ledger updates
    useEffect(() => {
        const handleLedgerUpdate = (e: any) => {
            const updatedTxs = e.detail;
            if (Array.isArray(updatedTxs) && updatedTxs.length > 0) {
                setAllTxs(prev => {
                    const txMap = new Map(prev.map(t => [t.id, t]));
                    updatedTxs.forEach(tx => {
                        if (tx && tx.id) {
                            txMap.set(tx.id, tx);
                        }
                    });
                    return Array.from(txMap.values());
                });
            }
        };

        window.addEventListener('REALTIME_LEDGER_UPDATE', handleLedgerUpdate);
        window.addEventListener('db_transactions_updated', handleLedgerUpdate);

        return () => {
            window.removeEventListener('REALTIME_LEDGER_UPDATE', handleLedgerUpdate);
            window.removeEventListener('db_transactions_updated', handleLedgerUpdate);
        };
    }, []);

    // Filter transactions stuck in AWAITING_PAYMENT_VERIFICATION
    const pendingVerificationTxs = useMemo(() => {
        return allTxs.filter(tx => {
            const isAwaiting = 
                tx.status === TransactionStatus.AWAITING_PAYMENT_VERIFICATION ||
                (tx as any).status === 'Awaiting Payment Verification' ||
                tx.status === TransactionStatus.FLAGGED_AWAITING_CLEARANCE;

            if (!isAwaiting) return false;

            if (!searchTerm.trim()) return true;

            const q = searchTerm.toLowerCase().trim();
            const recipientName = tx.recipient?.fullName || (tx as any).recipientName || '';
            const senderName = tx.senderName || (tx as any).senderEmail || '';

            return (
                tx.id?.toLowerCase().includes(q) ||
                tx.accountId?.toLowerCase().includes(q) ||
                senderName.toLowerCase().includes(q) ||
                recipientName.toLowerCase().includes(q) ||
                tx.description?.toLowerCase().includes(q) ||
                (tx.regulatoryAuthCode && tx.regulatoryAuthCode.toLowerCase().includes(q))
            );
        });
    }, [allTxs, searchTerm]);

    // Toggle status to COMPLETED and emit REALTIME_LEDGER_UPDATE
    const handleToggleToCompleted = async (tx: Transaction) => {
        setUpdatingTxIds(prev => new Set(prev).add(tx.id));
        try {
            const updatedTx: Transaction = {
                ...tx,
                status: TransactionStatus.COMPLETED,
                statusTimestamps: {
                    ...(tx.statusTimestamps || {}),
                    [TransactionStatus.COMPLETED]: new Date()
                }
            };

            // Call optional parent handler or fallback to DB direct save
            if (onUpdateTransaction) {
                await onUpdateTransaction(tx.id, { 
                    status: TransactionStatus.COMPLETED,
                    statusTimestamps: updatedTx.statusTimestamps 
                });
            } else {
                await db.saveTransaction(updatedTx);
                await db.updateTransactionStatus(tx.id, TransactionStatus.COMPLETED);
            }

            // Perform balance credit if transaction type is credit
            if (tx.type === 'credit') {
                try {
                    const ownerEmail = await db.getEmailByAccountId(tx.accountId);
                    if (ownerEmail) {
                        await db.atomicCreditAndNotify(
                            ownerEmail, 
                            tx.accountId, 
                            tx.receiveAmount || tx.sendAmount, 
                            updatedTx,
                            'admin@firstpaba.com',
                            'Compliance Audit Override',
                            `Compliance clearance override for ${tx.id}`
                        );
                    }
                } catch (creditErr) {
                    console.warn('[ComplianceAuditView] Optional credit step warning:', creditErr);
                }
            }

            // Trigger REALTIME_LEDGER_UPDATE event specifically for this transaction
            window.dispatchEvent(new CustomEvent('REALTIME_LEDGER_UPDATE', { 
                detail: [updatedTx] 
            }));
            window.dispatchEvent(new CustomEvent('db_transactions_updated', { 
                detail: [updatedTx] 
            }));

            // Socket notification to central server / client
            try {
                socket.emit('admin:resolve_intervention', {
                    txId: tx.id,
                    resolution: 'approved',
                    type: 'COMPLIANCE_OVERRIDE',
                    message: 'Compliance Audit View: Transaction status toggled to COMPLETED by admin override.'
                });
            } catch (sockErr) {
                console.warn('[ComplianceAuditView] Socket emission warning:', sockErr);
            }

            // Update local state for immediate visual feedback
            setAllTxs(prev => prev.map(t => t.id === tx.id ? updatedTx : t));

            setSuccessMessage(`Transaction ${tx.id} status successfully toggled to COMPLETED and ledger synced!`);
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err) {
            console.error('[ComplianceAuditView] Failed to toggle transaction status:', err);
            alert(`Failed to update transaction status: ${(err as Error).message || err}`);
        } finally {
            setUpdatingTxIds(prev => {
                const next = new Set(prev);
                next.delete(tx.id);
                return next;
            });
        }
    };

    return (
        <div className="bg-slate-50 border border-black/5 rounded-2xl p-6 shadow-2xl text-white space-y-6 dark:bg-slate-900">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/5 pb-5">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-500 border border-amber-500/20 rounded-xl text-amber-400">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-black uppercase tracking-wider text-white">
                                Compliance Audit View
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-amber-300 text-[10px] font-extrabold uppercase tracking-widest border border-amber-500/30">
                                {pendingVerificationTxs.length} Stuck Pending
                            </span>
                        </div>
                        <p className="text-xs text-[#0F172A] mt-1">
                            Monitors transactions staged in <span className="text-amber-400 font-semibold">AWAITING_PAYMENT_VERIFICATION</span>. Admin status toggle triggers an instant <span className="text-emerald-400 font-semibold">REALTIME_LEDGER_UPDATE</span> event.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
                        title="Generate branded PDF compliance report of flagged transactions"
                    >
                        <FileText className="w-4 h-4 stroke-[2.5]" />
                        <span>Generate Compliance Report</span>
                    </button>
                    <button 
                        onClick={loadTransactions}
                        disabled={loading}
                        className="p-2.5 bg-white hover:bg-white text-[#0F172A] rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-black/5 dark:bg-slate-800"
                        title="Reload latest from database"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
                        <span>Refresh</span>
                    </button>
                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="p-2.5 bg-red-500 hover:bg-red-500 text-red-400 rounded-xl text-xs font-bold transition-all border border-red-500/20"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Notification Banner */}
            {successMessage && (
                <div className="bg-emerald-500 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center justify-between text-xs font-bold animate-fadeIn">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>{successMessage}</span>
                    </div>
                    <button onClick={() => setSuccessMessage(null)} className="text-[#0F172A] hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Search & Statistics Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-[#0F172A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text"
                        placeholder="Search TX ID, account, beneficiary, code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-100 border border-black/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')} 
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0F172A] hover:text-white text-xs"
                        >
                            Clear
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3 text-xs text-[#0F172A]">
                    <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-black/5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Awaiting Verification: <strong className="text-white">{pendingVerificationTxs.length}</strong></span>
                    </div>
                </div>
            </div>

            {/* Transactions Audit List */}
            {loading ? (
                <div className="py-16 text-center text-[#0F172A] flex flex-col items-center gap-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
                    <p className="text-xs font-mono uppercase tracking-wider">Scanning ledger for compliance-stuck records...</p>
                </div>
            ) : pendingVerificationTxs.length === 0 ? (
                <div className="py-16 text-center text-[#0F172A] bg-slate-100 rounded-2xl border border-dashed border-black/5 p-8 flex flex-col items-center gap-3">
                    <ShieldCheck className="w-12 h-12 text-emerald-500/40" />
                    <h3 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">No Pending Clearance Holds</h3>
                    <p className="text-xs text-[#0F172A] max-w-md">
                        There are currently no transactions stuck in <span className="text-[#0F172A] font-mono">AWAITING_PAYMENT_VERIFICATION</span> matching your search query. All compliance queues are clear.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {pendingVerificationTxs.map((tx) => {
                        const isUpdating = updatingTxIds.has(tx.id);
                        const hasProof = Boolean(tx.paymentProof || (tx as any).screenshotProof);
                        const recipientName = tx.recipient?.fullName || (tx as any).recipientName || 'External Beneficiary';
                        const amountFormatted = (tx.sendAmount || tx.receiveAmount || 0).toLocaleString('en-US', {
                            style: 'currency',
                            currency: tx.baseCurrency || 'USD'
                        });

                        return (
                            <div 
                                key={tx.id}
                                className="bg-slate-100 border border-black/5 hover:border-amber-500/40 rounded-xl p-4 transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg group"
                            >
                                {/* Left Section: Metadata */}
                                <div className="space-y-2 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500 px-2.5 py-1 rounded-md border border-amber-500/20">
                                            {tx.id}
                                        </span>
                                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-500 text-amber-300 border border-amber-500/30">
                                            {tx.status}
                                        </span>
                                        {tx.regulatoryAuthCode && (
                                            <span className="font-mono text-[10px] bg-cyan-500 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 flex items-center gap-1">
                                                <Lock className="w-3 h-3" /> Code: {tx.regulatoryAuthCode}
                                            </span>
                                        )}
                                        {hasProof && (
                                            <button 
                                                onClick={() => setSelectedProofTx(tx)}
                                                className="text-[10px] bg-emerald-500 hover:bg-emerald-500 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1 transition-colors"
                                            >
                                                <Eye className="w-3 h-3" /> Payment Proof Attached
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                                        <div>
                                            <span className="text-[#0F172A] text-[10px] uppercase font-bold block">Source Account</span>
                                            <span className="text-[#1E293B] font-semibold">{tx.senderName || tx.accountId}</span>
                                        </div>
                                        <div>
                                            <span className="text-[#0F172A] text-[10px] uppercase font-bold block">Beneficiary</span>
                                            <span className="text-[#1E293B] font-semibold">{recipientName}</span>
                                        </div>
                                        <div>
                                            <span className="text-[#0F172A] text-[10px] uppercase font-bold block">Description</span>
                                            <span className="text-[#0F172A] truncate block">{tx.description || 'Interbank Liquidity Settlement'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Section: Amount & Action Toggle */}
                                <div className="flex items-center justify-between lg:justify-end gap-4 pt-2 lg:pt-0 border-t lg:border-t-0 border-black/5">
                                    <div className="text-left lg:text-right">
                                        <div className="text-base font-black text-white font-mono">
                                            {amountFormatted}
                                        </div>
                                        <div className="text-[10px] text-[#0F172A]">
                                            {tx.estimatedArrival ? new Date(tx.estimatedArrival).toLocaleString() : 'Pending Clearance'}
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => handleToggleToCompleted(tx)}
                                        disabled={isUpdating}
                                        className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isUpdating ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                <span>Updating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>Toggle to COMPLETED</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal for viewing uploaded proof image */}
            {selectedProofTx && (
                <div className="fixed inset-0 bg-slate-100  z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-50 border border-white/20 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative animate-scaleUp dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-black/5 pb-3">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-emerald-400" />
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                    Payment Receipt Proof - {selectedProofTx.id}
                                </h3>
                            </div>
                            <button 
                                onClick={() => setSelectedProofTx(null)}
                                className="p-1 text-[#0F172A] hover:text-white rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto bg-slate-100 p-2 rounded-xl border border-black/5 flex items-center justify-center">
                            {(selectedProofTx.paymentProof || (selectedProofTx as any).screenshotProof) ? (
                                <img 
                                    src={selectedProofTx.paymentProof || (selectedProofTx as any).screenshotProof} 
                                    alt="Payment Proof Screenshot" 
                                    className="max-w-full max-h-[50vh] rounded-lg object-contain"
                                />
                            ) : (
                                <p className="text-[#0F172A] text-xs py-8">No image data attached to this proof record.</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button 
                                onClick={() => setSelectedProofTx(null)}
                                className="px-4 py-2 bg-white hover:bg-slate-700 text-white text-xs font-bold rounded-xl dark:bg-slate-800"
                            >
                                Close
                            </button>
                            <button 
                                onClick={() => {
                                    const targetTx = selectedProofTx;
                                    setSelectedProofTx(null);
                                    handleToggleToCompleted(targetTx);
                                }}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl uppercase tracking-wider flex items-center gap-1.5"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Approve & Toggle to COMPLETED</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Compliance Report PDF Modal */}
            <ComplianceReportGeneratorModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                flaggedTransactions={allTxs.filter(tx => (tx.status as string) === 'awaiting_verification' || (tx as any).isFlagged || (tx.status as string) === 'failed' || (tx.status as string) === 'rejected' || tx.status === TransactionStatus.FLAGGED_AWAITING_CLEARANCE)}
                allUsers={allUsers}
                addToast={(type, title, msg) => {
                    setSuccessMessage(`${title}: ${msg}`);
                    setTimeout(() => setSuccessMessage(null), 6000);
                }}
            />
        </div>
    );
};

export default ComplianceAuditView;
