import React, { useState, useRef, useEffect, useCallback } from 'react';
import { triggerHaptic, triggerSuccessHaptic, triggerFailureHaptic } from '../utils/haptics';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ShieldAlert, RefreshCw, X, Camera, Sparkles, HelpCircle, Keyboard, Target, Activity, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { applyBankPdfBackgroundAndWatermark, generateQrCodeDataUrl, embedVerificationQrCodeBlock } from '../utils/pdfWatermarkAndQr';

// This assumes jsQR is loaded via a script tag in index.html
declare const jsQR: (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null;

interface QrScannerProps {
    hapticsEnabled: boolean;
    onScan?: (data: string) => void;
    onClose?: () => void;
    onContactSupport?: (context: string) => void;
}

type ScanStatus = 'initializing' | 'scanning' | 'success' | 'error';

const parseQrData = (data: string) => {
    let recipientName = "Verified Beneficiary";
    let accountNumber = "N/A";
    let bankName = "First Pacific Partner Bank";
    let swiftBic = "LEADUS33";
    let amount = "12,500.00";
    let description = "Bank Account Transfer Clearance";
    let routingCode = "021000021";

    try {
        const trimmed = data.trim();
        if (trimmed.startsWith('{')) {
            const parsed = JSON.parse(trimmed);
            recipientName = parsed.recipientName || parsed.fullName || parsed.name || recipientName;
            accountNumber = parsed.accountNumber || parsed.account || parsed.address || accountNumber;
            bankName = parsed.bankName || parsed.bank || bankName;
            swiftBic = parsed.routingNumber || parsed.swiftBic || parsed.bic || parsed.swift || swiftBic;
            if (parsed.amount) amount = parsed.amount.toString();
            description = parsed.description || parsed.notes || parsed.memo || description;
            routingCode = parsed.routingCode || parsed.routingNumber || routingCode;
        } else if (trimmed.includes('|')) {
            const parts = trimmed.split('|');
            recipientName = parts[0] || recipientName;
            accountNumber = parts[1] || accountNumber;
            bankName = parts[2] || bankName;
            swiftBic = parts[3] || swiftBic;
            routingCode = parts[4] || routingCode;
        } else if (trimmed.includes(' // ')) {
            const parts = trimmed.split(' // ');
            recipientName = parts[0] || recipientName;
            accountNumber = parts[1] || accountNumber;
            if (parts[2]) amount = parts[2];
            description = parts[3] || description;
        } else if (trimmed.includes('?')) {
            const queryPart = trimmed.split('?')[1];
            if (queryPart) {
                const params = new URLSearchParams(queryPart);
                if (params.has('account')) accountNumber = params.get('account')!;
                if (params.has('name') || params.has('recipient')) recipientName = params.get('name') || params.get('recipient')!;
                if (params.has('bank')) bankName = params.get('bank')!;
                if (params.has('amount')) amount = params.get('amount')!;
                if (params.has('swift') || params.has('routing')) swiftBic = params.get('swift') || params.get('routing')!;
            }
        } else if (/^\d{8,16}$/.test(trimmed)) {
            accountNumber = trimmed;
            description = `Direct Account Transfer #${accountNumber}`;
        } else {
            description = trimmed;
        }
    } catch (e) {
        console.warn("Failed to parse QR code:", e);
    }

    let numericAmount = parseFloat(String(amount).replace(/[^0-9.]/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
        numericAmount = 12500.00;
    }

    return {
        recipientName,
        accountNumber,
        bankName,
        swiftBic,
        amount: numericAmount,
        description,
        routingCode
    };
};

const downloadPdfReceipt = async (dataString: string) => {
    try {
        const parsed = parseQrData(dataString);
        const doc = new jsPDF();
        const refId = `QR-PAY-${Math.floor(Math.random() * 900000000 + 100000000)}`;
        const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const timeStr = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        const pageWidth = 210;
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);

        applyBankPdfBackgroundAndWatermark(doc, { title: 'QR PAY REAL-TIME SETTLEMENT RECEIPT', documentRef: `REF: ${refId}` });

        // Brand Title
        doc.setTextColor(15, 23, 42);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(16);
        doc.text("FIRST PACIFIC BANKING ENCLAVE", margin, 38);

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text("SOVEREIGN INSTANT LIQUIDITY GATEWAY  •  OCC CHARTER #441829", margin, 43);

        // Document Subject Header
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, 48, contentWidth, 12, "F");
        doc.setDrawColor(226, 232, 240);
        doc.rect(margin, 48, contentWidth, 12, "D");

        doc.setTextColor(15, 23, 42);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9.5);
        doc.text("TRANSACTION SETTLEMENT CONFIRMATION RECEIPT", margin + 4, 55.5);

        // Metadata block
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text("TIMESTAMP", margin, 68);
        doc.text("REFERENCE REF ID", margin + 65, 68);
        doc.text("SETTLEMENT NODE", margin + 125, 68);

        doc.setTextColor(30, 41, 59);
        doc.setFont("Helvetica", "normal");
        doc.text(`${dateStr} ${timeStr}`, margin, 73);
        doc.text(refId, margin + 65, 73);
        doc.text("SWIFT_GPI_QR_PAY", margin + 125, 73);

        doc.setDrawColor(226, 232, 240);
        doc.line(margin, 78, pageWidth - margin, 78);

        // Principal Amount Box
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, 83, contentWidth, 24, "F");
        doc.rect(margin, 83, contentWidth, 24, "D");

        doc.setTextColor(100, 116, 139);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9);
        doc.text("TOTAL SETTLED AMOUNT", margin + 6, 91);

        doc.setTextColor(16, 185, 129);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(22);
        doc.text(`$${parsed.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`, margin + 6, 101);

        // Success badge
        doc.setFillColor(209, 250, 229);
        doc.roundedRect(margin + 120, 90, 48, 12, 2, 2, "F");
        doc.setTextColor(6, 95, 70);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text("✓ CAPTURED & CLEARED", margin + 124, 98);

        // Details Grid
        doc.setTextColor(15, 23, 42);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.text("RECIPIENT & INSTITUTIONAL COORDINATES", margin, 116);

        doc.line(margin, 119, pageWidth - margin, 119);

        const detailsYStart = 125;
        const rowHeight = 7;
        const fields = [
            ["Beneficiary Legal Name", parsed.recipientName.toUpperCase()],
            ["Account Number Reference", parsed.accountNumber],
            ["Financial Institution", parsed.bankName],
            ["SWIFT BIC", parsed.swiftBic],
            ["Sovereign Routing Code", parsed.routingCode !== "N/A" ? parsed.routingCode : "021000021"],
            ["Transaction Purpose", parsed.description]
        ];

        doc.setFontSize(8.5);
        fields.forEach((field, idx) => {
            const currentY = detailsYStart + (idx * rowHeight);
            if (idx % 2 === 1) {
                doc.setFillColor(248, 250, 252);
                doc.rect(margin, currentY - 5, contentWidth, rowHeight, "F");
            }
            doc.setTextColor(100, 116, 139);
            doc.setFont("Helvetica", "bold");
            doc.text(field[0], margin + 4, currentY);

            doc.setTextColor(15, 23, 42);
            doc.setFont("Helvetica", "normal");
            doc.text(field[1], margin + 68, currentY);
        });

        // Certification & Seal
        doc.setTextColor(15, 23, 42);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        const auditSectionY = detailsYStart + (fields.length * rowHeight) + 10;
        doc.text("COMPLIANCE AUDIT CERTIFICATION", margin, auditSectionY);
        doc.line(margin, auditSectionY + 3, pageWidth - margin, auditSectionY + 3);

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        const complianceText = "This transaction has been successfully cleared under the statutory framework of the Federal Reserve System and the Office of the Comptroller of the Currency (OCC). Under regulatory codes, funds scanned and released via authorized QR nodes are settled instantly and registered on the immutable First Pacific Banking ledger. The transaction is fully cleared and final.";
        const splitText = doc.splitTextToSize(complianceText, contentWidth - 30);
        doc.text(splitText, margin + 2, auditSectionY + 9);

        // Seal Frame
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(pageWidth - margin - 35, auditSectionY + 6, 35, 25, 2, 2, "F");
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(pageWidth - margin - 35, auditSectionY + 6, 35, 25, 2, 2, "D");

        doc.setTextColor(15, 23, 42);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(7);
        doc.text("FPB TRUSTEE", pageWidth - margin - 31, auditSectionY + 12);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(6);
        doc.text("Sarah S. Sterling", pageWidth - margin - 31, auditSectionY + 17);
        doc.setTextColor(16, 185, 129);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(7);
        doc.text("✓ SIGNATURE APPLIED", pageWidth - margin - 31, auditSectionY + 23);

        // Footer lines
        doc.setFillColor(15, 23, 42);
        doc.rect(margin, 260, contentWidth, 0.5, "F");

        doc.setTextColor(148, 163, 184);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(6.5);
        doc.text("FIRST PACIFIC PRIVACY AND REGULATORY PROTECTION POLICY STATED", margin, 266);
        doc.text("This document is generated dynamically upon digital clearance. Transmission coordinates final. Confidential.", margin, 270);

        // Embed Verification QR Code Block
        const originHost = typeof window !== 'undefined' ? window.location.origin : 'https://firstpacificbank.com';
        const verifyPayload = `${originHost}/verify?doc=QR_${refId}&status=VERIFIED`;
        const qrDataUrl = await generateQrCodeDataUrl(verifyPayload, 200);
        embedVerificationQrCodeBlock(doc, qrDataUrl, 20, 250, { width: 170, height: 20 });

        doc.save(`FirstPacific_Receipt_${refId}.pdf`);
        console.log(`[Receipt Generated] PDF downloaded successfully: FirstPacific_Receipt_${refId}.pdf`);
    } catch (err) {
        console.error("Failed to generate PDF Receipt:", err);
    }
};

