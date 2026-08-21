import React, { useState } from 'react';
import { 
    X as XMarkIcon, 
    BarChart3 as DocumentChartBarIcon, 
    Download as ArrowDownTrayIcon, 
    Printer as PrinterIcon, 
    ShieldCheck as ShieldCheckIcon, 
    AlertTriangle as ExclamationTriangleIcon,
    CheckCircle2 as CheckCircleIcon,
    Calendar as CalendarIcon,
    Building2 as BuildingLibraryIcon
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, UserProfile, TransactionStatus } from '../types';

interface ComplianceReportGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    flaggedTransactions: Transaction[];
    allUsers: UserProfile[];
    adminEmail?: string;
    addToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

export const ComplianceReportGeneratorModal: React.FC<ComplianceReportGeneratorModalProps> = ({
    isOpen,
    onClose,
    flaggedTransactions,
    allUsers,
    adminEmail = 'compliance@institution.org',
    addToast
}) => {
    const [reportPeriod, setReportPeriod] = useState<'30d' | '90d' | 'all'>('all');
    const [complianceOfficerName, setComplianceOfficerName] = useState('Chief Compliance Officer / MLRO');
    const [auditScope, setAuditScope] = useState('Full Anti-Money Laundering (AML) & Suspicious Activity Audit');
    const [includeResolutionNotes, setIncludeResolutionNotes] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;

    // Filter transactions based on period if requested
    const filteredTxs = flaggedTransactions.filter(tx => {
        if (reportPeriod === 'all') return true;
        const txDate = new Date((tx.statusTimestamps && Object.values(tx.statusTimestamps)[0]) || (tx as any).date || Date.now());
        const now = new Date();
        const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
        if (reportPeriod === '30d') return diffDays <= 30;
        if (reportPeriod === '90d') return diffDays <= 90;
        return true;
    });

    const highRiskUsersCount = allUsers.filter(u => (u.kycStatus as string) === 'REJECTED' || (u as any).riskRating === 'HIGH' || (u as any).profile?.kycStatus === 'REJECTED' || (u as any).profile?.riskRating === 'HIGH').length;
    const totalFlaggedVolume = filteredTxs.reduce((sum, tx) => sum + (Number(tx.sendAmount || tx.receiveAmount) || 0), 0);
    const resolvedCount = filteredTxs.filter(tx => tx.status === TransactionStatus.COMPLETED || (tx.status as string) === 'completed' || (tx as any).complianceStatus === 'RESOLVED').length;
    const pendingCount = filteredTxs.length - resolvedCount;

    const handleGeneratePdf = () => {
        setIsGenerating(true);
        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const currentDateStr = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const reportRefNo = `AML-AUDIT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 10000)}`;

            // Header Banner
            doc.setFillColor(15, 23, 42); // slate-900
            doc.rect(0, 0, 210, 38, 'F');

            // Logo & Title
            doc.setTextColor(245, 158, 11); // Amber
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.text('INSTITUTIONAL AML & REGULATORY COMPLIANCE REPORT', 14, 16);

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('OFFICIAL FINCEN & FATF AUDIT DOSSIER - CONFIDENTIAL & PROPRIETARY', 14, 23);
            doc.text(`Reference ID: ${reportRefNo} | Generated: ${currentDateStr}`, 14, 29);

            // Sub Header Details
            doc.setTextColor(51, 65, 85); // Slate 700
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('AUDIT EXECUTIVE SUMMARY & SCOPE', 14, 48);

            doc.setLineWidth(0.5);
            doc.setDrawColor(226, 232, 240);
            doc.line(14, 51, 196, 51);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`Compliance Officer: ${complianceOfficerName}`, 14, 57);
            doc.text(`Authorized Admin Email: ${adminEmail}`, 14, 62);
            doc.text(`Audit Scope: ${auditScope}`, 14, 67);
            doc.text(`Reporting Period: ${reportPeriod === 'all' ? 'All Historic Records' : reportPeriod}`, 14, 72);

            // Executive Metrics Table / Grid
            autoTable(doc, {
                startY: 77,
                head: [['Total Flagged Txs', 'Total Flagged Volume', 'High Risk Profiles', 'Resolved Cases', 'Pending Action']],
                body: [[
                    `${filteredTxs.length}`,
                    `$${totalFlaggedVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`,
                    `${highRiskUsersCount}`,
                    `${resolvedCount}`,
                    `${pendingCount}`
                ]],
                theme: 'grid',
                headStyles: { fillColor: [30, 41, 59], textColor: [245, 158, 11], fontStyle: 'bold', fontSize: 9 },
                bodyStyles: { fontSize: 9, fontStyle: 'bold', textColor: [15, 23, 42] },
                margin: { left: 14, right: 14 }
            });

            // Table Header Title
            const finalY = (doc as any).lastAutoTable.finalY || 105;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(51, 65, 85);
            doc.text('ITEMIZED FLAGGED TRANSACTIONS & SUSPICIOUS ACTIVITY LOGS', 14, finalY + 10);

            // Itemized Transactions Table
            const tableData = filteredTxs.map(tx => {
                const txId = tx.id ? (tx.id.length > 12 ? tx.id.slice(0, 10) + '...' : tx.id) : 'N/A';
                const userEmail = (tx as any).senderEmail || tx.recipient?.email || 'Unknown User';
                const amt = `$${(Number(tx.sendAmount || tx.receiveAmount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                const flagReason = (tx as any).flagReason || (tx as any).complianceNote || 'High Volume / Rapid Velocity Pattern';
                const status = (tx.status || 'PENDING').toUpperCase();
                const resolutionNote = includeResolutionNotes ? ((tx as any).resolutionNote || (tx as any).adminNote || 'Under Active MLRO Review') : 'N/A';

                return [
                    txId,
                    userEmail,
                    amt,
                    flagReason,
                    status,
                    resolutionNote
                ];
            });

            autoTable(doc, {
                startY: finalY + 14,
                head: [['Tx ID', 'User Email', 'Amount ($)', 'Flag Reason / AML Trigger', 'Status', 'Resolution / Audit Note']],
                body: tableData.length > 0 ? tableData : [['No flagged transactions recorded in selected audit window.', '', '', '', '', '']],
                theme: 'striped',
                headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
                bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
                columnStyles: {
                    0: { cellWidth: 24, fontStyle: 'bold' },
                    1: { cellWidth: 38 },
                    2: { cellWidth: 26, fontStyle: 'bold' },
                    3: { cellWidth: 38 },
                    4: { cellWidth: 20, fontStyle: 'bold' },
                    5: { cellWidth: 36 }
                },
                margin: { left: 14, right: 14 }
            });

            // Footer Signature Block
            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184); // Slate 400
                doc.text(`Confidential Financial Audit Report - Page ${i} of ${pageCount}`, 14, 287);
                doc.text(`Official Seal & Signature: _______________________ (${complianceOfficerName})`, 105, 287, { align: 'left' });
            }

            // Save PDF
            doc.save(`Compliance_Audit_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
            addToast('success', 'Compliance Report Generated', `Downloaded official PDF audit report with ${filteredTxs.length} flagged transactions.`);
            onClose();
        } catch (err: any) {
            console.error('[ComplianceReportGenerator] PDF Error:', err);
            addToast('error', 'PDF Generation Error', err.message || 'Failed to generate PDF document.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-100  p-4 animate-fade-in">
            <div className="bg-slate-50 border border-black/5 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl text-white dark:bg-slate-900">
                {/* Modal Header */}
                <div className="bg-slate-100 p-6 border-b border-black/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-500 border border-amber-500/20 rounded-2xl text-amber-400">
                            <DocumentChartBarIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-wider text-white">
                                Generate Official Compliance Report
                            </h3>
                            <p className="text-xs text-[#0F172A]">
                                Create a branded, institutional PDF audit dossier for compliance officers and regulatory bodies.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-[#0F172A] hover:text-white rounded-xl bg-white hover:bg-white transition-colors dark:bg-slate-800"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-6 text-xs font-mono">
                    {/* Summary Metric Cards */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-100 p-4 rounded-2xl border border-black/5 space-y-1">
                            <span className="text-[10px] text-[#0F172A] uppercase font-bold block">Flagged Cases</span>
                            <span className="text-lg font-black text-amber-400">{filteredTxs.length}</span>
                        </div>
                        <div className="bg-slate-100 p-4 rounded-2xl border border-black/5 space-y-1">
                            <span className="text-[10px] text-[#0F172A] uppercase font-bold block">Total Flagged Volume</span>
                            <span className="text-lg font-black text-emerald-400">
                                ${totalFlaggedVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </span>
                        </div>
                        <div className="bg-slate-100 p-4 rounded-2xl border border-black/5 space-y-1">
                            <span className="text-[10px] text-[#0F172A] uppercase font-bold block">High Risk Profiles</span>
                            <span className="text-lg font-black text-rose-400">{highRiskUsersCount}</span>
                        </div>
                    </div>

                    {/* Form Controls */}
                    <div className="space-y-4 bg-slate-100 p-5 rounded-2xl border border-black/5">
                        <div>
                            <label className="block text-[10px] font-bold text-[#0F172A] uppercase mb-1.5">
                                Audit Window & Time Horizon:
                            </label>
                            <div className="grid grid-cols-3 gap-2 font-bold">
                                <button
                                    onClick={() => setReportPeriod('30d')}
                                    className={`py-2.5 rounded-xl border transition-all ${
                                        reportPeriod === '30d' 
                                            ? 'bg-amber-500 text-slate-950 border-amber-500 font-black' 
                                            : 'bg-slate-50 border-black/5 text-[#0F172A] hover:text-white'
                                    }`}
                                >
                                    Last 30 Days
                                </button>
                                <button
                                    onClick={() => setReportPeriod('90d')}
                                    className={`py-2.5 rounded-xl border transition-all ${
                                        reportPeriod === '90d' 
                                            ? 'bg-amber-500 text-slate-950 border-amber-500 font-black' 
                                            : 'bg-slate-50 border-black/5 text-[#0F172A] hover:text-white'
                                    }`}
                                >
                                    Last 90 Days
                                </button>
                                <button
                                    onClick={() => setReportPeriod('all')}
                                    className={`py-2.5 rounded-xl border transition-all ${
                                        reportPeriod === 'all' 
                                            ? 'bg-amber-500 text-slate-950 border-amber-500 font-black' 
                                            : 'bg-slate-50 border-black/5 text-[#0F172A] hover:text-white'
                                    }`}
                                >
                                    All Historic Txs
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-[#0F172A] uppercase mb-1.5">
                                Compliance Officer / Signatory Title:
                            </label>
                            <input
                                type="text"
                                value={complianceOfficerName}
                                onChange={(e) => setComplianceOfficerName(e.target.value)}
                                className="w-full bg-slate-50 border border-black/5 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none focus:border-amber-500 dark:bg-slate-900"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-[#0F172A] uppercase mb-1.5">
                                Audit Scope Description:
                            </label>
                            <input
                                type="text"
                                value={auditScope}
                                onChange={(e) => setAuditScope(e.target.value)}
                                className="w-full bg-slate-50 border border-black/5 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 dark:bg-slate-900"
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <input
                                type="checkbox"
                                id="incResolution"
                                checked={includeResolutionNotes}
                                onChange={(e) => setIncludeResolutionNotes(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 bg-slate-50 text-amber-500 focus:ring-amber-500 dark:bg-slate-900"
                            />
                            <label htmlFor="incResolution" className="text-xs text-[#0F172A] font-bold cursor-pointer">
                                Include Admin Resolution Notes & Compliance Remediation Summaries
                            </label>
                        </div>
                    </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="bg-slate-100 p-6 border-t border-black/5 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-3 rounded-2xl bg-white hover:bg-white text-[#0F172A] font-bold uppercase tracking-wider text-xs dark:bg-slate-800"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGeneratePdf}
                        disabled={isGenerating}
                        className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl uppercase tracking-wider text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-70"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4 stroke-[3]" />
                        <span>{isGenerating ? 'Generating PDF...' : 'Generate & Download PDF Report'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComplianceReportGeneratorModal;
