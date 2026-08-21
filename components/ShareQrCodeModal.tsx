import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { triggerHaptic, triggerSuccessHaptic } from "../utils/haptics";
import { useCurrency } from "../contexts/CurrencyContext";
import { Account, UserProfile } from "../types";
import {
  QrCode,
  Copy,
  Share2,
  Download,
  Check,
  Building2,
  User,
  ShieldCheck,
  X,
  Sparkles,
  ArrowDownLeft,
} from "lucide-react";

export interface ShareQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  account?: Account;
  userProfile: UserProfile;
}

export const ShareQrCodeModal: React.FC<ShareQrCodeModalProps> = ({
  isOpen,
  onClose,
  account,
  userProfile,
}) => {
  const { formatCurrency, displayCurrency } = useCurrency();
  const [requestedAmount, setRequestedAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const targetAccount = account || {
    accountNumber: "0210000891234",
    routingNumber: "121000358",
    fullAccountNumber: "0210000891234",
    nickname: "Primary Checking",
  };

  const cleanAcct = targetAccount.fullAccountNumber || targetAccount.accountNumber || "0210000891234";
  const cleanRouting = targetAccount.routingNumber || "121000358";

  // Build high-compatibility universal banking QR payload
  const qrPayload = JSON.stringify({
    protocol: "FPB_P2P_V2",
    bank: "First Pacific Bank",
    name: userProfile.name || "First Pacific Client",
    email: userProfile.email,
    accountNumber: cleanAcct,
    routingNumber: cleanRouting,
    amount: requestedAmount ? parseFloat(requestedAmount) : undefined,
    currency: displayCurrency,
    note: note || undefined,
    timestamp: new Date().toISOString(),
  });

  const handleCopyLink = () => {
    const textToCopy = `First Pacific Bank Direct Transfer:\nName: ${userProfile.name}\nAccount: ${cleanAcct}\nRouting: ${cleanRouting}\n${requestedAmount ? `Amount: ${displayCurrency} ${requestedAmount}\n` : ''}${note ? `Memo: ${note}` : ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    triggerSuccessHaptic(50);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopySingleField = (fieldName: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(fieldName);
    triggerHaptic(20);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleNativeShare = async () => {
    triggerHaptic(25);
    const shareData = {
      title: `Pay ${userProfile.name} - First Pacific Bank`,
      text: `Send instant P2P payment to ${userProfile.name} on First Pacific Bank.\nAccount: ${cleanAcct} | Routing: ${cleanRouting}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share cancelled or not supported");
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQr = () => {
    triggerHaptic(30);
    const svgElement = qrContainerRef.current?.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 600;
      canvas.height = 600;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 50, 500, 500);
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `FPB_Payment_QR_${userProfile.name.replace(/\s+/g, "_")}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950  overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl bg-slate-900 border border-teal-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.6)] p-6 text-white text-center my-6"
          id="share-qr-code-modal"
        >
          {/* Glowing Top Frame */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-500" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-600 dark:text-slate-300 dark:text-slate-300 hover:text-white hover:bg-white transition-colors dark:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-teal-500 text-teal-400">
              <QrCode className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-black uppercase tracking-tight text-white">
              Instant Receive & Share QR
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 dark:text-slate-300">
            Share your unique QR code or account credentials for instant real-time P2P settlement.
          </p>

          {/* QR Code Container */}
          <div className="my-5 flex flex-col items-center justify-center">
            <div
              ref={qrContainerRef}
              className="p-4 rounded-3xl bg-white shadow-2xl border-4 border-teal-500/30 relative group hover:scale-[1.02] transition-transform dark:bg-slate-800"
            >
              <QRCodeSVG
                value={qrPayload}
                size={190}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6A7q0M6Fj1tZ0tY1C7E9C_v7iL7iV8d0wQ&s",
                  x: undefined,
                  y: undefined,
                  height: 36,
                  width: 36,
                  excavate: true,
                }}
              />
              <div className="mt-2 flex items-center justify-center gap-1 text-slate-900 font-mono text-[9px] font-bold">
                <ShieldCheck className="w-3 h-3 text-teal-600" />
                <span>FIRST PACIFIC SECURE CLEARANCE</span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest">
                Active Ingress Rail (FedNow / RTP)
              </span>
            </div>
          </div>

          {/* Optional Amount Preset Input */}
          <div className="mb-4 grid grid-cols-2 gap-2 text-left">
            <div>
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 dark:text-slate-300 uppercase tracking-wider pl-1">
                Request Amount (Optional)
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-600 dark:text-slate-300 dark:text-slate-300">
                  $
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 focus:border-teal-400 text-xs font-mono text-white outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 dark:text-slate-300 uppercase tracking-wider pl-1">
                Note / Memo (Optional)
              </label>
              <input
                type="text"
                placeholder="Dinner, rent, etc."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 focus:border-teal-400 text-xs text-white outline-none"
              />
            </div>
          </div>

          {/* Account Details Box with Fast Copy */}
          <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700/60 text-left space-y-2 mb-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[10px] text-slate-600 dark:text-slate-300 dark:text-slate-300 uppercase font-semibold">Account Number</span>
              <button
                type="button"
                onClick={() => handleCopySingleField("account", cleanAcct)}
                className="flex items-center gap-1 font-mono font-bold text-teal-400 hover:text-teal-300"
              >
                <span>{cleanAcct}</span>
                {copiedField === "account" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-600 dark:text-slate-300 dark:text-slate-300" />}
              </button>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[10px] text-slate-600 dark:text-slate-300 dark:text-slate-300 uppercase font-semibold">Routing (ABA / FedWire)</span>
              <button
                type="button"
                onClick={() => handleCopySingleField("routing", cleanRouting)}
                className="flex items-center gap-1 font-mono font-bold text-teal-400 hover:text-teal-300"
              >
                <span>{cleanRouting}</span>
                {copiedField === "routing" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-600 dark:text-slate-300 dark:text-slate-300" />}
              </button>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[10px] text-slate-600 dark:text-slate-300 dark:text-slate-300 uppercase font-semibold">Account Holder</span>
              <span className="font-bold text-white truncate max-w-[180px]">{userProfile.name}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="py-3 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-teal-500/40 text-xs font-bold text-white flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-teal-400" />}
              <span className="text-[10px] uppercase tracking-wider">{copied ? "Copied!" : "Copy Details"}</span>
            </button>

            <button
              type="button"
              onClick={handleNativeShare}
              className="py-3 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-teal-500/40 text-xs font-bold text-white flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4 text-teal-400" />
              <span className="text-[10px] uppercase tracking-wider">Share</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadQr}
              className="py-3 px-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs flex flex-col items-center justify-center gap-1 shadow-lg shadow-teal-500/20 transition-all active:scale-95"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span className="text-[10px] uppercase tracking-wider">Save QR</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
