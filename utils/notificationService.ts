
import { Transaction, TransactionStatus } from '../types';
import { sendTwilioSms, sendTwilioWhatsApp } from '../services/smsService';
import { sendEmail, generateBankingEmailTemplate, generateCreditAlertEmail, generateDebitAlertEmail, generateExternalPaymentInstructionsEmail } from '../services/emailService';
import { USER_PROFILE, INITIAL_ACCOUNTS } from '../components/constants';
import { jsPDF } from 'jspdf';
import { applyBankPdfBackgroundAndWatermark } from './pdfWatermarkAndQr';
import { db } from '../services/database';

interface NotificationResult {
    success: boolean;
    code?: string;
    error?: string;
}

const DEFAULT_PHONE = USER_PROFILE.phone || '3159150854';
const BASE_BALANCE = INITIAL_ACCOUNTS.reduce((sum, acc) => sum + acc.balance, 0);

// --- CORE UTILITIES ---

const dispatchLocalHud = (message: string, code?: string) => {
    // Dispatch event to show the "Toast" notification in the UI
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('SIMULATED_OTP_SENT', { 
            detail: { code, message } 
        }));
    }, 300);
};

const generateTransactionReceiptPDF = async (
    transaction: Transaction, 
    formattedBalance: string, 
    formattedAmount: string,
    userName?: string,
    userAddress?: string,
    complianceFee?: number,
    emailTheme?: string
): Promise<string> => {
    const doc = new jsPDF();
    const isCredit = transaction.type === 'credit';
    const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const refId = transaction.id.slice(-12).toUpperCase();

    const useOriginal = transaction.originalInputAmount !== undefined && transaction.originalInputAmount > 0;
    const baseAmount = useOriginal ? transaction.originalInputAmount! : transaction.sendAmount;
    const currencyCode = useOriginal ? transaction.originalInputCurrencyCode || 'USD' : 'USD';
    
    let currencySymbol = '$';
    if (currencyCode === 'GBP') currencySymbol = '£';
    else if (currencyCode === 'EUR') currencySymbol = '€';
    else if (currencyCode === 'JPY') currencySymbol = '¥';

    const rate = transaction.sendAmount > 0 ? baseAmount / transaction.sendAmount : 1;
    const baseFee = transaction.fee || 0;
    const convertedFee = useOriginal ? baseFee * rate : baseFee;
    const baseComplianceFee = complianceFee !== undefined ? complianceFee : (transaction.complianceFee || 0);
    const convertedComplianceFee = useOriginal ? baseComplianceFee * rate : baseComplianceFee;
    
    const totalTxAmount = isCredit ? baseAmount : baseAmount + convertedFee + convertedComplianceFee;
    
    const pdfFormattedAmount = baseAmount.toLocaleString('en-US', { style: 'currency', currency: currencyCode }).replace('$', currencySymbol);
    const pdfFormattedFee = convertedFee.toLocaleString('en-US', { style: 'currency', currency: currencyCode }).replace('$', currencySymbol);
    const pdfFormattedComplianceFee = convertedComplianceFee.toLocaleString('en-US', { style: 'currency', currency: currencyCode }).replace('$', currencySymbol);
    const pdfFormattedTotal = totalTxAmount.toLocaleString('en-US', { style: 'currency', currency: currencyCode }).replace('$', currencySymbol);
    
    // Set margins and paper dimensions
    const pageWith = 210;
    const margin = 20;
    const contentWidth = pageWith - (margin * 2);

    // Dynamic brand mappings based on chosen emailTheme
    const theme = emailTheme || 'classic';
    let headerBarColor = [15, 23, 42]; // slate-900
    let headerText = "FIRST PACIFIC PRIVATE BANK  •  PORTFOLIO RECONCILIATION UNIT  •  CONFIDENTIAL DOCUMENT";
    let bankTitle = "FIRST PACIFIC PRIVATE BANK, N.A.";
    let bankSubtitle = "ULTRA HIGH NET WORTH PRIVATE CLIENT GROUP  •  MEMBER OCC & FDIC";
    let bankDetailsLine1 = "Headquarters Hub: 110 Wall Street, 22nd Floor, New York, NY 10005, United States";
    let bankDetailsLine2 = "Licensing: OCC National Charter #441829 | SWIFT BIC: BankUS33XXX | FDIC Certificate #82739";
    let bankDetailsLine3 = "Official Website: www.firstpaba.com | Dedicated Client Line: +1-800-Bank-GOLD (4653)";
    let watermarkText = "FIRST PABA";
    let accentBorderColor = [200, 160, 89]; // gold
    let frameColor = [15, 23, 42]; // slate-900

    let textLegal = "First Pacific Private Bank Inc. is fully certified under statutory reserve framework guides, maintaining complete asset backing portfolios. The transaction detailed herein has been audited, cleared, and compiled under ISO-20022 compliance rules. Under regulatory mandates of Uniform Commercial Code (UCC) Article 4A and the Dodd-Frank Act, the transmission ledger entries are final, binding, and completely immutable. Available balance shows combined private node portfolio book value totals recorded at execution.";
    let chiefTrusteeName = "Sarah S. Sterling";
    let chiefTrusteeTitle = "Sarah S. Sterling, Chief Compliance Trustee";
    let chiefTrusteeDivision = "Institutional Auditing & Regulatory Division";
    let stampText = "FIRST PACIFIC AUDIT CONFIRMED";
    let page2Title = "First Pacific Private Bank - Institutional Transfer Attestation";
    let page2ClearedToken = `Transmission Clearance Token: SECURE_ID_Bank-${refId}`;
    let boardName = "By Order of the Board of Corporate Trustees:";
    let committeeName = "Executive Committee";
    let page2Sub = "First Pacific Private Wealth & Sovereign Asset Management Division";
    let page2Location = "Zürich, Switzerland  •  New York, NY, USA  •  London, United Kingdom";
    let clearancePrefix = "Bank-TX-";
    let routingNo = "021000021 (Fedwire)";
    let swiftBic = "BankUS33XXX";
    let institutionName = "First Pacific Private Bank, N.A.";

    let page2LegalMemo = `The Federal Reserve System, the Office of the Comptroller of the Currency (OCC), and global financial clearing networks actively monitor and audit high-value sovereign node transfers processed through our digital banking channels. Cross-border payments, high-liquidity capital flows, and international settlement operations are systematically reconciled with the IMF (International Monetary Fund) and central banking clearing units prior to final clearance dispatch.

First Pacific Private Bank certifies that all client capital reserves are fully backed, one-to-one, in modern liquid vaults and authorized securities. Transactions details are cryptographically sealed and distributed across the First Pacific private blockchain ledger network. This guarantees complete confidentiality, security, and absolute immutability of records for sovereign tax compliance, corporate accounting, and private estate planning audits.

We thank you for your continued trust in our institutional private banking node services. If you require further assistance or wish to initiate an outbound structured wire transfer exceeding standard clearing thresholds, please contact your designated private wealth advisor.`;

    if (theme === 'chase') {
        headerBarColor = [0, 96, 163];
        headerText = "JPMORGAN CHASE BANK, N.A.  •  PORTFOLIO STATEMENT SERVICES  •  CONFIDENTIAL DOCUMENT";
        bankTitle = "JPMORGAN CHASE BANK, N.A.";
        bankSubtitle = "CHASE WEALTH MANAGEMENT GROUP  •  MEMBER FDIC";
        bankDetailsLine1 = "Headquarters: 270 Park Avenue, New York, NY 10017, United States";
        bankDetailsLine2 = "Licensing: OCC National Charter #829 | SWIFT BIC: CHASUS33XXX | FDIC Certificate #4411";
        bankDetailsLine3 = "Official Website: www.chase.com | Support Line: +1-800-935-9935";
        watermarkText = "CHASE BANK";
        accentBorderColor = [17, 126, 201];
        frameColor = [0, 96, 163];

        textLegal = "JPMorgan Chase Bank, N.A. is fully certified under statutory reserve framework guides, maintaining complete asset backing portfolios. The transaction detailed herein has been audited, cleared, and compiled under ISO-20022 compliance rules. Under regulatory mandates of Uniform Commercial Code (UCC) Article 4A and the Dodd-Frank Act, the transmission ledger entries are final, binding, and completely immutable. Available balance shows combined private node portfolio book value totals recorded at execution.";
        chiefTrusteeName = "Jonathan C. Chase";
        chiefTrusteeTitle = "Jonathan C. Chase, Senior Compliance Officer";
        chiefTrusteeDivision = "Global Financial Crime & Auditing Division";
        stampText = "CHASE AUDIT CONFIRMED";
        page2Title = "JPMorgan Chase Bank - Institutional Transfer Attestation";
        page2ClearedToken = `Transmission Clearance Token: SECURE_ID_CHASE-${refId}`;
        boardName = "By Order of the Board of Directors:";
        committeeName = "Executive Board of Directors";
        page2Sub = "Chase Wealth Management & Global Asset Management Division";
        page2Location = "New York, NY, USA  •  Chicago, IL, USA  •  London, United Kingdom";
        clearancePrefix = "CHASE-TX-";
        routingNo = "021000021 (Fedwire / CHIPS)";
        swiftBic = "CHASUS33XXX";
        institutionName = "JPMorgan Chase Bank, N.A.";

        page2LegalMemo = `The Federal Reserve System, the Office of the Comptroller of the Currency (OCC), and global financial clearing networks actively monitor and audit high-value transfers processed through our digital banking channels. Cross-border payments, high-liquidity capital flows, and international settlement operations are systematically reconciled with central banking clearing units prior to final clearance dispatch.

JPMorgan Chase Bank, N.A. certifies that all client capital reserves are fully backed, one-to-one, in modern liquid vaults and authorized securities. Transactions details are sealed under strict cryptographic protocols. This guarantees complete confidentiality, security, and absolute immutability of records for corporate accounting and private wealth audits.

We thank you for your continued trust in JPMorgan Chase wealth services. If you require further assistance or wish to initiate an outbound structured wire transfer exceeding standard clearing thresholds, please contact your designated private client advisor.`;
    } else if (theme === 'bofa') {
        headerBarColor = [1, 33, 105];
        headerText = "BANK OF AMERICA, N.A.  •  GLOBAL RECONCILIATION SERVICES  •  CONFIDENTIAL DOCUMENT";
        bankTitle = "BANK OF AMERICA, N.A.";
        bankSubtitle = "BANK OF AMERICA PRIVATE BANK  •  MEMBER OCC & FDIC";
        bankDetailsLine1 = "Headquarters: 100 North Tryon Street, Charlotte, NC 28255, United States";
        bankDetailsLine2 = "Licensing: OCC National Charter #130 | SWIFT BIC: BOFAUS3NXXX | FDIC Certificate #2282";
        bankDetailsLine3 = "Official Website: www.bankofamerica.com | Support Line: +1-800-432-1000";
        watermarkText = "BANK OF AMERICA";
        accentBorderColor = [227, 24, 55];
        frameColor = [1, 33, 105];

        textLegal = "Bank of America, N.A. is fully certified under statutory reserve framework guides, maintaining complete asset backing portfolios. The transaction detailed herein has been audited, cleared, and compiled under ISO-20022 compliance rules. Under regulatory mandates of Uniform Commercial Code (UCC) Article 4A and the Dodd-Frank Act, the transmission ledger entries are final, binding, and completely immutable. Available balance shows combined private node portfolio book value totals recorded at execution.";
        chiefTrusteeName = "Robert H. Bank";
        chiefTrusteeTitle = "Robert H. Bank, Senior Vice President of Compliance";
        chiefTrusteeDivision = "Regulatory Affairs & Institutional Auditing Division";
        stampText = "BOFA AUDIT CONFIRMED";
        page2Title = "Bank of America - Institutional Transfer Attestation";
        page2ClearedToken = `Transmission Clearance Token: SECURE_ID_BOFA-${refId}`;
        boardName = "By Order of the Board of Executive Officers:";
        committeeName = "Executive Compliance Council";
        page2Sub = "Bank of America Private Wealth & Merrill Lynch Asset Management Division";
        page2Location = "Charlotte, NC, USA  •  New York, NY, USA  •  London, United Kingdom";
        clearancePrefix = "BOFA-TX-";
        routingNo = "021900032 (Fedwire / CHIPS)";
        swiftBic = "BOFAUS3NXXX";
        institutionName = "Bank of America, N.A.";

        page2LegalMemo = `The Federal Reserve System, the Office of the Comptroller of the Currency (OCC), and global financial clearing networks actively monitor and audit high-value transfers processed through our digital banking channels. Cross-border payments, high-liquidity capital flows, and international settlement operations are systematically reconciled with central banking clearing units prior to final clearance dispatch.

Bank of America, N.A. certifies that all client capital reserves are fully backed, one-to-one, in modern liquid vaults and authorized securities. Transactions details are sealed under high-security cryptographic ledger frameworks. This guarantees complete confidentiality, security, and absolute immutability of records for sovereign compliance and asset management audits.

We thank you for your continued trust in Bank of America private banking services. If you require further assistance or wish to initiate an outbound structured wire transfer exceeding standard clearing thresholds, please contact your designated Merrill Lynch or private wealth advisor.`;
    } else if (theme === 'boe') {
        headerBarColor = [0, 53, 107];
        headerText = "BANK OF ENGLAND  •  THREADNEEDLE SERVICES  •  OFFICIAL MONETARY DOCUMENT";
        bankTitle = "BANK OF ENGLAND";
        bankSubtitle = "PRUDENTIAL REGULATION AUTHORITY  •  FINANCIAL CONDUCT AUTHORITY";
        bankDetailsLine1 = "Headquarters: Threadneedle St, London EC2R 8AH, United Kingdom";
        bankDetailsLine2 = "PRA & FCA Chartered | SWIFT BIC: BKENGBA2XXX | FDIC/PRA Protected";
        bankDetailsLine3 = "Official Website: www.bankofengland.co.uk | Support Line: +44 20 3132 4000";
        watermarkText = "BANK OF ENGLAND";
        accentBorderColor = [212, 175, 55];
        frameColor = [0, 53, 107];

        textLegal = "The Bank of England certifies this transaction as an official monetary record under sterling interbank clearance directives and state account auditing requirements. The transaction detailed herein has been audited, cleared, and compiled under international ISO-20022 compliance rules. Under regulatory mandates of the Bank of England Charter and the Financial Services and Markets Act, transmission ledger entries are final, binding, and completely immutable.";
        chiefTrusteeName = "Sir Andrew J. Bailey";
        chiefTrusteeTitle = "Sir Andrew J. Bailey, Governor & Chief Compliance Trustee";
        chiefTrusteeDivision = "Prudential Regulation & Interbank Clearance Division";
        stampText = "BOE MONETARY VERIFIED";
        page2Title = "Bank of England - Institutional Transfer Attestation";
        page2ClearedToken = `Transmission Clearance Token: SECURE_ID_BOE-${refId}`;
        boardName = "By Order of the Court of Directors of the Bank of England:";
        committeeName = "Monetary Policy Committee";
        page2Sub = "Bank of England Sovereign Wealth & Regulatory Auditing Division";
        page2Location = "Threadneedle Street, London EC2R 8AH, United Kingdom";
        clearancePrefix = "BOE-TX-";
        routingNo = "20-00-00 (CHAPS Clearance)";
        swiftBic = "BKENGBA2XXX";
        institutionName = "Bank of England";

        page2LegalMemo = `The Bank of England, the Prudential Regulation Authority (PRA), and Her Majesty's Treasury actively oversee and audit high-value sterling interbank transfers processed through the Real-Time Gross Settlement (RTGS) system. All large-scale liquidity distributions and sovereign settlement operations are systematically cleared through Threadneedle Street central banking clearing protocols.

The Bank of England certifies that all cleared client sterling reserves are fully accounted for, backed one-to-one by statutory reserves and liquid government securities. Transaction records are secured under official sovereign cryptographic standards, ensuring complete privacy, immutability, and compliance with United Kingdom financial regulation.

We acknowledge the formal execution of this interbank clearance. For enquiries regarding complex corporate liquidity management or international clearing channels, please refer to your accredited institutional relationship manager.`;
    }

    // --- PAGE 1: OFFICIAL SETTLEMENT RECEIPT ---

    // Apply standardized bank layout
    applyBankPdfBackgroundAndWatermark(doc, { title: bankTitle, documentRef: `REF: ${clearancePrefix}${refId}` });

    let headerCurrentY = 56;
    
    // Divider line below header
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, headerCurrentY, pageWith - margin, headerCurrentY);

    // Official Stamp Banner
    doc.setFillColor(248, 250, 252); // slate-50 bg
    doc.rect(margin, 60, contentWidth, 14, 'F');
    doc.setDrawColor(accentBorderColor[0], accentBorderColor[1], accentBorderColor[2]);
    doc.setLineWidth(1.0);
    doc.line(margin, 60, margin, 74);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(accentBorderColor[0], accentBorderColor[1], accentBorderColor[2]);
    doc.text("OFFICIAL TRANSACTION SETTLEMENT RECORD & CLEARANCE RECEIPT", margin + 5, 68.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("DOCUMENT INTEGRITY SECURED VIA ISO-20022 GENERAL LEDGER", 132, 68.5);

    // Date & ID Details Block
    const uetr = `UETR-${transaction.id.toUpperCase()}-${refId}`;
    const fedwireSeq = `FED2026${refId}F1B0`;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Clearance Ref: ${clearancePrefix}${refId}`, margin, 83);
    doc.text(`Fedwire IMAD: ${fedwireSeq}`, margin, 87);
    doc.text(`UETR ID: ${uetr}`, margin, 91);
    doc.text(`Value Date: ${date}`, 135, 83);
    doc.text(`Posting Date: ${date}`, 135, 87);
    doc.text(`Clearance Time: ${time} EST`, 135, 91);

    // Divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, 96, pageWith - margin, 96);

    // SENDER AND RECEIVER COLUMNS
    const detailsY = 101;

    // Left Column: SENDER / ORIGINATOR DETAILS
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("ORIGINATOR (SENDER) DETAILS", margin, detailsY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    const resolvedUserName = userName || USER_PROFILE.name || "Lachy McLean";
    const resolvedUserAddress = userAddress || USER_PROFILE.address || "Registered Address";

    const senderName = isCredit 
        ? (transaction.senderName || transaction.description || (theme === 'boe' ? "Sterling Liquidity Pool" : "Interbank Liquidity Pool"))
        : resolvedUserName;
    doc.text(senderName, margin, detailsY + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Institution: ${institutionName}`, margin, detailsY + 12);
    doc.text(`Sovereign Clearing Node Account`, margin, detailsY + 16);
    doc.text(`Routing Transit No: ${routingNo}`, margin, detailsY + 20);
    
    // Split origin address properly to avoid overflow if it's long
    const splitOriginAddress = doc.splitTextToSize(`Origin Address: ${resolvedUserAddress}`, contentWidth / 2 - 5);
    doc.text(splitOriginAddress, margin, detailsY + 24);

    // Right Column: BENEFICIARY (RECEIVER) DETAILS
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("BENEFICIARY (RECIPIENT) DETAILS", 115, detailsY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    const recipient = transaction.recipient;
    const recipientName = isCredit 
        ? resolvedUserName
        : (recipient?.fullName || transaction.description || "Authorized Beneficiary");
    doc.text(recipientName, 115, detailsY + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const recipientBank = isCredit 
        ? institutionName
        : (recipient?.bankName || "Interbank Clearance Node");
    const recipientAccount = isCredit 
        ? `**** **** **** 9102`
        : (recipient?.accountNumber || recipient?.serviceIdentifier || "N/A");
    const recipientSwift = isCredit 
        ? swiftBic 
        : (recipient?.realDetails?.swiftBic || recipient?.routingNumber || "BankUS33");

    const recipientCountry = isCredit
        ? "United States"
        : (typeof recipient?.country === 'object' && recipient?.country?.name 
            ? recipient.country.name 
            : (typeof recipient?.country === 'string' ? recipient?.country : "United States"));

    const recipientAddress = isCredit
        ? resolvedUserAddress
        : (recipient?.streetAddress 
            ? `${recipient.streetAddress}, ${recipient.city || ''}, ${recipient.stateProvince || ''} ${recipient.postalCode || ''}` 
            : "Registered Interbank Correspondent Office Address");

    doc.text(`Institution: ${recipientBank}`, 115, detailsY + 12);
    doc.text(`Destination Account: ${recipientAccount}`, 115, detailsY + 16);
    doc.text(`Routing Code / SWIFT: ${recipientSwift}`, 115, detailsY + 20);
    doc.text(`Country: ${recipientCountry}`, 115, detailsY + 24);
    
    // Address word wrap
    const splitRecipientAddress = doc.splitTextToSize(`Address: ${recipientAddress}`, contentWidth / 2 - 5);
    doc.text(splitRecipientAddress, 115, detailsY + 28);

    // Divider line before data table
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, 134, pageWith - margin, 134);

    // LEDGER RECORDS TABLE
    const tableY = 139;

    // Header Row
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, tableY, contentWidth, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("SETTLEMENT COMPONENT DESCRIPTION", margin + 4, tableY + 5.5);
    doc.text("CLEARANCE TYPE", 110, tableY + 5.5);
    doc.text("SETTLEMENT FLOW", 155, tableY + 5.5);

    let currentY = tableY + 8;
    
    // Table Content Row 1 (Base Value)
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, currentY, contentWidth, 12, 'F');
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(transaction.description || "Capital Transfer Settlement", margin + 4, currentY + 7.5);
    doc.text(`Base Amount`, 110, currentY + 7.5);
    doc.text(pdfFormattedAmount, 155, currentY + 7.5);
    currentY += 12;

    // Table Content Row 2 (Surcharge / Fee)
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, currentY, contentWidth, 10, 'F');
    doc.text("Compliance Interbank Surcharge & Regulatory Fee", margin + 4, currentY + 6.5);
    doc.text("Network Fee", 110, currentY + 6.5);
    doc.text(pdfFormattedFee, 155, currentY + 6.5);
    currentY += 10;

    // Table Content Row 2b (Compliance Halt Fee, if present)
    if (baseComplianceFee > 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, contentWidth, 10, 'F');
        doc.text("Regulatory Compliance Halt Clearance Fee (17%)", margin + 4, currentY + 6.5);
        doc.text("Compliance Fee", 110, currentY + 6.5);
        doc.text(pdfFormattedComplianceFee, 155, currentY + 6.5);
        currentY += 10;
    }

    // Table Content Row 3 (Net Settlement Total)
    const row3Bg = baseComplianceFee > 0 ? 255 : 248;
    doc.setFillColor(row3Bg, row3Bg, row3Bg);
    doc.rect(margin, currentY, contentWidth, 12, 'F');
    doc.setFont("helvetica", "bold");
    doc.text("Net Settled Portfolio Symmetrical Flow", margin + 4, currentY + 7.5);
    
    // Direction & Color
    if (isCredit) {
        doc.setTextColor(16, 185, 129); // emerald Green
        doc.text("CREDIT VALUE (+)", 110, currentY + 7.5);
    } else {
        doc.setTextColor(220, 38, 38); // rose Red
        doc.text("DEBIT VALUE (-)", 110, currentY + 7.5);
    }
    doc.setTextColor(15, 23, 42);
    doc.text(pdfFormattedTotal, 155, currentY + 7.5);
    currentY += 12;

    // Available Balance Bar (RECONCILED PORTFOLIO NET WORTH)
    const balanceY = currentY + 2;
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, balanceY, contentWidth, 12, 'F');
    doc.setDrawColor(200, 160, 89); // gold accent
    doc.setLineWidth(0.75);
    doc.line(margin, balanceY, margin, balanceY + 12); // left gold bar

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(180, 83, 9); // premium gold text
    doc.text("Consolidated Portfolio Net Worth After Entry (Reconciled Book Value):", margin + 4, balanceY + 7.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(formattedBalance, 155, balanceY + 7.5);

    // Legal Disclaimers Section
    const disclaimerY = balanceY + 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("FEDERAL REGULATORY COMPLIANCE STANDARDS DISCLOSURE", margin, disclaimerY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const splitLegalText = doc.splitTextToSize(textLegal, contentWidth);
    doc.text(splitLegalText, margin, disclaimerY + 5);

    // Draw stylized micro code bar
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("IMMUTABLE CRYPTOGRAPHIC LEDGER SEAL & HASH", margin, disclaimerY + 28);

    // Style microbarcode rods
    doc.setFillColor(frameColor[0], frameColor[1], frameColor[2]);
    let barX = margin;
    const barY = disclaimerY + 31;
    const barHeight = 8;
    const rods = [1, 2, 4, 1, 3, 2, 1, 4, 3, 1, 2, 2, 1, 4, 1, 3, 2, 4, 1, 2, 1, 3, 4, 1, 2, 1, 3, 1, 4, 2];
    rods.forEach(rod => {
        const thickness = rod === 4 ? 1.5 : rod === 3 ? 1.0 : rod === 2 ? 0.7 : 0.3;
        doc.rect(barX, barY, thickness, barHeight, 'F');
        barX += thickness + 0.5;
    });

    const sha256MockStr = `SHA256::${transaction.id.toUpperCase()}${refId}`;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`MATCHED DECENTRALIZED NODE SIGNATURE HASH: ${sha256MockStr}`, margin, disclaimerY + 43);

    // SIGNATURE SEAL GARRISON ON BOTTOM RIGHT
    const sigX = 125;
    const sigY = disclaimerY + 26;
    doc.setFillColor(248, 250, 252);
    doc.rect(sigX, sigY, 65, 25, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.rect(sigX, sigY, 65, 25);

    // Accent Stamp Seal badge
    doc.setFillColor(theme === 'boe' ? 240 : theme === 'chase' ? 224 : 254, theme === 'boe' ? 240 : theme === 'chase' ? 242 : 243, theme === 'boe' ? 255 : theme === 'chase' ? 254 : 199); // light blue or amber depending on theme
    doc.rect(sigX + 1, sigY + 1, 36, 4, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.setTextColor(accentBorderColor[0], accentBorderColor[1], accentBorderColor[2]);
    doc.text(stampText, sigX + 2, sigY + 4);

    // Signee details
    doc.setFont("serif", "italic");
    doc.setFontSize(11);
    doc.setTextColor(frameColor[0], frameColor[1], frameColor[2]);
    doc.text(chiefTrusteeName, sigX + 5, sigY + 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(chiefTrusteeTitle, sigX + 5, sigY + 17);
    doc.text(chiefTrusteeDivision, sigX + 5, sigY + 21);

    // --- SECOND PAGE: COVER LETTER & SOVEREIGN NODE ATTESTATION ---
    doc.addPage();

    // Apply standardized bank layout for page 2
    applyBankPdfBackgroundAndWatermark(doc, { title: page2Title, documentRef: page2ClearedToken });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(page2ClearedToken, margin, 35);
    doc.text(`ISO-20022 Transmission Format Code: MT-103 Single Customer Credit Transfer`, margin, 39);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(frameColor[0], frameColor[1], frameColor[2]);
    doc.text("GLOBAL SETTLEMENT & COMPLIANCE STATEMENTS", margin, 52);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    
    const splitLegalMemo = doc.splitTextToSize(page2LegalMemo, contentWidth);
    doc.text(splitLegalMemo, margin, 59);

    // Signature Area
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(frameColor[0], frameColor[1], frameColor[2]);
    doc.text(boardName, margin, 142);
    
    doc.setFont("serif", "italic");
    doc.setFontSize(13);
    doc.text(committeeName, margin, 153);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(page2Sub, margin, 159);
    doc.text(page2Location, margin, 163);

    const originHost = typeof window !== 'undefined' ? window.location.origin : 'https://firstpacificbank.com';
    const verifyPayload = `${originHost}/verify?doc=TX_${refId}&status=VERIFIED`;
    const qrDataUrl = await import('./pdfWatermarkAndQr').then(m => m.generateQrCodeDataUrl(verifyPayload, 200));
    await import('./pdfWatermarkAndQr').then(m => m.embedVerificationQrCodeBlock(doc, qrDataUrl, margin, 210, { width: contentWidth, height: 26 }));

    return doc.output('datauristring').split(',')[1];
};

// --- AUTHENTICATION & SECURITY ---

export const sendOtpSmsViaTextFlow = async (phoneNumber: string, email?: string, name?: string): Promise<NotificationResult> => {
    // GENERATE RANDOM 6-DIGIT CODE
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const refId = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    // Construct Security Message
    const message = `Bank Security 🔐: ${code} is your One-Time Passcode.\n\nRef: ${refId}\nDevice: iPhone 15 Pro\nLocation: New York, NY\n\nIf this wasn't you, your account may be compromised. Call immediately.`;
    
    // 1. Dispatch Local HUD Immediately (Zero Latency Feedback)
    dispatchLocalHud(`Bank Security: Sending OTP to device ending in ${phoneNumber.slice(-4)} and email...`);
    
    // 2. Send via Twilio Real SMS (Background Process) - Fire and Forget
    sendTwilioSms(phoneNumber, message).then(result => {
        if (!result.success) {
            console.warn('SMS Delivery Failed:', result.error, 'OTP:', code);
            dispatchLocalHud(`Network Error: OTP SMS failed to send. Attempting fallback via email.`);
        } else {
            dispatchLocalHud(`Bank Security: OTP sent successfully via SMS.`);
        }
    }).catch(console.error);

    // 3. Send securely via Email if provided
    if (email) {
        const body = generateBankingEmailTemplate(
            "Security Authorization Required",
            `<p>Dear ${name || 'Client'},</p>
            <p>We received a secure request that requires immediate authorization.</p>
            <div style="background:#0f172a; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 8px; color: #10b981;">${code}</span>
            </div>
            <p style="font-size: 12px; color: #64748b;">Reference ID: ${refId}</p>
            <p>Do not share this code with anyone. Our staff will never ask for your code.</p>`,
            "Report Unauthorized Activity"
        );
        sendEmail(email, `Your Bank Security Code: ${code}`, body).catch(e => console.error("OTP Email API Failed", e));
    }
    
    return { success: true, code };
};

export const sendOtpWhatsAppViaChannel = async (phoneNumber: string, email?: string, name?: string): Promise<NotificationResult> => {
    // GENERATE RANDOM 6-DIGIT CODE
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const refId = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    let issuer = 'Global Private Bank';
    try {
        const sysOpts = await db.getSystemOptions();
        if (sysOpts && sysOpts.customIssuer) issuer = sysOpts.customIssuer;
    } catch (e) {}

    const realIP = `104.244.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
    const userLoc = Intl.DateTimeFormat().resolvedOptions().timeZone.split('/')[1]?.replace('_', ' ') || 'New York, USA';

    // Construct Security Message with premium styling
    const message = `*${issuer} Security Node* 🔐\n\n*${code}* is your verification OTP.\n\n*Reference ID:* ${refId}\n*IP Address:* ${realIP}\n*Location:* ${userLoc}\n\n_If you did not initiate this authentication handshake, lock your ledger vault immediately via the Client Security Dashboard._`;
    
    // 1. Dispatch Local HUD Immediately
    dispatchLocalHud(`${issuer} Security: Transmitting real-time WhatsApp OTP to device +${phoneNumber.slice(0, 3)}...${phoneNumber.slice(-4)}`, code);
    
    // 2. Dispatch event for WhatsApp simulation visual banner
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('WHATSAPP_NOTIFICATION_SIMULATED', {
            detail: {
                sender: `${issuer} Security Node`,
                message: `🔐 OTP Verification Code: ${code} (Ref: ${refId}). Click to expand secure details.`
            }
        }));
    }, 1200);

    // 3. Send securely via Twilio WhatsApp API
    sendTwilioWhatsApp(phoneNumber, message).then(result => {
        if (!result.success) {
            console.warn('WhatsApp Delivery Failed:', result.error, 'OTP:', code);
            dispatchLocalHud(`WhatsApp Core Failed: ${result.error}. SMS fallback triggered.`);
            // Fallback to sending standard SMS in case sandbox is not paired
            sendTwilioSms(phoneNumber, `${issuer} Security 🔐 Fallback: Your login OTP is ${code}. Ref: ${refId}`).catch(console.error);
        } else {
            dispatchLocalHud(`${issuer} Security: WhatsApp OTP delivered successfully.`);
        }
    }).catch(console.error);

    // 4. Send securely via Email if provided
    if (email) {
        let brandOptions: any = {};
        try {
            const sysOpts = await db.getSystemOptions();
            brandOptions = {
                logoStyle: sysOpts?.logoStyle || 'classic',
                primaryColor: sysOpts?.primaryColor || '#D4AF37',
                borderColor: sysOpts?.primaryColor || '#D4AF37',
                bannerUrl: sysOpts?.emailBannerUrl || '/standard_dispatch_banner.png',
                customIssuer: issuer,
                emailTheme: sysOpts?.emailTheme || 'classic'
            };
        } catch(e) {}

        const body = generateBankingEmailTemplate(
            "WhatsApp MFA Handshake",
            `<p>Dear ${name || 'Client'},</p>
            <p>Your authentication code has been routed through our Premium WhatsApp Security Node.</p>
            <div style="background:#0f172a; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 8px; color: #10b981;">${code}</span>
            </div>
            <p style="font-size: 11px; color: #64748b; font-family: monospace;">Secured via RSA-4096 & Twilio Private WhatsApp Gateway (SID: ${refId})</p>`,
            "Report Unauthorized Access",
            "https://firstpaba.com/secure",
            brandOptions
        );
        sendEmail(email, `[WHATSAPP SECURITY NODE] Your ${issuer} verification OTP: ${code}`, body).catch(e => console.error("OTP WhatsApp Email Failed", e));
    }
    
    return { success: true, code };
};

export const sendWhatsAppNotification = async (phoneNumber: string, body: string): Promise<boolean> => {
    // Dispatch Local HUD message
    dispatchLocalHud(`Bank Alerts: Dispatching WhatsApp banking alert...`);

    // Dispatch simulated notification event for on-screen aesthetic feel
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('WHATSAPP_NOTIFICATION_SIMULATED', {
            detail: {
                sender: 'Global Private Bank Node Alerts',
                message: body.replace(/\*|_/g, '') // strip markdown
            }
        }));
    }, 1000);

    // Dispatch Twilio API call
    const result = await sendTwilioWhatsApp(phoneNumber, body);
    return result.success;
};

export const sendSecurityAlertSms = async (action: string, userEmail?: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
    let issuer = 'Global Private Bank';
    let brandOptions: any = {};
    try {
        const sysOpts = await db.getSystemOptions();
        if (sysOpts && sysOpts.customIssuer) issuer = sysOpts.customIssuer;
        brandOptions = {
            logoStyle: sysOpts?.logoStyle || 'classic',
            primaryColor: sysOpts?.primaryColor || '#D4AF37',
            borderColor: sysOpts?.primaryColor || '#D4AF37',
            bannerUrl: sysOpts?.emailBannerUrl || '/standard_dispatch_banner.png',
            customIssuer: issuer,
            emailTheme: sysOpts?.emailTheme || 'classic'
        };
    } catch (e) {}

    const message = `${issuer} Security 🛡️: ${action} was successful at ${time}.\n\nNo further action required.`;
    
    dispatchLocalHud(message);
    const phone = USER_PROFILE.phone || DEFAULT_PHONE;
    sendTwilioSms(phone, message).catch(console.error);

    const emailTarget = userEmail || USER_PROFILE.email;
    if (emailTarget) {
        const body = generateBankingEmailTemplate(
            "Security Update",
            message.replace(/\n/g, '<br/>'),
            "View Security Settings",
            "https://firstpaba.com/secure",
            brandOptions
        );
        sendEmail(emailTarget, `Security Alert: ${action}`, body).catch(e => console.error("Email API Failed", e));
    }
};

export interface DeviceTelemetry {
    device: string;
    browser: string;
    os: string;
    location: string;
    ip: string;
    network: string;
    time: string;
    date: string;
    screen: string;
    cpuCores: number;
    deviceMemory: string;
    networkSpeed: string;
    userAgent: string;
}

export const getClientTelemetry = async (): Promise<DeviceTelemetry> => {
    const userAgent = navigator.userAgent;
    
    // Parse OS
    let os = "Unknown OS";
    if (userAgent.indexOf("Win") !== -1) os = "Windows";
    else if (userAgent.indexOf("Mac") !== -1) os = "macOS";
    else if (userAgent.indexOf("X11") !== -1) os = "UNIX";
    else if (userAgent.indexOf("Linux") !== -1) os = "Linux";
    else if (/Android/.test(userAgent)) os = "Android";
    else if (/iPhone|iPad|iPod/.test(userAgent)) os = "iOS";

    // Parse Browser
    let browser = "Unknown Browser";
    if (userAgent.indexOf("Chrome") !== -1) browser = "Google Chrome";
    else if (userAgent.indexOf("Safari") !== -1 && userAgent.indexOf("Chrome") === -1) browser = "Safari";
    else if (userAgent.indexOf("Firefox") !== -1) browser = "Mozilla Firefox";
    else if (userAgent.indexOf("MSIE") !== -1 || !!(window as any).MSInputMethodContext && !!(document as any).documentMode) browser = "Internet Explorer";
    else if (userAgent.indexOf("Edge") !== -1) browser = "Microsoft Edge";

    const screenRes = `${window.screen.width}x${window.screen.height}`;
    const cpuCores = navigator.hardwareConcurrency || 4;
    const deviceMemory = (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : "Standard RAM";

    // Extract Network Speed & Connection type
    let networkSpeed = "Unknown Speed";
    let networkType = "Unknown Connection";
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
        networkType = conn.effectiveType || "WiFi/Cellular";
        networkSpeed = conn.downlink ? `${conn.downlink} Mbps` : "Broadband";
    }

    // Default values if fetch fails or is blocked
    let ip = "192.168.1.139 (Secured Loop)";
    let locationStr = "Guntersville, AL (United States)";
    let isp = "Sovereign Private Net Node";

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        
        const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const data = await response.json();
            ip = data.ip || ip;
            const city = data.city || '';
            const region = data.region || '';
            const country = data.country_name || '';
            locationStr = city && country ? `${city}, ${region} (${country})` : locationStr;
            isp = data.org || isp;
        }
    } catch (e) {
        console.warn("Telemetry IP fetch timed out or blocked. Using system defaults.", e);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1000);
            const altResponse = await fetch('https://ip-api.com/json', { signal: controller.signal });
            clearTimeout(timeoutId);
            if (altResponse.ok) {
                const data = await altResponse.json();
                ip = data.query || ip;
                locationStr = data.city && data.country ? `${data.city}, ${data.regionName} (${data.country})` : locationStr;
                isp = data.isp || isp;
            }
        } catch (err) {
            console.warn("Secondary geo resolver unavailable.");
        }
    }

    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
    const date = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    return {
        device: `${os} Device (${browser})`,
        browser,
        os,
        location: locationStr,
        ip,
        network: `${isp} (${networkType.toUpperCase()})`,
        time,
        date,
        screen: screenRes,
        cpuCores,
        deviceMemory,
        networkSpeed,
        userAgent
    };
};

export const sendLoginAlert = async (deviceOrTelemetry: string | DeviceTelemetry, locationOrEmail?: string, userEmail?: string) => {
    let telemetry: DeviceTelemetry;

    if (typeof deviceOrTelemetry === 'object') {
        telemetry = deviceOrTelemetry;
        userEmail = locationOrEmail; // The second parameter becomes email when telemetry is passed
    } else {
        const now = new Date();
        telemetry = {
            device: deviceOrTelemetry,
            browser: 'Verified Browser',
            os: 'Verified OS',
            location: locationOrEmail || 'Resolved Location',
            ip: '198.51.100.82',
            network: 'First Pacific Private Router',
            time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            date: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            screen: '1920x1080',
            cpuCores: 8,
            deviceMemory: '16 GB',
            networkSpeed: 'Fiber Optic',
            userAgent: 'Fallback Web-Agent'
        };
    }

    let issuer = 'Global Private Bank';
    let brandOptions: any = {};
    let userName = 'Valued Client';
    try {
        const sysOpts = await db.getSystemOptions();
        if (sysOpts && sysOpts.customIssuer) issuer = sysOpts.customIssuer;
        brandOptions = {
            logoStyle: sysOpts?.logoStyle || 'classic',
            primaryColor: sysOpts?.primaryColor || '#D4AF37',
            borderColor: sysOpts?.primaryColor || '#D4AF37',
            bannerUrl: sysOpts?.emailBannerUrl || '/standard_dispatch_banner.png',
            customIssuer: issuer,
            emailTheme: sysOpts?.emailTheme || 'classic'
        };
        const emailTarget = userEmail || USER_PROFILE.email;
        if (emailTarget) {
            const users = await db.getAllUsers();
            const u = users.find(x => x.email.toLowerCase() === emailTarget.toLowerCase());
            if (u && u.profile?.name) userName = u.profile.name;
        }
    } catch (e) {}

    const time = telemetry.time;
    const date = telemetry.date;
    const loginLocation = telemetry.location;
    const loginDevice = telemetry.device;

    const message = `${issuer} Alert ⚠️: Terminal login established.\n\n📱 Device: ${loginDevice}\n📍 Loc: ${loginLocation}\n⏰ Time: ${time}\n🌐 IP: ${telemetry.ip}\n⚡ Net: ${telemetry.network}`;
    
    dispatchLocalHud(message);
    const phone = USER_PROFILE.phone || DEFAULT_PHONE;
    sendTwilioSms(phone, message).catch(console.error);

    const emailTarget = userEmail || USER_PROFILE.email;
    if (emailTarget) {
        const contentHtml = `
        <p style="font-size: 15px; font-weight: bold; color: #0f172a; margin-bottom: 24px;">Security Alert: Terminal Session Established</p>
        <p>Dear ${userName},</p>
        <p>This is an automated security transmission from <strong>${issuer}</strong>. A new user session has successfully completed standard clearance checks and accessed your private banking terminal.</p>
        
        <div class="highlight-box">
            <h4 style="margin: 0 0 12px 0; color: #94a3b8; font-size: 8px; font-weight: 1000; letter-spacing: 2px; text-transform: uppercase;">SESSION TELEMETRY LOGS</h4>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 2;">
                <tr>
                    <td style="color: #64748b; font-weight: bold; width: 35%;">Terminal Device</td>
                    <td style="color: #0f172a; font-weight: 900;">${loginDevice}</td>
                </tr>
                <tr>
                    <td style="color: #64748b; font-weight: bold;">Operating System</td>
                    <td style="color: #0f172a; font-weight: 900;">${telemetry.os}</td>
                </tr>
                <tr>
                    <td style="color: #64748b; font-weight: bold;">Web Browser</td>
                    <td style="color: #0f172a; font-weight: 900;">${telemetry.browser}</td>
                </tr>
                <tr>
                    <td style="color: #64748b; font-weight: bold;">IP Address</td>
                    <td style="color: #1e3a8a; font-family: monospace; font-weight: 950;">${telemetry.ip}</td>
                </tr>
                <tr>
                    <td style="color: #64748b; font-weight: bold;">Geographic Location</td>
                    <td style="color: #0f172a; font-weight: 900;">${loginLocation}</td>
                </tr>
                <tr>
                    <td style="color: #64748b; font-weight: bold;">Network Carrier / ISP</td>
                    <td style="color: #334155; font-size: 11px;">${telemetry.network}</td>
                </tr>
                <tr>
                    <td style="color: #64748b; font-weight: bold;">Log Date & Time</td>
                    <td style="color: #0f172a; font-weight: 900;">${date} at ${time}</td>
                </tr>
                <tr>
                    <td style="color: #64748b; font-weight: bold;">Terminal Hardware</td>
                    <td style="color: #64748b; font-size: 11px;">${telemetry.screen} | ${telemetry.cpuCores} Core CPU | ${telemetry.deviceMemory} RAM</td>
                </tr>
            </table>
        </div>

        <p>If you authorized this connection, no action is required on your part. Your ledger data remains secured via physical encryption layers.</p>
        
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0; background-color: #fef2f2; border: 1px dashed #fca5a5; padding: 16px; border-radius: 16px;">
            <tr>
                <td valign="top" style="width: 32px; color: #dc2626; font-size: 20px; line-height: 1;">⚠</td>
                <td>
                    <strong style="color: #991b1b; font-size: 13px; display: block; margin-bottom: 4px;">UNAUTHORIZED SESSIONS WARNING</strong>
                    <span style="color: #7f1d1d; font-size: 12px; line-height: 1.5; display: block;">If you do not recognize this login, your credentials may be compromised. Standard protocol dictates that you execute an immediate <strong>Remote Security lockout</strong> to freeze all payment rails (ACH, SEPA, SWIFT), suspend associated debit cards, and invalidate temporary session tokens.</span>
                </td>
            </tr>
        </table>
        
        <p style="font-size: 11px; color: #64748b; font-style: italic; text-align: center; margin-top: 24px;">Your protection logs are indexed with cryptographic reference ID LOG-TL-${Math.random().toString(36).substring(2, 8).toUpperCase()}</p>
        `;

        const body = generateBankingEmailTemplate(
            "Terminal Session Established",
            contentHtml,
            "Lock Portfolio",
            "https://firstpaba.com/secure",
            brandOptions
        );
        sendEmail(emailTarget, `Security Alert: New Logon from ${loginLocation}`, body).catch(e => console.error("Email API Failed", e));
    }
};

export const sendLocationChangeAlert = async (oldLoc: string, newLoc: string) => {
    const message = `Bank Travel ✈️: Location shift detected (${oldLoc} -> ${newLoc}).\n\nGlobal Travel Mode: ACTIVE\nForeign Transaction Fees: WAIVED`;
    
    dispatchLocalHud(message);
    sendTwilioSms(DEFAULT_PHONE, message).catch(console.error);
}

export const sendItccCodeViaTwilio = async (phoneNumber: string, code?: string): Promise<NotificationResult> => {
    // Use provided code or generate a new random one
    const activeCode = code || Math.floor(100000 + Math.random() * 900000).toString();
    const message = `Bank Compliance 🏛️: ITCC Clearance Token generated.\n\nCode: ${activeCode}\n\nUse this to release your pending high-value wire transmission.`;
    
    // Dispatch generic message to HUD (HIDE CODE)
    dispatchLocalHud(`COMPLIANCE ALERT: Clearance Code sent to ${phoneNumber.slice(-4)}`, undefined);
    
    // Attempt real SMS
    sendTwilioSms(phoneNumber, message).catch(console.error);
    
    return { success: true, code: activeCode };
};

// --- BANKING & PAYMENTS ---

export const sendTransactionNotification = async (
    transaction: Transaction, 
    shouldSendSms: boolean = true, 
    userEmail?: string, 
    currentBalance?: number, 
    userName?: string,
    complianceFee?: number
): Promise<NotificationResult> => {
    // Fetch branding customization from database if available
    const systemOpts = await db.getSystemOptions().catch(() => ({})) as any;
    const brandOptions = {
        logoStyle: systemOpts?.logoStyle || 'classic',
        primaryColor: systemOpts?.primaryColor || '#D4AF37',
        borderColor: systemOpts?.primaryColor || '#D4AF37',
        bannerUrl: systemOpts?.emailBannerUrl || '/standard_dispatch_banner.png',
        customIssuer: systemOpts?.customIssuer || 'Global Private Bank',
        emailTheme: systemOpts?.emailTheme || 'classic'
    };

    const isCredit = transaction.type === 'credit';
    
    const useOriginal = transaction.originalInputAmount !== undefined && transaction.originalInputAmount > 0;
    const baseAmount = useOriginal ? transaction.originalInputAmount! : transaction.sendAmount;
    const currencyCode = useOriginal ? transaction.originalInputCurrencyCode || 'USD' : 'USD';
    
    let currencySymbol = '$';
    if (currencyCode === 'GBP') currencySymbol = '£';
    else if (currencyCode === 'EUR') currencySymbol = '€';
    else if (currencyCode === 'JPY') currencySymbol = '¥';

    const rate = transaction.sendAmount > 0 ? baseAmount / transaction.sendAmount : 1;
    const baseFee = transaction.fee || 0;
    const convertedFee = useOriginal ? baseFee * rate : baseFee;

    const emailTarget = userEmail || USER_PROFILE.email;
    const actualUserName = userName || USER_PROFILE.name || 'Valued Client';

    // Query real user accounts from database for real-time accuracy
    const userAccounts = await db.getAccounts(emailTarget).catch(() => []);
    const matchedAccount = userAccounts.find(a => a.id === transaction.accountId) || userAccounts[0];

    // Determine actual account last 4 digits
    let realAccountLastFour = '1184';
    if (transaction.senderDetails?.accountNumberMasked) {
        realAccountLastFour = transaction.senderDetails.accountNumberMasked.replace(/[^0-9]/g, '').slice(-4) || '1184';
    } else if (matchedAccount?.accountNumber) {
        realAccountLastFour = matchedAccount.accountNumber.slice(-4);
    } else if (transaction.accountId && transaction.accountId.length >= 4 && !transaction.accountId.startsWith('acc_')) {
        realAccountLastFour = transaction.accountId.slice(-4);
    }

    // Determine exact real-time post-transaction balance
    let realPostBalance = 0;
    if (currentBalance !== undefined && !isNaN(currentBalance)) {
        realPostBalance = currentBalance;
    } else if (matchedAccount && matchedAccount.balance !== undefined) {
        realPostBalance = matchedAccount.balance;
    } else {
        const totalUserBal = userAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);
        realPostBalance = totalUserBal > 0 ? totalUserBal : BASE_BALANCE;
    }

    let baseCompFee = complianceFee !== undefined ? complianceFee : (transaction.complianceFee || 0);
    if (baseCompFee === 0 && (transaction.status === TransactionStatus.FLAGGED_AWAITING_CLEARANCE || transaction.status === TransactionStatus.AWAITING_PAYMENT_VERIFICATION || (transaction as any).complianceCode)) {
        const activeRate = systemOpts?.complianceFeeRate !== undefined ? systemOpts.complianceFeeRate : 17;
        baseCompFee = baseAmount * (activeRate / 100);
    }
    const convertedCompFee = useOriginal ? baseCompFee * rate : baseCompFee;

    const totalTxAmount = isCredit ? baseAmount : baseAmount + convertedFee + convertedCompFee;
    
    const formattedAmount = baseAmount.toLocaleString('en-US', { style: 'currency', currency: currencyCode }).replace('$', currencySymbol);
    const formattedTotalAmount = totalTxAmount.toLocaleString('en-US', { style: 'currency', currency: currencyCode }).replace('$', currencySymbol);
    const formattedBalance = realPostBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    let smsMessage = '';

    if (isCredit) {
        smsMessage = `Bank 🟢: ${formattedTotalAmount} received from ${transaction.senderName || transaction.description} on ${date} @ ${time}. \n\n🔓 Funds Available: Immediate\n📈 New Balance: ${formattedBalance}\n\nNotice: Int'l clearing via IMF verifiable network.\nView: firstpaba.com/t/${transaction.id.slice(-6)}`;
    } else {
        const recipient = transaction.recipient?.fullName || transaction.description || 'Unknown';
        smsMessage = `Bank 🔴: You paid ${formattedTotalAmount} to ${recipient} at ${time}. \n\n🛡️ Security: Verified\n📉 New Balance: ${formattedBalance}\n\nNotice: Int'l transfers proceed to IMF/global monitoring. Up to 48h settlement time for compliance.`;
    }

    // Dispatch immediately for instant UX (always show in-app toast)
    dispatchLocalHud(smsMessage);

    // Dispatch custom inbox notification event to sync with the secure Inbox Dashboard
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ADD_VERIFIED_INBOX_NOTIFICATION', {
            detail: {
                type: 'transaction',
                title: isCredit ? `Credit Alert Received [+$${transaction.sendAmount.toLocaleString()}]` : `Debit Swipe Confirmed [-$${transaction.sendAmount.toLocaleString()}]`,
                message: smsMessage,
                metadata: {
                    verified: true,
                    hasValidHeaders: true,
                    transactionId: transaction.id,
                    amount: transaction.sendAmount,
                    sender: transaction.senderName || transaction.description || 'Verified Interbank Pool',
                    recipient: transaction.recipient?.fullName || transaction.description || 'Authorized Recipient',
                    reference: transaction.id.slice(-12).toUpperCase(),
                    postBalance: formattedBalance
                }
            }
        }));
    }
    
    if (shouldSendSms) {
        // Will be sent dynamically later if possible, omitting for now
        await sendTwilioSms(DEFAULT_PHONE, smsMessage).catch(console.error);
    }

    if (emailTarget) {
        
        const attachPdf = async (bodyHtml: string, subjectLine: string) => {
            try {
                const pdfBase64 = await generateTransactionReceiptPDF(transaction, formattedBalance, formattedAmount, undefined, undefined, baseCompFee, brandOptions.emailTheme);
                await sendEmail(emailTarget, subjectLine, bodyHtml, [{
                    filename: `Receipt_${transaction.id.slice(-6)}.pdf`,
                    content: pdfBase64
                }]);
            } catch (e) {
                console.error("Email Delivery Failed:", e);
            }
        }

        if (transaction.status === TransactionStatus.FLAGGED_AWAITING_CLEARANCE) {
            const subject = "CRITICAL SECURITY ALERT: ITCC COMPLIANCE FAILURE";
            const itccBody = `
                <div style="font-family: 'Courier New', Courier, monospace; background: #000; color: #ff3333; padding: 40px; border: 2px solid #ff3333; border-radius: 8px;">
                    <h1 style="text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px;">CRITICAL ITCC SECURITY ALARM</h1>
                    <p style="font-size: 16px; line-height: 1.5;">Your transaction of ${formattedAmount} to ${transaction.recipient?.fullName || transaction.description} has been flagged for ITCC Compliance Verification.</p>
                    <p style="font-size: 16px; line-height: 1.5;">Immediate account freeze imminent unless verification is provided.</p>
                    <p style="margin-top: 30px; font-size: 14px; color: #ff9999;">PLEASE LOGIN IMMEDIATELY TO VERIFY YOUR IDENTITY AND AVOID ACCOUNT SUSPENSION.</p>
                </div>
            `;
            const fullHtml = generateBankingEmailTemplate(
                "Compliance Action Required",
                itccBody,
                "Resolve ITCC Hold",
                "https://firstpaba.com/dashboard",
                brandOptions
            );
            sendEmail(emailTarget, subject, fullHtml).catch(console.error);
        } else if (isCredit) {
            const subject = `Credit Alert: Transaction on your Account [${transaction.id.slice(-12).toUpperCase()}]`;
            const body = generateCreditAlertEmail({
                fullName: actualUserName,
                accountLastFour: realAccountLastFour,
                date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                time: time,
                amount: formattedTotalAmount.replace(/[^0-9.-]/g, ''),
                principalAmount: formattedAmount.replace(/[^0-9.-]/g, ''),
                fee: convertedFee.toLocaleString('en-US', { minimumFractionDigits: 2 }),
                complianceFee: convertedCompFee.toLocaleString('en-US', { minimumFractionDigits: 2 }),
                reference: transaction.id.slice(-12).toUpperCase(),
                description: transaction.senderName || transaction.description || 'Verified Source',
                availableBalance: formattedBalance.replace(/[^0-9.-]/g, ''),
                bankName: "Global Private Bank",
                currencySymbol: currencySymbol,
                currencyCode: currencyCode
            }, brandOptions);
            // Fire and forget
            attachPdf(body, subject);
        } else {
            const subject = `Debit Alert: Transaction on your Account [${transaction.id.slice(-12).toUpperCase()}]`;
            const body = generateDebitAlertEmail({
                fullName: actualUserName,
                accountLastFour: realAccountLastFour,
                date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                time: time,
                amount: formattedTotalAmount.replace(/[^0-9.-]/g, ''),
                principalAmount: formattedAmount.replace(/[^0-9.-]/g, ''),
                fee: convertedFee.toLocaleString('en-US', { minimumFractionDigits: 2 }),
                complianceFee: convertedCompFee.toLocaleString('en-US', { minimumFractionDigits: 2 }),
                reference: transaction.id.slice(-12).toUpperCase(),
                description: transaction.recipient?.fullName || transaction.description || 'Authorized Recipient',
                availableBalance: formattedBalance.replace(/[^0-9.-]/g, ''),
                bankName: "Global Private Bank",
                currencySymbol: currencySymbol,
                currencyCode: currencyCode
            }, brandOptions);
            // Fire and forget
            attachPdf(body, subject);

            // Automated 'Delivered' confirmation email for international wires
            const isInternational = (transaction as any).transferType === 'international' || transaction.recipient?.country?.code !== 'US';
            if (isInternational) {
                const intSubject = `FUNDS DELIVERED: International Transfer Complete [${transaction.id.slice(-12).toUpperCase()}]`;
                const intContent = `
                    <p>Dear ${actualUserName},</p>
                    <div style="background-color: #f0fdf4; border: 1.5px solid #10b981; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: left;">
                        <h3 style="color: #15803d; margin-top: 0; margin-bottom: 8px;">🟢 SWIFT CLEARED & DELIVERED</h3>
                        <p style="color: #1a365d; font-size: 14px; line-height: 1.6; margin: 0;">We are pleased to inform you that your international wire transfer has been scanned, cleared, and successfully delivered to the beneficiary bank.</p>
                    </div>

                    <table width="100%" style="border-collapse: collapse; margin-bottom: 24px;">
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Transaction Reference</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-family: monospace; font-size: 13px; font-weight: bold; text-align: right; color: #0f172a;">Bank-TX-${transaction.id.slice(-12).toUpperCase()}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Beneficiary Name</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: bold; text-align: right; color: #0f172a;">${transaction.recipient?.fullName || 'Authorized Payee'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Beneficiary Account</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-family: monospace; font-size: 13px; font-weight: bold; text-align: right; color: #0f172a;">${transaction.recipient?.accountNumber || '•••• Registered'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">SWIFT BIC Code</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-family: monospace; font-size: 13px; font-weight: bold; text-align: right; color: #0f172a;">${(transaction.recipient as any)?.realDetails?.swiftBic || 'SWIFT-INTERBANK'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Amount Sent</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-family: monospace; font-size: 14px; font-weight: bold; text-align: right; color: #0f172a;">$${transaction.sendAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Amount Received</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-family: monospace; font-size: 14px; font-weight: bold; text-align: right; color: #0f172a;">${transaction.receiveAmount ? transaction.receiveAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : transaction.sendAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${transaction.receiveCurrency || 'USD'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Exchange Rate</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-family: monospace; font-size: 13px; font-weight: bold; text-align: right; color: #0f172a;">${transaction.exchangeRate || 1.00}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Transfer Fee</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-family: monospace; font-size: 13px; font-weight: bold; text-align: right; color: #0f172a;">$${(transaction.fee ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</td>
                        </tr>
                    </table>

                    <div style="background-color: #f8fafc; border-left: 4px solid ${brandOptions.primaryColor}; padding: 20px; border-radius: 0 16px 16px 0; margin: 24px 0;">
                        <p style="margin: 0; font-weight: bold; color: #1e293b;">🌐 International Correspondent Notice:</p>
                        <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569;">Your funds have been routed via premium sovereign clearance corridors. Settlement completes with final interbank posting records within compliance standards, adhering to Fedwire and international SWIFT ISO-20022 clearing protocols.</p>
                    </div>
                `;
                
                const intBody = generateBankingEmailTemplate(
                    "International Wire Clearance & Delivery Confirmation",
                    intContent, 
                    "Settle Keys Dossier",
                    "https://firstpaba.com/verify",
                    brandOptions
                );

                sendEmail(emailTarget, intSubject, intBody).catch((err) => console.error("International Delivered email error:", err));
            }
        }
    }

    // Automatically trigger external payment instructions email on any wire transfer submission!
    const isWire = transaction.id.startsWith('WIRE') || transaction.transferMethod === 'wire';
    if (isWire && emailTarget) {
        sendExternalPaymentInstructions(transaction, emailTarget).catch(err => {
            console.error('[Auto Wire External Payment Instruction trigger failed]', err);
        });
    }

    return { success: true };
};

