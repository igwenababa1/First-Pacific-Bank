import React, { useState, useRef, useEffect } from 'react';
import { useBranding } from '../contexts/BrandingContext';
import { Download, FileText, CheckCircle, Search, ShieldCheck, Mail, Send, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { applyBankPdfBackgroundAndWatermark, generateQrCodeDataUrl, embedVerificationQrCodeBlock } from '../utils/pdfWatermarkAndQr';
import { db } from '../services/database';
import { auth, db as firestore } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendEmail } from '../services/emailService';
import SignaturePad from './SignaturePad';
import { QrScanner } from './QrScanner';
import { Transaction, TransactionStatus } from '../types';

export const AdminDocumentCenter: React.FC = () => {
  const { logoUrl, primaryColor, customIssuer } = useBranding();
  
  // Document Types
  const docTypes = [
    { id: 'statement', label: 'Account Statement' },
    { id: 'receipt', label: 'Wire Transfer Receipt' },
    { id: 'credit_debit_alert', label: 'Credit / Debit Alert Notification' },
    { id: 'payment_instruction', label: 'External Payment Instruction Form (Blank)' },
    { id: 'clearance', label: 'Clearance & Source of Funds' },
    { id: 'letter', label: 'Official Bank Guarantee' },
    { id: 'certificate_of_deposit', label: 'Certificate of Deposit (CD)' },
    { id: 'irs_w9', label: 'IRS W-9 Tax Certification' },
    { id: 'irs_1099', label: 'IRS 1099-INT Tax Form' },
    { id: 'irs_w8ben', label: 'IRS W-8BEN Form' },
    { id: 'kyc_aml_clearance', label: 'KYC/AML Compliance Clearance' },
    { id: 'proof_of_funds', label: 'Letter of Credit / Proof of Funds' },
    { id: 'swift_mt103', label: 'SWIFT MT103 / Telegraphic Transfer Tracer' },
    { id: 'bank_cheque', label: 'Certified Bank Cheque' },
    { id: 'indemnity_bond', label: 'Indemnity Bond / Asset Guarantee' },
    { id: 'stop_payment', label: 'Stop Payment Order / Revocation' },
    { id: 'mortgage_pre_approval', label: 'Mortgage Pre-Approval Letter' },
  ];

  const [activeDoc, setActiveDoc] = useState('statement');
  const [isGenerating, setIsGenerating] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  // Users for auto-fill
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  const parseCurrency = (str: string): number => {
    if (!str) return 0;
    return parseFloat(str.replace(/[^0-9.-]+/g, "")) || 0;
  };

  // Helper to convert numbers to words for payment instructions
  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = ['', 'Thousand', 'Million', 'Billion'];

    if (num === 0) return 'Zero';
    
    // Split dollars and cents
    const parts = num.toString().split('.');
    const dollars = parseInt(parts[0], 10);
    const cents = parts[1] ? parseInt(parts[1].slice(0, 2), 10) : 0;

    const formatSegment = (n: number): string => {
      let str = '';
      if (n >= 100) {
        str += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        str += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 0) {
        str += ones[n] + ' ';
      }
      return str.trim();
    };

    let dollarStr = '';
    let scaleIdx = 0;
    let remaining = dollars;

    while (remaining > 0) {
      const chunk = remaining % 1000;
      if (chunk > 0) {
        const chunkStr = formatSegment(chunk);
        dollarStr = chunkStr + (scales[scaleIdx] ? ' ' + scales[scaleIdx] : '') + (dollarStr ? ' ' + dollarStr : '');
      }
      remaining = Math.floor(remaining / 1000);
      scaleIdx++;
    }

    dollarStr = dollarStr.trim() || 'Zero';

    if (cents > 0) {
      const centsStr = formatSegment(cents);
      return `${dollarStr} and ${centsStr} Cents`;
    }
    
    return dollarStr;
  };
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await db.getAllUsers();
        setAllUsers(users);
      } catch (e) {
        console.error(e);
      }
    };
    fetchUsers();
  }, []);

  // Form Fields
  const [docDate, setDocDate] = useState(new Date().toLocaleDateString());
  const [docRef, setDocRef] = useState(`REF-${Math.floor(Math.random() * 100000000)}`);
  const [customerName, setCustomerName] = useState('John Doe');
  const [accountNumber, setAccountNumber] = useState('1234567890');
  const [customerAddress, setCustomerAddress] = useState('123 Private Wealth St, Geneva, Switzerland');
  const [clearingNetwork, setClearingNetwork] = useState('SWIFT / OFFSHORE SECURED');
  const [docTitle, setDocTitle] = useState('Account Statement');
  
  // Specific Fields
  const [balance, setBalance] = useState('$1,250,000.00');
  const [amount, setAmount] = useState('$50,000.00');
  const [haltFee, setHaltFee] = useState('$0.00');
  const [insuranceFee, setInsuranceFee] = useState('$0.00');
  const [wireFee, setWireFee] = useState('$0.00');
  const [alertType, setAlertType] = useState<'CREDIT' | 'DEBIT'>('DEBIT');
  const [beneficiaryName, setBeneficiaryName] = useState('CHIBUZOR IYKE NWAIWU');
  const [beneficiaryAccount, setBeneficiaryAccount] = useState('215533429905');
  const [routingInstruction, setRoutingInstruction] = useState('FEDERAL WIRE PRIORITY');
  const [transferStatus, setTransferStatus] = useState('COMPLETED');
  const [bankOfficer, setBankOfficer] = useState('Michael T. Wellington');
  const [officerTitle, setOfficerTitle] = useState('Authorized Banking Officer');
  const [customText, setCustomText] = useState('We hereby certify that the aforementioned client maintains an active account in good standing with our institution, free of any encumbrances, liens, or restrictions.');
  const [statementNotes, setStatementNotes] = useState('This official statement reflects the final cleared balances as of the date issued. All assets held in custody are fully insured and segregated in accordance with international financial regulations. Outstanding holds, pending uncleared remittances, and active escrows have not been included in the Ledger Balance until final settlement is confirmed by the central clearing authority.');

  // Payment Instruction Specific Fields
  const [payInstructionCurrency, setPayInstructionCurrency] = useState('USD');
  const [payInstructionAmount, setPayInstructionAmount] = useState('0.00');
  const [payInstructionWords, setPayInstructionWords] = useState('Zero');
  const [payInstructionPurpose, setPayInstructionPurpose] = useState('Invoice Payment');
  const [payInstructionBankName, setPayInstructionBankName] = useState('Lead');
  const [payInstructionSwift, setPayInstructionSwift] = useState('LEADUS33');
  const [payInstructionRouting, setPayInstructionRouting] = useState('101019644');
  const [payInstructionAddress, setPayInstructionAddress] = useState('1801 Main St., Kansas City, MO 64108');
  const [payInstructionBtc, setPayInstructionBtc] = useState('bc1q...');
  const [payInstructionEth, setPayInstructionEth] = useState('0x...');
  const [clientSignature, setClientSignature] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  useEffect(() => {
    switch (activeDoc) {
      case 'statement':
        setDocTitle('Account Statement');
        break;
      case 'receipt':
        setDocTitle('Wire Transfer Receipt');
        break;
      case 'credit_debit_alert':
        setDocTitle('Credit / Debit Alert Notification');
        break;
      case 'payment_instruction':
        setDocTitle('External Payment Instruction Form');
        break;
      case 'clearance':
        setDocTitle('Clearance & Source of Funds');
        setCustomText('We hereby certify that the aforementioned client has undergone full enhanced Due Diligence (EDD) and AML vetting. The funds deposited in this institution are clean, of non-criminal origin, and fully cleared by the relevant international monetary authorities for unrestricted outward remittance.');
        break;
      case 'letter':
        setDocTitle('Official Bank Guarantee');
        setCustomText('We hereby certify that the aforementioned client maintains an active account in good standing with our institution, free of any encumbrances, liens, or restrictions.');
        break;
      case 'certificate_of_deposit':
        setDocTitle('Certificate of Deposit (CD)');
        setCustomText('This certifies that the sum of ' + amount + ' has been deposited with our institution into a guaranteed, fixed-yield certificate of deposit. These funds are insured and will be held in custody until maturity under the explicit instruction of the account holder.');
        break;
      case 'irs_w9':
        setDocTitle('IRS W-9 Tax Certification Request');
        setCustomText('In accordance with the United States Internal Revenue Service (IRS), you are requested to provide your correct Taxpayer Identification Number (TIN) to certify your legal status. Failure to furnish a valid TIN may result in backup withholding on your accounts.');
        break;
      case 'irs_1099':
        setDocTitle('IRS 1099-INT Tax Form (Interest Income)');
        setCustomText('This official 1099-INT summary reports the total interest income credited to your institutional accounts for the preceding tax year. This informational form has been transmitted to the appropriate revenue authorities for compliance.');
        break;
      case 'irs_w8ben':
        setDocTitle('IRS W-8BEN Form (Certificate of Foreign Status)');
        setCustomText('This document certifies the beneficial owner is a non-U.S. person for United States tax withholding and reporting purposes. This status exempts the specified accounts from domestic US tax withholding under standard FATCA reporting guidelines.');
        break;
      case 'kyc_aml_clearance':
        setDocTitle('KYC/AML Compliance Clearance');
        setCustomText('We declare that full Know Your Customer (KYC) and Anti-Money Laundering (AML) profiles have been collected, verified, and approved by the sovereign compliance department. The individual/entity holds full risk clearance.');
        break;
      case 'proof_of_funds':
        setDocTitle('Letter of Credit / Proof of Funds');
        setCustomText('This letter serves as an irrevocable Proof of Funds (POF). The client currently holds ' + balance + ' in liquid cash reserves, which are fully segregated, unencumbered, and immediately available for their specified investments or transactional deployments.');
        break;
      case 'swift_mt103':
        setDocTitle('SWIFT MT103 / Telegraphic Transfer Tracer');
        setCustomText('SWIFT Transmission Record. This document is a system-generated extraction of a SWIFT FIN message confirming the irrevocable credit transfer.');
        break;
      case 'bank_cheque':
        setDocTitle('Certified Bank Cheque');
        setCustomText('Bank Cheque Generator. Fields use the Pay Instruction and Beneficiary values.');
        break;
      case 'indemnity_bond':
        setDocTitle('Indemnity Bond / Asset Guarantee');
        setCustomText('This Indemnity Bond certifies that ' + customIssuer + ' irrevocably guarantees the specified assets against default, protecting the beneficiary from any liability or financial loss originating from the execution of the underlying contract.');
        break;
      case 'stop_payment':
        setDocTitle('Stop Payment Order / Revocation');
        setCustomText('This document confirms that a formal Stop Payment Order has been legally placed on the referenced transaction or draft. Funds will be returned to the originator\'s account following the customary clearing reversal period.');
        break;
      case 'mortgage_pre_approval':
        setDocTitle('Mortgage / Loan Pre-Approval Letter');
        setCustomText('We are pleased to inform you that your financial profile, credit history, and asset reserves have been verified. You are formally pre-approved for institutional lending or mortgage underwriting up to the maximum stipulated limit.');
        break;
      default:
        setDocTitle('Official Notification');
        break;
    }
  }, [activeDoc, amount, balance, customIssuer]);

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage(`Copied ${label} to clipboard!`);
    setTimeout(() => {
      setToastMessage('');
    }, 2500);
  };

  const handleDownloadPaymentInstructionsPdf = async () => {
    setIsSending(true);
    setToastMessage('Compiling Payment Instructions PDF...');
    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });
      
      applyBankPdfBackgroundAndWatermark(doc, {
        title: 'PAYMENT INSTRUCTIONS',
        documentRef: `REF: FPB-PAY-${new Date().getFullYear()}`
      });

      // Document details
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105); // slate-600
      doc.setFontSize(10);
      doc.text('DOCUMENT ID: FPB-PAY-INST-880', 20, 60);
      
      const dateText = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.text(`ISSUED ON: ${dateText}`, 120, 60);

      // Content region
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(13);
      doc.text('INCOMING USD PAYMENT INSTRUCTIONS', 20, 75);

      // Grid container background for details
      doc.setFillColor(254, 252, 232); // Amber-50
      doc.setDrawColor(254, 240, 138); // Amber-200
      doc.setLineWidth(0.3);
      doc.rect(18, 70, 174, 130, 'FD');

      const items = [
        { label: 'Beneficiary Account Name', value: beneficiaryName || 'CHIBUZOR IYKE NWAIWU' },
        { label: 'Beneficiary Account Number', value: beneficiaryAccount || '215533429905' },
        { label: 'Beneficiary Bank Name', value: payInstructionBankName || 'Lead' },
        { label: 'ACH Routing/ABA Number', value: payInstructionRouting || '101019644' },
        { label: 'Wire Routing / SWIFT Code', value: payInstructionSwift || '101019644' },
        { label: 'Account Type', value: 'Checking' },
        { label: 'Bank Physical Address', value: payInstructionAddress || '1801 Main St., Kansas City, MO 64108' },
        { label: 'BTC Network ID', value: payInstructionBtc || 'Not Provided' },
        { label: 'ETH / USDT ID', value: payInstructionEth || 'Not Provided' }
      ];

      let currentY = 82;
      items.forEach((item, idx) => {
        // Label background stripe for zebra grid
        if (idx % 2 === 0) {
          doc.setFillColor(254, 252, 232); // Amber-50 (already filled)
        } else {
          doc.setFillColor(255, 255, 255); // White stripe
          doc.rect(18.5, currentY - 6, 173, 14, 'F');
        }

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(120, 113, 108); // warmStone-500
        doc.setFontSize(9);
        doc.text(item.label, 24, currentY + 1);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42); // slate-900
        doc.setFontSize(10);
        
        // Multi-line wrap support for longer address field
        if (item.label.includes('Address')) {
          const splitAddress = doc.splitTextToSize(item.value, 100);
          doc.text(splitAddress, 80, currentY + 1);
        } else {
          doc.text(item.value, 80, currentY + 1);
        }

        // Horizontal dotted divider
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.2);
        doc.line(20, currentY + 6, 190, currentY + 6);

        currentY += 14;
      });

      // Verification seal block
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.3);
      doc.rect(18, 210, 174, 30, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(14, 116, 144);
      doc.setFontSize(10);
      doc.text('SECURITY VERIFICATION NOTICE', 24, 217);

      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFontSize(8.5);
      const splitNote = doc.splitTextToSize(
        'Please verify these coordinates correspond to your approved First Pacific Bank clearance documents. This routing sheet is secured with advanced client authorization signatures. For digital wallets, copy the ID directly to prevent errors.',
        160
      );
      doc.text(splitNote, 24, 223);

      const originHost = typeof window !== 'undefined' ? window.location.origin : 'https://firstpacificbank.com';
      const verifyPayload = `${originHost}/verify?doc=PAY_INST&client=${encodeURIComponent(customerName || 'Client')}&status=VERIFIED`;
      embedVerificationQrCodeBlock(doc, await generateQrCodeDataUrl(verifyPayload, 200), 20, 250, { width: 170, height: 20 });

      doc.save('USD_Target_Payment_Instructions.pdf');

      // Prepare real-time email dispatch automatically on click!
      const targetEmail = selectedUser?.email || auth.currentUser?.email || 'info@lawrenceconsultantsorg.org';
      const targetName = customerName || selectedUser?.name || 'Valued Account Holder';
      const pdfUri = doc.output('datauristring');
      const pdfBase64 = pdfUri.split(',')[1] || pdfUri;

      setToastMessage('Real-Time Secured Dispatching...');

      // Dynamic custom luxury email layout detailing all payments credentials 
      const emailContent = getPremiumEmailHtml('payment_instruction');

      const emailRes = await sendEmail(
        targetEmail,
        `⚡ Institutional USD Core Clearing & Routing Instructions: FPB-PAY-INST-880`,
        emailContent,
        [{ filename: 'USD_Target_Payment_Instructions.pdf', content: pdfBase64 }]
      );

      if (!emailRes.success) {
        throw new Error(emailRes.error || "Email delivery failed on core routing coordinates.");
      }

      await addDoc(collection(firestore, 'secure_messages'), {
        senderId: 'admin',
        receiverId: targetEmail,
        subject: `Institutional USD Core Clearance Coordinates`,
        content: `Dear ${targetName},\n\nYour official sovereign-validated USD Incoming Payment Routing Instructions sheet has been securely generated and sent to your email with a PDF document attached.\n\nSincerely,\n${customIssuer}`,
        status: 'unread',
        isPriority: true,
        createdAt: serverTimestamp()
      });

      setToastMessage('✓ Downloaded & Emailed in Real Time!');
      setTimeout(() => setToastMessage(''), 3000);

    } catch (e: any) {
      console.error(e);
      alert(`Instructions downloaded successfully, but automated email dispatch encountered an issue: ${e.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Visual Customizations
  const [stampStyle, setStampStyle] = useState('red-700');
  const [stampText, setStampText] = useState('AUTHORIZED');
  const [stampSubText, setStampSubText] = useState('OFFICIAL COPY');
  const [watermarkIcon, setWatermarkIcon] = useState(true);

  // When document type changes, update title
  useEffect(() => {
    setDocTitle(docTypes.find(d => d.id === activeDoc)?.label || 'Official Document');
  }, [activeDoc]);

  const handleDownloadPdf = async () => {
    if (!pdfRef.current) return;
    setIsGenerating(true);
    setToastMessage('Generating Official multi-page PDF copy...');
    try {
      const canvas = await html2canvas(pdfRef.current, { 
        scale: 2.0, // premium quality for print resolution
        useCORS: true, 
        allowTaint: false, 
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfPageHeight = pdf.internal.pageSize.getHeight(); // 297mm
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      let isFirstPage = true;
      
      while (heightLeft > 0) {
        if (!isFirstPage) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfPageHeight;
        position -= pdfPageHeight; // scroll viewport up
        isFirstPage = false;
      }

      // Embed Verification QR Code Block on the last page overlay
      const originHost = typeof window !== 'undefined' ? window.location.origin : 'https://firstpacificbank.com';
      const verifyPayload = `${originHost}/verify?doc=${activeDoc}&client=${encodeURIComponent(customerName || 'Client')}&status=VERIFIED`;
      embedVerificationQrCodeBlock(pdf, await generateQrCodeDataUrl(verifyPayload, 200), 20, pdfPageHeight - 35, { width: 170, height: 20 });

      pdf.save(`${customIssuer.replace(/\s+/g, '_')}_${activeDoc}_${docRef}.pdf`);
      setToastMessage('✓ Local PDF Saved!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (e) {
      console.error('PDF Generation Failed', e);
      alert('Failed to generate PDF locally. Attempting to skip cross-origin assets.');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadTransactionIntoForm = (tx: any, custName?: string, custAcct?: string) => {
    setSelectedTx(tx);
    
    const activeCustName = custName || customerName;
    const activeCustAcct = custAcct || accountNumber;
    
    // Format the date
    const txDate = tx.statusTimestamps?.[TransactionStatus.SUBMITTED] || tx.estimatedArrival || tx.createdAt || new Date();
    setDocDate(new Date(txDate).toLocaleDateString('en-US'));
    
    // Set the reference
    setDocRef(tx.id || `TXN-${Math.floor(Math.random() * 900000 + 100000)}`);
    
    // Format the transaction amount
    const txAmount = tx.sendAmount || tx.amount || 0;
    setAmount(`$${Number(txAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    setPayInstructionAmount(Number(txAmount).toFixed(2));
    setPayInstructionWords(numberToWords(txAmount) + ' US Dollars');

    // Dynamically calculate and format fees based on transaction details
    const calculatedHaltFee = tx.complianceFee !== undefined ? Number(tx.complianceFee) : (txAmount > 100 ? txAmount * 0.01 : 0);
    setHaltFee(`$${calculatedHaltFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

    const calculatedWireFee = tx.transferMethod === 'crypto' ? 0 : (txAmount > 0 ? 45.00 : 0);
    setWireFee(`$${calculatedWireFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

    const calculatedInsuranceFee = txAmount > 500 ? txAmount * 0.005 : 0;
    setInsuranceFee(`$${calculatedInsuranceFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

    // Set Alert Type
    if (tx.type === 'credit') {
      setAlertType('CREDIT');
    } else {
      setAlertType('DEBIT');
    }
    
    // Set status
    setTransferStatus(tx.status || 'COMPLETED');
    
    // Set recipient/beneficiary details if available
    if (tx.recipient) {
      const rec = tx.recipient;
      setBeneficiaryName(rec.fullName || rec.nickname || 'Unknown Beneficiary');
      setBeneficiaryAccount(rec.realDetails?.accountNumber || rec.accountNumber || '');
      setPayInstructionBankName(rec.bankName || 'Sovereign Clearing Agent');
      setPayInstructionSwift(rec.realDetails?.swiftBic || rec.routingNumber || 'FPBUS33');
      setPayInstructionRouting(rec.routingNumber || rec.realDetails?.swiftBic || '021000021');
      
      const addressParts = [rec.streetAddress, rec.city, rec.stateProvince, rec.postalCode].filter(Boolean);
      setPayInstructionAddress(addressParts.length > 0 ? addressParts.join(', ') : 'Standard Registered Beneficiary Address');
    } else {
      // Clear beneficiary info or set defaults
      setBeneficiaryName('Self / Account Transfer');
      setBeneficiaryAccount(activeCustAcct);
      setPayInstructionBankName('First Pacific Private Bank');
      setPayInstructionSwift('FPBUS33');
      setPayInstructionRouting('021000021');
      setPayInstructionAddress('Head Office');
    }
    
    setPayInstructionPurpose(tx.purpose || tx.description || 'Invoice Payment');
    
    // Also set routing instructions based on transaction type
    if (tx.transferMethod === 'crypto') {
      setClearingNetwork('BLOCKCHAIN SECURED WIRE');
      setRoutingInstruction('ON-CHAIN SECURED MUTABLE CORRESPONDENT');
    } else {
      setClearingNetwork('SWIFT / FEDWIRE PRIORITY');
      setRoutingInstruction('FEDERAL WIRE PRIORITY ROUTE');
    }
  };

  const autoFillUser = async (u: any) => {
    const fullName = u.profile?.name || u.name || '';
    const email = u.email || u.profile?.email || '';
    const rawAddress = u.profile?.address || u.address || 'Standard Registered Address';
    
    // Get account number from accounts array or direct profile
    const firstAccount = u.accounts?.[0];
    const acctNum = firstAccount?.accountNumber || firstAccount?.fullAccountNumber || u.accountNumber || Math.floor(Math.random() * 1000000000).toString();
    
    // Get balance safely
    const rawBalance = firstAccount?.balance !== undefined ? (firstAccount?.balance || 0) : ((u?.balance || 0) !== undefined ? (u?.balance || 0) : 0);
    
    setCustomerName(fullName);
    setAccountNumber(acctNum);
    setCustomerAddress(rawAddress);
    setBalance(`$${Number(rawBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    
    // Dynamically query real user transactions to extract genuine beneficiary (recipient) information
    try {
      const userTransactionsList = await db.getTransactionsForUser(email);
      // Sort them by submission date (newest first)
      const sortedTxs = [...userTransactionsList].sort((a: any, b: any) => {
        const dateA = new Date(a.statusTimestamps?.[TransactionStatus.SUBMITTED] || a.createdAt || 0).getTime();
        const dateB = new Date(b.statusTimestamps?.[TransactionStatus.SUBMITTED] || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      setUserTransactions(sortedTxs);
      
      // Look for the most recent debit wire/transfer with recipient details
      const lastDebitWithRecipient = sortedTxs.find(tx => tx.type === 'debit' && tx.recipient);
      
      if (lastDebitWithRecipient) {
        loadTransactionIntoForm(lastDebitWithRecipient, fullName, acctNum);
      } else if (sortedTxs.length > 0) {
        loadTransactionIntoForm(sortedTxs[0], fullName, acctNum);
      } else {
        setSelectedTx(null);
        // Fallback to defaults or first recipient if no custom transfers exist
        const allRecipients = await db.getRecipients();
        if (allRecipients && allRecipients.length > 0) {
          const rec = allRecipients[0];
          setBeneficiaryName(rec.fullName);
          setBeneficiaryAccount(rec.realDetails?.accountNumber || rec.accountNumber || '');
          setPayInstructionBankName(rec.bankName || 'Lead');
          setPayInstructionSwift(rec.realDetails?.swiftBic || 'LEADUS33');
          setPayInstructionRouting(rec.routingNumber || '101019644');
          
          const addressParts = [rec.streetAddress, rec.city, rec.stateProvince, rec.postalCode].filter(Boolean);
          setPayInstructionAddress(addressParts.length > 0 ? addressParts.join(', ') : '1801 Main St., Kansas City, MO 64108');
        }
      }
    } catch (err) {
      console.warn('Could not auto-populate beneficiary from real user transactions:', err);
    }
    
    setSelectedUser(u);
    setSearchQuery('');
  };

  const getPremiumEmailHtml = (type: string) => {
    const isPayInst = type === 'payment_instruction';
    const isStatement = type === 'statement';
    const isReceipt = type === 'receipt';
    const isClearance = type === 'clearance';
    const isLetter = type === 'letter';
    const isAlert = type === 'credit_debit_alert';

    let innerContent = '';

    if (isPayInst) {
      innerContent = `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-top: 25px;">
          <h3 style="color: #0f172a; font-family: sans-serif; font-size: 14px; font-weight: bold; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
            1. Originator Remittance Source (Primary)
          </h3>
          <table cellpadding="6" cellspacing="0" style="width: 100%; font-size: 13px; font-family: sans-serif; border-collapse: collapse; margin-bottom: 25px;">
            <tr style="background-color: #f1f5f9;">
              <td style="font-weight: bold; width: 40%; color: #475569;">Originator Account Name:</td>
              <td style="color: #0f172a; font-weight: 600;">${customerName}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #475569;">Originator Account / IBAN:</td>
              <td style="color: #0f172a; font-mono; font-family: monospace; font-weight: 600;">${accountNumber}</td>
            </tr>
            <tr style="background-color: #f1f5f9;">
              <td style="font-weight: bold; color: #475569;">Remitter Security Address:</td>
              <td style="color: #475569;">${customerAddress}</td>
            </tr>
          </table>

          <h3 style="color: #0f172a; font-family: sans-serif; font-size: 14px; font-weight: bold; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
            2. Beneficiary Credit Coordinates (Target)
          </h3>
          <table cellpadding="6" cellspacing="0" style="width: 100%; font-size: 13px; font-family: sans-serif; border-collapse: collapse; margin-bottom: 25px;">
            <tr style="background-color: #f1f5f9;">
              <td style="font-weight: bold; width: 40%; color: #475569;">Beneficiary Account Name:</td>
              <td style="color: #0f172a; font-weight: 600; text-transform: uppercase;">${beneficiaryName}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #475569;">Beneficiary Account Number / IBAN:</td>
              <td style="color: #0f172a; font-mono; font-family: monospace; font-weight: 600;">${beneficiaryAccount}</td>
            </tr>
            <tr style="background-color: #f1f5f9;">
              <td style="font-weight: bold; color: #475569;">Beneficiary Institution Name:</td>
              <td style="color: #0f172a; font-weight: 600;">${payInstructionBankName}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #475569;">Bank SWIFT / BIC Code:</td>
              <td style="color: #0f172a; font-mono; font-family: monospace; font-weight: 600; text-transform: uppercase;">${payInstructionSwift}</td>
            </tr>
            <tr style="background-color: #f1f5f9;">
              <td style="font-weight: bold; color: #475569;">Routing Code / Sort:</td>
              <td style="color: #0d9488; font-mono; font-family: monospace; font-weight: 600;">${payInstructionRouting}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #475569;">Beneficiary Physical Address:</td>
              <td style="color: #475569;">${payInstructionAddress}</td>
            </tr>
          </table>

          <h3 style="color: #0f172a; font-family: sans-serif; font-size: 14px; font-weight: bold; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
            3. Sovereign Clearing Details
          </h3>
          <table cellpadding="6" cellspacing="0" style="width: 100%; font-size: 13px; font-family: sans-serif; border-collapse: collapse;">
            <tr style="background-color: #f1f5f9;">
              <td style="font-weight: bold; width: 40%; color: #475569;">Remitted Currency Unit:</td>
              <td style="color: #0f172a; font-weight: 600;">${payInstructionCurrency}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #475569;">Total Outgoing Volume (Numbers):</td>
              <td style="color: #b45309; font-mono; font-family: monospace; font-size: 16px; font-weight: 800;">${payInstructionCurrency} ${payInstructionAmount}</td>
            </tr>
            <tr style="background-color: #f1f5f9;">
              <td style="font-weight: bold; color: #475569;">Remittance Value in Words:</td>
              <td style="color: #0f172a; font-style: italic; font-weight: 600; text-transform: uppercase; font-size: 11px;">${payInstructionWords}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #475569;">Purpose of Transmission Reference:</td>
              <td style="color: #1e3a8a; font-weight: bold;">${payInstructionPurpose}</td>
            </tr>
          </table>

          <h3 style="color: #0f172a; font-family: sans-serif; font-size: 14px; font-weight: bold; margin-top: 25px; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
            4. Alternative Digital / Crypto Clearance Nodes
          </h3>
          <p style="font-size: 13px; color: #334155; margin-bottom: 15px;">If you are utilizing our digital asset bridge to clear this transaction, please copy the exact wallet ID below. Transfer the exact equivalent amount to prevent delays.</p>
          <table cellpadding="6" cellspacing="0" style="width: 100%; font-size: 13px; font-family: sans-serif; border-collapse: collapse;">
            <tr style="background-color: #f1f5f9;">
              <td style="font-weight: bold; width: 40%; color: #475569;">Bitcoin (BTC) Network ID:</td>
              <td style="color: #0f172a; font-mono; font-family: monospace; font-weight: 800; word-break: break-all;">${payInstructionBtc}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #475569;">Ethereum (ERC20/USDT) ID:</td>
              <td style="color: #0f172a; font-mono; font-family: monospace; font-weight: 800; word-break: break-all;">${payInstructionEth}</td>
            </tr>
          </table>
        </div>
      `;
    } else if (isStatement) {
      innerContent = `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-top: 25px;">
          <h3 style="color: #0f172a; font-family: sans-serif; font-size: 14px; font-weight: bold; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; text-transform: uppercase;">
            Portfolio Balances Overview
          </h3>
          <div style="margin-bottom: 25px; display: table; width: 100%; border-spacing: 10px; border-collapse: separate;">
            <div style="display: table-cell; background-color: #ffffff; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; text-align: center; vertical-align: middle;">
              <div style="font-size: 9px; color: #94a3b8; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.5px;">Ledger Cleared Assets</div>
              <div style="font-size: 22px; font-weight: 900; color: #0f172a; font-family: monospace;">${balance}</div>
            </div>
            <div style="display: table-cell; background-color: #ffffff; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; text-align: center; vertical-align: middle;">
              <div style="font-size: 9px; color: #94a3b8; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.5px;">Clearance Guarantee Status</div>
              <div style="font-size: 11px; font-weight: bold; color: #059669; text-transform: uppercase; letter-spacing: 0.3px;">✓ SECURED & RESTRICTION FREE</div>
            </div>
          </div>

          <table cellpadding="6" cellspacing="0" style="width: 100%; font-size: 13px; font-family: sans-serif; border-collapse: collapse;">
            <tr style="background-color: #f1f5f9;">
              <td style="font-weight: bold; width: 40%; color: #475569;">Fiduciary Client Name:</td>
              <td style="color: #0f172a; font-weight: 600;">${customerName}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #475569;">Registered Account / IBAN:</td>
              <td style="color: #0f172a; font-mono; font-family: monospace; font-weight: 600;">${accountNumber}</td>
            </tr>
            <tr style="background-color: #f1f5f9;">
              <td style="font-weight: bold; color: #475569;">Fiduciary Custody Address:</td>
              <td style="color: #475569;">${customerAddress}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #475569;">Asset Clearing Channel:</td>
              <td style="color: #0d9488; font-weight: bold; font-family: monospace; font-size: 11px;">${clearingNetwork}</td>
            </tr>
          </table>

          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin-top: 25px;">
            <h4 style="font-size: 10px; font-weight: bold; color: #1e293b; margin-top: 0; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">Institutional Disclosure:</h4>
            <p style="font-size: 11px; line-height: 1.6; color: #64748b; margin: 0; text-align: justify;">${statementNotes}</p>
          </div>
        </div>
      `;
    } else if (isReceipt) {
      innerContent = `
        <div style="background-color: #0f172a; color: #ffffff; border-radius: 12px; padding: 25px; margin-top: 25px; border-top: 4px solid #10b981;">
          <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 5px;">Clearing Settlement Advised Amount</div>
          <div style="font-size: 28px; font-weight: 900; color: #ffffff; font-family: monospace; margin-bottom: 20px;">${amount}</div>

          <table cellpadding="6" cellspacing="0" style="width: 100%; font-size: 13px; font-family: sans-serif; border-collapse: collapse; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="color: #94a3b8; width: 40%; font-weight: bold;">Originator Account Name:</td>
              <td style="color: #ffffff; font-weight: 600;">${customerName}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="color: #94a3b8; font-weight: bold;">Originator Safe Account:</td>
              <td style="color: #ffffff; font-mono; font-family: monospace;">${accountNumber}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="color: #94a3b8; font-weight: bold;">Beneficiary Target Name:</td>
              <td style="color: #10b981; font-weight: bold; text-transform: uppercase;">${beneficiaryName}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="color: #94a3b8; font-weight: bold;">Beneficiary Credit Account:</td>
              <td style="color: #ffffff; font-mono; font-family: monospace;">${beneficiaryAccount}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="color: #94a3b8; font-weight: bold;">Transit Instruction Method:</td>
              <td style="color: #fbbf24; font-weight: bold; font-family: monospace;">${routingInstruction}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="color: #94a3b8; font-weight: bold;">Fiduciary Settlement Status:</td>
              <td style="color: #10b981; font-weight: bold; font-family: monospace; text-transform: uppercase;">✓ ${transferStatus}</td>
            </tr>
            <tr>
              <td style="color: #94a3b8; font-weight: bold;">Valuation Settlement Date:</td>
              <td style="color: #ffffff; font-mono; font-family: monospace;">${docDate}</td>
            </tr>
          </table>
        </div>
      `;
    } else if (isAlert) {
      innerContent = `
        <div style="background-color: ${alertType === 'CREDIT' ? '#ecfdf5' : '#fff1f2'}; border: 1px solid ${alertType === 'CREDIT' ? '#a7f3d0' : '#fecdd3'}; border-radius: 12px; padding: 25px; margin-top: 25px; font-family: sans-serif;">
          <h3 style="color: ${alertType === 'CREDIT' ? '#065f46' : '#9f1239'}; font-size: 16px; font-weight: bold; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid ${alertType === 'CREDIT' ? '#a7f3d0' : '#fecdd3'}; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
            ${alertType} ALERT TRANSACTION ADVICE
          </h3>
          <div style="margin-bottom: 15px;">
            <div style="font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.5px;">Accurate Ledger Balance</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; font-family: monospace;">${balance}</div>
          </div>

          <table cellpadding="6" cellspacing="0" style="width: 100%; font-size: 13px; border-collapse: collapse;">
            <tr style="background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0;">
              <td style="font-weight: bold; width: 40%; color: #475569;">Transaction Amount:</td>
              <td style="color: #0f172a; font-weight: bold; font-family: monospace;">${amount}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="font-weight: bold; color: #475569;">International Wire Fee:</td>
              <td style="color: #0f172a; font-family: monospace;">${wireFee}</td>
            </tr>
            <tr style="background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0;">
              <td style="font-weight: bold; color: #475569;">Compliance Halt Fee:</td>
              <td style="color: #0f172a; font-family: monospace;">${haltFee}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="font-weight: bold; color: #475569;">Asset Insurance Fee:</td>
              <td style="color: #0f172a; font-family: monospace;">${insuranceFee}</td>
            </tr>
            <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
              <td style="font-weight: bold; color: #0f172a;">Net Settled Amount:</td>
              <td style="color: ${alertType === 'CREDIT' ? '#059669' : '#dc2626'}; font-weight: bold; font-family: monospace; font-size: 14px;">
                $${(
                  alertType === 'CREDIT' 
                    ? Math.max(0, parseCurrency(amount) - parseCurrency(wireFee) - parseCurrency(haltFee) - parseCurrency(insuranceFee))
                    : parseCurrency(amount) + parseCurrency(wireFee) + parseCurrency(haltFee) + parseCurrency(insuranceFee)
                ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="font-weight: bold; color: #475569;">Originator:</td>
              <td style="color: #0f172a;">${alertType === 'CREDIT' ? beneficiaryName : customerName}</td>
            </tr>
            <tr style="background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0;">
              <td style="font-weight: bold; color: #475569;">Beneficiary:</td>
              <td style="color: #0f172a;">${alertType === 'CREDIT' ? customerName : beneficiaryName}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #475569;">Account Number:</td>
              <td style="color: #0f172a; font-family: monospace;">${accountNumber}</td>
            </tr>
          </table>
        </div>
      `;
    } else {
      innerContent = `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-top: 25px;">
          <h3 style="color: #0f172a; font-family: sans-serif; font-size: 14px; font-weight: bold; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
            ${docTitle} Verification Summary
          </h3>
          
          <table cellpadding="6" cellspacing="0" style="width: 100%; font-size: 13px; font-family: sans-serif; border-collapse: collapse; margin-bottom: 25px;">
            <tr style="background-color: #f1f5f9;">
              <td style="font-weight: bold; width: 40%; color: #475569;">Target Profile Name:</td>
              <td style="color: #0f172a; font-weight: 600;">${customerName}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #475569;">Linked Bank Account / IBAN:</td>
              <td style="color: #0f172a; font-mono; font-family: monospace; font-weight: 600;">${accountNumber}</td>
            </tr>
            <tr style="background-color: #f1f5f9;">
              <td style="font-weight: bold; color: #475569;">Fiduciary Registered Address:</td>
              <td style="color: #475569;">${customerAddress}</td>
            </tr>
          </table>

          <div style="border-left: 4px solid #1e3a8a; background-color: #f1f5f9; padding: 20px; font-style: italic; color: #1e293b; font-family: Georgia, serif; line-height: 1.8; border-radius: 6px; font-size: 13.5px; text-align: justify; margin-bottom: 20px;">
            "${customText}"
          </div>
        </div>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>${docTitle} - ${customIssuer}</title>
      </head>
      <body style="background-color: #f1f5f9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 40px 10px; color: #1e293b; -webkit-font-smoothing: antialiased;">
          <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
              
              <!-- Premium Royal Bank Banner Header -->
              <div style="background-color: #0a1128; background-image: linear-gradient(135deg, #0a1128 0%, #1e293b 100%); text-align: center; padding: 42px 30px; border-bottom: 4px solid #d97706;">
                  <h1 style="color: #ffffff; font-family: 'Times New Roman', Georgia, serif; font-size: 27px; letter-spacing: 2px; margin: 0; font-weight: 900; text-transform: uppercase;">
                    ${customIssuer}
                  </h1>
                  <div style="color: #fbbf24; font-family: sans-serif; font-size: 10px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">
                    GLOBAL PRIVATE WEALTH & DISPATCHES
                  </div>
              </div>

              <!-- Main Content Body -->
              <div style="padding: 40px 35px;">
                  <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 18px; margin-bottom: 25px; display: table; width: 100%;">
                      <div style="display: table-cell; vertical-align: middle;">
                          <div style="font-size: 9px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px;">Authenticity Code ID</div>
                          <div style="font-size: 12px; font-weight: bold; font-family: monospace; color: #475569;">${docRef}</div>
                      </div>
                      <div style="display: table-cell; text-align: right; vertical-align: middle;">
                          <div style="font-size: 9px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px;">Date Authenticated</div>
                          <div style="font-size: 12px; font-weight: bold; color: #475569;">${docDate}</div>
                      </div>
                  </div>

                  <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0; font-weight: bold;">
                      Dear ${customerName},
                  </p>
                  
                  <p style="font-size: 14px; line-height: 1.6; color: #334155; text-align: justify; margin-bottom: 25px;">
                      Please find enclosed your certified <strong>${docTitle}</strong> credentials, transmitted securely by the private banking registry. A full high-resolution, multi-page official copy is securely attached directly to this transmission in PDF format.
                  </p>

                  <!-- Aligned transactional data block -->
                  ${innerContent}

                  <!-- Integrity Audit Certificate Status Card -->
                  <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 22px; margin-top: 30px;">
                      <div style="display: inline-block; vertical-align: top; border-radius: 50%; background-color: #10b981; width: 28px; height: 28px; text-align: center; color: #ffffff; font-size: 16px; font-weight: bold; line-height: 28px; margin-right: 12px;">
                        ✓
                      </div>
                      <div style="display: inline-block; width: 85%; vertical-align: top;">
                          <h4 style="color: #14532d; font-family: sans-serif; font-size: 13px; font-weight: bold; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                            Sovereign Clearing Verification Pass
                          </h4>
                          <ul style="margin: 0; padding-left: 15px; font-size: 11px; color: #166534; line-height: 1.7; font-weight: bold;">
                              <li>Regulatory Remittance Code: <span style="font-family: monospace; color: #14532d;">KYC-SECURE-${Math.floor(Math.random() * 90000) + 10000}</span></li>
                              <li>Certified Issuing Officer: ${bankOfficer}</li>
                              <li>Security Seal Authority: [SHA-256 Verified Ledger Lock]</li>
                              <li>Liquid Cash Reserves Guaranteed: 100% Fully Segregated</li>
                          </ul>
                      </div>
                  </div>

                  <!-- Professional Authorization Footer -->
                  <table cellpadding="0" cellspacing="0" style="width: 100%; margin-top: 35px; border-top: 1px solid #e2e8f0; padding-top: 30px;">
                      <tr>
                          <td style="width: 60%; vertical-align: top;">
                              <div style="font-size: 18px; font-weight: bold; color: #1e3a8a; font-family: 'Times New Roman', Georgia, serif; font-style: italic; margin-bottom: 5px;">
                                ${bankOfficer}
                              </div>
                              <div style="font-size: 11px; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">
                                ${bankOfficer}
                              </div>
                              <div style="font-size: 10px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">
                                ${officerTitle}
                              </div>
                          </td>
                          <td style="width: 40%; text-align: right; vertical-align: top;">
                              <div style="font-size: 9px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
                                Authorizing Seal
                              </div>
                              <div style="font-size: 12px; font-weight: 900; color: #dc2626; border: 3px double #fca5a5; display: inline-block; padding: 5px 12px; text-transform: uppercase; letter-spacing: 1px; transform: rotate(-4deg); border-radius: 4px;">
                                ${stampText}
                              </div>
                          </td>
                      </tr>
                  </table>

              </div>

              <!-- Premium Footer & Disclosures -->
              <div style="background-color: #0f172a; padding: 35px 40px; color: #94a3b8; font-size: 10px; font-family: sans-serif; line-height: 1.6; border-top: 1px solid #1e293b;">
                  <div style="color: #ffffff; font-weight: bold; font-size: 11px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">
                    CONFIDENTIAL PRIVATE WEALTH DISCLOSURE
                  </div>
                  <p style="margin: 0 0 15px 0; text-align: justify; font-weight: medium; color: #94a3b8;">
                      NOTICE OF PRIVACY AND PRIVILEGE: This digital bulletin remains highly classified under central banking security procedures. If you have intercepted this routing advice sheet without authority, you are mandated to notify the dispatch officer immediately and completely delete this message files.
                  </p>
                  <p style="margin: 0; text-align: justify; font-weight: medium; color: #64748b;">
                      ${customIssuer} Switzerland is a licensed custody service asset holder under international financial regulations. Fiduciary clearing processes are subject to audit protocols.
                  </p>
                  <div style="border-top: 1px solid #1e293b; padding-top: 15px; margin-top: 15px; display: flex; justify-content: space-between; font-weight: bold;">
                      <span>© 2026 ${customIssuer} Group. All sovereign rights reserved.</span>
                      <span style="font-family: monospace;">Page 1 / 1</span>
                  </div>
              </div>

          </div>
      </body>
      </html>
    `;
  };

  const handleSendToUser = async () => {
    if (!selectedUser || !selectedUser.email) {
      alert("Please select a valid user profile from the auto-fill menu first.");
      return;
    }
    setIsSending(true);
    try {
        if (!pdfRef.current) throw new Error("PDF component not available");
        
        let pdfBase64 = '';
        try {
            const canvas = await html2canvas(pdfRef.current, { 
                scale: 2.0, // High definition 2.0 scale 
                useCORS: true, 
                allowTaint: false, 
                logging: false,
                backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            
            const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
            const pdfPageHeight = pdf.internal.pageSize.getHeight(); // 297mm
            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;
            
            let heightLeft = imgHeight;
            let position = 0;
            let isFirstPage = true;
            
            // Loop through canvas heights to support complete high-res multi-page PDF rendering
            while (heightLeft > 0) {
                if (!isFirstPage) {
                    pdf.addPage();
                }
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= pdfPageHeight;
                position -= pdfPageHeight;
                isFirstPage = false;
            }

            // Embed Verification QR Code Block on the last page overlay
            const originHost = typeof window !== 'undefined' ? window.location.origin : 'https://firstpacificbank.com';
            const verifyPayload = `${originHost}/verify?doc=${activeDoc}&client=${encodeURIComponent(customerName || 'Client')}&status=VERIFIED`;
            embedVerificationQrCodeBlock(pdf, await generateQrCodeDataUrl(verifyPayload, 200), 20, pdfPageHeight - 35, { width: 170, height: 20 });
            
            const uri = pdf.output('datauristring');
            pdfBase64 = uri.split(',')[1] || uri; 
        } catch (canvasErr) {
            console.error("PDF Render Warning (CORS or Size):", canvasErr);
            throw new Error("Unable to render the document into a high-res PDF. Ensure your brand assets support secure cross-origin resource sharing.");
        }
        
        const filename = `${customIssuer.replace(/\s+/g, '_')}_${activeDoc}_${docRef}.pdf`;
        
        // Dynamically build subject for a highly customized private bank look
        let finalSubject = `Official Document Dispatch: ${docTitle}`;
        if (activeDoc === 'statement') finalSubject = `⚡ Certified Private Portfolio Statement Dispatch - ${customerName} (Ref ${docRef})`;
        if (activeDoc === 'receipt') finalSubject = `⚡ Certified Wire Transfer Clearing Receipt Advice - Ref ${docRef}`;
        if (activeDoc === 'credit_debit_alert') finalSubject = `⚡ Certified Real-Time ${alertType} Transaction Alert - Ref ${docRef}`;
        if (activeDoc === 'payment_instruction') finalSubject = `⚡ Secure Automated Outgoing USD Remittance Instructions - Ref ${docRef}`;
        if (activeDoc === 'clearance') finalSubject = `⚡ High-Value Clearance and AML Certificate of Conformity - Ref ${docRef}`;
        if (activeDoc === 'letter') finalSubject = `⚡ Sovereign Banking Guarantee and Liquid Asset Certify Advice - Ref ${docRef}`;

        // Generate the gorgeous premium styling email HTML aligned explicitly with details!
        const emailContent = getPremiumEmailHtml(activeDoc);

        const emailRes = await sendEmail(
            selectedUser.email,
            finalSubject,
            emailContent,
            [{ filename, content: pdfBase64 }]
        );

        if (!emailRes.success) {
             throw new Error(emailRes.error || "Email delivery API returned a failure. Check server SMTP credentials.");
        }

        // Store secure message log in real-time database
        await addDoc(collection(firestore, 'secure_messages'), {
            senderId: 'admin',
            receiverId: selectedUser.email,
            subject: finalSubject,
            content: `Dear ${customerName},\n\nAn official ${docTitle} has been securely authorized, compiled, and dispatched to your email address with reference ID ${docRef}. The secure PDF has been appended for physical printing.\n\nSincerely,\n${bankOfficer}\n${customIssuer}`,
            status: 'unread',
            isPriority: true,
            createdAt: serverTimestamp()
        });
        
        alert(`✓ Premium ${docTitle} downloaded & secured email successfully dispatched containing full payment details to ${selectedUser.email}!`);
    } catch (e) {
        console.error("Failed to send secure notification", e);
        alert(`Failed to dispatch: ${(e as Error).message}`);
    } finally {
        setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[80vh]">
      {/* Editor Sidebar */}
      <div className="w-full lg:w-[400px] flex-shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-xl flex flex-col gap-6 overflow-y-auto">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-[#0F172A] dark:text-white pb-4 border-b border-slate-100 dark:border-white/10">
            <FileText className="w-5 h-5 text-primary" />
            PDF Blueprint Center
          </h2>
          <p className="text-xs text-[#0F172A] font-bold mt-2">Generate official bank documents fully ready for print or digital dispatch.</p>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black tracking-widest uppercase text-[#0F172A] block">1. Document Type</label>
          <div className="grid grid-cols-1 gap-2">
            {docTypes.map(doc => (
              <button
                key={doc.id}
                onClick={() => setActiveDoc(doc.id)}
                className={`p-3 text-left rounded-xl border text-xs font-bold transition-all ${
                  activeDoc === doc.id 
                  ? 'bg-slate-50 border-slate-900 text-white dark:bg-slate-900 dark:border-white dark:text-white shadow-md' 
                  : 'bg-slate-50 border-slate-200 text-[#0F172A] dark:bg-slate-800 dark:border-white/10 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-50'
                }`}
              >
                {doc.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/10 relative z-50">
          <label className="text-[10px] font-black tracking-widest uppercase text-[#0F172A] block">2. Target Profile (Auto-fill)</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0F172A]" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary text-[#0F172A] dark:text-white font-bold"
            />
          </div>
          {searchQuery && (
            <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl p-2 z-[60]">
              {allUsers.filter(u => {
                const name = (u.profile?.name || u.name || '').toLowerCase();
                const email = (u.email || u.profile?.email || '').toLowerCase();
                const q = searchQuery.toLowerCase();
                return name.includes(q) || email.includes(q);
              }).map(u => {
                const fullName = u.profile?.name || u.name || '';
                const emailAddress = u.email || u.profile?.email || '';
                const firstAccount = u.accounts?.[0];
                const rawBalance = firstAccount?.balance !== undefined ? (firstAccount?.balance || 0) : ((u?.balance || 0) !== undefined ? (u?.balance || 0) : 0);
                return (
                  <button key={u.id} onClick={() => autoFillUser(u)} className="w-full text-left px-4 py-3 text-xs hover:bg-slate-50 dark:hover:bg-white rounded-lg text-[#0F172A] dark:text-white mb-1 transition-colors dark:bg-slate-800">
                    <div className="font-bold flex items-center justify-between">
                      <span>{fullName}</span>
                      <span className="text-[9px] font-mono font-black text-primary">${Number(rawBalance).toLocaleString()}</span>
                    </div>
                    <div className="text-[10px] text-[#0F172A] font-mono mt-1">{emailAddress}</div>
                  </button>
                );
              })}
              {allUsers.filter(u => {
                const name = (u.profile?.name || u.name || '').toLowerCase();
                const email = (u.email || u.profile?.email || '').toLowerCase();
                const q = searchQuery.toLowerCase();
                return name.includes(q) || email.includes(q);
              }).length === 0 && (
                <div className="p-3 text-xs text-[#0F172A] text-center font-bold">No users found</div>
              )}
            </div>
          )}
          {selectedUser && (
            <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-500 p-3 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <div>
                  <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    {selectedUser.profile?.name || selectedUser.name}
                  </div>
                  <div className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70">
                    {selectedUser.email || selectedUser.profile?.email}
                  </div>
                </div>
              </div>
              <button onClick={() => { setSelectedUser(null); setUserTransactions([]); setSelectedTx(null); }} className="text-[9px] font-bold text-[#0F172A] hover:text-[#0F172A] dark:hover:text-[#1E293B] uppercase tracking-wider">
                Clear
              </button>
            </div>
          )}

          {selectedUser && (
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black tracking-widest uppercase text-[#0F172A]">⚡ Real-Time Transactions ({userTransactions.length})</span>
                {selectedTx && (
                  <button 
                    onClick={() => {
                      setSelectedTx(null);
                      // load default fallback values
                      setAmount('$50,000.00');
                      setPayInstructionAmount('50000.00');
                      setPayInstructionWords('Fifty Thousand US Dollars');
                      setTransferStatus('COMPLETED');
                    }} 
                    className="text-[8px] font-bold text-amber-500 hover:text-amber-600 uppercase tracking-wider animate-pulse"
                  >
                    Reset to Fallback
                  </button>
                )}
              </div>
              
              {userTransactions.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {userTransactions.map((tx) => {
                    const txIdShort = (tx.id || '').slice(-8).toUpperCase();
                    const txDateStr = new Date(tx.statusTimestamps?.[TransactionStatus.SUBMITTED] || tx.createdAt || new Date()).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: '2-digit'
                    });
                    const txAmt = tx.sendAmount || tx.amount || 0;
                    const isSelected = selectedTx?.id === tx.id;
                    
                    return (
                      <button
                        key={tx.id}
                        type="button"
                        onClick={() => loadTransactionIntoForm(tx)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-500 border-emerald-500/50 shadow-sm dark:bg-emerald-500'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[9px] font-mono font-bold text-[#0F172A] dark:text-white">#{txIdShort}</span>
                            <span className="text-[9px] text-[#0F172A] font-bold">•</span>
                            <span className="text-[9px] font-mono font-semibold text-[#0F172A]">{txDateStr}</span>
                            {tx.transferMethod && (
                              <span className="text-[8px] font-black uppercase tracking-wider px-1 bg-slate-200 dark:bg-slate-900 text-[#0F172A] dark:text-white rounded">
                                {tx.transferMethod}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-black text-[#0F172A] dark:text-white uppercase truncate">
                            {tx.recipient?.fullName || tx.recipient?.nickname || tx.description || 'Account Transfer'}
                          </div>
                          <div className="text-[9px] text-[#0F172A] font-mono truncate">
                            {tx.recipient?.bankName || 'First Pacific'} • {tx.purpose || 'Invoice Settlement'}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-mono font-black text-[#0F172A] dark:text-white">
                            ${Number(txAmt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="mt-1 flex justify-end">
                            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                              tx.status === 'Completed' || tx.status === 'COMPLETED' || tx.status === 'Funds Arrived'
                                ? 'bg-emerald-500 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : tx.status?.includes('Hold') || tx.status?.includes('Pause') || tx.status?.includes('Review')
                                ? 'bg-amber-500 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-blue-500 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                            }`}>
                              {tx.status || 'SUBMITTED'}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 text-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[10px] text-[#0F172A] font-bold uppercase tracking-wider">
                  No transaction logs found for this user
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/10 relative z-10">
          <label className="text-[10px] font-black tracking-widest uppercase text-[#0F172A] block">3. Document Editor</label>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Document Date</label>
                <input type="text" value={docDate} onChange={e => setDocDate(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-bold" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Document Ref No.</label>
                <input type="text" value={docRef} onChange={e => setDocRef(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-bold" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Document Title</label>
                <input type="text" value={docTitle} onChange={e => setDocTitle(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-bold" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Customer Name</label>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-bold" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Account Number</label>
                <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-mono font-bold" />
              </div>
              <div className="col-span-2">
                <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Address / Region</label>
                <input type="text" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-bold" />
              </div>
              <div className="col-span-2">
                <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Clearing Network</label>
                <input type="text" value={clearingNetwork} onChange={e => setClearingNetwork(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-bold uppercase" />
              </div>
            </div>

            {/* Context Specific Fields */}
            {activeDoc === 'statement' && (
              <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-white/10">
                <div>
                  <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Displayed Balance (Formatted)</label>
                  <input type="text" value={balance} onChange={e => setBalance(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-mono font-bold" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Statement Notes</label>
                  <textarea rows={4} value={statementNotes} onChange={e => setStatementNotes(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white leading-relaxed resize-none custom-scrollbar"></textarea>
                </div>
              </div>
            )}
            
            {(activeDoc === 'receipt' || activeDoc === 'credit_debit_alert') && (
              <>
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100 dark:border-white/10">
                  <div className="col-span-2">
                    <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Transfer Amount (Formatted)</label>
                    <input type="text" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-mono font-bold" />
                  </div>

                  {activeDoc === 'credit_debit_alert' && (
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Alert Type</label>
                      <select 
                        value={alertType} 
                        onChange={e => setAlertType(e.target.value as 'CREDIT' | 'DEBIT')}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-bold"
                      >
                        <option value="CREDIT">CREDIT ALERT</option>
                        <option value="DEBIT">DEBIT ALERT</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Compliance Halt Fee</label>
                    <input type="text" value={haltFee} onChange={e => setHaltFee(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-mono font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Asset Insurance Fee</label>
                    <input type="text" value={insuranceFee} onChange={e => setInsuranceFee(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-mono font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">International Wire Fee</label>
                    <input type="text" value={wireFee} onChange={e => setWireFee(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-mono font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Transfer Status</label>
                    <input type="text" value={transferStatus} onChange={e => setTransferStatus(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-bold uppercase" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Beneficiary Name</label>
                    <input type="text" value={beneficiaryName} onChange={e => setBeneficiaryName(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Beneficiary Account</label>
                    <input type="text" value={beneficiaryAccount} onChange={e => setBeneficiaryAccount(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-mono font-bold" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Routing Instruction</label>
                    <input type="text" value={routingInstruction} onChange={e => setRoutingInstruction(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-mono font-bold" />
                  </div>
                </div>
              </>
            )}

            {['payment_instruction', 'bank_cheque'].includes(activeDoc) && (
              <div className="space-y-3" id="payment-instructions-verified-wrapper">
                {/* Verified 'Sovereign Bank' shield icon and badge */}
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 dark:from-emerald-500/15 dark:to-teal-500/10 border border-emerald-500/20 dark:border-emerald-400/20 rounded-xl" id="sovereign-bank-verification-badge">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-md">
                    <ShieldCheck className="w-5 h-5 animate-[pulse_1.8s_infinite]" />
                  </div>
                  <div className="text-left flex-1">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                      Sovereign Bank Verified
                    </h5>
                    <p className="text-[8.5px] text-[#0F172A] dark:text-white font-bold">Authentic Routing & Cleared USD Settlement Agent</p>
                  </div>
                  <span className="text-[8px] bg-emerald-500 text-emerald-700 dark:text-emerald-400 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 shadow-sm">Secure</span>
                </div>

                <motion.div 
                  initial={{ borderColor: 'rgba(245,158,11,0.2)' }}
                  animate={{ 
                    borderColor: ['rgba(245,158,11,0.3)', 'rgba(245,158,11,0.85)', 'rgba(245,158,11,0.3)'],
                    boxShadow: [
                      '0 0 0px rgba(245,158,11,0)', 
                      '0 0 16px rgba(245,158,11,0.35)', 
                      '0 0 0px rgba(245,158,11,0)'
                    ]
                  }}
                  transition={{ 
                    duration: 2.2, 
                    repeat: Infinity, 
                    ease: 'easeInOut' 
                  }}
                  className="p-4 bg-amber-50 dark:bg-amber-950 rounded-xl border border-amber-500/20 space-y-3 relative overflow-hidden"
                  id="payment-instructions-box"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      Official USD Target Details
                    </span>
                    <button 
                      type="button"
                      onClick={() => {
                        setBeneficiaryName('CHIBUZOR IYKE NWAIWU');
                        setBeneficiaryAccount('215533429905');
                        setPayInstructionBankName('Lead');
                        setPayInstructionSwift('LEADUS33');
                        setPayInstructionRouting('101019644');
                        setPayInstructionAddress('1801 Main St., Kansas City, MO 64108');
                        setPayInstructionPurpose('Remittance Settlement');
                      }}
                      className="text-[9px] font-black uppercase text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1"
                    >
                      ⚡ Auto-Fill Form
                    </button>
                  </div>
                  
                  <div className="text-[11px] space-y-2 text-[#0F172A] dark:text-white font-mono">
                    {/* Beneficiary Name Row */}
                    <div className="flex items-center justify-between border-b border-amber-200/40 dark:border-amber-500/5 pb-1.5">
                      <span className="text-[#0F172A] text-[10px] uppercase font-bold shrink-0">Name:</span>
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span 
                          className="font-bold cursor-pointer hover:text-primary transition-colors text-right" 
                          onClick={() => handleCopyText('CHIBUZOR IYKE NWAIWU', 'Account Name')}
                        >
                          CHIBUZOR IYKE NWAIWU
                        </span>
                        <button 
                          type="button"
                          onClick={() => handleCopyText('CHIBUZOR IYKE NWAIWU', 'Account Name')}
                          className="p-1 hover:bg-amber-100 dark:hover:bg-amber-950 rounded text-[#0F172A] hover:text-amber-600 dark:hover:text-amber-400 transition-all shrink-0"
                          title="Copy Account Name"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Account Number Row */}
                    <div className="flex items-center justify-between border-b border-amber-200/40 dark:border-amber-500/5 pb-1.5">
                      <span className="text-[#0F172A] text-[10px] uppercase font-bold shrink-0">Account:</span>
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span 
                          className="font-bold cursor-pointer hover:text-primary transition-colors font-sans" 
                          onClick={() => handleCopyText('215533429905', 'Account Number')}
                        >
                          215533429905
                        </span>
                        <button 
                          type="button"
                          onClick={() => handleCopyText('215533429905', 'Account Number')}
                          className="p-1 hover:bg-amber-100 dark:hover:bg-amber-950 rounded text-[#0F172A] hover:text-amber-600 dark:hover:text-amber-400 transition-all shrink-0"
                          title="Copy Account Number"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Bank Name Row */}
                    <div className="flex items-center justify-between border-b border-amber-200/40 dark:border-amber-500/5 pb-1.5">
                      <span className="text-[#0F172A] text-[10px] uppercase font-bold shrink-0">Bank:</span>
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span 
                          className="font-bold cursor-pointer hover:text-primary transition-colors" 
                          onClick={() => handleCopyText('Lead', 'Bank Name')}
                        >
                          Lead
                        </span>
                        <button 
                          type="button"
                          onClick={() => handleCopyText('Lead', 'Bank Name')}
                          className="p-1 hover:bg-amber-100 dark:hover:bg-amber-950 rounded text-[#0F172A] hover:text-amber-600 dark:hover:text-amber-400 transition-all shrink-0"
                          title="Copy Bank Name"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* ACH Route Row */}
                    <div className="flex items-center justify-between border-b border-amber-200/40 dark:border-amber-500/5 pb-1.5">
                      <span className="text-[#0F172A] text-[10px] uppercase font-bold shrink-0">ACH Route:</span>
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span 
                          className="font-bold cursor-pointer hover:text-primary transition-colors font-sans" 
                          onClick={() => handleCopyText('101019644', 'ACH Routing Number')}
                        >
                          101019644
                        </span>
                        <button 
                          type="button"
                          onClick={() => handleCopyText('101019644', 'ACH Routing Number')}
                          className="p-1 hover:bg-amber-100 dark:hover:bg-amber-950 rounded text-[#0F172A] hover:text-amber-600 dark:hover:text-amber-400 transition-all shrink-0"
                          title="Copy ACH Routing"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Wire Route Row */}
                    <div className="flex items-center justify-between border-b border-amber-200/40 dark:border-amber-500/5 pb-1.5">
                      <span className="text-[#0F172A] text-[10px] uppercase font-bold shrink-0">Wire Route:</span>
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span 
                          className="font-bold cursor-pointer hover:text-primary transition-colors font-sans" 
                          onClick={() => handleCopyText('101019644', 'Wire Routing Number')}
                        >
                          101019644
                        </span>
                        <button 
                          type="button"
                          onClick={() => handleCopyText('101019644', 'Wire Routing Number')}
                          className="p-1 hover:bg-amber-100 dark:hover:bg-amber-950 rounded text-[#0F172A] hover:text-amber-600 dark:hover:text-amber-400 transition-all shrink-0"
                          title="Copy Wire Routing"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Account Type Row */}
                    <div className="flex items-center justify-between border-b border-amber-200/40 dark:border-amber-500/5 pb-1.5">
                      <span className="text-[#0F172A] text-[10px] uppercase font-bold shrink-0">Type:</span>
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span 
                          className="font-bold cursor-pointer hover:text-primary transition-colors" 
                          onClick={() => handleCopyText('Checking', 'Account Type')}
                        >
                          Checking
                        </span>
                        <button 
                          type="button"
                          onClick={() => handleCopyText('Checking', 'Account Type')}
                          className="p-1 hover:bg-amber-100 dark:hover:bg-amber-950 rounded text-[#0F172A] hover:text-amber-600 dark:hover:text-amber-400 transition-all shrink-0"
                          title="Copy Account Type"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Bank Address Row */}
                    <div className="flex flex-col text-left pt-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[#0F172A] text-[10px] uppercase font-bold shrink-0">Address:</span>
                        <button 
                          type="button"
                          onClick={() => handleCopyText('1801 Main St., Kansas City, MO 64108', 'Bank Address')}
                          className="p-1 hover:bg-amber-100 dark:hover:bg-amber-950 rounded text-[#0F172A] hover:text-amber-600 dark:hover:text-amber-400 transition-all shrink-0"
                          title="Copy Bank Address"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <span 
                        className="text-[10px] break-words cursor-pointer hover:text-primary transition-colors pt-0.5 font-bold" 
                        onClick={() => handleCopyText('1801 Main St., Kansas City, MO 64108', 'Bank Address')}
                      >
                        1801 Main St., Kansas City, MO 64108
                      </span>
                    </div>
                  </div>

                  <div className="text-[9px] text-amber-600 dark:text-amber-400 leading-normal bg-amber-500 p-2 rounded text-center font-bold">
                    💡 Click any variable or copy icon to replicate to clipboard instantly.
                  </div>

                  {/* Operational Buttons */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={handleDownloadPaymentInstructionsPdf}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-[9.5px] font-black uppercase tracking-wider rounded-lg transition-all shadow-sm"
                      title="Download PDF Copy"
                    >
                      <Download className="w-3.5 h-3.5 shrink-0" />
                      <span>Download PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsQrScannerOpen(true)}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-slate-50 hover:bg-white dark:bg-slate-900 dark:text-white dark:hover:bg-slate-100 active:scale-[0.98] text-white text-[9.5px] font-black uppercase tracking-wider rounded-lg transition-all shadow-sm"
                      title="Scan QR and Pay"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                      <span>Quick Pay QR</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {(activeDoc === 'clearance' || activeDoc === 'letter') && (
              <div className="pb-3 border-b border-slate-100 dark:border-white/10">
                <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Body Content Text</label>
                <textarea rows={5} value={customText} onChange={e => setCustomText(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white custom-scrollbar resize-none font-bold leading-relaxed"></textarea>
              </div>
            )}

            {['payment_instruction', 'bank_cheque'].includes(activeDoc) && (
              <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Currency</label>
                    <input type="text" value={payInstructionCurrency} onChange={e => setPayInstructionCurrency(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-mono font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Amount (Numbers)</label>
                    <input type="text" value={payInstructionAmount} onChange={e => setPayInstructionAmount(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-mono font-bold" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Amount (Words)</label>
                    <input type="text" value={payInstructionWords} onChange={e => setPayInstructionWords(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-bold" />
                  </div>
                </div>
                <div className="pt-2">
                  <label className="text-[9px] font-black text-[#0F172A] uppercase mb-2 block border-y border-slate-100 dark:border-white/10 py-1">Beneficiary Target Details</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Beneficiary Name</label>
                      <input type="text" value={beneficiaryName} onChange={e => setBeneficiaryName(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-bold" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Beneficiary Account Number / IBAN</label>
                      <input type="text" value={beneficiaryAccount} onChange={e => setBeneficiaryAccount(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-mono font-bold" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Beneficiary Bank Name</label>
                      <input type="text" value={payInstructionBankName} onChange={e => setPayInstructionBankName(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-bold" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">SWIFT / BIC Code</label>
                      <input type="text" value={payInstructionSwift} onChange={e => setPayInstructionSwift(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-mono font-bold uppercase tracking-widest" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Routing / Sort Code</label>
                      <input type="text" value={payInstructionRouting} onChange={e => setPayInstructionRouting(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-mono font-bold" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Beneficiary Address</label>
                      <input type="text" value={payInstructionAddress} onChange={e => setPayInstructionAddress(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-bold" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Purpose of Payment / Reference</label>
                      <input type="text" value={payInstructionPurpose} onChange={e => setPayInstructionPurpose(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-bold" />
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-white/10 mt-2">
                      <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Alternative Digital Clearance Wallets (Optional)</label>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                           <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">BTC Network ID</label>
                           <input type="text" value={payInstructionBtc} onChange={e => setPayInstructionBtc(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-mono font-bold" />
                        </div>
                        <div>
                           <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">ETH (ERC20/USDT) ID</label>
                           <input type="text" value={payInstructionEth} onChange={e => setPayInstructionEth(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-mono font-bold" />
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-white/10 mt-2">
                       <label className="text-[9px] font-black text-[#0F172A] uppercase mb-2 block tracking-widest">Sign & Authorize</label>
                       <SignaturePad onSignatureChange={setClientSignature} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Certifying Officer</label>
                <input type="text" value={bankOfficer} onChange={e => setBankOfficer(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-bold" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Officer Title</label>
                <input type="text" value={officerTitle} onChange={e => setOfficerTitle(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-bold" />
              </div>
            </div>

            <div className="pt-2">
              <label className="text-[10px] font-black tracking-widest uppercase text-[#0F172A] block mb-3">4. Visual Options & Seals</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Seal Type / Priority</label>
                  <select value={stampText} onChange={e => setStampText(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-bold">
                    <option value="AUTHORIZED">AUTHORIZED</option>
                    <option value="CERTIFIED">CERTIFIED</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="PAID">PAID</option>
                    <option value="CLEARED">CLEARED</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Seal Sub-text</label>
                  <input type="text" value={stampSubText} onChange={e => setStampSubText(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-bold" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-[#0F172A] uppercase mb-1 block">Seal Color</label>
                  <select value={stampStyle} onChange={e => setStampStyle(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary text-[#0F172A] dark:text-white font-bold">
                    <option value="red-700">Crimson Red</option>
                    <option value="emerald-700">Emerald Green</option>
                    <option value="blue-800">Navy Blue</option>
                    <option value="slate-800">Charcoal Black</option>
                  </select>
                </div>
                <div className="col-span-2 flex items-center gap-2 mt-2">
                  <input type="checkbox" id="wmark" checked={watermarkIcon} onChange={e => setWatermarkIcon(e.target.checked)} className="rounded text-primary" />
                  <label htmlFor="wmark" className="text-xs font-bold text-[#0F172A] dark:text-white">Show Center Background Watermark</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-slate-200 dark:border-white/10 space-y-3 shrink-0 sticky bottom-0 bg-white dark:bg-slate-900 z-50 p-4 -mx-6 -mb-6 rounded-b-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="flex gap-3">
             <button
               onClick={async () => {
                 await handleDownloadPdf();
                 await handleSendToUser();
               }}
               disabled={isGenerating || isSending}
               className="flex-1 py-4 bg-slate-50 dark:bg-slate-900 text-white dark:text-white font-black uppercase tracking-widest text-[11px] rounded-xl flex items-center justify-center gap-2 disabled:opacity-70 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
             >
               {(isGenerating || isSending) ? <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" /> : <Download className="w-4 h-4" />}
               {(isGenerating || isSending) ? 'Processing...' : 'Download & Send'}
             </button>
             
             <button
               onClick={() => {
                 const printWindow = window.open('', '', 'width=800,height=1000');
                 if (printWindow && pdfRef.current) {
                   printWindow.document.write('<html><head><title>Print Official Document</title>');
                   printWindow.document.write('<style>body { font-family: "Inter", sans-serif; margin: 0; padding: 20px; } @media print { body { padding: 0; } }</style>');
                   printWindow.document.write('</head><body>');
                   printWindow.document.write(pdfRef.current.innerHTML);
                   printWindow.document.write('</body></html>');
                   printWindow.document.close();
                   printWindow.focus();
                   setTimeout(() => {
                     printWindow.print();
                     printWindow.close();
                   }, 250);
                 }
               }}
               className="w-16 py-4 bg-slate-100 dark:bg-slate-900 text-[#0F172A] dark:text-white font-black rounded-xl flex items-center justify-center disabled:opacity-70 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-sm"
               title="Print Document"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
             </button>
          </div>
        </div>
      </div>

      {/* PDF Viewport (A4 Canvas Wrapper) */}
      <div className="flex-1 bg-slate-100 dark:bg-slate-955 rounded-3xl border border-slate-200 dark:border-white/10 overflow-x-auto p-4 md:p-8 flex items-start justify-center custom-scrollbar">
        {/* Actual A4 Container for html2canvas */}
        <div 
          ref={pdfRef}
          className="bg-white shadow-2xl shrink-0 relative overflow-hidden dark:bg-slate-800"
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '25mm', // standard A4 margin
            color: '#0f172a', // strict text color for PDF
            fontFamily: '"Inter", sans-serif',
            boxSizing: 'border-box'
          }}
        >
          {activeDoc !== 'bank_cheque' && (
            <>
              {/* Official Bank Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-200 pb-8 mb-10">
                <div className="max-w-[50%]">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Bank Logo" className="h-16 object-contain mb-4" crossOrigin="anonymous" />
                  ) : (
                    <div className="h-16 flex items-center">
                      <span className="text-3xl font-black text-[#0F172A] uppercase tracking-tighter" style={{ color: primaryColor }}>
                        {customIssuer}
                      </span>
                    </div>
                  )}
                  <div className="text-[9px] text-[#0F172A] uppercase tracking-widest font-bold mt-2 leading-relaxed">
                    Official Head Office<br/>
                    Global Private Wealth Division<br/>
                    {customIssuer} Custody Services
                  </div>
                </div>
                
                <div className="text-right flex flex-col items-end">
                  <h1 className="text-2xl font-black uppercase tracking-tight text-[#0F172A] mb-4 max-w-[250px] leading-tight text-right">
                    {docTitle}
                  </h1>
                  <div className="bg-slate-50 px-5 py-3 rounded-lg border border-slate-200 text-right min-w-[180px] dark:bg-slate-900">
                    <div className="text-[9px] font-black uppercase tracking-widest text-[#0F172A] mb-1">Date Issued</div>
                    <div className="text-sm font-bold text-[#1E293B]">{docDate}</div>
                  </div>
                  <div className="mt-3 text-[9px] font-mono font-bold text-[#0F172A] bg-slate-50 px-3 py-1 rounded inline-block dark:bg-slate-900">
                    DOCUMENT REF: {docRef}
                  </div>
                </div>
              </div>

              {/* Watermark */}
              {watermarkIcon && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none z-0 mix-blend-multiply flex justify-center items-center">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Bank Logo" className="w-[800px] h-[800px] object-contain grayscale" crossOrigin="anonymous" />
                  ) : (
                    <ShieldCheck className="w-[800px] h-[800px] text-[#0F172A]" />
                  )}
                </div>
              )}

              {/* Customer Module */}
              <div className="mb-12 p-8 bg-slate-50 border border-slate-200 rounded-2xl relative overflow-hidden dark:bg-slate-900">
                {/* Background pattern */}
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <ShieldCheck className="w-32 h-32" />
                </div>
                
                <div className="grid grid-cols-2 gap-8 relative z-10">
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-[#0F172A] mb-2 border-b border-slate-200 pb-1 inline-block">Account Holder</div>
                    <div className="text-lg font-bold text-[#0F172A] mb-1">{customerName}</div>
                    <div className="text-sm text-[#0F172A] max-w-[250px] leading-relaxed">{customerAddress}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-[#0F172A] mb-2 border-b border-slate-200 pb-1 inline-block">Account Details</div>
                    <div className="text-xl font-mono font-bold text-[#0F172A] mb-4">{accountNumber}</div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-[#0F172A] mb-1">Clearing Network</div>
                    <div className="text-xs font-bold text-[#0F172A] bg-slate-200 px-2 py-1 rounded inline-block uppercase tracking-wider">{clearingNetwork}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Dynamic Document Content */}
          <div className="min-h-[450px] relative z-10">
            {activeDoc === 'statement' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-tight mb-6 flex items-center gap-3">
                    <span className="w-6 h-0.5 bg-slate-300 inline-block"></span>
                    Balance Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 border border-slate-200 shadow-sm rounded-2xl bg-white dark:bg-slate-800">
                      <div className="text-[10px] font-black tracking-widest uppercase text-[#0F172A] mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Available Ledger Balance
                      </div>
                      <div className="text-3xl font-black text-[#0F172A] font-mono tracking-tight">{balance}</div>
                    </div>
                    <div className="p-6 border border-slate-200 shadow-sm rounded-2xl bg-white dark:bg-slate-800">
                      <div className="text-[10px] font-black tracking-widest uppercase text-[#0F172A] mb-2">Account Status</div>
                      <div className="text-xl font-black text-emerald-600 uppercase flex items-center gap-2 tracking-widest">
                        <CheckCircle className="w-5 h-5" /> Active & Cleared
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-12 bg-slate-50 p-6 rounded-2xl border border-slate-100 dark:bg-slate-900">
                  <h3 className="text-[11px] font-black text-[#0F172A] uppercase tracking-widest mb-3">Statement Notes & Disclosures</h3>
                  <p className="text-[11px] leading-loose text-[#0F172A] font-bold text-justify">
                    {statementNotes}
                  </p>
                </div>
              </div>
            )}

            {activeDoc === 'receipt' && (
              <div className="space-y-8">
                 <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-tight mb-6 flex items-center gap-3">
                    <span className="w-6 h-0.5 bg-slate-300 inline-block"></span>
                    Transfer Authorized Details
                 </h3>
                 
                 <div className="bg-slate-50 text-white p-8 rounded-3xl relative overflow-hidden shadow-xl dark:bg-slate-900">
                   {/* Security watermark */}
                   <ShieldCheck className="absolute -right-16 -bottom-16 w-64 h-64 opacity-5 text-white" />
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-cyan-500"></div>
                   
                   <div className="flex justify-between items-center mb-10 relative z-10">
                     <div>
                       <div className="text-[11px] uppercase tracking-widest text-[#0F172A] font-black mb-2">Transfer Amount</div>
                       <div className="text-4xl font-black font-mono text-white tracking-tight">{amount}</div>
                     </div>
                     <div className="text-right flex space-x-2">
                       <div className="px-4 py-1.5 bg-emerald-500 text-emerald-400 font-black uppercase tracking-widest text-xs rounded-lg border border-emerald-500/30">
                         {transferStatus}
                       </div>
                     </div>
                   </div>

                   {/* Core fees and settlement layout */}
                   <div className="mb-8 border-t border-b border-black/5 py-6 grid grid-cols-2 gap-x-8 gap-y-4 relative z-10 text-xs">
                     <div className="flex justify-between border-b border-black/5 pb-2">
                       <span className="text-[#0F172A] font-semibold">International Wire Fee:</span>
                       <span className="font-mono font-bold text-[#1E293B]">{wireFee}</span>
                     </div>
                     <div className="flex justify-between border-b border-black/5 pb-2">
                       <span className="text-[#0F172A] font-semibold">Compliance Halt Fee:</span>
                       <span className="font-mono font-bold text-[#1E293B]">{haltFee}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-[#0F172A] font-semibold">Asset Insurance Fee:</span>
                       <span className="font-mono font-bold text-[#1E293B]">{insuranceFee}</span>
                     </div>
                     <div className="flex justify-between text-sm font-black text-emerald-400">
                       <span>Total Debited Amount:</span>
                       <span>
                         ${(parseCurrency(amount) + parseCurrency(wireFee) + parseCurrency(haltFee) + parseCurrency(insuranceFee)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                       </span>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-y-8 relative z-10 pt-2">
                     <div>
                       <div className="text-[9px] uppercase tracking-widest text-[#0F172A] font-black mb-1.5">Beneficiary</div>
                       <div className="text-base font-bold text-white uppercase">{beneficiaryName}</div>
                     </div>
                     <div>
                       <div className="text-[9px] uppercase tracking-widest text-[#0F172A] font-black mb-1.5">Beneficiary Account</div>
                       <div className="text-lg font-mono font-bold text-white">{beneficiaryAccount}</div>
                     </div>
                     <div>
                       <div className="text-[9px] uppercase tracking-widest text-[#0F172A] font-black mb-1.5">Routing Instruction</div>
                       <div className="text-sm font-mono font-bold text-amber-400 bg-amber-500 px-2 py-0.5 rounded inline-block uppercase tracking-wider">{routingInstruction}</div>
                     </div>
                     <div>
                       <div className="text-[9px] uppercase tracking-widest text-[#0F172A] font-black mb-1.5">Value Date</div>
                       <div className="text-sm font-mono font-bold text-white">{docDate}</div>
                     </div>
                   </div>
                 </div>
                 
                 <div className="mt-8 text-[10px] text-[#0F172A] leading-relaxed text-center max-w-lg mx-auto">
                   This receipt is electronically generated and is proof of the execution of the requested transfer. Funds may take 1-3 business days to appear in the recipient's account depending on intermediary correspondent banks.
                 </div>
              </div>
            )}

            {activeDoc === 'credit_debit_alert' && (
              <div className="space-y-8">
                 <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-tight mb-6 flex items-center gap-3">
                    <span className="w-6 h-0.5 bg-slate-300 inline-block"></span>
                    Credit & Debit Transaction Alert
                 </h3>
                 
                 <div className={`p-8 rounded-3xl relative overflow-hidden shadow-xl text-white ${
                   alertType === 'CREDIT' ? 'bg-emerald-950 border border-emerald-500/30' : 'bg-rose-950 border border-rose-500/30'
                 }`}>
                   {/* Security watermark */}
                   <ShieldCheck className="absolute -right-16 -bottom-16 w-64 h-64 opacity-5 text-white" />
                   <div className={`absolute top-0 left-0 w-full h-1.5 ${
                     alertType === 'CREDIT' ? 'bg-emerald-400' : 'bg-rose-400'
                   }`}></div>
                   
                   <div className="flex justify-between items-center mb-8 relative z-10">
                     <div>
                       <div className="text-[9px] uppercase tracking-widest text-[#0F172A] font-black mb-1">TRANSACTION EVENT</div>
                       <div className={`text-2xl font-black uppercase tracking-wider ${
                         alertType === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'
                       }`}>
                         {alertType} ALERT RECEIVED
                       </div>
                     </div>
                     <div className="text-right">
                       <span className="text-[9px] uppercase tracking-widest text-[#0F172A] font-black mb-1 block">EVENT STATUS</span>
                       <div className="px-3 py-1 bg-white text-white font-black uppercase tracking-widest text-xs rounded-lg border border-white/20 dark:bg-slate-800">
                         {transferStatus}
                       </div>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6 relative z-10 border-t border-black/5 pt-6 mb-8">
                     <div>
                       <div className="text-[9px] uppercase tracking-widest text-[#0F172A] font-black mb-1">Base Amount</div>
                       <div className="text-3xl font-black font-mono tracking-tight text-white">{amount}</div>
                     </div>
                     <div>
                       <div className="text-[9px] uppercase tracking-widest text-[#0F172A] font-black mb-1">Accurate Ledger Balance</div>
                       <div className="text-3xl font-black font-mono tracking-tight text-amber-400">{balance}</div>
                     </div>
                   </div>

                   {/* Fees Breakdown list */}
                   <div className="bg-slate-100 rounded-2xl p-5 mb-8 text-xs space-y-3 relative z-10 border border-black/5">
                     <div className="text-[10px] font-black tracking-widest uppercase text-[#0F172A] pb-1 border-b border-black/5">TRANSACTION FEES & ASSESSMENTS</div>
                     
                     <div className="flex justify-between">
                       <span className="text-[#0F172A]">International Wire Fee:</span>
                       <span className="font-mono font-bold">{wireFee}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-[#0F172A]">Compliance Halt Fee:</span>
                       <span className="font-mono font-bold">{haltFee}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-[#0F172A]">Asset Insurance Fee:</span>
                       <span className="font-mono font-bold">{insuranceFee}</span>
                     </div>
                     <div className="flex justify-between pt-2 border-t border-black/5 text-sm font-black">
                       <span>Total Net Settled Amount:</span>
                       <span className={alertType === 'CREDIT' ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
                         ${(
                           alertType === 'CREDIT' 
                             ? Math.max(0, parseCurrency(amount) - parseCurrency(wireFee) - parseCurrency(haltFee) - parseCurrency(insuranceFee))
                             : parseCurrency(amount) + parseCurrency(wireFee) + parseCurrency(haltFee) + parseCurrency(insuranceFee)
                         ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                       </span>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-y-6 relative z-10 text-xs border-t border-black/5 pt-6">
                     <div>
                       <div className="text-[9px] uppercase tracking-widest text-[#0F172A] font-black mb-1">Originator Name</div>
                       <div className="text-sm font-bold uppercase">{alertType === 'CREDIT' ? beneficiaryName : customerName}</div>
                     </div>
                     <div>
                       <div className="text-[9px] uppercase tracking-widest text-[#0F172A] font-black mb-1">Beneficiary Name</div>
                       <div className="text-sm font-bold uppercase">{alertType === 'CREDIT' ? customerName : beneficiaryName}</div>
                     </div>
                     <div>
                       <div className="text-[9px] uppercase tracking-widest text-[#0F172A] font-black mb-1">Associated Account</div>
                       <div className="text-sm font-mono font-bold">{accountNumber}</div>
                     </div>
                     <div>
                       <div className="text-[9px] uppercase tracking-widest text-[#0F172A] font-black mb-1">Value Date</div>
                       <div className="text-sm font-mono font-bold">{docDate}</div>
                     </div>
                   </div>
                 </div>

                 <div className="mt-8 text-[10px] text-[#0F172A] leading-relaxed text-center max-w-lg mx-auto">
                   Notice of Security Compliance Vetting: This electronic message contains certified transactional ledger entries. Security clearances and correspondent processing have been completed. Direct ledger adjustments have been logged in real-time.
                 </div>
              </div>
            )}

            {activeDoc === 'payment_instruction' && (
              <div className="space-y-6">
                <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-tight mb-8">
                  External Payment Instruction Form
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  {/* Originator details already in header block, but usually repeated in forms */}
                  <div className="border border-slate-300 rounded-lg p-4">
                     <div className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] mb-4 bg-slate-100 p-2 rounded">1. Originator Details (Auto-Filled)</div>
                     <div className="flex flex-col gap-4">
                        <div className="flex gap-4 w-full">
                            <div className="flex-1">
                               <div className="text-[8px] uppercase tracking-widest text-[#0F172A] font-bold mb-1">Account Name</div>
                               <div className="text-sm font-bold border-b border-slate-300 pb-1">{customerName}</div>
                            </div>
                            <div className="flex-1">
                               <div className="text-[8px] uppercase tracking-widest text-[#0F172A] font-bold mb-1">Account Number / IBAN</div>
                               <div className="text-sm font-mono font-bold border-b border-slate-300 pb-1">{accountNumber}</div>
                            </div>
                        </div>
                        <div className="w-full">
                           <div className="text-[8px] uppercase tracking-widest text-[#0F172A] font-bold mb-1">Registered Address</div>
                           <div className="text-sm font-bold border-b border-slate-300 pb-1">{customerAddress}</div>
                        </div>
                     </div>
                  </div>

                  {/* Beneficiary Details */}
                  <div className="border border-slate-300 rounded-lg p-4">
                     <div className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] mb-4 bg-slate-100 p-2 rounded">2. Beneficiary Target Details</div>
                     <div className="flex flex-col gap-4">
                        <div className="flex gap-4 w-full">
                            <div className="flex-1">
                               <div className="text-[8px] uppercase tracking-widest text-[#0F172A] font-bold mb-1">Beneficiary Name</div>
                               <div className="text-sm font-bold border-b border-slate-300 pb-1">{beneficiaryName}</div>
                            </div>
                            <div className="flex-1">
                               <div className="text-[8px] uppercase tracking-widest text-[#0F172A] font-bold mb-1">Beneficiary Account Number / IBAN</div>
                               <div className="text-sm font-mono font-bold border-b border-slate-300 pb-1">{beneficiaryAccount}</div>
                            </div>
                        </div>
                        <div className="flex gap-4 w-full">
                            <div className="flex-1">
                               <div className="text-[8px] uppercase tracking-widest text-[#0F172A] font-bold mb-1">Beneficiary Bank Name</div>
                               <div className="text-sm font-bold border-b border-slate-300 pb-1">{payInstructionBankName}</div>
                            </div>
                            <div className="flex-[0.5]">
                               <div className="text-[8px] uppercase tracking-widest text-[#0F172A] font-bold mb-1">Bank SWIFT / BIC Code</div>
                               <div className="text-sm font-mono font-bold border-b border-slate-300 pb-1 uppercase tracking-widest">{payInstructionSwift}</div>
                            </div>
                            <div className="flex-[0.5]">
                               <div className="text-[8px] uppercase tracking-widest text-[#0F172A] font-bold mb-1">Routing Number / Sort Code</div>
                               <div className="text-sm font-mono font-bold border-b border-slate-300 pb-1">{payInstructionRouting}</div>
                            </div>
                        </div>
                        <div className="w-full">
                           <div className="text-[8px] uppercase tracking-widest text-[#0F172A] font-bold mb-1">Beneficiary Address</div>
                           <div className="text-sm font-bold border-b border-slate-300 pb-1">{payInstructionAddress}</div>
                        </div>
                     </div>
                  </div>

                  {/* Payment Details */}
                  <div className="border border-slate-300 rounded-lg p-4">
                     <div className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] mb-4 bg-slate-100 p-2 rounded">3. Payment Execution Details</div>
                     <div className="flex flex-col gap-4">
                        <div className="flex gap-4 w-full">
                            <div className="flex-[0.3]">
                               <div className="text-[8px] uppercase tracking-widest text-[#0F172A] font-bold mb-1">Currency</div>
                               <div className="text-sm font-bold border-b border-slate-300 pb-1">{payInstructionCurrency}</div>
                            </div>
                            <div className="flex-1">
                               <div className="text-[8px] uppercase tracking-widest text-[#0F172A] font-bold mb-1">Amount (Numbers)</div>
                               <div className="text-sm font-mono font-bold border-b border-slate-300 pb-1">{payInstructionAmount}</div>
                            </div>
                        </div>
                        <div className="w-full">
                           <div className="text-[8px] uppercase tracking-widest text-[#0F172A] font-bold mb-1">Amount in Words</div>
                           <div className="text-sm font-bold border-b border-slate-300 pb-1">{payInstructionWords}</div>
                        </div>
                        <div className="w-full">
                           <div className="text-[8px] uppercase tracking-widest text-[#0F172A] font-bold mb-1">Purpose of Payment / Reference</div>
                           <div className="text-sm font-bold border-b border-slate-300 pb-1">{payInstructionPurpose}</div>
                        </div>
                     </div>
                  </div>

                  <div className="mt-8 text-[10px] text-[#0F172A] font-bold text-justify">
                    By signing below, the Originator authorizes {customIssuer} to execute the payment instruction detailed above. Ensure all beneficiary bank information is precise. Incorrect details may result in returned funds or significant delays. International transfers are subject to intermediary correspondent banking fees and anti-money laundering (AML) compliance hold periods.
                  </div>
                  
                  <div className="flex justify-between items-end mt-12 mb-4 px-12">
                     <div className="w-56">
                        <div className="border-b border-slate-200 w-full h-8 flex items-end justify-center font-[cursive] text-[#000080] text-xl opacity-60">
                           {clientSignature && (
                             <img src={clientSignature} alt="Signature" className="h-10 -mb-2" crossOrigin="anonymous" />
                           )}
                        </div>
                        <div className="text-center font-bold text-[#0F172A] text-[10px] mt-2 tracking-widest uppercase">Authorized Signature</div>
                     </div>
                     <div className="w-40 text-center">
                        <div className="border-b border-slate-200 h-8 text-sm font-bold flex items-end justify-center pb-1">
                           {docDate}
                        </div>
                        <div className="text-center font-bold text-[#0F172A] text-[10px] mt-2 tracking-widest uppercase">Date of Request</div>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {activeDoc === 'bank_cheque' && (
              <div className="mt-32">
                 <div className="w-full bg-[#fcfdfd] border border-slate-300 p-6 relative shadow-lg overflow-hidden flex flex-col justify-between" style={{ height: '340px' }}>
                    {/* Background Patterns */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(15, 23, 42, 0.03) 10px, rgba(15, 23, 42, 0.03) 20px)' }}></div>
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden select-none" style={{ fontSize: '3.5px', lineHeight: '3.5px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: primaryColor }}>
                      {Array(1000).fill(customIssuer.toUpperCase() + " OFFICIAL CHECK ").join('')}
                    </div>
                    
                    {/* Hologram / Seal Overlay */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none mix-blend-multiply">
                        <ShieldCheck className="w-[400px] h-[400px]" style={{ color: primaryColor }} />
                    </div>

                    {/* Certified Stamp */}
                    <div className="absolute top-6 right-8 opacity-[0.15] pointer-events-none select-none rotate-[15deg]">
                        <div className="w-24 h-24 border-[3px] rounded-full flex flex-col items-center justify-center border-dashed" style={{ borderColor: primaryColor }}>
                           <span className="text-[12px] font-black tracking-widest uppercase" style={{ color: primaryColor }}>CERTIFIED</span>
                           <span className="text-[6px] font-bold uppercase mt-1" style={{ color: primaryColor }}>{docDate}</span>
                        </div>
                    </div>

                    <div className="relative z-10 flex justify-between items-start mb-6 border-b border-slate-200 pb-4">
                       <div className="flex gap-4 items-center">
                         <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-sm p-2 border border-slate-100 dark:bg-slate-800">
                           {logoUrl ? (
                             <img src={logoUrl} alt="Bank Logo" className="w-full h-full object-contain" crossOrigin="anonymous" />
                           ) : (
                             <div className="text-xl font-black text-blue-900 uppercase tracking-tighter" style={{ color: primaryColor }}>{customIssuer.substring(0, 3)}</div>
                           )}
                         </div>
                         <div>
                           <div className="text-lg font-black uppercase tracking-tight" style={{ color: primaryColor }}>{customIssuer}</div>
                           <div className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mt-0.5">Official Cashier's Check</div>
                           <div className="text-[9px] text-[#0F172A] mt-1 uppercase max-w-[200px]">{customerAddress.split(',')[0] || '123 Bank Plaza, Financial District'}</div>
                         </div>
                       </div>
                       
                       <div className="text-right flex flex-col items-end pt-1">
                         <div className="text-2xl font-mono font-black tracking-widest text-[#1E293B] mb-2">{docRef}</div>
                         <div className="flex gap-4">
                           <div className="flex flex-col text-right">
                             <span className="text-[7px] text-[#0F172A] uppercase font-bold tracking-widest">Date of Issue</span>
                             <span className="text-[13px] font-bold text-[#0F172A]">{docDate}</span>
                           </div>
                         </div>
                       </div>
                    </div>

                    <div className="relative z-10 grid grid-cols-[1fr_220px] gap-6 items-center mb-6">
                       <div className="space-y-5">
                           <div className="flex items-end gap-3">
                              <span className="text-[10px] font-bold text-[#0F172A] uppercase whitespace-nowrap mb-1">Pay to the order of</span>
                              <div className="flex-1 border-b border-slate-400 pb-1 text-lg font-bold text-[#0F172A] px-2 uppercase">{beneficiaryName}</div>
                           </div>
                           <div className="flex items-end gap-3">
                              <div className="flex-1 border-b border-slate-400 pb-1 text-[13px] font-bold text-[#0F172A] italic px-2 bg-slate-100 rounded-t-sm uppercase">{payInstructionWords}</div>
                              <span className="text-[10px] font-bold text-[#0F172A] uppercase whitespace-nowrap mb-1">Dollars</span>
                           </div>
                       </div>
                       <div className="bg-white border-2 border-slate-200 p-3 rounded shadow-sm flex items-center gap-2 relative dark:bg-slate-800">
                          <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] select-none overflow-hidden">
                             <span className="text-[8px] font-bold whitespace-nowrap">{customIssuer.toUpperCase()}</span>
                          </div>
                          <span className="font-bold text-[#0F172A] text-lg">$</span>
                          <span className="text-2xl font-mono font-black text-[#0F172A] tracking-tight relative z-10">{payInstructionAmount}</span>
                       </div>
                    </div>

                    <div className="relative z-10 flex justify-between items-end mt-auto pb-8">
                       <div className="flex items-end gap-3 w-1/2">
                          <span className="text-[9px] font-bold text-[#0F172A] uppercase mb-1">Memo</span>
                          <div className="flex-1 border-b border-slate-400 pb-1 text-[11px] font-mono text-[#0F172A] px-2 uppercase">{payInstructionPurpose}</div>
                       </div>
                       
                       <div className="w-72 relative">
                          <div className="border-b border-slate-400 h-12 flex items-end justify-center font-[cursive] text-[#0f172a] text-2xl pb-1 relative">
                             {/* Microprint Signature Line */}
                             <div className="absolute bottom-[-1px] left-0 right-0 h-[1px] overflow-hidden opacity-70" style={{ fontSize: '2px', lineHeight: '2px' }}>
                                {Array(100).fill("AUTHORIZED SIGNATURE ").join('')}
                             </div>
                             {clientSignature ? (
                               <img src={clientSignature} alt="Signature" className="h-16 -mb-3 relative z-10" crossOrigin="anonymous" />
                             ) : (
                               <span className="relative z-10">{bankOfficer}</span>
                             )}
                          </div>
                          <div className="text-[8px] mt-1.5 font-bold text-[#0F172A] uppercase tracking-widest text-center flex justify-between px-2">
                             <span>Security Features Included</span>
                             <span>Details on Back</span>
                          </div>
                       </div>
                    </div>

                    {/* MICR Line */}
                    <div className="absolute bottom-4 left-6 right-6 flex items-center gap-6">
                       <div className="text-[6.5px] font-bold text-[#0F172A] max-w-[120px] leading-tight tracking-wider uppercase">Warning: Document Contains Artificial Watermark, Microprinting & Security Screen.</div>
                       <div className="flex-1 text-center font-mono text-2xl tracking-[0.4em] text-[#1E293B] font-bold opacity-80" style={{ fontFamily: 'monospace' }}>
                          ⑆{payInstructionRouting || '101000019'}⑆ {beneficiaryAccount || '123456789'}⑈ {docRef.replace(/\D/g, '') || '1001'}
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {(!['statement', 'receipt', 'payment_instruction', 'swift_mt103', 'bank_cheque'].includes(activeDoc)) && (
              <div className="space-y-6">
                <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-tight mb-8">
                  {docTitle}
                </h3>

                <div className="text-sm leading-8 text-[#0F172A] font-bold whitespace-pre-wrap text-justify">
                  {customText}
                </div>
              </div>
            )}

            {activeDoc === 'swift_mt103' && (
              <div className="space-y-6">
                 <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-tight mb-8 border-b-2 border-slate-300 pb-2">
                   SWIFT MT103 SINGLE CUSTOMER CREDIT TRANSFER
                 </h3>
                 <div className="font-mono text-xs text-[#1E293B] space-y-2 bg-slate-50 p-6 border border-slate-200 dark:bg-slate-900">
                    <div className="font-bold border-b border-dashed border-slate-400 pb-2 mb-4 text-[10px] tracking-widest text-[#0F172A]">MESSAGE HEADER</div>
                    <div className="grid grid-cols-[100px_1fr] gap-2"><div className="font-bold">Message Type</div><div>103</div></div>
                    <div className="grid grid-cols-[100px_1fr] gap-2"><div className="font-bold">Sender</div><div>{payInstructionBankName}</div></div>
                    <div className="grid grid-cols-[100px_1fr] gap-2"><div className="font-bold">Receiver</div><div>{beneficiaryName}</div></div>
                    
                    <div className="font-bold border-b border-dashed border-slate-400 pb-2 mb-4 mt-6 text-[10px] tracking-widest text-[#0F172A]">MESSAGE TEXT</div>
                    <div className="grid grid-cols-[100px_1fr] gap-2"><div className="font-bold text-[#0F172A]">:20:</div><div>{docRef}</div></div>
                    <div className="grid grid-cols-[100px_1fr] gap-2"><div className="font-bold text-[#0F172A]">:23B:</div><div>CRED</div></div>
                    <div className="grid grid-cols-[100px_1fr] gap-2"><div className="font-bold text-[#0F172A]">:32A:</div><div>{docDate.replace(/\D/g, '')} {payInstructionCurrency} {payInstructionAmount}</div></div>
                    <div className="grid grid-cols-[100px_1fr] gap-2"><div className="font-bold text-[#0F172A]">:33B:</div><div>{payInstructionCurrency} {payInstructionAmount}</div></div>
                    <div className="grid grid-cols-[100px_1fr] gap-2 items-start"><div className="font-bold text-[#0F172A]">:50A:</div><div>{customerName}<br/>{accountNumber}<br/>{customerAddress}</div></div>
                    <div className="grid grid-cols-[100px_1fr] gap-2 items-start"><div className="font-bold text-[#0F172A]">:59:</div><div>/{beneficiaryAccount}<br/>{beneficiaryName}<br/>{payInstructionAddress}</div></div>
                    <div className="grid grid-cols-[100px_1fr] gap-2"><div className="font-bold text-[#0F172A]">:70:</div><div>{payInstructionPurpose}</div></div>
                    <div className="grid grid-cols-[100px_1fr] gap-2"><div className="font-bold text-[#0F172A]">:71A:</div><div>OUR</div></div>
                 </div>
              </div>
            )}
          </div>

          {/* Official Bank Signatures & Footer Tracker */}
          <div className="mt-20 pt-10 border-t-2 border-slate-200 grid grid-cols-2 gap-12 relative items-end z-10">
            
            {/* Stamp Overlay */}
            <div className={`absolute right-1/3 -top-12 border-[6px] rounded-full w-40 h-40 flex items-center justify-center -rotate-[15deg] pointer-events-none mix-blend-multiply z-20 ${
              stampStyle === 'red-700' ? 'border-red-700/20 text-red-700/30' :
              stampStyle === 'emerald-700' ? 'border-emerald-700/20 text-emerald-700/30' :
              stampStyle === 'blue-800' ? 'border-blue-800/20 text-blue-800/30' :
              'border-slate-200/20 text-[#1E293B]/30'
            }`}>
              <div className="text-[14px] font-black uppercase tracking-widest text-center leading-none flex flex-col items-center justify-center space-y-1">
                <span>{customIssuer}</span>
                <span className={`text-[10px] w-[140px] border-t-[3px] border-b-[3px] py-2 my-2 font-bold tracking-widest mx-auto flex justify-center ${
                  stampStyle === 'red-700' ? 'border-red-700/20' :
                  stampStyle === 'emerald-700' ? 'border-emerald-700/20' :
                  stampStyle === 'blue-800' ? 'border-blue-800/20' :
                  'border-slate-200/20'
                }`}>{stampSubText}</span>
                <span className="text-xl font-black">{stampText}</span>
              </div>
            </div>

            <div className="relative z-10">
              <div className="h-20 w-56 relative flex items-end justify-center">
                {/* Simulated signature cursive */}
                <div className="absolute bottom-2 left-0 w-full text-center font-[cursive] text-4xl text-[#000080] opacity-80" style={{ fontFamily: 'Brush Script MT, cursive' }}>
                  {bankOfficer}
                </div>
                {/* Signature Line */}
                <div className="w-full h-px bg-slate-400 absolute bottom-0 left-0"></div>
              </div>
              <div className="mt-3 text-xs font-black text-[#0F172A] uppercase tracking-tight">{bankOfficer}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#0F172A] mt-0.5">{officerTitle}</div>
            </div>

            <div className="text-right relative z-10">
              <div className="text-[8px] font-mono text-[#0F172A] uppercase tracking-widest leading-loose">
                <b>Document Authenticity Tracker</b><br/>
                SHA256: {Array.from({length:64}, () => Math.floor(Math.random()*16).toString(16)).join('')}<br/>
                Generated electronically. Tampering with an official<br/>
                bank document is a federal offense.
              </div>
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isQrScannerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-100  z-[9999] flex items-center justify-center p-4 pointer-events-auto"
            id="qr-scanner-modal"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-6 max-w-sm w-full shadow-2xl relative"
            >
              <QrScanner 
                hapticsEnabled={true} 
                onClose={() => setIsQrScannerOpen(false)} 
                onScan={(data) => {
                  setIsQrScannerOpen(false);
                  
                  // One-Tap payment simulated auto-fill and confirmation
                  setBeneficiaryName('CHIBUZOR IYKE NWAIWU');
                  setBeneficiaryAccount('215533429905');
                  setPayInstructionBankName('Lead');
                  setPayInstructionSwift('LEADUS33');
                  setPayInstructionRouting('101019644');
                  setPayInstructionAddress('1801 Main St., Kansas City, MO 64108');
                  setPayInstructionPurpose('One-Tap QR Remittance');
                  
                  setToastMessage(`Quick Pay Decoded: Authorized transfer to target ending in ...9905`);
                  setTimeout(() => {
                    setToastMessage('');
                  }, 4000);
                }} 
              />
            </motion.div>
          </motion.div>
        )}

        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-6 right-6 bg-slate-50 dark:bg-slate-900 text-white dark:text-white px-4 py-3 rounded-xl shadow-2xl border border-black/5 dark:border-slate-700 z-[9999] flex items-center gap-3 "
            id="success-copy-toast"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-500 dark:text-emerald-600">Success</span>
              <span className="text-xs font-bold text-[#0F172A] dark:text-white">{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
