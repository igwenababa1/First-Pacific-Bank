import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserProfile, Transaction, Account, TransactionStatus } from '../types';
import { generateQrCodeDataUrl } from './pdfWatermarkAndQr';

export interface GenerateStatementOptions {
    userProfile: UserProfile;
    accounts: Account[];
    transactions: Transaction[];
    selectedAccountId?: string; // 'ALL' or account.id
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    presetName?: string; // e.g. "October 2024", "Last 30 Days", "Year to Date"
    download?: boolean;  // default true
    onProgress?: (msg: string) => void;
}

/**
 * Generates an authentic, high-fidelity US Bank Account Activity Statement PDF using jsPDF and autoTable.
 */
export const generateUsBankStatementPDF = async (options: GenerateStatementOptions): Promise<jsPDF> => {
    const {
        userProfile,
        accounts = [],
        transactions = [],
        selectedAccountId = 'ALL',
        startDate,
        endDate,
        presetName,
        download = true,
        onProgress
    } = options;

    if (onProgress) onProgress("Initializing bank document engine...");

    const pdf = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'portrait' });
    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

    // 1. Resolve Target Accounts & Selected Account details
    const selectedAccountObj = selectedAccountId !== 'ALL' 
        ? accounts.find(a => a.id === selectedAccountId) 
        : null;

    const accountNameLabel = selectedAccountObj 
        ? `${selectedAccountObj.type || 'Account'} (•••• ${selectedAccountObj.accountNumber ? selectedAccountObj.accountNumber.slice(-4) : '4821'})`
        : 'Consolidated Accounts Portfolio';

    // 2. Filter Transactions by Account and Date Range
    const startDateTime = new Date(`${startDate}T00:00:00`).getTime();
    const endDateTime = new Date(`${endDate}T23:59:59`).getTime();

    let accountFilteredTxs = transactions;
    if (selectedAccountId !== 'ALL') {
        accountFilteredTxs = transactions.filter(tx => 
            tx.accountId === selectedAccountId
        );
    }

    const inRangeTxs = accountFilteredTxs.filter(tx => {
        const txDateStr = tx.statusTimestamps?.[TransactionStatus.SUBMITTED] 
            || tx.statusTimestamps?.['Submitted'] 
            || Date.now();
        const time = new Date(txDateStr).getTime();
        return time >= startDateTime && time <= endDateTime;
    });

    // Sort chronologically (oldest to newest) to build running ledger balances correctly
    const chronologicalTxs = [...inRangeTxs].sort((a, b) => {
        const timeA = new Date(a.statusTimestamps?.[TransactionStatus.SUBMITTED] || a.statusTimestamps?.['Submitted'] || Date.now()).getTime();
        const timeB = new Date(b.statusTimestamps?.[TransactionStatus.SUBMITTED] || b.statusTimestamps?.['Submitted'] || Date.now()).getTime();
        return timeA - timeB;
    });

    // 3. Compute Summary Statistics and Running Balances
    const currentEndingBalance = selectedAccountObj 
        ? selectedAccountObj.balance 
        : accounts.reduce((sum, a) => sum + a.balance, 0);

    let totalCredits = 0;
    let creditsCount = 0;
    let totalDebits = 0;
    let debitsCount = 0;

    chronologicalTxs.forEach(tx => {
        const amount = Number(tx.sendAmount || 0);
        const isCredit = tx.type === 'credit';
        if (isCredit) {
            totalCredits += amount;
            creditsCount++;
        } else {
            totalDebits += amount;
            debitsCount++;
        }
    });

    const calculatedStartingBalance = currentEndingBalance - totalCredits + totalDebits;

    // Build row data with running balances (displaying newest first in final table)
    let running = calculatedStartingBalance;
    const txRowsWithBalance = chronologicalTxs.map(tx => {
        const amount = Number(tx.sendAmount || 0);
        const isCredit = tx.type === 'credit';
        if (isCredit) {
            running += amount;
        } else {
            running -= amount;
        }
        return {
            tx,
            isCredit,
            amount,
            runningBalance: running
        };
    });

    // Display newest transactions at top of statement table (US Bank Standard)
    const displayRows = [...txRowsWithBalance].reverse();

    if (onProgress) onProgress("Rendering branded headers and executive metrics...");

    // Helper formatting utilities
    const formatMoney = (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatDateStr = (dateInput: string | Date) => {
        const d = new Date(dateInput);
        return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    };

    // --- PAGE 1 HEADER & BRANDING ---
    // Top Dark Blue Header Bar
    pdf.setFillColor(15, 23, 42); // slate-900 / navy
    pdf.rect(0, 0, pageWidth, 28, 'F');

    // Bank Title
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("FIRST PACIFIC BANK", 14, 14);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(203, 213, 225); // slate-300
    pdf.text("MEMBER FDIC • EQUAL HOUSING LENDER • SOVEREIGN PRIVATE BANKING", 14, 21);

    // Document Title on Top Right
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(16, 185, 129); // Emerald-500
    pdf.text("ACCOUNT ACTIVITY STATEMENT", pageWidth - 14, 14, { align: 'right' });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(203, 213, 225);
    pdf.text(`REF: FPB-STMT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`, pageWidth - 14, 21, { align: 'right' });

    // --- CUSTOMER & STATEMENT METADATA GRID ---
    const metadataStartY = 34;

    // Left Box: Customer Info
    pdf.setFillColor(248, 250, 252); // slate-50
    pdf.rect(14, metadataStartY, 88, 30, 'F');
    pdf.setDrawColor(226, 232, 240); // slate-200
    pdf.setLineWidth(0.3);
    pdf.rect(14, metadataStartY, 88, 30, 'D');

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.text("ACCOUNT HOLDER & ADDRESS", 18, metadataStartY + 6);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42); // slate-900
    pdf.text(userProfile.name || "Valued Account Holder", 18, metadataStartY + 12);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(userProfile.address || "500 Park Avenue, Suite 1200\nNew York, NY 10022", 18, metadataStartY + 17);
    pdf.text(`Account No: ${accountNameLabel}`, 18, metadataStartY + 26);

    // Right Box: Statement Details
    pdf.setFillColor(248, 250, 252);
    pdf.rect(108, metadataStartY, 88, 30, 'F');
    pdf.rect(108, metadataStartY, 88, 30, 'D');

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text("STATEMENT PERIOD & DETAILS", 112, metadataStartY + 6);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`Period: ${formatDateStr(startDate)} — ${formatDateStr(endDate)}`, 112, metadataStartY + 12);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Statement Date: ${new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`, 112, metadataStartY + 17);
    pdf.text(`ABA Routing Number: 021000021`, 112, metadataStartY + 21);
    pdf.text(`24/7 Support: 1-800-555-0199 | FPB Node`, 112, metadataStartY + 26);

    // --- ACCOUNT ACTIVITY EXECUTIVE SUMMARY BAR ---
    const summaryStartY = 68;
    pdf.setFillColor(15, 23, 42);
    pdf.rect(14, summaryStartY, 182, 6, 'F');
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(255, 255, 255);
    pdf.text("ACCOUNT SUMMARY OVERVIEW", 18, summaryStartY + 4.2);

    const summaryBoxY = summaryStartY + 6;
    pdf.setFillColor(255, 255, 255);
    pdf.rect(14, summaryBoxY, 182, 18, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.rect(14, summaryBoxY, 182, 18, 'D');

    // 5 Columns: Start | Deposits | Withdrawals | Fees | Ending
    const colW = 182 / 5;
    const summaries = [
        { label: "STARTING BALANCE", val: formatMoney(calculatedStartingBalance), color: [15, 23, 42] },
        { label: `DEPOSITS (${creditsCount})`, val: `+${formatMoney(totalCredits)}`, color: [16, 185, 129] },
        { label: `DEBITS (${debitsCount})`, val: `-${formatMoney(totalDebits)}`, color: [225, 29, 72] },
        { label: "FEES CHARGED", val: "$0.00", color: [100, 116, 139] },
        { label: "ENDING BALANCE", val: formatMoney(currentEndingBalance), color: [15, 23, 42] },
    ];

    summaries.forEach((s, idx) => {
        const x = 14 + idx * colW;
        if (idx > 0) {
            pdf.setDrawColor(226, 232, 240);
            pdf.line(x, summaryBoxY, x, summaryBoxY + 18);
        }
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(6);
        pdf.setTextColor(100, 116, 139);
        pdf.text(s.label, x + colW / 2, summaryBoxY + 5, { align: 'center' });

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8.5);
        pdf.setTextColor(s.color[0], s.color[1], s.color[2]);
        pdf.text(s.val, x + colW / 2, summaryBoxY + 13, { align: 'center' });
    });

    if (onProgress) onProgress("Formatting itemized transaction ledger...");

    // --- ITEMIZED TRANSACTIONS TABLE USING AUTOTABLE ---
    const tableHead = [["DATE", "TRANSACTION DESCRIPTION & DETAILS", "TYPE / METHOD", "AMOUNT ($)", "BALANCE ($)"]];

    const tableBody = displayRows.length === 0 ? [
        ["—", "No transaction activity recorded for this period.", "N/A", "$0.00", formatMoney(calculatedStartingBalance)]
    ] : displayRows.map(row => {
        const dateFormatted = formatDateStr(
            row.tx.statusTimestamps?.[TransactionStatus.SUBMITTED] 
            || row.tx.statusTimestamps?.['Submitted'] 
            || Date.now()
        );

        let desc = row.tx.description || 'Account Transfer';
        if (row.tx.recipient?.fullName) {
            desc += ` • To: ${row.tx.recipient.fullName}`;
        } else if (row.tx.recipient?.accountNumber) {
            desc += ` • Acct: ${row.tx.recipient.accountNumber}`;
        }
        if (row.tx.id) {
            desc += ` (Ref: ${row.tx.id.slice(0, 12)})`;
        }

        const method = row.tx.transferMethod || (row.isCredit ? 'DEPOSIT' : 'ACH');
        const amountFormatted = `${row.isCredit ? '+' : '-'}${formatMoney(row.amount)}`;
        const balanceFormatted = formatMoney(row.runningBalance);

        return [
            dateFormatted,
            desc,
            method.toUpperCase(),
            amountFormatted,
            balanceFormatted
        ];
    });

    // Execute autoTable
    (autoTable as any)(pdf, {
        head: tableHead,
        body: tableBody,
        startY: 96,
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontSize: 7.5,
            cellPadding: 2.8,
            overflow: 'linebreak'
        },
        headStyles: {
            fillColor: [15, 23, 42], // Slate 900
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'left',
            fontSize: 7.5
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252] // Slate 50
        },
        columnStyles: {
            0: { cellWidth: 24 }, // Date
            1: { cellWidth: 82 }, // Description
            2: { cellWidth: 28 }, // Type
            3: { cellWidth: 24, halign: 'right', fontStyle: 'bold' }, // Amount
            4: { cellWidth: 24, halign: 'right', fontStyle: 'bold' }  // Balance
        },
        didParseCell: (data: any) => {
            // Highlight credit amounts in green text
            if (data.section === 'body' && data.column.index === 3) {
                const cellText = data.cell.raw || '';
                if (cellText.startsWith('+')) {
                    data.cell.styles.textColor = [16, 185, 129]; // Emerald 500
                } else if (cellText.startsWith('-')) {
                    data.cell.styles.textColor = [30, 41, 59]; // Slate 800
                }
            }
        },
        margin: { top: 32, left: 14, right: 14, bottom: 38 }
    });

    if (onProgress) onProgress("Applying security stamps, watermarks, and verification QR code...");

    // --- WATERMARKS, FOOTERS, AND VERIFICATION SEALS ACROSS ALL PAGES ---
    const totalPages = (pdf as any).internal.getNumberOfPages();

    for (let p = 1; p <= totalPages; p++) {
        pdf.setPage(p);

        // Background Faint Watermark
        pdf.setTextColor(241, 245, 249); // slate-100
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(32);
        pdf.text("FIRST PACIFIC BANK", pageWidth / 2, pageHeight / 2 - 10, { align: 'center', angle: 35 });
        pdf.setFontSize(12);
        pdf.text("OFFICIAL VERIFIED ACCOUNT STATEMENT", pageWidth / 2, pageHeight / 2 + 5, { align: 'center', angle: 35 });

        // Header repetition on page 2+
        if (p > 1) {
            pdf.setFillColor(15, 23, 42);
            pdf.rect(0, 0, pageWidth, 18, 'F');
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(10);
            pdf.setTextColor(255, 255, 255);
            pdf.text("FIRST PACIFIC BANK — ACCOUNT STATEMENT", 14, 12);

            pdf.setFontSize(8);
            pdf.setTextColor(16, 185, 129);
            pdf.text(`Period: ${formatDateStr(startDate)} to ${formatDateStr(endDate)}`, pageWidth - 14, 12, { align: 'right' });
        }

        // Bottom Footer Line
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);

        // Footer Text
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6.5);
        pdf.setTextColor(148, 163, 184); // slate-400
        pdf.text("CONFIDENTIAL RECORD • FIRST PACIFIC BANCSHARES INC. • MEMBER FDIC • EQUAL HOUSING LENDER • ISO-20022 CERTIFIED", 14, pageHeight - 10);

        // Page Number
        pdf.setFont("helvetica", "bold");
        pdf.text(`Page ${p} of ${totalPages}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
    }

    // --- LAST PAGE CERTIFICATION & REGULATORY NOTICE BLOCK ---
    pdf.setPage(totalPages);

    const finalY = (pdf as any).lastAutoTable ? Math.min((pdf as any).lastAutoTable.finalY + 10, pageHeight - 65) : pageHeight - 65;

    // Regulatory Notice Box
    if (finalY + 35 < pageHeight - 18) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(14, finalY, 128, 28, 'F');
        pdf.setDrawColor(226, 232, 240);
        pdf.rect(14, finalY, 128, 28, 'D');

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(6.5);
        pdf.setTextColor(15, 23, 42);
        pdf.text("IN CASE OF ERRORS OR DISCREPANCIES (REGULATION E DISCLOSURE)", 18, finalY + 5);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(5.5);
        pdf.setTextColor(100, 116, 139);
        const disclosureText = "Call or write us immediately if you think your statement is wrong or if you need more information about a transfer listed on the statement. We must hear from you no later than 60 days after we sent the FIRST statement on which the problem or error appeared. Telephone customer service at 1-800-555-0199 or write First Pacific Bank Disclosures Desk, 500 Park Avenue, NY 10022.";
        const splitText = pdf.splitTextToSize(disclosureText, 120);
        pdf.text(splitText, 18, finalY + 9);

        // Verification QR Code & Official Gold Seal on Right Side of Last Page
        const qrOriginHost = typeof window !== 'undefined' ? window.location.origin : 'https://firstpacificbank.com';
        const verifyUrl = `${qrOriginHost}/verify?doc=STMT&user=${encodeURIComponent(userProfile.name || 'Client')}&ref=${Date.now()}`;
        const qrDataUrl = await generateQrCodeDataUrl(verifyUrl, 120);

        if (qrDataUrl) {
            pdf.addImage(qrDataUrl, 'PNG', 152, finalY, 26, 26);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(5.5);
            pdf.setTextColor(16, 185, 129);
            pdf.text("SCAN TO VERIFY LEDGER", 165, finalY + 28, { align: 'center' });
        }
    }

    if (download) {
        if (onProgress) onProgress("Saving PDF document...");
        const fileName = `FPB_Account_Statement_${startDate}_to_${endDate}.pdf`;
        pdf.save(fileName);
    }

    return pdf;
};