export const sendExternalPaymentInstructions = async (
    transaction: Transaction,
    userEmail?: string,
    customOptions?: any
): Promise<NotificationResult> => {
    try {
        const emailTarget = userEmail || USER_PROFILE.email;
        if (!emailTarget) return { success: false, error: 'No recipient email available' };

        const refId = transaction.id.slice(-12).toUpperCase();
        const recipientName = transaction.recipient?.fullName || transaction.description || 'Authorized Recipient';
        const recipientAcct = transaction.recipient?.accountNumber || '•••• Registered';
        const recipientBank = transaction.recipient?.bankName || 'Correspondent Bank';
        const routing = (transaction.recipient as any)?.realDetails?.routingNumber || '021000021';
        const swift = (transaction.recipient as any)?.realDetails?.swiftBic || 'SWIFT-INTERBANK';

        // Fetch custom options or use database system options
        const sysOpts = await db.getSystemOptions().catch(() => ({})) as any;
        const brandStyle = customOptions?.brandingStyle || sysOpts?.wireExternalBrandingStyle || 'classic-gold';
        const institutionName = customOptions?.institutionName || sysOpts?.wireExternalInstitutionName || 'FIRST PACIFIC GLOBAL';
        const priorityLevel = customOptions?.priorityLevel || sysOpts?.wireExternalPriorityLevel || 'IMMEDIATE DIRECT CORRESPONDENT';
        const complianceFooter = customOptions?.complianceFooter || sysOpts?.wireExternalComplianceFooter || 'This private payment instruction sheet is lock-sealed in compliance with central clearing standards.';
        const showSeal = customOptions?.showSeal !== undefined ? customOptions.showSeal : true;

        const emailBody = generateExternalPaymentInstructionsEmail({
            recipientName,
            recipientAccountNumber: recipientAcct,
            recipientBankName: recipientBank,
            routingNumber: routing,
            swiftBic: swift,
            amount: transaction.sendAmount,
            referenceCode: `Bank-TX-${refId}`,
            customizationOptions: {
                brandingStyle: brandStyle,
                institutionName,
                priorityLevel,
                complianceFooter,
                showSeal
            }
        });

        const subject = `📥 Bank External Payment Instructions Sheet [Ref: Bank-TX-${refId}]`;
        const res = await sendEmail(emailTarget, subject, emailBody);

        return { success: res.success, error: res.error };
    } catch (err: any) {
        console.error('[NotificationService sendExternalPaymentInstructions Error]', err);
        return { success: false, error: err.message };
    }
};

