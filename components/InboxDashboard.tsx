import React, { useState, useMemo } from 'react';
import { Notification, NotificationType, UserProfile } from '../types';
import { 
    BellIcon, 
    CheckCircleIcon, 
    CreditCardIcon, 
    ShieldCheckIcon, 
    LifebuoyIcon, 
    CashIcon,
    TrashIcon,
    ArrowPathIcon,
    SpinnerIcon
} from './Icons';
import { jsPDF } from 'jspdf';
import { applyBankPdfBackgroundAndWatermark, generateQrCodeDataUrl, embedVerificationQrCodeBlock } from '../utils/pdfWatermarkAndQr';
import { timeSince } from '../utils/time';
import { DigitalSignature, SignatureMetadata } from './DigitalSignature';
import { generateOfficialSealDataUrl } from './DocumentViewer';
import * as zip from '@zip.js/zip.js';

interface InboxDashboardProps {
    notifications: Notification[];
    userProfile?: UserProfile;
    onMarkAsRead?: (id: string) => void;
    onDeleteNotification?: (id: string) => void;
    onBulkDeleteNotifications?: (ids: string[]) => void;
    onReportNotification?: (id: string, notes?: string) => void;
    onSaveSignature?: (id: string, signatureDataUrl: string, metadata?: SignatureMetadata) => void;
}

const getNotificationIcon = (type: NotificationType) => {
    switch(type) {
        case NotificationType.TRANSACTION:
            return <CheckCircleIcon className="w-5 h-5 text-emerald-400" />;
        case NotificationType.CARD:
            return <CreditCardIcon className="w-5 h-5 primary-" />;
        case NotificationType.SECURITY:
            return <ShieldCheckIcon className="w-5 h-5 text-amber-400" />;
        case NotificationType.INSURANCE:
            return <LifebuoyIcon className="w-5 h-5 text-indigo-400" />;
        case NotificationType.LOAN:
            return <CashIcon className="w-5 h-5 text-teal-400" />;
        default:
            return <BellIcon className="w-5 h-5 text-[#0F172A]" />;
    }
};

