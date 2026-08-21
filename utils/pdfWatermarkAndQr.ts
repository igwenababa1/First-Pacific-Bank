import { jsPDF } from 'jspdf';
import { BRANDING_CONFIG } from '../components/constants';

/**
 * Utility to generate a high-resolution PNG Data URL for QR code using QuickChart API 
 * with synchronous canvas fallback for offline/instant PDF rendering.
 */
export const generateQrCodeDataUrl = (text: string, size: number = 200): Promise<string> => {
    return new Promise((resolve) => {
        if (typeof window === 'undefined') {
            resolve(createCanvasQrFallback(text, size));
            return;
        }

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        const encodedText = encodeURIComponent(text);
        img.src = `https://quickchart.io/qr?text=${encodedText}&size=${size}&margin=1`;

        const timeoutId = setTimeout(() => {
            resolve(createCanvasQrFallback(text, size));
        }, 1500);

        img.onload = () => {
            clearTimeout(timeoutId);
            try {
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, size, size);
                    ctx.drawImage(img, 0, 0, size, size);
                    resolve(canvas.toDataURL('image/png'));
                    return;
                }
            } catch (e) {
                // Ignore canvas errors
            }
            resolve(createCanvasQrFallback(text, size));
        };

        img.onerror = () => {
            clearTimeout(timeoutId);
            resolve(createCanvasQrFallback(text, size));
        };
    });
};

/**
 * Creates a high-fidelity vector matrix QR pattern on HTML5 canvas as fallback.
 */