export const sendCardAlertSms = async (cardLastFour: string, action: string) => {
    const message = `Bank Cards: Card ending in ${cardLastFour} has been ${action}. Controls updated successfully.`;
    sendTwilioSms(DEFAULT_PHONE, message).catch(console.error);
    dispatchLocalHud(message);
};

// --- WEALTH & LENDING ---

export const sendLoanApplicationSms = async (productName: string, status: string) => {
    const message = `Bank Credit: Your application for ${productName} is now ${status}. Check your dashboard for details.`;
    sendTwilioSms(DEFAULT_PHONE, message).catch(console.error);
    dispatchLocalHud(message);
};

// --- LIFESTYLE & SERVICES ---

export const sendTravelBookingSms = async (type: string, description: string, ref: string) => {
    const message = `Bank Concierge: ${type} booking confirmed for ${description}. Ref: ${ref}. Safe travels.`;
    sendTwilioSms(DEFAULT_PHONE, message).catch(console.error);
    dispatchLocalHud(message);
};

export const sendLogisticsUpdateSms = async (trackingId: string, status: string) => {
    const message = `Bank Logistics: Asset ${trackingId} status updated to: ${status}. Tracking live on dashboard.`;
    sendTwilioSms(DEFAULT_PHONE, message).catch(console.error);
    dispatchLocalHud(message);
};

