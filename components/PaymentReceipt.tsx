import React, { useState, useEffect } from "react";
import { Transaction, Account, TransactionStatus, UserProfile } from "../types";
import { USER_PROFILE, BANKS_BY_COUNTRY, SERVICES_CONFIG } from "./constants";
import { LiveTransactionView } from "./LiveTransactionView";
import { useSystemOptions } from "../hooks/useSystemOptions";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

import {
  FirstPacificLogo,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  SpinnerIcon,
  GlobeAmericasIcon,
  CheckCircleIcon,
  PrinterIcon,
  DocumentCheckIcon,
  MapPinIcon,
  QrCodeIcon,
  BarcodeIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  UserCircleIcon,
  BankIcon,
} from "./Icons";
import { AuthorizationWarningModal } from "./AuthorizationWarningModal";
import { useCurrency } from "../contexts/CurrencyContext";
import { getFlagUrl } from "../utils/flags";

interface PaymentReceiptProps {
  transaction: Transaction;
  sourceAccount: Account;
  onStartOver: () => void;
  onViewActivity: () => void;
  onAuthorizeTransaction: (
    transactionId: string,
    method: "code" | "fee",
  ) => void;
  phone?: string;
  onContactSupport: () => void;
  accounts: Account[];
  userProfile?: UserProfile;
}