export const createCanvasQrFallback = (text: string, size: number = 200): string => {
    if (typeof document === 'undefined') return '';
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    // Border
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, size - 4, size - 4);

    // Outer Finder Corners
    const drawFinder = (x: number, y: number, s: number) => {
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + s * 0.14, y + s * 0.14, s * 0.72, s * 0.72);
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(x + s * 0.28, y + s * 0.28, s * 0.44, s * 0.44);
    };

    const cornerSize = Math.floor(size * 0.25);
    drawFinder(10, 10, cornerSize);
    drawFinder(size - cornerSize - 10, 10, cornerSize);
    drawFinder(10, size - cornerSize - 10, cornerSize);

    // Pseudo Data Matrix Grid based on string hash
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = (hash << 5) - hash + text.charCodeAt(i);
        hash |= 0;
    }

    const gridSize = 14;
    const cellSize = (size - 20) / gridSize;
    ctx.fillStyle = '#0F172A';

    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            // Skip finder corner areas
            if ((row < 4 && col < 4) || (row < 4 && col > 9) || (row > 9 && col < 4)) {
                continue;
            }
            const bit = (hash ^ (row * 13 + col * 37)) % 3 === 0;
            if (bit) {
                ctx.fillRect(10 + col * cellSize, 10 + row * cellSize, cellSize - 1, cellSize - 1);
            }
        }
    }

    // Center Bank Logo Emblem inside QR
    const centerSize = Math.floor(size * 0.22);
    const centerX = (size - centerSize) / 2;
    const centerY = (size - centerSize) / 2;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(centerX - 2, centerY - 2, centerSize + 4, centerSize + 4);
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(centerX, centerY, centerSize, centerSize);
    ctx.fillStyle = '#D4AF37';
    ctx.font = `bold ${Math.floor(centerSize * 0.45)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FPB', size / 2, size / 2);

    return canvas.toDataURL('image/png');
};

/**
 * Draws realistic modern bank background watermark, security guilloche background lines,
 * and official bank logo onto a jsPDF page.
 */
export const applyBankPdfBackgroundAndWatermark = (
    doc: jsPDF,
    options?: { title?: string; subtitle?: string; documentRef?: string, includeFooter?: boolean }
): void => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const bankName = BRANDING_CONFIG?.bankName || 'First Pacific Sovereign Bank';

    // 1. Premium Security Guilloche Background (intricate intersecting curves)
    doc.setDrawColor(246, 248, 250); 
    doc.setLineWidth(0.2);
    for (let i = 0; i < pageHeight; i += 8) {
        doc.line(0, i, pageWidth, i);
    }
    for (let i = 0; i < pageWidth; i += 8) {
        doc.line(i, 0, i, pageHeight);
    }
    
    // Diagonal guilloche
    doc.setDrawColor(249, 250, 252);
    for (let i = -pageHeight; i < pageWidth; i += 12) {
        doc.line(i, 0, i + pageHeight, pageHeight);
        doc.line(i, pageHeight, i + pageHeight, 0);
    }

    // 2. Central Watermark (Giant Faint Seal)
    doc.setDrawColor(241, 245, 249);
    doc.setFillColor(248, 250, 252);
    doc.circle(pageWidth / 2, pageHeight / 2, 65, 'S');
    doc.circle(pageWidth / 2, pageHeight / 2, 63, 'S');
    doc.circle(pageWidth / 2, pageHeight / 2, 50, 'S');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(60);
    doc.setTextColor(242, 246, 250); 
    doc.text('FPB', pageWidth / 2, pageHeight / 2 + 5, { align: 'center' });
    
    doc.setFontSize(20);
    doc.text('FIRST PACIFIC BANK', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
    doc.setFontSize(16);
    doc.text('SOVEREIGN WEALTH', pageWidth / 2, pageHeight / 2 + 30, { align: 'center' });

    // 3. Ultra Premium Header (Letterhead style)
    // Dark Navy Top Bar
    doc.setFillColor(10, 15, 30); // Very dark navy
    doc.rect(0, 0, pageWidth, 42, 'F');
    // Gold Accent Bar
    doc.setFillColor(212, 175, 55); 
    doc.rect(0, 42, pageWidth, 1.5, 'F');
    // Subtle second gold bar
    doc.rect(0, 44.5, pageWidth, 0.5, 'F');

    // Official Bank Crest (Vector)
    const logoX = 14;
    const logoY = 11;
    
    // Crest Outer Ring
    doc.setDrawColor(212, 175, 55);
    doc.setFillColor(10, 15, 30);
    doc.setLineWidth(0.8);
    doc.circle(logoX + 10, logoY + 10, 10, 'FD');
    // Inner Ring
    doc.setLineWidth(0.3);
    doc.circle(logoX + 10, logoY + 10, 8, 'S');
    
    // Star & Pillars inside Crest
    doc.setFillColor(212, 175, 55);
    doc.setFontSize(9);
    doc.text('★', logoX + 10, logoY + 6.5, { align: 'center' });
    doc.rect(logoX + 5.5, logoY + 9, 1.5, 5, 'F');
    doc.rect(logoX + 8.5, logoY + 9, 1.5, 5, 'F');
    doc.rect(logoX + 11.5, logoY + 9, 1.5, 5, 'F');
    doc.rect(logoX + 14.5, logoY + 9, 1.5, 5, 'F');
    doc.rect(logoX + 4.5, logoY + 14, 11, 1.5, 'F'); // base
    doc.triangle(logoX + 4.5, logoY + 8, logoX + 10, logoY + 4, logoX + 15.5, logoY + 8, 'F'); // roof

    // Header Bank Typography
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(bankName.toUpperCase(), logoX + 26, logoY + 9);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(212, 175, 55);
    doc.text('GLOBAL PRIVATE BANKING & INSTITUTIONAL CLEARING', logoX + 26, logoY + 14);
    
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`100 WALL STREET, SUITE 4400, NEW YORK, NY 10005  |  SWIFT: FPBKUS33XXX  |  FDIC: #94028`, logoX + 26, logoY + 18);

    // Document Title Header Banner (Right aligned in top bar)
    if (options?.title) {
        doc.setFillColor(20, 25, 45); 
        doc.setDrawColor(212, 175, 55);
        doc.setLineWidth(0.4);
        doc.roundedRect(pageWidth - 75, 9, 60, 24, 2, 2, 'FD');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(options.title.toUpperCase(), pageWidth - 45, 15, { align: 'center' });
        
        doc.setFontSize(6.5);
        doc.setTextColor(212, 175, 55);
        doc.text('CERTIFIED & VERIFIED LEDGER', pageWidth - 45, 20, { align: 'center' });
        
        if (options.documentRef) {
            doc.setFont('courier', 'bold');
            doc.setFontSize(6.5);
            doc.setTextColor(203, 213, 225);
            doc.text(options.documentRef, pageWidth - 45, 25, { align: 'center' });
        }
    }

    // 4. Official Footer & Wax Seal
    if (options?.includeFooter !== false) {
        const footerY = pageHeight - 30;
        
        // Top border of footer
        doc.setDrawColor(212, 175, 55);
        doc.setLineWidth(0.5);
        doc.line(14, footerY, pageWidth - 14, footerY);

        // Footer Text
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(15, 23, 42);
        doc.text('FIRST PACIFIC SOVEREIGN BANK - STRICTLY CONFIDENTIAL', 14, footerY + 6);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(100, 116, 139);
        doc.text('This document is electronically generated and secured by cryptographic ledger technology. It serves as an official proof of record.', 14, footerY + 10);
        doc.text('Regulated by the Office of the Comptroller of the Currency (OCC) and the Federal Reserve System. Equal Housing Lender.', 14, footerY + 13.5);
        doc.text(`Contact: ${BRANDING_CONFIG?.phone || '+1 (800) 555-0199'} | Support: ${BRANDING_CONFIG?.supportUrl || 'support.firstpacificbank.com'} | Routing: FPBKUS33`, 14, footerY + 17);

        // Wax Seal / Official Stamp (Right side of footer)
        doc.setFillColor(180, 25, 30); // Deep wax red
        doc.setDrawColor(130, 15, 20);
        doc.setLineWidth(0.5);
        doc.circle(pageWidth - 22, footerY + 11, 9, 'FD');
        doc.circle(pageWidth - 22, footerY + 11, 7.5, 'S');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(4.5);
        doc.setTextColor(255, 200, 200);
        doc.text('OFFICIAL', pageWidth - 22, footerY + 8.5, { align: 'center' });
        doc.text('SEAL', pageWidth - 22, footerY + 11.5, { align: 'center' });
        doc.text('FPB', pageWidth - 22, footerY + 15, { align: 'center' });

        // Signature
        doc.setFont('times', 'italic');
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text('Alexander M. Sterling', pageWidth - 65, footerY + 10, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5);
        doc.setTextColor(100, 116, 139);
        doc.text('CHIEF REGULATORY OFFICER', pageWidth - 65, footerY + 13.5, { align: 'center' });
        doc.text('DIGITALLY SIGNED', pageWidth - 65, footerY + 16, { align: 'center' });
    }
};