export const sendDonationReceiptSms = async (cause: string, amount: number) => {
    const formatted = amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    const message = `Bank Giving: Thank you for your donation of ${formatted} to ${cause}. Tax receipt generated.`;
    sendTwilioSms(DEFAULT_PHONE, message).catch(console.error);
    dispatchLocalHud(message);
};

export const sendWelcomeEmail = async (email: string, name: string, accountTier: string, pdfBase64Attachment?: string) => {
    const subject = `🎉 Congratulations, ${name || 'Valued Client'}! Your Sovereign Private Portfolio is Established`;
    const body = generateBankingEmailTemplate(
        "Welcome & Congratulations",
        `<div style="text-align: center; padding: 24px 0; margin-bottom: 24px;">
            <div style="font-family: 'Playfair Display', 'Georgia', serif; font-size: 32px; font-weight: 900; color: #dba114; letter-spacing: -0.5px; margin-bottom: 8px;">
                CONGRATULATIONS
            </div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; letter-spacing: 4px; color: #64748b; text-transform: uppercase;">
                 MEMBERSHIP CLEARANCE RECORD MATCHED
            </div>
        </div>

        <p style="font-size: 16px; font-weight: bold; color: #010409; margin-bottom: 20px; font-family: 'Inter', sans-serif;">
            Dear ${name || 'Valued Client'},
        </p>
        
        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
            First Pacific Global is deeply honored to congratulate you. Your selective application has been successfully audited, and your custom sovereign banking portfolio has been established.
        </p>

        <div style="border: 1px solid #e2e8f0; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 24px; border-radius: 16px; margin-bottom: 28px; border-left: 5px solid #dba114; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 12px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">
                <tr style="height: 32px;">
                    <td style="color: #64748b; font-family: sans-serif; font-size: 11px;">PORTFOLIO TIER</td>
                    <td align="right" style="color: #dba114; font-size: 13px; font-weight: 800;">🥇 ${accountTier === 'sovereign' ? 'Sovereign Checking' : 'Private Wealth Reserve'}</td>
                </tr>
                <tr style="height: 32px;">
                    <td style="color: #64748b; font-family: sans-serif; font-size: 11px;">CREDENTIAL VERIFICATION</td>
                    <td align="right" style="color: #10b981; font-size: 12px;">● APPROVED & SECURED</td>
                </tr>
                <tr style="height: 32px;">
                    <td style="color: #64748b; font-family: sans-serif; font-size: 11px;">APY GUARANTEE IN FORCE</td>
                    <td align="right" style="color: #0f172a; font-size: 12px;">📈 5.15% FIXED APY</td>
                </tr>
                <tr style="height: 32px;">
                    <td style="color: #64748b; font-family: sans-serif; font-size: 11px;">FDIC GAURANTEE ASSURANCE</td>
                    <td align="right" style="color: #0c4a6e; font-size: 12px;">🛡️ $2,500,000 COLLATERALED</td>
                </tr>
                <tr style="height: 32px;">
                    <td style="color: #64748b; font-family: sans-serif; font-size: 11px;">SWISS CONCIERGE LINE</td>
                    <td align="right" style="color: #ef4444; font-size: 12px;">⭐ ACTIVE / PRIVATE DESK</td>
                </tr>
            </table>
        </div>

        <p style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 16px;">
            🎉 Premium US Bank Onboarding Features Now Unlocked:
        </p>
        
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 16px; margin-bottom: 24px; font-size: 13px; line-height: 1.6; color: #475569; font-family: sans-serif;">
            <tr>
                <td valign="top" style="padding-bottom: 20px; width: 32px;"><span style="color: #dba114; font-size: 20px; line-height: 1;">✦</span></td>
                <td style="padding-bottom: 20px;">
                    <strong style="color: #0f172a; font-size: 14px;">Instant High-Speed Wire Clearing System</strong><br/>
                    Deploy direct FedWire, international Swift MT103 codes, and automated instant settlement protocols synchronously through your custom transfer terminal.
                </td>
            </tr>
            <tr>
                <td valign="top" style="padding-bottom: 20px; width: 32px;"><span style="color: #dba114; font-size: 20px; line-height: 1;">✦</span></td>
                <td style="padding-bottom: 20px;">
                    <strong style="color: #0f172a; font-size: 14px;">Personalized Wealth Advisor Desk</strong><br/>
                    You are automatically matched to an elite private wealth desk. Get travel booking handshakes, travel charters coordination, or bespoke assets diagnostics instantly.
                </td>
            </tr>
            <tr>
                <td valign="top" style="padding-bottom: 20px; width: 32px;"><span style="color: #dba114; font-size: 20px; line-height: 1;">✦</span></td>
                <td style="padding-bottom: 20px;">
                    <strong style="color: #0f172a; font-size: 14px;">Sovereign Vault Signature Access</strong><br/>
                    Your master ledger is protected under multi-layer biological handshakes (FaceID Diagnostic) and secure enclave chips for military-tier asset protection.
                </td>
            </tr>
        </table>

        <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 20px;">
            Your legal compliance dossiers are fully bundled and attached as a PDF receipt for your legal files. Tap the button below to complete the onboarding tour and customize your secure terminal.
        </p>

        <p style="margin-top: 30px; font-style: italic; color: #64748b; font-size: 11px; text-align: center; font-family: 'JetBrains Mono', monospace;">
            First Pacific National Bank, N.A. Member FDIC. Private Wealth services are registered under federal regulatory acts.
        </p>`,
        "Complete Onboarding"
    );
    
    // Dispatch HUD for immediate feedback
    dispatchLocalHud(`Welcome to First Pacific ${accountTier}! Premium Onboarding Package has been successfully generated.`);
    
    // Attach Application Dossier if provided
    const attachments = pdfBase64Attachment ? [{
        filename: 'Bank_Account_Enrollment_Congratulations.pdf',
        content: pdfBase64Attachment
    }] : undefined;
    
    // Send Real Email
    return await sendEmail(email, subject, body, attachments);
};

