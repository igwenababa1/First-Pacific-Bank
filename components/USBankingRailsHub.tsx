import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  Zap,
  FileText,
  Send,
  Building2,
  Camera,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  ArrowRight,
  RefreshCw,
  Lock,
  Smartphone,
  CreditCard,
  Search,
  ExternalLink,
  ChevronRight,
  Info,
  Clock,
  Sparkles,
  Sliders,
  DollarSign
} from "lucide-react";
import { Account, Transaction, UserProfile, TransactionStatus } from "../types";
import { useCurrency } from "../contexts/CurrencyContext";

interface USBankingRailsHubProps {
  accounts: Account[];
  userProfile: UserProfile;
  transactions?: Transaction[];
  onOpenSendMoney?: (tab?: "send" | "split" | "deposit") => void;
  onAddTransaction?: (tx: any) => Promise<any>;
}

export const USBankingRailsHub: React.FC<USBankingRailsHubProps> = ({
  accounts,
  userProfile,
  transactions = [],
  onOpenSendMoney,
  onAddTransaction,
}) => {
  const { formatCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState<
    "fednow" | "direct_deposit" | "zelle" | "fdic_sweep" | "check_deposit" | "credit_journey"
  >("fednow");

  const primaryAccount = accounts[0] || {
    id: "acc_primary",
    nickname: "Primary High-Yield Checking",
    accountNumber: "10029384812",
    balance: 148500.0,
    type: "Checking",
  };

  // ----------------------------------------------------
  // Tab 1: FedNow & RTP Real-Time Rails State
  // ----------------------------------------------------
  const [fedNowLatency, setFedNowLatency] = useState(240);
  const [isSimulatingFedNow, setIsSimulatingFedNow] = useState(false);
  const [fedNowLogs, setFedNowLogs] = useState<string[]>([]);
  const [fedNowResult, setFedNowResult] = useState<{
    txId: string;
    clearedAt: string;
    amount: number;
    recipientBank: string;
    fedAuditCode: string;
  } | null>(null);
  const [fedNowAmount, setFedNowAmount] = useState("2500");
  const [fedNowRecipientRouting, setFedNowRecipientRouting] = useState("021000021");
  const [fedNowRecipientAccount, setFedNowRecipientAccount] = useState("99283471029");

  const simulateFedNowTransfer = async () => {
    setIsSimulatingFedNow(true);
    setFedNowResult(null);
    setFedNowLogs(["[ISO 20022] Generating pacs.008.001.08 Credit Transfer instruction..."]);

    await new Promise((r) => setTimeout(r, 600));
    setFedNowLogs((prev) => [
      ...prev,
      `[FedLine Direct] Encrypting payload via TLS 1.3 to Federal Reserve Core Node (Routing: ${fedNowRecipientRouting})...`,
    ]);

    await new Promise((r) => setTimeout(r, 700));
    setFedNowLogs((prev) => [
      ...prev,
      `[RTP Network] Liquidity check passed on First Pacific Settlement Reserve account #FP-FED-NY.`,
    ]);

    await new Promise((r) => setTimeout(r, 800));
    const auditCode = `FED-RTP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 899 + 100)}`;
    setFedNowLogs((prev) => [
      ...prev,
      `[Settlement Confirmed] Instant finality achieved in ${fedNowLatency}ms. FedWire Reference: ${auditCode}`,
    ]);

    const numAmt = parseFloat(fedNowAmount) || 2500;
    setFedNowResult({
      txId: `TX-FED-${Date.now().toString().slice(-6)}`,
      clearedAt: new Date().toLocaleTimeString(),
      amount: numAmt,
      recipientBank: fedNowRecipientRouting === "021000021" ? "First Pacific Bank N.A." : "JPMorgan Chase N.A. (RTP Participant)",
      fedAuditCode: auditCode,
    });
    setIsSimulatingFedNow(false);
  };

  // ----------------------------------------------------
  // Tab 2: Direct Deposit & Early Pay State
  // ----------------------------------------------------
  const [earlyPayEnabled, setEarlyPayEnabled] = useState(true);
  const [splitPercentChecking, setSplitPercentChecking] = useState(80);
  const [selectedPayrollProvider, setSelectedPayrollProvider] = useState<string | null>("ADP");
  const [isCopiedRouting, setIsCopiedRouting] = useState(false);
  const [isCopiedAccount, setIsCopiedAccount] = useState(false);
  const [directDepositSuccessMsg, setDirectDepositSuccessMsg] = useState("");

  const PAYROLL_PROVIDERS = [
    { name: "ADP Workforce", logo: "ADP", status: "Instant Connect" },
    { name: "Workday", logo: "WD", status: "Instant Connect" },
    { name: "Gusto", logo: "GU", status: "Instant Connect" },
    { name: "Paychex", logo: "PX", status: "Instant Connect" },
    { name: "QuickBooks Payroll", logo: "QB", status: "Instant Connect" },
    { name: "Rippling", logo: "RP", status: "Instant Connect" },
  ];

  // ----------------------------------------------------
  // Tab 3: Zelle Express Pay State
  // ----------------------------------------------------
  const [zelleQuery, setZelleQuery] = useState("");
  const [zelleAmount, setZelleAmount] = useState("150");
  const [zelleMemo, setZelleMemo] = useState("Dinner & travel split");
  const [zelleSelectedContact, setZelleSelectedContact] = useState<{
    name: string;
    identifier: string;
    avatar: string;
    enrolled: boolean;
  } | null>(null);
  const [zelleSending, setZelleSending] = useState(false);
  const [zelleSuccess, setZelleSuccess] = useState(false);

  const ZELLE_CONTACTS = [
    { name: "Sarah Jenkins", identifier: "(415) 892-4910", avatar: "SJ", enrolled: true },
    { name: "Michael Chang", identifier: "m.chang@stanford.edu", avatar: "MC", enrolled: true },
    { name: "Elena Rostova", identifier: "(212) 555-0199", avatar: "ER", enrolled: true },
    { name: "David Miller", identifier: "david.miller@techcorp.io", avatar: "DM", enrolled: true },
  ];

  const handleSendZelle = async () => {
    if (!zelleSelectedContact) return;
    setZelleSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    setZelleSending(false);
    setZelleSuccess(true);
    setTimeout(() => {
      setZelleSuccess(false);
      setZelleSelectedContact(null);
      setZelleAmount("");
      setZelleMemo("");
    }, 4000);
  };

  // ----------------------------------------------------
  // Tab 4: FDIC Sweep & Insured Custody State
  // ----------------------------------------------------
  const SWEEP_BANKS = [
    { bank: "First Pacific Bank N.A. (Primary Custody)", balance: 250000, insured: 250000, status: "Active Lead Bank", routing: "021000021" },
    { bank: "JPMorgan Chase Bank, N.A. (IntraFi Node 1)", balance: 248500, insured: 250000, status: "Insured Sweep Enclave", routing: "021000089" },
    { bank: "Bank of America, N.A. (IntraFi Node 2)", balance: 250000, insured: 250000, status: "Insured Sweep Enclave", routing: "051000017" },
    { bank: "The Bank of New York Mellon (ICS Node 3)", balance: 250000, insured: 250000, status: "Insured Sweep Enclave", routing: "011000015" },
    { bank: "Citibank, N.A. (ICS Node 4)", balance: 250000, insured: 250000, status: "Insured Sweep Enclave", routing: "021000089" },
  ];
  const totalSweepInsured = SWEEP_BANKS.reduce((acc, b) => acc + b.insured, 0);

  // ----------------------------------------------------
  // Tab 5: Mobile Check Deposit State
  // ----------------------------------------------------
  const [checkFrontCaptured, setCheckFrontCaptured] = useState(false);
  const [checkBackCaptured, setCheckBackCaptured] = useState(false);
  const [checkAmountInput, setCheckAmountInput] = useState("4850.00");
  const [checkAccountTarget, setCheckAccountTarget] = useState(primaryAccount.id);
  const [isAnalyzingCheck, setIsAnalyzingCheck] = useState(false);
  const [checkDepositSuccess, setCheckDepositSuccess] = useState(false);

  const handleDepositCheck = async () => {
    setIsAnalyzingCheck(true);
    await new Promise((r) => setTimeout(r, 1800));
    setIsAnalyzingCheck(false);
    setCheckDepositSuccess(true);
  };

  // ----------------------------------------------------
  // Tab 6: Credit Journey & FICO Score Simulator State
  // ----------------------------------------------------
  const [baseScore, setBaseScore] = useState(788);
  const [simPayDebt, setSimPayDebt] = useState(0);
  const [simNewCard, setSimNewCard] = useState(false);
  const [simIncreaseLimit, setSimIncreaseLimit] = useState(false);

  const simulatedScore = useMemo(() => {
    let score = baseScore;
    if (simPayDebt > 0) score += Math.min(28, Math.round(simPayDebt / 200));
    if (simNewCard) score -= 5;
    if (simIncreaseLimit) score += 14;
    return Math.min(850, Math.max(300, score));
  }, [baseScore, simPayDebt, simNewCard, simIncreaseLimit]);

  return (
    <div className="w-full bg-white dark:bg-[#0c1222]/95  rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-xl overflow-hidden transition-all duration-300">
      {/* Top Header Bar */}
      <div className="p-4 sm:p-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-r from-slate-50/80 via-white/80 to-slate-50/80 dark:from-slate-900/60 dark:via-[#0c1222] dark:to-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-primary flex items-center justify-center shadow-lg shadow-blue-500/20 text-white shrink-0">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">
                US Banking Systems & Clearing Rails
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold tracking-wider uppercase border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Node 021000021
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-600 dark:text-slate-300 dark:text-slate-300 font-medium mt-0.5">
              Federal Reserve FedNow®, The Clearing House RTP®, FDIC $5M Multi-Bank Sweep & Payroll Automation
            </p>
          </div>
        </div>

        {/* Quick ABA Routing Info Badge */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-300">
          <span className="text-[11px] text-slate-600 dark:text-slate-300 font-bold uppercase">Routing (ABA):</span>
          <span className="font-black text-slate-900 dark:text-white tracking-widest">021000021</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText("021000021");
              setIsCopiedRouting(true);
              setTimeout(() => setIsCopiedRouting(false), 2000);
            }}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            title="Copy ABA Routing Number"
          >
            {isCopiedRouting ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="px-3 sm:px-6 pt-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 overflow-x-auto no-scrollbar">
        <div className="flex space-x-1 sm:space-x-2 min-w-max pb-2.5">
          {[
            { id: "fednow", label: "FedNow® & RTP Rails", icon: Zap, badge: "Instant 24/7" },
            { id: "direct_deposit", label: "Direct Deposit & Early Pay", icon: FileText, badge: "2 Days Early" },
            { id: "zelle", label: "Zelle® Express P2P", icon: Send, badge: "$0 Fee" },
            { id: "fdic_sweep", label: "FDIC $5M Sweep Enclave", icon: ShieldCheck, badge: "Insured" },
            { id: "check_deposit", label: "Mobile Check Deposit", icon: Camera, badge: "OCR MICR" },
            { id: "credit_journey", label: "Credit Score & Journey", icon: TrendingUp, badge: "FICO® 788" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]"
                    : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-600 dark:text-slate-300 dark:text-slate-600 dark:text-slate-300 dark:text-slate-300"}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold uppercase ${
                      isActive
                        ? "bg-white text-white"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-600 dark:text-slate-300 dark:text-slate-300"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content View */}
      <div className="p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          {/* TAB 1: FedNow & RTP Real-Time Rails */}
          {activeTab === "fednow" && (
            <motion.div
              key="fednow"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Live Terminal Status */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-[#080d1a] border border-slate-800 text-white shadow-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <h3 className="text-sm font-black tracking-wide uppercase">
                          Federal Reserve FedNow® Direct Gateway
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400 font-bold">
                        LATENCY: {fedNowLatency}ms
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                      <div className="p-3 bg-white rounded-xl border border-white/10 dark:bg-slate-800">
                        <span className="text-slate-600 dark:text-slate-300 dark:text-slate-300 text-[10px] uppercase block">Settlement Rail</span>
                        <span className="font-bold text-white text-xs">FedNow 24/7/365</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-white/10 dark:bg-slate-800">
                        <span className="text-slate-600 dark:text-slate-300 dark:text-slate-300 text-[10px] uppercase block">Clearing Protocol</span>
                        <span className="font-bold text-white text-xs">ISO 20022 (pacs.008)</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-white/10 col-span-2 sm:col-span-1 dark:bg-slate-800">
                        <span className="text-slate-600 dark:text-slate-300 dark:text-slate-300 text-[10px] uppercase block">Finality Mode</span>
                        <span className="font-bold text-emerald-400 text-xs">Irrevocable Instant</span>
                      </div>
                    </div>

                    {/* Console Telemetry Screen */}
                    <div className="bg-black/70 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1.5 max-h-44 overflow-y-auto">
                      <div className="text-slate-600 dark:text-slate-300 dark:text-slate-300 flex items-center justify-between">
                        <span>// LIVE FEDERAL RESERVE CLEARING TELEMETRY</span>
                        <span className="text-emerald-500">CONNECTED</span>
                      </div>
                      {fedNowLogs.length === 0 ? (
                        <p className="text-slate-600 dark:text-slate-300 dark:text-slate-300 italic">Ready to dispatch instant ISO 20022 RTP clearing transfer...</p>
                      ) : (
                        fedNowLogs.map((log, idx) => (
                          <p key={idx} className="text-cyan-300 leading-tight">
                            {log}
                          </p>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Confirmed Settlement Badge */}
                  {fedNowResult && (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200 flex items-start gap-3.5"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-black text-sm uppercase">Instant Settlement Complete</span>
                          <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">
                            {fedNowResult.clearedAt}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300">
                          Dispatched ${fedNowResult.amount.toLocaleString()} to {fedNowResult.recipientBank} with zero settlement lag.
                        </p>
                        <p className="font-mono text-[10px] text-slate-600 dark:text-slate-300 dark:text-slate-600 dark:text-slate-300 dark:text-slate-300">
                          Federal Reserve Audit Reference: {fedNowResult.fedAuditCode}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Right Column: Instant Transfer Dispatcher Form */}
                <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-500" />
                    Dispatch Real-Time FedNow Transfer
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Transfer Amount ($ USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-300 dark:text-slate-300 font-bold">$</span>
                        <input
                          type="number"
                          value={fedNowAmount}
                          onChange={(e) => setFedNowAmount(e.target.value)}
                          className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="2500.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Recipient ABA Routing Number (9-Digit)
                      </label>
                      <input
                        type="text"
                        maxLength={9}
                        value={fedNowRecipientRouting}
                        onChange={(e) => setFedNowRecipientRouting(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="021000021"
                      />
                      <span className="text-[10px] text-slate-600 dark:text-slate-300 dark:text-slate-600 dark:text-slate-300 dark:text-slate-300 mt-1 block">
                        Verified RTP/FedNow Participant Bank Node
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Recipient Account Number
                      </label>
                      <input
                        type="text"
                        value={fedNowRecipientAccount}
                        onChange={(e) => setFedNowRecipientAccount(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="99283471029"
                      />
                    </div>

                    <button
                      disabled={isSimulatingFedNow}
                      onClick={simulateFedNowTransfer}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                    >
                      {isSimulatingFedNow ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Routing via Federal Reserve...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>Execute Instant FedNow Settlement</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: Direct Deposit & Early Pay */}
          {activeTab === "direct_deposit" && (
            <motion.div
              key="direct_deposit"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Payroll Connectors & Settings */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-400" />
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                          Get Paid Up to 2 Days Early
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {earlyPayEnabled ? "Enabled" : "Paused"}
                        </span>
                        <button
                          onClick={() => setEarlyPayEnabled(!earlyPayEnabled)}
                          className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                            earlyPayEnabled ? "bg-emerald-500" : "bg-slate-400 dark:bg-slate-700"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              earlyPayEnabled ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      First Pacific Bank credits standard ACH direct deposit payroll files the exact millisecond we receive advance notification from the Federal Reserve ACH network, typically 2 business days ahead of traditional bank clearing schedules.
                    </p>
                  </div>

                  {/* 1-Click Payroll Switcher */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Instant Connect Your Employer / Payroll Portal
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {PAYROLL_PROVIDERS.map((provider) => (
                        <button
                          key={provider.name}
                          onClick={() => {
                            setSelectedPayrollProvider(provider.name);
                            setDirectDepositSuccessMsg(`Connected to ${provider.name}. Direct Deposit routing pre-authorized!`);
                            setTimeout(() => setDirectDepositSuccessMsg(""), 4000);
                          }}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                            selectedPayrollProvider === provider.name
                              ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 shadow-sm"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center font-mono">
                              {provider.logo}
                            </span>
                            <span className="text-[9px] font-mono text-emerald-500 font-bold uppercase">
                              {provider.status}
                            </span>
                          </div>
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {provider.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {directDepositSuccessMsg && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>{directDepositSuccessMsg}</span>
                    </div>
                  )}

                  {/* Split Deposit Allocation Slider */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-slate-900 dark:text-white uppercase">Automated Paycheck Splitter</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {splitPercentChecking}% Checking / {100 - splitPercentChecking}% Savings Vault
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={splitPercentChecking}
                      onChange={(e) => setSplitPercentChecking(parseInt(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-600 dark:text-slate-300">
                      <span>Max Savings (10% Checking)</span>
                      <span>100% Checking</span>
                    </div>
                  </div>
                </div>

                {/* Right: Pre-filled Official Direct Deposit Form Preview */}
                <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Pre-Filled Direct Deposit Form
                      </h4>
                      <p className="text-[10px] text-slate-600 dark:text-slate-300 font-mono">Form 1040-DDA Verified</p>
                    </div>
                    <button
                      onClick={() => {
                        alert("Generating pre-filled Direct Deposit authorization PDF for " + userProfile.name);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>

                  <div className="space-y-3 text-xs font-mono">
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-600 dark:text-slate-300 dark:text-slate-300 uppercase block font-bold">Bank Name & Address</span>
                      <span className="font-bold text-slate-900 dark:text-white">First Pacific Bank, N.A.</span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 block">580 California Street, San Francisco, CA 94104</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-600 dark:text-slate-300 dark:text-slate-300 uppercase font-bold">Routing (ABA)</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText("021000021");
                              setIsCopiedRouting(true);
                              setTimeout(() => setIsCopiedRouting(false), 2000);
                            }}
                            className="text-blue-500 hover:text-blue-400 text-[10px] font-bold"
                          >
                            {isCopiedRouting ? "Copied" : "Copy"}
                          </button>
                        </div>
                        <span className="font-black text-slate-900 dark:text-white text-sm">021000021</span>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-600 dark:text-slate-300 dark:text-slate-300 uppercase font-bold">Account #</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(primaryAccount.accountNumber);
                              setIsCopiedAccount(true);
                              setTimeout(() => setIsCopiedAccount(false), 2000);
                            }}
                            className="text-blue-500 hover:text-blue-400 text-[10px] font-bold"
                          >
                            {isCopiedAccount ? "Copied" : "Copy"}
                          </button>
                        </div>
                        <span className="font-black text-slate-900 dark:text-white text-sm">
                          {primaryAccount.accountNumber}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-600 dark:text-slate-300 dark:text-slate-300 uppercase block font-bold">Account Holder Name</span>
                      <span className="font-bold text-slate-900 dark:text-white">{userProfile.name}</span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-600 dark:text-slate-300 dark:text-slate-300 uppercase block font-bold">Account Type</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">Checking (Primary Demand Deposit)</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: Zelle Express P2P */}
          {activeTab === "zelle" && (
            <motion.div
              key="zelle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Quick Zelle Contacts & Search */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#7414CA]/15 via-purple-500/10 to-indigo-500/10 border border-[#7414CA]/30 flex items-center justify-between">
                    <div>
                      <span className="text-xl font-black text-[#7414CA] dark:text-purple-400 tracking-wider">
                        zelle
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                        Instant zero-fee payments directly between US checking accounts
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-[#7414CA] text-white rounded-full text-xs font-bold">
                      Enrolled & Active
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Select Recipient (US Mobile or Email)
                    </label>
                    <div className="space-y-2">
                      {ZELLE_CONTACTS.map((contact) => (
                        <div
                          key={contact.identifier}
                          onClick={() => setZelleSelectedContact(contact)}
                          className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            zelleSelectedContact?.identifier === contact.identifier
                              ? "bg-purple-50 dark:bg-purple-950/40 border-[#7414CA] shadow-sm"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#7414CA] to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                              {contact.avatar}
                            </div>
                            <div>
                              <p className="font-bold text-xs text-slate-900 dark:text-white">{contact.name}</p>
                              <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300">{contact.identifier}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-500 font-bold uppercase flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Transfer Box */}
                <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#7414CA]" />
                    Send with Zelle®
                  </h3>

                  {zelleSelectedContact ? (
                    <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-600 dark:text-slate-300 uppercase block font-bold">Sending to:</span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{zelleSelectedContact.name}</span>
                        <span className="text-slate-600 dark:text-slate-300 font-mono block">{zelleSelectedContact.identifier}</span>
                      </div>
                      <button
                        onClick={() => setZelleSelectedContact(null)}
                        className="text-xs font-bold text-purple-600 hover:text-purple-500"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-600 dark:text-slate-300">
                      Choose an enrolled contact from the list on the left to send funds instantly.
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Amount ($ USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-300 dark:text-slate-300 font-bold">$</span>
                        <input
                          type="number"
                          value={zelleAmount}
                          onChange={(e) => setZelleAmount(e.target.value)}
                          className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                          placeholder="150.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        What's this for? (Memo)
                      </label>
                      <input
                        type="text"
                        value={zelleMemo}
                        onChange={(e) => setZelleMemo(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="Dinner & travel split"
                      />
                    </div>

                    {zelleSuccess && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Successfully sent ${zelleAmount} to {zelleSelectedContact?.name} via Zelle®!</span>
                      </div>
                    )}

                    <button
                      disabled={!zelleSelectedContact || zelleSending || !zelleAmount}
                      onClick={handleSendZelle}
                      className="w-full py-3 bg-[#7414CA] hover:bg-[#6010a8] disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
                    >
                      {zelleSending ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Routing via Early Warning Zelle® Network...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Review & Send ${zelleAmount || "0"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: FDIC $5M Sweep Enclave */}
          {activeTab === "fdic_sweep" && (
            <motion.div
              key="fdic_sweep"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              {/* Top Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-blue-900/40 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      $5,000,000 Total FDIC Aggregate Sweep Coverage
                    </h3>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed">
                    Through First Pacific Bank's IntraFi® Insured Cash Sweep (ICS) network, your balances are programmatically diversified across primary FDIC-insured custodian banks, guaranteeing 100% full FDIC insurance protection up to $5,000,000 while maintaining daily liquidity access.
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center shrink-0">
                  <span className="text-[10px] text-slate-600 dark:text-slate-300 uppercase font-bold block">Current Insured Status</span>
                  <span className="text-base font-black text-emerald-500 font-mono">$5,000,000.00</span>
                </div>
              </div>

              {/* Custody Breakdown Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    IntraFi® Sweep Network Participating Institutions
                  </h4>
                  <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 font-bold">5 Nodes Active</span>
                </div>

                <div className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950 text-xs">
                  {SWEEP_BANKS.map((item, idx) => (
                    <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors dark:bg-slate-900">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-xs">{item.bank}</span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                            FDIC Cert # {29000 + idx * 342}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-600 dark:text-slate-300 font-mono">
                          ABA Routing: {item.routing} • Status: {item.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-6 self-end sm:self-auto font-mono">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-600 dark:text-slate-300 dark:text-slate-300 block uppercase">Allocated Balance</span>
                          <span className="font-black text-slate-900 dark:text-white">
                            ${item.balance.toLocaleString()}.00
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-600 dark:text-slate-300 dark:text-slate-300 block uppercase">FDIC Guarantee</span>
                          <span className="font-black text-emerald-500">
                            ${item.insured.toLocaleString()}.00
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: Mobile Check Deposit */}
          {activeTab === "check_deposit" && (
            <motion.div
              key="check_deposit"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Dual-Side Capture */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Front Capture */}
                    <div
                      onClick={() => setCheckFrontCaptured(!checkFrontCaptured)}
                      className={`p-5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[180px] ${
                        checkFrontCaptured
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-blue-500"
                      }`}
                    >
                      <Camera className={`w-8 h-8 mb-2 ${checkFrontCaptured ? "text-emerald-500" : "text-slate-600 dark:text-slate-300 dark:text-slate-300"}`} />
                      <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                        {checkFrontCaptured ? "Front Image Captured ✓" : "Capture Check Front"}
                      </span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-300 mt-1">
                        {checkFrontCaptured ? "MICR line ⑆021000021⑆ read successfully" : "Click to simulate high-res camera scan"}
                      </span>
                    </div>

                    {/* Back Capture */}
                    <div
                      onClick={() => setCheckBackCaptured(!checkBackCaptured)}
                      className={`p-5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[180px] ${
                        checkBackCaptured
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-blue-500"
                      }`}
                    >
                      <Camera className={`w-8 h-8 mb-2 ${checkBackCaptured ? "text-emerald-500" : "text-slate-600 dark:text-slate-300 dark:text-slate-300"}`} />
                      <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                        {checkBackCaptured ? "Back Endorsement Validated ✓" : "Capture Check Back"}
                      </span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-300 mt-1">
                        {checkBackCaptured ? "Endorsement signature verified" : "Requires 'For Mobile Deposit at First Pacific Bank'"}
                      </span>
                    </div>
                  </div>

                  {/* Funds Availability Schedule Card */}
                  <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold">
                      <Info className="w-4 h-4" />
                      <span>Funds Availability Schedule (Federal Reserve Reg CC)</span>
                    </div>
                    <ul className="list-disc list-inside text-slate-600 dark:text-slate-600 dark:text-slate-300 dark:text-slate-300 space-y-1 text-[11px]">
                      <li>First $500 available instantly upon submission.</li>
                      <li>Remaining amount cleared next business day by 9:00 AM EST.</li>
                      <li>Zero fees for mobile electronic check ingestion.</li>
                    </ul>
                  </div>
                </div>

                {/* Right: Check Deposit Form */}
                <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Deposit Verification Details
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Check Amount ($ USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-300 dark:text-slate-300 font-bold">$</span>
                        <input
                          type="number"
                          value={checkAmountInput}
                          onChange={(e) => setCheckAmountInput(e.target.value)}
                          className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="4850.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Deposit into Account
                      </label>
                      <select
                        value={checkAccountTarget}
                        onChange={(e) => setCheckAccountTarget(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.nickname || acc.type} (****{acc.accountNumber?.slice(-4) || "0000"}) — $
                            {(acc.balance || 0).toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>

                    {checkDepositSuccess && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Check Deposit for ${checkAmountInput} accepted! $500 available immediately.</span>
                      </div>
                    )}

                    <button
                      disabled={isAnalyzingCheck || !checkFrontCaptured || !checkBackCaptured}
                      onClick={handleDepositCheck}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                    >
                      {isAnalyzingCheck ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Analyzing MICR & Endorsement...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          <span>Submit Mobile Check Deposit</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 6: Credit Journey & FICO Score */}
          {activeTab === "credit_journey" && (
            <motion.div
              key="credit_journey"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Score Dial & Factors */}
                <div className="lg:col-span-6 p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-[#080d1a] border border-slate-800 text-white space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest block">
                        Experian & TransUnion Real-Time Sync
                      </span>
                      <h3 className="text-base font-black tracking-tight uppercase">FICO® Score 8</h3>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold uppercase font-mono">
                      Excellent Rating
                    </span>
                  </div>

                  <div className="flex items-center justify-center py-4">
                    <div className="text-center space-y-1">
                      <span className="text-5xl font-black font-mono tracking-tighter text-white">
                        {simulatedScore}
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-300 dark:text-slate-300 block font-mono">Score Range 300 – 850</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 bg-white rounded-xl border border-white/10 dark:bg-slate-800">
                      <span className="text-slate-600 dark:text-slate-300 dark:text-slate-300 text-[10px] uppercase block">Payment History</span>
                      <span className="font-bold text-emerald-400 text-xs">100% On-Time (Exceptional)</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-white/10 dark:bg-slate-800">
                      <span className="text-slate-600 dark:text-slate-300 dark:text-slate-300 text-[10px] uppercase block">Credit Utilization</span>
                      <span className="font-bold text-emerald-400 text-xs">4% ($2,400 / $60,000)</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-white/10 dark:bg-slate-800">
                      <span className="text-slate-600 dark:text-slate-300 dark:text-slate-300 text-[10px] uppercase block">Derogatory Marks</span>
                      <span className="font-bold text-emerald-400 text-xs">0 (Clean Record)</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-white/10 dark:bg-slate-800">
                      <span className="text-slate-600 dark:text-slate-300 dark:text-slate-300 text-[10px] uppercase block">Average Credit Age</span>
                      <span className="font-bold text-white text-xs">7.4 Years</span>
                    </div>
                  </div>
                </div>

                {/* What-If Simulator */}
                <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-blue-500" />
                      Interactive "What If" Credit Simulator
                    </h3>
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                      Projected: {simulatedScore}
                    </span>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Pay Down Credit Card Balances</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">${simPayDebt}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="5000"
                        step="500"
                        value={simPayDebt}
                        onChange={(e) => setSimPayDebt(parseInt(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">Open New Credit Card / Credit Line</span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-300">Simulates new hard inquiry and lowered average age</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={simNewCard}
                        onChange={(e) => setSimNewCard(e.target.checked)}
                        className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">Request $10,000 Credit Limit Increase</span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-300">Lowers overall utilization below 2%</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={simIncreaseLimit}
                        onChange={(e) => setSimIncreaseLimit(e.target.checked)}
                        className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