export const PaymentReceipt: React.FC<PaymentReceiptProps> = ({
  transaction,
  sourceAccount,
  onStartOver,
  onViewActivity,
  onAuthorizeTransaction,
  phone,
  onContactSupport,
  accounts,
  userProfile,
}) => {
  const { formatCurrency } = useCurrency();
  const systemOptions = useSystemOptions();
  const [liveTx, setLiveTx] = useState<Transaction>(transaction);
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const isManualAdjustment = liveTx.id.startsWith("MANUAL-");
  const documentSealColor = systemOptions?.documentSealColor || "#1e3a8a";

  const finalProfile = userProfile || USER_PROFILE;
  const totalFee = liveTx.fee || 0;
  const hasFee = totalFee > 0;

  // Simulation Logic
  useEffect(() => {
    if (transaction.status !== TransactionStatus.SUBMITTED) {
      setLiveTx(transaction);
      return;
    }

    const timeline = [
      { status: TransactionStatus.SUBMITTED, delay: 500 },
      { status: TransactionStatus.CONVERTING, delay: 2000 },
      { status: TransactionStatus.IN_TRANSIT, delay: 5000 },
      { status: TransactionStatus.FUNDS_ARRIVED, delay: 8000 },
    ];

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    timeline.forEach(({ status, delay }) => {
      const t = setTimeout(() => {
        setLiveTx((prev) => ({
          ...prev,
          status: status,
          statusTimestamps: {
            ...prev.statusTimestamps,
            [status]: new Date(),
          },
        }));
      }, delay);
      timeouts.push(t);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [transaction]);

  const handleDownloadReceipt = () => {
    setIsGeneratingPdf(true);
    setTimeout(() => {
      const receiptElement = document.getElementById(
        `receipt-capture-${liveTx.id}`,
      );
      if (receiptElement) {
        html2canvas(receiptElement, {
          scale: 3,
          backgroundColor: "#ffffff",
          useCORS: true,
        })
          .then((canvas: any) => {
            const imgData = canvas.toDataURL("image/png");
            const pdfWidth = canvas.width / 3;
            const pdfHeight = canvas.height / 3;
            const pdf = new jsPDF({
              orientation: pdfWidth > pdfHeight ? "landscape" : "portrait",
              unit: "px",
              format: [pdfWidth, pdfHeight],
            });
            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`First_Pacific_Receipt_${liveTx.id}.pdf`);
            setIsGeneratingPdf(false);
          })
          .catch((err: any) => {
            console.error("Failed to generate PDF:", err);
            setIsGeneratingPdf(false);
          });
      } else {
        setIsGeneratingPdf(false);
      }
    }, 800);
  };

  return (
    <>
      {showAuthWarning && (
        <AuthorizationWarningModal
          transaction={liveTx}
          onAuthorize={onAuthorizeTransaction}
          onClose={() => setShowAuthWarning(false)}
          onContactSupport={onContactSupport}
          accounts={accounts}
          userProfile={userProfile}
        />
      )}

      {/* Backdrop */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-5xl mx-auto pb-12 animate-fade-in-up">
        {/* Live Status Bar */}
        <div className="w-full mb-8 px-4 max-w-3xl">
          <LiveTransactionView transaction={liveTx} phone={phone} />
        </div>

        {/* --- THE OFFICIAL RECEIPT (Logistics Style) --- */}
        <div
          id={`receipt-capture-${liveTx.id}`}
          className="relative w-full max-w-3xl bg-white shadow-2xl text-[#0F172A] font-sans overflow-hidden rounded-sm dark:bg-slate-800"
        >
          {/* Blue Top Bar */}
          <div className="h-1.5 primary- w-full"></div>

          {/* Header */}
          <div className="p-8 pb-6 border-b border-slate-100 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <FirstPacificLogo className="w-8 h-8 primary-" />
                <h1 className="text-2xl font-black primary- tracking-tighter uppercase">
                  First Pacific Global
                </h1>
              </div>
              <p className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest pl-11">
                International Priority Wire Transfer
              </p>

              <div className="mt-8 pl-1">
                <p className="text-[9px] font-bold text-[#0F172A] dark:text-white uppercase tracking-[0.2em] mb-1">
                  Transaction Reference (TRX)
                </p>
                <p className="text-xl font-mono font-bold text-[#0F172A] tracking-[0.1em]">
                  US-{liveTx.recipient.country.code}-
                  {liveTx.id.toUpperCase().slice(-8)}
                </p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <button
                onClick={handleDownloadReceipt}
                disabled={isGeneratingPdf}
                className="bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white px-4 py-2.5 rounded shadow text-xs font-bold flex items-center gap-2 mb-4 hover:bg-white dark:bg-slate-900 transition-colors disabled:opacity-70"
              >
                {isGeneratingPdf ? (
                  <SpinnerIcon className="w-4 h-4 animate-spin text-emerald-500" />
                ) : (
                  <DocumentCheckIcon className="w-4 h-4 text-emerald-600" />
                )}
                Download PDF Receipt
              </button>
              <div className="p-1 bg-white border border-slate-200 rounded shadow-sm relative dark:bg-slate-800">
                {isManualAdjustment && (
                  <div className="absolute -top-3 -right-3 bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-lg uppercase tracking-wider transform rotate-12 border border-white">
                    Fed. Verified
                  </div>
                )}
                <img
                  src={`https://quickchart.io/qr?text=FPB-TRX-${liveTx.id}&size=150`}
                  alt="QR"
                  className="w-16 h-16 mix-blend-multiply"
                />
              </div>
              <p className="text-[8px] text-[#0F172A] dark:text-white mt-1 uppercase tracking-wider">
                Scan for Status
              </p>
            </div>
          </div>

          {/* Body Split */}
          <div className="flex flex-col md:flex-row relative min-h-[300px]">
            {/* Ultra Premium Bank Medallion Watermark Logo Backplate */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden font-sans opacity-[0.035]">
              <div 
                className="w-[450px] h-[450px] rounded-full border-4 border-double flex flex-col items-center justify-center p-8 transform scale-110"
                style={{ borderColor: isManualAdjustment ? documentSealColor : "#1e3a8a", color: isManualAdjustment ? documentSealColor : "#1e3a8a" }}
              >
                <svg className="w-24 h-24 mb-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A11.952 11.952 0 0112 16.5c-2.998 0-5.74-1.1-7.843-2.918m0 0A8.959 8.959 0 013 12c0-.778.099-1.533.284-2.253" />
                </svg>
                <span className="font-extrabold text-[16px] tracking-[0.3em] uppercase text-center mb-1">
                  FIRST PACIFIC BANK
                </span>
                <span className="font-mono text-[8px] tracking-widest uppercase text-center mb-4">
                  OFFICIAL TRANSACTION RECORD
                </span>
                <div className="w-24 h-[1px] bg-current opacity-40 mb-3" />
                <span className="font-mono text-[7px] tracking-[0.25em] uppercase text-center max-w-[280px]">
                  FEDERAL WIRE ROUTING SETTLEMENT AGENCY
                </span>
                <span className="font-mono text-[6px] tracking-wider text-center mt-2 opacity-60">
                  SECURE MULTI-LEDGER SYSTEM • MEMBER FDIC
                </span>
              </div>
            </div>

            {/* Sender Column */}
            <div className="flex-1 p-8 border-r border-slate-100 relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                <p className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest">
                  FROM (PAYER)
                </p>
              </div>

              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-widest text-[#0F172A] dark:text-white mb-1">
                  Name
                </p>
                <h3 className="text-base font-bold text-[#0F172A]">
                  {finalProfile.name}
                </h3>
              </div>

              <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 mb-6 relative dark:bg-slate-900">
                <p className="text-[9px] uppercase tracking-widest text-[#0F172A] dark:text-white mb-2 absolute -top-2.5 left-3 bg-white px-1 dark:bg-slate-800">
                  Origin Address
                </p>
                <p className="text-sm text-[#0F172A] leading-relaxed">
                  {(finalProfile.address || "New York, NY")
                    .split(",")
                    .slice(0, 2)
                    .join(", ")}
                  <br />
                  {(finalProfile.address || "New York, NY")
                    .split(",")
                    .slice(2)
                    .join(", ")}
                  <br />
                  <span className="flex items-center gap-1.5 mt-1">
                    {(finalProfile.address || "New York, NY").includes(
                      "Australia",
                    )
                      ? "Australia"
                      : "United States"}
                    <img
                      src={getFlagUrl(
                        (finalProfile.address || "New York, NY").includes(
                          "Australia",
                        )
                          ? "AU"
                          : "US",
                      )}
                      alt="Flag"
                      className="w-4 h-3 rounded-sm object-cover"
                    />
                  </span>
                </p>
              </div>

              <div className="mb-6">
                <p className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest mb-1">
                  Contact / Account
                </p>
                <p className="font-mono text-sm text-[#0F172A] flex items-center gap-2 mb-1">
                  <PhoneIcon className="w-3.5 h-3.5 text-[#0F172A] dark:text-white" />
                  {finalProfile.phone}
                </p>
                <p className="font-mono text-sm text-[#0F172A] flex items-center gap-2">
                  <GlobeAmericasIcon className="w-3.5 h-3.5 text-[#0F172A] dark:text-white" />
                  FIRST PACIFIC CHECKING •••••{" "}
                  {sourceAccount.accountNumber.slice(-4)}
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 primary- primary- rounded-full text-[10px] font-bold uppercase tracking-wide border primary-">
                <CheckCircleIcon className="w-3.5 h-3.5" /> Verified Premium
                Payer
              </div>
            </div>

            {/* Receiver Column */}
            <div className="flex-1 p-8 relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full primary-"></div>
                <p className="text-[10px] font-bold primary- uppercase tracking-widest">
                  TO (BENEFICIARY)
                </p>
              </div>

              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-widest text-[#0F172A] dark:text-white mb-1">
                  Name
                </p>
                <h3 className="text-base font-bold text-[#0F172A]">
                  {liveTx.recipient.fullName}
                </h3>
              </div>

              <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 mb-6 relative dark:bg-slate-900">
                <p className="text-[9px] uppercase tracking-widest text-[#0F172A] dark:text-white mb-2 absolute -top-2.5 left-3 bg-white px-1 dark:bg-slate-800">
                  Address
                </p>
                <p className="text-sm text-[#0F172A] leading-relaxed">
                  {liveTx.recipient.streetAddress || "N/A"}
                  <br />
                  {liveTx.recipient.city}, {liveTx.recipient.stateProvince}{" "}
                  {liveTx.recipient.postalCode}
                  <br />
                  <span className="flex items-center gap-1.5 mt-1">
                    {liveTx.recipient.country.name}
                    <img
                      src={getFlagUrl(liveTx.recipient.country.code)}
                      alt={liveTx.recipient.country.code}
                      className="w-4 h-3 rounded-sm object-cover"
                    />
                  </span>
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest mb-1">
                  Contact / Account
                </p>
                <p className="font-mono text-sm text-[#0F172A] flex items-center gap-2">
                  <PhoneIcon className="w-3.5 h-3.5 text-[#0F172A] dark:text-white" />
                  {liveTx.recipient.realDetails?.accountNumber ||
                    liveTx.recipient.accountNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Details Table */}
          <div className="border-t border-slate-100 relative">
            <div className="bg-slate-50 px-8 py-3 border-b border-slate-100 dark:bg-slate-900">
              <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest">
                Payment Details
              </p>
            </div>

            {/* Stamp Overlays */}
            <div className="absolute right-36 top-1.5 transform rotate-[6deg] opacity-[0.85] pointer-events-none z-20 select-none">
              <div className="border-2 border-indigo-600 text-indigo-600 rounded-full w-20 h-20 flex flex-col items-center justify-center uppercase font-black mix-blend-multiply text-center">
                <p className="text-[5px] tracking-widest leading-none mb-0.5 font-bold">
                  FIRST PACIFIC
                </p>
                <p className="text-[8px] font-black leading-tight tracking-tighter">
                  PREMIUM
                </p>
                <p className="text-[8px] font-black leading-tight tracking-tighter">
                  RESERVED
                </p>
                <p className="text-[4px] border-t border-indigo-600 font-bold mt-0.5 pt-0.5 tracking-widest uppercase">
                  AUDITED
                </p>
              </div>
            </div>

            <div className="absolute right-8 top-3 transform rotate-[-10deg] opacity-90 pointer-events-none z-20 select-none">
              <div className="border-[2.5px] border-green-600 text-green-600 rounded px-2.5 py-1.5 text-center uppercase font-black mix-blend-multiply">
                <p className="text-[9px] leading-none mb-0.5 font-black">
                  FUNDS
                </p>
                <p className="text-sm leading-none mb-0.5 tracking-tighter">
                  CLEARED
                </p>
                <p className="text-[5.5px] border-t border-green-600 pt-0.5 mt-0.5 tracking-widest">
                  OFFICIAL SEAL
                </p>
              </div>
            </div>

            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-8 py-3 font-bold text-[#0F172A] dark:text-white text-[10px] uppercase tracking-widest w-1/2">
                    Description
                  </th>
                  <th className="px-4 py-3 font-bold text-[#0F172A] dark:text-white text-[10px] uppercase tracking-widest text-right">
                    Rate
                  </th>
                  <th className="px-4 py-3 font-bold text-[#0F172A] dark:text-white text-[10px] uppercase tracking-widest text-right">
                    Fee
                  </th>
                  <th className="px-8 py-3 font-bold text-[#0F172A] dark:text-white text-[10px] uppercase tracking-widest text-right">
                    Value (USD)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {/* 1. Principal */}
                <tr>
                  <td className="px-8 py-4 font-bold text-[#0F172A] flex items-center gap-2">
                    <BankIcon className="w-4 h-4 text-[#0F172A] dark:text-white" />
                    Principal Transfer Amount
                  </td>
                  <td className="px-4 py-4 text-right text-[#0F172A] font-mono text-xs">
                    Base Sum
                  </td>
                  <td className="px-4 py-4 text-right text-[#0F172A] font-mono text-xs">
                    -
                  </td>
                  <td className="px-8 py-4 text-right font-black text-[#0F172A] font-mono text-sm">
                    {formatCurrency(liveTx.sendAmount)}
                  </td>
                </tr>

                {/* 2. Fedwire Routing Charge */}
                <tr>
                  <td className="px-8 py-3.5 font-bold text-[#0F172A] dark:text-white flex items-center gap-2 text-xs pl-12">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                    Federal Reserve Fedwire Outgoing Wire Fee
                  </td>
                  <td className="px-4 py-3.5 text-right text-[#0F172A] font-mono text-[11px]">
                    Standard Flat
                  </td>
                  <td className="px-4 py-3.5 text-right text-[#0F172A] font-mono text-[11px]">
                    {hasFee ? formatCurrency(parseFloat((totalFee * 0.55).toFixed(2))) : "$25.00"}
                  </td>
                  <td className={`px-8 py-3.5 text-right font-bold font-mono text-xs ${hasFee ? 'text-[#0F172A]' : 'text-emerald-600 font-bold'}`}>
                    {hasFee ? formatCurrency(parseFloat((totalFee * 0.55).toFixed(2))) : "Waived ($0.00)"}
                  </td>
                </tr>

                {/* 3. Correspondent Intermediary Clearing */}
                <tr>
                  <td className="px-8 py-3.5 font-bold text-[#0F172A] dark:text-white flex items-center gap-2 text-xs pl-12">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                    Correspondent Intermediary Clearing Charge
                  </td>
                  <td className="px-4 py-3.5 text-right text-[#0F172A] font-mono text-[11px]">
                    Agent Flat
                  </td>
                  <td className="px-4 py-3.5 text-right text-[#0F172A] font-mono text-[11px]">
                    {hasFee ? formatCurrency(parseFloat((totalFee * 0.30).toFixed(2))) : "$15.00"}
                  </td>
                  <td className={`px-8 py-3.5 text-right font-bold font-mono text-xs ${hasFee ? 'text-[#0F172A]' : 'text-emerald-600 font-bold'}`}>
                    {hasFee ? formatCurrency(parseFloat((totalFee * 0.30).toFixed(2))) : "Waived ($0.00)"}
                  </td>
                </tr>

                {/* 4. Dodd-Frank Compliance check */}
                <tr>
                  <td className="px-8 py-3.5 font-bold text-[#0F172A] dark:text-white flex items-center gap-2 text-xs pl-12">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                    Clearinghouse & Dodd-Frank Surcharge
                  </td>
                  <td className="px-4 py-3.5 text-right text-[#0F172A] font-mono text-[11px]">
                    Regulatory Flat
                  </td>
                  <td className="px-4 py-3.5 text-right text-[#0F172A] font-mono text-[11px]">
                    {hasFee ? formatCurrency(parseFloat((totalFee * 0.15).toFixed(2))) : "$5.00"}
                  </td>
                  <td className={`px-8 py-3.5 text-right font-bold font-mono text-xs ${hasFee ? 'text-[#0F172A]' : 'text-emerald-600 font-bold'}`}>
                    {hasFee ? formatCurrency(parseFloat((totalFee * 0.15).toFixed(2))) : "Waived ($0.00)"}
                  </td>
                </tr>

                {/* 5. FX Details if applicable */}
                {liveTx.exchangeRate !== 1 && (
                  <>
                    <tr>
                      <td className="px-8 py-3.5 font-semibold text-[#0F172A] flex items-center gap-2 text-xs">
                        <ArrowPathIcon className="w-4 h-4 text-emerald-500" />
                        FX Exchange Conversion
                      </td>
                      <td className="px-4 py-3.5 text-right text-emerald-600 font-mono font-bold text-[11px]">
                        {liveTx.exchangeRate.toFixed(4)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-[#0F172A] font-mono text-[11px]">
                        0.35% Spread
                      </td>
                      <td className="px-8 py-3.5 text-right text-[#0F172A] font-mono text-xs font-semibold">
                        Included
                      </td>
                    </tr>
                    <tr>
                      <td className="px-8 py-4 font-black text-[#0F172A] flex items-center gap-2 bg-emerald-50">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Guaranteed Beneficiary Payout
                      </td>
                      <td className="px-4 py-4 text-right text-[#0F172A] font-mono text-xs bg-emerald-50">
                        -
                      </td>
                      <td className="px-4 py-4 text-right text-[#0F172A] font-mono text-xs bg-emerald-50">
                        -
                      </td>
                      <td className="px-8 py-4 text-right font-black text-emerald-600 font-mono text-sm bg-emerald-50">
                        {formatCurrency(liveTx.receiveAmount, liveTx.receiveCurrency)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Summary */}
          <div className="flex flex-col md:flex-row border-t border-slate-100 bg-slate-50 dark:bg-slate-900">
            <div className="flex-1 p-8">
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <p className="text-[9px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest mb-1">
                    Service Type
                  </p>
                  <div className="flex items-center gap-1.5 font-bold text-[#0F172A] text-xs uppercase">
                    <GlobeAmericasIcon className="w-3.5 h-3.5 primary-" />
                    {liveTx.transferMethod === "crypto"
                      ? "Blockchain"
                      : "Priority Wire"}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest mb-1">
                    Total Debited
                  </p>
                  <p className="font-bold text-[#0F172A] text-sm">
                    {formatCurrency(liveTx.sendAmount + liveTx.fee)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-[#0F172A] dark:text-white uppercase tracking-widest mb-1">
                    Value Date
                  </p>
                  <p className="font-bold text-[#0F172A] text-sm">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Dodd-Frank Act Section 1073 Federal Disclosures */}
          <div className="bg-slate-50 p-6 border-t border-slate-150 text-[10px] text-[#0F172A] leading-relaxed font-mono text-left dark:bg-slate-900">
            <p className="font-bold text-[11px] text-[#0F172A] uppercase tracking-wider mb-2">
              Dodd-Frank Section 1073 Federal Disclosures & Remitter Rights:
            </p>
            <p>
              Under Federal Regulation E, you are entitled to: (1) A full statement of fees and exchange rates before payment. (2) A written receipt upon payment containing the precise date funds will be available. (3) The right to cancel this wire transfer within 30 minutes of receipt issuance without penalty, provided the funds have not yet been cleared or deposited by the beneficiary bank.
            </p>
            <p className="mt-2 text-[9px] text-[#0F172A]">
              For inquiries, feedback, or to exercise cancellation rights, contact the Federal Reserve Wire Clearing Support Center or our Premium Client Concierge. Reference Clearing Routing Number (RTN): 021000021.
            </p>
          </div>

          {/* Barcode Footer */}
          <div className="bg-white p-8 pt-4 text-center border-t border-slate-100 dark:bg-slate-800">
            <div className="flex justify-center mb-2 opacity-80">
              <BarcodeIcon className="h-12 w-64 text-[#0F172A]" />
            </div>
            <p className="text-[10px] font-mono text-[#0F172A] tracking-[0.2em] mb-6">
              {liveTx.id}
            </p>
            <p className="text-[8px] text-[#0F172A] dark:text-white max-w-xl mx-auto leading-relaxed">
              This document serves as proof of payment and settlement
              declaration. Subject to the standard terms and conditions of First
              Pacific Bank. Liability is limited to the declared value of the
              transaction. Generated on {new Date().toLocaleString()} • Origin:
              NYC • Destination: {liveTx.recipient.country.code}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 flex flex-wrap gap-4 w-full max-w-2xl justify-center mt-4">
          <button
            onClick={onViewActivity}
            className="px-8 py-3 bg-white hover:bg-white text-[#0F172A] dark:text-white font-bold rounded-xl transition-all border border-slate-200 dark:border-white/10 dark:bg-slate-800"
          >
            View in Ledger
          </button>
          <button
            onClick={onStartOver}
            className="px-8 py-3 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all"
          >
            New Transfer
          </button>
        </div>
      </div>

      <style>{`
                .mask-grunge {
                    mask-image: url("https://www.transparenttextures.com/patterns/grunge-wall.png");
                    -webkit-mask-image: url("https://www.transparenttextures.com/patterns/grunge-wall.png");
                }
            `}</style>
    </>
  );
};