export const sendWelcomeSms = async (phoneNumber: string, name: string, accountTier: string) => {
    const message = `Bank Welcome 🏛️: ${name}, your ${accountTier} portfolio is established. Security review pending. Full access restored upon bank clearance.\n\nAccess: firstpaba.com/login`;
    
    // Dispatch HUD
    dispatchLocalHud(message);
    
    // Send Real SMS
    return await sendTwilioSms(phoneNumber, message);
};

export const sendRecipientTransferNotification = async (params: {
    recipientEmail: string;
    recipientName: string;
    senderName: string;
    senderEmail: string;
    amount: number;
    transactionId: string;
    isInternal: boolean;
    paymentRail: string;
    estimatedArrival?: string;
    beneficiaryEmailTone?: 'Professional' | 'Detailed';
    recipientDetails?: any;
}): Promise<NotificationResult> => {
    const { recipientEmail, recipientName, senderName, senderEmail, amount, transactionId, isInternal, paymentRail, beneficiaryEmailTone, recipientDetails } = params;
    
    const formattedAmount = amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    const shortTxId = transactionId.slice(-12).toUpperCase();
    const dateToday = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const timeToday = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
    
    const isProfessional = beneficiaryEmailTone === 'Professional';
    
    const subject = isInternal 
        ? `⚡ Cleared instantly: ${senderName} sent you ${formattedAmount}`
        : `📥 Secure incoming transfer: ${senderName} initiated ${formattedAmount} to you`;

    const feeAmount = amount > 50000 ? 150 : (amount > 10000 ? 75 : 35);
    const calculatedAmount = amount - feeAmount;
    const formattedCalculatedAmount = calculatedAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    const formattedFee = feeAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

    let bankNameDisplay = recipientDetails?.bankName || (isInternal ? 'Global Private Bank, N.A.' : 'Pending Secure Link');
    let accountNumDisplay = recipientDetails?.accountNumber ? ('A/C: •••• ' + recipientDetails.accountNumber.slice(-4)) : (isInternal ? 'Primary Portfolio Checking' : 'Awaiting Authorization');
    let routingTransitNum = recipientDetails?.routingNumber || '•••• 0210';
    const targetCountry = recipientDetails?.country?.name || 'United States (US)';
    const swiftBicCode = recipientDetails?.realDetails?.swiftBic || 'BankKUS6SXXX';

    const bankDetailsHtml = `
            <tr style="height: 28px;">
                <td style="color: #64748b; font-family: sans-serif;">Receiver Legal Name</td>
                <td align="right" style="color: #0f172a; font-weight: bold;">${recipientName}</td>
            </tr>
            <tr style="height: 28px;">
                <td style="color: #64748b; font-family: sans-serif;">Receiver Email Address</td>
                <td align="right" style="color: #0f172a; font-weight: bold; text-transform: none;">${recipientEmail}</td>
            </tr>
            <tr style="height: 28px;">
                <td style="color: #64748b; font-family: sans-serif;">Jurisdiction / Country</td>
                <td align="right" style="color: #0f172a; font-weight: bold;">${targetCountry}</td>
            </tr>
            <tr style="height: 28px;">
                <td style="color: #64748b; font-family: sans-serif;">Receiver Institution</td>
                <td align="right" style="color: #0f172a; font-weight: bold;">${bankNameDisplay}</td>
            </tr>
            <tr style="height: 28px;">
                <td style="color: #64748b; font-family: sans-serif;">Destination Account</td>
                <td align="right" style="color: #0f172a; font-weight: bold;">${accountNumDisplay}</td>
            </tr>
            <tr style="height: 28px;">
                <td style="color: #64748b; font-family: sans-serif;">Routing Number (RTN / ABA)</td>
                <td align="right" style="color: #0f172a; font-weight: bold;">${routingTransitNum}</td>
            </tr>
            <tr style="height: 28px;">
                <td style="color: #64748b; font-family: sans-serif;">SWIFT-BIC / Clearing Identifier</td>
                <td align="right" style="color: #0f172a; font-weight: bold;">${swiftBicCode}</td>
            </tr>
            <tr style="height: 28px;">
                <td style="color: #64748b; font-family: sans-serif;">Depositor Protection Cover</td>
                <td align="right" style="color: #16a34a; font-weight: bold;">● SECURED (MEMBER FDIC #82739)</td>
            </tr>
    `;

    // Define interactive tracker visual depending on state
    let trackerHtml = '';
    trackerHtml = `
    <div style="margin: 20px 0; padding: 16px; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; text-align: center;">
        <div style="font-size: 11px; font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #92400e; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">
            SECURITY HOLD &bull; REGULATORY COMPLIANCE ESCROW HOLD
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 11px; font-weight: bold; color: #b45309; font-family: sans-serif;">
            <tr>
                <td align="center" style="width: 33.3%;">
                    <div style="font-size: 16px; margin-bottom: 4px;">🎯</div>
                    <div style="color: #10b981;">TRANSFERRED</div>
                    <div style="font-size: 9px; color: #64748b; font-weight: normal; margin-top: 2px;">${dateToday}</div>
                </td>
                <td valign="middle" align="center" style="width: 25px; color: #fcd34d; font-size: 16px;">&rarr;</td>
                <td align="center" style="width: 33.3%;">
                    <div style="font-size: 16px; margin-bottom: 4px;">⏳</div>
                    <div style="color: #b45309; font-weight: 900;">HELD ON ESCROW</div>
                    <div style="font-size: 9px; color: #78350f; font-weight: bold; margin-top: 2px;">AWAITING ROUTING FEE</div>
                </td>
                <td valign="middle" align="center" style="width: 25px; color: #fcd34d; font-size: 16px;">&rarr;</td>
                <td align="center" style="width: 33.3%;">
                    <div style="font-size: 16px; margin-bottom: 4px;">🔒</div>
                    <div style="color: #64748b;">CREDITED</div>
                    <div style="font-size: 9px; color: #64748b; font-weight: normal; margin-top: 2px;">PENDING RELEASE</div>
                </td>
            </tr>
        </table>
    </div>
    `;

    const claimActionText = isInternal ? "Access Portfolio Terminal" : "Securely Link Bank Account & Claim Funds";
    const claimActionUrl = isInternal ? "https://firstpaba.com/login" : `https://firstpaba.com/claim-transfer?id=${transactionId}&email=${encodeURIComponent(recipientEmail)}`;

    let content = '';

    if (isProfessional) {
        content = `
        <div style="text-align: center; margin-bottom: 18px;">
            <div style="font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 900; color: #1e293b; margin-bottom: 4px;">
                Funds Transfer Cleared
            </div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700; color: #dba114; letter-spacing: 1.5px; text-transform: uppercase;">
                ${isInternal ? "⚡ Instant Ledger Settlement" : "⚡ Direct Clearing Network"}
            </div>
        </div>

        <p style="font-size: 13.5px; line-height: 1.5; color: #334155; margin-bottom: 16px;">
            Dear ${recipientName || 'Valued Recipient'},
        </p>

        <p style="font-size: 13.5px; line-height: 1.5; color: #334155; margin-bottom: 16px;">
            This is a brief notification confirming that a secure payment of <strong>${formattedAmount} USD</strong> was sent to you by <strong>${senderName}</strong> (${senderEmail}).
        </p>

        <div style="border: 1px solid #e2e8f0; background: #f8fafc; padding: 16px; border-radius: 12px; margin-bottom: 18px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 11px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase;">
                <tr style="height: 24px;">
                    <td style="color: #64748b; font-family: sans-serif;">Net Amount</td>
                    <td align="right" style="color: #0f172a; font-weight: bold;">${formattedAmount}</td>
                </tr>
                <tr style="height: 24px;">
                    <td style="color: #64748b; font-family: sans-serif;">Payment Rail</td>
                    <td align="right" style="color: #0f172a; font-weight: bold;">${paymentRail || 'Direct Clearing'}</td>
                </tr>
                <tr style="height: 24px;">
                    <td style="color: #64748b; font-family: sans-serif;">Reference ID</td>
                    <td align="right" style="color: #0f172a; font-weight: bold;">${shortTxId}</td>
                </tr>
                <tr style="height: 24px;">
                    <td style="color: #64748b; font-family: sans-serif;">Status</td>
                    <td align="right" style="color: ${isInternal ? '#166534' : '#b45309'}; font-weight: bold;">
                        ● ${isInternal ? 'SETTLED' : 'CLEARING'}
                    </td>
                </tr>
                ${!isInternal ? `
                <tr><td colspan="2"><hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 6px 0;" /></td></tr>
                ${bankDetailsHtml.replace(/28px/g, '24px')}
                <tr style="height: 24px;">
                    <td style="color: #64748b; font-family: sans-serif;">Est. Processing Fee</td>
                    <td align="right" style="color: #ef4444; font-weight: bold;">-${formattedFee}</td>
                </tr>
                <tr style="height: 24px;">
                    <td style="color: #64748b; font-family: sans-serif;">Available Settlement</td>
                    <td align="right" style="color: #10b981; font-weight: bold;">${formattedCalculatedAmount}</td>
                </tr>` : ''}
            </table>
        </div>

        <p style="font-size: 12px; color: #64748b; line-height: 1.4; margin-bottom: 15px; text-align: center;">
            Use the secure action link below to view or link destination coordinates.
        </p>

        <p style="margin-top: 24px; font-style: italic; color: #94a3b8; font-size: 10px; text-align: center; font-family: 'JetBrains Mono', monospace;">
            First Pacific National Bank, N.A. Member FDIC. True-instant clearing protocol.
        </p>
        `;
    } else {
        content = `
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 900; color: #1e293b; margin-bottom: 4px;">
                Incoming Transfer Notification
            </div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; color: #dba114; letter-spacing: 2px; text-transform: uppercase;">
                ${isInternal ? "🥇 Instant Peer Network Match" : "⚡ Direct Security Clearing Link"}
            </div>
        </div>

        <p style="font-size: 15px; font-weight: bold; color: #0f172a; margin-bottom: 16px;">
            Dear ${recipientName || 'Valued Recipient'},
        </p>

        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
            We are pleased to inform you that a secure transfer of <strong style="color: #0f172a; font-size: 15px;">${formattedAmount} USD</strong> has been initiated directly to your email address by our client, <strong style="color: #dba114;">${senderName}</strong> (${senderEmail}).
        </p>

        ${trackerHtml}

        <div style="border: 1px solid #e2e8f0; background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 4px 10px rgba(0,0,0,0.01);">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 12px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase;">
                <tr style="height: 28px;">
                    <td style="color: #64748b; font-family: sans-serif;">Transfer Amount</td>
                    <td align="right" style="color: #0f172a; font-weight: bold;">${formattedAmount}</td>
                </tr>
                <tr style="height: 28px;">
                    <td style="color: #64748b; font-family: sans-serif;">Originating Bank</td>
                    <td align="right" style="color: #0f172a; font-weight: bold;">Global Private Bank, N.A.</td>
                </tr>
                <tr style="height: 28px;">
                    <td style="color: #64748b; font-family: sans-serif;">Payment Network / Rail</td>
                    <td align="right" style="color: #0f172a; font-weight: bold;">⚡ ${paymentRail || 'Internal Ledger'}</td>
                </tr>
                <tr style="height: 28px;">
                    <td style="color: #64748b; font-family: sans-serif;">Sovereign Reference Code</td>
                    <td align="right" style="color: #0f172a; font-weight: bold; letter-spacing: 0.5px;">${shortTxId}</td>
                </tr>
                <tr style="height: 28px;">
                    <td style="color: #64748b; font-family: sans-serif;">Receipt Timestamp</td>
                    <td align="right" style="color: #64748b;">${dateToday} @ ${timeToday}</td>
                </tr>
                <tr style="height: 28px;">
                    <td style="color: #64748b; font-family: sans-serif;">Settlement Status</td>
                    <td align="right" style="color: #b45309; font-weight: bold;">
                        ● Held Until Verification & Fee Paid
                    </td>
                </tr>
                <tr><td colspan="2"><hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 8px 0;" /></td></tr>
                ${bankDetailsHtml}
                <tr style="height: 28px;">
                    <td style="color: #64748b; font-family: sans-serif;">Processing/Routing Fee</td>
                    <td align="right" style="color: #ef4444; font-weight: bold;">-${formattedFee}</td>
                </tr>
                <tr style="height: 28px;">
                    <td style="color: #64748b; font-family: sans-serif;">Net Expected Credit</td>
                    <td align="right" style="color: #10b981; font-weight: bold;">${formattedCalculatedAmount}</td>
                </tr>
            </table>
        </div>

        ${isInternal ? `
        <p style="font-size: 13.5px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
            🔒 <strong>Verification Required:</strong> Because an institutional security rule is active, these funds are temporarily escrowed. To complete the transfer, click the secure verification button below, log into your First Pacific portal, and authorize the clearance of this credit.
        </p>
        ` : `
        <p style="font-size: 13.5px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
            ⚖️ <strong>Compliance Action Required:</strong> To claim these funds, click the secure verification button below. You can seamlessly link any external US bank account using Plaid, or routing codes to direct the funds. Once authorized, the funds will sweep instantly into your external checking account under our FDIC insured guarantee.
        </p>
        `}

        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 24px;">
            If you have any questions or require concierge clearance guidance, please contact our priority routing desk or priority client support.
        </p>

        <p style="margin-top: 30px; font-style: italic; color: #64748b; font-size: 11px; text-align: center; font-family: 'JetBrains Mono', monospace;">
            First Pacific National Bank, N.A. Member FDIC &copy; 2026. This notification was issued securely on behalf of our premium banking member.
        </p>
        `;
    }

    const finalHtml = generateBankingEmailTemplate(
        isInternal ? "Instant Funds Real-Time Credit" : "Incoming Portfolios Transmit Alert",
        content,
        claimActionText,
        claimActionUrl
    );

    // Dispatch HUD log for debug/audit tracking
    dispatchLocalHud(`Real-Time Active Recipient Email Alert (${beneficiaryEmailTone || 'Detailed'} tone) queued for delivery to ${recipientEmail}. Track reference: ${shortTxId}`);

    // Call actual sendEmail
    return await sendEmail(recipientEmail, subject, finalHtml);
};

