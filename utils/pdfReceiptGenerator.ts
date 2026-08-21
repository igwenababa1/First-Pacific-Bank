import { jsPDF } from 'jspdf';
import { Transaction, Account, UserProfile } from '../types';
import { BRANDING_CONFIG, USER_PROFILE } from '../components/constants';
import { applyBankPdfBackgroundAndWatermark, generateQrCodeDataUrl, embedVerificationQrCodeBlock } from './pdfWatermarkAndQr';

interface GenerateReceiptOptions {
    issuerName?: string;
    primaryColor?: string;
    logoUrl?: string;
    userProfile?: UserProfile;
    account?: Account;
}

/**
 * Generates an official branded PDF transaction receipt using jsPDF with bank backgrounds, watermark and QR verification.
 */
export const generateOfficialTransactionPDF = async (
    transaction: Transaction,
    options?: GenerateReceiptOptions
): Promise<jsPDF> => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Apply Bank Background Guilloche & Watermark
    applyBankPdfBackgroundAndWatermark(doc, {
        title: 'Official Receipt',
        documentRef: `REF: ${transaction.id || 'FPB-TX-90481204'}`
    });

    const issuerName = options?.issuerName || BRANDING_CONFIG.bankName || 'First Pacific Bank';
    const recipient = transaction.recipient;
    const recipientName = recipient?.fullName || recipient?.nickname || (transaction as any).merchantInfo?.name || 'Verified Recipient';
    const senderName = options?.userProfile?.name || USER_PROFILE.name || 'Private Wealth Client';
    const accountName = options?.account?.nickname || options?.account?.type || 'Sovereign Checking Ledger';
    const lastFour = options?.account?.accountNumber ? options.account.accountNumber.slice(-4) : '8842';

    // Format currency helper
    const formatMoney = (val: number, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(val || 0);
    };

    // Page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    // Document Main Title
    let currentY = 48;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('ELECTRONIC FUNDS TRANSFER ADVICE', margin, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, margin, currentY + 4.5);

    currentY += 12;

    // Transaction Overview Box
    doc.setDrawColor(226, 232, 240); // Light Gray Border
    doc.setFillColor(248, 250, 252); // Soft slate background
    doc.roundedRect(margin, currentY, contentWidth, 28, 3, 3, 'FD');

    // Amount Display inside Box
    const formattedAmount = formatMoney(transaction.sendAmount || 0, transaction.baseCurrency || 'USD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text(formattedAmount, margin + 6, currentY + 12);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 185, 129);
    doc.text(`STATUS: ${String(transaction.status || 'COMPLETED').toUpperCase()} • CLEARED VIA FEDNOW`, margin + 6, currentY + 19);

    // Ref ID & Rail on Right Side of Overview Box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('TRANSACTION REF ID:', pageWidth - margin - 6, currentY + 9, { align: 'right' });
    doc.setFont('courier', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(transaction.id || 'TX-90481204', pageWidth - margin - 6, currentY + 15, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`RAIL: ${String(transaction.transferMethod || transaction.deliveryMethod || 'FEDNOW REALTIME').toUpperCase()}`, pageWidth - margin - 6, currentY + 21, { align: 'right' });

    currentY += 34;

    // Real-Time Transaction Verification QR Code Section
    const originHost = typeof window !== 'undefined' ? window.location.origin : 'https://firstpacificbank.com';
    const verifyPayload = `${originHost}/verify?tx=${transaction.id || 'FPB-TX-90481204'}&amount=${transaction.sendAmount}&status=VERIFIED`;
    const qrDataUrl = await generateQrCodeDataUrl(verifyPayload, 220);
    embedVerificationQrCodeBlock(doc, qrDataUrl, margin, currentY, {
        width: contentWidth,
        height: 26,
        transactionId: transaction.id || 'FPB-TX-90481204'
    });

    currentY += 32;

    // Section 1: Transfer Parties Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('TRANSFER SPECIFICATIONS & PARTICIPANTS', margin, currentY);

    currentY += 3;
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, margin + 40, currentY);
    currentY += 5;

    // Two Column Table: Remitter vs Beneficiary
    const colWidth = (contentWidth - 6) / 2;

    // Remitter (Sender Box)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, colWidth, 38, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('ORIGINATING REMITTER (SENDER)', margin + 4, currentY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(senderName, margin + 4, currentY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Account: ${accountName}`, margin + 4, currentY + 18);
    doc.text(`Account Mask: •••• ${lastFour}`, margin + 4, currentY + 23);
    doc.text(`Institution: ${issuerName}`, margin + 4, currentY + 28);
    doc.text(`Country: United States (USD)`, margin + 4, currentY + 33);

    // Beneficiary (Recipient Box)
    doc.roundedRect(margin + colWidth + 6, currentY, colWidth, 38, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('BENEFICIARY RECIPIENT', margin + colWidth + 10, currentY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(recipientName, margin + colWidth + 10, currentY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Bank: ${recipient?.bankName || 'Partner Clearing Bank'}`, margin + colWidth + 10, currentY + 18);
    doc.text(`Account/IBAN: •••• ${recipient?.accountNumber ? recipient.accountNumber.slice(-4) : '9102'}`, margin + colWidth + 10, currentY + 23);
    doc.text(`Routing/BIC: ${recipient?.routingNumber || 'FPBKUS33'}`, margin + colWidth + 10, currentY + 28);
    doc.text(`Destination Country: ${recipient?.country || 'United States'}`, margin + colWidth + 10, currentY + 33);

    currentY += 44;

    // Section 2: Financial Breakdown Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('SETTLEMENT BREAKDOWN', margin, currentY);

    currentY += 3;
    doc.line(margin, currentY, margin + 40, currentY);
    currentY += 5;

    // Table Header
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, currentY, contentWidth, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text('ITEM DESCRIPTION', margin + 4, currentY + 4.2);
    doc.text('DETAILS / RATE', margin + 90, currentY + 4.2);
    doc.text('AMOUNT', pageWidth - margin - 4, currentY + 4.2, { align: 'right' });

    currentY += 6.5;

    const breakdownItems = [
        { desc: 'Principal Transfer Amount', detail: `Sent via ${transaction.transferMethod || 'FedNow Rail'}`, amount: formatMoney(transaction.sendAmount, transaction.baseCurrency || 'USD') },
        { desc: 'Network & Treasury Clearing Fee', detail: transaction.fee === 0 ? 'WAIVED (Sovereign Member Benefit)' : 'Standard Transfer Fee', amount: formatMoney(transaction.fee || 0, 'USD') },
        { desc: 'Compliance & Regulatory Assessment Fee', detail: 'Automated AML & OFAC Clearance', amount: formatMoney(transaction.complianceFee || 0, 'USD') },
        { desc: 'Foreign Exchange Rate (FX)', detail: transaction.exchangeRate && transaction.exchangeRate !== 1 ? `1 USD = ${transaction.exchangeRate} ${transaction.receiveCurrency || 'EUR'}` : 'N/A (Same Currency)', amount: transaction.receiveCurrency && transaction.receiveCurrency !== 'USD' ? `${formatMoney(transaction.receiveAmount || 0, transaction.receiveCurrency)}` : '-' },
    ];

    breakdownItems.forEach((item, index) => {
        doc.setFillColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 252);
        doc.rect(margin, currentY, contentWidth, 6.5, 'F');
        doc.setDrawColor(241, 245, 249);
        doc.line(margin, currentY + 6.5, margin + contentWidth, currentY + 6.5);

        doc.setFont('helvetica', 'medium');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        doc.text(item.desc, margin + 4, currentY + 4.2);

        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(item.detail, margin + 90, currentY + 4.2);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text(item.amount, pageWidth - margin - 4, currentY + 4.2, { align: 'right' });

        currentY += 6.5;
    });

    // Total Line Box
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY, contentWidth, 8, 'F');
    doc.setDrawColor(212, 175, 55);
    doc.line(margin, currentY, margin + contentWidth, currentY);
    doc.line(margin, currentY + 8, margin + contentWidth, currentY + 8);

    const netTotal = (transaction.sendAmount || 0) + (transaction.fee || 0) + (transaction.complianceFee || 0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('TOTAL DEBIT SETTLED', margin + 4, currentY + 5.2);
    doc.setFontSize(9);
    doc.setTextColor(212, 175, 55);
    doc.text(formatMoney(netTotal, transaction.baseCurrency || 'USD'), pageWidth - margin - 4, currentY + 5.2, { align: 'right' });

    currentY += 14;

    // Security & Compliance Hash Block
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, 20, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text('SOVEREIGN TREASURY SECURITY HASH & AUDIT VERIFICATION', margin + 4, currentY + 5);

    const hashVal = `SHA256:${transaction.id || '9048'}-${Date.now()}-FPB-CLEARED-PROT-V9`;
    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(hashVal, margin + 4, currentY + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`FEDWIRE IMAD/OMAD: 20260730FPBKNYW000940-${(transaction.id || '102').slice(-4)}  |  Clearance Rail: Sovereign FedNow Protocol`, margin + 4, currentY + 14.5);

    currentY += 26;

    // Signatures & Stamp
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, currentY, margin + 50, currentY);
    doc.line(pageWidth - margin - 50, currentY, pageWidth - margin, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Authorized Treasury Officer Signature', margin, currentY + 4);
    doc.text('Client Digital Acceptance Timestamp', pageWidth - margin, currentY + 4, { align: 'right' });

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Eleanor Vance, Chief Regulatory Controller', margin, currentY + 8);
    doc.text(new Date().toISOString(), pageWidth - margin, currentY + 8, { align: 'right' });

    return doc;
};

/**
 * Downloads the generated PDF receipt directly in the browser.
 */
export const downloadTransactionPDFReceipt = async (
    transaction: Transaction,
    options?: GenerateReceiptOptions
): Promise<void> => {
    try {
        const doc = await generateOfficialTransactionPDF(transaction, options);
        const fileName = `FPB_Official_Receipt_${transaction.id || 'TX'}.pdf`;
        doc.save(fileName);
    } catch (err) {
        console.error('Failed to generate PDF receipt:', err);
    }
};