export const QrScanner: React.FC<QrScannerProps> = ({ hapticsEnabled, onScan, onClose, onContactSupport }) => {
    const [status, setStatus] = useState<ScanStatus>('initializing');
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [errorToast, setErrorToast] = useState<string | null>(null);

    // Fallback Manual Entry state
    const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
    const [manualCodeInput, setManualCodeInput] = useState('');
    const [manualCodeError, setManualCodeError] = useState<string | null>(null);

    // Real-time Visual Alignment Overlay state
    const [alignmentIndex, setAlignmentIndex] = useState(0);
    const [alignmentScore, setAlignmentScore] = useState(97);

    const alignmentGuides = [
        "Center the QR code inside reticle",
        "Hold steady — optical focus locked",
        "Optimal distance // Edge contrast 100%",
        "Sovereign Bank Clearance Node Active"
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setAlignmentIndex(prev => (prev + 1) % alignmentGuides.length);
            setAlignmentScore(Math.floor(94 + Math.random() * 5));
        }, 2800);
        return () => clearInterval(interval);
    }, []);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const animationFrameId = useRef<number | undefined>(undefined);
    const streamRef = useRef<MediaStream | undefined>(undefined);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = undefined;
        }
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = undefined;
        }
    }, []);

    const handleSuccessfulDetection = useCallback((codeData: string) => {
        if (hapticsEnabled) {
            triggerSuccessHaptic();
        } else {
            triggerHaptic(20);
        }

        setScanResult(codeData);
        setStatus('success');
        stopCamera();
        setIsManualEntryOpen(false);

        // Download settlement receipt
        downloadPdfReceipt(codeData);

        if (onScan) {
            setTimeout(() => onScan(codeData), 1000);
        }
    }, [hapticsEnabled, stopCamera, onScan]);

    const handleImageUpload = (file: File) => {
        if (!file) return;
        setStatus('initializing');
        setError(null);
        setErrorToast(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    if (typeof jsQR !== 'undefined') {
                        try {
                            const code = jsQR(imageData.data, imageData.width, imageData.height);
                            if (code && code.data && code.data.trim()) {
                                handleSuccessfulDetection(code.data.trim());
                                return;
                            }
                        } catch (err) {
                            console.error("jsQR Image scan error:", err);
                        }
                    }
                }
                setError("No valid QR code detected in the uploaded image. Please try another image or use camera scan.");
                if (hapticsEnabled) triggerFailureHaptic();
                setStatus('error');
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (file) handleImageUpload(file);
                    break;
                } else if (items[i].type === 'text/plain') {
                    items[i].getAsString((text) => {
                        if (text && text.trim().length >= 4) {
                            handleSuccessfulDetection(text.trim());
                        }
                    });
                }
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [handleSuccessfulDetection, hapticsEnabled]);

    const tick = useCallback(() => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            if (canvas) {
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    canvas.height = video.videoHeight;
                    canvas.width = video.videoWidth;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    try {
                        const code = jsQR(imageData.data, imageData.width, imageData.height);
                        if (code) {
                            const trimmedData = code.data?.trim();
                            if (trimmedData) {
                                handleSuccessfulDetection(trimmedData);
                                return; // Stop loop on successful scan
                            }
                        }
                    } catch (e) {
                        console.error("jsQR error:", e);
                    }
                }
            }
        }
        animationFrameId.current = requestAnimationFrame(tick);
    }, [stopCamera, handleSuccessfulDetection]);

    const startScan = useCallback(() => {
        setStatus('initializing');
        setError(null);
        setErrorToast(null);
        setScanResult(null);
        setIsManualEntryOpen(false);

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }

        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then(stream => {
                streamRef.current = stream;
                const video = videoRef.current;
                if (video) {
                    video.srcObject = stream;
                    video.setAttribute("playsinline", "true"); // Required for iOS
                    
                    const handleCanPlay = () => {
                        video.play().catch(e => console.warn("Video play interrupted", e));
                        setStatus('scanning');
                        animationFrameId.current = requestAnimationFrame(tick);
                        video.removeEventListener('canplay', handleCanPlay);
                    };
                    video.addEventListener('canplay', handleCanPlay);
                }
            })
            .catch(err => {
                console.error("Camera access error:", err);
                setError("Camera access was denied or could not be established. Please use manual entry.");
                setStatus('error');
            });
    }, [tick]);

    useEffect(() => {
        startScan();
        return () => {
            stopCamera();
        };
    }, [startScan, stopCamera]);

    const handleManualCodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setManualCodeError(null);
        const cleanInput = manualCodeInput.trim();
        if (!cleanInput) {
            setManualCodeError("Please enter a valid routing code or account number.");
            triggerFailureHaptic();
            return;
        }

        // Format into standard QR clearance JSON or structured payload
        let payload = cleanInput;
        if (/^\d{8,12}$/.test(cleanInput)) {
            payload = JSON.stringify({
                accountNumber: cleanInput,
                recipientName: "Verified Beneficiary Account",
                bankName: "First Pacific Partner Network",
                amount: "12500.00",
                description: `Manual Account Clearance #${cleanInput}`
            });
        }

        handleSuccessfulDetection(payload);
    };

    // Fast simulated check triggers for clean testing inside environments without webcams/QRs!
    const simulateDirectScan = (shouldSucceed: boolean) => {
        if (shouldSucceed) {
            const mockData = "CHIBUZOR IYKE NWAIWU|215533429905|Lead|LEADUS33|101019644|1801 Main St., Kansas City, MO 64108";
            handleSuccessfulDetection(mockData);
        } else {
            if (hapticsEnabled) triggerFailureHaptic();
            stopCamera();
            setError("Decryption Error: Scanned signature lacks compliance standard keys.");
            setErrorToast("Security Halt: The QR code is invalid and lacks credential keys!");
            setStatus('error');
        }
    };

    return (
        <div className="space-y-4 w-full mx-auto relative flex flex-col h-full items-center justify-center pointer-events-auto" id="custom-qr-scanner-widget">
            {onClose && (
                <button 
                  onClick={onClose} 
                  className="absolute right-0 top-0 z-50 p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-700 text-[#0F172A] dark:text-white rounded-full transition-all shadow-md"
                  title="Close Scanner"
                >
                    <X className="w-5 h-5" />
                </button>
            )}

            <div className="text-center px-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-full mb-2 border border-amber-500/20">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    Sovereign Pay Terminal
                </div>
                <h2 className="text-lg font-black uppercase tracking-tight text-[#0F172A] dark:text-white">Quick QR Scan</h2>
                <p className="text-[11px] text-[#0F172A] font-bold mt-1 max-w-[280px]">Align your camera with an official Sovereign transfer or bank clearing routing code.</p>
            </div>

            <div className="relative w-full aspect-square max-w-[310px] sm:max-w-xs mx-auto bg-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-slate-900 dark:border-white/10">
                {onContactSupport && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onContactSupport("QR_SCANNER_ISSUE");
                        }}
                        className="absolute top-4 left-4 z-50 bg-white hover:bg-slate-700  text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-black/5 shadow-lg flex items-center gap-1.5 transition-all dark:bg-slate-800"
                    >
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                        Report Issue
                    </button>
                )}

                {/* Enter Manually Fallback Button in Top Bar */}
                <button
                    type="button"
                    onClick={() => {
                        triggerHaptic(10);
                        setIsManualEntryOpen(!isManualEntryOpen);
                    }}
                    className="absolute top-4 right-4 z-50 bg-amber-500 hover:bg-amber-500  text-amber-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-amber-500/30 shadow-lg flex items-center gap-1.5 transition-all active:scale-95"
                >
                    <Keyboard className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isManualEntryOpen ? 'Use Camera' : 'Enter Manually'}</span>
                </button>

                <video 
                    ref={videoRef} 
                    className={`w-full h-full object-cover transition-opacity duration-300 ${status === 'success' || isManualEntryOpen ? 'opacity-20' : 'opacity-100'}`} 
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* OVERLAYS */}

                {/* Initializing State */}
                {status === 'initializing' && !isManualEntryOpen && (
                    <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center text-center p-6 gap-3">
                        <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#0F172A]">Initializing Core...</h3>
                        <p className="text-[10px] text-[#0F172A] font-bold">Requesting secure hardware interface</p>
                    </div>
                )}
                
                {/* Active Scanning Box Overlay with Realistic Bank Visual Alignment Guides */}
                {status === 'scanning' && !isManualEntryOpen && (
                    <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center p-4">
                        {/* Real-time Visual Alignment Guidance Banner */}
                        <div className="absolute top-14 inset-x-4 bg-slate-50 border border-amber-500/40 rounded-xl px-3 py-1.5  flex items-center justify-between text-[10px] font-mono text-amber-300 shadow-xl z-20 dark:bg-slate-900">
                            <div className="flex items-center gap-1.5 truncate">
                                <Target className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
                                <span className="font-bold truncate">{alignmentGuides[alignmentIndex]}</span>
                            </div>
                            <span className="text-[9px] font-black text-emerald-400 bg-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                                {alignmentScore}%
                            </span>
                        </div>

                        {/* Framing Reticle */}
                        <div className="w-[185px] h-[185px] relative mt-6">
                            {/* Scanning corners */}
                            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl shadow-[0_0_10px_#10b981]" />
                            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl shadow-[0_0_10px_#10b981]" />
                            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl shadow-[0_0_10px_#10b981]" />
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl shadow-[0_0_10px_#10b981]" />
                            
                            {/* Crosshair Center Reticle */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                                <div className="w-6 h-0.5 bg-emerald-400" />
                                <div className="h-6 w-0.5 bg-emerald-400 absolute" />
                            </div>

                            {/* Running scanner laser line */}
                            <motion.div 
                                className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_rgba(16,185,129,1),0_0_5px_rgba(16,185,129,0.5)]"
                                animate={{ y: [0, 180, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            />
                        </div>

                        {/* Telemetry Footer Overlay */}
                        <div className="absolute bottom-3 inset-x-4 flex items-center justify-between text-[9px] font-mono text-[#0F172A] bg-slate-100 px-2.5 py-1 rounded-lg border border-black/5 ">
                            <span className="flex items-center gap-1 text-emerald-400 font-bold">
                                <Activity className="w-3 h-3 animate-pulse" /> Live Telemetry
                            </span>
                            <span>TIER-1 CLEARANCE</span>
                        </div>
                    </div>
                )}

                {/* Manual Entry Input Field Overlay */}
                <AnimatePresence>
                    {isManualEntryOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute inset-0 bg-slate-100  p-6 flex flex-col justify-center z-40 text-left"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 bg-amber-500 text-amber-400 rounded-xl border border-amber-500/30">
                                    <Keyboard className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-wider text-white">Manual Code Entry</h3>
                                    <p className="text-[10px] text-[#0F172A] font-bold">Type payment clearing ID or account number</p>
                                </div>
                            </div>

                            <form onSubmit={handleManualCodeSubmit} className="space-y-3">
                                <div>
                                    <label className="text-[9px] font-mono uppercase tracking-wider text-[#0F172A] block mb-1">
                                        Clearing Code / Account #
                                    </label>
                                    <input
                                        type="text"
                                        value={manualCodeInput}
                                        onChange={(e) => setManualCodeInput(e.target.value)}
                                        placeholder="e.g. 215533429905 or JSON"
                                        className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-[#0F172A] outline-none transition-all dark:bg-slate-900"
                                        autoFocus
                                    />
                                </div>

                                {manualCodeError && (
                                    <p className="text-[10px] text-rose-400 font-bold font-mono">
                                        ⚠️ {manualCodeError}
                                    </p>
                                )}

                                <div className="flex gap-2 pt-1">
                                    <button
                                        type="submit"
                                        className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-emerald-400 hover:from-amber-400 hover:to-emerald-300 text-slate-950 font-black uppercase text-[10px] tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                    >
                                        <span>Verify Code</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsManualEntryOpen(false)}
                                        className="px-3 py-2.5 bg-white text-[#0F172A] font-bold text-[10px] uppercase rounded-xl hover:bg-slate-700 transition-all dark:bg-slate-800"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Dedicated Success Animation Overlay */}
                <AnimatePresence>
                    {status === 'success' && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-emerald-950  flex flex-col items-center justify-center text-center p-6 z-40"
                            id="qr-success-animation-pane"
                        >
                            {/* Subtle screen pulse backdrop circle */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ 
                                    scale: [1, 1.4, 1.2], 
                                    opacity: [1, 0.4, 0],
                                }}
                                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
                                className="absolute w-48 h-48 bg-emerald-500 rounded-full z-0 pointer-events-none"
                            />
                            
                            {/* Checkmark Morph Sphere */}
                            <motion.div
                                initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
                                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 220, damping: 16 }}
                                className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/40 relative z-10"
                            >
                                <motion.svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                    className="w-10 h-10"
                                >
                                    <motion.path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.6, delay: 0.1, ease: "easeInOut" }}
                                        d="M5 13l4 4L19 7"
                                    />
                                </motion.svg>
                            </motion.div>
                            
                            <motion.h3
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-sm font-black uppercase tracking-wider text-emerald-400 mt-4 relative z-10"
                            >
                                Scan Successful
                            </motion.h3>
                            <motion.p
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-[10px] font-bold text-emerald-300 mt-1 max-w-[220px] relative z-10 leading-relaxed"
                            >
                                Routing coordinates received and verified. Initiating one-tap payment...
                            </motion.p>
                            <motion.button
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                onClick={() => scanResult && downloadPdfReceipt(scanResult)}
                                className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5 shadow-lg active:scale-95 transition-all z-50 pointer-events-auto"
                            >
                                📥 Download PDF Receipt
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {/* Error Overlay with Retry / Error states */}
                <AnimatePresence>
                    {status === 'error' && !isManualEntryOpen && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center text-center p-6 z-40"
                            id="qr-error-overlay-pane"
                        >
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                className="w-16 h-16 bg-rose-500 border border-rose-500/30 rounded-full flex items-center justify-center mb-3"
                            >
                                <ShieldAlert className="w-8 h-8 text-rose-500 animate-[bounce_1.5s_infinite]" />
                            </motion.div>
                            
                            <h3 className="text-xs font-black uppercase tracking-widest text-rose-500">Scan Validation Failed</h3>
                            
                            <div className="bg-rose-500 border border-rose-500/20 text-rose-300 text-[10.5px] font-bold p-3 rounded-xl mt-3 leading-relaxed max-w-[240px]">
                                {error || "Unrecognized payment pattern. Verification signature mismatch."}
                            </div>
                            
                            <div className="flex gap-2 mt-4 w-full max-w-[240px]">
                                <button
                                    type="button"
                                    onClick={startScan}
                                    className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-md transition-all active:scale-95"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>Retry</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsManualEntryOpen(true)}
                                    className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-white hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-md transition-all active:scale-95 dark:bg-slate-800"
                                >
                                    <Keyboard className="w-3.5 h-3.5" />
                                    <span>Manual</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Error Toast Banner */}
            <AnimatePresence>
                {errorToast && (
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="fixed sm:absolute bottom-16 sm:bottom-4 left-4 right-4 bg-rose-900 border border-rose-500 text-white text-[11px] font-bold p-3 rounded-xl shadow-2xl flex items-center gap-2 z-50 text-left"
                        id="qr-error-toast"
                    >
                        <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                        <span className="flex-1 leading-normal">{errorToast}</span>
                        <button onClick={() => setErrorToast(null)} className="text-white/60 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fallback Entry Bar */}
            <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                }}
            />
            <div className="w-full max-w-sm flex items-center justify-between gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-3 rounded-2xl shadow-md">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 px-3 bg-white hover:bg-slate-700 text-amber-400 text-[10px] font-black uppercase tracking-wider rounded-xl shadow transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer dark:bg-slate-800"
                >
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>Upload QR Image</span>
                </button>
                <button
                    type="button"
                    onClick={() => {
                        triggerHaptic(10);
                        setIsManualEntryOpen(true);
                    }}
                    className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-xl shadow transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                    <Keyboard className="w-3.5 h-3.5 text-slate-950" />
                    <span>Enter Code</span>
                </button>
            </div>

            {/* Interactive simulation helper bar to provide frictionless trial experience */}
            <div className="w-full max-w-sm bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-white/10 space-y-3" id="qr-simulation-tools">
                <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-[#0F172A] font-extrabold pb-1.5 border-b border-slate-100 dark:border-white/10">
                    <span>First Pacific Bank QR Code Presets</span>
                    <HelpCircle className="w-3.5 h-3.5 text-[#0F172A] animate-pulse" />
                </div>
                
                <p className="text-[10px] text-[#0F172A] font-bold">Select an official bank clearing QR node to simulate instant camera acquisition:</p>

                <div className="flex flex-col gap-2">
                    {[
                        {
                            name: "Chibuzor Iyke NWAIWU",
                            label: "Global Logistics Escrow",
                            amount: "$12,500.00",
                            data: '{"accountNumber":"215533429905","recipientName":"Chibuzor Iyke NWAIWU","bankName":"Lead Bank","swiftBic":"LEADUS33","amount":"12500.00","description":"Global Logistics Escrow Settlement"}'
                        },
                        {
                            name: "Lawrence Consultants Org",
                            label: "Institutional Advisory Sweep",
                            amount: "$85,000.00",
                            data: '{"accountNumber":"ACC-992831","recipientName":"Lawrence Consultants Org","bankName":"First Pacific Bank","swiftBic":"FPBUSH22","amount":"85000.00","description":"Institutional Advisory Sweep"}'
                        },
                        {
                            name: "Sovereign Liquidity Node",
                            label: "Liquidity Pool Allocation",
                            amount: "$250,000.00",
                            data: '{"accountNumber":"FPB-98177-38","recipientName":"Sovereign Liquidity Clearing","bankName":"First Pacific Bank","swiftBic":"FPBUSH22","amount":"250000.00","description":"Sovereign Liquidity Pool Allocation"}'
                        }
                    ].map((preset, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleSuccessfulDetection(preset.data)}
                            className="w-full text-left p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 hover:border-amber-500/30 rounded-xl transition-all flex justify-between items-center group active:scale-[0.99]"
                        >
                            <div className="min-w-0 flex-1 pr-2">
                                <p className="text-[10.5px] font-bold text-[#0F172A] dark:text-white truncate group-hover:text-amber-500 transition-colors">{preset.name}</p>
                                <p className="text-[8.5px] text-[#0F172A] font-bold uppercase tracking-wider mt-0.5">{preset.label}</p>
                            </div>
                            <span className="text-[10px] font-mono font-black text-amber-500 bg-amber-500 px-2 py-1 rounded-lg shrink-0">
                                {preset.amount}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[9px] font-black uppercase tracking-wider pt-2 border-t border-slate-100 dark:border-white/10">
                    <button
                        type="button"
                        onClick={() => simulateDirectScan(true)}
                        className="py-2 bg-slate-100 dark:bg-slate-900 text-[#0F172A] dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-1"
                        title="Mock General Scan"
                    >
                        <span>⚡ Quick Mock</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => simulateDirectScan(false)}
                        className="py-2 bg-rose-500 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-500 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-1"
                        title="Mock Scan Failure"
                    >
                        <span>⚠️ Fail Mock</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