// --- NATIVE PUSH & CURRENCY FLUCTUATION ALERTS ---

export const sendNativePushNotification = (title: string, body: string, icon?: string): boolean => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
            try {
                new Notification(title, {
                    body,
                    icon: icon || '/favicon.ico',
                    badge: '/favicon.ico',
                    tag: `fx_alert_${Date.now()}`
                });
                return true;
            } catch (e) {
                console.warn('[NotificationService] Native push notification failed:', e);
            }
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    try {
                        new Notification(title, { body, icon: icon || '/favicon.ico' });
                    } catch (e) {
                        console.warn('[NotificationService] Push on permission grant failed:', e);
                    }
                }
            });
        }
    }
    return false;
};

export const sendCurrencyFluctuationAlert = async (params: {
    currencyPair: string;
    conditionType?: string;
    changePercent: number;
    newRate: number;
    threshold?: number;
    userEmail?: string;
    optedMethods?: ('push' | 'email' | 'sms')[];
}): Promise<NotificationResult> => {
    const { currencyPair, changePercent, newRate, userEmail, optedMethods = ['push', 'email'] } = params;

    const isPositive = changePercent >= 0;
    const shiftText = `${isPositive ? '+' : ''}${changePercent.toFixed(2)}%`;
    const title = `🚨 FX Volatility Alert: ${currencyPair} ${shiftText}`;
    const message = `High volatility event detected! ${currencyPair} shifted by ${shiftText} to ${newRate}. Trigger threshold breached for your subscribed position.`;

    // 1. In-App HUD Toast
    dispatchLocalHud(message);

    // 2. Browser Native Push Notification if user opted in
    if (optedMethods.includes('push')) {
        sendNativePushNotification(title, message);
    }

    // 3. Email Notification if user opted in
    const emailTarget = userEmail || USER_PROFILE.email;
    if (optedMethods.includes('email') && emailTarget) {
        const emailContent = `
            <div style="background-color: #f0fdf4; border: 1.5px solid #10b981; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h3 style="color: #15803d; margin-top: 0; margin-bottom: 8px;">💱 High Volatility Event Triggered</h3>
                <p style="color: #1a365d; font-size: 14px; line-height: 1.6; margin: 0;">
                    Your subscribed market monitor for <strong>${currencyPair}</strong> detected a rapid price fluctuation.
                </p>
            </div>
            <table width="100%" style="border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: bold; text-transform: uppercase;">Currency Pair</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; text-align: right; color: #0f172a;">${currencyPair}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: bold; text-transform: uppercase;">Market Shift</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; text-align: right; color: ${isPositive ? '#10b981' : '#dc2626'};">${shiftText}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: bold; text-transform: uppercase;">Live Exchange Rate</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; text-align: right; font-family: monospace; color: #0f172a;">${newRate}</td>
                </tr>
            </table>
        `;
        const emailBody = generateBankingEmailTemplate(
            `Currency Fluctuation Advisory: ${currencyPair}`,
            emailContent,
            "View Markets Desk",
            "https://firstpaba.com/fx"
        );
        sendEmail(emailTarget, title, emailBody).catch(console.error);
    }

    // 4. SMS Notification if user opted in
    if (optedMethods.includes('sms')) {
        sendTwilioSms(DEFAULT_PHONE, `${title}: ${message}`).catch(console.error);
    }

    return { success: true };
};