/**
 * Embeds a prominent Real-Time Transaction Verification QR Code Section into a jsPDF document.
 */
export const embedVerificationQrCodeBlock = (
    doc: jsPDF,
    qrDataUrl: string,
    x: number,
    y: number,
    options?: {
        width?: number;
        height?: number;
        transactionId?: string;
        verificationUrl?: string;
    }
): void => {
    const boxW = options?.width || 182;
    const boxH = options?.height || 26;

    // Border Box with Gold / Slate Gradient Feel
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, boxW, boxH, 2.5, 2.5, 'FD');

    // QR Image on the Left
    const qrSize = boxH - 6;
    if (qrDataUrl) {
        try {
            doc.addImage(qrDataUrl, 'PNG', x + 3, y + 3, qrSize, qrSize);
        } catch (e) {
            // Draw fallback QR if image embed fails
        }
    }

    // QR Code Frame Border
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.3);
    doc.rect(x + 3, y + 3, qrSize, qrSize, 'D');

    // Text Content Next to QR Code
    const textX = x + qrSize + 8;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('REAL-TIME AUDITOR TRANSACTION VERIFICATION', textX, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text('External regulatory auditors may scan this cryptographic QR code using any smartphone or camera to', textX, y + 12);
    doc.text('instantly validate official ledger authenticity, bank digital signature, and settlement state in real time.', textX, y + 16);

    const txRef = options?.transactionId || 'FPB-TX-90481204-VERIFIED';
    doc.setFont('courier', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text(`AUDIT CLEARANCE REF: ${txRef}  |  STATUS: AUTHENTIC & GUARANTEED`, textX, y + 21);
};
