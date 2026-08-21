import React, { useEffect, useState } from 'react';
import { PushNotification } from '../types';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { applyBankPdfBackgroundAndWatermark, generateQrCodeDataUrl, embedVerificationQrCodeBlock } from '../utils/pdfWatermarkAndQr';
import { 
  PremiumReservedBankLogo, 
  XIcon, 
  ClipboardDocumentIcon, 
  CheckCircleIcon, 
  ShieldCheckIcon, 
  MessageSquareIcon,
  ArrowDownTrayIcon,
  MegaphoneIcon,
  CreditCardIcon
} from './Icons';

interface PushNotificationToastProps {
  notification: PushNotification;
  onClose: () => void;
  code?: string; // Optional code to copy
}

export const PushNotificationToast: React.FC<PushNotificationToastProps> = ({ notification, onClose, code }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [progress, setProgress] = useState(100);
  const navigate = useNavigate();
  const duration = notification.isQrPay ? 15000 : 10000; // 15s for interactive QR alerts

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        onClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [onClose, duration]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (code) {
      navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleViewReceipt = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
    navigate('/inbox');
  };

  const handleDownloadPdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const amountStr = notification.amount ? notification.amount.toFixed(2) : '0.00';
      const merchantName = notification.merchantName || 'FPB Direct Merchant Node';
      const txnId = notification.transactionId || `TXN-${Math.floor(Math.random() * 900000 + 100000)}`;
      const dateText = notification.date || new Date().toLocaleString();

      applyBankPdfBackgroundAndWatermark(doc, { title: 'IMMUTABLE CLEARING HANDSHAKE RECORD', documentRef: `REF: ${txnId}` });

      // Statement reference block
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
      doc.setTextColor(14, 197, 242);
      doc.text(txnId, 62, 62);

      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text("CLEARANCE TIMELOCK:", 20, 68);
      doc.setFont('Helvetica', 'normal');
      doc.text(dateText, 62, 68);

      // Metadata Table Headers
      doc.setFontSize(11);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text("CLEARING HOUSE PROTOCOL METADATA", 15, 92);
      
      doc.setLineWidth(0.3);
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 95, 195, 95);

      const labels = [
        ["Interledger Originating Node", "First Pacific Core API Exchange"],
        ["Counterparty Routing Address", merchantName],
        ["Sovereign Clearance Status", "TIMELOCK CLEARED // ZERO-GAS SETTLED"],
        ["Transfer Category Code", "QR Instant Liquidity Swap (P2P)"],
        ["Clearing Network Cost", "$0.00 USD (Sovereign Exemption Code)"]
      ];

      labels.forEach((row, i) => {
        const y = 104 + (i * 10);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(row[0], 18, y);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
        doc.text(row[1], 100, y);
        doc.line(15, y + 3, 195, y + 3);
      });

      // Highlight Card
      const highlightY = 162;
      doc.setFillColor(11, 16, 28);
      doc.rect(15, highlightY, 180, 26, 'F');
      
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

      // Verified stamp visual
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(0.8);
      doc.circle(165, highlightY + 12, 10);
      doc.setTextColor(34, 197, 94);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(5);
      doc.text("VERIFIED", 158.5, highlightY + 11.5);
      doc.text("SETTLED", 159, highlightY + 14.5);

      // Compliance
      doc.setFontSize(7.5);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      const complianceText = "This statement represents an automated decentralized bookkeeping trace of assets authorized securely from internal private account assets. First Pacific Bank operates as a licensed Sovereign Asset Settlement Desk. Values transacted are committed dynamically to standard compliance indices.";
      const splitText = doc.splitTextToSize(complianceText, 175);
      doc.text(splitText, 15, 205);

      doc.line(15, 248, 85, 248);
      doc.text("Sovereign Node Integrity Seal", 15, 253);
      doc.line(125, 248, 195, 248);
      doc.text("Authorized Clearing Officer Handshake", 125, 253);

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.setFont('Courier', 'italic');
      doc.text(`FIRST-PABA-CRYPTO-STAMP-TRACE-${txnId}`, 15, 282);

      const originHost = typeof window !== 'undefined' ? window.location.origin : 'https://firstpacificbank.com';
      const verifyPayload = `${originHost}/verify?doc=TX_${txnId}&status=VERIFIED`;
      const qrDataUrl = await generateQrCodeDataUrl(verifyPayload, 200);
      embedVerificationQrCodeBlock(doc, qrDataUrl, 15, 250, { width: 180, height: 26 });

      doc.save(`First_Paba_Receipt_${txnId}.pdf`);
    } catch (err) {
      console.error(err);
    }
  };

  const isSms = notification.message.includes('FPB') || notification.title.toLowerCase().includes('message');

  // CUSTOM PROFESSIONAL QR TOAST NOTIFICATION LAYOUT
  if (notification.isQrPay) {
    return (
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[440px] z-[1000] cursor-pointer animate-ios-banner"
        role="alert"
        onClick={onClose}
      >
        <div className="relative bg-[#0b101c]/95 border border-emerald-500/30 rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden transition-all duration-500 hover:scale-[1.01] active:scale-[0.98] animate-qr-toast-pulse">
          {/* Subtle Progress Bar */}
          <div className="absolute bottom-0 left-0 h-[3px] bg-emerald-500 transition-all duration-[50ms] ease-linear" style={{ width: `${progress}%` }}></div>

          <div className="p-5 space-y-4">
            <div className="flex gap-3.5 items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-[1.2rem] flex items-center justify-center shadow-lg border border-emerald-500/20 bg-gradient-to-br from-emerald-950 to-black text-emerald-400">
                  <CheckCircleIcon className="w-7 h-7" />
                </div>
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    Sovereign QR Swap Success
                  </p>
                  <span className="text-[9px] text-[#0F172A] font-bold font-mono">now</span>
                </div>
                
                <h4 className="text-[14px] font-black text-white uppercase tracking-tight">
                  Transaction Settled
                </h4>
                
                <div className="text-xs text-[#0F172A] mt-2 space-y-1.5 bg-slate-100 border border-slate-200 dark:border-white/10 p-3 rounded-xl font-bold">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-[#0F172A] block">Merchant Counterparty:</span>
                    <span className="text-slate-100 font-bold">{notification.merchantName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.03]">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-[#0F172A] block">Settled Amount:</span>
                      <span className="text-emerald-400 font-mono font-bold">${notification.amount?.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-[#0F172A] block">Clearing Date:</span>
                      <span className="text-[#0F172A] text-[10px] truncate block font-mono">{notification.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Micro-interactive custom action row containing View & Download elements */}
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleViewReceipt}
                className="flex-1 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl bg-white hover:bg-white text-white border border-slate-200 dark:border-white/10 transition-all active:scale-[0.97] dark:bg-slate-800"
              >
                View Receipt
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="flex-1 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all flex items-center justify-center gap-1 shadow-md shadow-emerald-950/20 active:scale-[0.97] cursor-pointer"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes ios-banner {
            0% { transform: translate(-50%, -120%) scale(0.95); opacity: 0; filter: blur(10px); }
            100% { transform: translate(-50%, 0) scale(1); opacity: 1; filter: blur(0); }
          }
          .animate-ios-banner {
            animation: ios-banner 0.7s cubic-bezier(0.2, 1, 0.2, 1) forwards;
          }
          .animate-qr-toast-pulse {
            animation: qr-toast-pulse 3s ease-in-out infinite alternate;
          }
          @keyframes qr-toast-pulse {
            0%, 100% { transform: scale(1); box-shadow: 0 25px 60px -15px rgba(0,0,0,0.7); border-color: rgba(16, 185, 129, 0.3); }
            50% { transform: scale(1.02); box-shadow: 0 25px 65px -10px rgba(16, 185, 129, 0.55); border-color: rgba(16, 185, 129, 0.6); }
          }
        `}</style>
      </div>
    );
  }

  // STANDARD TOAST NOTIFICATION LAYOUT
  const cat = notification.category?.toLowerCase();
  
  let cardBorderClass = 'border-slate-200 dark:border-white/10';
  let progressBgClass = 'bg-white';
  let iconBgClass = isSms ? 'bg-green-500' : 'bg-gradient-to-br from-slate-800 to-black';
  let pulseAnimClass = 'animate-standard-toast-pulse';
  let badgeColorClass = 'text-[#0F172A] dark:text-white/50';
  let dotColorClass = 'bg-slate-400';

  if (cat === 'security') {
    cardBorderClass = 'border-rose-500/40 dark:border-rose-500/30';
    progressBgClass = 'bg-rose-500';
    iconBgClass = 'bg-rose-500 border-rose-500/20 text-rose-500';
    pulseAnimClass = 'animate-security-toast-pulse';
    badgeColorClass = 'text-rose-600 dark:text-rose-400 font-extrabold';
    dotColorClass = 'bg-rose-500';
  } else if (cat === 'promotional') {
    cardBorderClass = 'border-purple-500/40 dark:border-purple-500/30';
    progressBgClass = 'bg-purple-500';
    iconBgClass = 'bg-purple-500 border-purple-500/30 text-purple-500';
    pulseAnimClass = 'animate-promo-toast-pulse';
    badgeColorClass = 'text-purple-600 dark:text-purple-400 font-extrabold';
    dotColorClass = 'bg-purple-500';
  } else if (cat === 'transactional') {
    cardBorderClass = 'border-cyan-500/40 dark:border-cyan-500/30';
    progressBgClass = 'bg-cyan-500';
    iconBgClass = 'bg-cyan-500 border-cyan-500/30 text-cyan-500';
    pulseAnimClass = 'animate-transaction-toast-pulse';
    badgeColorClass = 'text-cyan-600 dark:text-cyan-400 font-extrabold';
    dotColorClass = 'bg-cyan-500';
  }

  const getIcon = () => {
    if (isSms) {
      return <MessageSquareIcon className="w-6 h-6 text-[#0F172A] dark:text-white fill-current" />;
    }
    if (code) {
      return <ShieldCheckIcon className="w-6 h-6 text-emerald-400" />;
    }
    if (cat === 'security') {
      return <ShieldCheckIcon className="w-6 h-6 text-rose-500" />;
    }
    if (cat === 'promotional') {
      return <MegaphoneIcon className="w-5 h-5 text-purple-500" />;
    }
    if (cat === 'transactional') {
      return <CreditCardIcon className="w-5 h-5 text-cyan-500" />;
    }
    return <PremiumReservedBankLogo className="w-7 h-7" />;
  };

  const getTitle = () => {
    if (isSms) return 'Messages';
    if (notification.category) {
      return `${notification.category}`;
    }
    return notification.title;
  };

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[420px] z-[1000] cursor-pointer animate-ios-banner"
      role="alert"
      onClick={onClose}
    >
      <div className={`relative bg-[#1c1c1e]/80  border rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500 hover:scale-[1.01] active:scale-[0.98] ${cardBorderClass} ${pulseAnimClass}`}>
        
        {/* Progress Bar (Subtle) */}
        <div className={`absolute bottom-0 left-0 h-[2px] transition-all duration-[50ms] ease-linear ${progressBgClass}`} style={{ width: `${progress}%` }}></div>

        <div className="p-4 flex gap-3">
          <div className="flex-shrink-0">
            <div className={`w-11 h-11 rounded-[1.2rem] flex items-center justify-center shadow-lg border border-slate-100 dark:border-white/10 ${iconBgClass}`}>
               {getIcon()}
            </div>
          </div>
          
          <div className="flex-1 min-w-0 py-0.5 text-left">
            <div className="flex justify-between items-center mb-0.5">
              <p className={`text-[11px] font-bold uppercase tracking-widest ${badgeColorClass}`}>
                {getTitle()}
              </p>
              <span className="text-[10px] text-[#0F172A] dark:text-white/30 font-bold">now</span>
            </div>
            <p className="text-[13px] font-semibold text-[#0F172A] dark:text-white leading-tight tracking-tight">
              {isSms && <span className="text-[#0F172A] dark:text-white/60 font-bold mr-1">FPB:</span>}
              {notification.message}
            </p>
            
            {code && (
              <div className="mt-2.5 flex items-center gap-2">
                 <div className="bg-white px-3 py-1 rounded-lg border border-slate-100 dark:border-white/10 text-xs font-mono font-bold text-[#0F172A] dark:text-white tracking-widest dark:bg-slate-800">
                    {code}
                 </div>
                 <button 
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${isCopied ? 'bg-emerald-500 text-emerald-400 border-emerald-500/30' : 'bg-white text-[#0F172A] dark:text-white border-slate-200 dark:border-white/10 hover:bg-white'}`}
                 >
                    {isCopied ? <CheckCircleIcon className="w-3 h-3" /> : <ClipboardDocumentIcon className="w-3 h-3" />}
                    {isCopied ? 'Copied' : 'Copy'}
                 </button>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-start">
            <div className={`w-1.5 h-1.5 rounded-full primary- animate-pulse mt-1 ${dotColorClass}`}></div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes ios-banner {
          0% { transform: translate(-50%, -120%) scale(0.95); opacity: 0; filter: blur(10px); }
          100% { transform: translate(-50%, 0) scale(1); opacity: 1; filter: blur(0); }
        }
        .animate-ios-banner {
          animation: ios-banner 0.7s cubic-bezier(0.2, 1, 0.2, 1) forwards;
        }
        .animate-standard-toast-pulse {
          animation: standard-toast-pulse 3s ease-in-out infinite alternate;
        }
        @keyframes standard-toast-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); border-color: rgba(255, 255, 255, 0.1); }
          50% { transform: scale(1.02); box-shadow: 0 25px 55px -10px rgba(59, 130, 246, 0.35); border-color: rgba(59, 130, 246, 0.5); }
        }
        @keyframes security-toast-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); border-color: rgba(244, 63, 94, 0.2); }
          50% { transform: scale(1.02); box-shadow: 0 25px 55px -10px rgba(244, 63, 94, 0.35); border-color: rgba(244, 63, 94, 0.5); }
        }
        .animate-security-toast-pulse {
          animation: security-toast-pulse 3s ease-in-out infinite alternate;
        }
        @keyframes promo-toast-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); border-color: rgba(168, 85, 247, 0.2); }
          50% { transform: scale(1.02); box-shadow: 0 25px 55px -10px rgba(168, 85, 247, 0.35); border-color: rgba(168, 85, 247, 0.5); }
        }
        .animate-promo-toast-pulse {
          animation: promo-toast-pulse 3s ease-in-out infinite alternate;
        }
        @keyframes transaction-toast-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); border-color: rgba(6, 182, 212, 0.2); }
          50% { transform: scale(1.02); box-shadow: 0 25px 55px -10px rgba(6, 182, 212, 0.35); border-color: rgba(6, 182, 212, 0.5); }
        }
        .animate-transaction-toast-pulse {
          animation: transaction-toast-pulse 3s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
  );
};
