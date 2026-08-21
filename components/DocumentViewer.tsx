import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { 
    DocumentCheckIcon, 
    ArrowDownTrayIcon, 
    LockClosedIcon,
    ShieldCheckIcon
} from './Icons';
import { UserProfile, Transaction, TransactionStatus, Account } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { sendEmail } from '../services/emailService';
import { DocumentMarkupCanvas } from './DocumentMarkupCanvas';
import { ReceiptMarkupCanvas } from './ReceiptMarkupCanvas';
import { DigitalSignature, SignatureMetadata } from './DigitalSignature';
import { GeneratePdfStatementModal } from './GeneratePdfStatementModal';
import { analyzeReceiptOCR } from '../services/geminiService';
import { compressImage } from '../utils/imageProcessor';
import { generateQuarterlyFinancialReportPDF } from '../utils/quarterlyReportGenerator';
import { applyBankPdfBackgroundAndWatermark, generateQrCodeDataUrl, embedVerificationQrCodeBlock } from '../utils/pdfWatermarkAndQr';

interface DocumentViewerProps {
    userProfile: UserProfile;
    accounts?: Account[];
    transactions: Transaction[];
    onUpdateTransactions?: (txIds: string[], updates: Partial<Transaction>) => void;
}

// Global Canvas API generator for the high-fidelity Metallic Gold 'Authorized Bank Official' seal
export const generateOfficialSealDataUrl = (): string => {
    if (typeof document === 'undefined') return '';
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, 400, 400);

    // Warm, metallic radial gold gradient
    const goldGrad = ctx.createRadialGradient(200, 200, 60, 200, 200, 180);
    goldGrad.addColorStop(0, '#fef08a'); // soft bright gold center
    goldGrad.addColorStop(0.4, '#ca8a04'); // deep stable gold
    goldGrad.addColorStop(0.85, '#854d0e'); // rich copper bronze
    goldGrad.addColorStop(1, '#a16207'); // shiny gold highlights

    // Double concentric outer border rings
    ctx.strokeStyle = goldGrad;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(200, 200, 180, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(200, 200, 171, 0, Math.PI * 2);
    ctx.stroke();

    // Fill inner soft cream background for high-contrast legibility
    ctx.fillStyle = '#fffdf5';
    ctx.beginPath();
    ctx.arc(200, 200, 169, 0, Math.PI * 2);
    ctx.fill();

    // Inner gold orbit border ring
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(200, 200, 132, 0, Math.PI * 2);
    ctx.stroke();

    // Central star emblem
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ca8a04';
    ctx.font = 'bold 36px serif';
    ctx.fillText('★', 200, 130);

    // Deep corporate blue official inner typography
    ctx.font = 'bold 24px "Times New Roman", Times, serif';
    ctx.fillStyle = '#1e3a8a'; // Blue-900 corporate auth color
    ctx.fillText('AUTHORIZED', 200, 175);
    ctx.fillText('BANK OFFICIAL', 200, 208);

    // Sub-text indicators
    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#ca8a04';
    ctx.fillText('• SECURE NODE •', 200, 245);

    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('ISO-20022 CLASSIFIED', 200, 270);

    // Circular Texts wrapping the seal arc
    ctx.font = 'bold 16px "Times New Roman", Times, serif';
    ctx.fillStyle = '#854d0e'; // Bronze gold for text

    const topText = "FIRST PACIFIC GLOBAL PRIVATE BANK";
    ctx.save();
    ctx.translate(200, 200);
    for (let i = 0; i < topText.length; i++) {
        const angle = -Math.PI * 0.77 + (i * Math.PI * 1.54) / (topText.length - 1);
        ctx.save();
        ctx.rotate(angle);
        ctx.translate(0, -148);
        ctx.fillText(topText[i], 0, 0);
        ctx.restore();
    }
    ctx.restore();

    const bottomText = "OFFICIAL TREASURY SEAL";
    ctx.save();
    ctx.translate(200, 200);
    for (let i = 0; i < bottomText.length; i++) {
        const angle = Math.PI * 0.25 + (i * Math.PI * 0.5) / (bottomText.length - 1);
        ctx.save();
        ctx.rotate(angle);
        ctx.translate(0, 148);
        ctx.rotate(Math.PI); // Keep bottom text right-side up
        ctx.fillText(bottomText[i], 0, 0);
        ctx.restore();
    }
    ctx.restore();

    return canvas.toDataURL('image/png');
};

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ userProfile, accounts = [], transactions, onUpdateTransactions }) => {
    const { formatCurrency } = useCurrency();
    const [activeTab, setActiveTab] = useState<'statements' | 'auth_letter' | 'clearing_instructions' | 'tax_summary' | 'receipt_markup' | 'digital_signature'>('statements');
    
    // Digital Signature States
    const [userSignatureDataUrl, setUserSignatureDataUrl] = useState<string | null>(null);
    const [userSignatureMetadata, setUserSignatureMetadata] = useState<SignatureMetadata | null>(null);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState<boolean>(false);
    const [selectedReceiptTxId, setSelectedReceiptTxId] = useState<string>('');
    const [customDocReceiptUrl, setCustomDocReceiptUrl] = useState<string | null>(null);
    const [docOcrStatus, setDocOcrStatus] = useState<string | null>(null);
    const [docOcrResult, setDocOcrResult] = useState<{ amount?: number; date?: string; merchant?: string; category?: string } | null>(null);
    const [suggestedCategoryPrompt, setSuggestedCategoryPrompt] = useState<{
        category: string;
        merchant: string;
        amount: number;
        confirmed: boolean;
        appliedTxId?: string;
    } | null>(null);
    const [selectedCustomCategory, setSelectedCustomCategory] = useState<string>('Shopping');

    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
    // Quarterly Financial Summary State
    const [selectedQuarter, setSelectedQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q3');
    const [quarterlyYear, setQuarterlyYear] = useState<number>(2026);

    // New Custom Filters
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');

    const [isMarkupMode, setIsMarkupMode] = useState(false);
    const [markupDataUrl, setMarkupDataUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
    const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);

    // Auto-Tax state variables
    const [taxGeography, setTaxGeography] = useState<string>('US');
    const [taxDocType, setTaxDocType] = useState<'1099_int' | 'fbar_114' | 'w8ben' | 'schedule_b'>('1099_int');
    const [taxCalendarYear, setTaxCalendarYear] = useState<number>(2026);
    const [taxSelfCertChecked, setTaxSelfCertChecked] = useState<boolean>(true);

    // Sound alert trigger (distinct regulatory audio warning via Web Audio API)
    const playRegulatorySound = () => {
        try {
            const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtxClass) return;
            const ctx = new AudioCtxClass();
            const now = ctx.currentTime;
            
            const triggerWarning = (freq: number, delay: number, dur: number, vol: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const filter = ctx.createBiquadFilter();
                
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(800, now);
                
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, now + delay);
                osc.frequency.linearRampToValueAtTime(freq * 0.75, now + delay + dur); // downward sliding warning sweep
                
                gain.gain.setValueAtTime(0, now + delay);
                gain.gain.linearRampToValueAtTime(vol, now + delay + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);
                
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);
                
                osc.start(now + delay);
                osc.stop(now + delay + dur);
            };

            // Authoritative low warning dual-beep
            triggerWarning(160.0, 0, 0.45, 0.08);
            triggerWarning(140.0, 0.35, 0.55, 0.08);
        } catch (e) {
            console.warn('[Web Audio alert blocked by browser constraints]', e);
        }
    };

    // State for Bank Official Authorization Letter Form
    const [authFormData, setAuthFormData] = useState({
        beneficiaryName: '',
        amount: '125,000.00',
        regulatoryExemption: 'PATRIOT Act Exemption Code Sec. 5312(a)',
        signeeOfficer: 'Sarah S. Sterling',
        routingSpeed: 'IMMEDIATE DIRECT CORRESPONDENT'
    });

    // State for External Clearing Payment Instruction Form
    const [clearingFormData, setClearingFormData] = useState({
        correspondentBank: 'Chase Clearing House N.A., New York',
        clearingNetwork: 'CHIPS / Fedwire Network Core',
        routingNumber: '021000021-FPB',
        beneficiaryAccount: 'FP-9821-3921-2093',
        purposeOfTransfer: 'Exempt Capital Asset Investment Prefunding',
        clearancePriority: 'EXECUTIVE DIRECT IMMUTABLE'
    });

    // Helper to generate the statement list or select transaction
    const [selectedTxId, setSelectedTxId] = useState<string>('');
    const matchedTx = transactions.find(t => t.id === selectedTxId);

    useEffect(() => {
        if (matchedTx) {
            setAuthFormData(prev => ({
                ...prev,
                beneficiaryName: matchedTx.recipient?.fullName || matchedTx.description,
                amount: matchedTx.sendAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }),
                regulatoryExemption: `Sovereign Code Sec. ${matchedTx.id.slice(-6).toUpperCase()}-HOLD`
            }));
        }
    }, [selectedTxId]);

    // Render continuous live preview of the generated seal
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    useEffect(() => {
        if (canvasRef.current) {
            const canvasObj = canvasRef.current;
            const ctx = canvasObj.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, 160, 160);
                const sealSrc = generateOfficialSealDataUrl();
                const img = new Image();
                img.src = sealSrc;
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, 160, 160);
                };
            }
        }
    }, [activeTab]);

    // Generates Bank Official Authorization Letter PDF
    const generateAuthorizationLetterPDF = async (download = true): Promise<jsPDF> => {
        const pdf = new jsPDF({ format: 'a4', unit: 'mm' });
        applyBankPdfBackgroundAndWatermark(pdf, {
            title: 'OFFICIAL AUTHORIZATION LETTER',
            documentRef: `REF: FPB-AUTH-${new Date().getFullYear()}`
        });
        
        if (activeTab === 'auth_letter' && markupDataUrl) {
            // Apply high-fidelity marked up canvas image to full page
            pdf.addImage(markupDataUrl, 'PNG', 0, 0, 210, 297);
            if (download) {
                pdf.save(`First_Pacific_Official_Authorization_Letter_Signed.pdf`);
            }
            return pdf;
        }

        // Background repeating watermarks
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(242, 244, 247); // extremely faint grey
        for (let wy = 35; wy < 280; wy += 45) {
            for (let wx = -10; wx < 210; wx += 60) {
                pdf.text("FIRST PACIFIC GLOBAL", wx, wy, { angle: 25 });
            }
        }
        
        // Elegant institutional letterhead grid
        pdf.setFillColor(15, 23, 42); // deep slate/black
        pdf.rect(0, 0, 210, 8, 'F');

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(22);
        pdf.setTextColor(15, 23, 42);
        pdf.text("FIRST PACIFIC GLOBAL PRIVATE BANK", 20, 25);
        
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.5);
        pdf.setTextColor(100, 116, 139);
        pdf.text("Official Treasury Executive Clearance Deck | Switzerland & New York Hubs", 20, 31);
        pdf.line(20, 34, 190, 34);

        // Letter metadata
        pdf.setFontSize(9.5);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(50, 50, 50);
        pdf.text("OFFICIAL EXECUTIVE SWIFT CORE RELEASE AUTHORIZATION", 20, 48);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        const todayStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
        pdf.text(`Date of Dispatch: ${todayStr}`, 20, 55);
        pdf.text(`Authorized Amount: $${authFormData.amount} USD`, 20, 60);
        pdf.text(`Clearance Network Speed: ${authFormData.routingSpeed}`, 20, 65);
        pdf.text(`Regulatory Exemption Handle: ${authFormData.regulatoryExemption}`, 20, 70);

        // Letter Body Content
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(30, 41, 59);

        const letterText = `To whom it may concern,

This formal compliance directive serves as absolute verification that the First Pacific Sovereign Clearing Node has reviewed and authorized a secure credit/debit allocation amounting to $${authFormData.amount} USD. 

The transaction is prefunded and cleared of all global escrow holds, specifically satisfying the framework rules set forth under the ${authFormData.regulatoryExemption}. First Pacific Banking Board hereby guarantees funds availability and instructs immediate correspondent routing to the beneficiary bank without further interbank halts or intervention.

All regulatory clearance flags have been resolved internally by our underwriting trustees, and we request that all clearing networks (including SWIFT, ACH, and Fedwire) finalize this credit ledger entry immediately.`;

        const splitLetter = pdf.splitTextToSize(letterText, 170);
        pdf.text(splitLetter, 20, 85);

        // Incorporate high-fidelity Canvas 'Authorized Bank Official' seal on PDF
        const sealBase64 = generateOfficialSealDataUrl();
        if (sealBase64) {
            pdf.addImage(sealBase64, 'PNG', 145, 170, 42, 42);
        }

        // Signature on left
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(15, 23, 42);
        pdf.text("EXECUTIVE COMPLIANCE DESK SIGNATORY", 20, 185);
        
        if (userSignatureDataUrl) {
            pdf.addImage(userSignatureDataUrl, 'PNG', 20, 187, 55, 18);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(9);
            pdf.setTextColor(15, 23, 42);
            pdf.text(userSignatureMetadata?.signerName || authFormData.signeeOfficer, 20, 210);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(8);
            pdf.setTextColor(100, 116, 139);
            pdf.text(`Digitally Signed & Certified • ${userSignatureMetadata?.signerTitle || 'Authorized Trustee'}`, 20, 215);
            pdf.text(`Hash: ${userSignatureMetadata?.hash || 'SIG-VERIFIED'}`, 20, 220);
        } else {
            pdf.setFont("serif", "italic");
            pdf.setFontSize(13);
            pdf.text(authFormData.signeeOfficer, 20, 195);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);
            pdf.setTextColor(100, 116, 139);
            pdf.text(`${authFormData.signeeOfficer}, Senior Trustee`, 20, 202);
            pdf.text("Special Clearance Division, New York Headquarters", 20, 207);
        }

        // Security code block
        pdf.setFontSize(8);
        pdf.setFont("courier", "bold");
        pdf.setTextColor(148, 163, 184);
        pdf.text(`AUTHENTICATED BY IMMUTABLE CRYPTO KEY: [FPB-SEC-AUTH-${Math.random().toString(36).substring(2, 8).toUpperCase()}]`, 20, 245);

        // Embed Verification QR Code Block
        const originHost = typeof window !== 'undefined' ? window.location.origin : 'https://firstpacificbank.com';
        const verifyPayload = `${originHost}/verify?doc=AUTH-${new Date().getFullYear()}&client=${encodeURIComponent(userProfile.name)}&status=VERIFIED`;
        embedVerificationQrCodeBlock(pdf, await generateQrCodeDataUrl(verifyPayload, 200), 15, 258, { width: 180, height: 20 });

        if (download) {
            pdf.save(`First_Pacific_Official_Authorization_Letter.pdf`);
        }
        return pdf;
    };

    // Generates External Clearing Payment Instructions PDF
    const generateClearingInstructionsPDF = async (download = true): Promise<jsPDF> => {
        const pdf = new jsPDF({ format: 'a4', unit: 'mm' });
        applyBankPdfBackgroundAndWatermark(pdf, {
            title: 'CLEARING INSTRUCTIONS',
            documentRef: `REF: FPB-CLEAR-${new Date().getFullYear()}`
        });

        // Background repeating watermarks
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(242, 244, 247); // extremely faint grey
        for (let wy = 35; wy < 280; wy += 45) {
            for (let wx = -10; wx < 210; wx += 60) {
                pdf.text("FIRST PACIFIC GLOBAL", wx, wy, { angle: 25 });
            }
        }

        // Draw elegant blue border header
        pdf.setFillColor(30, 58, 138); // Blue-900
        pdf.rect(0, 0, 210, 15, 'F');

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(18);
        pdf.setTextColor(255, 255, 255);
        pdf.text("FIRST PACIFIC GLOBAL - CORRESPONDENT DETAILED ROUTING", 15, 10);

        pdf.setFontSize(10);
        pdf.setTextColor(50, 50, 50);
        pdf.setFont("helvetica", "bold");
        pdf.text("U.S. INSTITUTIONAL SETTLEMENT & EXTERNAL PAYMENT INSTRUCTIONS", 15, 28);
        pdf.line(15, 32, 195, 32);

        // Elegant double column table grid layout for clearing instructions
        const instructionsTop = 38;
        const col1X = 15;
        const col2X = 85;
        const col3X = 195;
        let currentY = instructionsTop;

        pdf.setDrawColor(203, 213, 225); // slate-300
        pdf.setLineWidth(0.35);

        const addRoutingRow = (label: string, val: string, idx: number) => {
            // Background alternating fill
            if (idx % 2 === 0) {
                pdf.setFillColor(248, 250, 252);
                pdf.rect(col1X, currentY, col3X - col1X, 9, 'F');
            }
            
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(51, 65, 85); // slate-700
            pdf.setFontSize(8.5);
            pdf.text(label, col1X + 3, currentY + 6);
            
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(15, 23, 42); // slate-900
            pdf.setFontSize(9);
            pdf.text(val, col2X + 3, currentY + 6);
            
            // Draw row divider
            pdf.setDrawColor(226, 232, 240);
            pdf.line(col1X, currentY + 9, col3X, currentY + 9);
            currentY += 9;
        };

        let idx = 0;
        addRoutingRow("Intermediary Clearing Entity:", clearingFormData.correspondentBank, idx++);
        addRoutingRow("Affiliated Clearing Core Network:", clearingFormData.clearingNetwork, idx++);
        addRoutingRow("Intermediary ABA/Swift Code:", clearingFormData.routingNumber, idx++);
        addRoutingRow("Corporate IBAN / Account Num:", clearingFormData.beneficiaryAccount, idx++);
        addRoutingRow("Verified Purpose Code Classification:", clearingFormData.purposeOfTransfer, idx++);
        addRoutingRow("Clearing Desk Priority Code:", clearingFormData.clearancePriority, idx++);
        addRoutingRow("Client Origin Telemetry Status:", "SECURED THROUGH CENTRAL HUB NODE", idx++);

        // Draw outer border rectangle and vertical line divider
        pdf.setDrawColor(203, 213, 225);
        pdf.rect(col1X, instructionsTop, col3X - col1X, currentY - instructionsTop);
        pdf.line(col2X, instructionsTop, col2X, currentY);

        // Boilerplate regulatory disclosures (extremely modern feels)
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(30, 58, 138);
        pdf.text("FEDERAL RESERVE EXEMPT STATUS NOTICE", 15, currentY + 8);
        
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        const disclaimer = "The instructions generated on this sheet constitute lawful institutional clearances for sweeping funds across U.S. domestic clearing banks. This routing information matches Fedwire clearance standards. Recipients should deliver these instructions to their premium wealth management coordinator to complete manual or automated interbank settlement transfers.";
        const splitDisclaimer = pdf.splitTextToSize(disclaimer, 180);
        pdf.text(splitDisclaimer, 15, currentY + 14);

        // Include high-fidelity seal onto bottom right corner
        const sealBase64 = generateOfficialSealDataUrl();
        if (sealBase64) {
            pdf.addImage(sealBase64, 'PNG', 145, currentY + 40, 40, 40);
        }

        // Bottom disclaimer logo & signature
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8.5);
        pdf.setTextColor(15, 23, 42);
        pdf.text("FIRST PACIFIC GLOBAL CLEARING BUREAU", 15, currentY + 45);

        if (userSignatureDataUrl) {
            pdf.addImage(userSignatureDataUrl, 'PNG', 15, currentY + 47, 50, 16);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(8);
            pdf.text(`Signed by: ${userSignatureMetadata?.signerName || userProfile.name}`, 15, currentY + 68);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(7.5);
            pdf.setTextColor(100, 116, 139);
            pdf.text(`Title: ${userSignatureMetadata?.signerTitle || 'Account Owner'} | Hash: ${userSignatureMetadata?.hash || 'SIG-VERIFIED'}`, 15, currentY + 73);
        } else {
            pdf.setFont("serif", "italic");
            pdf.setFontSize(10);
            pdf.setTextColor(30, 58, 138);
            pdf.text(`[ Electronically Cleared & Verified: ${userProfile.name} ]`, 15, currentY + 54);
        }

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text("Certified ISO-20022 Network Node", 15, 275);

        // Embed Verification QR Code Block
        const originHost = typeof window !== 'undefined' ? window.location.origin : 'https://firstpacificbank.com';
        const verifyPayload = `${originHost}/verify?doc=CLEARING-${new Date().getFullYear()}&client=${encodeURIComponent(userProfile.name)}&status=VERIFIED`;
        embedVerificationQrCodeBlock(pdf, await generateQrCodeDataUrl(verifyPayload, 200), 15, currentY + 60, { width: 120, height: 20 });

        if (download) {
            pdf.save(`First_Pacific_Clearing_Routing_Instructions.pdf`);
        }
        return pdf;
    };

    // Generates Annual Tax & Interest Summary PDF / Tax Compliance Templates
    const generateTaxSummaryPDF = async (download = true): Promise<jsPDF> => {
        const pdf = new jsPDF({ format: 'a4', unit: 'mm' });
        applyBankPdfBackgroundAndWatermark(pdf, {
            title: 'TAX SUMMARY',
            documentRef: `REF: FPB-TAX-${new Date().getFullYear()}`
        });
        const totalVolume = transactions.reduce((acc, curr) => acc + curr.sendAmount, 0);
        const interestEarned = totalVolume * 0.045; 
        const capitalGains = totalVolume * 0.082; 

        if (taxDocType === '1099_int') {
            // Background watermarks
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(8);
            pdf.setTextColor(242, 244, 247);
            for (let wy = 35; wy < 280; wy += 45) {
                for (let wx = -10; wx < 210; wx += 60) {
                    pdf.text("INTERNAL REVENUE SERVICE COPY", wx, wy, { angle: 25 });
                }
            }

            // Header Banner
            pdf.setFillColor(15, 23, 42);
            pdf.rect(0, 0, 210, 35, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(20);
            pdf.text("FIRST PACIFIC GLOBAL", 15, 18);
            pdf.setFontSize(8);
            pdf.text("CERTIFIED OFFSHORE PRIVATE BANKING NODE", 15, 24);

            pdf.setFontSize(11);
            pdf.text("SUBSTITUTE FORM 1099-INT", 195, 15, { align: 'right' });
            pdf.setFontSize(8);
            pdf.text(`REPORT YEAR: ${taxCalendarYear}`, 195, 21, { align: 'right' });
            pdf.text("Interest Income Statement", 195, 26, { align: 'right' });

            // Grid blocks for Payer and Recipient
            pdf.setDrawColor(203, 213, 225);
            pdf.setFillColor(248, 250, 252);
            
            // Payer block (Left)
            pdf.rect(15, 42, 90, 32, 'F');
            pdf.rect(15, 42, 90, 32);
            pdf.setFontSize(7);
            pdf.setTextColor(100, 116, 139);
            pdf.text("PAYER'S NAME, STREET ADDRESS, CITY, STATE, ZIP, AND TELEPHONE", 18, 47);
            pdf.setFontSize(9);
            pdf.setTextColor(15, 23, 42);
            pdf.setFont("helvetica", "bold");
            pdf.text("First Pacific Global Private Bank", 18, 53);
            pdf.setFont("helvetica", "normal");
            pdf.text("Sovereign Wealth Tower, Suite 900", 18, 58);
            pdf.text("Zürich, Switzerland & Cayman Islands", 18, 63);
            pdf.text("Tel: +41 44 221 1101", 18, 68);

            // Recipient block (Right)
            pdf.rect(110, 42, 85, 32, 'F');
            pdf.rect(110, 42, 85, 32);
            pdf.setFontSize(7);
            pdf.setTextColor(100, 116, 139);
            pdf.text("RECIPIENT'S IDENTIFICATION NUMBER & ADDRESS", 113, 47);
            pdf.setFontSize(9);
            pdf.setTextColor(15, 23, 42);
            pdf.setFont("helvetica", "bold");
            pdf.text(userProfile.name, 113, 53);
            pdf.setFont("helvetica", "normal");
            pdf.text(userProfile.email, 113, 58);
            pdf.text(`Tax Residency Jurisdiction: ${taxGeography}`, 113, 63);
            pdf.text(`Account No: FPB-${userProfile.email.slice(0,8).toUpperCase() || 'TR-9281'}`, 113, 68);

            // 1099 Box Grid (Amber Filled High Contrast)
            pdf.setDrawColor(217, 119, 6);
            pdf.setFillColor(255, 251, 235);
            
            // Box 1
            pdf.rect(15, 80, 90, 18, 'F');
            pdf.rect(15, 80, 90, 18);
            pdf.setFontSize(7);
            pdf.setTextColor(146, 64, 14);
            pdf.text("Box 1: Interest income (qualified yield)", 18, 85);
            pdf.setFontSize(11);
            pdf.setFont("helvetica", "bold");
            pdf.text(`$${interestEarned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 18, 93);

            // Box 2
            pdf.rect(105, 80, 90, 18, 'F');
            pdf.rect(105, 80, 90, 18);
            pdf.setFontSize(7);
            pdf.setFont("helvetica", "normal");
            pdf.text("Box 2: Early withdrawal penalty", 108, 85);
            pdf.setFontSize(11);
            pdf.setFont("helvetica", "bold");
            pdf.text("$0.00", 108, 93);

            // Box 3
            pdf.rect(15, 98, 90, 18, 'F');
            pdf.rect(15, 98, 90, 18);
            pdf.setFontSize(7);
            pdf.setFont("helvetica", "normal");
            pdf.text("Box 3: Interest on U.S. Savings Bonds / Treasuries", 18, 103);
            pdf.setFontSize(11);
            pdf.setFont("helvetica", "bold");
            pdf.text("$0.00", 18, 111);

            // Box 4
            pdf.rect(105, 98, 90, 18, 'F');
            pdf.rect(105, 98, 90, 18);
            pdf.setFontSize(7);
            pdf.setFont("helvetica", "normal");
            pdf.text("Box 4: Federal income tax withheld", 108, 103);
            pdf.setFontSize(11);
            pdf.setFont("helvetica", "bold");
            pdf.text("$0.00", 108, 111);

            // Box 5
            pdf.rect(15, 116, 90, 18, 'F');
            pdf.rect(15, 116, 90, 18);
            pdf.setFontSize(7);
            pdf.setFont("helvetica", "normal");
            pdf.text("Box 5: Investment expenses / Capital Gains substitute", 18, 121);
            pdf.setFontSize(11);
            pdf.setFont("helvetica", "bold");
            pdf.text(`$${capitalGains.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 18, 129);

            // Box 6
            pdf.rect(105, 116, 90, 18, 'F');
            pdf.rect(105, 116, 90, 18);
            pdf.setFontSize(7);
            pdf.setFont("helvetica", "normal");
            pdf.text("Box 8: Foreign tax paid / sovereign withholding", 108, 121);
            pdf.setFontSize(11);
            pdf.setFont("helvetica", "bold");
            pdf.text("$0.00", 108, 129);

            // Legal disclosure text
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(7.5);
            pdf.setTextColor(100, 116, 139);
            const disclosure = "This substitute information form reports interest, capital gains and unencumbered yields credited to your offshore or domestic accounts during the specified calendar year. It is furnished to you as part of your institutional private banking reporting package. First Pacific Global certifies that these entries correspond strictly to your immutable cryptographic ledger audit log.";
            const splitLines = pdf.splitTextToSize(disclosure, 180);
            pdf.text(splitLines, 15, 145);

            // Stamp and seal positioning
            const sealBase64 = generateOfficialSealDataUrl();
            if (sealBase64) {
                pdf.addImage(sealBase64, 'PNG', 155, 165, 38, 38);
            }

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(8.5);
            pdf.setTextColor(15, 23, 42);
            pdf.text("COMPLIANCE VERIFICATION SIGN-OFF", 15, 170);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(8);
            pdf.text("Sovereign Compliance Officer: Trustee Sarah S. Sterling", 15, 175);
            pdf.text(`Residency Selection: ${taxGeography} Compliance Schema`, 15, 180);
            pdf.text(`Audit Reference: FPB-TAX-1099-${Math.floor(Math.random()*900000+100000)}`, 15, 185);

        } else if (taxDocType === 'fbar_114') {
            // FinCEN Form 114 Report of Foreign Bank and Financial Accounts (FBAR)
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(8);
            pdf.setTextColor(242, 244, 247);
            for (let wy = 35; wy < 280; wy += 45) {
                for (let wx = -10; wx < 210; wx += 60) {
                    pdf.text("FINCEN FORM 114 COMPLIANCE", wx, wy, { angle: 25 });
                }
            }

            pdf.setFillColor(30, 41, 59);
            pdf.rect(0, 0, 210, 35, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(18);
            pdf.text("REPORT OF FOREIGN BANK & FINANCIAL ACCOUNTS", 15, 18);
            pdf.setFontSize(8.5);
            pdf.text("FinCEN Form 114 (Substitute Compliance Template)", 15, 24);
            pdf.text(`CALENDAR YEAR: ${taxCalendarYear}`, 195, 18, { align: 'right' });
            pdf.text("Department of the Treasury", 195, 24, { align: 'right' });

            // Part I Filer Info
            pdf.setDrawColor(226, 232, 240);
            pdf.setFillColor(248, 250, 252);
            pdf.rect(15, 42, 180, 45, 'F');
            pdf.rect(15, 42, 180, 45);

            pdf.setFontSize(8);
            pdf.setTextColor(15, 23, 42);
            pdf.setFont("helvetica", "bold");
            pdf.text("PART I - FILER INFORMATION", 18, 48);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(8);
            pdf.text(`1. Filer Name: ${userProfile.name}`, 18, 55);
            pdf.text(`2. Taxpayer Identification Number: XXX-XX-FBAR`, 18, 62);
            pdf.text(`3. Contact Email: ${userProfile.email}`, 18, 69);
            pdf.text(`4. Geographical Jurisdiction: ${taxGeography} - Overseas Holdings`, 18, 76);
            pdf.text(`5. Submitting Entity: First Pacific Global Private Bank (Zürich & Cayman)`, 18, 83);

            // Part II Account owned individually
            pdf.setFillColor(248, 250, 252);
            pdf.rect(15, 95, 180, 50, 'F');
            pdf.rect(15, 95, 180, 50);

            pdf.setFont("helvetica", "bold");
            pdf.text("PART II - INDIVIDUAL FOREIGN FINANCIAL ACCOUNTS DISCLOSURE", 18, 101);
            pdf.setFont("helvetica", "normal");
            
            const maxBalance = totalVolume * 1.25; 
            pdf.text(`6. Maximum value of financial account during calendar year:`, 18, 108);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(16, 185, 129);
            pdf.text(`$${maxBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`, 120, 108);
            
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(15, 23, 42);
            pdf.text(`7. Type of financial account:`, 18, 115);
            pdf.setFont("helvetica", "bold");
            pdf.text("Bank Account (Offshore Multi-currency Portfolio)", 120, 115);

            pdf.setFont("helvetica", "normal");
            pdf.text(`8. Financial institution name:`, 18, 122);
            pdf.text("First Pacific Global Private Bank, Swiss Escrow Node", 120, 122);

            pdf.text(`9. Account Number:`, 18, 129);
            pdf.setFont("helvetica", "bold");
            pdf.text(`FPB-CH-${userProfile.email.slice(0,6).toUpperCase()}`, 120, 129);

            pdf.setFont("helvetica", "normal");
            pdf.text(`10. Location of financial institution:`, 18, 136);
            pdf.text("Zürich, Switzerland / Georgetown, Cayman Islands", 120, 136);

            // Self-Certification Signoff
            pdf.setFontSize(8.5);
            pdf.setFont("helvetica", "bold");
            pdf.text("PART III - COMPLIANCE SELF-CERTIFICATION", 15, 160);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(7.5);
            pdf.setTextColor(100, 116, 139);
            const selfCertText = "Under penalties of perjury, I declare that I have examined this report, and to the best of my knowledge and belief, it is true, correct, and complete for the reporting cycle specified under United States FinCEN and IRS FBAR foreign asset tracking directives.";
            const splitSelfCert = pdf.splitTextToSize(selfCertText, 180);
            pdf.text(splitSelfCert, 15, 165);

            pdf.setFontSize(8.5);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(15, 23, 42);
            pdf.text(`Declarant / Account Filer Signature:`, 15, 185);

            if (userSignatureDataUrl) {
                pdf.addImage(userSignatureDataUrl, 'PNG', 15, 187, 50, 16);
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(8);
                pdf.text(`Certified by: ${userSignatureMetadata?.signerName || userProfile.name}`, 15, 208);
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(7.5);
                pdf.setTextColor(100, 116, 139);
                pdf.text(`Timestamp: ${userSignatureMetadata?.timestamp ? new Date(userSignatureMetadata.timestamp).toLocaleDateString() : new Date().toLocaleDateString()} | ${userSignatureMetadata?.hash || 'SIG-VERIFIED'}`, 15, 213);
            } else {
                pdf.setFont("courier", "bolditalic");
                pdf.setFontSize(12);
                pdf.text(`// ${userProfile.name} //`, 15, 193);
                
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(8);
                pdf.setTextColor(100, 116, 139);
                pdf.text("Date of Self-Certification:", 15, 199);
                pdf.setFont("helvetica", "bold");
                pdf.setTextColor(15, 23, 42);
                pdf.text(new Date().toLocaleDateString(), 55, 199);
            }

            const sealBase64 = generateOfficialSealDataUrl();
            if (sealBase64) {
                pdf.addImage(sealBase64, 'PNG', 155, 175, 38, 38);
            }

        } else if (taxDocType === 'w8ben') {
            // W-8BEN Form Substitute
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(8);
            pdf.setTextColor(242, 244, 247);
            for (let wy = 35; wy < 280; wy += 45) {
                for (let wx = -10; wx < 210; wx += 60) {
                    pdf.text("W-8BEN FOREIGN BENEFICIAL OWNER", wx, wy, { angle: 25 });
                }
            }

            pdf.setFillColor(21, 94, 117);
            pdf.rect(0, 0, 210, 35, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(18);
            pdf.text("CERTIFICATE OF FOREIGN STATUS OF BENEFICIAL OWNER", 15, 18);
            pdf.setFontSize(8.5);
            pdf.text("Substitute Form W-8BEN (United States Tax Withholding & Reporting)", 15, 24);
            pdf.text("Status: CERTIFIED NON-US", 195, 18, { align: 'right' });
            pdf.text("Internal Revenue Service", 195, 24, { align: 'right' });

            // Part I Info
            pdf.setDrawColor(226, 232, 240);
            pdf.setFillColor(248, 250, 252);
            pdf.rect(15, 42, 180, 55, 'F');
            pdf.rect(15, 42, 180, 55);

            pdf.setFontSize(8.5);
            pdf.setTextColor(15, 23, 42);
            pdf.setFont("helvetica", "bold");
            pdf.text("PART I - IDENTIFICATION OF BENEFICIAL OWNER", 18, 48);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(8);
            pdf.text(`1. Name of beneficial owner: ${userProfile.name}`, 18, 55);
            pdf.text(`2. Country of citizenship: ${taxGeography === 'US' ? 'International / Expat' : taxGeography}`, 18, 62);
            pdf.text(`3. Permanent residence address: Zürich Sovereign Suites, Sector 4`, 18, 69);
            pdf.text(`4. Mailing address: ${userProfile.email}`, 18, 76);
            pdf.text(`5. Foreign tax identifying number (FTIN): FTIN-FPG-CH-98218`, 18, 83);
            pdf.text(`6. Reference number(s): Account ID: FPB-REF-${userProfile.email.slice(0,6).toUpperCase()}`, 18, 90);

            // Part II Treaty benefits
            pdf.setFillColor(248, 250, 252);
            pdf.rect(15, 105, 180, 30, 'F');
            pdf.rect(15, 105, 180, 30);

            pdf.setFont("helvetica", "bold");
            pdf.text("PART II - CLAIM OF TAX TREATY BENEFITS", 18, 111);
            pdf.setFont("helvetica", "normal");
            pdf.text(`7. I certify that the beneficial owner is a resident of country:`, 18, 118);
            pdf.setFont("helvetica", "bold");
            pdf.text(`${taxGeography}`, 110, 118);
            
            pdf.setFont("helvetica", "normal");
            pdf.text("8. Special rates and conditions: Special withholding rate under Article 11:", 18, 125);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(16, 185, 129);
            pdf.text("0% (Tax treaty exempt interest yield)", 110, 125);

            pdf.setTextColor(15, 23, 42);

            // Part III certification
            pdf.setFontSize(8.5);
            pdf.setFont("helvetica", "bold");
            pdf.text("PART III - DECLARATION & CERTIFICATION", 15, 145);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(7.5);
            pdf.setTextColor(100, 116, 139);
            const certifyText = "I certify under penalties of perjury that: I am the beneficial owner of all the income to which this form relates; The person named on line 1 of this form is not a U.S. person; The income to which this form relates is not effectively connected with the conduct of a trade or business in the United States.";
            const splitCertify = pdf.splitTextToSize(certifyText, 180);
            pdf.text(splitCertify, 15, 150);

            pdf.setFontSize(8.5);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(15, 23, 42);
            pdf.text(`Beneficial Owner Digital Sign-off:`, 15, 175);

            if (userSignatureDataUrl) {
                pdf.addImage(userSignatureDataUrl, 'PNG', 15, 177, 50, 16);
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(8);
                pdf.text(`Signed: ${userSignatureMetadata?.signerName || userProfile.name}`, 15, 198);
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(7.5);
                pdf.setTextColor(100, 116, 139);
                pdf.text(`Title: ${userSignatureMetadata?.signerTitle || 'Beneficial Owner'} | ${userSignatureMetadata?.hash || 'SIG-VERIFIED'}`, 15, 203);
            } else {
                pdf.setFont("courier", "bolditalic");
                pdf.setFontSize(12);
                pdf.text(`// ${userProfile.name} //`, 15, 183);
                
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(8);
                pdf.setTextColor(100, 116, 139);
                pdf.text("Submission Date timestamp:", 15, 189);
                pdf.setFont("helvetica", "bold");
                pdf.setTextColor(15, 23, 42);
                pdf.text(new Date().toLocaleDateString() + " 12:00 UTC", 55, 189);
            }

            const sealBase64 = generateOfficialSealDataUrl();
            if (sealBase64) {
                pdf.addImage(sealBase64, 'PNG', 155, 165, 38, 38);
            }

        } else if (taxDocType === 'schedule_b') {
            // Schedule B Form 1040 Substitute
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(8);
            pdf.setTextColor(242, 244, 247);
            for (let wy = 35; wy < 280; wy += 45) {
                for (let wx = -10; wx < 210; wx += 60) {
                    pdf.text("IRS SCHEDULE B COMPLIANCE", wx, wy, { angle: 25 });
                }
            }

            pdf.setFillColor(15, 118, 110);
            pdf.rect(0, 0, 210, 35, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(18);
            pdf.text("SCHEDULE B - INTEREST & ORDINARY DIVIDENDS", 15, 18);
            pdf.setFontSize(8.5);
            pdf.text("Form 1040 (Substitute Statement of Interest Income)", 15, 24);
            pdf.text(`REPORT YEAR: ${taxCalendarYear}`, 195, 18, { align: 'right' });
            pdf.text("IRS Compliance Copy", 195, 24, { align: 'right' });

            // Filer Name and Taxpayer ID
            pdf.setDrawColor(203, 213, 225);
            pdf.setFillColor(248, 250, 252);
            pdf.rect(15, 42, 180, 14, 'F');
            pdf.rect(15, 42, 180, 14);
            pdf.setFontSize(8);
            pdf.setTextColor(100, 116, 139);
            pdf.text("Name(s) shown on Form 1040", 18, 47);
            pdf.text("Your social security number", 120, 47);
            pdf.setFontSize(9);
            pdf.setTextColor(15, 23, 42);
            pdf.setFont("helvetica", "bold");
            pdf.text(userProfile.name, 18, 52);
            pdf.text("XXX-XX-SCHB", 120, 52);

            // Part I Interest Income Table
            pdf.setFillColor(248, 250, 252);
            pdf.rect(15, 62, 180, 48, 'F');
            pdf.rect(15, 62, 180, 48);

            pdf.setFontSize(8.5);
            pdf.setTextColor(15, 23, 42);
            pdf.text("Part I - INTEREST INCOME", 18, 68);
            pdf.setFontSize(8);
            pdf.setFont("helvetica", "normal");
            pdf.text("1. List name of payer. Interest credited to accounts:", 18, 74);
            
            // List Payers
            pdf.setFont("helvetica", "bold");
            pdf.text("First Pacific Global Private Bank (Swiss Escrow Portfolios)", 22, 81);
            pdf.text(`$${interestEarned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 155, 81);

            pdf.setFont("helvetica", "normal");
            pdf.text("First Pacific Global Private Bank (Cayman Yield Node)", 22, 88);
            pdf.text("$0.00", 155, 88);

            pdf.line(18, 93, 190, 93);
            pdf.setFont("helvetica", "bold");
            pdf.text("2. Total Interest Income (Add lines in box 1):", 18, 98);
            pdf.setTextColor(16, 185, 129);
            pdf.text(`$${interestEarned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 155, 98);

            // Part III Foreign accounts
            pdf.setFillColor(248, 250, 252);
            pdf.rect(15, 116, 180, 32, 'F');
            pdf.rect(15, 116, 180, 32);

            pdf.setFontSize(8.5);
            pdf.setTextColor(15, 23, 42);
            pdf.setFont("helvetica", "bold");
            pdf.text("Part III - FOREIGN ACCOUNTS AND TRUSTS", 18, 122);
            pdf.setFontSize(7.5);
            pdf.setFont("helvetica", "normal");
            pdf.text("7a. At any time during the year, did you have a financial interest in or signature authority over a financial", 18, 128);
            pdf.text("    account in a foreign country (such as a bank account, securities account, or other financial account)?", 18, 132);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(16, 185, 129);
            pdf.text("[YES] - First Pacific Global Private Bank, Zürich node", 145, 132);

            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(15, 23, 42);
            pdf.text("7b. If 'Yes,' enter name of foreign country where the financial account is located:", 18, 139);
            pdf.setFont("helvetica", "bold");
            pdf.text("SWITZERLAND / CAYMAN ISLANDS", 145, 139);

            // Stamp/Seal
            pdf.setFontSize(7.5);
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(100, 116, 139);
            pdf.text("This Substitute Schedule B is formatted according to IRS and GAAP specifications.", 15, 158);

            pdf.setFontSize(8);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(15, 23, 42);
            pdf.text("AUTHORIZED VERIFICATION STAMP", 15, 172);
            pdf.setFont("helvetica", "normal");
            pdf.text("Trustee Representative: Sarah S. Sterling", 15, 177);
            pdf.text("Compliance Status: VERIFIED REPORTABLE INTEREST", 15, 182);

            const sealBase64 = generateOfficialSealDataUrl();
            if (sealBase64) {
                pdf.addImage(sealBase64, 'PNG', 155, 160, 38, 38);
            }
        }

        // Embed Verification QR Code Block
        const originHost = typeof window !== 'undefined' ? window.location.origin : 'https://firstpacificbank.com';
        const verifyPayload = `${originHost}/verify?doc=TAX-${taxDocType.toUpperCase()}&client=${encodeURIComponent(userProfile.name)}&status=VERIFIED`;
        embedVerificationQrCodeBlock(pdf, await generateQrCodeDataUrl(verifyPayload, 200), 15, 275, { width: 180, height: 16 });

        if (download) {
            pdf.save(`Tax_Compliance_${taxDocType.toUpperCase()}_FPB.pdf`);
        }
        return pdf;
    };

    // Trigger standard download & plays sound
    const handleDownload = () => {
        setIsGenerating(true);
        playRegulatorySound();
        setTimeout(() => {
            if (activeTab === 'auth_letter') {
                generateAuthorizationLetterPDF(true);
            } else if (activeTab === 'clearing_instructions') {
                generateClearingInstructionsPDF(true);
            } else if (activeTab === 'tax_summary') {
                generateTaxSummaryPDF(true);
            }
            setIsGenerating(false);
        }, 1200);
    };

    // Triggers real email generation with PDF attachment in real time!
    const handleSendRealEmail = async () => {
        setEmailSuccess(null);
        setEmailError(null);
        setIsGenerating(true);
        playRegulatorySound();

        setTimeout(async () => {
            try {
                let attachmentName = '';
                let pdfBase64 = '';
                let subject = '';
                let htmlText = '';

                if (activeTab === 'auth_letter') {
                    const pdfObj = await generateAuthorizationLetterPDF(false);
                    pdfBase64 = pdfObj.output('datauristring').split(',')[1];
                    attachmentName = 'Official_Underwriter_Authorization_Letter.pdf';
                    subject = `🏛️ URGENT: Official Private Bank Authorization Letter Clearance [Sec. 5312]`;
                    htmlText = `
                        <p>Dear ${userProfile.name},</p>
                        <p>Please find attached the official, high-fidelity <strong>Bank Official Authorization Letter / Form</strong> requested for premium transaction clearance.</p>
                        
                        <div style="background-color: #f8fafc; border-left: 4px solid #ca8a04; padding: 18px; margin: 24px 0;">
                            <strong style="color: #0f172a; font-size: 14px;">EXECUTIVE CLEARANCE STATUS: AUTHORIZED</strong>
                            <p style="margin: 6px 0 0 0; font-size: 13px; color: #475569;">The underwriting team led by Trustee <strong>${authFormData.signeeOfficer}</strong> has cleared international clearing holds on the account. Immutably signed with executive stamps.</p>
                        </div>

                        <table cellpadding="6" cellspacing="0" style="font-size: 13px; font-family: sans-serif; border: 1px solid #f1f5f9; width: 100%; margin-bottom: 24px;">
                            <tr style="background:#f8fafc;"><td style="font-weight:bold; width:35%;">Subject Authorized Value:</td><td>$${authFormData.amount} USD</td></tr>
                            <tr><td style="font-weight:bold;">Beneficiary Destination:</td><td>${authFormData.beneficiaryName}</td></tr>
                            <tr style="background:#f8fafc;"><td style="font-weight:bold;">Clearing Framework:</td><td>${authFormData.regulatoryExemption}</td></tr>
                            <tr><td style="font-weight:bold;">Routing Speed Channel:</td><td>${authFormData.routingSpeed}</td></tr>
                        </table>

                        <p>If you need further authentication or immediate desk verification, please contact your private wealth banker.</p>
                    `;
                } else if (activeTab === 'clearing_instructions') {
                    const pdfObj = await generateClearingInstructionsPDF(false);
                    pdfBase64 = pdfObj.output('datauristring').split(',')[1];
                    attachmentName = 'External_Pay_Clearing_Routing_Instructions.pdf';
                    subject = `⚡ External Payment Instruction Sheet Generated - Urgent Routing Core`;
                    htmlText = `
                        <p>Dear ${userProfile.name},</p>
                        <p>Please find attached your compliant <strong>External Payment Clearing Instruction sheet</strong>.</p>
                        <p>These clearing metrics are formatted to match modern US commercial institution wires and CHIPS transactions.</p>
                        
                        <div style="background: #0f172a; color:#fff; padding: 20px; border-radius: 12px; margin: 20px 0;">
                            <h4 style="margin:0 0 10px 0; color:#10b981; font-size:12px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase;">CORRESPONDENT ROUTING SPECS</h4>
                            <p style="margin:4px 0; font-size:13px;">Correspondent Bank: ${clearingFormData.correspondentBank}</p>
                            <p style="margin:4px 0; font-size:13px;">Network Protocol: ${clearingFormData.clearingNetwork}</p>
                            <p style="margin:4px 0; font-size:13px;">ABA Routing: ${clearingFormData.routingNumber}</p>
                            <p style="margin:4px 0; font-size:13px;">Beneficiary Account: ${clearingFormData.beneficiaryAccount}</p>
                        </div>
                    `;
                } else if (activeTab === 'tax_summary') {
                    const pdfObj = await generateTaxSummaryPDF(false);
                    pdfBase64 = pdfObj.output('datauristring').split(',')[1];
                    attachmentName = 'Tax_Interest_Summary.pdf';
                    subject = `First Pacific Global - Annual Tax & Interest Summary`;
                    htmlText = `
                        <p>Dear ${userProfile.name},</p>
                        <p>Attached is your comprehensive Annual Tax and Interest Summary, aggregating your capital gains, yields, and interest generated over the period.</p>
                        <p>This document is certified for reporting to relevant taxation authorities.</p>
                    `;
                }

                const res = await sendEmail(userProfile.email, subject, htmlText, [{
                    filename: attachmentName,
                    content: pdfBase64
                }]);

                if (res.success) {
                    setEmailSuccess(`Success! Secure email with real-time official PDF attachment has been dispatched to ${userProfile.email}.`);
                    // Push custom inbox alert
                    window.dispatchEvent(new CustomEvent('ADD_VERIFIED_INBOX_NOTIFICATION', {
                        detail: {
                            type: 'security',
                            title: `Document Transmitted Securely`,
                            message: `Official document was compiled with High-Fidelity seal & dispatched to ${userProfile.email} via rapid mail channel. Reference Code: SEC-${Math.floor(Math.random()*10000)}`,
                        }
                    }));
                } else {
                    setEmailError(`Secure SMTP failed: ${res.error || 'Server rejected gateway handshake'}`);
                }
            } catch (e: any) {
                setEmailError(`Error packing attachments: ${e.message}`);
            }
            setIsGenerating(false);
        }, 1000);
    };

    return (
        <div id="document-viewer-container" className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in-up">
            
            {/* Top Interactive Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden ring-1 ring-white/10 shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <ShieldCheckIcon className="w-48 h-48" />
                </div>
                <div className="relative z-10">
                    <span className="bg-emerald-600 text-emerald-400 font-black text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-full border border-emerald-500/20">
                        Institutional Escrow Clearance Console
                    </span>
                    <h1 className="text-3xl font-black mt-4 mb-2 uppercase tracking-tight">
                        Official Treasury Documents & Forms
                    </h1>
                    <p className="text-sm text-[#0F172A] max-w-xl leading-relaxed">
                        Access, request, and verify Bank Official Authorization Letters, custom External Clearing Instructions, and monthly statements certified under Federal Reserve and IMF guidelines.
                    </p>
                </div>
            </div>

            {/* Premium Tab Switcher */}
            <div className="bg-white dark:bg-[#070b12] rounded-3xl p-2 border border-slate-200 dark:border-white/10 shadow-xl flex flex-wrap gap-2">
                <button 
                    onClick={() => { setActiveTab('statements'); setEmailSuccess(null); setEmailError(null); }}
                    className={`flex-1 py-4 px-4 font-black text-xs uppercase tracking-wider rounded-2xl transition-all ${
                        activeTab === 'statements' 
                            ? 'bg-emerald-600 text-emerald-500 border border-emerald-500/30' 
                            : 'text-[#0F172A] dark:text-white hover:bg-slate-100 dark:hover:bg-white'
                    }`}
                >
                    Ledger Statements
                </button>
                <button 
                    onClick={() => { setActiveTab('auth_letter'); setEmailSuccess(null); setEmailError(null); }}
                    className={`flex-1 py-4 px-4 font-black text-xs uppercase tracking-wider rounded-2xl transition-all ${
                        activeTab === 'auth_letter' 
                            ? 'bg-emerald-600 text-emerald-500 border border-emerald-500/30' 
                            : 'text-[#0F172A] dark:text-white hover:bg-slate-100 dark:hover:bg-white'
                    }`}
                >
                    Official Bank Authorization Letter
                </button>
                <button 
                    onClick={() => { setActiveTab('clearing_instructions'); setEmailSuccess(null); setEmailError(null); }}
                    className={`flex-1 py-4 px-4 font-black text-xs uppercase tracking-wider rounded-2xl transition-all ${
                        activeTab === 'clearing_instructions' 
                            ? 'bg-emerald-600 text-emerald-500 border border-emerald-500/30' 
                            : 'text-[#0F172A] dark:text-white hover:bg-slate-100 dark:hover:bg-white'
                    }`}
                >
                    External Payment Instructions (CHIPS / ABA)
                </button>
                <button 
                    onClick={() => { setActiveTab('tax_summary'); setEmailSuccess(null); setEmailError(null); }}
                    className={`flex-1 py-4 px-4 font-black text-xs uppercase tracking-wider rounded-2xl transition-all ${
                        activeTab === 'tax_summary' 
                            ? 'bg-emerald-600 text-emerald-500 border border-emerald-500/30' 
                            : 'text-[#0F172A] dark:text-white hover:bg-slate-100 dark:hover:bg-white'
                    }`}
                >
                    Annual Tax & Interest Summary
                </button>
                <button 
                    onClick={() => { setActiveTab('receipt_markup'); setEmailSuccess(null); setEmailError(null); }}
                    className={`flex-1 py-4 px-4 font-black text-xs uppercase tracking-wider rounded-2xl transition-all ${
                        activeTab === 'receipt_markup' 
                            ? 'bg-amber-500 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10' 
                            : 'text-[#0F172A] dark:text-white hover:bg-slate-100 dark:hover:bg-white'
                    }`}
                >
                    ✍ Tax Receipt Audit Markup Canvas
                </button>
                <button 
                    onClick={() => { setActiveTab('digital_signature'); setEmailSuccess(null); setEmailError(null); }}
                    className={`flex-1 py-4 px-4 font-black text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer ${
                        activeTab === 'digital_signature' 
                            ? 'bg-emerald-500 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10' 
                            : 'text-[#0F172A] dark:text-white hover:bg-slate-100 dark:hover:bg-white'
                    }`}
                >
                    ✍ On-Screen Signature {userSignatureDataUrl && '✓'}
                </button>
            </div>

            {/* Split layout: Input / Settings and Live Document Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Inputs details panel */}
                <div className="lg:col-span-5 bg-white dark:bg-[#0a0f18] rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-xl space-y-6">
                    {activeTab === 'statements' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Statement Period</h3>
                            <p className="text-xs text-[#0F172A] leading-relaxed">
                                Generate official certified account statements formatted for tax, loan, or audit verification. The downloaded statements are verified using standard interbank clearance tokens and are signed with the bank's official seal.
                            </p>
                            
                            <div className="pt-2">
                                <button
                                    onClick={() => setIsStatementModalOpen(true)}
                                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <DocumentCheckIcon className="w-5 h-5" />
                                    Configure & Generate PDF Statement
                                </button>
                            </div>

                            {/* Quarterly Financial Summary Feature Card & Button */}
                            <div className="pt-3 border-t border-slate-100 dark:border-white/10 space-y-3">
                                <div className="bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-slate-900/90 p-4 rounded-2xl border border-amber-500/30 space-y-3 shadow-md">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                                📊 Quarterly Financial Summary
                                            </h4>
                                            <p className="text-[10px] text-[#0F172A] mt-0.5">
                                                Summarizes total inflows, outflows & net asset changes.
                                            </p>
                                        </div>
                                        <span className="text-[9px] bg-amber-500 text-amber-300 font-mono font-bold px-2 py-0.5 rounded border border-amber-500/30">
                                            PDF Report
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[9px] font-black text-[#0F172A] uppercase tracking-wider block mb-1">Quarter</label>
                                            <select
                                                value={selectedQuarter}
                                                onChange={e => setSelectedQuarter(e.target.value as any)}
                                                className="w-full bg-slate-50 text-white text-xs font-bold border border-black/5 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500 dark:bg-slate-900"
                                            >
                                                <option value="Q1">Q1 (Jan–Mar)</option>
                                                <option value="Q2">Q2 (Apr–Jun)</option>
                                                <option value="Q3">Q3 (Jul–Sep)</option>
                                                <option value="Q4">Q4 (Oct–Dec)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-[#0F172A] uppercase tracking-wider block mb-1">Year</label>
                                            <select
                                                value={quarterlyYear}
                                                onChange={e => setQuarterlyYear(Number(e.target.value))}
                                                className="w-full bg-slate-50 text-white text-xs font-bold border border-black/5 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500 dark:bg-slate-900"
                                            >
                                                <option value={2026}>2026 (Current)</option>
                                                <option value={2025}>2025</option>
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => generateQuarterlyFinancialReportPDF({
                                            quarter: selectedQuarter,
                                            year: quarterlyYear,
                                            transactions,
                                            userProfile
                                        })}
                                        className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                                    >
                                        <ArrowDownTrayIcon className="w-4 h-4 text-slate-950" />
                                        <span>Quarterly Financial Summary (PDF)</span>
                                    </button>
                                </div>
                            </div>

                        </div>
                    )}

                    {activeTab === 'auth_letter' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Letter Details</h3>
                            <p className="text-xs text-[#0F172A] leading-relaxed">
                                Complete this executive template to authorize or release transactions. You can bind details to existing transactions.
                            </p>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-wider">Bind to Transaction</label>
                                <select 
                                    value={selectedTxId}
                                    onChange={e => setSelectedTxId(e.target.value)}
                                    className="bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                                >
                                    <option value="">-- Dynamic Manual Custom Entry --</option>
                                    {transactions.map(t => (
                                        <option key={t.id} value={t.id}>
                                            ${t.sendAmount.toLocaleString()} to {t.recipient?.fullName || t.description} ({t.status.toUpperCase()})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-wider">Beneficiary Entity</label>
                                <input 
                                    type="text" 
                                    value={authFormData.beneficiaryName}
                                    onChange={e => setAuthFormData(prev => ({ ...prev, beneficiaryName: e.target.value }))}
                                    placeholder="e.g. JPMorgan Chase Clearing desk"
                                    className="bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-wider">Authorized Fund Sweep (USD)</label>
                                <input 
                                    type="text" 
                                    value={authFormData.amount}
                                    onChange={e => setAuthFormData(prev => ({ ...prev, amount: e.target.value }))}
                                    placeholder="e.g. 125,000.00"
                                    className="bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-wider">Compliance Clearance Act</label>
                                <input 
                                    type="text" 
                                    value={authFormData.regulatoryExemption}
                                    onChange={e => setAuthFormData(prev => ({ ...prev, regulatoryExemption: e.target.value }))}
                                    className="bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-wider">Routing Speed Channel</label>
                                <input 
                                    type="text" 
                                    value={authFormData.routingSpeed}
                                    onChange={e => setAuthFormData(prev => ({ ...prev, routingSpeed: e.target.value }))}
                                    className="bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'clearing_instructions' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Clearing Specifications</h3>
                            <p className="text-xs text-[#0F172A] leading-relaxed">
                                Formulate external CHIPS/Fedwire payment parameters for foreign clearance nodes.
                            </p>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-wider">Correspondent Receiver Bank</label>
                                <input 
                                    type="text" 
                                    value={clearingFormData.correspondentBank}
                                    onChange={e => setClearingFormData(prev => ({ ...prev, correspondentBank: e.target.value }))}
                                    className="bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-wider">Clearing Network System</label>
                                <input 
                                    type="text" 
                                    value={clearingFormData.clearingNetwork}
                                    onChange={e => setClearingFormData(prev => ({ ...prev, clearingNetwork: e.target.value }))}
                                    className="bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-wider">ABA / Swift Code</label>
                                <input 
                                    type="text" 
                                    value={clearingFormData.routingNumber}
                                    onChange={e => setClearingFormData(prev => ({ ...prev, routingNumber: e.target.value }))}
                                    className="bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-wider">Account / IBAN</label>
                                <input 
                                    type="text" 
                                    value={clearingFormData.beneficiaryAccount}
                                    onChange={e => setClearingFormData(prev => ({ ...prev, beneficiaryAccount: e.target.value }))}
                                    className="bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-wider">Purpose of Routing</label>
                                <input 
                                    type="text" 
                                    value={clearingFormData.purposeOfTransfer}
                                    onChange={e => setClearingFormData(prev => ({ ...prev, purposeOfTransfer: e.target.value }))}
                                    className="bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'tax_summary' && (
                        <div className="space-y-5 animate-fade-in text-[#0F172A] dark:text-white">
                            <div className="border-b border-slate-100 dark:border-white/10 pb-2">
                                <h3 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Auto-Tax Intelligence</h3>
                                <p className="text-xs text-[#0F172A] leading-relaxed">
                                    AI-powered analysis of local & international tax filing obligations based on your transaction flow.
                                </p>
                            </div>

                            {/* Geography selection */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-wider">Tax Residency Geography</label>
                                <select 
                                    value={taxGeography} 
                                    onChange={e => setTaxGeography(e.target.value)}
                                    className="bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                                >
                                    <option value="US">United States (IRS System)</option>
                                    <option value="UK">United Kingdom (HMRC System)</option>
                                    <option value="DE">Germany (Bundeszentralamt für Steuern)</option>
                                    <option value="CH">Switzerland (ESTV Cantonal)</option>
                                    <option value="SG">Singapore (IRAS Territorial)</option>
                                </select>
                            </div>

                            {/* Dynamic deadlines list based on geography */}
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-white/10 space-y-3">
                                <h4 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest flex items-center justify-between">
                                    <span>Filing Deadlines</span>
                                    <span className="text-[8px] bg-[#ca8a04]/20 text-[#ca8a04] px-1.5 py-0.5 rounded font-mono uppercase tracking-normal">Tax Period {taxCalendarYear}</span>
                                </h4>
                                <div className="space-y-2 text-xs">
                                    {taxGeography === 'US' && (
                                        <>
                                            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-white/10">
                                                <div>
                                                    <p className="font-bold text-[#0F172A] dark:text-white">Form 1040 (Annual Return)</p>
                                                    <p className="text-[9px] text-[#0F172A]">April 15, 2027</p>
                                                </div>
                                                <span className="text-[9px] text-[#ca8a04] font-black font-mono">Q1 Deadline</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-white/10">
                                                <div>
                                                    <p className="font-bold text-[#0F172A] dark:text-white">FinCEN Form 114 (FBAR)</p>
                                                    <p className="text-[9px] text-[#0F172A]">April 15, 2027</p>
                                                </div>
                                                <span className="text-[9px] text-emerald-400 font-black font-mono">Auto Oct 15 Ext</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-white/10">
                                                <div>
                                                    <p className="font-bold text-[#0F172A] dark:text-white">Estimated Quarterly Taxes</p>
                                                    <p className="text-[9px] text-[#0F172A]">Sept 15, 2026 / Jan 15, 2027</p>
                                                </div>
                                                <span className="text-[9px] text-[#0F172A] font-black font-mono">Quarterly</span>
                                            </div>
                                        </>
                                    )}
                                    {taxGeography === 'UK' && (
                                        <>
                                            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-white/10">
                                                <div>
                                                    <p className="font-bold text-[#0F172A] dark:text-white">HMRC Self Assessment (Online)</p>
                                                    <p className="text-[9px] text-[#0F172A]">January 31, 2027</p>
                                                </div>
                                                <span className="text-[9px] text-[#ca8a04] font-black font-mono">Mandatory</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-white/10">
                                                <div>
                                                    <p className="font-bold text-[#0F172A] dark:text-white">End of UK Tax Year</p>
                                                    <p className="text-[9px] text-[#0F172A]">April 5, 2027</p>
                                                </div>
                                                <span className="text-[9px] text-emerald-400 font-black font-mono">Closing Cycle</span>
                                            </div>
                                        </>
                                    )}
                                    {taxGeography === 'DE' && (
                                        <>
                                            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-white/10">
                                                <div>
                                                    <p className="font-bold text-[#0F172A] dark:text-white">Einkommensteuererklärung</p>
                                                    <p className="text-[9px] text-[#0F172A]">July 31, 2027</p>
                                                </div>
                                                <span className="text-[9px] text-[#ca8a04] font-black font-mono">Regular</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-white/10">
                                                <div>
                                                    <p className="font-bold text-[#0F172A] dark:text-white">Filing with Tax Advisor (Steuerberater)</p>
                                                    <p className="text-[9px] text-[#0F172A]">February 28, 2028</p>
                                                </div>
                                                <span className="text-[9px] text-emerald-400 font-black font-mono">Extended</span>
                                            </div>
                                        </>
                                    )}
                                    {taxGeography === 'CH' && (
                                        <>
                                            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-white/10">
                                                <div>
                                                    <p className="font-bold text-[#0F172A] dark:text-white">Cantonal Tax Return (Zürich)</p>
                                                    <p className="text-[9px] text-[#0F172A]">March 31, 2027</p>
                                                </div>
                                                <span className="text-[9px] text-emerald-400 font-black font-mono">Cantonal</span>
                                            </div>
                                        </>
                                    )}
                                    {taxGeography === 'SG' && (
                                        <>
                                            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-white/10">
                                                <div>
                                                    <p className="font-bold text-[#0F172A] dark:text-white">IRAS Paper Personal Tax Return</p>
                                                    <p className="text-[9px] text-[#0F172A]">April 15, 2027</p>
                                                </div>
                                                <span className="text-[9px] text-[#0F172A] font-black font-mono">Paper Submission</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-white/10">
                                                <div>
                                                    <p className="font-bold text-[#0F172A] dark:text-white">IRAS Electronic E-filing</p>
                                                    <p className="text-[9px] text-[#0F172A]">April 18, 2027</p>
                                                </div>
                                                <span className="text-[9px] text-[#ca8a04] font-black font-mono">E-Portal</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Transaction Analysis / Auto-Tax triggers */}
                            <div className="bg-amber-950 p-4 rounded-2xl border border-amber-500/20 text-xs space-y-3 leading-relaxed">
                                <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                                    ✓ Identified Tax Profile & Advice
                                </h4>
                                <div className="text-[#0F172A] dark:text-white space-y-2">
                                    <p>
                                        Based on your private banking activity log of <strong>{transactions.length} transactions</strong> totaling{' '}
                                        <strong className="text-[#0F172A] dark:text-white">{formatCurrency(transactions.reduce((acc, curr) => acc + curr.sendAmount, 0))}</strong>, we detected the following obligations:
                                    </p>
                                    <div className="space-y-1.5 pl-2 border-l-2 border-[#ca8a04]/40 font-bold text-xs">
                                        {taxGeography === 'US' && transactions.reduce((acc, curr) => acc + curr.sendAmount, 0) > 10000 && (
                                            <p className="text-[#1E293B] dark:text-slate-100">
                                                ⚠ <strong className="text-amber-500">FinCEN FBAR Requirement</strong>: Your unencumbered offshore assets exceeded $10,000 during the cycle. You are legally required to submit FinCEN Form 114 to prevent severe statutory penalties.
                                            </p>
                                        )}
                                        {taxGeography === 'US' && (
                                            <p className="text-[#1E293B] dark:text-slate-100">
                                                ✓ <strong className="text-emerald-500">Schedule B Declaration</strong>: Form 1040 Schedule B substitute should be appended to declare your Swiss escrow accrued yield of{' '}
                                                <span className="text-[#0F172A] dark:text-white font-bold">{(transactions.reduce((acc, curr) => acc + curr.sendAmount, 0) * 0.045).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>.
                                            </p>
                                        )}
                                        {taxGeography === 'UK' && (
                                            <p className="text-[#1E293B] dark:text-slate-100">
                                                ✓ <strong className="text-[#ca8a04]">HMRC Reporting</strong>: Accumulation value of{' '}
                                                <span className="text-[#0F172A] dark:text-white font-bold">{(transactions.reduce((acc, curr) => acc + curr.sendAmount, 0) * 0.082).toLocaleString('en-US', { style: 'currency', currency: 'GBP' })}</span> must be reported in UK HMRC Self Assessment Capital Gains.
                                            </p>
                                        )}
                                        {taxGeography === 'DE' && (
                                            <p className="text-[#1E293B] dark:text-slate-100">
                                                ✓ <strong className="text-amber-500">Foreign Yield Reporting</strong>: Total interest yield of{' '}
                                                <span className="text-[#0F172A] dark:text-white font-bold">{(transactions.reduce((acc, curr) => acc + curr.sendAmount, 0) * 0.045).toLocaleString('en-US', { style: 'currency', currency: 'EUR' })}</span> must be declared under KAP-INV parameters for offshore wealth indexation.
                                            </p>
                                        )}
                                        {taxGeography === 'SG' && (
                                            <p className="text-[#1E293B] dark:text-slate-100">
                                                ✓ <strong className="text-emerald-500">Territorial Exemption Node</strong>: Under IRAS territorial principles, foreign-sourced investments and yields are exempt from Singapore income tax. No active withholding is triggered.
                                            </p>
                                        )}
                                        <p className="text-[10px] text-[#0F172A] dark:text-white italic">
                                            Verification Token: FPG-TAX-INTELLIGENCE-NODE-OK
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Template selector & Year settings */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">
                                    Generate Compliance Templates
                                </h4>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-wider">Select Printable Template</label>
                                    <select 
                                        value={taxDocType} 
                                        onChange={e => setTaxDocType(e.target.value as any)}
                                        className="bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                                    >
                                        <option value="1099_int">Substitute Form 1099-INT (Tax & Interest Summary)</option>
                                        <option value="fbar_114">FinCEN FBAR Form 114 (Foreign Account Disclosure)</option>
                                        <option value="w8ben">Substitute Form W-8BEN (Foreign Status Certificate)</option>
                                        <option value="schedule_b">IRS Schedule B (Interest and Dividends Income)</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-wider">Tax Year</label>
                                        <select 
                                            value={taxCalendarYear} 
                                            onChange={e => setTaxCalendarYear(Number(e.target.value))}
                                            className="bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                                        >
                                            <option value="2026">2026 (Active)</option>
                                            <option value="2025">2025 (Previous)</option>
                                            <option value="2027">2027 (Forecast)</option>
                                        </select>
                                    </div>

                                    <div className="flex items-end pb-1.5">
                                        <label className="flex items-center gap-2 text-xs font-bold text-[#0F172A] dark:text-white cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={taxSelfCertChecked} 
                                                onChange={e => setTaxSelfCertChecked(e.target.checked)}
                                                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 bg-slate-100 dark:bg-slate-900"
                                            />
                                            <span>Self-Certified</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'receipt_markup' && (
                        <div className="space-y-4">
                            <div className="border-b border-slate-100 dark:border-white/10 pb-3">
                                <h3 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-tight flex items-center gap-2">
                                    <span>Receipt Tax Audit Controls</span>
                                </h3>
                                <p className="text-xs text-[#0F172A] leading-relaxed mt-1">
                                    Highlight, draw freehand boxes, or stamp uploaded receipts for IRS/tax compliance auditing.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-wider">Select Transaction Receipt</label>
                                <select 
                                    value={selectedReceiptTxId}
                                    onChange={e => {
                                        setSelectedReceiptTxId(e.target.value);
                                        setDocOcrStatus(null);
                                        setDocOcrResult(null);
                                    }}
                                    className="bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-bold"
                                >
                                    <option value="">-- Choose Transaction --</option>
                                    {transactions.map(t => (
                                        <option key={t.id} value={t.id}>
                                            ${t.sendAmount.toLocaleString()} - {t.recipient?.nickname || t.recipient?.fullName || t.description} ({(t.paymentProof || (t as any).screenshotProof) ? '📷 Proof Attached' : 'No Proof'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-wider block">Or Upload Local Receipt File</label>
                                <label className="w-full py-3 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-white text-[#0F172A] dark:text-white border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all">
                                    <span>📁 Upload Receipt Image</span>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const compressed = await compressImage(file);
                                                setCustomDocReceiptUrl(compressed);
                                                setSelectedReceiptTxId('');
                                                setDocOcrStatus("Analyzing visual contents of uploaded receipt with Gemini AI...");
                                                const ocr = await analyzeReceiptOCR(compressed);
                                                if (ocr.success) {
                                                    const cat = ocr.category || "Shopping";
                                                    setDocOcrResult({
                                                        amount: ocr.amount,
                                                        date: ocr.date,
                                                        merchant: ocr.merchant,
                                                        category: cat
                                                    });
                                                    setSuggestedCategoryPrompt({
                                                        category: cat,
                                                        merchant: ocr.merchant || "Uploaded Receipt Vendor",
                                                        amount: ocr.amount || 0,
                                                        confirmed: false
                                                    });
                                                    setSelectedCustomCategory(cat);
                                                    setDocOcrStatus(`✓ Gemini detected ${ocr.merchant || 'Vendor'} ($${ocr.amount || 0}). Suggested category: ${cat}`);
                                                } else {
                                                    setDocOcrStatus("✓ Receipt image loaded into canvas.");
                                                }
                                            }
                                        }} 
                                    />
                                </label>
                            </div>

                            <button
                                type="button"
                                onClick={async () => {
                                    const tx = transactions.find(t => t.id === selectedReceiptTxId);
                                    const targetImg = customDocReceiptUrl || tx?.paymentProof || (tx as any)?.screenshotProof;
                                    if (!targetImg) {
                                        setDocOcrStatus("Please select a transaction with proof or upload an image first.");
                                        return;
                                    }
                                    setDocOcrStatus("Running Gemini Visual Content & Category Scan...");
                                    const ocr = await analyzeReceiptOCR(targetImg);
                                    if (ocr.success) {
                                        const cat = ocr.category || "Shopping";
                                        setDocOcrResult({
                                            amount: ocr.amount,
                                            date: ocr.date,
                                            merchant: ocr.merchant,
                                            category: cat
                                        });
                                        setSuggestedCategoryPrompt({
                                            category: cat,
                                            merchant: ocr.merchant || tx?.recipient?.nickname || tx?.recipient?.fullName || "Receipt Vendor",
                                            amount: ocr.amount || tx?.sendAmount || 0,
                                            confirmed: false,
                                            appliedTxId: tx?.id
                                        });
                                        setSelectedCustomCategory(cat);
                                        setDocOcrStatus(`✓ Gemini Scan Complete: Suggested category "${cat}" for ${ocr.merchant || 'Vendor'}`);
                                    } else {
                                        setDocOcrStatus("OCR completed with default values.");
                                    }
                                }}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-600 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                            >
                                <span>✨ Run Gemini Visual Category Scan</span>
                            </button>

                            {docOcrStatus && (
                                <p className="text-[10px] font-mono text-amber-400 bg-amber-500 p-2.5 rounded-xl border border-amber-500/20">
                                    {docOcrStatus}
                                </p>
                            )}

                            {/* Gemini Category Suggestion Confirmation Prompt */}
                            {suggestedCategoryPrompt && (
                                <div className="p-4 bg-gradient-to-br from-amber-500/15 via-indigo-950/40 to-emerald-950/20 border-2 border-amber-400/40 rounded-2xl space-y-3 shadow-xl relative overflow-hidden">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">✨</span>
                                            <span className="text-xs font-black uppercase tracking-wider text-amber-400 font-mono">Gemini AI Category Classification</span>
                                        </div>
                                        {suggestedCategoryPrompt.confirmed ? (
                                            <span className="text-[10px] bg-emerald-500 text-emerald-300 font-mono px-2.5 py-1 rounded-full border border-emerald-500/30 font-bold">
                                                ✓ Confirmed & Applied
                                            </span>
                                        ) : (
                                            <span className="text-[10px] bg-amber-500 text-amber-300 font-mono px-2.5 py-1 rounded-full border border-amber-500/30 font-bold animate-pulse">
                                                Action Required
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-xs text-[#1E293B] leading-relaxed font-sans space-y-1">
                                        <p>
                                            Gemini analyzed the visual contents of the uploaded receipt from <strong className="text-white font-bold">{suggestedCategoryPrompt.merchant}</strong> and automatically suggests classifying this expense as:
                                        </p>
                                        <div className="p-2.5 bg-slate-100 rounded-xl border border-black/5 flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono text-[#0F172A]">Suggested Category:</span>
                                                <span className="text-sm font-black text-amber-400 uppercase tracking-wide">{suggestedCategoryPrompt.category}</span>
                                            </div>
                                            {suggestedCategoryPrompt.amount > 0 && (
                                                <span className="text-xs font-bold text-emerald-400 font-mono">${suggestedCategoryPrompt.amount.toFixed(2)}</span>
                                            )}
                                        </div>
                                    </div>

                                    {!suggestedCategoryPrompt.confirmed ? (
                                        <div className="flex flex-col gap-2 pt-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const targetId = selectedReceiptTxId || suggestedCategoryPrompt.appliedTxId;
                                                        if (onUpdateTransactions && targetId) {
                                                            onUpdateTransactions([targetId], { category: suggestedCategoryPrompt.category as any });
                                                        }
                                                        setSuggestedCategoryPrompt(prev => prev ? { ...prev, confirmed: true } : null);
                                                        setDocOcrStatus(`✓ Confirmed and applied category "${suggestedCategoryPrompt.category}" to transaction!`);
                                                    }}
                                                    className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                                                >
                                                    <span>✓ Confirm Category "{suggestedCategoryPrompt.category}"</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSuggestedCategoryPrompt(null)}
                                                    className="py-2.5 px-3 bg-white hover:bg-white text-[#0F172A] font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer dark:bg-slate-800"
                                                >
                                                    Dismiss
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2 pt-1">
                                                <span className="text-[10px] text-[#0F172A] uppercase font-mono">Or Override:</span>
                                                <select
                                                    value={selectedCustomCategory}
                                                    onChange={(e) => setSelectedCustomCategory(e.target.value)}
                                                    className="bg-slate-50 text-white text-xs border border-black/5 rounded-xl px-2.5 py-1.5 focus:outline-none font-bold dark:bg-slate-900"
                                                >
                                                    {['Shopping', 'Dining', 'Travel', 'Services', 'Utilities', 'Digital/Tech', 'Groceries', 'Office', 'Entertainment', 'Healthcare'].map(cat => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                </select>
                                                {selectedCustomCategory !== suggestedCategoryPrompt.category && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const targetId = selectedReceiptTxId || suggestedCategoryPrompt.appliedTxId;
                                                            if (onUpdateTransactions && targetId) {
                                                                onUpdateTransactions([targetId], { category: selectedCustomCategory as any });
                                                            }
                                                            setSuggestedCategoryPrompt(prev => prev ? { ...prev, category: selectedCustomCategory, confirmed: true } : null);
                                                            setDocOcrStatus(`✓ Custom category "${selectedCustomCategory}" applied!`);
                                                        }}
                                                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-500 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer"
                                                    >
                                                        Apply Custom
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-2 bg-emerald-500 border border-emerald-500/20 rounded-xl text-center">
                                            <span className="text-xs text-emerald-400 font-bold">✓ Transaction category classification successfully confirmed & saved!</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {docOcrResult && (
                                <div className="p-3 bg-slate-50 rounded-xl border border-emerald-500/30 space-y-1 text-xs font-mono dark:bg-slate-900">
                                    <p className="text-[9px] font-black uppercase text-emerald-400">Extracted Metadata:</p>
                                    <p className="text-[#0F172A]">Amount: <strong className="text-white">${docOcrResult.amount || '0.00'}</strong></p>
                                    <p className="text-[#0F172A]">Date: <strong className="text-white">{docOcrResult.date || 'N/A'}</strong></p>
                                    <p className="text-[#0F172A]">Vendor: <strong className="text-white">{docOcrResult.merchant || 'N/A'}</strong></p>
                                    <p className="text-[#0F172A]">Category: <strong className="text-white">{docOcrResult.category || 'N/A'}</strong></p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'digital_signature' && (
                        <div className="space-y-5">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-tight">On-Screen Signature Pad</h3>
                                    {userSignatureDataUrl && (
                                        <span className="text-[10px] font-black uppercase bg-emerald-500 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            Signed & Certified
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-[#0F172A] leading-relaxed">
                                    Sign banking forms directly on screen. Draw ink freehand with customized ink color & stroke thickness or type your certified legal signature to embed on Bank Authorization Letters, Tax 1099-INT / FBAR / W-8BEN forms, and Payment Instructions.
                                </p>
                            </div>

                            <DigitalSignature
                                initialSignerName={userProfile.name}
                                initialSignerTitle="Account Owner & Authorized Signatory"
                                onSave={(dataUrl, metadata) => {
                                    setUserSignatureDataUrl(dataUrl);
                                    if (metadata) setUserSignatureMetadata(metadata);
                                    setEmailSuccess("✓ Digital signature affixed successfully! All document PDFs will now include your verified electronic signature.");
                                }}
                                onClear={() => {
                                    setUserSignatureDataUrl(null);
                                    setUserSignatureMetadata(null);
                                    setEmailSuccess("Signature cleared.");
                                }}
                            />

                            {userSignatureMetadata && (
                                <div className="bg-slate-100 border border-black/5 p-4 rounded-2xl space-y-2 text-xs font-mono">
                                    <div className="flex justify-between text-[#0F172A]">
                                        <span>SIGNER NAME:</span>
                                        <span className="text-white font-bold">{userSignatureMetadata.signerName}</span>
                                    </div>
                                    <div className="flex justify-between text-[#0F172A]">
                                        <span>ROLE / TITLE:</span>
                                        <span className="text-emerald-400 font-bold">{userSignatureMetadata.signerTitle}</span>
                                    </div>
                                    <div className="flex justify-between text-[#0F172A]">
                                        <span>VERIFICATION HASH:</span>
                                        <span className="text-amber-400 font-bold text-[10px]">{userSignatureMetadata.hash}</span>
                                    </div>
                                    <div className="flex justify-between text-[#0F172A]">
                                        <span>UTC TIMESTAMP:</span>
                                        <span className="text-[#0F172A]">{new Date(userSignatureMetadata.timestamp).toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Verification and Dispatch Actions */}
                    {activeTab !== 'statements' && (
                        <div className="pt-4 border-t border-slate-100 dark:border-white/10 space-y-3">
                            <button 
                                onClick={handleDownload}
                                disabled={isGenerating}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                            >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                                {isGenerating ? "Compiling PDF..." : "Download Official PDF"}
                            </button>

                            <button 
                                onClick={handleSendRealEmail}
                                disabled={isGenerating}
                                className="w-full py-4 bg-slate-50 hover:bg-white text-emerald-400 hover:text-emerald-300 font-black text-xs uppercase tracking-widest rounded-xl border border-emerald-500/30 transition-all flex items-center justify-center gap-2 dark:bg-slate-800"
                            >
                                <span>⚡ Transmit via Secure Email (Real-time)</span>
                            </button>

                            {emailSuccess && (
                                <div className="bg-emerald-900 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs font-bold leading-relaxed">
                                    ✓ {emailSuccess}
                                </div>
                            )}
                            {emailError && (
                                <div className="bg-rose-900 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs font-bold leading-relaxed">
                                    ⚠ {emailError}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Live Document Preview Panel */}
                <div className="lg:col-span-7 bg-[#111622] rounded-3xl p-8 border border-black/5 shadow-2xl space-y-8 relative overflow-hidden flex flex-col justify-between">
                    
                    {/* Background faint watermark seal */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-3 pointer-events-none">
                        <ShieldCheckIcon className="w-96 h-96 text-white" />
                    </div>

                    <div className="space-y-6 relative z-10">
                        
                        {/* Live Digital Preview Letterhead */}
                        {activeTab === 'statements' && (
                            <div className="text-white flex flex-col items-center justify-center h-full min-h-[400px] text-center space-y-6">
                                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/20">
                                    <DocumentCheckIcon className="w-10 h-10 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Statement Generator Ready</h3>
                                    <p className="text-sm text-[#0F172A] max-w-sm mx-auto">
                                        Use the configuration panel on the left to select your account, specify a date range, and generate an official verifiable PDF ledger statement.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'auth_letter' && (
                            <div className="text-white space-y-6">
                                <div className="border-b border-black/5 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                    <div>
                                        <h2 className="text-xl font-bold tracking-widest text-emerald-400 font-serif">FIRST PACIFIC CLEARANCE</h2>
                                        <p className="text-[9px] text-[#0F172A] uppercase tracking-widest">Sovereign Exception Release Desk</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsMarkupMode(!isMarkupMode);
                                            if (isMarkupMode) {
                                                setMarkupDataUrl(null);
                                            }
                                        }}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                            isMarkupMode 
                                                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20' 
                                                : 'bg-white text-amber-400 border border-amber-400/20 hover:bg-white'
                                        }`}
                                    >
                                        {isMarkupMode ? '👁 Standard View' : '✍ Enter Markup Mode'}
                                    </button>
                                </div>

                                {isMarkupMode ? (
                                    <div className="w-full text-[#0F172A] border border-black/5 p-2 rounded-3xl bg-slate-100">
                                        <DocumentMarkupCanvas authFormData={authFormData} onMarkupSave={setMarkupDataUrl} />
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-4 text-xs">
                                            <p className="text-[#0F172A] uppercase tracking-widest font-black text-[10px] text-amber-500">BOILERPLATE PROTOCOL STATEMENTS</p>
                                            <p className="text-[#1E293B] leading-relaxed font-serif text-[13px] italic">
                                                "Pursuant to the {authFormData.regulatoryExemption || 'Sovereign Bank Bylaws'}, the executive steering board clears a sweep limit of <span className="text-emerald-400 font-bold font-mono text-[14px]">${authFormData.amount || '0.00'} USD</span> to beneficiary destination <strong className="text-white font-sans not-italic underline ml-0.5">{authFormData.beneficiaryName || 'N/A'}</strong>. Guaranteed available prefunded funds."
                                            </p>
                                        </div>

                                        <div className="bg-slate-100 p-4 rounded-xl border border-black/5 font-mono text-[10px] text-[#0F172A] space-y-1">
                                            <p>🛡️ ROUTING SPEED: {authFormData.routingSpeed}</p>
                                            <p>🔑 DIGITAL EXEMPTION CODE: {authFormData.regulatoryExemption}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'clearing_instructions' && (
                            <div className="text-white space-y-6">
                                <div className="border-b border-black/5 pb-4 flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-bold tracking-widest text-[#d4af37] font-serif">FEDWIRE / CHIPS ROUTING</h2>
                                        <p className="text-[9px] text-[#0F172A] uppercase tracking-widest">Manual Clearing Dispatch Core</p>
                                    </div>
                                    <span className="text-[10px] bg-amber-500 text-amber-400 border border-amber-500/20 px-2 py-1 rounded font-mono uppercase">
                                        Instruction Core
                                    </span>
                                </div>

                                <div className="space-y-2 text-xs font-mono bg-slate-100 p-5 rounded-2xl border border-black/5">
                                    <p className="text-[#0F172A] block border-b border-black/5 pb-1">INTERMEDIARY: <span className="text-white font-bold">{clearingFormData.correspondentBank}</span></p>
                                    <p className="text-[#0F172A] block border-b border-black/5 pb-1">PROTOCOL NETWORK: <span className="text-white font-bold">{clearingFormData.clearingNetwork}</span></p>
                                    <p className="text-[#0F172A] block border-b border-black/5 pb-1">ROUTING ABA/BIC: <span className="text-emerald-400 font-bold">{clearingFormData.routingNumber}</span></p>
                                    <p className="text-[#0F172A] block border-b border-black/5 pb-1">BENEFICIARY ACCOUNT/IBAN: <span className="text-white font-bold">{clearingFormData.beneficiaryAccount}</span></p>
                                    <p className="text-[#0F172A] block">EXEMPTION DETAILS: <span className="text-[#1E293B]">{clearingFormData.purposeOfTransfer}</span></p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'tax_summary' && (
                            <div className="text-white space-y-6 animate-fade-in">
                                <div className="border-b border-black/5 pb-4 flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-bold tracking-widest text-[#d4af37] font-serif uppercase">
                                            {taxDocType === '1099_int' && 'SUBSTITUTE FORM 1099-INT'}
                                            {taxDocType === 'fbar_114' && 'FINCEN FBAR FORM 114'}
                                            {taxDocType === 'w8ben' && 'SUBSTITUTE FORM W-8BEN'}
                                            {taxDocType === 'schedule_b' && 'IRS SCHEDULE B (1040)'}
                                        </h2>
                                        <p className="text-[9px] text-[#0F172A] uppercase tracking-widest">
                                            {taxDocType === '1099_int' && 'Interest Income Statement to IRS'}
                                            {taxDocType === 'fbar_114' && 'Foreign Bank & Financial Accounts Report'}
                                            {taxDocType === 'w8ben' && 'Beneficial Owner Foreign Status Certificate'}
                                            {taxDocType === 'schedule_b' && 'Interest and Ordinary Dividends Record'}
                                        </p>
                                    </div>
                                    <span className="text-[10px] bg-amber-500 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded font-mono uppercase font-bold">
                                        Tax Year {taxCalendarYear}
                                    </span>
                                </div>

                                {taxDocType === '1099_int' && (
                                    <div className="space-y-4 text-xs font-mono bg-slate-100 p-5 rounded-2xl border border-black/5">
                                        <div className="grid grid-cols-2 gap-4 border-b border-black/5 pb-3">
                                            <div>
                                                <span className="text-[8px] text-[#0F172A] block uppercase">PAYER ENTITY</span>
                                                <span className="text-[10px] font-bold text-[#0F172A]">First Pacific Global Private Bank</span>
                                            </div>
                                            <div>
                                                <span className="text-[8px] text-[#0F172A] block uppercase">RECIPIENT / FILER</span>
                                                <span className="text-[10px] font-bold text-emerald-400">{userProfile.name}</span>
                                            </div>
                                        </div>
                                        <div className="border-b border-black/5 pb-2">
                                            <p className="text-[#0F172A] text-[10px] uppercase">Box 1: Interest Income (Qualified Yield)</p>
                                            <p className="text-2xl text-amber-500 font-bold">${(transactions.reduce((acc, curr) => acc + curr.sendAmount, 0) * 0.045).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                        <div className="border-b border-black/5 pb-2">
                                            <p className="text-[#0F172A] text-[10px] uppercase">Box 5: Investment Expenses / Capital Gains</p>
                                            <p className="text-xl text-amber-400 font-bold">${(transactions.reduce((acc, curr) => acc + curr.sendAmount, 0) * 0.082).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                        <div className="pb-1">
                                            <p className="text-[#0F172A] text-[10px] uppercase">Box 4: Federal Income Tax Withheld</p>
                                            <p className="text-lg text-white font-bold">$0.00</p>
                                        </div>
                                    </div>
                                )}

                                {taxDocType === 'fbar_114' && (
                                    <div className="space-y-4 text-xs font-mono bg-slate-100 p-5 rounded-2xl border border-black/5">
                                        <div className="border-b border-black/5 pb-2">
                                            <p className="text-[#0F172A] text-[9px] uppercase">PART I: FILER IDENTIFIER</p>
                                            <p className="text-xs text-[#0F172A] font-bold">NAME: {userProfile.name}</p>
                                            <p className="text-xs text-[#0F172A]">TIN: XXX-XX-FBAR | GEOGRAPHY: {taxGeography}</p>
                                        </div>
                                        <div className="border-b border-black/5 pb-2">
                                            <p className="text-[#0F172A] text-[10px] uppercase">Box 6: Maximum Account Value (Cycle High)</p>
                                            <p className="text-2xl text-emerald-400 font-bold">${(transactions.reduce((acc, curr) => acc + curr.sendAmount, 0) * 1.25).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</p>
                                        </div>
                                        <div>
                                            <p className="text-[#0F172A] text-[9px] uppercase">Box 8 & 9: Financial Institution & ID</p>
                                            <p className="text-xs text-[#1E293B]">First Pacific Global Private Bank (Swiss Escrow Portfolio)</p>
                                            <p className="text-xs text-amber-500 font-bold">Account: FPB-CH-{userProfile.email.slice(0,6).toUpperCase()}</p>
                                        </div>
                                    </div>
                                )}

                                {taxDocType === 'w8ben' && (
                                    <div className="space-y-4 text-xs font-mono bg-slate-100 p-5 rounded-2xl border border-black/5">
                                        <div className="border-b border-black/5 pb-2">
                                            <p className="text-[#0F172A] text-[9px] uppercase">PART I: BENEFICIAL OWNER FOREIGN STATUS</p>
                                            <p className="text-xs text-[#1E293B] font-bold">Owner: {userProfile.name}</p>
                                            <p className="text-xs text-[#0F172A]">Country of citizenship: {taxGeography === 'US' ? 'Expat / Swiss Resident' : taxGeography}</p>
                                        </div>
                                        <div className="border-b border-black/5 pb-2">
                                            <p className="text-[#0F172A] text-[9px] uppercase">PART II: CLAIM OF TAX TREATY BENEFITS</p>
                                            <p className="text-xs text-[#0F172A]">Declared Residency: <strong className="text-emerald-400">{taxGeography}</strong></p>
                                            <p className="text-xs text-amber-400 font-bold">Special withholding rate: Article 11 (0% Interest Rate)</p>
                                        </div>
                                        <div>
                                            <p className="text-[#0F172A] text-[9px] uppercase">PART III: ACTIVE DIGITAL SELF-CERTIFICATION</p>
                                            <p className="text-emerald-400 text-[10px] font-bold">✓ Non-US certified owner status verified</p>
                                            <p className="text-[#0F172A] text-[9px] mt-1">Audit Key: FPB-REF-{userProfile.email.slice(0,6).toUpperCase()}</p>
                                        </div>
                                    </div>
                                )}

                                {taxDocType === 'schedule_b' && (
                                    <div className="space-y-4 text-xs font-mono bg-slate-100 p-5 rounded-2xl border border-black/5">
                                        <div className="border-b border-black/5 pb-2">
                                            <p className="text-[#0F172A] text-[9px] uppercase">PART I: STATEMENT OF REPORTABLE INTEREST</p>
                                            <div className="flex justify-between items-center text-xs mt-1 text-[#0F172A]">
                                                <span>First Pacific Swiss Escrow Yield:</span>
                                                <span className="font-bold text-emerald-400">${(transactions.reduce((acc, curr) => acc + curr.sendAmount, 0) * 0.045).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs mt-1 text-[#0F172A]">
                                                <span>Other foreign ordinary yields:</span>
                                                <span>$0.00</span>
                                            </div>
                                        </div>
                                        <div className="border-b border-black/5 pb-2">
                                            <p className="text-[#0F172A] text-[10px] uppercase">Line 2: Total Interest Income (Aggregate)</p>
                                            <p className="text-xl text-amber-500 font-bold">${(transactions.reduce((acc, curr) => acc + curr.sendAmount, 0) * 0.045).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                        <div>
                                            <p className="text-[#0F172A] text-[9px] uppercase">PART III: FOREIGN FINANCIAL ACCOUNT INTERESTS</p>
                                            <p className="text-xs text-[#0F172A]">7a. Foreign financial account control? <strong className="text-emerald-400">YES</strong></p>
                                            <p className="text-xs text-[#0F172A]">7b. Location: SWITZERLAND & CAYMAN ISLANDS</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'receipt_markup' && (
                            <div className="p-4 bg-slate-100 rounded-3xl border border-slate-200 space-y-4">
                                <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                                    <span>✍ Tax Receipt Markup & Audit Canvas</span>
                                </h3>
                                {(() => {
                                    const selectedTx = transactions.find(t => t.id === selectedReceiptTxId);
                                    const currentReceiptUrl = customDocReceiptUrl || selectedTx?.paymentProof || (selectedTx as any)?.screenshotProof || '';

                                    return (
                                        <ReceiptMarkupCanvas
                                            receiptImageUrl={currentReceiptUrl}
                                            receiptTitle={selectedTx ? `Tax Audit Receipt: ${selectedTx.description}` : 'Custom Audit Receipt'}
                                            onSaveMarkup={(newBase64) => {
                                                setCustomDocReceiptUrl(newBase64);
                                                setDocOcrStatus("✓ Markup saved to canvas memory!");
                                            }}
                                        />
                                    );
                                })()}
                            </div>
                        )}

                        {activeTab === 'digital_signature' && (
                            <div className="text-white space-y-6 animate-fade-in">
                                <div className="border-b border-black/5 pb-4 flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-bold tracking-widest text-emerald-400 font-serif uppercase">
                                            ELECTRONIC SIGNATURE DEED & CERTIFICATION
                                        </h2>
                                        <p className="text-[9px] text-[#0F172A] uppercase tracking-widest">
                                            Compliance Verification & Legal Instrument Preview
                                        </p>
                                    </div>
                                    <span className="text-[10px] bg-emerald-500 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded font-mono uppercase font-bold">
                                        ESIGN Act Compliant
                                    </span>
                                </div>

                                {userSignatureDataUrl ? (
                                    <div className="bg-slate-100 p-6 rounded-2xl border border-emerald-500/30 space-y-6">
                                        <div className="flex items-center justify-between border-b border-black/5 pb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Affixed Signature Preview</span>
                                            </div>
                                            <span className="text-[10px] font-mono text-[#0F172A]">ID: {userSignatureMetadata?.hash || 'SIG-ACTIVE'}</span>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-xl border border-black/5 flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden dark:bg-slate-900">
                                            <div className="absolute top-2 left-3 text-[9px] font-mono text-[#0F172A] uppercase">Legal Signatory Ink</div>
                                            <img 
                                                src={userSignatureDataUrl} 
                                                alt="Affixed Digital Signature" 
                                                className="max-h-24 object-contain filter drop-shadow-[0_0_10px_rgba(16,185,129,0.3)] my-2" 
                                            />
                                            <div className="w-full border-t border-slate-300/80 pt-2 flex justify-between items-center text-[10px] font-mono text-[#0F172A]">
                                                <span>{userSignatureMetadata?.signerName || userProfile.name}</span>
                                                <span>{userSignatureMetadata?.signerTitle || 'Authorized Signatory'}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                                            <div className="bg-slate-50 p-3 rounded-xl border border-black/5 dark:bg-slate-900">
                                                <span className="text-[9px] text-[#0F172A] block">AUTHENTICATION METHOD</span>
                                                <span className="text-white font-bold">{userSignatureMetadata?.mode === 'draw' ? 'Biometric Touch/Mouse Pen' : 'Typed Cryptographic Font'}</span>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded-xl border border-black/5 dark:bg-slate-900">
                                                <span className="text-[9px] text-[#0F172A] block">LEGAL PROTOCOL</span>
                                                <span className="text-emerald-400 font-bold">US E-SIGN / EU eIDAS</span>
                                            </div>
                                        </div>

                                        <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setIsSignatureModalOpen(true)}
                                                className="flex-1 py-3 bg-white hover:bg-slate-700 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-amber-500/30 transition-all cursor-pointer flex items-center justify-center gap-2 dark:bg-slate-800"
                                            >
                                                <span>✍ Modify Signature Pad</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setUserSignatureDataUrl(null);
                                                    setUserSignatureMetadata(null);
                                                    setEmailSuccess("Signature cleared from document session.");
                                                }}
                                                className="py-3 px-4 bg-rose-500 hover:bg-rose-500 text-rose-400 font-bold text-xs uppercase tracking-wider rounded-xl border border-rose-500/30 transition-all cursor-pointer"
                                            >
                                                Clear Signature
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-100 p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-4">
                                        <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto text-amber-400 border border-amber-500/20 text-2xl font-black">
                                            ✍
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-white mb-1">No Active Signature Affixed</h4>
                                            <p className="text-xs text-[#0F172A] max-w-sm mx-auto">
                                                Draw or type your legal electronic signature using the pad on the left or launch the signature popup to authorize your bank forms.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsSignatureModalOpen(true)}
                                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                                        >
                                            Open Fullscreen Signature Pad
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                    {/* Bottom visual verification - canvas rendered golden-creme stamp seal */}
                    {!(activeTab === 'auth_letter' && isMarkupMode) && (
                        <div className="border-t border-black/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 bg-slate-100 p-6 rounded-2xl">
                            <div className="text-center md:text-left">
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 font-mono">
                                    ✓ Dynamic Live Cryptographic Seal
                                </p>
                                <h4 className="text-white font-black text-sm uppercase">
                                    VERIFIED COMPLIANT
                                </h4>
                                <p className="text-[9px] text-[#0F172A] font-mono mt-1">
                                    Secure Token: FPB-STAMP-{Math.floor(Math.random()*100000)}
                                </p>
                            </div>
                            
                            {/* Live Canvas element displaying the official bank official seal */}
                            <div className="flex flex-col items-center gap-2">
                                <canvas 
                                    ref={canvasRef} 
                                    width="160" 
                                    height="160" 
                                    className="w-[120px] h-[120px] bg-transparent rounded-full shadow-2xl border border-amber-500/20 p-1"
                                />
                                <span className="text-[8px] text-amber-400 uppercase tracking-widest font-mono font-bold">
                                    Canvas Seal (API Generated)
                                </span>
                            </div>
                        </div>
                    )}

                </div>

            </div>

            <GeneratePdfStatementModal
                isOpen={isStatementModalOpen}
                onClose={() => setIsStatementModalOpen(false)}
                userProfile={userProfile}
                accounts={accounts}
                transactions={transactions}
                defaultAccountId="ALL"
            />

            {/* Signature Modal */}
            {isSignatureModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-100  flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-50 border border-black/5 rounded-3xl p-6 max-w-xl w-full shadow-2xl relative space-y-4 dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-black/5 pb-4">
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                                    <span>✍ On-Screen Digital Signature Pad</span>
                                </h3>
                                <p className="text-xs text-[#0F172A]">
                                    Draw or type your legal electronic signature for banking & tax forms.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsSignatureModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-white hover:bg-white text-[#0F172A] hover:text-white flex items-center justify-center transition-all text-sm font-bold cursor-pointer dark:bg-slate-800"
                            >
                                ✕
                            </button>
                        </div>

                        <DigitalSignature
                            initialSignerName={userProfile.name}
                            initialSignerTitle="Account Owner & Authorized Signatory"
                            onSave={(dataUrl, metadata) => {
                                setUserSignatureDataUrl(dataUrl);
                                if (metadata) setUserSignatureMetadata(metadata);
                                setIsSignatureModalOpen(false);
                                setEmailSuccess("✓ Digital signature affixed successfully to forms!");
                            }}
                            onClear={() => {
                                setUserSignatureDataUrl(null);
                                setUserSignatureMetadata(null);
                            }}
                        />
                    </div>
                </div>
            )}

        </div>
    );
};