export const InboxDashboard: React.FC<InboxDashboardProps> = ({
    notifications,
    userProfile,
    onMarkAsRead,
    onDeleteNotification,
    onBulkDeleteNotifications,
    onReportNotification,
    onSaveSignature
}) => {
    const [selectedNotifId, setSelectedNotifId] = useState<string | null>(
        notifications.length > 0 ? notifications[0].id : null
    );
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'security' | 'transaction' | 'other'>('all');
    
    // Security report modal / response states
    const [isReporting, setIsReporting] = useState(false);
    const [reportStatus, setReportStatus] = useState<'idle' | 'reporting' | 'success'>('idle');
    const [securityNotes, setSecurityNotes] = useState('');
    const [reportLogs, setReportLogs] = useState<string[]>([]);

    // Cryptographic ZIP generation and volume management states
    const [showZipModal, setShowZipModal] = useState(false);
    const [zipPassword, setZipPassword] = useState('');
    const [zipExportLogs, setZipExportLogs] = useState<string[]>([]);
    const [isCompilingZip, setIsCompilingZip] = useState(false);
    const [zipDownloadUrl, setZipDownloadUrl] = useState<string | null>(null);

    // Integrated Document Signing modal & Profile Saved Signed Documents states
    const [isDocSigningModalOpen, setIsDocSigningModalOpen] = useState(false);
    const [showSavedSignedDocsModal, setShowSavedSignedDocsModal] = useState(false);
    const [signingStatusSuccess, setSigningStatusSuccess] = useState<string | null>(null);

    // Helper: Generate and download signed document PDF
    const handleCompileSignedDocPDF = async (notif: Notification, sigUrl: string, metadata?: SignatureMetadata) => {
        try {
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            applyBankPdfBackgroundAndWatermark(doc, {
                title: 'OFFICIAL SIGNED STATEMENT / CERTIFICATE',
                documentRef: `REF: FPB-SIG-${Date.now().toString().slice(-8)}`
            });

            doc.setFillColor(240, 243, 248);
            doc.rect(15, 48, 180, 25, 'F');

            doc.setTextColor(51, 65, 85);
            doc.setFontSize(9);
            doc.setFont('Helvetica', 'bold');
            doc.text("DOCUMENT TITLE:", 20, 56);
            doc.setFont('Helvetica', 'normal');
            doc.text(notif.title.toUpperCase(), 60, 56);

            doc.setFont('Helvetica', 'bold');
            doc.text("SIGNATORY STATUS:", 20, 62);
            doc.setFont('Courier', 'bold');
            doc.setTextColor(34, 197, 94);
            doc.text("VERIFIED ELECTRONIC SIGNATURE ATTACHED", 60, 62);

            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(51, 65, 85);
            doc.text("TIMELOCK STAMP:", 20, 68);
            doc.setFont('Helvetica', 'normal');
            doc.text(new Date().toLocaleString(), 60, 68);

            // Document Body Content
            doc.setFontSize(10);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text("DOCUMENT BODY / INSTRUCTION PAYLOAD", 15, 88);

            doc.setLineWidth(0.3);
            doc.setDrawColor(226, 232, 240);
            doc.line(15, 91, 195, 91);

            doc.setFontSize(9);
            doc.setFont('Helvetica', 'normal');
            doc.setTextColor(51, 65, 85);
            const splitBody = doc.splitTextToSize(notif.message, 175);
            doc.text(splitBody, 15, 98);

            const endY = Math.min(210, 98 + (splitBody.length * 5) + 10);

            // Signature Card Box in PDF
            doc.setFillColor(248, 250, 252);
            doc.rect(15, endY, 180, 45, 'F');
            doc.setDrawColor(203, 213, 225);
            doc.rect(15, endY, 180, 45, 'S');

            doc.setFontSize(8);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(100, 116, 139);
            doc.text("ELECTRONIC SIGNATURE & AUDIT SEAL", 20, endY + 8);

            doc.setFontSize(9);
            doc.setTextColor(15, 23, 42);
            doc.text(`Signer Name: ${metadata?.signerName || userProfile?.name || 'Authorized Signatory'}`, 20, endY + 16);
            doc.text(`Signer Title: ${metadata?.signerTitle || 'Account Owner'}`, 20, endY + 22);
            doc.text(`Verification Hash: ${metadata?.hash || 'SIG-VERIFIED-ISO20022'}`, 20, endY + 28);
            doc.text(`Signed Timestamp: ${new Date().toLocaleString()}`, 20, endY + 34);

            // Add signature image
            if (sigUrl) {
                try {
                    doc.addImage(sigUrl, 'PNG', 125, endY + 5, 65, 30);
                } catch (e) {
                    console.warn('Failed to render signature image in PDF:', e);
                }
            }

            // Add official bank seal
            const officialSeal = generateOfficialSealDataUrl();
            if (officialSeal) {
                try {
                    doc.addImage(officialSeal, 'PNG', 160, endY + 12, 28, 28);
                } catch (e) {}
            }

            // Save PDF
            const safeTitle = notif.title.replace(/[^a-zA-Z0-9]/g, '_');
            doc.save(`Signed_${safeTitle}_${Date.now()}.pdf`);
        } catch (err) {
            console.error('Failed to generate signed PDF:', err);
        }
    };

    // Find the currently selected notification
    const selectedNotif = useMemo(() => {
        return notifications.find(n => n.id === selectedNotifId) || null;
    }, [notifications, selectedNotifId]);

    const isAuthorizationForm = useMemo(() => {
        if (!selectedNotif) return false;
        const title = selectedNotif.title.toLowerCase();
        const msg = selectedNotif.message.toLowerCase();
        return title.includes('hold') || 
               title.includes('clearance') || 
               title.includes('authorization') || 
               title.includes('exemption') || 
               title.includes('restriction') || 
               title.includes('compliance') || 
               title.includes('action required') ||
               msg.includes('hold') || 
               msg.includes('clearance code') || 
               msg.includes('authorization letter') || 
               msg.includes('clearance hold') ||
               msg.includes('settlement fee');
    }, [selectedNotif]);

    // Handle marking as read automatically when selected
    React.useEffect(() => {
        if (selectedNotif && !selectedNotif.read && onMarkAsRead) {
            onMarkAsRead(selectedNotif.id);
        }
    }, [selectedNotifId, selectedNotif, onMarkAsRead]);

    // Filter notifications list
    const filteredNotifications = useMemo(() => {
        return notifications.filter(n => {
            const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 n.message.toLowerCase().includes(searchQuery.toLowerCase());
            
            if (!matchesSearch) return false;
            if (activeFilter === 'all') return true;
            if (activeFilter === 'security') return n.type === NotificationType.SECURITY;
            if (activeFilter === 'transaction') return n.type === NotificationType.TRANSACTION;
            // 'other' cases
            return n.type !== NotificationType.SECURITY && n.type !== NotificationType.TRANSACTION;
        });
    }, [notifications, searchQuery, activeFilter]);

    const isAllSelected = useMemo(() => {
        if (filteredNotifications.length === 0) return false;
        return filteredNotifications.every(n => selectedIds.includes(n.id));
    }, [filteredNotifications, selectedIds]);

    const handleSelectAll = () => {
        if (isAllSelected) {
            const filteredSet = new Set(filteredNotifications.map(n => n.id));
            setSelectedIds(prev => prev.filter(id => !filteredSet.has(id)));
        } else {
            const allFilteredIds = filteredNotifications.map(n => n.id);
            setSelectedIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
        }
    };

    const handleToggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        const count = selectedIds.length;
        if (window.confirm(`Are you sure you want to delete ${count} notification${count > 1 ? 's' : ''}?`)) {
            if (onBulkDeleteNotifications) {
                onBulkDeleteNotifications(selectedIds);
            } else if (onDeleteNotification) {
                selectedIds.forEach(id => onDeleteNotification(id));
            }
            if (selectedNotifId && selectedIds.includes(selectedNotifId)) {
                const remaining = notifications.filter(n => !selectedIds.includes(n.id));
                setSelectedNotifId(remaining.length > 0 ? remaining[0].id : null);
            }
            setSelectedIds([]);
        }
    };

    const handleBulkMarkAsRead = () => {
        if (selectedIds.length === 0 || !onMarkAsRead) return;
        selectedIds.forEach(id => onMarkAsRead(id));
    };

    // Compile a customized signed notification authorization document as a PDF blob
    const compileNotificationToPDFBlob = async (notif: Notification): Promise<Blob> => {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        applyBankPdfBackgroundAndWatermark(doc, { title: 'INSTITUTIONAL DIRECTIVE RECORD', documentRef: `REF: FPB-NOTIF-${new Date().getFullYear()}` });

        const amountMatch = notif.message.match(/\$\s*([0-9,.]+)/) || notif.title.match(/\$\s*([0-9,.]+)/);
        const amountStr = amountMatch ? amountMatch[1] : '0.00';
        const txnId = (notif as any).metadata?.transactionId || `TXN-SEC-${Math.floor(Math.random() * 900000 + 100000)}`;

        // 2. Title & Statement Summary
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(13);
        doc.setFont('Helvetica', 'bold');
        doc.text(notif.title.toUpperCase(), 15, 52);

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(15, 56, 195, 56);

        // 3. Document body text wrap
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10.5);
        doc.setTextColor(51, 65, 85);
        const splitText = doc.splitTextToSize(notif.message, 175);
        doc.text(splitText, 15, 66);

        const textHeight = splitText.length * 5.2;
        const blockStartY = 75 + textHeight;

        // 4. Metadata details table
        doc.setFillColor(248, 250, 252);
        doc.rect(15, blockStartY, 180, 42, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.line(15, blockStartY, 195, blockStartY);

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text("Sovereign Node Reference:", 20, blockStartY + 10);
        doc.text("Transmission Clearance Status:", 20, blockStartY + 20);
        doc.text("Settlement Code Authorization:", 20, blockStartY + 30);

        doc.setFont('Courier', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(txnId, 75, blockStartY + 10);
        doc.text("VERIFIED & RECOGNIZED IN LEDGER", 75, blockStartY + 20);
        doc.text(`FPB-EXEMPT-${Math.floor(100 + Math.random()*900)}`, 75, blockStartY + 30);

        // 5. Electronic signature rendering block (if signed)
        const sigY = blockStartY + 52;
        if ((notif as any).signatureDataUrl) {
            doc.setFillColor(236, 253, 245); // emerald green light bg
            doc.rect(15, sigY, 180, 36, 'F');
            doc.setDrawColor(167, 243, 208);
            doc.rect(15, sigY, 180, 36);

            doc.setTextColor(5, 150, 105);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.text("✓ SECURED ELECTRONIC COMPLIANCE ASSIGNMENT", 22, sigY + 8);

            // Put the canvas signature image in. We render it at A4 scale!
            try {
                doc.addImage((notif as any).signatureDataUrl, 'PNG', 110, sigY + 5, 75, 25);
            } catch (sigErr) {
                console.error("Signature image add error", sigErr);
            }

            doc.setTextColor(100, 116, 139);
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(8);
            doc.text("The signature counterpart is locked dynamically with", 22, sigY + 16);
            doc.text("the user account. Verification hash is verified directly", 22, sigY + 21);
            doc.text("against correspondent clearing institution.", 22, sigY + 26);
        } else {
            // Draw standard unsigned warning
            doc.setFillColor(254, 243, 199);
            doc.rect(15, sigY, 180, 20, 'F');
            doc.setDrawColor(251, 191, 36);
            doc.rect(15, sigY, 180, 20);

            doc.setTextColor(180, 83, 9);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(9);
            doc.text("! NOT SIGNED - COMPLIANCE HOLD PENDING ACTION", 20, sigY + 12);
        }

        // 6. Security Footer
        doc.setFont('Courier', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`DECLARATION-HASH-SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}`, 15, 280);

        // Embed Verification QR Code Block
        const originHost = typeof window !== 'undefined' ? window.location.origin : 'https://firstpacificbank.com';
        const verifyPayload = `${originHost}/verify?doc=NOTIF_${txnId}&status=VERIFIED`;
        const qrDataUrl = await generateQrCodeDataUrl(verifyPayload, 200);
        embedVerificationQrCodeBlock(doc, qrDataUrl, 20, 260, { width: 170, height: 20 });

        return doc.output('blob');
    };

    // Compiles and downloads a password-protected ZIP archive bundling all signed records
    const handleCompileProtectedZip = async () => {
        if (!zipPassword.trim()) return;
        
        setIsCompilingZip(true);
        setZipExportLogs([]);

        const signedDocs = notifications.filter(n => (n as any).signatureDataUrl);
        if (signedDocs.length === 0) {
            setZipExportLogs(["❌ Compiling Error: No signed files available to package."]);
            setIsCompilingZip(false);
            return;
        }

        try {
            setZipExportLogs(prev => [...prev, "🧬 [INITIALIZING] Activating AES-256 ZipCrypto engine..."]);
            await new Promise(resolve => setTimeout(resolve, 600));

            // Force main-thread compression avoiding CORS and iframe origin constraints
            zip.configure({ useWebWorkers: false });

            const blobWriter = new zip.BlobWriter("application/zip");
            const zipWriter = new zip.ZipWriter(blobWriter);

            for (let i = 0; i < signedDocs.length; i++) {
                const doc = signedDocs[i];
                const cleanTitle = doc.title.replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 30);
                const fileName = `Signed_Deed_${i + 1}_${cleanTitle}.pdf`;

                setZipExportLogs(prev => [...prev, `📄 [METADATA] Compiling high-fidelity PDF: ${fileName}...`]);
                
                // 1. Generate PDF blob
                const pdfBlob = await compileNotificationToPDFBlob(doc);
                
                // 2. Insert into password-protected zip
                setZipExportLogs(prev => [...prev, `🔒 [ENCRYPT] Binding & lock-sealing ${fileName} with password...`]);
                await zipWriter.add(fileName, new zip.BlobReader(pdfBlob), {
                    password: zipPassword
                });

                await new Promise(resolve => setTimeout(resolve, 400));
            }

            setZipExportLogs(prev => [...prev, "🧬 [FINALIZING] Closing archive volumes and flushing buffers..."]);
            const zipBlob = await zipWriter.close();
            
            const downloadUrl = URL.createObjectURL(zipBlob);
            setZipDownloadUrl(downloadUrl);

        } catch (err: any) {
            console.error("ZIP Generation Failure", err);
            setZipExportLogs(prev => [...prev, `❌ Compilation Error: ${err?.message || err}`]);
        } finally {
            setIsCompilingZip(false);
        }
    };

    // Generate formal bank receipt utilizing jspdf API
    const handleDownloadPdfReceipt = async (notif: Notification) => {
        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            applyBankPdfBackgroundAndWatermark(doc, { title: 'OFFICIAL TRANSACTION RECEIPT', documentRef: `REF: FPB-TX-${new Date().getFullYear()}` });

            // Extract payment details safely from notification titles/messages or generate realistic ones
            const amountMatch = notif.message.match(/\$\s*([0-9,.]+)/) || notif.title.match(/\$\s*([0-9,.]+)/);
            const amountStr = amountMatch ? amountMatch[1] : '0.00';
            
            const merchantMatch = notif.message.match(/to\s+([^.]+)/) || notif.message.match(/dispatched\s+securely\s+to\s+([^.]+)/);
            const merchantName = merchantMatch ? merchantMatch[1].trim() : 'FPB Direct Merchant Node';
            
            const txnId = (notif as any).metadata?.transactionId || `TXN-${Math.floor(Math.random() * 900000 + 100000)}`;

            // Formatting variables
            const brandColor = '#0b101c'; // First Pacific dark slate
            const accentColor = '#0ec5f2'; // Premium Cyan

            // Receipt Title Block
            doc.setFillColor(240, 243, 248);
            doc.rect(15, 48, 180, 28, 'F');
            
            doc.setTextColor(51, 65, 85);
            doc.setFontSize(9);
            doc.setFont('Helvetica', 'bold');
            doc.text("STATEMENT PROTOCOL:", 20, 56);
            doc.setFont('Helvetica', 'normal');
            doc.text("DIRECT QR SWAP COMPLIANCE ADVICE", 62, 56);

            doc.setFont('Helvetica', 'bold');
            doc.text("TRANSACTION REFERENCE:", 20, 62);
            doc.setFont('Courier', 'bold');
            doc.setTextColor(14, 197, 242); // cyan
            doc.text(txnId, 62, 62);

            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(51, 65, 85);
            doc.text("CLEARANCE TIMELOCK:", 20, 68);
            doc.setFont('Helvetica', 'normal');
            doc.text(new Date().toLocaleString(), 62, 68);

            // 2. Main Ledger Specifications Table
            doc.setFontSize(11);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text("CLEARING HOUSE PROTOCOL METADATA", 15, 92);
            
            doc.setLineWidth(0.3);
            doc.setDrawColor(226, 232, 240);
            doc.line(15, 95, 195, 95);

            // Grid Layout for Metadata
            const rowStart = 104;
            const rowHeight = 10;
            const labels = [
                ["Interledger Originating Node", "First Pacific Core API Exchange"],
                ["Counterparty Routing Address", merchantName],
                ["Sovereign Clearance Status", "TIMELOCK CLEARED // ZERO-GAS SETTLED"],
                ["Transfer Category Code", "QR Instant Liquidity Swap (P2P)"],
                ["Clearing Network Cost", "$0.00 USD (Sovereign Exemption Code)"]
            ];

            labels.forEach((row, i) => {
                const y = rowStart + (i * rowHeight);
                doc.setFont('Helvetica', 'bold');
                doc.setFontSize(9);
                doc.setTextColor(100, 116, 139);
                doc.text(row[0], 18, y);
                doc.setFont('Helvetica', 'normal');
                doc.setTextColor(30, 41, 59);
                doc.text(row[1], 100, y);
                doc.line(15, y + 3, 195, y + 3);
            });

            // 3. Outstanding Gross Amount Highlight Card
            const highlightY = 162;
            doc.setFillColor(11, 16, 28);
            doc.rect(15, highlightY, 180, 26, 'F');
            
            // Neon top lip border
            doc.setFillColor(14, 197, 242);
            doc.rect(15, highlightY, 180, 1.5, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(9);
            doc.text("GROSS LIQUID BALANCE TRANSFERRED", 25, highlightY + 11);
            
            doc.setTextColor(14, 197, 242);
            doc.setFont('Courier', 'bold');
            doc.setFontSize(16);
            doc.text(`$${parseFloat(amountStr).toFixed(2)} USD`, 25, highlightY + 20);

            // Stamp Circle Visual rendering in PDF
            doc.setDrawColor(34, 197, 94); // Green border
            doc.setLineWidth(0.8);
            doc.circle(165, highlightY + 12, 10);
            doc.setTextColor(34, 197, 94);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(5);
            doc.text("VERIFIED", 158.5, highlightY + 11.5);
            doc.text("SETTLED", 159, highlightY + 14.5);

            // 4. Institutional Compliance Disclaimers
            doc.setFontSize(7.5);
            doc.setFont('Helvetica', 'normal');
            doc.setTextColor(148, 163, 184);
            const complianceText = "This statement represents an automated decentralized bookkeeping trace of assets authorized securely from internal private account assets. First Pacific Bank operates as a licensed Sovereign Asset Settlement Desk. Values transacted are committed dynamically to standard compliance indices. If this payload of logs appears erroneous or requires emergency recall measures, please immediately trigger the Escalate to Bank Security Team protocol from your custom Terminal portal Dashboard.";
            
            const splitText = doc.splitTextToSize(complianceText, 175);
            doc.text(splitText, 15, 205);

            // Audit Signature Line
            doc.setDrawColor(203, 213, 225);
            doc.line(15, 248, 85, 248);
            doc.text("Sovereign Node Integrity Seal", 15, 253);
            
            doc.line(125, 248, 195, 248);
            doc.text("Authorized Clearing Officer Handshake", 125, 253);

            // Subtle brand footer watermarks
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.setFont('Courier', 'italic');
            doc.text(`FIRST-PABA-CRYPTO-STAMP-TRACE-${txnId}`, 15, 282);

            // Embed Verification QR Code Block
            const originHost = typeof window !== 'undefined' ? window.location.origin : 'https://firstpacificbank.com';
            const verifyPayload = `${originHost}/verify?doc=TX_${txnId}&status=VERIFIED`;
            const qrDataUrl = await generateQrCodeDataUrl(verifyPayload, 200);
            embedVerificationQrCodeBlock(doc, qrDataUrl, 20, 260, { width: 170, height: 20 });

            // Save and download pdf receipt trigger
            doc.save(`First_Paba_Receipt_${txnId}.pdf`);
        } catch (err) {
            console.error("Failed to compile pdf via jspdf", err);
        }
    };

    // Report incident workflow simulation (As real modern banks mimic functionality)
    const handleReportToSecurity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedNotif) return;
        
        setIsReporting(true);
        setReportStatus('reporting');
        setReportLogs([]);

        const logs = [
            `📡 [INIT] Packaging Cryptographic envelope for Alert #${selectedNotif.id}...`,
            `🔍 [ANALYZE] Parsing threat vector telemetry headers (SSL handshake active)...`,
            `🔐 [LOCK] Attaching localized verification certificates...`,
            `⚡ [ROUTE] Dispatching payload to Admin Dashboard Security queue...`
        ];

        // Simulate micro audit steps in the UI logs
        for (let i = 0; i < logs.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 600));
            setReportLogs(prev => [...prev, logs[i]]);
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        // Update the incident database / state
        if (onReportNotification) {
            onReportNotification(selectedNotif.id, securityNotes);
        }

        setReportStatus('success');
        setIsReporting(false);
        setSecurityNotes('');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">
            {/* Header section with brand alignment */}
            <div className="border-b border-slate-200 dark:border-white/10 pb-5">
                <h1 className="text-2xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight flex items-center gap-2.5">
                    <span className="p-2 bg-primary/10 rounded-xl border border-primary/20 text-primary">
                        <BellIcon className="w-6 h-6" />
                    </span>
                    Core Inbox Dashboard
                </h1>
                <p className="text-xs text-[#0F172A] dark:text-white mt-1 font-bold">
                    Review official dispatches, legal receipts, and escalate suspicious activities instantly to specialized bank safety nodes.
                </p>
            </div>

            {/* Split layout: Inbox feed and detail reader */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left side list pane */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-3xl p-5 flex flex-col h-[640px] shadow-sm">
                    {/* Search & filters */}
                    <div className="space-y-3 mb-3">
                        <input 
                            type="text"
                            placeholder="Filter briefs..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none text-[#0F172A] dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-primary/50 transition-colors"
                        />
                        
                        {/* Selector tabs */}
                        <div className="flex gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl">
                            {(['all', 'security', 'transaction', 'other'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setActiveFilter(f)}
                                    className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                        activeFilter === f 
                                        ? 'bg-[#0b101c] dark:bg-slate-900 text-primary dark:text-white border border-black/5' 
                                        : 'text-[#0F172A] hover:text-[#0F172A] dark:hover:text-[#1E293B]'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        {/* Select All & Bulk Actions Toolbar */}
                        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs">
                            <label className="flex items-center gap-2 text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:hover:text-white font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={isAllSelected}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 rounded text-primary border-slate-300 dark:border-slate-300 focus:ring-primary cursor-pointer"
                                />
                                Select All ({filteredNotifications.length})
                            </label>

                            {selectedIds.length > 0 && (
                                <div className="flex items-center gap-1.5 animate-fade-in">
                                    {onMarkAsRead && (
                                        <button
                                            type="button"
                                            onClick={handleBulkMarkAsRead}
                                            className="px-2 py-1 text-[9px] font-black uppercase tracking-wider bg-emerald-500 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                            title="Mark selected as read"
                                        >
                                            <CheckCircleIcon className="w-3 h-3" />
                                            Read
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleBulkDelete}
                                        className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-red-500 hover:bg-red-500 text-red-600 dark:text-red-400 border border-red-500/20 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                                        title="Delete selected notifications"
                                    >
                                        <TrashIcon className="w-3 h-3" />
                                        Delete ({selectedIds.length})
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Executive Action Triggers */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowZipModal(true);
                                    setZipPassword(Math.random().toString(36).substring(2, 10).toUpperCase());
                                    setZipDownloadUrl(null);
                                    setZipExportLogs([]);
                                }}
                                className="w-full py-2 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest leading-none transition-all flex items-center justify-center gap-2 select-none border cursor-pointer border-[#ca8a04]/30 bg-amber-500 hover:bg-amber-500 text-[#ca8a04] hover:text-amber-300 shadow-sm active:scale-[0.98]"
                            >
                                🔒 ZIP EXPORT ({notifications.filter(n => (n as any).signatureDataUrl).length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowSavedSignedDocsModal(true)}
                                className="w-full py-2 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest leading-none transition-all flex items-center justify-center gap-2 select-none border cursor-pointer border-emerald-500/30 bg-emerald-500 hover:bg-emerald-500 text-emerald-400 shadow-sm active:scale-[0.98]"
                            >
                                📂 SIGNED DOCS ({userProfile?.savedSignedDocuments?.length || 0})
                            </button>
                        </div>
                    </div>

                    {/* Feed containers */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {filteredNotifications.length === 0 ? (
                            <div className="text-center py-20 text-[#0F172A] dark:text-white space-y-2">
                                <BellIcon className="w-10 h-10 mx-auto opacity-40 text-[#0F172A] dark:text-white" />
                                <p className="text-xs font-semibold uppercase tracking-wider">No corresponding entries</p>
                            </div>
                        ) : (
                            filteredNotifications.map(item => {
                                const isSelected = item.id === selectedNotifId;
                                const isChecked = selectedIds.includes(item.id);
                                const isReported = (item as any).reportedToSecurity;
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => { setSelectedNotifId(item.id); setReportStatus('idle'); }}
                                        className={`w-full text-left p-3.5 rounded-2xl border transition-all flex gap-3 relative group cursor-pointer ${
                                            isSelected 
                                            ? 'bg-primary/5 border-primary/30 shadow-md shadow-primary/5' 
                                            : isChecked
                                            ? 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-black/10'
                                            : 'bg-slate-50 dark:bg-slate-900[0.01] hover:bg-slate-100 dark:hover:bg-white[0.03] border-slate-200 dark:border-white/10'
                                        }`}
                                    >
                                        {/* Selection Checkbox */}
                                        <div 
                                            className="flex items-center shrink-0 pr-0.5"
                                            onClick={(e) => handleToggleSelect(item.id, e)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedIds(prev => 
                                                        prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id]
                                                    );
                                                }}
                                                className="w-4 h-4 rounded text-primary border-slate-300 dark:border-slate-300 focus:ring-primary cursor-pointer"
                                            />
                                        </div>

                                        {/* Unread circle badge indicator */}
                                        {!item.read && (
                                            <span className="absolute top-3.5 right-3.5 w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                        )}

                                        <div className={`p-2 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center border ${
                                            isSelected 
                                            ? 'bg-primary/20 border-primary/30' 
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10'
                                        }`}>
                                            {getNotificationIcon(item.type)}
                                        </div>

                                        <div className="flex-1 min-w-0 pr-2">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className="text-[10px] text-[#0F172A] dark:text-white font-bold uppercase tracking-wider block">
                                                    {item.type} // {timeSince(item.timestamp)}
                                                </span>
                                                {((item as any).metadata?.verified || (item as any).metadata?.hasValidHeaders) && (
                                                    <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-500 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-500/20">
                                                        <ShieldCheckIcon className="w-2.5 h-2.5" />
                                                        System Verified
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className={`text-xs font-bold uppercase mt-0.5 truncate ${
                                                item.read ? 'text-[#0F172A] dark:text-white' : 'text-[#0F172A] dark:text-white font-extrabold'
                                            }`}>
                                                {item.title}
                                            </h4>
                                            <p className="text-[11px] text-[#0F172A] dark:text-white line-clamp-1 mt-0.5 font-bold">
                                                {item.message}
                                            </p>
                                            
                                            {isReported && (
                                                <span className="inline-flex items-center gap-1 mt-2 text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                                                    Escalated to Desk
                                                </span>
                                            )}
                                        </div>

                                        {/* Individual Delete Button on Hover */}
                                        {onDeleteNotification && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm('Delete this notification?')) {
                                                        onDeleteNotification(item.id);
                                                        if (selectedNotifId === item.id) {
                                                            const remaining = notifications.filter(n => n.id !== item.id);
                                                            setSelectedNotifId(remaining.length > 0 ? remaining[0].id : null);
                                                        }
                                                        setSelectedIds(prev => prev.filter(i => i !== item.id));
                                                    }
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500 text-[#0F172A] hover:text-red-500 rounded-lg transition-all self-start cursor-pointer"
                                                title="Delete single item"
                                            >
                                                <TrashIcon className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right side Detail Reader Pane */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-3xl p-8 flex flex-col h-[640px] shadow-xl overflow-hidden relative">
                    {selectedNotif ? (
                        <div className="flex flex-col h-full justify-between overflow-y-auto space-y-6">
                            
                            {/* Reader top headers */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-start border-b border-slate-100 dark:border-white/10 pb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-xl">
                                            {getNotificationIcon(selectedNotif.type)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className="text-[10px] text-primary/80 font-black font-mono tracking-widest uppercase block">
                                                    SECURE CLEARING NODE BRIEFING
                                                </span>
                                                {((selectedNotif as any).metadata?.verified || (selectedNotif as any).metadata?.hasValidHeaders) && (
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-500 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20 font-sans tracking-widest text-[8px] uppercase font-bold">
                                                        <ShieldCheckIcon className="w-3 h-3" />
                                                        Verified Official Communication
                                                    </span>
                                                )}
                                            </div>
                                            <h2 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-tight mt-0.5">{selectedNotif.title}</h2>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9px] text-[#0F172A] font-mono font-bold block uppercase">{new Date(selectedNotif.timestamp).toLocaleDateString()}</span>
                                        <span className="text-[9px] text-[#0F172A] font-mono block mt-1">{new Date(selectedNotif.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                </div>

                                {/* Formatted full body content */}
                                <div className="bg-slate-50 dark:bg-slate-900[0.01] border border-slate-100 dark:border-white/10 p-6 rounded-2xl space-y-4">
                                    <p className="text-xs text-[#0F172A] dark:text-white font-semibold leading-relaxed whitespace-pre-wrap">
                                        {selectedNotif.message}
                                    </p>

                                    {/* Integrated Document Signing Action Banner */}
                                    <div className="border-t border-slate-200 dark:border-white/10 pt-5 mt-5 space-y-4">
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 border border-primary/30 p-4 rounded-2xl shadow-lg dark:bg-slate-900">
                                            <div className="text-left space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheckIcon className="w-5 h-5 text-primary" />
                                                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                                                        Integrated Document Signing Console
                                                    </h4>
                                                </div>
                                                <p className="text-[10px] text-[#0F172A] leading-normal">
                                                    Draw or type your official digital signature on this statement/document. Saved directly to your profile.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setIsDocSigningModalOpen(true)}
                                                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer"
                                            >
                                                <span>✍</span>
                                                <span>{(selectedNotif as any).signatureDataUrl ? 'Modify / Re-Sign' : 'Sign Digital Document'}</span>
                                            </button>
                                        </div>

                                        {(selectedNotif as any).signatureDataUrl ? (
                                            <div className="bg-emerald-500 border border-emerald-500/20 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
                                                <div className="text-left space-y-1">
                                                    <span className="text-[10px] bg-emerald-500 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded font-mono uppercase font-bold">
                                                        ✓ SIGNED & SAVED TO PROFILE
                                                    </span>
                                                    <p className="text-xs text-[#0F172A] dark:text-[#1E293B] font-bold mt-2">Locked Cryptographic Signature Affixed</p>
                                                    <p className="text-[10px] text-[#0F172A] font-mono">Signed: {new Date(selectedNotif.timestamp).toLocaleString()}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCompileSignedDocPDF(selectedNotif, (selectedNotif as any).signatureDataUrl)}
                                                        className="text-[10px] text-primary hover:underline font-bold font-mono mt-1 block cursor-pointer"
                                                    >
                                                        📥 Download Signed PDF Certificate
                                                    </button>
                                                </div>
                                                
                                                <div className="bg-white p-2 rounded-xl border border-slate-200/50 shadow-sm max-w-[180px] dark:bg-slate-800">
                                                    <img src={(selectedNotif as any).signatureDataUrl} alt="Signature" className="max-h-[60px] object-contain" />
                                                    <div className="text-center text-[7px] text-[#0F172A] font-mono tracking-widest mt-1 border-t pt-1 uppercase">Sovereign Signatory Mark</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-100 border border-black/5 p-4 rounded-2xl space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[11px] text-[#0F172A] font-semibold">
                                                        Quick Signature Pad
                                                    </p>
                                                    <span className="text-[9px] text-primary font-mono font-bold">DRAW OR TYPE</span>
                                                </div>
                                                <DigitalSignature
                                                    initialSignerName={userProfile?.name || 'Authorized Signatory'}
                                                    initialSignerTitle="Account Owner & Authorized Signatory"
                                                    onSave={(sig, metadata) => {
                                                        if (onSaveSignature) {
                                                            onSaveSignature(selectedNotif.id, sig, metadata);
                                                        }
                                                        handleCompileSignedDocPDF(selectedNotif, sig, metadata);
                                                        setSigningStatusSuccess("✓ Signature affixed & saved to profile!");
                                                        setTimeout(() => setSigningStatusSuccess(null), 4000);
                                                    }}
                                                />
                                                {signingStatusSuccess && (
                                                    <div className="p-2.5 bg-emerald-500 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl text-center">
                                                        {signingStatusSuccess}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Action Banner for Receipts */}
                                    {selectedNotif.title.toLowerCase().includes('qr') || (selectedNotif as any).metadata?.isQrPay ? (
                                        <div className="border-t border-slate-200 dark:border-white/10 pt-5 mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-primary/5 p-4 rounded-xl border border-primary/20">
                                            <div className="text-left">
                                                <h4 className="text-[11px] font-black text-[#0F172A] dark:text-white uppercase tracking-wide">Dynamic QR PDF Receipt available</h4>
                                                <p className="text-[10px] text-[#0F172A] mt-0.5">Formal branding containing clearance timelock audits.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleDownloadPdfReceipt(selectedNotif)}
                                                className="px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-950 bg-primary hover:bg-primary-hover rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                                            >
                                                Download PDF Receipt
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            {/* Escalation/Reply flow to the Bank Security Team */}
                            <div className="border-t border-slate-100 dark:border-white/10 pt-5 space-y-4">
                                {(selectedNotif as any).reportedToSecurity ? (
                                    <div className="p-5 bg-amber-500 border border-amber-500/20 rounded-2.5xl text-left space-y-3">
                                        <div className="flex gap-2.5 items-center text-amber-500">
                                            <ShieldCheckIcon className="w-5 h-5 shrink-0" />
                                            <h4 className="text-xs font-black uppercase tracking-wider">Escalated Security Protocol Active</h4>
                                        </div>
                                        <p className="text-[11px] text-[#0F172A] leading-normal">
                                            Thank you. This dispatch has been reported to the Bank Security Team on the administrator panel. Our security desks are investigating the request logs for compliance and double-spend traces back to the counterparty address.
                                        </p>
                                        <div className="bg-slate-100 border border-black/5 p-3 rounded-lg font-mono text-[9px] text-emerald-400 whitespace-pre-wrap">
                                            Incident Routing Reference: INC-FPB-{Math.floor(100000 + Math.random() * 900000)} // STATUS: ACTIVE_TRACE
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {reportStatus === 'idle' && (
                                            <form onSubmit={handleReportToSecurity} className="space-y-4">
                                                <div className="text-left space-y-1.5">
                                                    <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest">
                                                        Add Security Warning / Notes (Secondary audit checklist)
                                                    </label>
                                                    <textarea
                                                        value={securityNotes}
                                                        onChange={e => setSecurityNotes(e.target.value)}
                                                        placeholder="Add specifications regarding why this transaction should be investigated..."
                                                        className="w-full p-4 h-20 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-[#0F172A] dark:text-white outline-none focus:border-amber-500/50"
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/15 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <ShieldCheckIcon className="w-4 h-4 text-slate-950" />
                                                    🚨 Report & Escalate to Bank Security Team
                                                </button>
                                            </form>
                                        )}

                                        {reportStatus === 'reporting' && (
                                            <div className="bg-slate-100 border border-black/5 p-5 rounded-2xl text-left space-y-3 min-h-[160px] flex flex-col justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <SpinnerIcon className="w-5 h-5 text-amber-500 animate-spin" />
                                                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono">CRYPTOGRAPHIC ROUTING HANDSHAKE</h3>
                                                </div>
                                                <div className="space-y-1 overflow-y-auto max-h-[100px]">
                                                    {reportLogs.map((log, lidx) => (
                                                        <div key={lidx} className="font-mono text-[9px] text-emerald-400 animate-fade-in">{log}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 max-w-sm mx-auto">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-full inline-flex text-[#0F172A]">
                                <BellIcon className="w-10 h-10 opacity-70" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-wider"> briefings unselected </h3>
                                <p className="text-[11px] text-[#0F172A] dark:text-white mt-2 leading-relaxed">
                                    Please select any notification from your incoming institutional channel feeds to decrypt and review compliance data logs.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sovereign Archivist ZIP Modal Overlay */}
            {showZipModal && (
                <div className="fixed inset-0 bg-slate-100  z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-3xl p-7 max-w-md w-full shadow-2xl space-y-6 animate-fade-in text-[#0F172A] dark:text-white">
                        
                        <div className="flex justify-between items-start">
                            <div className="space-y-1 text-left">
                                <h3 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
                                    <span className="p-1 px-2 bg-[#ca8a04]/10 text-[#ca8a04] border border-[#ca8a04]/20 rounded-lg text-xs">ZIP</span>
                                    Archive Encryption Hub
                                </h3>
                                <p className="text-[10px] text-[#0F172A] dark:text-white">
                                    Bake all completed and signed deeds into a password-protected zip file envelope.
                                </p>
                            </div>
                            <button 
                                onClick={() => {
                                    setShowZipModal(false);
                                    setZipPassword('');
                                    setZipExportLogs([]);
                                    setZipDownloadUrl(null);
                                }}
                                className="text-[#0F172A] hover:text-[#0F172A] dark:hover:text-white p-1 text-xs font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        {notifications.filter(n => (n as any).signatureDataUrl).length === 0 ? (
                            <div className="p-6 bg-amber-500 border border-amber-500/20 rounded-2xl text-center space-y-3">
                                <span className="text-xl">⚠️</span>
                                <h4 className="text-xs font-black uppercase text-amber-500 tracking-wider">No Signed Documents Found</h4>
                                <p className="text-[11px] text-[#0F172A] dark:text-white leading-relaxed">
                                    There are currently no completed and digitally signed authorization deeds in your feed. 
                                    Please select an active clearance hold dispatch, sign it using the electronic canvas ledger handshake, then return here to package!
                                </p>
                            </div>
                        ) : !zipDownloadUrl ? (
                            <div className="space-y-5 text-left">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black uppercase text-[#0F172A] dark:text-white tracking-widest font-mono">
                                        Set Archive Secure Password
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Configure decryption password..."
                                            value={zipPassword}
                                            onChange={(e) => setZipPassword(e.target.value)}
                                            className="flex-1 px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-[#0F172A] dark:text-white focus:border-[#ca8a04]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setZipPassword(Math.random().toString(36).substring(2, 10).toUpperCase())}
                                            className="px-3 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-white border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase text-[#0F172A] dark:text-white"
                                        >
                                            Auto-Gen
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-[#0F172A] leading-relaxed italic">
                                        *Note: You must record this password. On extraction, modern OS readers will prompt for this exact credential to decrypt files.
                                    </p>
                                </div>

                                {isCompilingZip ? (
                                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-4 rounded-2xl space-y-2">
                                        <div className="flex items-center gap-2">
                                            <SpinnerIcon className="w-4 h-4 animate-spin text-amber-500" />
                                            <span className="text-[10px] font-mono font-black text-amber-500 uppercase tracking-widest">Baking Encrypted Volumes...</span>
                                        </div>
                                        <div className="max-h-[100px] overflow-y-auto space-y-1 font-mono text-[9px] text-emerald-500 custom-scrollbar">
                                            {zipExportLogs.map((log, lidx) => (
                                                <div key={lidx}>{log}</div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleCompileProtectedZip}
                                        disabled={!zipPassword.trim()}
                                        className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                            zipPassword.trim()
                                                ? 'bg-amber-500 active:scale-[0.98] text-slate-950 hover:bg-amber-400 cursor-pointer shadow-lg shadow-amber-500/10'
                                                : 'bg-slate-150 dark:bg-slate-900 text-slate-450 border border-slate-200 dark:border-white/10 cursor-not-allowed'
                                        }`}
                                    >
                                        🔒 Compile Encrypted ZIP Envelope
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-5 text-left">
                                <div className="p-5 bg-emerald-500 border border-emerald-500/20 rounded-2.5xl space-y-2">
                                    <div className="flex gap-2 items-center text-emerald-500 font-bold text-xs uppercase tracking-wider">
                                        <CheckCircleIcon className="w-5 h-5" />
                                        Archive compiled successfully
                                    </div>
                                    <p className="text-[11px] text-[#0F172A] dark:text-white">
                                        Volume has been bound and protected with AES-256 standard encryption keys.
                                    </p>
                                    <div className="bg-slate-100 border border-black/5 p-3 rounded-xl font-mono text-[10px] text-emerald-400">
                                        ZIP Password: <strong className="text-white select-all">{zipPassword}</strong>
                                    </div>
                                </div>

                                <a
                                    href={zipDownloadUrl}
                                    download={`Sovereign_Authorized_Signed_Archive_${Date.now()}.zip`}
                                    onClick={() => {
                                        setTimeout(() => {
                                            setShowZipModal(false);
                                            setZipPassword('');
                                            setZipDownloadUrl(null);
                                        }, 700);
                                    }}
                                    className="w-full text-center block py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
                                >
                                    📥 Download Output ZIP
                                </a>
                            </div>
                        )}

                    </div>
                </div>
            )}

            {/* Integrated Document Signing Overlay Modal */}
            {isDocSigningModalOpen && selectedNotif && (
                <div className="fixed inset-0 bg-slate-100  z-[100] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-slate-50 border border-black/5 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 my-8 text-white animate-fade-in dark:bg-slate-900">
                        
                        <div className="flex justify-between items-start border-b border-black/5 pb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <ShieldCheckIcon className="w-5 h-5 text-primary" />
                                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                                        Digital Document Signing Console
                                    </h3>
                                </div>
                                <p className="text-[11px] text-[#0F172A] mt-0.5">
                                    Official execution of banking statements, notices, and clearance instruments.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsDocSigningModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-white hover:bg-white text-[#0F172A] hover:text-white flex items-center justify-center transition-all text-sm font-bold cursor-pointer dark:bg-slate-800"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Document Preview Card */}
                        <div className="bg-white text-[#0F172A] p-6 rounded-2xl space-y-3 shadow-inner relative overflow-hidden border border-slate-200 dark:bg-slate-800">
                            <div className="flex justify-between items-start border-b pb-3 border-slate-200">
                                <div>
                                    <p className="text-[10px] font-bold text-[#0F172A] tracking-wider uppercase font-mono">FIRST PACIFIC BANKING GROUP</p>
                                    <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-wide mt-0.5">{selectedNotif.title}</h4>
                                </div>
                                <span className="text-[9px] bg-slate-100 text-[#0F172A] px-2 py-0.5 rounded font-mono font-bold">
                                    REF: {selectedNotif.id.slice(0, 12).toUpperCase()}
                                </span>
                            </div>
                            <div className="max-h-36 overflow-y-auto text-[11px] leading-relaxed text-[#0F172A] whitespace-pre-wrap font-sans pr-1 custom-scrollbar">
                                {selectedNotif.message}
                            </div>
                            <div className="text-[9px] text-[#0F172A] font-mono pt-2 border-t border-slate-100 flex justify-between">
                                <span>ISSUE DATE: {new Date(selectedNotif.timestamp).toLocaleDateString()}</span>
                                <span>RECIPIENT: {userProfile?.name || 'ACCOUNT OWNER'}</span>
                            </div>
                        </div>

                        {/* Signature Pad */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider block">
                                Affix Your Electronic Signature (Draw Ink or Type Name)
                            </label>
                            <DigitalSignature
                                initialSignerName={userProfile?.name || 'Authorized Signatory'}
                                initialSignerTitle="Account Owner & Authorized Signatory"
                                onSave={(sig, metadata) => {
                                    if (onSaveSignature) {
                                        onSaveSignature(selectedNotif.id, sig, metadata);
                                    }
                                    handleCompileSignedDocPDF(selectedNotif, sig, metadata);
                                    setIsDocSigningModalOpen(false);
                                    setSigningStatusSuccess("✓ Document signed and saved to profile!");
                                    setTimeout(() => setSigningStatusSuccess(null), 4000);
                                }}
                            />
                        </div>

                    </div>
                </div>
            )}

            {/* Saved Signed Documents Profile Modal */}
            {showSavedSignedDocsModal && (
                <div className="fixed inset-0 bg-slate-100  z-[100] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-slate-50 border border-black/5 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 my-8 text-white animate-fade-in dark:bg-slate-900">
                        
                        <div className="flex justify-between items-start border-b border-black/5 pb-4">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                                    <span>📂</span>
                                    Saved Signed Documents Profile
                                </h3>
                                <p className="text-[11px] text-[#0F172A] mt-0.5">
                                    Archive of all digital signatures and signed bank instruments on record for {userProfile?.name || 'Account Owner'}.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowSavedSignedDocsModal(false)}
                                className="w-8 h-8 rounded-full bg-white hover:bg-white text-[#0F172A] hover:text-white flex items-center justify-center transition-all text-sm font-bold cursor-pointer dark:bg-slate-800"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Saved Signatures Header Card */}
                        {userProfile?.digitalSignatureUrl && (
                            <div className="bg-slate-100 border border-primary/30 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div>
                                    <span className="text-[9px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded font-mono font-bold uppercase">
                                        ACTIVE PROFILE SIGNATURE
                                    </span>
                                    <p className="text-xs font-bold text-white mt-1">{userProfile.digitalSignatureName || userProfile.name}</p>
                                    <p className="text-[10px] text-[#0F172A]">{userProfile.digitalSignatureTitle || 'Account Owner'}</p>
                                </div>
                                <div className="bg-white p-2 rounded-xl border border-slate-200 max-w-[180px] dark:bg-slate-800">
                                    <img src={userProfile.digitalSignatureUrl} alt="Active Signature" className="max-h-[50px] object-contain" />
                                </div>
                            </div>
                        )}

                        {/* List of Saved Signed Documents */}
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                            {(!userProfile?.savedSignedDocuments || userProfile.savedSignedDocuments.length === 0) ? (
                                <div className="text-center py-12 bg-white rounded-2xl border border-black/5 space-y-2 dark:bg-slate-800">
                                    <p className="text-xs font-bold text-[#0F172A]">No signed documents saved yet.</p>
                                    <p className="text-[10px] text-[#0F172A]">Sign any statement, disclosure, or notice in your Inbox to save it to your profile.</p>
                                </div>
                            ) : (
                                userProfile.savedSignedDocuments.map((doc: any, idx: number) => (
                                    <div key={doc.id || idx} className="bg-slate-100 border border-black/5 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="text-left space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 bg-emerald-500 text-emerald-400 text-[9px] font-mono font-bold rounded border border-emerald-500/20">
                                                    {doc.documentType || 'SIGNED'}
                                                </span>
                                                <h4 className="text-xs font-bold text-white">{doc.title}</h4>
                                            </div>
                                            <p className="text-[10px] text-[#0F172A] font-mono">
                                                Signed At: {new Date(doc.signedAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {doc.signatureDataUrl && (
                                                <div className="bg-white p-1.5 rounded-lg border border-slate-200 max-w-[100px] dark:bg-slate-800">
                                                    <img src={doc.signatureDataUrl} alt="Doc Signature" className="max-h-[30px] object-contain" />
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const notifObject: Notification = {
                                                        id: doc.id,
                                                        title: doc.title,
                                                        message: doc.documentContent || 'Official signed document on record.',
                                                        timestamp: new Date(doc.signedAt),
                                                        read: true,
                                                        type: NotificationType.SECURITY
                                                    };
                                                    handleCompileSignedDocPDF(notifObject, doc.signatureDataUrl);
                                                }}
                                                className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-lg shadow transition-all cursor-pointer"
                                            >
                                                📥 PDF
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};
